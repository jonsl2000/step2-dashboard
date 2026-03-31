import { useState, useEffect, useCallback } from 'react';
import { STUDY_PLAN } from './data/studyPlan';
import { getQuoteForDate } from './data/quotes';
import { getDailyLog, upsertDailyLog, getTaskCompletions, toggleTaskCompletion, delayTask, getPomodorosForDate, getAllPomodoros, getAllDailyLogs } from './lib/supabase';
import PomodoroTimer from './components/PomodoroTimer';
import NBMETracker from './components/NBMETracker';
import StaghornFern from './components/StaghornFern';

const d0=new Date(),TODAY=d0.getFullYear()+'-'+String(d0.getMonth()+1).padStart(2,'0')+'-'+String(d0.getDate()).padStart(2,'0');

const PHASE_STYLES = {
  1: { bg: '#F5F0E8', accent: '#8B6B4A', dot: '#C4A882', label: 'Launch' },
  2: { bg: '#EBF5EE', accent: '#3D7A4A', dot: '#82C4A0', label: 'Sierra Leone' },
  3: { bg: '#FBF0E8', accent: '#C4703A', dot: '#E8A878', label: 'Deep Sprint' },
  4: { bg: '#F0EBF5', accent: '#7A4A8B', dot: '#C4A0D8', label: 'Final Stretch' },
};

const QUICK_LINKS = [
  { name: 'UWorld', url: 'https://uworld.com', icon: '⚕' },
  { name: 'Sketchy', url: 'https://sketchy.com', icon: '✏' },
  { name: 'Amboss', url: 'https://amboss.com', icon: '◈' },
  { name: 'NBME', url: 'https://nbme.org', icon: '📋' },
  { name: 'Mehlman', url: 'https://drive.google.com', icon: '📄' },
];

function getDayData(date) { return STUDY_PLAN.find(d => d.date === date); }
function getExamDaysToGo() {
  const exam = new Date('2026-06-12');
  const now = new Date(); now.setHours(0,0,0,0);
  return Math.max(0, Math.ceil((exam - now) / 86400000));
}

