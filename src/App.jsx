import { useState, useEffect, useRef, useCallback } from 'react';
import { STUDY_PLAN } from './data/studyPlan';
import { getQuoteForDate } from './data/quotes';
import { getDailyLog, upsertDailyLog, getTaskCompletions, toggleTaskCompletion, delayTask, getPomodorosForDate, getAllPomodoros, getAllDailyLogs, getNBMEScores, addNBMEScore, getDailyMood, upsertDailyMood } from './lib/supabase';
import StaghornFern from './components/StaghornFern';
import PomodoroTimer from './components/PomodoroTimer';
import WeakTopics from './components/WeakTopics';


import UWorldPerformance from './components/UWorldPerformance';
import UWorldAggregate from './components/UWorldAggregate.jsx';
import AmbossTracker from './components/AmbossTracker.jsx';
import ScorePredictor from './components/ScorePredictor';
import StudyHeatmap from './components/StudyHeatmap';
import EndOfDayReflection from './components/EndOfDayReflection';

function localDateStr(d = new Date()) {
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
const TODAY = localDateStr();
function getDayData(date) { return STUDY_PLAN.find(d => d.date === date); }
function daysToExam() {
  const exam = new Date('2026-06-12'), now = new Date();
  now.setHours(0,0,0,0);
  return Math.max(0, Math.ceil((exam - now) / 86400000));
}
function offsetDate(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return localDateStr(d);
}
function fmtDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });
}
function fmtShort(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric' });
}
function exportCSV(logs) {
  const h = 'Date,Hours,Anki,Notes\n';
  const r = logs.map(l => `${l.date},${l.hours_studied||0},${l.anki_cards||0},"${(l.notes||'').replace(/"/g,'""')}"`).join('\n');
  const b = new Blob([h+r], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b);
  a.download = 'step2_log.csv';
  a.click();
}

const PH = {
  1: { bg:'#FFF7F0', accent:'#F97316', tag:'#FFF0E6', tagText:'#C2410C', name:'Launch' },
  2: { bg:'#F0FFF4', accent:'#10B981', tag:'#E6FFF4', tagText:'#065F46', name:'Sierra Leone' },
  3: { bg:'#FFF8F0', accent:'#F97316', tag:'#FFF0E6', tagText:'#C2410C', name:'Deep Sprint' },
  4: { bg:'#F5F0FF', accent:'#7C3AED', tag:'#EDE9FF', tagText:'#4C1D95', name:'Final Stretch' },
};

const QL = [
  { name:'UWorld', url:'https://uworld.com', short:'UW' },
  { name:'Sketchy', url:'https://sketchy.com', short:'SK' },
  { name:'Amboss', url:'https://amboss.com', short:'AM' },
  { name:'NBME', url:'https://nbme.org', short:'NB' },
  { name:'Mehlman', url:'https://drive.google.com', short:'ME' },
];

const EJ = [
  { label:'Today', date: TODAY },
  { label:'NBME 9', date:'2026-04-04' },
  { label:'NBME 10', date:'2026-04-19' },
  { label:'NBME 11', date:'2026-05-02' },
  { label:'NBME 12', date:'2026-05-09' },
  { label:'UWSA 1', date:'2026-05-16' },
  { label:'NBME 13', date:'2026-05-23' },
  { label:'NBME 14', date:'2026-05-30' },
  { label:'UWSA 2', date:'2026-06-04' },
  { label:'NBME 15', date:'2026-06-07' },
  { label:'NBME 16', date:'2026-06-09' },
  { label:'Free 120', date:'2026-06-10' },
];

const NN = ['NBME 9','NBME 10','NBME 11','NBME 12','NBME 13','NBME 14','NBME 15','NBME 16','UWSA 1','UWSA 2','Free 120'];

const Tag = ({ bg, color, children }) => (
  <span style={{ fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:20, background:bg, color }}>{children}</span>
);

