import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AMBOSS_TARGET = 200;
const KEY = 'amboss_biostats_done';

export default function AmbossTracker() {
  const [done, setDone] = useState(0);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState('');

  useEffect(() => {
    supabase.from('uworld_performance').select('*').eq('system_name', 'Amboss Ethics/Biostats').single()
      .then(({data}) => { if(data) setDone(data.questions_done||0); });
  }, []);

  const save = async () => {
    const v = Math.min(AMBOSS_TARGET, Math.max(0, parseInt(input)||0));
    await supabase.from('uworld_performance').upsert({system_name:'Amboss Ethics/Biostats',correct_pct:null,questions_done:v,questions_total:AMBOSS_TARGET,updated_at:new Date().toISOString()},{onConflict:'system_name'});
    setDone(v);
    setEditing(false);
  };

  const pct = Math.round((done / AMBOSS_TARGET) * 100);
  const color = pct >= 75 ? '#10B981' : pct >= 40 ? '#F97316' : '#7C3AED';

  return (
    <div style={{background:'#fff',borderRadius:14,border:'1px solid #E5E7EB',padding:'16px 18px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.06em'}}>Amboss — Ethics / Biostats / QI</div>
          <div style={{fontSize:11,color:'#9CA3AF',marginTop:2}}>Phase 4 target: 200 questions</div>
        </div>
        <button onClick={()=>{setInput(done.toString());setEditing(e=>!e);}} style={{background:'#F3F4F6',color:'#374151',border:'none',borderRadius:7,padding:'5px 10px',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
          {editing?'Cancel':'Update'}
        </button>
      </div>
      {editing && (
        <div style={{display:'flex',gap:8,marginBottom:12}}>
          <input type="number" min="0" max="200" value={input} onChange={e=>setInput(e.target.value)}
            placeholder="Questions done" style={{flex:1,padding:'7px 10px',borderRadius:8,border:'1px solid #E5E7EB',fontSize:13,fontFamily:'inherit',outline:'none'}}/>
          <button onClick={save} style={{background:'#7C3AED',color:'#fff',border:'none',borderRadius:8,padding:'7px 14px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Save</button>
        </div>
      )}
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
        <div style={{fontSize:28,fontWeight:700,color,fontVariantNumeric:'tabular-nums'}}>{done}</div>
        <div style={{fontSize:13,color:'#9CA3AF'}}>of {AMBOSS_TARGET} questions</div>
      </div>
      <div style={{height:8,background:'#F3F4F6',borderRadius:4,overflow:'hidden',marginBottom:6}}>
        <div style={{height:'100%',width:`${pct}%`,background:color,borderRadius:4,transition:'width .5s'}}/>
      </div>
      <div style={{fontSize:11,color:'#9CA3AF'}}>{pct}% complete · {AMBOSS_TARGET-done} remaining · start in Phase 4 (May 18)</div>
    </div>
  );
}
