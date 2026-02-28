import { useState, useRef, useEffect } from "react";
import { FileText, Ruler, Receipt, BookOpen, BarChart3, ClipboardList, Search, Wrench, FolderOpen, PenLine, Upload, Plus, ChevronRight, ChevronDown, X, Check, AlertTriangle, ArrowRight, Printer, ArrowUpRight, DollarSign } from "lucide-react";

// ═══ RATE DATA ═══
const RATES = {
  "Preliminaries": [
    { item: "Site Establishment & Fencing", unit: "fixed", rate: 4500, qty: 1 },
    { item: "Temporary Amenities", unit: "fixed", rate: 3200, qty: 1 },
    { item: "Site Clean (Ongoing)", unit: "weeks", rate: 450, qty: 20 },
    { item: "Skip Bins & Waste", unit: "fixed", rate: 6500, qty: 1 },
    { item: "Surveyor", unit: "fixed", rate: 3500, qty: 1 },
    { item: "Engineer Inspections", unit: "fixed", rate: 4200, qty: 1 },
    { item: "Building Permit & Insurance", unit: "fixed", rate: 8500, qty: 1 },
  ],
  "Demolition & Earthworks": [
    { item: "Demolition (Partial)", unit: "m²", rate: 85, qty: 0 },
    { item: "Demolition (Full)", unit: "m²", rate: 55, qty: 0 },
    { item: "Site Cut & Fill", unit: "m³", rate: 45, qty: 0 },
    { item: "Excavation (Footings)", unit: "lm", rate: 65, qty: 0 },
    { item: "Retaining Walls", unit: "lm", rate: 320, qty: 0 },
  ],
  "Concrete & Slab": [
    { item: "Waffle Pod Slab", unit: "m²", rate: 165, qty: 0 },
    { item: "Raft Slab", unit: "m²", rate: 185, qty: 0 },
    { item: "Suspended Slab", unit: "m²", rate: 280, qty: 0 },
    { item: "Concrete Pumping", unit: "fixed", rate: 2800, qty: 0 },
    { item: "Screw Piles", unit: "each", rate: 550, qty: 0 },
  ],
  "Framing & Structure": [
    { item: "Timber Frame (Single)", unit: "m²", rate: 110, qty: 0 },
    { item: "Timber Frame (Double)", unit: "m²", rate: 135, qty: 0 },
    { item: "Steel Beams / Lintels", unit: "fixed", rate: 8500, qty: 0 },
    { item: "Roof Trusses", unit: "m²", rate: 75, qty: 0 },
  ],
  "Roofing & Cladding": [
    { item: "Colorbond Roofing", unit: "m²", rate: 68, qty: 0 },
    { item: "Tile Roofing", unit: "m²", rate: 85, qty: 0 },
    { item: "Fascia & Guttering", unit: "lm", rate: 55, qty: 0 },
    { item: "Render Cladding", unit: "m²", rate: 95, qty: 0 },
    { item: "Brick Veneer", unit: "m²", rate: 110, qty: 0 },
  ],
  "Windows & Doors": [
    { item: "Windows (Standard)", unit: "each", rate: 850, qty: 0 },
    { item: "Windows (Large)", unit: "each", rate: 2200, qty: 0 },
    { item: "Sliding Doors (3m)", unit: "each", rate: 3500, qty: 0 },
    { item: "Front Entry Door", unit: "each", rate: 3200, qty: 0 },
    { item: "Internal Doors", unit: "each", rate: 650, qty: 0 },
  ],
  "Electrical": [
    { item: "Rough-In", unit: "points", rate: 120, qty: 0 },
    { item: "Fit-Off", unit: "points", rate: 85, qty: 0 },
    { item: "Switchboard Upgrade", unit: "fixed", rate: 3200, qty: 0 },
    { item: "Downlights", unit: "each", rate: 95, qty: 0 },
  ],
  "Plumbing & Gas": [
    { item: "Rough-In", unit: "points", rate: 450, qty: 0 },
    { item: "Fit-Off", unit: "points", rate: 320, qty: 0 },
    { item: "Stormwater", unit: "fixed", rate: 5500, qty: 0 },
    { item: "Hot Water System", unit: "each", rate: 2400, qty: 0 },
  ],
  "Internal Linings": [
    { item: "Plasterboard", unit: "m²", rate: 42, qty: 0 },
    { item: "Insulation (Walls)", unit: "m²", rate: 18, qty: 0 },
    { item: "Cornices", unit: "lm", rate: 16, qty: 0 },
    { item: "Skirting & Architraves", unit: "lm", rate: 28, qty: 0 },
  ],
  "Kitchen": [
    { item: "Cabinetry (Premium)", unit: "lm", rate: 2200, qty: 0 },
    { item: "Stone Benchtop 40mm", unit: "lm", rate: 950, qty: 0 },
    { item: "Splashback", unit: "m²", rate: 180, qty: 0 },
    { item: "Appliances Allowance", unit: "fixed", rate: 8500, qty: 0 },
  ],
  "Bathroom & Ensuite": [
    { item: "Bathroom (Premium)", unit: "each", rate: 32000, qty: 0 },
    { item: "Ensuite (Premium)", unit: "each", rate: 28000, qty: 0 },
    { item: "Powder Room", unit: "each", rate: 9500, qty: 0 },
    { item: "Waterproofing", unit: "m²", rate: 65, qty: 0 },
  ],
  "Painting & Finishes": [
    { item: "Internal Paint", unit: "m²", rate: 18, qty: 0 },
    { item: "External Paint", unit: "m²", rate: 28, qty: 0 },
    { item: "Timber Flooring", unit: "m²", rate: 120, qty: 0 },
    { item: "Carpet", unit: "m²", rate: 65, qty: 0 },
  ],
  "External & Landscaping": [
    { item: "Driveway (Concrete)", unit: "m²", rate: 110, qty: 0 },
    { item: "Decking (Merbau)", unit: "m²", rate: 280, qty: 0 },
    { item: "Fencing", unit: "lm", rate: 120, qty: 0 },
    { item: "Landscaping Allowance", unit: "fixed", rate: 15000, qty: 0 },
  ],
};
const MILESTONES=[
  {name:"Deposit",wk:0},{name:"Permits Approved",wk:4},{name:"Slab Poured",wk:8},
  {name:"Frame Up",wk:12},{name:"Lock Up",wk:18},{name:"Rough-In Complete",wk:22},
  {name:"Fix Stage",wk:28},{name:"Practical Completion",wk:34},{name:"Handover",wk:36}
];
const STAGES=["Lead","Quote","Approved","Active","Invoiced","Complete"];
const WEATHER=["Clear","Partly Cloudy","Overcast","Rain","Storm"];
const fmt=n=>new Intl.NumberFormat("en-AU",{style:"currency",currency:"AUD",minimumFractionDigits:0,maximumFractionDigits:0}).format(n);
const uid=()=>Math.random().toString(36).slice(2,8).toUpperCase();
const ds=()=>new Date().toLocaleDateString("en-AU",{day:"numeric",month:"short",year:"numeric"});
const ts=()=>new Date().toLocaleTimeString("en-AU",{hour:"numeric",minute:"2-digit"});
const mkScope=()=>{const s={};Object.entries(RATES).forEach(([c,i])=>{s[c]=i.map(x=>({...x,on:false,actual:0}))});return s};
const pName=(pr)=>pr.client?(pr.suburb?`${pr.client} \u2014 ${pr.suburb}`:pr.client):"New Project";
const sIdx=s=>STAGES.indexOf(s);
const mkProject=()=>({id:uid(),status:"Lead",created:ds(),client:"",email:"",phone:"",address:"",suburb:"",assignedTo:"",type:"New Build",stories:"Single Storey",area:"",validDays:30,scope:mkScope(),margin:18,contingency:5,notes:"",variations:[],invoices:[],proposals:[],milestones:MILESTONES.map(m=>({name:m.name,wk:m.wk,done:false,date:"",planned:""})),trades:[],diary:[],defects:[],sigData:null,activity:[{action:"Project created",time:ts(),date:ds()}]});

// ═══════════════════════════════════════════════
// DESIGN SYSTEM — Buildxact-inspired clean professional
// ═══════════════════════════════════════════════
const _ = {
  bg:"#f0f2f5",
  surface:"#ffffff",
  raised:"#ffffff",
  well:"#f4f5f7",
  line:"#DFE1E6",
  line2:"#C1C7D0",
  ink:"#172B4D",
  body:"#5E6C84",
  muted:"#97A0AF",
  faint:"#C1C7D0",
  ac:"#0066FF",
  acDark:"#0052CC",
  acLight:"#DEEBFF",
  acBorder:"#B3D4FF",
  green:"#36B37E",greenBg:"#E3FCEF",
  red:"#FF5630",redBg:"#FFEBE6",
  amber:"#FFAB00",amberBg:"#FFFAE6",
  blue:"#0066FF",blueBg:"#DEEBFF",
  violet:"#6554C0",
  s1:4,s2:8,s3:12,s4:16,s5:20,s6:24,s7:32,s8:40,s9:48,s10:64,
  r:"8px",rSm:"6px",rXs:"4px",rFull:"999px",
};

const input = {
  width:"100%",padding:"8px 12px",background:"#fff",border:`1px solid ${_.line}`,
  borderRadius:_.rXs,color:_.ink,fontSize:14,fontFamily:"inherit",outline:"none",
  transition:"all 0.15s",
};
const label = {
  fontSize:11,color:_.muted,marginBottom:4,display:"block",fontWeight:600,
  letterSpacing:"0.04em",textTransform:"uppercase",
};
const btnPrimary = {
  padding:"8px 16px",background:_.ac,color:"#fff",border:"none",borderRadius:_.rSm,
  fontSize:13,fontWeight:600,cursor:"pointer",transition:"all 0.15s",
  display:"inline-flex",alignItems:"center",gap:6,
};
const btnSecondary = {
  ...btnPrimary,background:_.well,color:_.body,border:`1px solid ${_.line}`,
};
const btnGhost = {
  ...btnPrimary,background:"transparent",color:_.body,padding:"8px 12px",
};
const card = {background:_.surface,borderRadius:_.r,border:`1px solid ${_.line}`,padding:24};
const stCol=s=>s==="Active"||s==="Invoiced"?_.green:s==="Approved"?_.blue:s==="Complete"?_.ac:s==="Quote"?_.violet:_.amber;
const stBg=s=>s==="Active"||s==="Invoiced"?_.greenBg:s==="Approved"?_.blueBg:s==="Complete"?_.acLight:s==="Quote"?"#EAE6FF":_.amberBg;
const badge=(c,bg)=>({fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:_.rFull,background:bg||`${c}15`,color:c});

const NAV_ITEMS=[
  {group:"PROJECT",items:[
    {id:"dash",l:"Overview",Ic:BarChart3},{id:"quote",l:"Quote",Ic:PenLine},
    {id:"plans",l:"Plans AI",Ic:Ruler},{id:"costs",l:"Costs",Ic:DollarSign},
    {id:"schedule",l:"Schedule",Ic:ClipboardList},
  ]},
  {group:"DOCUMENTS",items:[
    {id:"proposal",l:"Proposals",Ic:FileText},{id:"variations",l:"Variations",Ic:ArrowUpRight},
    {id:"invoices",l:"Invoices",Ic:Receipt},
  ]},
  {group:"SITE",items:[
    {id:"diary",l:"Diary",Ic:BookOpen},{id:"defects",l:"Defects",Ic:AlertTriangle},
    {id:"trades",l:"Trades",Ic:Wrench},
  ]},
  {group:"TOOLS",items:[
    {id:"templates",l:"Templates",Ic:FolderOpen},
  ]},
];

// ═══ Stable components — MUST live outside IBuild to avoid remount on every keystroke ═══
const Empty=({icon:Ic,text,action,actionText})=>(
  <div style={{textAlign:"center",padding:`${_.s10}px ${_.s6}px`}}>
    {Ic&&<div style={{marginBottom:_.s4,display:"flex",justifyContent:"center"}}><Ic size={36} strokeWidth={1} color={_.faint} /></div>}
    <div style={{fontSize:15,color:_.muted,lineHeight:1.5}}>{text}</div>
    {action&&<button onClick={action} style={{...btnPrimary,marginTop:_.s5}}>{actionText} <ArrowRight size={14} /></button>}
  </div>
);
const Section=({children})=>(<div style={{animation:"fadeUp 0.3s ease",maxWidth:960}}>{children}</div>);