export default function App() {
  const [view, setView] = useState('today');
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(TODAY); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; });
  const [dayLog, setDayLog] = useState(null);
  const [taskStates, setTaskStates] = useState({});
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [totalPomodoros, setTotalPomodoros] = useState(0);
  const [hoursInput, setHoursInput] = useState('');
  const [ankiInput, setAnkiInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [allLogs, setAllLogs] = useState([]);
  const [saving, setSaving] = useState(false);

  const dayData = getDayData(selectedDate);
  const phase = dayData ? PHASE_STYLES[dayData.phase] : PHASE_STYLES[1];
  const quote = getQuoteForDate(selectedDate);
  const daysToGo = getExamDaysToGo();

  useEffect(() => {
    if (!selectedDate) return;
    Promise.all([getDailyLog(selectedDate), getTaskCompletions(selectedDate), getPomodorosForDate(selectedDate)]).then(([log, tasks, pomodoros]) => {
      setDayLog(log);
      setHoursInput(log?.hours_studied?.toString() || '');
      setAnkiInput(log?.anki_cards?.toString() || '');
      setNoteInput(log?.notes || '');
      const taskMap = {};
      tasks.forEach(t => { taskMap[t.task_index] = t; });
      setTaskStates(taskMap);
      setPomodoroCount(pomodoros.length);
    });
  }, [selectedDate]);

  useEffect(() => {
    Promise.all([getAllDailyLogs(), getAllPomodoros()]).then(([logs, pomodoros]) => {
      setAllLogs(logs);
      setTotalPomodoros(pomodoros.length);
    });
  }, []);

  const handleTaskToggle = async (index, completed) => {
    const result = await toggleTaskCompletion(selectedDate, index, completed);
    if (result) setTaskStates(prev => ({ ...prev, [index]: result }));
  };

  const handleDelayTask = async (index) => {
    const currentIdx = STUDY_PLAN.findIndex(d => d.date === selectedDate);
    const nextDay = STUDY_PLAN[currentIdx + 1];
    if (!nextDay) return;
    const result = await delayTask(selectedDate, index, nextDay.date);
    if (result) setTaskStates(prev => ({ ...prev, [index]: result }));
  };

  const handleSaveLog = async () => {
    setSaving(true);
    await upsertDailyLog(selectedDate, { hours_studied: parseFloat(hoursInput)||0, anki_cards: parseInt(ankiInput)||0, notes: noteInput });
    setSaving(false);
  };

  const handlePomodoroComplete = useCallback(() => {
    setPomodoroCount(c => c + 1);
    setTotalPomodoros(c => c + 1);
  }, []);

  const completedTasks = Object.values(taskStates).filter(t => t.completed).length;
  const totalTasks = dayData?.tasks?.length || 0;
  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalHoursLogged = allLogs.reduce((sum, l) => sum + (l.hours_studied||0), 0);
  const totalAnkiLogged = allLogs.reduce((sum, l) => sum + (l.anki_cards||0), 0);
  const studyDays = allLogs.filter(l => l.hours_studied > 0).length;

  const calYear = parseInt(calMonth.split('-')[0]);
  const calMonthNum = parseInt(calMonth.split('-')[1]) - 1;
  const firstDay = new Date(calYear, calMonthNum, 1).getDay();
  const daysInMonth = new Date(calYear, calMonthNum + 1, 0).getDate();

  return (
    <div style={{ minHeight: '100vh', background: '#F7F2EB', fontFamily: "'Spectral', Georgia, serif", color: '#3D2B1F' }}>
      <header style={{ background: '#FDFAF6', borderBottom: '1px solid #E8DDD0', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <span style={{ fontSize: '17px', fontWeight: '400', letterSpacing: '-0.01em' }}>Step 2</span>
          <span style={{ fontSize: '11px', color: '#8B6B4A', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{daysToGo} days</span>
        </div>
        <nav style={{ display: 'flex', gap: '2px' }}>
          {[['today','Today'],['calendar','Calendar'],['nbme','Scores'],['stats','Progress']].map(([id, label]) => (
            <button key={id} onClick={() => setView(id)} style={{ background: view===id ? '#3D2B1F' : 'transparent', color: view===id ? '#F7F2EB' : '#8B6B4A', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer', fontFamily: 'monospace', transition: 'all 0.15s' }}>{label}</button>
          ))}
        </nav>
        <div style={{ display: 'flex', gap: '6px' }}>
          {QUICK_LINKS.map(link => (
            <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" title={link.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E8DDD0', fontSize: '14px', textDecoration: 'none', background: '#FDFAF6', color: '#3D2B1F' }}>{link.icon}</a>
          ))}
        </div>
      </header>

      {view === 'today' && (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: phase.bg, borderRadius: '16px', padding: '20px 24px', border: `1px solid ${phase.dot}50` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '12px', fontFamily: 'monospace', color: phase.accent, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
                    {new Date(selectedDate+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: '400', letterSpacing: '-0.01em', lineHeight: 1.2 }}>{dayData?.label || 'Study day'}</div>
                  {dayData && (
                    <div style={{ marginTop: '6px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {[
                        [`Phase ${dayData.phase}: ${phase.label}`, phase.accent, phase.dot+'30'],
                        [`${dayData.hrs_target}h target`, '#8B6B4A', '#E8DDD0'],
                        ...(dayData.is_lce ? [['LCE day', '#3D7A4A', '#82C4A030']] : []),
                        ...(dayData.special==='exam' ? [['Exam day', '#C4703A', '#E8A87830']] : []),
                      ].map(([text, color, bg]) => (
                        <span key={text} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: bg, color, fontFamily: 'monospace', fontWeight: '500' }}>{text}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <ProgressRing pct={completionPct} color={phase.accent} size={60} />
                  <div style={{ fontSize: '10px', color: '#8B6B4A', marginTop: '4px', fontFamily: 'monospace' }}>{completedTasks}/{totalTasks} tasks</div>
                </div>
              </div>
            </div>

            <div style={{ borderLeft: '3px solid #C4703A', paddingLeft: '16px', background: '#FDFAF6', borderRadius: '0 10px 10px 0', padding: '14px 14px 14px 18px', border: '1px solid #E8DDD0', borderLeftWidth: '3px', borderLeftColor: '#C4703A', borderLeftStyle: 'solid' }}>
              <p style={{ fontSize: '14px', fontStyle: 'italic', color: '#5A3D2B', lineHeight: 1.7, margin: 0 }}>"{quote.text}"</p>
              <p style={{ fontSize: '11px', color: '#8B6B4A', marginTop: '8px', marginBottom: 0, fontFamily: 'monospace' }}>— {quote.source}</p>
            </div>

            {dayData?.tasks && (
              <div style={{ background: '#FDFAF6', borderRadius: '14px', border: '1px solid #E8DDD0', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid #F0E8DE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8B6B4A', fontFamily: 'monospace' }}>Today's tasks</span>
                  <span style={{ fontSize: '11px', color: '#B0A090' }}>Day {dayData.day} of 73</span>
                </div>
                {dayData.tasks.map((task, i) => {
                  const state = taskStates[i];
                  const isCompleted = state?.completed;
                  const isDelayed = state?.delayed_to;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 18px', borderBottom: i < dayData.tasks.length-1 ? '1px solid #F5EFE8' : 'none', background: isCompleted ? '#F5FBF5' : isDelayed ? '#FBF5F0' : 'transparent' }}>
                      <button onClick={() => handleTaskToggle(i, !isCompleted)} style={{ width: '20px', height: '20px', borderRadius: '6px', border: `2px solid ${isCompleted ? '#4A7A5A' : '#C4B8A8'}`, background: isCompleted ? '#4A7A5A' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                        {isCompleted && <span style={{ color: '#FFF', fontSize: '11px', fontWeight: '700' }}>✓</span>}
                      </button>
                      <span style={{ fontSize: '14px', color: isCompleted ? '#8B9B8B' : isDelayed ? '#B0A090' : '#3D2B1F', textDecoration: isCompleted ? 'line-through' : 'none', flex: 1, lineHeight: 1.5 }}>
                        {task}{isDelayed && <span style={{ fontSize: '11px', color: '#C4703A', marginLeft: '8px' }}>→ delayed to {state.delayed_to}</span>}
                      </span>
                      {!isCompleted && !isDelayed && (
                        <button onClick={() => handleDelayTask(i)} style={{ background: 'none', border: '1px solid #E8DDD0', borderRadius: '6px', padding: '3px 8px', fontSize: '10px', color: '#B0A090', cursor: 'pointer', fontFamily: 'monospace' }}>→tmrw</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ background: '#FDFAF6', borderRadius: '14px', border: '1px solid #E8DDD0', padding: '16px 18px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8B6B4A', fontFamily: 'monospace', marginBottom: '12px' }}>Log today</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                {[['Hours studied','number',hoursInput,setHoursInput,'e.g. 5.5'],['Anki cards','number',ankiInput,setAnkiInput,'e.g. 50']].map(([label,type,value,setter,placeholder]) => (
                  <div key={label}>
                    <label style={{ fontSize: '10px', color: '#8B6B4A', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '5px', fontFamily: 'monospace' }}>{label}</label>
                    <input type={type} value={value} onChange={e => setter(e.target.value)} placeholder={placeholder} style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E8DDD0', fontSize: '13px', background: '#FDFAF6', fontFamily: 'monospace', color: '#3D2B1F', outline: 'none' }} />
                  </div>
                ))}
              </div>
              <textarea value={noteInput} onChange={e => setNoteInput(e.target.value)} placeholder="What clicked today? What needs more work?" rows={2} style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E8DDD0', fontSize: '13px', fontFamily: "'Spectral', Georgia, serif", color: '#3D2B1F', background: '#FDFAF6', resize: 'vertical', outline: 'none', marginBottom: '10px', boxSizing: 'border-box' }} />
              <button onClick={handleSaveLog} disabled={saving} style={{ background: '#3D2B1F', color: '#F7F2EB', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', cursor: 'pointer', fontFamily: 'monospace', opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving...' : 'Save log'}</button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#FDFAF6', borderRadius: '16px', border: '1px solid #E8DDD0', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#8B6B4A', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Koidu Government Hospital</div>
              <div style={{ width: '140px', height: '140px' }}><StaghornFern pomodoroCount={totalPomodoros} /></div>
              <div style={{ fontSize: '11px', color: '#B0A090', textAlign: 'center', lineHeight: 1.5 }}>
                {totalPomodoros === 0 ? 'Complete a session to grow your fern' : totalPomodoros < 3 ? 'A seedling takes root' : totalPomodoros < 7 ? 'The fronds are opening' : totalPomodoros < 15 ? 'Growing steadily' : totalPomodoros < 26 ? 'A full, healthy fern' : 'The staghorn thrives'}
              </div>
            </div>

            <PomodoroTimer currentDate={selectedDate} currentSystem={dayData?.system || ''} onPomodoroComplete={handlePomodoroComplete} />

            <div style={{ background: '#FDFAF6', borderRadius: '14px', border: '1px solid #E8DDD0', padding: '14px 16px' }}>
              <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#8B6B4A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>Running totals</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[['Hours', totalHoursLogged.toFixed(1)],['Anki', totalAnkiLogged.toLocaleString()],['Pomodoros', totalPomodoros],['Study days', studyDays]].map(([label, value]) => (
                  <div key={label} style={{ background: '#F5EFE8', borderRadius: '8px', padding: '8px 10px' }}>
                    <div style={{ fontSize: '9px', color: '#8B6B4A', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                    <div style={{ fontSize: '18px', fontWeight: '400', fontFamily: 'monospace', color: '#3D2B1F' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: '#FDFAF6', borderRadius: '14px', border: '1px solid #E8DDD0', padding: '12px 16px' }}>
              <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#8B6B4A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>Jump to</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button onClick={() => setSelectedDate(TODAY)} style={{ background: selectedDate===TODAY ? '#3D2B1F' : '#F5EFE8', color: selectedDate===TODAY ? '#F7F2EB' : '#8B6B4A', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer', fontFamily: 'monospace' }}>Today</button>
                {STUDY_PLAN.filter(d => d.special==='exam').slice(0,4).map(d => (
                  <button key={d.date} onClick={() => setSelectedDate(d.date)} style={{ background: selectedDate===d.date ? '#3D2B1F' : '#F5EFE8', color: selectedDate===d.date ? '#F7F2EB' : '#8B6B4A', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer', fontFamily: 'monospace' }}>{d.label.split('—')[0].trim().replace('NBME ','N')}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'calendar' && (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <button onClick={() => { const d = new Date(calYear, calMonthNum-1, 1); setCalMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`); }} style={{ background: '#F5EFE8', border: '1px solid #E8DDD0', borderRadius: '8px', padding: '8px 16px', fontSize: '16px', cursor: 'pointer', color: '#3D2B1F' }}>←</button>
            <div style={{ fontSize: '18px', fontWeight: '400' }}>{new Date(calYear, calMonthNum, 1).toLocaleDateString('en-US',{month:'long',year:'numeric'})}</div>
            <button onClick={() => { const d = new Date(calYear, calMonthNum+1, 1); setCalMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`); }} style={{ background: '#F5EFE8', border: '1px solid #E8DDD0', borderRadius: '8px', padding: '8px 16px', fontSize: '16px', cursor: 'pointer', color: '#3D2B1F' }}>→</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '3px', marginBottom: '3px' }}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} style={{ fontSize: '11px', color: '#B0A090', textAlign: 'center', padding: '4px 0', fontFamily: 'monospace' }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '3px' }}>
            {Array.from({length: firstDay}).map((_,i) => <div key={`e${i}`} />)}
            {Array.from({length: daysInMonth}).map((_,i) => {
              const day = i+1;
              const dateStr = `${calYear}-${String(calMonthNum+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const d = getDayData(dateStr);
              const ps = d ? PHASE_STYLES[d.phase] : null;
              const isToday = dateStr === TODAY;
              const isSelected = dateStr === selectedDate;
              const isExam = d?.special==='exam' || d?.special==='exam_opt';
              return (
                <div key={day} onClick={() => { if(d){setSelectedDate(dateStr); setView('today');} }} style={{ minHeight: '70px', borderRadius: '10px', padding: '6px 7px', cursor: d ? 'pointer' : 'default', background: isSelected ? '#3D2B1F' : ps ? ps.bg : '#F7F2EB', border: isToday ? '2px solid #C4703A' : isExam ? `2px solid ${ps?.accent}` : '1px solid transparent', opacity: d ? 1 : 0.3 }}>
                  <div style={{ fontSize: '11px', fontWeight: isToday ? '700' : '400', color: isSelected ? '#F7F2EB' : '#3D2B1F', fontFamily: 'monospace', marginBottom: '3px' }}>{day}</div>
                  {d && <>
                    <div style={{ fontSize: '10px', color: isSelected ? '#C4A882' : ps.accent, lineHeight: 1.3, marginBottom: '3px' }}>{d.system?.substring(0,12)}</div>
                    <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                      {isExam && <span style={{ fontSize: '8px', background: '#C4703A', color: '#FFF', borderRadius: '4px', padding: '1px 4px', fontFamily: 'monospace' }}>EXAM</span>}
                      {d.is_lce && <span style={{ fontSize: '8px', background: '#3D7A4A', color: '#FFF', borderRadius: '4px', padding: '1px 4px' }}>LCE</span>}
                    </div>
                  </>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'nbme' && (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '400', marginBottom: '20px', letterSpacing: '-0.01em' }}>Score tracker</h2>
          <NBMETracker />
        </div>
      )}

      {view === 'stats' && (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '400', letterSpacing: '-0.01em' }}>Progress</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
            {[['Hours logged', totalHoursLogged.toFixed(1), 'of ~362 projected'],['Anki cards', totalAnkiLogged.toLocaleString(), 'total reviewed'],['Pomodoros', totalPomodoros, '50-min sessions'],['Days to exam', daysToGo, 'Jun 12, 2026']].map(([label,value,sub]) => (
              <div key={label} style={{ background: '#FDFAF6', borderRadius: '12px', padding: '14px 16px', border: '1px solid #E8DDD0' }}>
                <div style={{ fontSize: '11px', color: '#8B6B4A', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '24px', fontWeight: '400', letterSpacing: '-0.02em', fontFamily: 'monospace' }}>{value}</div>
                <div style={{ fontSize: '11px', color: '#B0A090', marginTop: '2px' }}>{sub}</div>
              </div>
            ))}
          </div>
          <div style={{ background: '#FDFAF6', borderRadius: '14px', border: '1px solid #E8DDD0', padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#8B6B4A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Hours toward 362</span>
              <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#3D2B1F' }}>{((totalHoursLogged/362)*100).toFixed(1)}%</span>
            </div>
            <div style={{ height: '8px', background: '#E8DDD0', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min((totalHoursLogged/362)*100,100)}%`, background: '#C4703A', borderRadius: '4px', transition: 'width 0.5s ease' }} />
            </div>
          </div>
          {allLogs.length > 0 && (
            <div style={{ background: '#FDFAF6', borderRadius: '14px', border: '1px solid #E8DDD0', padding: '16px 20px' }}>
              <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#8B6B4A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Daily hours</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '80px' }}>
                {allLogs.slice(-30).map(log => {
                  const h = log.hours_studied || 0;
                  const pct = Math.min((h/10)*100,100);
                  const d = getDayData(log.date);
                  const ps = d ? PHASE_STYLES[d.phase] : PHASE_STYLES[1];
                  return <div key={log.date} title={`${log.date}: ${h}h`} style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'flex-end', minWidth:'6px' }}><div style={{ height:`${pct}%`, background:ps.accent, borderRadius:'2px 2px 0 0', opacity:0.8, minHeight: h>0?'3px':'0' }}/></div>;
                })}
              </div>
            </div>
          )}
          <div style={{ background: '#FDFAF6', borderRadius: '14px', border: '1px solid #E8DDD0', padding: '20px', display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ width: '100px', height: '100px', flexShrink: 0 }}><StaghornFern pomodoroCount={totalPomodoros} /></div>
            <div>
              <div style={{ fontSize: '14px', marginBottom: '6px', fontStyle: 'italic' }}>The staghorn fern at Koidu Government Hospital</div>
              <div style={{ fontSize: '12px', color: '#8B6B4A', lineHeight: 1.6 }}>
                {totalPomodoros} focus sessions · {totalPomodoros * 50} minutes of deep work · {totalPomodoros >= 26 ? 'The fern is fully grown.' : `${26-totalPomodoros} sessions until full growth.`}
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Mono:wght@300;400;500&display=swap'); *{box-sizing:border-box;} button:hover{opacity:0.85;} a:hover{opacity:0.8;}`}</style>
    </div>
  );
}

function ProgressRing({ pct, color, size=60 }) {
  const r = size * 0.4;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct/100);
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width:size, height:size, transform:'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E8DDD0" strokeWidth="4"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} style={{ transition:'stroke-dashoffset 0.5s ease' }}/>
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central" style={{ transform:`rotate(90deg)`, transformOrigin:`${size/2}px ${size/2}px` }} fontSize={size*0.22} fontWeight="500" fill={color} fontFamily="monospace">{pct}%</text>
    </svg>
  );
}
