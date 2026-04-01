import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const TOTAL_QUESTIONS = 3617;

export default function UWorldAggregate() {
  const [perf, setPerf] = useState([]);
  useEffect(() => { supabase.from('uworld_performance').select('*').then(({data}) => setPerf(data||[])); }, []);
  
  const totalDone = perf.reduce((s,p) => s + (p.questions_done||0), 0);
  const pct = Math.round((totalDone / TOTAL_QUESTIONS) * 100);
  const avgCorrect = perf.filter(p => p.correct_pct).length > 0
    ? perf.filter(p => p.correct_pct).reduce((s,p) => s + p.correct_pct, 0) / perf.filter(p => p.correct_pct).length
    : null;

  return (
    <div style={{background:'#fff',borderRadius:14,border:'1px solid #E5E7EB',padding:'16px 18px'}}>
      <div style={{fontSize:11,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:12}}>UWorld — overall progress</div>
      <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:12}}>
        <div>
          <div style={{fontSize:32,fontWeight:700,letterSpacing:'-0.02em',color:'#111827',fontVariantNumeric:'tabular-nums'}}>{totalDone.toLocaleString()}</div>
          <div style={{fontSize:12,color:'#9CA3AF'}}>of {TOTAL_QUESTIONS.toLocaleString()} questions done</div>
        </div>
        {avgCorrect && (
          <div style={{marginLeft:'auto',textAlign:'right'}}>
            <div style={{fontSize:32,fontWeight:700,color:avgCorrect>=70?'#10B981':avgCorrect>=55?'#F97316':'#EF4444',fontVariantNumeric:'tabular-nums'}}>{avgCorrect.toFixed(0)}%</div>
            <div style={{fontSize:12,color:'#9CA3AF'}}>avg correct</div>
          </div>
        )}
      </div>
      <div style={{height:10,background:'#F3F4F6',borderRadius:5,overflow:'hidden',marginBottom:6}}>
        <div style={{height:'100%',width:`${pct}%`,background:'#F97316',borderRadius:5,transition:'width .5s'}}/>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#9CA3AF'}}>
        <span>{pct}% complete</span>
        <span>{(TOTAL_QUESTIONS-totalDone).toLocaleString()} remaining</span>
      </div>
    </div>
  );
}