function calc(p){
  const sub=Object.values(p.scope).flat().filter(i=>i.on).reduce((t,i)=>t+i.rate*i.qty,0);
  const mar=sub*(p.margin/100),con=sub*(p.contingency/100),gst=(sub+mar+con)*0.1;
  const orig=sub+mar+con+gst;
  const aV=p.variations.filter(v=>v.status==="approved").reduce((t,v)=>t+v.amount,0);
  const curr=orig+aV;
  const inv=p.invoices.reduce((t,x)=>t+x.amount,0);
  const paid=p.invoices.filter(x=>x.status==="paid").reduce((t,x)=>t+x.amount,0);
  const act=Object.values(p.scope).flat().filter(i=>i.on).reduce((t,i)=>t+(i.actual||0),0);
  const cT=(sc,c2)=>sc[c2].filter(i=>i.on).reduce((t,i)=>t+i.rate*i.qty,0);
  const cA=(sc,c2)=>sc[c2].filter(i=>i.on).reduce((t,i)=>t+(i.actual||0),0);
  const cats=Object.entries(p.scope).filter(([,i])=>i.some(x=>x.on));
  const items=Object.values(p.scope).flat().filter(i=>i.on).length;
  return{sub,mar,con,gst,orig,aV,curr,inv,paid,act,cT,cA,cats,items};
}

