import { useState, useEffect } from 'react';
import { getNBMEScores, addNBMEScore } from '../lib/supabase';

const EXAM_NAMES = ['NBME 9','NBME 10','NBME 11','NBME 12','NBME 13','NBME 14','NBME 15','NBME 16','UWSA 1','UWSA 2','Free 120'];
const TARGET = 270;

export default function NBMETracker() {
  const [scores, setScores] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ exam_name: 'NBME 9', date_taken: '', score: '', percentile: '', notes: '' });

  useEffect(() => { getNBMEScores().then(setScores); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const result = await addNBMEScore(form.exam_name, form.date_taken, parseInt(form.score)||null, parseInt(form.percentile)||null, form.notes);
    if (result) {
      setScores(prev => [...prev, result].sort((a,b) => new Date(a.date_taken)-new Date(b.date_taken)));
      setShowAdd(false);
      setForm({ exam_name: 'NBME 9', date_taken: '', score: '', percentile: '', notes: '' });
    }
  };

  const chartScores = scores.filter(s => s.score);
  const maxScore = Math.max(...chartScores.map(s => s.score), TARGET, 270);
  const minScore = Math.max(200, Math.min(...chartScores.map(s => s.score), 230) - 10);
  const chartH = 140, chartW = 320, padL = 40, padR = 20, padT = 15, padB = 25;
  const innerW = chartW - padL - padR, innerH = chartH - padT - padB;
  const toX = (i) => padL + (i / Math.max(chartScores.length - 1, 1)) * innerW;
  const toY = (score) => padT + innerH - ((score - minScore) / (maxScore - minScore)) * innerH;
  const targetY = toY(TARGET);

  const inp = { width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid #E8DDD0', fontSize: '13px', background: '#FDFAF6', fontFamily: 'inherit', color: '#3D2B1F', outline: 'none' };
  const lbl = { fontSize: '10px', color: '#8B6B4A', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px', fontFamily: 'monospace' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {chartScores.length > 0 ? (
        <div style={{ background: '#FDFAF6', borderRadius: '12px', padding: '16px', border: '1px solid #E8DDD0' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8B6B4A', marginBottom: '10px', fontFamily: 'monospace' }}>Score trajectory</div>
          <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: '100%', height: 'auto' }}>
            {[0,0.25,0.5,0.75,1].map(t => {
              const score = Math.round(minScore + t * (maxScore - minScore));
              const y = toY(score);
              return <g key={t}><line x1={padL} y1={y} x2={chartW-padR} y2={y} stroke="#E8DDD0" strokeWidth="1"/><text x={padL-4} y={y+4} textAnchor="end" fontSize="9" fill="#B0A090">{score}</text></g>;
            })}
            <line x1={padL} y1={targetY} x2={chartW-padR} y2={targetY} stroke="#C4703A" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7"/>
            <text x={chartW-padR+3} y={targetY+4} fontSize="9" fill="#C4703A" fontWeight="600">270</text>
            {chartScores.length > 1 && <polyline points={chartScores.map((s,i) => `${toX(i)},${toY(s.score)}`).join(' ')} fill="none" stroke="#8B6B4A" strokeWidth="2" strokeLinejoin="round"/>}
            {chartScores.map((s,i) => (
              <g key={s.id}>
                <circle cx={toX(i)} cy={toY(s.score)} r="5" fill={s.score >= TARGET ? '#4A7A5A' : '#C4703A'}/>
                <text x={toX(i)} y={toY(s.score)-9} textAnchor="middle" fontSize="9" fill="#3D2B1F" fontWeight="600">{s.score}</text>
                <text x={toX(i)} y={chartH-5} textAnchor="middle" fontSize="8" fill="#B0A090">{s.exam_name.replace('NBME ','N')}</text>
              </g>
            ))}
          </svg>
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
            {[
              ['Latest', chartScores[chartScores.length-1].score, '#3D2B1F'],
              ['To target', `${TARGET - chartScores[chartScores.length-1].score > 0 ? '+' : ''}${TARGET - chartScores[chartScores.length-1].score} pts`, chartScores[chartScores.length-1].score >= TARGET ? '#4A7A5A' : '#C4703A'],
            ].map(([label, value, color]) => (
              <div key={label} style={{ background: '#F5EFE8', borderRadius: '6px', padding: '4px 10px' }}>
                <div style={{ fontSize: '9px', color: '#B0A090', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'monospace' }}>{label}</div>
                <div style={{ fontSize: '12px', fontWeight: '600', color, fontFamily: 'monospace' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ background: '#FDFAF6', borderRadius: '12px', padding: '24px', border: '1px solid #E8DDD0', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: '#B0A090' }}>No scores yet — NBME 9 baseline on Apr 4</div>
        </div>
      )}

      {scores.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {scores.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#FDFAF6', borderRadius: '8px', border: '1px solid #E8DDD0' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: '500', color: '#3D2B1F' }}>{s.exam_name}</span>
                <span style={{ fontSize: '11px', color: '#B0A090', marginLeft: '8px' }}>{new Date(s.date_taken+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {s.score && <span style={{ fontSize: '16px', fontWeight: '500', color: s.score >= TARGET ? '#4A7A5A' : '#C4703A', fontFamily: 'monospace' }}>{s.score}</span>}
                {s.percentile && <span style={{ fontSize: '11px', color: '#8B6B4A' }}>{s.percentile}th %ile</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd ? (
        <form onSubmit={handleAdd} style={{ background: '#F5EFE8', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div><label style={lbl}>Exam</label><select value={form.exam_name} onChange={e=>setForm(f=>({...f,exam_name:e.target.value}))} style={inp}>{EXAM_NAMES.map(n=><option key={n}>{n}</option>)}</select></div>
            <div><label style={lbl}>Date</label><input type="date" value={form.date_taken} onChange={e=>setForm(f=>({...f,date_taken:e.target.value}))} style={inp} required/></div>
            <div><label style={lbl}>Score</label><input type="number" min="200" max="300" placeholder="e.g. 248" value={form.score} onChange={e=>setForm(f=>({...f,score:e.target.value}))} style={inp}/></div>
            <div><label style={lbl}>Percentile</label><input type="number" min="1" max="99" placeholder="e.g. 62" value={form.percentile} onChange={e=>setForm(f=>({...f,percentile:e.target.value}))} style={inp}/></div>
          </div>
          <div><label style={lbl}>Notes</label><input type="text" placeholder="Weak areas, observations..." value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} style={inp}/></div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" style={{ flex:1, background:'#C4703A', color:'#FFF', border:'none', borderRadius:'8px', padding:'9px', fontSize:'13px', cursor:'pointer', fontFamily:'inherit', fontWeight:'500' }}>Log score</button>
            <button type="button" onClick={()=>setShowAdd(false)} style={{ background:'#E8DDD0', color:'#3D2B1F', border:'none', borderRadius:'8px', padding:'9px 16px', fontSize:'13px', cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={()=>setShowAdd(true)} style={{ background:'#F5EFE8', color:'#C4703A', border:'1px dashed #C4703A80', borderRadius:'10px', padding:'10px', fontSize:'12px', fontWeight:'500', cursor:'pointer', fontFamily:'inherit' }}>
          + Log NBME score
        </button>
      )}
    </div>
  );
}
