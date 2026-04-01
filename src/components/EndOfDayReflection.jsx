import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

async function getReflection(date){const{data}=await supabase.from('reflections').select('*').eq('date',date).maybeSingle();return data;}
async function saveReflection(date,text,ai){const{data}=await supabase.from('reflections').upsert({date,reflection_text:text,ai_response:ai},{onConflict:'date'}).select().single();return data;}

export default function EndOfDayReflection({currentDate,dayData,hoursLogged,ankiLogged,tasksCompleted,totalTasks,currentSystem}){
  const[open,setOpen]=useState(false),[text,setText]=useState(''),[ai,setAi]=useState(''),[loading,setLoading]=useState(false),[saved,setSaved]=useState(false),[existing,setExisting]=useState(null);
  useEffect(()=>{getReflection(currentDate).then(r=>{if(r){setExisting(r);setAi(r.ai_response||'');setText(r.reflection_text||'');setSaved(true);}else{setExisting(null);setAi('');setText('');setSaved(false);}});},[currentDate]);
  const submit=async()=>{
    if(!text.trim())return;
    setLoading(true);
    const systemPrompt=`You are a direct, knowledgeable medical education coach helping Jonathan Lascher, a 4th-year UCLA medical student with 20+ years global health experience (PIH Sierra Leone COO, Haiti), prepare for USMLE Step 2 CK targeting a score of 270. Today is ${currentDate}. His study data today: System studied: ${currentSystem||'Unknown'}, Day label: ${dayData?.label||'Study day'}, Hours logged: ${hoursLogged||0}, Anki cards: ${ankiLogged||0}, Tasks completed: ${tasksCompleted}/${totalTasks}, Day ${dayData?.day||'?'} of 73. Respond in 3-4 sentences. Be specific to what he studied today, not generic. Give one concrete actionable tip for tomorrow based on his system. Be honest not falsely cheerful. End with one sentence of genuine motivation grounded in why this exam matters for his patients.`;
    try{
      const r=await fetch('https://models.inference.ai.azure.com/chat/completions',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+import.meta.env.VITE_GITHUB_TOKEN},
        body:JSON.stringify({model:'gpt-4o',messages:[{role:'system',content:systemPrompt},{role:'user',content:text}],max_tokens:300})
      });
      const d=await r.json();
      const aiText=d.choices?.[0]?.message?.content||'Good work today. Rest well and come back strong tomorrow.';
      setAi(aiText);await saveReflection(currentDate,text,aiText);setSaved(true);setExisting(true);
    }catch(e){
      console.error(e);
      const fb='Good work today. Rest well and come back strong tomorrow.';
      setAi(fb);await saveReflection(currentDate,text,fb);setSaved(true);setExisting(true);
    }
    setLoading(false);
  };
  return(
    <div style={{background:'#fff',borderRadius:14,border:'1px solid #E5E7EB',overflow:'hidden'}}>
      <button onClick={()=>setOpen(o=>!o)} style={{width:'100%',padding:'12px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',background:existing?'#F0FFF4':'none',border:'none',cursor:'pointer',fontFamily:'inherit'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:12,fontWeight:700,color:'#374151',textTransform:'uppercase',letterSpacing:'0.06em'}}>{existing?'✓ Reflection logged':'End of day reflection'}</span>
          {!existing&&<span style={{fontSize:10,background:'#FFF7ED',color:'#C2410C',padding:'2px 7px',borderRadius:20,fontWeight:600}}>AI-powered</span>}
        </div>
        <span style={{color:'#9CA3AF',fontSize:12}}>{open?'▲':'▼'}</span>
      </button>
      {open&&(
        <div style={{borderTop:'1px solid #F3F4F6',padding:'14px 16px',display:'flex',flexDirection:'column',gap:12}}>
          {ai&&(
            <div style={{background:'#F0FFF4',borderRadius:10,padding:'12px 14px',borderLeft:'3px solid #10B981'}}>
              <div style={{fontSize:11,fontWeight:700,color:'#065F46',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>Coach response</div>
              <p style={{fontSize:13,color:'#374151',lineHeight:1.7,margin:0}}>{ai}</p>
            </div>
          )}
          {!saved&&(
            <>
              <div style={{fontSize:12,color:'#6B7280',lineHeight:1.5}}>What clicked today? What is still fuzzy? Be specific — your coach responds based on your actual study data.</div>
              <textarea value={text} onChange={e=>setText(e.target.value)} rows={3}
                placeholder="e.g. Cardio arrhythmias finally clicked. GI bleed management still feels shaky. Did 40 Anki, felt solid."
                style={{width:'100%',padding:'10px 12px',borderRadius:8,border:'1px solid #E5E7EB',fontSize:13,fontFamily:'inherit',color:'#111827',outline:'none',resize:'vertical',boxSizing:'border-box',lineHeight:1.6}}/>
              <button onClick={submit} disabled={loading||!text.trim()}
                style={{background:loading?'#9CA3AF':'#111827',color:'#fff',border:'none',borderRadius:8,padding:'10px 16px',fontSize:13,fontWeight:600,cursor:loading?'not-allowed':'pointer',fontFamily:'inherit'}}>
                {loading?'Getting feedback...':'Submit and get feedback'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