// ═══════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════
export default function IBuild(){
  const [projects,setProjects]=useState([mkProject()]);
  const [ai,setAi]=useState(0);
  const [tab,setTab]=useState("dash");
  const [exp,setExp]=useState({});
  const [planLoad,setPlanLoad]=useState(false);
  const [planImg,setPlanImg]=useState(null);
  const [planData,setPlanData]=useState(null);
  const [tpl,setTpl]=useState([]);
  const [tplName,setTplName]=useState("");
  const [invPct,setInvPct]=useState("");
  const [invDesc,setInvDesc]=useState("");
  const [voView,setVoView]=useState(null);
  const [voSignAs,setVoSignAs]=useState("builder");
  const [invView,setInvView]=useState(null);
  const [propView,setPropView]=useState(null);
  const [sw,setSw]=useState(false);
  const [voForm,setVoForm]=useState({desc:"",cat:"",amount:"",reason:""});
  const [trForm,setTrForm]=useState({trade:"",company:"",contact:"",phone:""});
  const [diaryForm,setDiaryForm]=useState({date:"",weather:"Clear",trades:"",notes:""});
  const [defectForm,setDefectForm]=useState({location:"",desc:"",assignee:""});
  const [toast,setToast]=useState(null);
  const [anim,setAnim]=useState(0); // for tab transitions
  const [newMs,setNewMs]=useState("");

  const sigRef=useRef(null),sigCtx=useRef(null),sigDr=useRef(false);
  const voSigRef=useRef(null),voSigCtx=useRef(null),voSigDr=useRef(false);
  const propRef=useRef(null),voDocRef=useRef(null),invDocRef=useRef(null);

  const p=projects[ai];
  const up=fn=>setProjects(pv=>pv.map((x,i)=>i===ai?fn(JSON.parse(JSON.stringify(x))):x));
  const T=calc(p);
  const notify=(msg,type="ok")=>{setToast({msg,type});setTimeout(()=>setToast(null),2200)};
  const go=t2=>{setTab(t2);setVoView(null);setInvView(null);setPropView(null);setAnim(a=>a+1)};
  const log=action=>up(pr=>{pr.activity.unshift({action,time:ts(),date:ds()});if(pr.activity.length>30)pr.activity=pr.activity.slice(0,30);return pr});

  useEffect(()=>{(async()=>{try{const r=await window.storage.get("ibt8");if(r?.value)setTpl(JSON.parse(r.value))}catch{}})()},[]);
  const saveTpl=async t2=>{setTpl(t2);try{await window.storage.set("ibt8",JSON.stringify(t2))}catch{}};
  const uI=(cat,idx,k,v)=>up(pr=>{pr.scope[cat][idx][k]=v;if(k==="on"&&v&&!pr.scope[cat][idx].qty)pr.scope[cat][idx].qty=1;return pr});
  const addC=cat=>up(pr=>{pr.scope[cat].push({item:"Custom Item",unit:"fixed",rate:0,qty:1,on:true,actual:0,custom:true});return pr});

  const mkCv=(ref,ctx)=>el=>{if(!el)return;ref.current=el;const c2=el.getContext("2d");c2.strokeStyle=_.ink;c2.lineWidth=2;c2.lineCap="round";c2.lineJoin="round";ctx.current=c2};
  const cvH=(ref,ctx,dr,done)=>{
    const gp=e=>{const r2=ref.current.getBoundingClientRect();const ev=e.touches?e.touches[0]:e;return[ev.clientX-r2.left,ev.clientY-r2.top]};
    return{onMouseDown:e=>{dr.current=true;const[x,y]=gp(e);ctx.current.beginPath();ctx.current.moveTo(x,y)},onMouseMove:e=>{if(!dr.current)return;const[x,y]=gp(e);ctx.current.lineTo(x,y);ctx.current.stroke()},onMouseUp:()=>{dr.current=false;done?.()},onMouseLeave:()=>{dr.current=false},onTouchStart:e=>{dr.current=true;const[x,y]=gp(e);ctx.current.beginPath();ctx.current.moveTo(x,y)},onTouchMove:e=>{if(!dr.current)return;e.preventDefault();const[x,y]=gp(e);ctx.current.lineTo(x,y);ctx.current.stroke()},onTouchEnd:()=>{dr.current=false;done?.()}};
  };
  const clr=(ref,ctx)=>{if(ctx.current&&ref.current)ctx.current.clearRect(0,0,ref.current.width,ref.current.height)};
  const analysePlan=async file=>{
    setPlanLoad(true);setPlanData(null);
    try{const b64=await new Promise((r,j)=>{const fr=new FileReader();fr.onload=()=>r(fr.result.split(",")[1]);fr.onerror=j;fr.readAsDataURL(file)});const mt=file.type||"image/png";setPlanImg(`data:${mt};base64,${b64}`);
      const resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:[{type:"image",source:{type:"base64",media_type:mt,data:b64}},{type:"text",text:'Analyse this floor plan. Return ONLY JSON: {"total_m2":number,"rooms":[{"name":"string","m2":number}],"notes":"string"}.'}]}]})});
      const d=await resp.json();setPlanData(JSON.parse((d.content?.map(b=>b.text||"").join("")||"").replace(/```json|```/g,"").trim()));
    }catch(e){setPlanData({error:"Analysis failed — try a clearer image."})}setPlanLoad(false);
  };
  const printEl=ref=>{if(!ref.current)return;const w=window.open("","_blank");w.document.write('<!DOCTYPE html><html><head><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}@media print{body{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}@page{margin:0;size:A4}}</style></head><body>'+ref.current.outerHTML+'</body></html>');w.document.close();setTimeout(()=>w.print(),600)};
  const dupeProject=idx=>{const src=JSON.parse(JSON.stringify(projects[idx]));src.id=uid();src.status="Lead";src.created=ds();src.client+=" (Copy)";src.invoices=[];src.variations=[];src.milestones=MILESTONES.map(m=>({name:m.name,wk:m.wk,done:false,date:"",planned:""}));src.diary=[];src.defects=[];src.sigData=null;src.proposals=[];src.activity=[{action:"Duplicated from "+pName(projects[idx]),time:ts(),date:ds()}];setProjects(pv=>[...pv,src]);setAi(projects.length);setSw(false);go("quote");notify("Project duplicated")};

  const createProp=(name)=>{
    if(!name)name=`Proposal v${p.proposals.length+1}`;
    const newIdx=p.proposals.length;
    up(pr=>{pr.proposals.push({id:`PROP-${uid()}`,name,date:ds(),scope:JSON.parse(JSON.stringify(pr.scope)),client:pr.client,address:pr.address,suburb:pr.suburb,type:pr.type,stories:pr.stories,area:pr.area,notes:pr.notes,validDays:pr.validDays,pricing:{sub:T.sub,mar:T.mar,con:T.con,gst:T.gst,total:T.curr,margin:pr.margin,contingency:pr.contingency},sigData:null,status:"draft"});return pr});
    log("Proposal saved: "+name);notify("Proposal saved");
    setTab("proposal");setVoView(null);setInvView(null);setPropView(newIdx);setAnim(a=>a+1);
  };

  const alerts=[];
  projects.forEach((pr,idx)=>{pr.invoices.forEach(inv=>{if(inv.status==="pending")alerts.push({text:`${pName(pr)}: ${inv.desc} — ${fmt(inv.amount)}`,c:_.red,bg:_.redBg,idx,tab:"invoices"})});pr.variations.forEach(v=>{if(v.status==="draft"||v.status==="pending")alerts.push({text:`${pName(pr)}: ${v.id} needs signature`,c:_.amber,bg:_.amberBg,idx,tab:"variations"})});pr.defects.forEach(d=>{if(!d.done)alerts.push({text:`${pName(pr)}: ${d.desc}`,c:_.blue,bg:_.blueBg,idx,tab:"defects"})})});
  const allT=projects.map(pr=>({...pr,...calc(pr)}));
  const pipeV=allT.filter(x=>["Quote","Approved"].includes(x.status)).reduce((s,x)=>s+x.curr,0);
  const actV=allT.filter(x=>x.status==="Active").reduce((s,x)=>s+x.curr,0);
  const quoteReady=p.client&&T.items>0;
  const quoteSent=["Approved","Active","Invoiced","Complete"].includes(p.status);
  const recentActivity=projects.flatMap((pr,idx)=>(pr.activity||[]).slice(0,4).map(a=>({...a,project:pName(pr),idx}))).slice(0,8);
  // Pre-compute detail views (eliminates IIFEs that caused focus bugs)
  const ganttMaxWk=Math.max(...p.milestones.map(m=>m.wk||0),36);
  const ganttLastDoneIdx=[...p.milestones].reverse().findIndex(m=>m.done);
  const ganttLastDone=ganttLastDoneIdx>=0?p.milestones[p.milestones.length-1-ganttLastDoneIdx]:null;
  const ganttPct=ganttLastDone?((ganttLastDone.wk||0)/ganttMaxWk)*100:0;

  const voD=voView!==null&&p.variations[voView]?p.variations[voView]:null;
  const voCB=voView!==null?T.orig+p.variations.slice(0,voView).filter(x=>x.status==="approved").reduce((s,x)=>s+x.amount,0):0;

  const invD=invView!==null&&p.invoices[invView]?p.invoices[invView]:null;
  const invGst=invD?invD.amount/11:0;

  const propD=propView!==null&&p.proposals[propView]?p.proposals[propView]:null;
  const propDCats=propD?Object.entries(propD.scope).filter(([,items])=>items.some(x=>x.on)):[];
  const propCT=(sc,c2)=>sc[c2].filter(i=>i.on).reduce((t,i)=>t+i.rate*i.qty,0);

  // ═══════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════
  return(
    <div style={{display:"flex",height:"100vh",background:_.bg,color:_.ink,fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif"}}>

      {/* Toast */}
      {toast&&<div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",zIndex:999,padding:"10px 22px",borderRadius:_.rSm,fontSize:13,fontWeight:600,color:"#fff",background:toast.type==="error"?_.red:_.ac,boxShadow:"0 4px 12px rgba(0,0,0,0.15)",animation:"fadeUp 0.2s ease"}}>{toast.msg}</div>}

      {/* ═══ SIDEBAR ═══ */}
      <aside style={{width:240,flexShrink:0,background:_.surface,borderRight:`1px solid ${_.line}`,display:"flex",flexDirection:"column"}}>
        {/* Logo */}
        <div style={{padding:"16px 20px",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${_.line}`}}>
          <div style={{width:28,height:28,background:_.ac,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"#fff"}}>i</div>
          <span style={{fontSize:15,fontWeight:700,color:_.ink}}>iBuild</span>
        </div>

        {/* Project switcher */}
        <div style={{padding:"12px 16px",borderBottom:`1px solid ${_.line}`,position:"relative",zIndex:30}}>
          <div onClick={()=>setSw(!sw)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",background:_.well,borderRadius:_.rSm,cursor:"pointer",transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background=_.line} onMouseLeave={e=>e.currentTarget.style.background=_.well}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pName(p)}</div>
              <div style={{fontSize:11,color:_.muted,marginTop:1}}>{p.status} · {p.type}</div>
            </div>
            <ChevronDown size={14} color={_.muted} style={{flexShrink:0,transform:sw?"rotate(180deg)":"none",transition:"transform 0.15s"}} />
          </div>
          {sw&&<div style={{position:"absolute",top:"100%",left:8,right:8,background:_.surface,borderRadius:_.r,zIndex:100,boxShadow:"0 12px 36px rgba(0,0,0,0.12),0 0 0 1px rgba(0,0,0,0.04)",maxHeight:360,overflowY:"auto",marginTop:4}}>
            {projects.map((pr,i)=>(
              <div key={pr.id} style={{padding:"10px 14px",cursor:"pointer",background:i===ai?_.acLight:_.surface,display:"flex",justifyContent:"space-between",alignItems:"center",transition:"background 0.1s"}} onClick={()=>{setAi(i);setSw(false)}} onMouseEnter={e=>{if(i!==ai)e.currentTarget.style.background=_.well}} onMouseLeave={e=>{e.currentTarget.style.background=i===ai?_.acLight:_.surface}}>
                <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pName(pr)}</div><div style={{fontSize:11,color:_.muted,marginTop:1}}>{pr.type}{calc(pr).curr>0?` · ${fmt(calc(pr).curr)}`:""}</div></div>
                <div style={{display:"flex",gap:4,alignItems:"center",flexShrink:0}}>
                  <span style={badge(stCol(pr.status),stBg(pr.status))}>{pr.status}</span>
                  <div onClick={e=>{e.stopPropagation();dupeProject(i)}} style={{cursor:"pointer",color:_.faint,display:"flex",padding:2}} onMouseEnter={e=>e.currentTarget.style.color=_.body} onMouseLeave={e=>e.currentTarget.style.color=_.faint}><Plus size={14} /></div>
                </div>
              </div>
            ))}
            <div onClick={()=>{setProjects(pv=>[...pv,mkProject()]);setAi(projects.length);setSw(false);go("quote")}} style={{padding:"10px 14px",cursor:"pointer",color:_.ac,fontSize:13,fontWeight:600,textAlign:"center",borderTop:`1px solid ${_.line}`}}>+ New Project</div>
          </div>}
        </div>

        {/* Nav groups */}
        <div style={{flex:1,overflowY:"auto",padding:"8px 0"}}>
          {NAV_ITEMS.map(g=>(
            <div key={g.group} style={{marginBottom:12}}>
              <div style={{padding:"8px 20px",fontSize:10,fontWeight:700,color:_.muted,letterSpacing:"0.08em",textTransform:"uppercase"}}>{g.group}</div>
              {g.items.map(item=>(
                <div key={item.id} onClick={()=>go(item.id)} style={{
                  display:"flex",alignItems:"center",gap:10,padding:"7px 20px",fontSize:13,cursor:"pointer",
                  background:tab===item.id?_.acLight:"transparent",color:tab===item.id?_.ac:_.body,
                  fontWeight:tab===item.id?600:400,borderLeft:tab===item.id?`3px solid ${_.ac}`:"3px solid transparent",
                  transition:"all 0.12s",
                }} onMouseEnter={e=>{if(tab!==item.id)e.currentTarget.style.background=_.well}} onMouseLeave={e=>{if(tab!==item.id)e.currentTarget.style.background="transparent"}}>
                  <item.Ic size={16} strokeWidth={tab===item.id?2:1.5} />
                  {item.l}
                </div>
              ))}
            </div>
          ))}
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <main style={{flex:1,overflowY:"auto",padding:"32px 40px 64px"}}>

        {/* ════════════════════════════════════
            DASHBOARD
        ════════════════════════════════════ */}
        {tab==="dash"&&<Section key={anim}>
          {/* Header */}
          <div style={{marginBottom:_.s7}}>
            <div style={{fontSize:13,color:_.muted,marginBottom:_.s1}}>{ds()} · {projects.length} project{projects.length!==1?"s":""}</div>
            <h1 style={{fontSize:28,fontWeight:700,letterSpacing:"-0.02em",margin:0}}>
              Good {new Date().getHours()<12?"morning":new Date().getHours()<17?"afternoon":"evening"}.
            </h1>
          </div>

          {/* Stat cards row */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:_.s4,marginBottom:_.s7}}>
            {[["Pipeline",fmt(pipeV),`${allT.filter(x=>["Quote","Approved"].includes(x.status)).length} quotes`,_.amber],
              ["Active",fmt(actV),`${allT.filter(x=>x.status==="Active").length} jobs`,_.green],
              ["Outstanding",fmt(allT.reduce((s,x)=>s+x.inv-x.paid,0)),`${allT.reduce((s,x)=>s+x.invoices.filter(i2=>i2.status==="pending").length,0)} unpaid`,_.red],
              ["Contract",fmt(T.curr),`${T.items} items`,_.ac],
            ].map(([lb,val,sub,c])=>(
              <div key={lb} style={{...card,padding:20}}>
                <div style={{fontSize:11,color:_.muted,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:_.s2}}>{lb}</div>
                <div style={{fontSize:24,fontWeight:700,letterSpacing:"-0.02em",color:_.ink,lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{val}</div>
                <div style={{fontSize:12,color:c,fontWeight:500,marginTop:_.s1}}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Current project card */}
          <div style={{...card,borderLeft:`4px solid ${_.ac}`,marginBottom:_.s7}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:_.s4}}>
              <div>
                <div style={{fontSize:11,color:_.ac,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:_.s1}}>Current project</div>
                <div style={{fontSize:20,fontWeight:600,color:_.ink}}>{pName(p)}</div>
                {(p.address||p.assignedTo)&&<div style={{fontSize:13,color:_.muted,marginTop:2}}>{p.type}{p.area?` · ${p.area}m²`:""}{p.assignedTo?` · ${p.assignedTo}`:""}</div>}
              </div>
              <span style={badge(stCol(p.status),stBg(p.status))}>{p.status}</span>
            </div>
            <div style={{fontSize:40,fontWeight:700,letterSpacing:"-0.03em",lineHeight:1,fontVariantNumeric:"tabular-nums",marginBottom:_.s5,color:_.ink}}>{fmt(T.curr)}</div>
            {/* Stage dots */}
            <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:_.s2}}>
              {STAGES.map((s,i)=>(<div key={s} style={{display:"flex",alignItems:"center",gap:4}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:i<=sIdx(p.status)?_.ac:_.line,transition:"background 0.3s"}} title={s} />
                {i<STAGES.length-1&&<div style={{width:20,height:2,background:i<sIdx(p.status)?_.ac:_.line,transition:"background 0.3s"}} />}
              </div>))}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:_.muted,marginBottom:_.s5}}>
              {STAGES.map((s,i)=>(<span key={s} style={{color:i<=sIdx(p.status)?_.ac:_.faint,fontWeight:i===sIdx(p.status)?700:400}}>{s}</span>))}
            </div>
            <div style={{display:"flex",gap:_.s2}}>
              {!quoteReady&&<button onClick={()=>go("quote")} style={btnPrimary}>Build quote <ArrowRight size={14} /></button>}
              {quoteReady&&!quoteSent&&<button onClick={()=>createProp()} style={btnPrimary}>Generate proposal <ArrowRight size={14} /></button>}
              {quoteSent&&<button onClick={()=>go("invoices")} style={btnPrimary}>Manage invoices <ArrowRight size={14} /></button>}
              <button onClick={()=>go("quote")} style={btnGhost}>View quote</button>
            </div>
          </div>

          {/* Attention + Activity */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:_.s5,marginBottom:_.s7}}>
            <div style={card}>
              <div style={{fontSize:11,color:_.muted,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:_.s3}}>Needs attention</div>
              {alerts.length===0&&<div style={{fontSize:13,color:_.faint,padding:`${_.s3}px 0`}}>All clear</div>}
              {alerts.slice(0,4).map((a,i)=>(
                <div key={i} onClick={()=>{setAi(a.idx);go(a.tab)}} style={{padding:`${_.s2}px 0`,display:"flex",alignItems:"center",gap:_.s2,cursor:"pointer",borderBottom:i<Math.min(alerts.length,4)-1?`1px solid ${_.line}`:"none"}} onMouseEnter={e=>e.currentTarget.style.opacity="0.7"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                  <AlertTriangle size={14} color={a.c} />
                  <span style={{fontSize:13,color:_.body,lineHeight:1.4}}>{a.text}</span>
                </div>
              ))}
            </div>
            <div style={card}>
              <div style={{fontSize:11,color:_.muted,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:_.s3}}>Recent activity</div>
              {recentActivity.length===0&&<div style={{fontSize:13,color:_.faint,padding:`${_.s3}px 0`}}>No activity yet</div>}
              {recentActivity.slice(0,5).map((a,i)=>(
                <div key={i} style={{padding:`${_.s2}px 0`,display:"flex",alignItems:"center",gap:_.s2,borderBottom:i<4?`1px solid ${_.line}`:"none"}}>
                  <div style={{width:6,height:6,borderRadius:3,background:_.ac,flexShrink:0}} />
                  <div style={{flex:1}}>
                    <span style={{fontSize:13,color:_.body,lineHeight:1.4}}>{a.action}</span>
                    <div style={{fontSize:11,color:_.faint,marginTop:1}}>{a.project} · {a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:_.s3}}>
            {[[PenLine,"New quote","quote"],[Upload,"Upload plans","plans"],[Receipt,"Invoice","invoices"],[BookOpen,"Site diary","diary"]].map(([Ic,l2,t2])=>(
              <div key={l2} onClick={()=>go(t2)} style={{...card,padding:16,cursor:"pointer",textAlign:"center",transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=_.ac}} onMouseLeave={e=>{e.currentTarget.style.borderColor=_.line}}>
                <div style={{marginBottom:6,display:"flex",justifyContent:"center"}}><Ic size={20} strokeWidth={1.5} color={_.muted} /></div>
                <div style={{fontSize:12,fontWeight:500,color:_.body}}>{l2}</div>
              </div>
            ))}
          </div>
        </Section>}

        {/* ════ QUOTE — Clean guided flow ════ */}
        {tab==="quote"&&<Section key={anim}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:_.s2}}>
            <h1 style={{fontSize:28,fontWeight:600,letterSpacing:"-0.02em"}}>Quote</h1>
            {T.curr>0&&<span style={{fontSize:28,fontWeight:700,color:_.ac,letterSpacing:"-0.03em",fontVariantNumeric:"tabular-nums"}}>{fmt(T.curr)}</span>}
          </div>

          {/* Minimal step dots */}
          <div style={{display:"flex",gap:_.s6,marginBottom:_.s8,paddingBottom:_.s6,borderBottom:`1px solid ${_.line}`}}>
            {[["Details",!!p.client],["Scope",T.items>0],["Review",T.curr>0]].map(([l2,done],i)=>(
              <div key={l2} style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:20,height:20,borderRadius:10,background:done?_.green:_.well,border:done?"none":`1.5px solid ${_.line2}`,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>{done&&<Check size={11} strokeWidth={3} color="#fff" />}</div>
                <span style={{fontSize:13,fontWeight:done?600:400,color:done?_.ink:_.muted}}>{l2}</span>
              </div>
            ))}
          </div>

          {/* Client details */}
          <div style={{marginBottom:_.s8}}>
            <div style={{fontSize:11,color:_.muted,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:_.s4}}>Client & Project</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:`${_.s3}px ${_.s4}px`}}>
              {[["Client name","client","Johnson Residence"],["Email","email","client@email.com"],["Phone","phone","0412 345 678"],["Site address","address","42 Smith St"],["Suburb","suburb","Richmond"],["Assigned to","assignedTo","Site manager name"],["Build type","type",""],["Storeys","stories",""],["Floor area (m\xB2)","area","280"]].map(([l2,k,ph])=>(
                <div key={k}>
                  <label style={label}>{l2}</label>
                  {k==="type"?<select style={{...input,cursor:"pointer"}} value={p[k]} onChange={e=>up(pr=>{pr[k]=e.target.value;return pr})}>{["New Build","Extension","Renovation","Knockdown Rebuild","Townhouse","Duplex"].map(o=><option key={o}>{o}</option>)}</select>
                  :k==="stories"?<select style={{...input,cursor:"pointer"}} value={p[k]} onChange={e=>up(pr=>{pr[k]=e.target.value;return pr})}>{["Single Storey","Double Storey","Three Storey","Split Level"].map(o=><option key={o}>{o}</option>)}</select>
                  :<input style={input} value={p[k]} onChange={e=>up(pr=>{pr[k]=e.target.value;return pr})} placeholder={ph} type={k==="area"?"number":"text"} />}
                </div>
              ))}
            </div>
            <div style={{marginTop:_.s3}}><label style={label}>Notes</label><textarea style={{...input,minHeight:56,resize:"vertical"}} value={p.notes} onChange={e=>up(pr=>{pr.notes=e.target.value;return pr})} placeholder="Scope notes, special requirements..." /></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:_.s4,marginTop:_.s4}}>
              <div><label style={label}>Margin %</label><input type="number" style={{...input,textAlign:"center",fontWeight:600,fontSize:18}} value={p.margin} onChange={e=>up(pr=>{pr.margin=parseFloat(e.target.value)||0;return pr})} /></div>
              <div><label style={label}>Contingency %</label><input type="number" style={{...input,textAlign:"center",fontWeight:600,fontSize:18}} value={p.contingency} onChange={e=>up(pr=>{pr.contingency=parseFloat(e.target.value)||0;return pr})} /></div>
              <div><label style={label}>Status</label><select style={{...input,cursor:"pointer"}} value={p.status} onChange={e=>{const nv=e.target.value;up(pr=>{pr.status=nv;return pr});log("Status → "+nv)}}>{STAGES.map(s=><option key={s}>{s}</option>)}</select></div>
            </div>
          </div>

          {/* Scope — clean accordion */}
          <div style={{marginBottom:_.s8}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:_.s4}}>
              <div style={{fontSize:11,color:_.muted,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase"}}>Scope of Works</div>
              {T.items>0&&<span style={{fontSize:13,color:_.body}}>{T.items} items · {fmt(T.sub)}</span>}
            </div>
            {Object.entries(p.scope).map(([cat,items])=>{
              const open=exp[cat];const catT=items.filter(i=>i.on).reduce((t,i)=>t+i.rate*i.qty,0);const n=items.filter(i=>i.on).length;
              return(<div key={cat} style={{borderBottom:`1px solid ${_.line}`}}>
                <div onClick={()=>setExp(e2=>({...e2,[cat]:!e2[cat]}))} style={{padding:`${_.s3}px 0`,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{display:"flex",alignItems:"center",gap:_.s2}}>
                    <span style={{transform:open?"rotate(90deg)":"none",display:"inline-flex",transition:"transform 0.15s"}}><ChevronRight size={13} color={_.muted} /></span>
                    <span style={{fontSize:14,fontWeight:n>0?600:400,color:n>0?_.ink:_.muted}}>{cat}</span>
                    {n>0&&<span style={{fontSize:11,fontWeight:600,color:_.ac,background:_.acLight,padding:"1px 7px",borderRadius:_.rFull}}>{n}</span>}
                  </div>
                  {catT>0&&<span style={{fontSize:14,fontWeight:600,fontVariantNumeric:"tabular-nums"}}>{fmt(catT)}</span>}
                </div>
                {open&&<div style={{paddingBottom:_.s4,paddingLeft:_.s6}}>
                  {items.map((item,idx)=>(
                    <div key={idx} style={{display:"flex",gap:_.s2,alignItems:"center",padding:`5px 0`}}>
                      <div onClick={()=>uI(cat,idx,"on",!item.on)} style={{width:18,height:18,borderRadius:5,border:`1.5px solid ${item.on?_.ac:_.line2}`,background:item.on?_.ac:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}>{item.on&&<Check size={11} strokeWidth={3} color="#fff" />}</div>
                      <span style={{flex:1,fontSize:13,color:item.on?_.ink:_.muted}}>{item.item}</span>
                      {item.on&&<>
                        <input type="number" style={{width:48,padding:"2px 4px",background:_.well,border:`1px solid ${_.line}`,borderRadius:5,color:_.ink,fontSize:12,textAlign:"center",outline:"none",fontWeight:600}} value={item.qty} onChange={e=>uI(cat,idx,"qty",parseFloat(e.target.value)||0)} />
                        <span style={{fontSize:11,color:_.muted,minWidth:22}}>{item.unit}</span>
                        <input type="number" style={{width:60,padding:"2px 4px",background:_.well,border:`1px solid ${_.line}`,borderRadius:5,color:_.ink,fontSize:12,textAlign:"right",outline:"none",fontWeight:600}} value={item.rate} onChange={e=>uI(cat,idx,"rate",parseFloat(e.target.value)||0)} />
                        <span style={{fontSize:12,fontWeight:600,minWidth:52,textAlign:"right",fontVariantNumeric:"tabular-nums"}}>{fmt(item.rate*item.qty)}</span>
                      </>}
                    </div>
                  ))}
                  <div onClick={()=>addC(cat)} style={{padding:`6px 0`,cursor:"pointer",color:_.ac,fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:4}}><Plus size={13} /> Add item</div>
                </div>}
              </div>)
            })}
          </div>

          {/* Summary */}
          {T.curr>0&&<div style={{...card,borderLeft:`4px solid ${_.ac}`,marginBottom:_.s6}}>
            <div style={{fontSize:12,color:_.muted,fontWeight:600,letterSpacing:"0.04em",textTransform:"uppercase",marginBottom:_.s3}}>Contract Total</div>
            <div style={{fontSize:40,fontWeight:600,letterSpacing:"-0.04em",lineHeight:1,fontVariantNumeric:"tabular-nums",color:_.ink}}>{fmt(T.curr)}</div>
            <div style={{fontSize:13,color:_.muted,marginTop:_.s3,lineHeight:1.5}}>
              Sub {fmt(T.sub)} + {p.margin}% margin + {p.contingency}% contingency + GST
            </div>
            <div style={{display:"flex",gap:_.s2,marginTop:_.s6}}>
              <button onClick={()=>createProp()} style={btnPrimary}>Generate proposal <ArrowRight size={14} /></button>
              <button onClick={()=>go("costs")} style={btnGhost}>Cost tracker</button>
            </div>
          </div>}
        </Section>}

        {/* ════ PLANS AI ════ */}
        {tab==="plans"&&<Section key={anim}>
          <h1 style={{fontSize:28,fontWeight:600,letterSpacing:"-0.02em",marginBottom:_.s7}}>Plans AI</h1>
          <div style={{textAlign:"center",padding:`${_.s10}px ${_.s7}px`,border:`2px dashed ${_.line2}`,borderRadius:_.r,marginBottom:_.s5}}>
            <div style={{marginBottom:_.s3,display:"flex",justifyContent:"center"}}><Ruler size={36} strokeWidth={1} color={_.faint} /></div>
            <div style={{fontSize:15,color:_.muted,marginBottom:_.s5}}>Upload a floor plan to analyse rooms and areas</div>
            <label style={btnPrimary}><input type="file" accept="image/*,.pdf" style={{display:"none"}} onChange={e=>{if(e.target.files[0])analysePlan(e.target.files[0])}} />Choose file</label>
          </div>
          {planLoad&&<div style={{textAlign:"center",padding:_.s8,color:_.muted}}>Analysing...</div>}
          {planImg&&<div style={{marginBottom:_.s4}}><img src={planImg} alt="" style={{width:"100%",borderRadius:_.rSm}} /></div>}
          {planData&&!planData.error&&<div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:_.s4}}><span style={{fontSize:18,fontWeight:600}}>Analysis</span><span style={{fontSize:18,fontWeight:700,color:_.ac}}>{planData.total_m2}m²</span></div>
            {planData.rooms?.map((rm,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:`6px 0`,borderBottom:`1px solid ${_.line}`,fontSize:14}}><span style={{color:_.body}}>{rm.name}</span><span style={{fontWeight:600}}>{rm.m2}m²</span></div>))}
            {planData.notes&&<div style={{marginTop:_.s3,fontSize:14,color:_.muted,lineHeight:1.6}}>{planData.notes}</div>}
            <button onClick={()=>{up(pr=>{pr.area=String(planData.total_m2);return pr});log("Plan analysed: "+planData.total_m2+"m²");go("quote");notify(planData.total_m2+"m² applied")}} style={{...btnPrimary,marginTop:_.s5}}>Apply {planData.total_m2}m² <ArrowRight size={14} /></button>
          </div>}
          {planData?.error&&<div style={{color:_.red,fontSize:14}}>{planData.error}</div>}
        </Section>}

        {/* ════ COSTS ════ */}
        {tab==="costs"&&<Section key={anim}>
          <h1 style={{fontSize:28,fontWeight:600,letterSpacing:"-0.02em",marginBottom:_.s7}}>Cost Tracker</h1>
          {T.cats.length===0&&<Empty icon={BarChart3} text="Add scope items in Quote to begin tracking" action={()=>go("quote")} actionText="Go to Quote" />}
          {T.cats.map(([cat,items])=>{const est=T.cT(p.scope,cat);const act=T.cA(p.scope,cat);const v2=act-est;
            return(<div key={cat} style={{marginBottom:_.s6,paddingBottom:_.s5,borderBottom:`1px solid ${_.line}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:_.s2}}>
                <span style={{fontSize:15,fontWeight:600}}>{cat}</span>
                {v2!==0&&<span style={{fontSize:14,fontWeight:600,color:v2>0?_.red:_.green}}>{v2>0?"+":""}{fmt(v2)}</span>}
              </div>
              <div style={{display:"flex",gap:_.s5,fontSize:13,color:_.muted,marginBottom:_.s3}}>
                <span>Budget <strong style={{color:_.ink}}>{fmt(est)}</strong></span>
                <span>Actual <strong style={{color:act>est?_.red:_.green}}>{fmt(act)}</strong></span>
              </div>
              {act>0&&<div style={{height:3,background:_.line,borderRadius:2,marginBottom:_.s3}}><div style={{height:"100%",width:`${Math.min((act/est)*100,100)}%`,background:act>est?_.red:_.green,borderRadius:2,transition:"width 0.4s"}} /></div>}
              {items.filter(i=>i.on).map((item,idx)=>(
                <div key={idx} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",fontSize:13}}>
                  <span style={{color:_.body}}>{item.item}</span>
                  <div style={{display:"flex",alignItems:"center",gap:_.s2}}>
                    <span style={{color:_.muted,fontVariantNumeric:"tabular-nums"}}>{fmt(item.rate*item.qty)}</span>
                    <input type="number" placeholder="Actual" style={{width:76,padding:"3px 6px",background:_.well,border:`1px solid ${_.line}`,borderRadius:5,color:_.ink,fontSize:12,textAlign:"right",outline:"none"}} value={item.actual||""} onChange={e=>uI(cat,p.scope[cat].indexOf(item),"actual",parseFloat(e.target.value)||0)} />
                  </div>
                </div>
              ))}
            </div>)
          })}
        </Section>}

        {/* ════ SCHEDULE ════ */}
        {tab==="schedule"&&<Section key={anim}>
          <h1 style={{fontSize:28,fontWeight:600,letterSpacing:"-0.02em",marginBottom:4}}>Progress Schedule</h1>
          <div style={{fontSize:14,color:_.muted,marginBottom:_.s7}}>{p.milestones.filter(m=>m.done).length} of {p.milestones.length} milestones · {p.milestones.length>0?Math.round((p.milestones.filter(m=>m.done).length/p.milestones.length)*100):0}% complete</div>

          {/* Progress hero */}
          <div style={{...card,borderLeft:`4px solid ${_.ac}`,marginBottom:_.s7}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:16}}>
              <div>
                <div style={{fontSize:11,color:_.ac,letterSpacing:"0.06em",fontWeight:600,textTransform:"uppercase",marginBottom:4}}>Build Progress</div>
                <div style={{fontSize:48,fontWeight:600,letterSpacing:"-0.04em",lineHeight:1,fontVariantNumeric:"tabular-nums",color:_.ink}}>{p.milestones.length>0?Math.round((p.milestones.filter(m=>m.done).length/p.milestones.length)*100):0}<span style={{fontSize:20,color:_.muted}}>%</span></div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:13,color:_.body}}>{p.milestones.findIndex(m=>!m.done)>=0?p.milestones[p.milestones.findIndex(m=>!m.done)].name:"All complete"}</div>
                <div style={{fontSize:11,color:_.muted,marginTop:2}}>{p.milestones.findIndex(m=>!m.done)>=0?"Next milestone":"🎉"}</div>
              </div>
            </div>
            {/* Stage progress bar */}
            <div style={{display:"flex",gap:3}}>
              {p.milestones.map((ms,i)=>(
                <div key={i} style={{flex:1,height:6,borderRadius:3,background:ms.done?_.ac:_.line,transition:"background 0.3s"}} title={ms.name} />
              ))}
            </div>
          </div>

          {/* Timeline visual */}
          <div style={{marginBottom:_.s7}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:_.s4}}>
              <div style={{fontSize:11,color:_.muted,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase"}}>Timeline</div>
              <div style={{fontSize:12,color:_.muted}}>Week {Math.max(...p.milestones.filter(m=>m.wk!==undefined).map(m=>m.wk),0)}</div>
            </div>
            {/* Gantt-style bar */}
            <div style={{position:"relative",height:28,background:_.well,borderRadius:_.r,marginBottom:_.s5,overflow:"hidden"}}>
              <div style={{position:"absolute",left:0,top:0,bottom:0,width:`${ganttPct}%`,background:_.ac,borderRadius:_.r,transition:"width 0.6s ease"}} />
              {p.milestones.map((ms,i)=>{
                const left=ganttMaxWk?((ms.wk||0)/ganttMaxWk)*100:0;
                return(
                  <div key={i} style={{position:"absolute",left:`${left}%`,top:"50%",transform:"translate(-50%,-50%)",width:ms.done?10:8,height:ms.done?10:8,borderRadius:"50%",background:ms.done?"#fff":_.line2,border:ms.done?"none":`2px solid ${_.muted}`,zIndex:1,cursor:"pointer",transition:"all 0.2s"}} title={`${ms.name} — Wk ${ms.wk||0}`} />
                );
              })}
            </div>
            {/* Week labels */}
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:_.faint,marginBottom:_.s5}}>
              <span>Wk 0</span>
              {[9,18,27].map(w=><span key={w}>Wk {w}</span>)}
              <span>Wk 36</span>
            </div>
          </div>

          {/* Milestone list */}
          {p.milestones.map((ms,i)=>{
            const isNext=i===p.milestones.findIndex(m=>!m.done)&&!ms.done;
            return(
              <div key={i} style={{display:"flex",alignItems:"stretch",gap:0,marginBottom:0}}>
                {/* Timeline rail */}
                <div style={{width:32,display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0}}>
                  <div style={{width:2,flex:"1 1 0",background:i===0?"transparent":ms.done?_.ac:_.line,transition:"background 0.3s"}} />
                  <div onClick={()=>{const wasDone=ms.done;up(pr=>{pr.milestones[i]={...ms,done:!ms.done,date:!ms.done?ds():ms.date};return pr});if(!wasDone)log("Milestone: "+ms.name)}} style={{width:ms.done?20:isNext?18:14,height:ms.done?20:isNext?18:14,borderRadius:"50%",border:ms.done?"none":`2px solid ${isNext?_.ac:_.line2}`,background:ms.done?_.ac:isNext?_.acLight:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:"pointer",transition:"all 0.25s",zIndex:1}}>{ms.done&&<Check size={11} strokeWidth={3} color="#fff" />}</div>
                  <div style={{width:2,flex:"1 1 0",background:i===p.milestones.length-1?"transparent":p.milestones[i+1]?.done||ms.done?_.ac:_.line,transition:"background 0.3s"}} />
                </div>
                {/* Content */}
                <div style={{flex:1,padding:`${_.s3}px 0 ${_.s3}px ${_.s3}px`,borderBottom:`1px solid ${_.line}`,display:"flex",justifyContent:"space-between",alignItems:"center",minHeight:52}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:_.s2}}>
                      <span style={{fontSize:15,fontWeight:ms.done?600:isNext?500:400,color:ms.done?_.ink:isNext?_.ink:_.muted}}>{ms.name}</span>
                      {isNext&&<span style={{...badge(_.ac,_.acLight),fontSize:10}}>Next</span>}
                    </div>
                    <div style={{display:"flex",gap:_.s4,marginTop:3,fontSize:12,color:_.muted}}>
                      <span style={{fontVariantNumeric:"tabular-nums"}}>Wk {ms.wk||0}</span>
                      {ms.done&&ms.date&&<span style={{color:_.green}}>✓ {ms.date}</span>}
                      {ms.planned&&!ms.done&&<span>Planned: {ms.planned}</span>}
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:_.s2}}>
                    <input type="date" value={ms.planned||""} onChange={e=>up(pr=>{pr.milestones[i]={...ms,planned:e.target.value};return pr})} style={{padding:"3px 6px",background:_.well,border:`1px solid ${_.line}`,borderRadius:6,color:_.ink,fontSize:11,outline:"none",cursor:"pointer",width:120}} title="Set planned date" />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add milestone */}
          <div style={{display:"flex",gap:_.s2,marginTop:_.s5,paddingTop:_.s5,borderTop:`1px solid ${_.line}`}}>
            <input style={{...input,flex:1}} placeholder="Add milestone…" value={newMs} onChange={e=>setNewMs(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&newMs.trim()){const maxWk=Math.max(...p.milestones.map(m=>m.wk||0),0);up(pr=>{pr.milestones.push({name:newMs.trim(),wk:maxWk+4,done:false,date:"",planned:""});return pr});log("Milestone added: "+newMs.trim());setNewMs("");notify("Milestone added")}}} />
            <button onClick={()=>{if(!newMs.trim())return;const maxWk=Math.max(...p.milestones.map(m=>m.wk||0),0);up(pr=>{pr.milestones.push({name:newMs.trim(),wk:maxWk+4,done:false,date:"",planned:""});return pr});log("Milestone added: "+newMs.trim());setNewMs("");notify("Milestone added")}} style={btnPrimary}>Add</button>
          </div>

          {/* Legend */}
          <div style={{display:"flex",gap:_.s5,marginTop:_.s5,fontSize:11,color:_.muted}}>
            <span style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:4,background:_.ac}} /> Complete</span>
            <span style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:4,border:`2px solid ${_.ac}`,background:_.acLight}} /> Next</span>
            <span style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:4,border:`2px solid ${_.line2}`}} /> Upcoming</span>
          </div>
        </Section>}

        {/* ════ VARIATIONS LIST ════ */}
        {tab==="variations"&&voView===null&&<Section key={anim}>
          <h1 style={{fontSize:28,fontWeight:600,letterSpacing:"-0.02em",marginBottom:4}}>Variation Orders</h1>
          <div style={{fontSize:14,color:_.muted,marginBottom:_.s7}}>Changes to original contract scope</div>

          {/* VO equation strip */}
          <div style={{display:"flex",gap:_.s7,marginBottom:_.s7,paddingBottom:_.s6,borderBottom:`1px solid ${_.line}`,alignItems:"baseline"}}>
            <div><div style={label}>Original</div><div style={{fontSize:22,fontWeight:700}}>{fmt(T.orig)}</div></div>
            <span style={{color:_.faint,fontSize:18}}>+</span>
            <div><div style={{...label,color:_.ac}}>Approved</div><div style={{fontSize:22,fontWeight:700,color:_.ac}}>{fmt(T.aV)}</div></div>
            <span style={{color:_.faint,fontSize:18}}>=</span>
            <div><div style={{...label,color:_.green}}>Current</div><div style={{fontSize:22,fontWeight:700,color:_.green}}>{fmt(T.curr)}</div></div>
          </div>

          {/* New VO form */}
          <div style={{marginBottom:_.s7,paddingBottom:_.s7,borderBottom:`1px solid ${_.line}`}}>
            <div style={{fontSize:11,color:_.muted,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:_.s4}}>New Variation</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:`${_.s3}px ${_.s4}px`,marginBottom:_.s3}}>
              <div><label style={label}>Description *</label><input style={{...input,borderColor:voForm._err&&!voForm.desc?_.red:_.line}} value={voForm.desc} onChange={e=>setVoForm({...voForm,desc:e.target.value,_err:false})} placeholder="Upgraded stone benchtop" /></div>
              <div><label style={label}>Category</label><input style={input} value={voForm.cat} onChange={e=>setVoForm({...voForm,cat:e.target.value})} placeholder="Kitchen" /></div>
              <div><label style={label}>Amount (inc GST) *</label><input type="number" style={{...input,borderColor:voForm._err&&!voForm.amount?_.red:_.line}} value={voForm.amount} onChange={e=>setVoForm({...voForm,amount:e.target.value,_err:false})} placeholder="3500" /></div>
              <div><label style={label}>Reason</label><input style={input} value={voForm.reason} onChange={e=>setVoForm({...voForm,reason:e.target.value})} placeholder="Owner selection change" /></div>
            </div>
            {voForm._err&&<div style={{fontSize:13,color:_.red,marginBottom:_.s2}}>Description and amount are required</div>}
            {voForm.amount&&<div style={{fontSize:14,color:_.muted,marginBottom:_.s3}}>Contract {parseFloat(voForm.amount)>=0?"increases":"decreases"} by <strong style={{color:_.ac}}>{fmt(Math.abs(parseFloat(voForm.amount)||0))}</strong></div>}
            <button onClick={()=>{if(!voForm.desc||!voForm.amount){setVoForm({...voForm,_err:true});return}up(pr=>{pr.variations.push({id:`VO-${String(pr.variations.length+1).padStart(3,"0")}`,description:voForm.desc,category:voForm.cat,amount:parseFloat(voForm.amount),reason:voForm.reason,date:ds(),status:"draft",builderSig:null,clientSig:null,approvedDate:""});return pr});log(`VO created: ${voForm.desc} (${fmt(parseFloat(voForm.amount))})`);notify(`VO created — ${fmt(parseFloat(voForm.amount))}`);setVoForm({desc:"",cat:"",amount:"",reason:""})}} style={btnPrimary}>Create VO <ArrowRight size={14} /></button>
          </div>

          {p.variations.length===0&&<Empty icon={ClipboardList} text="No variations yet" />}
          {p.variations.map((v,i)=>(
            <div key={i} onClick={()=>setVoView(i)} style={{padding:`${_.s4}px 0`,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${_.line}`,transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.paddingLeft="4px"} onMouseLeave={e=>e.currentTarget.style.paddingLeft="0"}>
              <div style={{display:"flex",alignItems:"center",gap:_.s4}}>
                <div style={{width:36,height:36,borderRadius:_.rXs,background:_.acLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:_.ac,flexShrink:0}}>{v.id.split("-")[1]}</div>
                <div><div style={{fontSize:14,fontWeight:500}}>{v.description}</div><div style={{fontSize:12,color:_.muted,marginTop:1}}>{v.category?`${v.category} · `:""}{v.date}</div></div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:_.s3}}>
                <span style={{fontSize:16,fontWeight:700,fontVariantNumeric:"tabular-nums"}}>{v.amount>=0?"+":""}{fmt(v.amount)}</span>
                <span style={badge(v.status==="approved"?_.green:v.status==="rejected"?_.red:_.amber,v.status==="approved"?_.greenBg:v.status==="rejected"?_.redBg:_.amberBg)}>{v.status}</span>
                <ChevronRight size={14} color={_.faint} />
              </div>
            </div>
          ))}
        </Section>}

        {/* ════ VO DETAIL ════ */}
        {tab==="variations"&&voD&&<Section key={anim}>
            <div style={{display:"flex",alignItems:"center",gap:_.s2,marginBottom:_.s7}}>
              <button onClick={()=>setVoView(null)} style={btnGhost}><ArrowRight size={14} style={{transform:"rotate(180deg)"}} /> Back</button>
              <span style={{fontSize:22,fontWeight:600}}>{voD.id}</span>
              <span style={badge(voD.status==="approved"?_.green:voD.status==="pending"?_.amber:_.muted,voD.status==="approved"?_.greenBg:voD.status==="pending"?_.amberBg:_.well)}>{voD.status}</span>
              <div style={{flex:1}} /><button onClick={()=>printEl(voDocRef)} style={btnGhost}><Printer size={14} /> Print</button>
            </div>
            <div ref={voDocRef} style={{background:"#fff",fontFamily:"'Inter',sans-serif",borderRadius:_.r,overflow:"hidden",boxShadow:"0 4px 24px rgba(0,0,0,0.06)",border:`1px solid ${_.line}`}}>
              <div style={{background:_.ink,color:"#fff",padding:"18px 28px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:22,height:22,background:"#fff",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:_.ink}}>i</div><span style={{fontSize:13,fontWeight:700}}>iBuild National</span></div><div style={{textAlign:"right"}}><div style={{fontSize:9,color:_.ac,letterSpacing:"0.1em",fontWeight:600}}>VARIATION ORDER</div><div style={{fontSize:16,fontWeight:700,color:_.ac}}>{voD.id}</div></div></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",borderBottom:`1px solid ${_.line}`}}>{[["Project",pName(p)],["Client",p.client],["Date",voD.date]].map(([l2,v2])=>(<div key={l2} style={{padding:"10px 16px",borderRight:`1px solid ${_.line}`}}><div style={{fontSize:9,color:_.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>{l2}</div><div style={{fontSize:12,fontWeight:500,marginTop:1}}>{v2||"—"}</div></div>))}</div>
              <div style={{padding:"18px 28px",borderBottom:`1px solid ${_.line}`}}><div style={{fontSize:9,color:_.ac,letterSpacing:"0.06em",fontWeight:600,marginBottom:4}}>DESCRIPTION</div><div style={{fontSize:13,lineHeight:1.7}}>{voD.description}</div>{voD.reason&&<div style={{fontSize:11,color:_.muted,marginTop:3}}>Reason: {voD.reason}</div>}</div>
              <div style={{padding:"18px 28px",borderBottom:`1px solid ${_.line}`}}><div style={{fontSize:9,color:_.ac,letterSpacing:"0.06em",fontWeight:600,marginBottom:10}}>CONTRACT IMPACT</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}><div style={{background:_.well,padding:12,borderRadius:_.r}}><div style={{fontSize:9,color:_.muted,fontWeight:600}}>BEFORE</div><div style={{fontSize:17,fontWeight:600,marginTop:2}}>{fmt(voCB)}</div></div><div style={{background:_.ink,padding:12,borderRadius:_.r,color:"#f8f8f6"}}><div style={{fontSize:9,color:_.ac,fontWeight:600}}>THIS VO</div><div style={{fontSize:17,fontWeight:600,color:_.ac,marginTop:2}}>{voD.amount>=0?"+":""}{fmt(voD.amount)}</div></div><div style={{background:_.well,padding:12,borderRadius:_.r}}><div style={{fontSize:9,color:_.muted,fontWeight:600}}>REVISED</div><div style={{fontSize:17,fontWeight:600,color:_.ac,marginTop:2}}>{fmt(voCB+voD.amount)}</div></div></div></div>
              <div style={{padding:"18px 28px"}}><div style={{fontSize:9,color:_.ac,letterSpacing:"0.06em",fontWeight:600,marginBottom:10}}>AUTHORISATION</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>{[["Builder — iBuild National",voD.builderSig],[`Client — ${p.client||"Owner"}`,voD.clientSig]].map(([l2,sig])=>(<div key={l2}><div style={{fontSize:11,fontWeight:600,marginBottom:3}}>{l2}</div>{sig?<div><img src={sig} alt="" style={{maxHeight:34}} /><div style={{fontSize:9,color:_.muted,marginTop:2}}>Signed {voD.approvedDate||voD.date}</div></div>:<div style={{borderBottom:`1px solid ${_.line2}`,height:34}} />}</div>))}</div>
                {voD.status==="approved"&&<div style={{marginTop:10,padding:"8px 12px",background:_.greenBg,borderRadius:_.rSm,fontSize:12,color:_.green,fontWeight:600}}>Approved {voD.approvedDate}</div>}</div>
              <div style={{padding:"10px 28px",background:_.ink,fontSize:9,color:_.muted}}>iBuild National · ABN 12 345 678 901 · (03) 8510 5472</div>
            </div>
            {voD.status!=="approved"&&voD.status!=="rejected"&&<div style={{marginTop:_.s5}}>
              <div style={{fontSize:14,fontWeight:600,marginBottom:_.s3}}>Sign variation</div>
              <div style={{display:"inline-flex",background:_.well,borderRadius:_.rFull,padding:2,marginBottom:_.s3}}>
                {["builder","client"].map(role=>(<div key={role} onClick={()=>{setVoSignAs(role);clr(voSigRef,voSigCtx)}} style={{padding:"6px 16px",borderRadius:_.rFull,fontSize:12,fontWeight:600,cursor:"pointer",background:voSignAs===role?_.surface:"transparent",color:voSignAs===role?_.ink:_.muted,boxShadow:voSignAs===role?"0 1px 3px rgba(0,0,0,0.06)":"none",transition:"all 0.15s"}}>{role==="builder"?"Builder":"Client"}{((role==="builder"&&voD.builderSig)||(role==="client"&&voD.clientSig))?" ✓":""}</div>))}
              </div>
              {((voSignAs==="builder"&&!voD.builderSig)||(voSignAs==="client"&&!voD.clientSig))?<div>
                <div style={{background:"#fff",borderRadius:_.rXs,touchAction:"none",overflow:"hidden",border:`1.5px solid ${_.line2}`}}><canvas ref={mkCv(voSigRef,voSigCtx)} width={500} height={100} style={{width:"100%",height:100,cursor:"crosshair"}} {...cvH(voSigRef,voSigCtx,voSigDr)} /></div>
                <div style={{display:"flex",gap:_.s2,marginTop:_.s2}}><button onClick={()=>{if(!voSigRef.current)return;const data=voSigRef.current.toDataURL();up(pr=>{if(voSignAs==="builder")pr.variations[voView].builderSig=data;else pr.variations[voView].clientSig=data;if(pr.variations[voView].builderSig&&pr.variations[voView].clientSig){pr.variations[voView].status="approved";pr.variations[voView].approvedDate=ds();notify("VO approved")}else{pr.variations[voView].status="pending";notify((voSignAs==="builder"?"Builder":"Client")+" signed")}return pr});log(voD.id+" signed by "+voSignAs);clr(voSigRef,voSigCtx)}} style={btnPrimary}>Confirm</button><button onClick={()=>clr(voSigRef,voSigCtx)} style={btnSecondary}>Clear</button></div>
              </div>:<div style={{padding:_.s3,background:_.greenBg,borderRadius:_.rXs,fontSize:13,color:_.green,fontWeight:500}}>{voSignAs==="builder"?"Builder":"Client"} signed</div>}
            </div>}
        </Section>}

        {/* ════ INVOICES ════ */}
        {tab==="invoices"&&invView===null&&<Section key={anim}>
          <h1 style={{fontSize:28,fontWeight:600,letterSpacing:"-0.02em",marginBottom:_.s7}}>Invoices</h1>
          <div style={{display:"flex",gap:_.s9,marginBottom:_.s5,alignItems:"baseline"}}>
            <div><div style={label}>Contract</div><div style={{fontSize:24,fontWeight:700}}>{fmt(T.curr)}</div></div>
            <div><div style={{...label,color:_.ac}}>Claimed</div><div style={{fontSize:24,fontWeight:700,color:_.ac}}>{fmt(T.inv)}</div></div>
            <div><div style={{...label,color:_.green}}>Paid</div><div style={{fontSize:24,fontWeight:700,color:_.green}}>{fmt(T.paid)}</div></div>
          </div>
          <div style={{height:4,background:_.line,borderRadius:2,marginBottom:_.s2}}><div style={{height:"100%",width:`${Math.min((T.inv/(T.curr||1))*100,100)}%`,background:_.ac,borderRadius:2,transition:"width 0.4s"}} /></div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:_.muted,marginBottom:_.s7,paddingBottom:_.s6,borderBottom:`1px solid ${_.line}`}}><span>{((T.inv/(T.curr||1))*100).toFixed(1)}% claimed</span><span>{fmt(T.curr-T.inv)} remaining</span></div>

          <div style={{marginBottom:_.s7,paddingBottom:_.s6,borderBottom:`1px solid ${_.line}`}}>
            <div style={{fontSize:11,color:_.muted,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:_.s4}}>New Progress Claim</div>
            <div style={{display:"grid",gridTemplateColumns:"80px 1fr auto",gap:_.s2,alignItems:"end"}}>
              <div><label style={label}>%</label><input type="text" inputMode="decimal" style={{...input,fontSize:20,fontWeight:700,textAlign:"center"}} value={invPct} onChange={e=>{const v=e.target.value;if(v===""||/^\d*\.?\d*$/.test(v))setInvPct(v)}} placeholder="25" /></div>
              <div><label style={label}>Description</label><input style={input} value={invDesc} onChange={e=>setInvDesc(e.target.value)} placeholder="Frame stage" /></div>
              <button onClick={()=>{const pc=parseFloat(invPct);if(!pc){notify("Enter %","error");return}const amt=T.curr*(pc/100);up(pr=>{pr.invoices.push({id:`INV-${uid()}`,date:ds(),pct:pc,amount:amt,desc:invDesc||`Claim ${pr.invoices.length+1}`,status:"pending"});return pr});log(`Invoice: ${invDesc||"Claim"} (${fmt(amt)})`);notify(`Invoice — ${fmt(amt)}`);setInvPct("");setInvDesc("")}} style={btnPrimary}>Generate</button>
            </div>
            {invPct&&<div style={{marginTop:_.s2,fontSize:15,fontWeight:600,color:(T.inv+T.curr*(parseFloat(invPct)||0)/100>T.curr)?_.red:_.ac,display:"flex",alignItems:"center",gap:4}}>= {fmt(T.curr*(parseFloat(invPct)||0)/100)} {(T.inv+T.curr*(parseFloat(invPct)||0)/100>T.curr)&&<><AlertTriangle size={13} /> Over-claim</>}</div>}
          </div>

          {p.invoices.length===0&&<Empty icon={Receipt} text="No invoices yet" />}
          {p.invoices.map((inv,i)=>(
            <div key={i} onClick={()=>setInvView(i)} style={{padding:`${_.s4}px 0`,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${_.line}`,transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.paddingLeft="4px"} onMouseLeave={e=>e.currentTarget.style.paddingLeft="0"}>
              <div><div style={{fontSize:14,fontWeight:500}}>{inv.desc}</div><div style={{fontSize:12,color:_.muted,marginTop:1}}>{inv.id} · {inv.date}</div></div>
              <div style={{display:"flex",alignItems:"center",gap:_.s3}}>
                <span style={{fontSize:16,fontWeight:700,fontVariantNumeric:"tabular-nums"}}>{fmt(inv.amount)}</span>
                <div onClick={e=>{e.stopPropagation();up(pr=>{pr.invoices[i]={...inv,status:inv.status==="paid"?"pending":"paid"};return pr});log(`Invoice ${inv.status==="paid"?"unpaid":"paid"}: ${inv.desc}`);notify(inv.status==="paid"?"Unpaid":"Paid")}} style={{...badge(inv.status==="paid"?_.green:_.amber,inv.status==="paid"?_.greenBg:_.amberBg),cursor:"pointer"}}>{inv.status}</div>
                <ChevronRight size={14} color={_.faint} />
              </div>
            </div>
          ))}
        </Section>}

        {/* ════ INVOICE DOC ════ */}
        {tab==="invoices"&&invD&&<Section key={anim}>
            <div style={{display:"flex",alignItems:"center",gap:_.s2,marginBottom:_.s7}}><button onClick={()=>setInvView(null)} style={btnGhost}><ArrowRight size={14} style={{transform:"rotate(180deg)"}} /> Back</button><span style={{fontSize:22,fontWeight:600}}>{invD.id}</span><div style={{flex:1}} /><button onClick={()=>printEl(invDocRef)} style={btnGhost}><Printer size={14} /> Print</button></div>
            <div ref={invDocRef} style={{background:"#fff",fontFamily:"'Inter',sans-serif",borderRadius:_.r,overflow:"hidden",boxShadow:"0 4px 24px rgba(0,0,0,0.06)",border:`1px solid ${_.line}`}}>
              <div style={{background:_.ink,color:"#fff",padding:"18px 28px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:22,height:22,background:"#fff",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:_.ink}}>i</div><span style={{fontSize:13,fontWeight:700}}>iBuild National</span></div><div style={{textAlign:"right"}}><div style={{fontSize:9,color:_.ac,letterSpacing:"0.1em",fontWeight:600}}>TAX INVOICE</div><div style={{fontSize:16,fontWeight:700,color:_.ac}}>{invD.id}</div></div></div>
              <div style={{padding:"16px 28px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,borderBottom:`1px solid ${_.line}`}}><div><div style={{fontSize:9,color:_.muted,fontWeight:600,textTransform:"uppercase"}}>From</div><div style={{fontSize:12,fontWeight:600,marginTop:1}}>iBuild National Pty Ltd</div><div style={{fontSize:11,color:_.muted}}>ABN 12 345 678 901</div></div><div><div style={{fontSize:9,color:_.muted,fontWeight:600,textTransform:"uppercase"}}>To</div><div style={{fontSize:12,fontWeight:600,marginTop:1}}>{p.client||"Client"}</div><div style={{fontSize:11,color:_.muted}}>{p.address}{p.suburb?`, ${p.suburb}`:""}</div></div></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",borderBottom:`1px solid ${_.line}`}}>{[["Date",invD.date],["Project",pName(p)],["Due","14 days"]].map(([l2,v2])=>(<div key={l2} style={{padding:"10px 16px",borderRight:`1px solid ${_.line}`}}><div style={{fontSize:9,color:_.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>{l2}</div><div style={{fontSize:12,fontWeight:500,marginTop:1}}>{v2}</div></div>))}</div>
              <div style={{padding:"18px 28px"}}><div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`2px solid ${_.ink}`,fontSize:10,color:_.muted,fontWeight:600,textTransform:"uppercase"}}><span>Description</span><span>Amount</span></div><div style={{display:"flex",justifyContent:"space-between",padding:"12px 0",borderBottom:`1px solid ${_.line}`}}><div><div style={{fontSize:13,fontWeight:500}}>{invD.desc}</div><div style={{fontSize:11,color:_.muted,marginTop:2}}>{invD.pct}% of {fmt(T.curr)}</div></div><span style={{fontSize:13,fontWeight:600}}>{fmt(invD.amount)}</span></div>
                <div style={{display:"flex",justifyContent:"flex-end",marginTop:12}}><div style={{width:200}}><div style={{display:"flex",justifyContent:"space-between",padding:"3px 0",fontSize:11,color:_.muted}}><span>Subtotal</span><span>{fmt(invD.amount-invGst)}</span></div><div style={{display:"flex",justifyContent:"space-between",padding:"3px 0",fontSize:11,color:_.muted,borderBottom:`1px solid ${_.line}`}}><span>GST</span><span>{fmt(invGst)}</span></div><div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",fontSize:16,fontWeight:700,borderTop:`2px solid ${_.ink}`,marginTop:2}}><span>Total</span><span>{fmt(invD.amount)}</span></div></div></div>
                <div style={{marginTop:14,padding:10,background:_.well,borderRadius:_.r,fontSize:11,color:_.muted}}><strong>Payment</strong> BSB: 063-000 · Acct: 1234 5678 · Ref: {invD.id}</div></div>
              <div style={{padding:"10px 28px",background:_.ink,fontSize:9,color:_.muted}}>iBuild National · ABN 12 345 678 901</div>
            </div>
        </Section>}

        {/* ════ DIARY ════ */}
        {tab==="diary"&&<Section key={anim}>
          <h1 style={{fontSize:28,fontWeight:600,letterSpacing:"-0.02em",marginBottom:_.s7}}>Site Diary</h1>
          <div style={{marginBottom:_.s7,paddingBottom:_.s6,borderBottom:`1px solid ${_.line}`}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:`${_.s3}px ${_.s4}px`,marginBottom:_.s3}}>
              <div><label style={label}>Date</label><input type="date" style={{...input,cursor:"pointer"}} value={diaryForm.date} onChange={e=>setDiaryForm({...diaryForm,date:e.target.value})} /></div>
              <div><label style={label}>Weather</label><select style={{...input,cursor:"pointer"}} value={diaryForm.weather} onChange={e=>setDiaryForm({...diaryForm,weather:e.target.value})}>{WEATHER.map(w=><option key={w}>{w}</option>)}</select></div>
              <div><label style={label}>Trades on site</label><input style={input} value={diaryForm.trades} onChange={e=>setDiaryForm({...diaryForm,trades:e.target.value})} placeholder="Plumber, Sparky" /></div>
            </div>
            <div><label style={label}>Notes</label><textarea style={{...input,minHeight:64,resize:"vertical"}} value={diaryForm.notes} onChange={e=>setDiaryForm({...diaryForm,notes:e.target.value})} placeholder="What happened on site today..." /></div>
            <button onClick={()=>{if(!diaryForm.notes&&!diaryForm.trades){notify("Add notes","error");return}const entryDate=diaryForm.date?new Date(diaryForm.date+"T00:00:00").toLocaleDateString("en-AU",{day:"numeric",month:"short",year:"numeric"}):ds();up(pr=>{pr.diary.unshift({date:entryDate,weather:diaryForm.weather,trades:diaryForm.trades,notes:diaryForm.notes});return pr});log("Diary: "+diaryForm.weather+(diaryForm.trades?", "+diaryForm.trades:""));setDiaryForm({date:"",weather:"Clear",trades:"",notes:""});notify("Logged")}} style={{...btnPrimary,marginTop:_.s3}}>Log entry</button>
          </div>
          {p.diary.length===0&&<Empty icon={BookOpen} text="No entries yet" />}
          {p.diary.map((d,i)=>(
            <div key={i} style={{padding:`${_.s4}px 0`,borderBottom:`1px solid ${_.line}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:_.s2}}>
                <div style={{display:"flex",alignItems:"center",gap:_.s2}}><span style={{fontSize:14,fontWeight:600}}>{d.date}</span><span style={badge(_.blue,_.blueBg)}>{d.weather}</span></div>
                <div onClick={()=>{up(pr=>{pr.diary.splice(i,1);return pr});notify("Removed")}} style={{cursor:"pointer",color:_.faint,transition:"color 0.15s"}} onMouseEnter={e=>e.currentTarget.style.color=_.red} onMouseLeave={e=>e.currentTarget.style.color=_.faint}><X size={14} /></div>
              </div>
              {d.trades&&<div style={{fontSize:13,color:_.ac,fontWeight:500,marginBottom:2}}>{d.trades}</div>}
              {d.notes&&<div style={{fontSize:14,color:_.body,lineHeight:1.6}}>{d.notes}</div>}
            </div>
          ))}
        </Section>}

        {/* ════ DEFECTS ════ */}
        {tab==="defects"&&<Section key={anim}>
          <h1 style={{fontSize:28,fontWeight:600,letterSpacing:"-0.02em",marginBottom:4}}>Defects</h1>
          <div style={{fontSize:14,color:_.muted,marginBottom:_.s7}}>{p.defects.filter(d=>d.done).length} of {p.defects.length} resolved</div>
          <div style={{marginBottom:_.s7,paddingBottom:_.s6,borderBottom:`1px solid ${_.line}`}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:_.s4,marginBottom:_.s3}}>
              <div><label style={label}>Location</label><input style={input} value={defectForm.location} onChange={e=>setDefectForm({...defectForm,location:e.target.value})} placeholder="Master ensuite" /></div>
              <div><label style={label}>Description *</label><input style={input} value={defectForm.desc} onChange={e=>setDefectForm({...defectForm,desc:e.target.value})} placeholder="Cracked tile" /></div>
              <div><label style={label}>Assigned to</label><input style={input} value={defectForm.assignee} onChange={e=>setDefectForm({...defectForm,assignee:e.target.value})} placeholder="Tiler" /></div>
            </div>
            <button onClick={()=>{if(!defectForm.desc){notify("Add description","error");return}up(pr=>{pr.defects.push({...defectForm,date:ds(),done:false});return pr});log("Defect: "+defectForm.desc);setDefectForm({location:"",desc:"",assignee:""});notify("Logged")}} style={btnPrimary}>Add defect</button>
          </div>
          {p.defects.length===0&&<Empty icon={Search} text="No defects" />}
          {p.defects.map((d,i)=>(
            <div key={i} onClick={()=>{const wasDone=d.done;up(pr=>{pr.defects[i]={...d,done:!d.done};return pr});if(!wasDone)log("Defect resolved: "+d.desc);notify(d.done?"Reopened":"Resolved")}} style={{display:"flex",alignItems:"center",gap:_.s4,padding:`${_.s3}px 0`,borderBottom:`1px solid ${_.line}`,cursor:"pointer",opacity:d.done?0.4:1,transition:"opacity 0.2s"}}>
              <div style={{width:20,height:20,borderRadius:10,border:`1.5px solid ${d.done?_.green:_.line2}`,background:d.done?_.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{d.done&&<Check size={11} strokeWidth={3} color="#fff" />}</div>
              <div style={{flex:1}}><div style={{fontSize:14,fontWeight:500}}>{d.desc}</div><div style={{fontSize:12,color:_.muted,marginTop:1}}>{[d.location,d.assignee&&`→ ${d.assignee}`,d.date].filter(Boolean).join(" · ")}</div></div>
            </div>
          ))}
        </Section>}

        {/* ════ TRADES ════ */}
        {tab==="trades"&&<Section key={anim}>
          <h1 style={{fontSize:28,fontWeight:600,letterSpacing:"-0.02em",marginBottom:_.s7}}>Trades</h1>
          <div style={{marginBottom:_.s7,paddingBottom:_.s6,borderBottom:`1px solid ${_.line}`}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:_.s4}}>
              {[["Trade","trade","Electrician"],["Company","company","Spark Bros"],["Contact","contact","Dave"],["Phone","phone","0412..."]].map(([l2,k,ph])=>(<div key={k}><label style={label}>{l2}</label><input style={input} value={trForm[k]} onChange={e=>setTrForm({...trForm,[k]:e.target.value})} placeholder={ph} /></div>))}
            </div>
            <button onClick={()=>{if(!trForm.trade){notify("Enter trade","error");return}up(pr=>{pr.trades.push({...trForm});return pr});log("Trade added: "+trForm.trade);setTrForm({trade:"",company:"",contact:"",phone:""});notify("Added")}} style={{...btnPrimary,marginTop:_.s3}}>Add trade</button>
          </div>
          {p.trades.length===0&&<Empty icon={Wrench} text="No trades" />}
          {p.trades.map((tr,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:`${_.s4}px 0`,borderBottom:`1px solid ${_.line}`}}>
              <div><span style={badge(_.ac,_.acLight)}>{tr.trade}</span><div style={{fontSize:14,fontWeight:500,marginTop:6}}>{tr.company}</div>{tr.contact&&<div style={{fontSize:12,color:_.muted,marginTop:1}}>{tr.contact}</div>}</div>
              <div style={{display:"flex",gap:_.s2,alignItems:"center"}}>{tr.phone&&<a href={`tel:${tr.phone}`} style={{fontSize:13,color:_.ac,textDecoration:"none",fontWeight:500}}>{tr.phone}</a>}<div onClick={()=>{up(pr=>{pr.trades.splice(i,1);return pr});notify("Removed")}} style={{cursor:"pointer",color:_.faint,transition:"color 0.15s"}} onMouseEnter={e=>e.currentTarget.style.color=_.red} onMouseLeave={e=>e.currentTarget.style.color=_.faint}><X size={14} /></div></div>
            </div>
          ))}
        </Section>}

        {/* ════ PROPOSAL LIST ════ */}
        {tab==="proposal"&&propView===null&&<Section key={anim}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:_.s7}}>
            <h1 style={{fontSize:28,fontWeight:600,letterSpacing:"-0.02em"}}>Proposals</h1>
            {quoteReady&&<button onClick={()=>createProp()} style={btnPrimary}><Plus size={14} /> New from current scope</button>}
          </div>
          {!quoteReady&&<Empty icon={FileText} text="Complete your quote first" action={()=>go("quote")} actionText="Go to Quote" />}
          {quoteReady&&p.proposals.length===0&&<Empty icon={FileText} text="No proposals yet — save one from your current scope" />}
          {p.proposals.map((prop,i)=>(
            <div key={i} onClick={()=>setPropView(i)} style={{padding:`${_.s4}px 0`,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${_.line}`,transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.paddingLeft="4px"} onMouseLeave={e=>e.currentTarget.style.paddingLeft="0"}>
              <div><div style={{fontSize:14,fontWeight:500}}>{prop.name}</div><div style={{fontSize:12,color:_.muted,marginTop:1}}>{prop.id} · {prop.date}</div></div>
              <div style={{display:"flex",alignItems:"center",gap:_.s3}}>
                <span style={{fontSize:16,fontWeight:700,fontVariantNumeric:"tabular-nums"}}>{fmt(prop.pricing.total)}</span>
                <span style={badge(prop.status==="signed"?_.green:prop.status==="declined"?_.red:prop.status==="sent"?_.blue:_.amber,prop.status==="signed"?_.greenBg:prop.status==="declined"?_.redBg:prop.status==="sent"?_.blueBg:_.amberBg)}>{prop.status}</span>
                <ChevronRight size={14} color={_.faint} />
              </div>
            </div>
          ))}
        </Section>}

        {/* ════ PROPOSAL DETAIL ════ */}
        {tab==="proposal"&&propD&&<Section key={anim}>
            <div style={{display:"flex",alignItems:"center",gap:_.s2,marginBottom:_.s5}}>
              <button onClick={()=>setPropView(null)} style={btnGhost}><ArrowRight size={14} style={{transform:"rotate(180deg)"}} /> Back</button>
              <span style={{fontSize:22,fontWeight:600}}>{propD.name}</span>
              <span style={badge(propD.status==="signed"?_.green:propD.status==="declined"?_.red:propD.status==="sent"?_.blue:_.amber,propD.status==="signed"?_.greenBg:propD.status==="declined"?_.redBg:propD.status==="sent"?_.blueBg:_.amberBg)}>{propD.status}</span>
              <div style={{flex:1}} />
              <button onClick={()=>printEl(propRef)} style={btnGhost}><Printer size={14} /> Print</button>
            </div>
            <div style={{display:"flex",gap:_.s2,marginBottom:_.s5}}>
              {["draft","sent","signed","declined"].map(s=>(
                <div key={s} onClick={()=>{up(pr=>{pr.proposals[propView].status=s;return pr});log(`Proposal → ${s}`);notify(`Marked ${s}`)}} style={{padding:"6px 14px",borderRadius:_.rFull,fontSize:12,fontWeight:600,cursor:"pointer",background:propD.status===s?(s==="signed"?_.greenBg:s==="declined"?_.redBg:s==="sent"?_.blueBg:_.amberBg):_.well,color:propD.status===s?(s==="signed"?_.green:s==="declined"?_.red:s==="sent"?_.blue:_.amber):_.muted,transition:"all 0.15s"}}>{s}</div>
              ))}
            </div>
            <div ref={propRef} style={{background:"#fff",fontFamily:"'Inter',sans-serif",borderRadius:_.r,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.04)",border:`1px solid ${_.line}`}}>
              <div style={{padding:"24px 32px",borderBottom:`1px solid ${_.line}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:28,height:28,background:_.ac,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"#fff"}}>i</div><span style={{fontSize:15,fontWeight:700,color:_.ink}}>iBuild National</span></div><div style={{textAlign:"right"}}><div style={{fontSize:9,color:_.ac,letterSpacing:"0.1em",fontWeight:600}}>PROPOSAL</div><div style={{fontSize:14,fontWeight:600,color:_.ink}}>{propD.name}</div></div></div>
              <div style={{padding:"32px",borderBottom:`1px solid ${_.line}`,borderLeft:`4px solid ${_.ac}`}}><div style={{fontSize:10,color:_.ac,marginBottom:8,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase"}}>Prepared for</div><div style={{fontSize:28,fontWeight:600,letterSpacing:"-0.02em",color:_.ink,lineHeight:1.15}}>{propD.client}</div><div style={{fontSize:14,color:_.body,marginTop:4}}>{propD.address}{propD.suburb?`, ${propD.suburb}`:""}</div></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",borderBottom:`1px solid ${_.line}`}}>{[["Date",propD.date],["Project",propD.client+(propD.suburb?` — ${propD.suburb}`:"")],["Valid",`${propD.validDays||30}d`],["Value",fmt(propD.pricing.total)]].map(([l2,v2],i)=>(<div key={l2} style={{padding:"12px 16px",borderRight:i<3?`1px solid ${_.line}`:"none"}}><div style={{fontSize:9,color:_.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>{l2}</div><div style={{fontSize:12,fontWeight:500,color:i===3?_.ac:_.ink,marginTop:2}}>{v2}</div></div>))}</div>
              {propD.notes&&<div style={{padding:"16px 32px",borderBottom:`1px solid ${_.line}`}}><div style={{fontSize:9,color:_.ac,letterSpacing:"0.06em",fontWeight:600,marginBottom:3}}>BRIEF</div><div style={{fontSize:12,lineHeight:1.7,color:_.body}}>{propD.type} · {propD.stories}{propD.area?` · ${propD.area}m²`:""}. {propD.notes}</div></div>}
              <div style={{padding:"20px 32px"}}><div style={{fontSize:9,color:_.ac,letterSpacing:"0.06em",fontWeight:600,marginBottom:10,paddingBottom:4,borderBottom:`2px solid ${_.ink}`}}>SCOPE</div>
                {propDCats.map(([cat,items],ci)=>(<div key={cat} style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",padding:"5px 8px",background:_.ac,color:"#fff",fontSize:10,borderRadius:4,fontWeight:600}}><span>{String(ci+1).padStart(2,"0")}. {cat}</span><span>{fmt(propCT(propD.scope,cat))}</span></div>{items.filter(i2=>i2.on).map((item,idx)=>(<div key={idx} style={{display:"grid",gridTemplateColumns:"1fr 36px 48px 24px 48px",gap:2,padding:"3px 8px",fontSize:9,borderBottom:`1px solid ${_.line}`,color:_.body}}><span style={{color:_.ink}}>{item.item}</span><span>{item.unit}</span><span style={{textAlign:"right"}}>{fmt(item.rate)}</span><span style={{textAlign:"center"}}>x{item.qty}</span><span style={{textAlign:"right",fontWeight:600,color:_.ink}}>{fmt(item.rate*item.qty)}</span></div>))}</div>))}</div>
              <div style={{padding:"0 32px 20px",display:"flex",justifyContent:"flex-end"}}><div style={{width:220}}>{[["Subtotal",propD.pricing.sub],[`Margin ${propD.pricing.margin}%`,propD.pricing.mar],[`Contingency ${propD.pricing.contingency}%`,propD.pricing.con],["GST",propD.pricing.gst]].map(([l2,v2])=>(<div key={l2} style={{display:"flex",justifyContent:"space-between",padding:"2px 0",fontSize:10,color:_.muted,borderBottom:`1px solid ${_.line}`}}><span>{l2}</span><span>{fmt(v2)}</span></div>))}<div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",fontSize:15,fontWeight:700,borderTop:`2px solid ${_.ink}`,marginTop:2}}><span>Total</span><span>{fmt(propD.pricing.total)}</span></div></div></div>
              <div style={{padding:"14px 32px",borderTop:`1px solid ${_.line}`,fontSize:9,color:_.muted,lineHeight:1.7}}><div style={{fontSize:9,color:_.ac,letterSpacing:"0.06em",fontWeight:600,marginBottom:3}}>TERMS</div>{`Valid ${propD.validDays||30} days · 5% deposit · Progress claims 7 days · Variations via VO · Full insurance · 13-week defects`}</div>
              <div style={{padding:"14px 32px",borderTop:`1px solid ${_.line}`}}><div style={{fontSize:9,color:_.ac,letterSpacing:"0.06em",fontWeight:600,marginBottom:6}}>ACCEPTANCE</div><div style={{fontSize:10,color:_.muted,marginBottom:8}}>I/We accept and authorise iBuild National to proceed.</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>{["Client","Builder"].map(r=>(<div key={r}><div style={{fontSize:10,fontWeight:600,marginBottom:3}}>{r}</div>{propD.sigData&&r==="Client"?<div><img src={propD.sigData} alt="" style={{maxHeight:28}} /><div style={{fontSize:8,color:_.muted,marginTop:1}}>Signed</div></div>:<div style={{borderBottom:`1px solid ${_.line2}`,height:28}} />}</div>))}</div></div>
              <div style={{padding:"10px 32px",background:_.ink,fontSize:9,color:"#999",display:"flex",justifyContent:"space-between"}}><span>iBuild National Pty Ltd · ABN 12 345 678 901</span><span>(03) 8510 5472</span></div>
            </div>
            {!propD.sigData&&<div style={{marginTop:_.s5}}>
              <div style={{fontSize:14,fontWeight:600,marginBottom:_.s2}}>Client signature</div>
              <div style={{background:"#fff",borderRadius:_.rXs,touchAction:"none",overflow:"hidden",border:`1.5px solid ${_.line2}`}}><canvas ref={mkCv(sigRef,sigCtx)} width={600} height={100} style={{width:"100%",height:100,cursor:"crosshair"}} {...cvH(sigRef,sigCtx,sigDr,()=>{up(pr=>{pr.proposals[propView].sigData=sigRef.current.toDataURL();pr.proposals[propView].status="signed";return pr});log("Proposal signed");notify("Signed")})} /></div>
              <div style={{display:"flex",gap:_.s2,marginTop:_.s2}}><button onClick={()=>{clr(sigRef,sigCtx)}} style={btnSecondary}>Clear</button></div>
            </div>}
            {propD.sigData&&<div style={{marginTop:_.s5,padding:`${_.s3}px`,background:_.greenBg,borderRadius:_.rXs,fontSize:13,color:_.green,fontWeight:500,display:"flex",alignItems:"center",gap:4}}><Check size={13} /> Client signed</div>}
        </Section>}

        {/* ════ TEMPLATES ════ */}
        {tab==="templates"&&<Section key={anim}>
          <h1 style={{fontSize:28,fontWeight:600,letterSpacing:"-0.02em",marginBottom:_.s7}}>Templates</h1>
          <div style={{display:"flex",gap:_.s2,alignItems:"end",marginBottom:_.s7,paddingBottom:_.s6,borderBottom:`1px solid ${_.line}`}}>
            <div style={{flex:1}}><label style={label}>Name</label><input style={input} value={tplName} onChange={e=>setTplName(e.target.value)} placeholder="Standard 4-bed new build" /></div>
            <button onClick={()=>{if(!tplName.trim()){notify("Enter name","error");return}saveTpl([...tpl,{name:tplName,scope:JSON.parse(JSON.stringify(p.scope)),margin:p.margin,contingency:p.contingency}]);log("Template saved: "+tplName);setTplName("");notify("Saved")}} style={btnPrimary}>Save current</button>
          </div>
          {tpl.length===0&&<Empty icon={FolderOpen} text="Save your scope as a reusable template" />}
          {tpl.map((t2,i)=>{const n=Object.values(t2.scope).flat().filter(x=>x.on).length;const tot=Object.values(t2.scope).flat().filter(x=>x.on).reduce((s,x)=>s+x.rate*x.qty,0);
            return(<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:`${_.s4}px 0`,borderBottom:`1px solid ${_.line}`}}>
              <div><div style={{fontSize:14,fontWeight:500}}>{t2.name}</div><div style={{fontSize:12,color:_.muted,marginTop:1}}>{n} items · {t2.margin}% margin · {fmt(tot)}</div></div>
              <div style={{display:"flex",gap:_.s2}}><button onClick={()=>{up(pr=>{pr.scope=JSON.parse(JSON.stringify(t2.scope));pr.margin=t2.margin;pr.contingency=t2.contingency;return pr});log("Template loaded: "+t2.name);go("quote");notify("Loaded")}} style={btnPrimary}>Load</button><button onClick={()=>{saveTpl(tpl.filter((_2,j)=>j!==i));notify("Removed")}} style={btnSecondary}><X size={13} /></button></div>
            </div>)})}
        </Section>}

      </main>

      <style>{`
        *{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;box-sizing:border-box}
        ::selection{background:${_.acLight};color:${_.ink}}
        select option{background:#fff;color:${_.ink}}
        input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none}
        input[type=number]{-moz-appearance:textfield}
        textarea{font-family:inherit}
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${_.line};border-radius:3px}
        ::-webkit-scrollbar-thumb:hover{background:${_.line2}}
        input:focus,textarea:focus,select:focus{border-color:${_.ac}!important;background:#fff!important;box-shadow:0 0 0 3px ${_.acLight}!important}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
}
