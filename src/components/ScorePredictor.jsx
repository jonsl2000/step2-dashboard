export default function ScorePredictor({scores}){
  if(!scores||scores.length===0)return null;
  const valid=scores.filter(s=>s.score&&s.date_taken).sort((a,b)=>new Date(a.date_taken)-new Date(b.date_taken));
  if(valid.length===0)return null;
  const TARGET=270,EXAM=new Date('2026-06-12');
  const corrected=valid.map(s=>{let score=s.score;if(s.exam_name==='UWSA 1')score-=5;if(s.exam_name==='UWSA 2')score-=3;return{...s,cs:score,date:new Date(s.date_taken+'T12:00:00')};});
  const n=corrected.length,weights=corrected.map((_,i)=>Math.pow(1.5,i)),tw=weights.reduce((a,b)=>a+b,0);
  const start=corrected[0].date,xv=corrected.map(s=>(s.date-start)/86400000),yv=corrected.map(s=>s.cs);
  let pred=null,slope=null,ci=null;
  if(n===1){pred=yv[0];ci=15;}
  else{
    const wx=xv.reduce((s,x,i)=>s+weights[i]*x,0)/tw,wy=yv.reduce((s,y,i)=>s+weights[i]*y,0)/tw;
    const sxx=xv.reduce((s,x,i)=>s+weights[i]*Math.pow(x-wx,2),0),sxy=xv.reduce((s,x,i)=>s+weights[i]*(x-wx)*(yv[i]-wy),0);
    slope=sxx>0?sxy/sxx:0;const intercept=wy-slope*wx;
    pred=Math.round(intercept+slope*((EXAM-start)/86400000));
    const res=yv.map((y,i)=>y-(intercept+slope*xv[i])),rmse=Math.sqrt(res.reduce((s,r)=>s+r*r,0)/Math.max(n-1,1));
    ci=Math.round(rmse*(n<=2?2.5:n<=3?2.0:1.5));
  }
  pred=Math.min(280,Math.max(200,pred));
  const low=Math.max(200,pred-ci),high=Math.min(280,pred+ci),onTrack=pred>=TARGET;
  const trend=slope!==null?(slope>0.3?'improving':slope<-0.3?'declining':'stable'):'insufficient data';
  const ptsPerWeek=slope?(slope*7).toFixed(1):null;
  const color=onTrack?'#10B981':pred>=TARGET-10?'#F97316':'#EF4444';
  return(
    <div style={{background:'#fff',borderRadius:14,border:`1px solid ${onTrack?'#BBF7D0':'#FED7AA'}`,padding:'16px 18px'}}>
      <div style={{fontSize:11,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:12}}>Score prediction — Jun 12</div>
      <div style={{display:'flex',alignItems:'flex-end',gap:16,marginBottom:14}}>
        <div>
          <div style={{fontSize:40,fontWeight:700,letterSpacing:'-0.03em',color,lineHeight:1,fontVariantNumeric:'tabular-nums'}}>{pred}</div>
          <div style={{fontSize:12,color:'#9CA3AF',marginTop:2}}>predicted score</div>
        </div>
        <div style={{flex:1,paddingBottom:4}}>
          <div style={{fontSize:11,color:'#9CA3AF',marginBottom:4}}>Range: {low}–{high} · {n===1?'wide CI (1 exam)':n===2?'moderate CI (2 exams)':'narrowing'}</div>
          <div style={{position:'relative',height:8,background:'#F3F4F6',borderRadius:4,overflow:'hidden'}}>
            <div style={{position:'absolute',left:`${((low-200)/80)*100}%`,width:`${((high-low)/80)*100}%`,height:'100%',background:color,opacity:0.25,borderRadius:4}}/>
            <div style={{position:'absolute',left:`${((pred-200)/80)*100}%`,width:3,height:'100%',background:color,borderRadius:2}}/>
            <div style={{position:'absolute',left:`${((270-200)/80)*100}%`,width:2,height:'100%',background:'#6B7280',opacity:0.4}}/>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:3}}>
            <span style={{fontSize:9,color:'#9CA3AF'}}>200</span>
            <span style={{fontSize:9,color:'#6B7280',fontWeight:600}}>270 target</span>
            <span style={{fontSize:9,color:'#9CA3AF'}}>280</span>
          </div>
        </div>
      </div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        <div style={{background:'#F9FAFB',borderRadius:8,padding:'6px 10px',border:'1px solid #F3F4F6'}}>
          <div style={{fontSize:9,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.06em'}}>Trend</div>
          <div style={{fontSize:12,fontWeight:700,color:trend==='improving'?'#10B981':trend==='declining'?'#EF4444':'#6B7280'}}>{trend==='improving'?'↑':trend==='declining'?'↓':'→'} {trend}</div>
        </div>
        {ptsPerWeek&&parseFloat(ptsPerWeek)!==0&&(
          <div style={{background:'#F9FAFB',borderRadius:8,padding:'6px 10px',border:'1px solid #F3F4F6'}}>
            <div style={{fontSize:9,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.06em'}}>Per week</div>
            <div style={{fontSize:12,fontWeight:700,color:parseFloat(ptsPerWeek)>0?'#10B981':'#EF4444'}}>{parseFloat(ptsPerWeek)>0?'+':''}{ptsPerWeek} pts</div>
          </div>
        )}
        <div style={{background:'#F9FAFB',borderRadius:8,padding:'6px 10px',border:'1px solid #F3F4F6'}}>
          <div style={{fontSize:9,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.06em'}}>To target</div>
          <div style={{fontSize:12,fontWeight:700,color:onTrack?'#10B981':'#F97316'}}>{onTrack?'On track ✓':`+${TARGET-pred} pts needed`}</div>
        </div>
      </div>
      {n<3&&<div style={{marginTop:10,fontSize:11,color:'#9CA3AF',fontStyle:'italic',lineHeight:1.5}}>Prediction becomes more accurate with more scores. Log NBME 9 on Apr 4 to start.</div>}
    </div>
  );
}
