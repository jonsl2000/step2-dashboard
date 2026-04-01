import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const SYSTEMS = ['Cardiovascular','Pulmonary','Neurology','Gastrointestinal','OB/GYN','Psychiatry','Renal','Infectious Diseases','Endocrine','Hematology/Oncology','Rheumatology','Surgery/EM','Dermatology','Pediatrics','Ethics/Biostats','General'];

async function getWeakTopics() { const{data}=await supabase.from('weak_topics').select('*').eq('resolved',false).order('date_added',{ascending:false}); return data||[]; }
async function addWeakTopic(topic,system,date) { const{data}=await supabase.from('weak_topics').insert({topic,system,date_added:date}).select().single(); return data; }
async function resolveWeakTopic(id) { await supabase.from('weak_topics').update({resolved:true}).eq('id',id); }

export default function WeakTopics({currentDate,currentSystem}){
  const[topics,setTopics]=useState([]),[input,setInput]=useState(''),[system,setSystem]=useState(currentSystem||'General'),[expanded,setExpanded]=useState(false);
  useEffect(()=>{getWeakTopics().then(setTopics);},[]);
  const add=async()=>{if(!input.trim())return;const r=await addWeakTopic(input.trim(),system,currentDate);if(r){setTopics(p=>[r,...p]);setInput('');}};
  const resolve=async id=>{await resolveWeakTopic(id);setTopics(p=>p.filter(t=>t.id!==id));};
  const urgent=topics.filter(t=>{const days=Math.floor((new Date()-new Date(t.date_added+'T12:00:00'))/86400000);return days>=3&&!t.last_reviewed;});
  return(
    <div style={{background:'#fff',borderRadius:14,border:'1px solid #E5E7EB',overflow:'hidden'}}>
      <button onClick={()=>setExpanded(e=>!e)} style={{width:'100%',padding:'12px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:12,fontWeight:700,color:'#374151',textTransform:'uppercase',letterSpacing:'0.06em'}}>Weak Topics</span>
          {topics.length>0&&<span style={{fontSize:11,fontWeight:700,background:urgent.length>0?'#FEF2F2':'#F3F4F6',color:urgent.length>0?'#DC2626':'#6B7280',padding:'1px 7px',borderRadius:20}}>{topics.length}</span>}
          {urgent.length>0&&<span style={{fontSize:10,fontWeight:700,background:'#FEF2F2',color:'#DC2626',padding:'1px 7px',borderRadius:20}}>⚠ {urgent.length} due</span>}
        </div>
        <span style={{color:'#9CA3AF',fontSize:12}}>{expanded?'▲':'▼'}</span>
      </button>
      {expanded&&(
        <div style={{borderTop:'1px solid #F3F4F6'}}>
          <div style={{padding:'10px 14px',display:'flex',gap:6,borderBottom:'1px solid #F9FAFB'}}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()} placeholder="Flag a weak topic..." style={{flex:1,padding:'6px 10px',borderRadius:7,border:'1px solid #E5E7EB',fontSize:13,fontFamily:'inherit',outline:'none'}}/>
            <select value={system} onChange={e=>setSystem(e.target.value)} style={{padding:'6px 8px',borderRadius:7,border:'1px solid #E5E7EB',fontSize:12,fontFamily:'inherit',background:'#fff',outline:'none',color:'#374151'}}>
              {SYSTEMS.map(s=><option key={s}>{s}</option>)}
            </select>
            <button onClick={add} style={{background:'#EF4444',color:'#fff',border:'none',borderRadius:7,padding:'6px 12px',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Flag</button>
          </div>
          {topics.length===0?<div style={{padding:'16px',textAlign:'center',fontSize:12,color:'#9CA3AF'}}>No weak topics flagged yet</div>:(
            <div style={{maxHeight:220,overflowY:'auto'}}>
              {topics.map(t=>{const daysOld=Math.floor((new Date()-new Date(t.date_added+'T12:00:00'))/86400000),needsReview=daysOld>=3&&!t.last_reviewed;return(
                <div key={t.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 14px',borderBottom:'1px solid #F9FAFB',background:needsReview?'#FFF9F9':'#fff'}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:500,color:'#111827'}}>{t.topic}</div>
                    <div style={{fontSize:11,color:'#9CA3AF',marginTop:1}}>{t.system} · {daysOld===0?'today':`${daysOld}d ago`}{needsReview&&<span style={{color:'#DC2626',fontWeight:600,marginLeft:6}}>· review now</span>}</div>
                  </div>
                  <button onClick={()=>resolve(t.id)} style={{background:'#F0FFF4',color:'#065F46',border:'1px solid #BBF7D0',borderRadius:6,padding:'3px 8px',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>✓ Done</button>
                </div>
              );})}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
