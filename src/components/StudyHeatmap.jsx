export default function StudyHeatmap({logs}){
  const START=new Date('2026-03-31T12:00:00'),END=new Date('2026-06-12T12:00:00');
  const logMap={};logs.forEach(l=>{logMap[l.date]=l.hours_studied||0;});
  const days=[];let d=new Date(START);
  while(d<=END){const ds=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');days.push({date:ds,hours:logMap[ds]||0,dow:d.getDay()});d=new Date(d.getTime()+86400000);}
  const getColor=h=>{if(h===0)return'#F3F4F6';if(h<2)return'#BBF7D0';if(h<4)return'#4ADE80';if(h<6)return'#16A34A';return'#14532D';};
  const studied=days.filter(d=>d.hours>0),totalHrs=days.reduce((s,d)=>s+d.hours,0),avg=studied.length>0?totalHrs/studied.length:0;
  const today=new Date();today.setHours(0,0,0,0);
  let cur=0,longest=0,streak=0;
  for(let i=0;i<days.length;i++){const dd=new Date(days[i].date+'T12:00:00');if(dd>today)break;if(days[i].hours>0){streak++;longest=Math.max(longest,streak);}else{streak=0;}}
  cur=streak;
  const startDow=START.getDay(),cells=Array(startDow).fill(null).concat(days),weeks=[];
  for(let i=0;i<cells.length;i+=7)weeks.push(cells.slice(i,i+7));
  const monthLabels=['Mar','Apr','May','Jun'],monthPos=[];let lastM=-1;
  weeks.forEach((week,wi)=>{week.forEach(day=>{if(!day)return;const m=new Date(day.date+'T12:00:00').getMonth();if(m!==lastM){monthPos.push({wi,label:monthLabels[m-2]});lastM=m;}});});
  const CELL=11,GAP=2;
  const pastDays=days.filter(d=>new Date(d.date+'T12:00:00')<=today);
  const pctStudied=pastDays.length>0?Math.round((pastDays.filter(d=>d.hours>0).length/pastDays.length)*100):0;
  return(
    <div style={{background:'#fff',borderRadius:14,border:'1px solid #E5E7EB',padding:'16px 18px'}}>
      <div style={{fontSize:11,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:12}}>Study heatmap — Mar 31 to Jun 12</div>
      <div style={{display:'flex',marginBottom:4,paddingLeft:18}}>
        {weeks.map((_,wi)=>{const mp=monthPos.find(m=>m.wi===wi);return<div key={wi} style={{width:CELL+GAP,fontSize:9,color:'#9CA3AF',fontWeight:500}}>{mp?mp.label:''}</div>;})}
      </div>
      <div style={{display:'flex',gap:GAP}}>
        <div style={{display:'flex',flexDirection:'column',gap:GAP,marginRight:2}}>
          {['S','M','T','W','T','F','S'].map((d,i)=><div key={i} style={{width:12,height:CELL,fontSize:8,color:'#9CA3AF',display:'flex',alignItems:'center'}}>{i%2===1?d:''}</div>)}
        </div>
        {weeks.map((week,wi)=>(
          <div key={wi} style={{display:'flex',flexDirection:'column',gap:GAP}}>
            {week.map((day,di)=>(
              <div key={di} title={day?`${day.date}: ${day.hours}h`:''}
                style={{width:CELL,height:CELL,borderRadius:2,background:day?getColor(day.hours):'transparent',cursor:day?'pointer':'default'}}/>
            ))}
          </div>
        ))}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:4,marginTop:8,justifyContent:'flex-end'}}>
        <span style={{fontSize:10,color:'#9CA3AF'}}>Less</span>
        {['#F3F4F6','#BBF7D0','#4ADE80','#16A34A','#14532D'].map(c=><div key={c} style={{width:10,height:10,borderRadius:2,background:c}}/>)}
        <span style={{fontSize:10,color:'#9CA3AF'}}>More</span>
      </div>
      <div style={{display:'flex',gap:20,marginTop:12,paddingTop:12,borderTop:'1px solid #F3F4F6',flexWrap:'wrap'}}>
        {[['Days studied',studied.length],['Current streak',`${cur}d`],['Longest streak',`${longest}d`],['Avg hrs/day',avg.toFixed(1)],['% days studied',`${pctStudied}%`]].map(([label,value])=>(
          <div key={label} style={{textAlign:'center'}}>
            <div style={{fontSize:16,fontWeight:700,color:'#111827',fontVariantNumeric:'tabular-nums'}}>{value}</div>
            <div style={{fontSize:10,color:'#9CA3AF',marginTop:1}}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
