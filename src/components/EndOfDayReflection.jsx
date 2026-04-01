import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

async function getReflection(date){
  const{data}=await supabase.from('reflections').select('*').eq('date',date).maybeSingle();
  return data;
}
async function saveReflection(date,clicked,fuzzy,flag){
  const text=JSON.stringify({clicked,fuzzy,flag});
  const{data}=await supabase.from('reflections').upsert({date,reflection_text:text,ai_response:''},{onConflict:'date'}).select().single();
  return data;
}
async function addWeakTopic(topic,date){
  if(!topic.trim())return;
  await supabase.from('weak_topics').insert({topic,system:'General',date_added:date});
}

export default function EndOfDayReflection({currentDate,dayData}){
  const[open,setOpen]=useState(false);
  const[clicked,setClicked]=useState('');
  const[fuzzy,setFuzzy]=useState('');
  const[flag,setFlag]=useState('');
  const[saved,setSaved]=useState(false);
  const[existing,setExisting]=useState(null);

  useEffect(()=>{
    getReflection(currentDate).then(r=>{
      if(r&&r.reflection_text){
        try{
          const p=JSON.parse(r.reflection_text);
          setClicked(p.clicked||'');
          setFuzzy(p.fuzzy||'');
          setFlag(p.flag||'');
          setSaved(true);
          setExisting(r);
        }catch(e){
          setClicked(r.reflection_text||'');
          setSaved(true);
          setExisting(r);
        }
      }else{
        setSaved(false);
        setExisting(null);
      }
    });
  },[currentDate]);

  const submit=async()=>{
    if(!clicked.trim()&&!fuzzy.trim())return;
    await saveReflection(currentDate,clicked,fuzzy,flag);
    if(flag.trim())await addWeakTopic(flag,currentDate);
    setSaved(true);
    setExisting(true);
  };

  const ta={width:'100%',padding:'8px 10px',borderRadius:8,border:'1px solid #E5E7EB',fontSize:13,fontFamily:'inherit',color:'#111827',outline:'none',resize:'vertical',boxSizing:'border-box',lineHeight:1.6};
  const lb={fontSize:11,color:'#6B7280',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',display:'block',marginBottom:5};

  return(
    <div style={{background:'#fff',borderRadius:14,border:'1px solid #E5E7EB',overflow:'hidden'}}>
      <button onClick={()=>setOpen(o=>!o)} style={{width:'100%',padding:'12px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',background:existing?'#F0FFF4':'none',border:'none',cursor:'pointer',fontFamily:'inherit'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:12,fontWeight:700,color:'#374151',textTransform:'uppercase',letterSpacing:'0.06em'}}>
            {existing?'✓ Day logged':'End of day — 2 min shutdown'}
          </span>
          {!existing&&<span style={{fontSize:10,background:'#EDE9FF',color:'#4C1D95',padding:'2px 7px',borderRadius:20,fontWeight:600}}>feeds weekly review</span>}
        </div>
        <span style={{color:'#9CA3AF',fontSize:12}}>{open?'▲':'▼'}</span>
      </button>
      {open&&(
        <div style={{borderTop:'1px solid #F3F4F6',padding:'14px 16px',display:'flex',flexDirection:'column',gap:12}}>
          {saved&&existing?(
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {clicked&&<div style={{background:'#F0FFF4',borderRadius:8,padding:'10px 12px'}}><div style={{fontSize:10,color:'#065F46',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:3}}>What clicked</div><div style={{fontSize:13,color:'#374151'}}>{clicked}</div></div>}
              {fuzzy&&<div style={{background:'#FFF7ED',borderRadius:8,padding:'10px 12px'}}><div style={{fontSize:10,color:'#C2410C',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:3}}>Still fuzzy</div><div style={{fontSize:13,color:'#374151'}}>{fuzzy}</div></div>}
              {flag&&<div style={{background:'#FEF2F2',borderRadius:8,padding:'10px 12px'}}><div style={{fontSize:10,color:'#DC2626',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:3}}>Flagged weak</div><div style={{fontSize:13,color:'#374151'}}>{flag}</div></div>}
            </div>
          ):(
            <>
              <div style={{fontSize:12,color:'#6B7280',lineHeight:1.5}}>2 minutes. Be specific. This feeds your weekly review with Claude.</div>
              <div>
                <label style={lb}>What clicked today?</label>
                <textarea value={clicked} onChange={e=>setClicked(e.target.value)} rows={2} placeholder="e.g. Brugada vs WPW distinction finally made sense. Loop diuretics mechanism solid." style={ta}/>
              </div>
              <div>
                <label style={lb}>What is still fuzzy / needs more work?</label>
                <textarea value={fuzzy} onChange={e=>setFuzzy(e.target.value)} rows={2} placeholder="e.g. GI bleed management algorithm still not automatic. Renal tubular acidosis types mixed up." style={ta}/>
              </div>
              <div>
                <label style={lb}>One topic to flag as weak (optional)</label>
                <input value={flag} onChange={e=>setFlag(e.target.value)} placeholder="e.g. RTA type 1 vs type 4" style={{...ta,resize:'none',rows:1}}/>
              </div>
              <button onClick={submit} disabled={!clicked.trim()&&!fuzzy.trim()}
                style={{background:'#111827',color:'#fff',border:'none',borderRadius:8,padding:'10px 16px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit',opacity:(!clicked.trim()&&!fuzzy.trim())?0.4:1}}>
                Save shutdown log
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
