import { useState, useEffect, useRef, useCallback } from 'react';
import { logPomodoro } from '../lib/supabase';

export default function PomodoroTimer({ currentDate, currentSystem, onPomodoroComplete }) {
  const [workMinutes, setWorkMinutes] = useState(50);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [secondsLeft, setSecondsLeft] = useState(50 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionsToday, setSessionsToday] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const intervalRef = useRef(null);

  const totalSeconds = isBreak ? breakMinutes * 60 : workMinutes * 60;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  const playChime = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.15 + 0.05);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.15 + 0.4);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.5);
      });
    } catch (e) {}
  }, []);

  const handleWorkComplete = useCallback(async () => {
    playChime();
    setSessionsToday(prev => prev + 1);
    await logPomodoro(currentDate, workMinutes, currentSystem);
    if (onPomodoroComplete) onPomodoroComplete();
    setIsBreak(true);
    setSecondsLeft(breakMinutes * 60);
    setIsRunning(false);
  }, [currentDate, workMinutes, breakMinutes, currentSystem, playChime, onPomodoroComplete]);

  const handleBreakComplete = useCallback(() => {
    playChime();
    setIsBreak(false);
    setSecondsLeft(workMinutes * 60);
    setIsRunning(false);
  }, [workMinutes, playChime]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            if (isBreak) handleBreakComplete();
            else handleWorkComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, isBreak, handleWorkComplete, handleBreakComplete]);

  const toggle = () => setIsRunning(r => !r);
  const reset = () => { clearInterval(intervalRef.current); setIsRunning(false); setIsBreak(false); setSecondsLeft(workMinutes * 60); };
  const adjustWork = (delta) => { const v = Math.max(5, Math.min(120, workMinutes + delta)); setWorkMinutes(v); if (!isRunning && !isBreak) setSecondsLeft(v * 60); };
  const adjustBreak = (delta) => { const v = Math.max(1, Math.min(30, breakMinutes + delta)); setBreakMinutes(v); if (!isRunning && isBreak) setSecondsLeft(v * 60); };

  const color = isBreak ? '#4A7A5A' : '#C4703A';
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference * (1 - progress / 100);

  return (
    <div style={{ background: '#FDFAF6', border: `1px solid ${color}30`, borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color, fontFamily: 'monospace' }}>
        {isBreak ? '— break —' : '— focus —'}
      </div>
      <div style={{ position: 'relative', width: 128, height: 128 }}>
        <svg viewBox="0 0 120 120" style={{ width: 128, height: 128, transform: 'rotate(-90deg)' }}>
          <circle cx="60" cy="60" r="54" fill="none" stroke="#E8E0D5" strokeWidth="6" />
          <circle cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '28px', fontWeight: '400', fontFamily: 'monospace', color: '#3D2B1F', letterSpacing: '-0.02em' }}>
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </span>
          {sessionsToday > 0 && <span style={{ fontSize: '10px', color: '#8B6B4A', marginTop: 2 }}>{sessionsToday} today</span>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button onClick={reset} style={{ background: '#E8E0D5', color: '#3D2B1F', border: 'none', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', cursor: 'pointer' }}>↺</button>
        <button onClick={toggle} style={{ background: color, color: '#FFF', border: 'none', borderRadius: '8px', padding: '8px 24px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' }}>
          {isRunning ? 'Pause' : isBreak ? 'Start break' : secondsLeft < workMinutes * 60 ? 'Resume' : 'Start'}
        </button>
        <button onClick={() => setShowSettings(s => !s)} style={{ background: '#E8E0D5', color: '#8B6B4A', border: 'none', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', cursor: 'pointer' }}>⚙</button>
      </div>
      {showSettings && (
        <div style={{ background: '#F5EFE8', borderRadius: '10px', padding: '12px 16px', width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[['Work', workMinutes, adjustWork, '#C4703A'], ['Break', breakMinutes, adjustBreak, '#4A7A5A']].map(([label, value, adjust, c]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: '#8B6B4A', fontWeight: '500' }}>{label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {[-5, -1].map(d => <button key={d} onClick={() => adjust(d)} style={{ background: '#E8E0D5', color: '#3D2B1F', border: 'none', borderRadius: '6px', padding: '3px 7px', fontSize: '11px', cursor: 'pointer', fontFamily: 'monospace' }}>{d}</button>)}
                <span style={{ fontSize: '13px', fontWeight: '500', color: c, minWidth: '36px', textAlign: 'center', fontFamily: 'monospace' }}>{value}m</span>
                {[1, 5].map(d => <button key={d} onClick={() => adjust(d)} style={{ background: '#E8E0D5', color: '#3D2B1F', border: 'none', borderRadius: '6px', padding: '3px 7px', fontSize: '11px', cursor: 'pointer', fontFamily: 'monospace' }}>+{d}</button>)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