const Chip = ({ label, value, color }) => (
  <div style={{ background:'#F9FAFB', borderRadius:8, padding:'4px 10px', border:'1px solid #E5E7EB' }}>
    <div style={{ fontSize:9, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</div>
    <div style={{ fontSize:13, fontWeight:700, color, fontVariantNumeric:'tabular-nums' }}>{value}</div>
  </div>
);

function MoodSlider({ date }) {
  const [mood, setMood] = useState(null);
  useEffect(() => {
    getDailyMood(date).then(m => { if (m) setMood(m.energy); else setMood(null); });
  }, [date]);
  const save = async v => { setMood(v); await upsertDailyMood(date, v); };
  const label = mood ? (mood<=3?'Low energy':mood<=5?'Getting by':mood<=7?'Solid':mood<=9?'Strong':'Peak') : null;
  const color = mood ? (mood<=3?'#EF4444':mood<=5?'#F97316':mood<=7?'#10B981':'#059669') : '#9CA3AF';
  return (
    <div style={{ background:'#fff', borderRadius:12, border:'1px solid #E5E7EB', padding:'12px 14px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <span style={{ fontSize:11, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:'0.06em' }}>Energy / Focus</span>
        {mood && <span style={{ fontSize:12, fontWeight:700, color }}>{mood}/10 — {label}</span>}
      </div>
      <input type="range" min="1" max="10" value={mood||5} onChange={e => save(parseInt(e.target.value))}
        style={{ width:'100%', accentColor:'#F97316', cursor:'pointer' }} />
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#9CA3AF', marginTop:2 }}>
        <span>Exhausted</span><span>Peak</span>
      </div>
    </div>
  );
}

function NBMETracker() {
  const [scores, setScores] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ exam_name:'NBME 9', date_taken:'', score:'', percentile:'', notes:'' });

  useEffect(() => { getNBMEScores().then(setScores); }, []);

  const handleAdd = async e => {
    e.preventDefault();
    const r = await addNBMEScore(form.exam_name, form.date_taken, parseInt(form.score)||null, parseInt(form.percentile)||null, form.notes);
    if (r) {
      setScores(p => [...p, r].sort((a,b) => new Date(a.date_taken) - new Date(b.date_taken)));
      setShowAdd(false);
      setForm({ exam_name:'NBME 9', date_taken:'', score:'', percentile:'', notes:'' });
    }
  };

  const cs = scores.filter(s => s.score);
  const T = 270, W = 320, H = 140, pL = 40, pR = 20, pT = 15, pB = 25;
  const iW = W-pL-pR, iH = H-pT-pB;
  const mxS = Math.max(...(cs.length ? cs.map(s=>s.score) : [T]), T, 272);
  const mnS = Math.max(200, Math.min(...(cs.length ? cs.map(s=>s.score) : [235]), 235) - 10);
  const toX = i => pL + (i / Math.max(cs.length-1, 1)) * iW;
  const toY = v => pT + iH - ((v - mnS) / (mxS - mnS)) * iH;
  const ty = toY(T);

  const inp = { width:'100%', padding:'7px 10px', borderRadius:8, border:'1px solid #E5E7EB', fontSize:13, background:'#fff', fontFamily:'inherit', color:'#111827', outline:'none', boxSizing:'border-box' };
  const lb = { fontSize:11, color:'#6B7280', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:4 };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {cs.length > 0 ? (
        <div style={{ background:'#fff', borderRadius:12, padding:16, border:'1px solid #E5E7EB' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Score trajectory — target 270</div>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:'auto' }}>
            {[0,.25,.5,.75,1].map(t => {
              const v = Math.round(mnS + t*(mxS-mnS)), y = toY(v);
              return <g key={t}><line x1={pL} y1={y} x2={W-pR} y2={y} stroke="#F3F4F6" strokeWidth="1"/><text x={pL-4} y={y+4} textAnchor="end" fontSize="9" fill="#9CA3AF">{v}</text></g>;
            })}
            <line x1={pL} y1={ty} x2={W-pR} y2={ty} stroke="#F97316" strokeWidth="1.5" strokeDasharray="4 3" opacity=".7"/>
            <text x={W-pR+3} y={ty+4} fontSize="9" fill="#F97316" fontWeight="600">270</text>
            {cs.length > 1 && <polyline points={cs.map((s,i) => `${toX(i)},${toY(s.score)}`).join(' ')} fill="none" stroke="#6B7280" strokeWidth="2" strokeLinejoin="round"/>}
            {cs.map((s,i) => (
              <g key={s.id}>
                <circle cx={toX(i)} cy={toY(s.score)} r="5" fill={s.score>=T?'#10B981':'#F97316'}/>
                <text x={toX(i)} y={toY(s.score)-9} textAnchor="middle" fontSize="9" fill="#111827" fontWeight="600">{s.score}</text>
                <text x={toX(i)} y={H-5} textAnchor="middle" fontSize="8" fill="#9CA3AF">{s.exam_name.replace('NBME ','N')}</text>
              </g>
            ))}
          </svg>
          <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
            <Chip label="Latest" value={cs[cs.length-1].score} color="#111827"/>
            <Chip label="To target" value={`${T-cs[cs.length-1].score>0?'+':''}${T-cs[cs.length-1].score} pts`} color={cs[cs.length-1].score>=T?'#10B981':'#F97316'}/>
          </div>
        </div>
      ) : (
        <div style={{ background:'#F9FAFB', borderRadius:12, padding:24, textAlign:'center', border:'1px solid #E5E7EB' }}>
          <div style={{ fontSize:13, color:'#9CA3AF' }}>No scores yet — NBME 9 baseline on Apr 4</div>
        </div>
      )}
      {scores.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {scores.map(s => (
            <div key={s.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 14px', background:'#fff', borderRadius:10, border:'1px solid #E5E7EB' }}>
              <div>
                <span style={{ fontSize:14, fontWeight:600, color:'#111827' }}>{s.exam_name}</span>
                <span style={{ fontSize:12, color:'#9CA3AF', marginLeft:8 }}>{fmtShort(s.date_taken)}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                {s.score && <span style={{ fontSize:18, fontWeight:700, color:s.score>=270?'#10B981':'#F97316', fontVariantNumeric:'tabular-nums' }}>{s.score}</span>}
                {s.percentile && <span style={{ fontSize:11, color:'#9CA3AF' }}>{s.percentile}th</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      {showAdd ? (
        <form onSubmit={handleAdd} style={{ background:'#F9FAFB', borderRadius:12, padding:16, display:'flex', flexDirection:'column', gap:10, border:'1px solid #E5E7EB' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <div><label style={lb}>Exam</label><select value={form.exam_name} onChange={e=>setForm(f=>({...f,exam_name:e.target.value}))} style={inp}>{NN.map(n=><option key={n}>{n}</option>)}</select></div>
            <div><label style={lb}>Date</label><input type="date" value={form.date_taken} onChange={e=>setForm(f=>({...f,date_taken:e.target.value}))} style={inp} required/></div>
            <div><label style={lb}>Score</label><input type="number" min="200" max="300" placeholder="e.g. 248" value={form.score} onChange={e=>setForm(f=>({...f,score:e.target.value}))} style={inp}/></div>
            <div><label style={lb}>Percentile</label><input type="number" min="1" max="99" placeholder="e.g. 62" value={form.percentile} onChange={e=>setForm(f=>({...f,percentile:e.target.value}))} style={inp}/></div>
          </div>
          <div><label style={lb}>Notes</label><input type="text" placeholder="Weak areas..." value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} style={inp}/></div>
          <div style={{ display:'flex', gap:8 }}>
            <button type="submit" style={{ flex:1, background:'#F97316', color:'#fff', border:'none', borderRadius:8, padding:'9px', fontSize:13, cursor:'pointer', fontFamily:'inherit', fontWeight:500 }}>Log score</button>
            <button type="button" onClick={()=>setShowAdd(false)} style={{ background:'#F3F4F6', color:'#374151', border:'none', borderRadius:8, padding:'9px 16px', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={()=>setShowAdd(true)} style={{ background:'#fff', color:'#F97316', border:'1.5px dashed #FED7AA', borderRadius:10, padding:'10px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
          + Log NBME / UWSA score
        </button>
      )}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('today');
  const [sel, setSel] = useState(TODAY);
  const [calMonth, setCalMonth] = useState(() => TODAY.substring(0,7));
  const [taskStates, setTaskStates] = useState({});
  const [custom, setCustom] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [totalPoms, setTotalPoms] = useState(0);
  const [hrs, setHrs] = useState('');
  const [anki, setAnki] = useState('');
  const [note, setNote] = useState('');
  const [logs, setLogs] = useState([]);
  const [scores, setScores] = useState([]);
  const [saving, setSaving] = useState(false);
  const [tick, setTick] = useState(false);

  const day = getDayData(sel);
  const ph = day ? PH[day.phase] : PH[1];
  const quote = getQuoteForDate(sel);
  const dtg = daysToExam();

  useEffect(() => {
    Promise.all([getDailyLog(sel), getTaskCompletions(sel), getPomodorosForDate(sel)]).then(([log, tasks]) => {
      setHrs(log?.hours_studied?.toString() || '');
      setAnki(log?.anki_cards?.toString() || '');
      setNote(log?.notes || '');
      const m = {};
      tasks.forEach(t => { m[t.task_index] = t; });
      setTaskStates(m);
      setCustom([]);
    });
  }, [sel]);

  useEffect(() => {
    Promise.all([getAllDailyLogs(), getAllPomodoros(), getNBMEScores()]).then(([l, p, s]) => {
      setLogs(l); setTotalPoms(p.length); setScores(s);
    });
  }, []);

  const toggleTask = async (i, c) => {
    const r = await toggleTaskCompletion(sel, i, c);
    if (r) setTaskStates(p => ({ ...p, [i]: r }));
  };

  const delayT = async i => {
    const idx = STUDY_PLAN.findIndex(d => d.date === sel);
    const next = STUDY_PLAN[idx + 1];
    if (!next) return;
    const r = await delayTask(sel, i, next.date);
    if (r) setTaskStates(p => ({ ...p, [i]: r }));
  };

  const saveLog = async () => {
    setSaving(true);
    await upsertDailyLog(sel, { hours_studied: parseFloat(hrs)||0, anki_cards: parseInt(anki)||0, notes: note });
    setSaving(false); setTick(true); setTimeout(() => setTick(false), 2000);
    const l = await getAllDailyLogs(); setLogs(l);
  };

  const comp = Object.values(taskStates).filter(t => t.completed).length + custom.filter(t => t.done).length;
  const tot = (day?.tasks?.length || 0) + custom.length;
  const pct = tot > 0 ? Math.round((comp / tot) * 100) : 0;
  const tHrs = logs.reduce((s, l) => s + (l.hours_studied||0), 0);
  const tAnki = logs.reduce((s, l) => s + (l.anki_cards||0), 0);
  const sDays = logs.filter(l => l.hours_studied > 0).length;
  const calY = parseInt(calMonth.split('-')[0]);
  const calM = parseInt(calMonth.split('-')[1]) - 1;
  const fdow = new Date(calY, calM, 1).getDay();
  const dim = new Date(calY, calM+1, 0).getDate();
  const mName = new Date(calY, calM, 1).toLocaleDateString('en-US', { month:'long', year:'numeric' });
  const nextExam = EJ.slice(1).find(j => j.date >= TODAY);
  const dtnx = nextExam ? Math.ceil((new Date(nextExam.date+'T12:00:00') - new Date()) / 86400000) : null;

  const bs = (bg, color) => ({ background:bg, color, border:'none', borderRadius:8, padding:'7px 12px', fontSize:13, cursor:'pointer', fontFamily:'inherit', fontWeight:500 });

  return (
    <div style={{ minHeight:'100vh', background:'#F9FAFB', fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif", color:'#111827' }}>
      <header style={{ background:'#fff', borderBottom:'1px solid #E5E7EB', height:52, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:16, fontWeight:700, letterSpacing:'-0.02em' }}>Step 2</span>
          <span style={{ fontSize:12, fontWeight:600, color:'#F97316', background:'#FFF7ED', padding:'3px 10px', borderRadius:20 }}>{dtg}d to exam</span>
          {nextExam && dtnx <= 10 && (
            <span style={{ fontSize:11, fontWeight:600, color:'#7C3AED', background:'#EDE9FF', padding:'3px 10px', borderRadius:20 }}>{nextExam.label} in {dtnx}d</span>
          )}
        </div>
        <nav style={{ display:'flex', gap:2 }}>
          {[['today','Today'],['calendar','Calendar'],['scores','Scores'],['progress','Progress']].map(([id,lbl]) => (
            <button key={id} onClick={() => setView(id)} style={{ background:view===id?'#111827':'transparent', color:view===id?'#fff':'#6B7280', border:'none', borderRadius:8, padding:'6px 14px', fontSize:13, fontWeight:500, cursor:'pointer', transition:'all .15s' }}>{lbl}</button>
          ))}
        </nav>
        <div style={{ display:'flex', gap:5 }}>
          {QL.map(l => (
            <a key={l.name} href={l.url} target="_blank" rel="noopener noreferrer" title={l.name}
              style={{ fontSize:11, fontWeight:700, color:'#6B7280', background:'#F3F4F6', borderRadius:7, padding:'4px 8px', textDecoration:'none' }}>
              {l.short}
            </a>
          ))}
        </div>
      </header>

      {view === 'today' && (
        <div style={{ maxWidth:1080, margin:'0 auto', padding:'20px', display:'grid', gridTemplateColumns:'1fr 320px', gap:16 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

            <div style={{ background:'#fff', borderRadius:14, border:'1px solid #E5E7EB', padding:'18px 20px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <button onClick={() => { const p = offsetDate(sel,-1); if(getDayData(p)) setSel(p); }} style={{ ...bs('#F3F4F6','#374151'), padding:'5px 11px', fontSize:16 }}>←</button>
                  <button onClick={() => setSel(TODAY)} style={{ ...bs(sel===TODAY?'#111827':'#F3F4F6', sel===TODAY?'#fff':'#374151'), fontSize:12, fontWeight:600, padding:'5px 12px' }}>Today</button>
                  <button onClick={() => { const n = offsetDate(sel,1); if(getDayData(n)) setSel(n); }} style={{ ...bs('#F3F4F6','#374151'), padding:'5px 11px', fontSize:16 }}>→</button>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <svg viewBox="0 0 44 44" style={{ width:44, height:44, transform:'rotate(-90deg)' }}>
                    <circle cx="22" cy="22" r="18" fill="none" stroke="#F3F4F6" strokeWidth="4"/>
                    <circle cx="22" cy="22" r="18" fill="none" stroke={ph.accent} strokeWidth="4" strokeLinecap="round"
                      strokeDasharray={2*Math.PI*18} strokeDashoffset={2*Math.PI*18*(1-pct/100)} style={{ transition:'stroke-dashoffset .5s' }}/>
                  </svg>
                  <div>
                    <div style={{ fontSize:16, fontWeight:700, color:ph.accent }}>{pct}%</div>
                    <div style={{ fontSize:11, color:'#9CA3AF' }}>{comp}/{tot}</div>
                  </div>
                </div>
              </div>
              <div style={{ fontSize:12, fontWeight:500, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{fmtDate(sel)}</div>
              <div style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.02em', lineHeight:1.2, marginBottom:10 }}>{day?.label || 'Study day'}</div>
              {day && (
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  <Tag bg={ph.tag} color={ph.tagText}>Phase {day.phase}: {ph.name}</Tag>
                  <Tag bg='#F3F4F6' color='#374151'>{day.hrs_target}h target</Tag>
                  {day.is_lce && <Tag bg='#ECFDF5' color='#065F46'>LCE</Tag>}
                  {(day.special==='exam'||day.special==='exam_opt') && <Tag bg='#FFF7ED' color='#C2410C'>{day.special==='exam_opt'?'Optional exam':'Exam day'}</Tag>}
                  {day.special==='flight' && <Tag bg='#EFF6FF' color='#1D4ED8'>Flight ✈</Tag>}
                  {day.special==='travel_ceremony' && <Tag bg='#FDF4FF' color='#7E22CE'>Ceremony 🎓</Tag>}
                </div>
              )}
            </div>

            <MoodSlider date={sel} />

            <div style={{ background:'#fff', borderRadius:14, border:'1px solid #E5E7EB', borderLeft:'4px solid #F97316', padding:'14px 18px' }}>
              <p style={{ fontSize:14, fontStyle:'italic', color:'#374151', lineHeight:1.7, margin:0 }}>"{quote.text}"</p>
              <p style={{ fontSize:11, color:'#9CA3AF', marginTop:8, marginBottom:0, fontWeight:500 }}>— {quote.source}</p>
            </div>

            <div style={{ background:'#fff', borderRadius:14, border:'1px solid #E5E7EB', overflow:'hidden' }}>
              <div style={{ padding:'13px 18px 10px', borderBottom:'1px solid #F3F4F6', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:12, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:'0.06em' }}>Tasks</span>
                <span style={{ fontSize:11, color:'#9CA3AF' }}>Day {day?.day||'?'} of 73</span>
              </div>
              {day?.tasks?.map((task, i) => {
                const st = taskStates[i], done = st?.completed, delayed = st?.delayed_to;
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 18px', borderBottom:'1px solid #F9FAFB', background:done?'#F9FAFB':'#fff' }}>
                    <button onClick={() => toggleTask(i, !done)} style={{ width:20, height:20, borderRadius:6, border:`2px solid ${done?'#10B981':'#D1D5DB'}`, background:done?'#10B981':'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .15s' }}>
                      {done && <span style={{ color:'#fff', fontSize:11, fontWeight:700 }}>✓</span>}
                    </button>
                    <span style={{ fontSize:14, color:done?'#9CA3AF':'#111827', textDecoration:done?'line-through':'none', flex:1, lineHeight:1.5 }}>
                      {task}{delayed && <span style={{ fontSize:11, color:'#F97316', marginLeft:8, fontWeight:500 }}>→ {delayed}</span>}
                    </span>
                    {!done && !delayed && (
                      <button onClick={() => delayT(i)} style={{ background:'none', border:'1px solid #E5E7EB', borderRadius:6, padding:'3px 8px', fontSize:10, color:'#9CA3AF', cursor:'pointer', fontFamily:'inherit' }}>delay →</button>
                    )}
                  </div>
                );
              })}
              {custom.map((t, i) => (
                <div key={`c${i}`} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 18px', borderBottom:'1px solid #F9FAFB', background:t.done?'#F9FAFB':'#fff' }}>
                  <button onClick={() => setCustom(p => p.map((x,xi) => xi===i ? {...x,done:!x.done} : x))} style={{ width:20, height:20, borderRadius:6, border:`2px solid ${t.done?'#F97316':'#D1D5DB'}`, background:t.done?'#F97316':'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .15s' }}>
                    {t.done && <span style={{ color:'#fff', fontSize:11, fontWeight:700 }}>✓</span>}
                  </button>
                  <span style={{ fontSize:14, color:t.done?'#9CA3AF':'#111827', textDecoration:t.done?'line-through':'none', flex:1 }}>
                    {t.text}<span style={{ fontSize:10, color:'#D1D5DB', marginLeft:6 }}>custom</span>
                  </span>
                  <button onClick={() => setCustom(p => p.filter((_,xi) => xi!==i))} style={{ background:'none', border:'none', color:'#D1D5DB', cursor:'pointer', fontSize:16, padding:'0 4px' }}>×</button>
                </div>
              ))}
              <div style={{ padding:'10px 18px', display:'flex', gap:8, borderTop:'1px solid #F3F4F6' }}>
                <input value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key==='Enter' && (() => { if(!newTask.trim())return; setCustom(p=>[...p,{text:newTask.trim(),done:false}]); setNewTask(''); })()}
                  placeholder="Add a task for today..." style={{ flex:1, padding:'7px 12px', borderRadius:8, border:'1px solid #E5E7EB', fontSize:13, outline:'none', fontFamily:'inherit', color:'#111827' }}/>
                <button onClick={() => { if(!newTask.trim())return; setCustom(p=>[...p,{text:newTask.trim(),done:false}]); setNewTask(''); }} style={{ background:'#F97316', color:'#fff', border:'none', borderRadius:8, padding:'7px 14px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Add</button>
              </div>
            </div>

            <WeakTopics currentDate={sel} currentSystem={day?.system||''} />

            <div style={{ background:'#fff', borderRadius:14, border:'1px solid #E5E7EB', padding:'16px 18px' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>Log today</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                {[['Hours studied',hrs,setHrs,'e.g. 5.5','number'],['Anki cards',anki,setAnki,'e.g. 50','number']].map(([lbl,val,set,ph,type]) => (
                  <div key={lbl}>
                    <label style={{ fontSize:11, color:'#9CA3AF', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:5 }}>{lbl}</label>
                    <input type={type} value={val} onChange={e => set(e.target.value)} placeholder={ph}
                      style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:'1px solid #E5E7EB', fontSize:13, fontFamily:'inherit', color:'#111827', outline:'none', boxSizing:'border-box' }}/>
                  </div>
                ))}
              </div>
              <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="What clicked? What needs more work?" rows={2}
                style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:'1px solid #E5E7EB', fontSize:13, fontFamily:'inherit', color:'#111827', outline:'none', marginBottom:10, resize:'vertical', boxSizing:'border-box' }}/>
              <button onClick={saveLog} disabled={saving} style={{ background:tick?'#10B981':'#111827', color:'#fff', border:'none', borderRadius:8, padding:'9px 20px', fontSize:13, cursor:'pointer', fontFamily:'inherit', fontWeight:500 }}>
                {tick ? '✓ Saved' : saving ? 'Saving...' : 'Save log'}
              </button>
            </div>

            <EndOfDayReflection currentDate={sel} dayData={day} hoursLogged={parseFloat(hrs)||0} ankiLogged={parseInt(anki)||0} tasksCompleted={comp} totalTasks={tot} currentSystem={day?.system||''} />
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ background:'#fff', borderRadius:14, border:'1px solid #E5E7EB', padding:16, textAlign:'center' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Koidu Government Hospital</div>
              <div style={{ width:120, height:120, margin:'0 auto' }}><StaghornFern pomodoroCount={totalPoms}/></div>
              <div style={{ fontSize:11, color:'#9CA3AF', marginTop:8, lineHeight:1.5 }}>
                {totalPoms===0?'Start a session to grow your fern':totalPoms<3?'A seedling takes root':totalPoms<7?'The fronds are opening':totalPoms<15?'Growing steadily':totalPoms<26?'A full, healthy fern':'The staghorn thrives'}
              </div>
            </div>

            <PomodoroTimer currentDate={sel} currentSystem={day?.system||''} onComplete={() => setTotalPoms(c => c+1)} />

            <div style={{ background:'#fff', borderRadius:14, border:'1px solid #E5E7EB', padding:'14px 16px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Running totals</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[['Hours',tHrs.toFixed(1)],['Anki',tAnki.toLocaleString()],['Pomodoros',totalPoms],['Study days',sDays]].map(([lbl,val]) => (
                  <div key={lbl} style={{ background:'#F9FAFB', borderRadius:10, padding:'10px 12px', border:'1px solid #F3F4F6' }}>
                    <div style={{ fontSize:10, color:'#9CA3AF', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>{lbl}</div>
                    <div style={{ fontSize:20, fontWeight:700, color:'#111827', fontVariantNumeric:'tabular-nums' }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background:'#fff', borderRadius:14, border:'1px solid #E5E7EB', padding:'14px 16px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Jump to</div>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                {EJ.map(j => {
                  const target = j.label==='Today' ? TODAY : j.date;
                  return (
                    <button key={j.label} onClick={() => setSel(target)} style={{ background:sel===target?'#111827':'#F3F4F6', color:sel===target?'#fff':'#374151', border:'none', borderRadius:7, padding:'5px 9px', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>{j.label}</button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'calendar' && (
        <div style={{ maxWidth:900, margin:'0 auto', padding:'20px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <button onClick={() => { const d=new Date(calY,calM-1,1); setCalMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`); }} style={{ background:'#fff', color:'#374151', border:'none', borderRadius:8, padding:'7px 14px', fontSize:13, cursor:'pointer', fontFamily:'inherit', fontWeight:500 }}>← Prev</button>
            <div style={{ fontSize:18, fontWeight:700, letterSpacing:'-0.02em' }}>{mName}</div>
            <button onClick={() => { const d=new Date(calY,calM+1,1); setCalMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`); }} style={{ background:'#fff', color:'#374151', border:'none', borderRadius:8, padding:'7px 14px', fontSize:13, cursor:'pointer', fontFamily:'inherit', fontWeight:500 }}>Next →</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3, marginBottom:3 }}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} style={{ fontSize:11, fontWeight:600, color:'#9CA3AF', textAlign:'center', padding:'4px 0' }}>{d}</div>)}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 }}>
            {Array.from({length:fdow}).map((_,i) => <div key={`e${i}`}/>)}
            {Array.from({length:dim}).map((_,i) => {
              const day = i+1;
              const ds = `${calY}-${String(calM+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const d = getDayData(ds), ps = d ? PH[d.phase] : null;
              const isToday = ds===TODAY, isSel = ds===sel;
              const isExam = d?.special==='exam' || d?.special==='exam_opt';
              return (
                <div key={day} onClick={() => { if(d) { setSel(ds); setView('today'); } }}
                  style={{ minHeight:68, borderRadius:10, padding:'6px 7px', cursor:d?'pointer':'default', background:isSel?'#111827':ps?ps.bg:'#F9FAFB', border:isToday?`2px solid ${ps?.accent||'#F97316'}`:isExam?`2px solid ${ps?.accent}`:'1px solid transparent', opacity:d?1:0.25, transition:'all .12s' }}>
                  <div style={{ fontSize:11, fontWeight:isToday?700:500, color:isSel?'#fff':'#374151', marginBottom:2 }}>{day}</div>
                  {d && <>
                    <div style={{ fontSize:9, color:isSel?'#D1D5DB':ps.accent, lineHeight:1.3, marginBottom:3, fontWeight:500 }}>{d.system?.substring(0,14)}</div>
                    <div style={{ display:'flex', gap:2, flexWrap:'wrap' }}>
                      {isExam && <span style={{ fontSize:8, background:'#F97316', color:'#fff', borderRadius:4, padding:'1px 4px', fontWeight:700 }}>EXAM</span>}
                      {d.is_lce && <span style={{ fontSize:8, background:'#10B981', color:'#fff', borderRadius:4, padding:'1px 4px', fontWeight:700 }}>LCE</span>}
                      {d.special==='flight' && <span style={{ fontSize:8, background:'#3B82F6', color:'#fff', borderRadius:4, padding:'1px 4px', fontWeight:700 }}>✈</span>}
                      {d.special==='review' && <span style={{ fontSize:8, background:'#8B5CF6', color:'#fff', borderRadius:4, padding:'1px 4px', fontWeight:700 }}>REV</span>}
                    </div>
                  </>}
                </div>
              );
            })}
          </div>
          <div style={{ display:'flex', gap:12, marginTop:14, flexWrap:'wrap' }}>
            {Object.entries(PH).map(([k,p]) => (
              <div key={k} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#6B7280' }}>
                <div style={{ width:10, height:10, borderRadius:3, background:p.bg, border:`1.5px solid ${p.accent}` }}/>
                Phase {k}: {p.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'scores' && (
        <div style={{ maxWidth:680, margin:'0 auto', padding:'24px 20px', display:'flex', flexDirection:'column', gap:20 }}>
          <div style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.02em' }}>Score tracker</div>
          <ScorePredictor scores={scores} />
          <NBMETracker />
          <UWorldPerformance />
        </div>
      )}

      {view === 'progress' && (
        <div style={{ maxWidth:800, margin:'0 auto', padding:'24px 20px', display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.02em' }}>Progress</div>
            <button onClick={() => exportCSV(logs)} style={{ background:'#F3F4F6', color:'#374151', border:'none', borderRadius:8, padding:'7px 14px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>↓ Export CSV</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
            {[['Hours logged',tHrs.toFixed(1),'of ~362 projected'],['Anki cards',tAnki.toLocaleString(),'total reviewed'],['Pomodoros',totalPoms,'50-min sessions'],['Days to exam',dtg,'Jun 12, 2026']].map(([lbl,val,sub]) => (
              <div key={lbl} style={{ background:'#fff', borderRadius:12, padding:'14px 16px', border:'1px solid #E5E7EB' }}>
                <div style={{ fontSize:11, color:'#9CA3AF', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{lbl}</div>
                <div style={{ fontSize:26, fontWeight:700, letterSpacing:'-0.02em', color:'#111827', fontVariantNumeric:'tabular-nums' }}>{val}</div>
                <div style={{ fontSize:11, color:'#9CA3AF', marginTop:2 }}>{sub}</div>
              </div>
            ))}
          </div>
          <StudyHeatmap logs={logs} />
          <div style={{ background:'#fff', borderRadius:14, border:'1px solid #E5E7EB', padding:'16px 20px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:12, fontWeight:600, color:'#374151' }}>Hours toward 362</span>
              <span style={{ fontSize:12, fontWeight:700, color:'#F97316' }}>{((tHrs/362)*100).toFixed(1)}%</span>
            </div>
            <div style={{ height:8, background:'#F3F4F6', borderRadius:4, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${Math.min((tHrs/362)*100,100)}%`, background:'#F97316', borderRadius:4, transition:'width .5s' }}/>
            </div>
          </div>
          {logs.length > 0 && (
            <div style={{ background:'#fff', borderRadius:14, border:'1px solid #E5E7EB', padding:'16px 20px' }}>
              <div style={{ fontSize:12, fontWeight:600, color:'#374151', marginBottom:12 }}>Recent entries</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {logs.slice(-7).reverse().map(log => (
                  <div key={log.date} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #F9FAFB' }}>
                    <div>
                      <span style={{ fontSize:13, fontWeight:600, color:'#111827' }}>{fmtShort(log.date)}</span>
                      {log.notes && <span style={{ fontSize:12, color:'#9CA3AF', marginLeft:8 }}>{log.notes.substring(0,50)}{log.notes.length>50?'...':''}</span>}
                    </div>
                    <div style={{ display:'flex', gap:12, fontSize:12, color:'#6B7280', fontVariantNumeric:'tabular-nums' }}>
                      {log.hours_studied>0 && <span>{log.hours_studied}h</span>}
                      {log.anki_cards>0 && <span>{log.anki_cards} anki</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ background:'#fff', borderRadius:14, border:'1px solid #E5E7EB', padding:20, display:'flex', alignItems:'center', gap:20 }}>
            <div style={{ width:90, height:90, flexShrink:0 }}><StaghornFern pomodoroCount={totalPoms}/></div>
            <div>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>The staghorn fern at Koidu Government Hospital</div>
              <div style={{ fontSize:12, color:'#9CA3AF', lineHeight:1.6 }}>
                {totalPoms} focus sessions · {totalPoms*50} minutes · {totalPoms>=26?'Fully grown.':26-totalPoms+' sessions until full growth.'}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        button:active { transform: scale(0.97); }
        input:focus, textarea:focus, select:focus { border-color: #F97316 !important; box-shadow: 0 0 0 3px #FFF7ED; }
        a:hover { opacity: 0.8; }
      `}</style>
    </div>
  );
}
