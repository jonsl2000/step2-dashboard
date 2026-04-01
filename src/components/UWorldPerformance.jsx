import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const SYSTEMS = [
  {name:'Cardiovascular',total:207},{name:'Pulmonary & Critical Care',total:159},{name:'Neurology',total:285},
  {name:'Gastrointestinal & Nutrition',total:272},{name:'OB/GYN',total:276},{name:'Psychiatry/Behavioral',total:177},
  {name:'Renal & Electrolytes',total:136},{name:'Infectious Diseases',total:168},{name:'Endocrine & Metabolism',total:95},
  {name:'Hematology & Oncology',total:113},{name:'Rheumatology/Orthopedics',total:169},{name:'Surgery / EM',total:98},
  {name:'Dermatology',total:98},{name:'Pediatrics',total:308},{name:'Ethics/QI/Biostats',total:56},
];

async function getPerf(){const{data}=await supabase.from('uworld_performance').select('*');return data||[];}
async function upsertPerf(systemName,correctPct,questionsDone,questionsTotal){const{data}=await supabase.from('uworld_performance').upsert({system_name:systemName,correct_pct:correctPct,questions_done:questionsDone,questions_total:questionsTotal,updated_at:new Date().toISOString()},{onConflict:'system_name'}).select().single();return data;}
function getColor(pct){if(pct>=70)return{bg:'#F0FFF4',bar:'#10B981',text:'#065F46'};if(pct>=55)return{bg:'#FFF7ED',bar:'#F97316',text:'#C2410C'};return{bg:'#FEF2F2',bar:'#EF4444',text:'#DC2626'};}

export default function UWorldPerformance(){
  const[perf,setPerf]=useState([]),[editing,setEditing]=useState(null),[form,setForm]=useState({pct:'',done:'',total:''}),[expanded,setExpanded]=useState(false);
  useEffect(()=>{getPerf().then(setPerf);},[]);
  const perfMap={};perf.forEach(p=>{perfMap[p.system_name]=p;});
  const save=async(systemName,total)=>{const r=await upsertPerf(systemName,parseFloat(form.pct)||null,parseInt(form.done)||0,parseInt(form.total)||total);if(r){setPerf(p=>[...p.filter(x=>x.system_name!==systemName),r]);}setEditing(null);setForm({pct:'',done:'',total:''});};
  const entered=SYSTEMS.filter(s=>perfMap[s.name]?.correct_pct!=null);
  const avg=entered.length>0?entered.reduce((sum,s)=>sum+(perfMap[s.name]?.correct_pct||0),0)/entered.length:null;
  return(
    <div style={{background:'#fff',borderRadius:14,border:'1px solid #E5E7EB',overflow:'hidden'}}>
      <button onClick={()=>setExpanded(e=>!e)} style={{width:'100%',padding:'12px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:12,fontWeight:700,color:'#374151',textTransform:'uppercase',letterSpacing:'0.06em'}}>UWorld % by System</span>
          {avg!==null&&<span style={{fontSize:12,fontWeight:700,color:getColor(avg).text,background:getColor(avg).bg,padding:'2px 8px',borderRadius:20}}>avg {avg.toFixed(0)}%</span>}
        </div>
        <span style={{color:'#9CA3AF',fontSize:12}}>{expanded?'▲':'▼'}</span>
      </button>
      {expanded&&(
        <div style={{borderTop:'1px solid #F3F4F6'}}>
          <div style={{padding:'8px 14px',fontSize:11,color:'#9CA3AF',borderBottom:'1px solid #F9FAFB'}}>Click any system to log your % correct. Red = needs work, orange = improving, green = solid.</div>
          {SYSTEMS.map(sys=>{
            const p=perfMap[sys.name],hasPct=p?.correct_pct!=null,colors=hasPct?getColor(p.correct_pct):{bg:'#F9FAFB',bar:'#E5E7EB',text:'#9CA3AF'},isEditing=editing===sys.name;
            return(
              <div key={sys.name} style={{borderBottom:'1px solid #F9FAFB'}}>
                <div onClick={()=>{if(!isEditing){setEditing(sys.name);setForm({pct:p?.correct_pct||'',done:p?.questions_done||'',total:p?.questions_total||sys.total});}}} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 14px',cursor:'pointer',background:isEditing?'#F9FAFB':'#fff'}}>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                      <span style={{fontSize:12,fontWeight:500,color:'#111827'}}>{sys.name}</span>
                      <span style={{fontSize:12,fontWeight:700,color:colors.text}}>{hasPct?`${p.correct_pct.toFixed(0)}%`:'—'}</span>
                    </div>
                    <div style={{height:5,background:'#F3F4F6',borderRadius:3,overflow:'hidden'}}>
                      {hasPct&&<div style={{height:'100%',width:`${p.correct_pct}%`,background:colors.bar,borderRadius:3,transition:'width .4s'}}/>}
                    </div>
                    {p?.questions_done>0&&<div style={{fontSize:10,color:'#9CA3AF',marginTop:2}}>{p.questions_done}/{p.questions_total||sys.total} done</div>}
                  </div>
                </div>
                {isEditing&&(
                  <div style={{padding:'10px 14px',background:'#F9FAFB',display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
                    <input type="number" min="0" max="100" placeholder="% correct" value={form.pct} onChange={e=>setForm(f=>({...f,pct:e.target.value}))} style={{width:90,padding:'5px 8px',borderRadius:7,border:'1px solid #E5E7EB',fontSize:13,fontFamily:'inherit',outline:'none'}}/>
                    <input type="number" placeholder="Qs done" value={form.done} onChange={e=>setForm(f=>({...f,done:e.target.value}))} style={{width:80,padding:'5px 8px',borderRadius:7,border:'1px solid #E5E7EB',fontSize:13,fontFamily:'inherit',outline:'none'}}/>
                    <span style={{fontSize:12,color:'#9CA3AF'}}>of {sys.total}</span>
                    <button onClick={()=>save(sys.name,sys.total)} style={{background:'#111827',color:'#fff',border:'none',borderRadius:7,padding:'5px 12px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Save</button>
                    <button onClick={()=>setEditing(null)} style={{background:'none',border:'1px solid #E5E7EB',borderRadius:7,padding:'5px 10px',fontSize:12,cursor:'pointer',fontFamily:'inherit',color:'#6B7280'}}>Cancel</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
