import { useState, useRef, useEffect } from "react";
import { FileText, Ruler, Receipt, BookOpen, BarChart3, ClipboardList, Search, Wrench, FolderOpen, PenLine, Upload, Plus, ChevronRight, ChevronDown, X, Check, AlertTriangle, ArrowRight, Printer, ArrowUpRight, DollarSign, Menu } from "lucide-react";

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
const mkScope=()=>{const s={};Object.entries(RATES).forEach(([c,i])=>{s[c]=i.map(x=>({...x,on:false,actual:0,_id:uid()}))});return s};
const pName=(pr)=>pr.client?(pr.suburb?`${pr.client} \u2014 ${pr.suburb}`:pr.client):"New Project";
const sIdx=s=>STAGES.indexOf(s);
const mkProject=()=>({id:uid(),status:"Lead",created:ds(),client:"",email:"",phone:"",address:"",suburb:"",assignedTo:"",type:"New Build",stories:"Single Storey",area:"",validDays:30,scope:mkScope(),margin:18,contingency:5,notes:"",variations:[],invoices:[],proposals:[],milestones:MILESTONES.map(m=>({name:m.name,wk:m.wk,done:false,date:"",planned:""})),trades:[],diary:[],defects:[],sigData:null,activity:[{action:"Project created",time:ts(),date:ds()}]});

// ═══════════════════════════════════════════════
// DESIGN SYSTEM — Minimal OS
// ═══════════════════════════════════════════════
const _ = {
  // Surfaces — single neutral bg, no tinted cards
  bg:"#F8F9FA",
  surface:"#ffffff",
  raised:"#ffffff",
  well:"#f0f1f3",
  sidebar:"#F0F1F3",
  // Borders
  line:"#e5e7eb",
  line2:"#d1d5db",
  // Text hierarchy
  ink:"#0f172a",
  body:"#475569",
  muted:"#94a3b8",
  faint:"#cbd5e1",
  // Accent — buttons + thin indicators only
  ac:"#2563eb",
  acDark:"#1d4ed8",
  // Semantic — colours only, no tinted backgrounds
  green:"#10b981",
  red:"#ef4444",
  amber:"#f59e0b",
  blue:"#3b82f6",
  violet:"#8b5cf6",
  // Spacing
  s1:4,s2:8,s3:12,s4:16,s5:20,s6:24,s7:32,s8:40,s9:48,s10:64,
  // Radius — max 8px
  r:"8px",rMd:"6px",rSm:"5px",rXs:"3px",rFull:"999px",
  // Shadows — nearly none
  sh1:"0 1px 2px rgba(0,0,0,0.03)",
  sh2:"0 1px 3px rgba(0,0,0,0.04)",
  sh3:"0 2px 8px rgba(0,0,0,0.06)",
};

const input = {
  width:"100%",padding:"9px 12px",background:_.well,border:"1.5px solid transparent",
  borderRadius:_.rSm,color:_.ink,fontSize:14,fontFamily:"inherit",outline:"none",
  transition:"border-color 0.15s ease",
};
const label = {
  fontSize:11,color:_.muted,marginBottom:5,display:"block",fontWeight:600,
  letterSpacing:"0.05em",textTransform:"uppercase",
};
const btnPrimary = {
  padding:"9px 18px",background:_.ac,color:"#fff",border:"none",borderRadius:_.rSm,
  fontSize:13,fontWeight:600,cursor:"pointer",transition:"background 0.15s ease",
  display:"inline-flex",alignItems:"center",gap:6,
};
const btnSecondary = {
  ...btnPrimary,background:_.surface,color:_.body,border:`1.5px solid ${_.line}`,
};
const btnGhost = {
  ...btnPrimary,background:"transparent",color:_.body,padding:"9px 12px",
};
const stCol=s=>s==="Active"||s==="Invoiced"?_.green:s==="Approved"?_.blue:s==="Complete"?_.ac:s==="Quote"?_.violet:_.amber;
const stBg=()=>_.well;
const badge=(c)=>({fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:_.rFull,background:`${c}14`,color:c});

// ═══ STORAGE WRAPPER ═══
const STORAGE_VERSION=1;
const store={
  get(key){try{const v=localStorage.getItem(key);return v===null?null:JSON.parse(v)}catch{return null}},
  set(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}},
  remove(key){try{localStorage.removeItem(key)}catch{}},
};
const hydrateScope=projects=>projects.map(pr=>{if(!pr.scope)pr.scope=mkScope();Object.values(pr.scope).forEach(items=>items.forEach(item=>{if(!item._id)item._id=uid()}));return pr});

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
  <div style={{textAlign:"center",padding:`${_.s9}px ${_.s7}px`,borderRadius:_.r,border:`1.5px dashed ${_.line2}`}}>
    {Ic&&<div style={{marginBottom:_.s4,display:"flex",justifyContent:"center"}}><Ic size={28} strokeWidth={1.5} color={_.faint} /></div>}
    <div style={{fontSize:14,color:_.muted,lineHeight:1.5}}>{text}</div>
    {action&&<button onClick={action} style={{...btnPrimary,marginTop:_.s5}}>{actionText} <ArrowRight size={14} /></button>}
  </div>
);
const Section=({children})=>(<div style={{animation:"fadeUp 0.2s ease",maxWidth:1200}}>{children}</div>);

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
  const [projects,setProjects]=useState(()=>{
    const d=store.get("ib_projects");
    if(d&&d.v===STORAGE_VERSION&&Array.isArray(d.projects)&&d.projects.length>0)return hydrateScope(d.projects);
    return [mkProject()];
  });
  const [ai,setAi]=useState(()=>{
    const d=store.get("ib_projects");
    if(d&&d.v===STORAGE_VERSION&&Array.isArray(d.projects)&&typeof d.ai==="number")return Math.max(0,Math.min(d.ai,(d.projects.length||1)-1));
    return 0;
  });
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
  const [mobile,setMobile]=useState(window.innerWidth<768);
  const [moreMenu,setMoreMenu]=useState(false);
  const [saveStatus,setSaveStatus]=useState(null);
  const [editMsIdx,setEditMsIdx]=useState(null);
  const [editMsName,setEditMsName]=useState("");
  const [shiftWeeks,setShiftWeeks]=useState("");
  const saveTimer=useRef(null);

  const sigRef=useRef(null),sigCtx=useRef(null),sigDr=useRef(false);
  const voSigRef=useRef(null),voSigCtx=useRef(null),voSigDr=useRef(false);
  const propRef=useRef(null),voDocRef=useRef(null),invDocRef=useRef(null);

  const p=projects[ai]||projects[0];
  const up=fn=>setProjects(pv=>pv.map((x,i)=>i===ai?fn(JSON.parse(JSON.stringify(x))):x));
  const T=calc(p);
  const notify=(msg,type="ok")=>{setToast({msg,type});setTimeout(()=>setToast(null),2200)};
  const go=t2=>{setTab(t2);setVoView(null);setInvView(null);setPropView(null);setAnim(a=>a+1)};
  const log=action=>up(pr=>{pr.activity.unshift({action,time:ts(),date:ds()});if(pr.activity.length>30)pr.activity=pr.activity.slice(0,30);return pr});

  useEffect(()=>{const h=()=>setMobile(window.innerWidth<768);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h)},[]);

  // Autosave projects (debounced 300ms)
  useEffect(()=>{
    if(saveTimer.current)clearTimeout(saveTimer.current);
    setSaveStatus("saving");
    saveTimer.current=setTimeout(()=>{
      store.set("ib_projects",{v:STORAGE_VERSION,projects,ai});
      setSaveStatus(new Date().toLocaleTimeString("en-AU",{hour:"numeric",minute:"2-digit"}));
    },300);
    return()=>{if(saveTimer.current)clearTimeout(saveTimer.current)};
  },[projects,ai]);

  // Clamp ai when projects length changes
  useEffect(()=>{if(ai>=projects.length)setAi(Math.max(0,projects.length-1))},[projects.length]);

  // Templates persistence (localStorage)
  useEffect(()=>{const d=store.get("ib_templates");if(Array.isArray(d))setTpl(d)},[]);
  const saveTpl=t2=>{setTpl(t2);store.set("ib_templates",t2)};
  const uI=(cat,idx,k,v)=>up(pr=>{pr.scope[cat][idx][k]=v;if(k==="on"&&v&&!pr.scope[cat][idx].qty)pr.scope[cat][idx].qty=1;return pr});
  const addC=cat=>up(pr=>{pr.scope[cat].push({item:"Custom Item",unit:"fixed",rate:0,qty:1,on:true,actual:0,custom:true,_id:uid()});return pr});

  const mkCv=(ref,ctx)=>el=>{if(!el)return;ref.current=el;const c2=el.getContext("2d");c2.strokeStyle=_.ink;c2.lineWidth=2;c2.lineCap="round";c2.lineJoin="round";ctx.current=c2};
  const cvH=(ref,ctx,dr,done)=>{
    const gp=e=>{const r2=ref.current.getBoundingClientRect();const ev=e.touches?e.touches[0]:e;return[ev.clientX-r2.left,ev.clientY-r2.top]};
    return{onMouseDown:e=>{dr.current=true;const[x,y]=gp(e);ctx.current.beginPath();ctx.current.moveTo(x,y)},onMouseMove:e=>{if(!dr.current)return;const[x,y]=gp(e);ctx.current.lineTo(x,y);ctx.current.stroke()},onMouseUp:()=>{dr.current=false;done?.()},onMouseLeave:()=>{dr.current=false},onTouchStart:e=>{dr.current=true;const[x,y]=gp(e);ctx.current.beginPath();ctx.current.moveTo(x,y)},onTouchMove:e=>{if(!dr.current)return;e.preventDefault();const[x,y]=gp(e);ctx.current.lineTo(x,y);ctx.current.stroke()},onTouchEnd:()=>{dr.current=false;done?.()}};
  };
  const clr=(ref,ctx)=>{if(ctx.current&&ref.current)ctx.current.clearRect(0,0,ref.current.width,ref.current.height)};
  const planFileRef=useRef(null);
  const analysePlan=async file=>{
    setPlanLoad(true);setPlanData(null);
    try{
      const url=URL.createObjectURL(file);setPlanImg(url);
      const fd=new FormData();fd.append("file",file);
      const resp=await fetch("http://localhost:3001/api/floorplan/analyse",{method:"POST",body:fd});
      if(!resp.ok)throw new Error(`Server returned ${resp.status}`);
      const d=await resp.json();
      if(d.error)throw new Error(d.error);
      setPlanData(d);
    }catch(e){setPlanData({error:e.message||"Analysis failed — is the server running? (npm run server)"})}
    setPlanLoad(false);
  };
  const addPlanItems=()=>{
    if(!planData?.scope_items?.length)return;
    up(pr=>{
      planData.scope_items.forEach(si=>{
        const cat=si.category;
        if(!pr.scope[cat])return;
        const exists=pr.scope[cat].find(x=>x.item===si.item);
        if(exists){exists.on=true;exists.qty=si.qty;exists.rate=si.rate;}
        else{pr.scope[cat].push({item:si.item,unit:si.unit,rate:si.rate,qty:si.qty,on:true,actual:0,custom:true,_id:uid()});}
      });
      if(planData.total_m2)pr.area=String(planData.total_m2);
      return pr;
    });
    log("Plan items added: "+planData.scope_items.length+" items");
    notify(planData.scope_items.length+" items added to quote");
    go("quote");
  };
  const printEl=ref=>{if(!ref.current)return;const w=window.open("","_blank");w.document.write('<!DOCTYPE html><html><head><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}@media print{body{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}@page{margin:0;size:A4}}</style></head><body>'+ref.current.outerHTML+'</body></html>');w.document.close();setTimeout(()=>w.print(),600)};
  const dupeProject=idx=>{const src=JSON.parse(JSON.stringify(projects[idx]));src.id=uid();src.status="Lead";src.created=ds();src.client+=" (Copy)";src.invoices=[];src.variations=[];src.milestones=MILESTONES.map(m=>({name:m.name,wk:m.wk,done:false,date:"",planned:""}));src.diary=[];src.defects=[];src.sigData=null;src.proposals=[];src.activity=[{action:"Duplicated from "+pName(projects[idx]),time:ts(),date:ds()}];setProjects(pv=>[...pv,src]);setAi(projects.length);setSw(false);go("quote");notify("Project duplicated")};

  const createProp=(name)=>{
    if(!name)name=`Proposal v${p.proposals.length+1}`;
    const newIdx=p.proposals.length;
    up(pr=>{const t=calc(pr);pr.proposals.push({id:`PROP-${uid()}`,name,date:ds(),scope:JSON.parse(JSON.stringify(pr.scope)),client:pr.client,address:pr.address,suburb:pr.suburb,type:pr.type,stories:pr.stories,area:pr.area,notes:pr.notes,validDays:pr.validDays,pricing:{sub:t.sub,mar:t.mar,con:t.con,gst:t.gst,total:t.curr,margin:pr.margin,contingency:pr.contingency},sigData:null,status:"draft"});return pr});
    log("Proposal saved: "+name);notify("Proposal saved");
    setTab("proposal");setVoView(null);setInvView(null);setPropView(newIdx);setAnim(a=>a+1);
  };

  const alerts=[];
  projects.forEach((pr,idx)=>{pr.invoices.forEach(inv=>{if(inv.status==="pending")alerts.push({text:`${pName(pr)}: ${inv.desc} — ${fmt(inv.amount)}`,c:_.red,idx,tab:"invoices"})});pr.variations.forEach(v=>{if(v.status==="draft"||v.status==="pending")alerts.push({text:`${pName(pr)}: ${v.id} needs signature`,c:_.amber,idx,tab:"variations"})});pr.defects.forEach(d=>{if(!d.done)alerts.push({text:`${pName(pr)}: ${d.desc}`,c:_.blue,idx,tab:"defects"})})});
  const allT=projects.map(pr=>({...pr,...calc(pr)}));
  const pipeV=allT.filter(x=>["Quote","Approved"].includes(x.status)).reduce((s,x)=>s+x.curr,0);
  const actV=allT.filter(x=>x.status==="Active").reduce((s,x)=>s+x.curr,0);
  const quoteReady=p.client&&T.items>0;
  const quoteSent=["Approved","Active","Invoiced","Complete"].includes(p.status);
  const recentActivity=projects.flatMap((pr,idx)=>(pr.activity||[]).slice(0,4).map(a=>({...a,project:pName(pr),idx}))).slice(0,8);

  // ═══ Workflow stepper — "Next Best Action" engine ═══
  const wfSteps=[
    {key:"plans",label:"Upload plans",done:!!planData||T.items>0,detail:planData?`${planData.total_m2}m² analysed`:"Optional — AI scope extraction",action:()=>go("plans"),optional:true,Ic:Ruler},
    {key:"scope",label:"Build scope",done:T.items>0,detail:T.items>0?`${T.items} items · ${fmt(T.sub)}`:"Select items from rate library",action:()=>go("quote"),Ic:PenLine},
    {key:"client",label:"Add client details",done:!!p.client,detail:p.client?pName(p):"Name, address, contact",action:()=>go("quote"),Ic:FileText},
    {key:"proposal",label:"Generate proposal",done:p.proposals.length>0,detail:p.proposals.length>0?`${p.proposals.length} saved`:"Requires scope + client",action:()=>{if(quoteReady)createProp();else go("quote")},Ic:FileText},
    {key:"schedule",label:"Set schedule",done:p.milestones.some(m=>m.planned),detail:`${p.milestones.filter(m=>m.planned).length} of ${p.milestones.length} dates set`,action:()=>go("schedule"),Ic:ClipboardList},
  ];
  const wfNext=wfSteps.find(s=>!s.done&&!s.optional)||wfSteps.find(s=>!s.done);
  const wfDone=wfSteps.filter(s=>s.done).length;
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
      {toast&&<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",zIndex:999,padding:"10px 24px",borderRadius:_.rFull,fontSize:13,fontWeight:600,color:"#fff",background:toast.type==="error"?_.red:_.ink,boxShadow:_.sh3,animation:"fadeUp 0.2s ease"}}>{toast.msg}</div>}

      {/* ═══ SIDEBAR ═══ */}
      <aside style={{width:240,flexShrink:0,background:"#ECEDF0",borderRight:`1px solid ${_.line}`,display:mobile?"none":"flex",flexDirection:"column"}}>
        {/* Logo */}
        <div style={{padding:"20px 16px 16px",display:"flex",alignItems:"center",gap:8,borderBottom:`1px solid ${_.line}`}}>
          <div style={{width:24,height:24,background:_.ink,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff"}}>i</div>
          <span style={{fontSize:14,fontWeight:700,color:_.ink,letterSpacing:"-0.03em"}}>iBuild</span>
          <div style={{flex:1}} />
          {saveStatus&&<span style={{fontSize:10,color:_.faint,fontWeight:500,whiteSpace:"nowrap"}}>{saveStatus==="saving"?"Saving\u2026":`Saved ${saveStatus}`}</span>}
        </div>

        {/* Project switcher */}
        <div style={{padding:"10px 12px",borderBottom:`1px solid ${_.line}`,position:"relative",zIndex:30}}>
          <div onClick={()=>setSw(!sw)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 10px",background:"rgba(255,255,255,0.5)",borderRadius:_.rSm,cursor:"pointer",transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.8)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.5)"}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:_.ink}}>{pName(p)}</div>
              <div style={{fontSize:11,color:_.muted,marginTop:1}}>{p.status} · {p.type}</div>
            </div>
            <ChevronDown size={13} color={_.muted} style={{flexShrink:0,transform:sw?"rotate(180deg)":"none",transition:"transform 0.15s"}} />
          </div>
          {sw&&<div style={{position:"absolute",top:"100%",left:4,right:4,background:_.surface,borderRadius:_.r,zIndex:100,boxShadow:_.sh3+",0 0 0 1px rgba(0,0,0,0.06)",maxHeight:360,overflowY:"auto",marginTop:4,animation:"slideDown 0.15s ease"}}>
            {projects.map((pr,i)=>(
              <div key={pr.id} style={{padding:"10px 14px",cursor:"pointer",background:i===ai?_.well:_.surface,display:"flex",justifyContent:"space-between",alignItems:"center",transition:"background 0.1s"}} onClick={()=>{setAi(i);setSw(false)}} onMouseEnter={e=>{if(i!==ai)e.currentTarget.style.background=_.well}} onMouseLeave={e=>{e.currentTarget.style.background=i===ai?_.well:_.surface}}>
                <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pName(pr)}</div><div style={{fontSize:11,color:_.muted,marginTop:1}}>{pr.type}{calc(pr).curr>0?` · ${fmt(calc(pr).curr)}`:""}</div></div>
                <div style={{display:"flex",gap:4,alignItems:"center",flexShrink:0}}>
                  <span style={badge(stCol(pr.status))}>{pr.status}</span>
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
            <div key={g.group} style={{marginBottom:8}}>
              <div style={{padding:"12px 16px 4px",fontSize:10,fontWeight:700,color:_.muted,letterSpacing:"0.08em",textTransform:"uppercase"}}>{g.group}</div>
              {g.items.map(item=>(
                <div key={item.id} onClick={()=>go(item.id)} style={{
                  display:"flex",alignItems:"center",gap:8,padding:"7px 16px",fontSize:13,cursor:"pointer",
                  borderLeft:tab===item.id?`2px solid ${_.ink}`:"2px solid transparent",
                  background:tab===item.id?"rgba(0,0,0,0.05)":"transparent",
                  color:tab===item.id?_.ink:_.body,
                  fontWeight:tab===item.id?600:400,
                  transition:"all 0.1s ease",
                }} onMouseEnter={e=>{if(tab!==item.id)e.currentTarget.style.background="rgba(0,0,0,0.03)"}} onMouseLeave={e=>{if(tab!==item.id)e.currentTarget.style.background="transparent"}}>
                  <item.Ic size={15} strokeWidth={tab===item.id?2:1.5} />
                  {item.l}
                </div>
              ))}
            </div>
          ))}
        </div>
      </aside>

      {/* ═══ MOBILE HEADER ═══ */}
      {mobile&&<div style={{position:"fixed",top:0,left:0,right:0,zIndex:50,background:_.surface,borderBottom:`1px solid ${_.line}`,padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:28,height:28,background:_.ac,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"#fff"}}>i</div>
          <div><span style={{fontSize:15,fontWeight:700,color:_.ink}}>iBuild</span>{saveStatus&&<div style={{fontSize:9,color:_.faint,fontWeight:500}}>{saveStatus==="saving"?"Saving\u2026":`Saved ${saveStatus}`}</div>}</div>
        </div>
        <div onClick={()=>setSw(!sw)} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",background:_.well,borderRadius:_.rSm,cursor:"pointer",maxWidth:"55%"}}>
          <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pName(p)}</div>
          <ChevronDown size={14} color={_.muted} style={{flexShrink:0,transform:sw?"rotate(180deg)":"none",transition:"transform 0.15s"}} />
        </div>
      </div>}
      {mobile&&sw&&<div style={{position:"fixed",top:52,left:8,right:8,zIndex:100,background:_.surface,borderRadius:_.r,boxShadow:_.sh3+",0 0 0 1px rgba(0,0,0,0.06)",maxHeight:360,overflowY:"auto",animation:"slideDown 0.15s ease"}}>
        {projects.map((pr,i)=>(
          <div key={pr.id} style={{padding:"12px 14px",cursor:"pointer",background:i===ai?_.well:_.surface,display:"flex",justifyContent:"space-between",alignItems:"center",minHeight:44}} onClick={()=>{setAi(i);setSw(false)}}>
            <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pName(pr)}</div><div style={{fontSize:11,color:_.muted,marginTop:1}}>{pr.type}</div></div>
            <span style={badge(stCol(pr.status))}>{pr.status}</span>
          </div>
        ))}
        <div onClick={()=>{setProjects(pv=>[...pv,mkProject()]);setAi(projects.length);setSw(false);go("quote")}} style={{padding:"12px 14px",cursor:"pointer",color:_.ac,fontSize:13,fontWeight:600,textAlign:"center",borderTop:`1px solid ${_.line}`,minHeight:44}}>+ New Project</div>
      </div>}

      {/* ═══ MAIN CONTENT ═══ */}
      <main style={{flex:1,overflowY:"auto",padding:mobile?"72px 16px 88px":"48px 64px 80px"}}>

        {/* ════════════════════════════════════
            OVERVIEW — Structural OS
        ════════════════════════════════════ */}
        {tab==="dash"&&<div style={{animation:"fadeUp 0.2s ease",maxWidth:1200}} key={anim}>

          {/* ═══ Two-column layout — content / sidebar ═══ */}
          <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 300px",gap:mobile?32:64,alignItems:"start"}}>

            {/* ── LEFT: Primary ── */}
            <div>

              {/* HEADER — title + metadata, no container */}
              <div style={{marginBottom:mobile?32:48}}>
                <h1 style={{fontSize:mobile?28:40,fontWeight:700,letterSpacing:"-0.03em",margin:0,lineHeight:1.1,color:_.ink}}>
                  {pName(p)==="New Project"?"Overview":pName(p)}
                </h1>
                <div style={{fontSize:13,color:_.muted,marginTop:8,letterSpacing:"-0.01em"}}>{p.status} · {p.type}{p.area?` · ${p.area}m²`:""} · {ds()}</div>
              </div>

              {/* PRIMARY METRIC — contract value, executive dominance */}
              <div style={{marginBottom:0}}>
                <div style={{fontSize:11,color:_.body,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12}}>Contract Value</div>
                <div style={{fontSize:mobile?48:72,fontWeight:700,letterSpacing:"-0.045em",lineHeight:1,fontVariantNumeric:"tabular-nums",color:T.curr>0?"#0a0f1a":_.faint}}>{fmt(T.curr)}</div>
              </div>

              {/* Pipeline status — reduced noise, wider breathing room */}
              <div style={{marginTop:40,marginBottom:0,paddingTop:32,paddingBottom:32}}>
                <div style={{display:"flex",alignItems:"center",gap:0}}>
                  {STAGES.map((s,i)=>(
                    <div key={s} style={{flex:1,display:"flex",alignItems:"center"}}>
                      <div style={{width:6,height:6,borderRadius:"50%",background:i<=sIdx(p.status)?"#0a0f1a":_.line2,flexShrink:0,zIndex:1,transition:"background 0.2s"}} />
                      {i<STAGES.length-1&&<div style={{flex:1,height:1,background:i<sIdx(p.status)?"#0a0f1a":_.line,transition:"background 0.2s"}} />}
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:10}}>
                  {STAGES.map((s,i)=>(<span key={s} style={{fontSize:10,color:i<=sIdx(p.status)?"#0a0f1a":_.faint,fontWeight:i===sIdx(p.status)?700:400,letterSpacing:"0.02em"}}>{s}</span>))}
                </div>
              </div>

              {/* Clear separation — large whitespace break */}
              <div style={{height:1,background:_.line,marginBottom:56}} />

              {/* SECONDARY METRICS — structured, aligned, divider lines */}
              <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 1fr 1fr",gap:0,marginBottom:56,paddingBottom:48,borderBottom:`1px solid ${_.line}`}}>
                {[["Pipeline",pipeV,`${allT.filter(x=>["Quote","Approved"].includes(x.status)).length} quotes`,_.amber],
                  ["Active Jobs",actV,`${allT.filter(x=>x.status==="Active").length} active`,_.green],
                  ["Outstanding",allT.reduce((s,x)=>s+x.inv-x.paid,0),`${allT.reduce((s,x)=>s+x.invoices.filter(i2=>i2.status==="pending").length,0)} unpaid`,_.red],
                ].map(([lb,val,sub,c],idx)=>(
                  <div key={lb} style={{borderRight:!mobile&&idx<2?`1px solid ${_.line}`:"none",paddingLeft:!mobile&&idx>0?32:0,paddingRight:!mobile&&idx<2?32:0}}>
                    <div style={{fontSize:11,color:_.body,fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:8}}>{lb}</div>
                    <div style={{fontSize:24,fontWeight:700,letterSpacing:"-0.03em",color:val===0?_.faint:_.ink,fontVariantNumeric:"tabular-nums",marginBottom:6}}>{fmt(val)}</div>
                    <div style={{fontSize:12,color:c,fontWeight:500}}>{sub}</div>
                  </div>
                ))}
              </div>

              {/* PROJECT SETUP — workflow stepper */}
              <div style={{marginBottom:48}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:20}}>
                  <div style={{fontSize:14,fontWeight:600,color:_.ink}}>Project setup</div>
                  <div style={{fontSize:12,color:_.muted}}>{wfDone} of {wfSteps.length}</div>
                </div>
                {wfSteps.map((step,i)=>(
                  <div key={step.key} onClick={step.action} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 0",cursor:"pointer",borderBottom:`1px solid ${_.line}`,transition:"padding-left 0.12s"}} onMouseEnter={e=>e.currentTarget.style.paddingLeft="4px"} onMouseLeave={e=>e.currentTarget.style.paddingLeft="0"}>
                    <div style={{width:20,height:20,borderRadius:10,background:step.done?_.ink:"transparent",border:step.done?"none":`1.5px solid ${_.line2}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{step.done&&<Check size={10} strokeWidth={3} color="#fff" />}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:step.done?500:500,color:step.done?_.muted:_.ink}}>{step.label}{step.optional?<span style={{fontSize:11,color:_.faint,marginLeft:6}}>Optional</span>:""}</div>
                      <div style={{fontSize:12,color:step.done?_.faint:_.muted,marginTop:1}}>{step.detail}</div>
                    </div>
                    {!step.done&&<ArrowRight size={13} color={_.faint} />}
                  </div>
                ))}

                {/* Single primary CTA — next best action */}
                {wfNext&&<div style={{marginTop:20}}>
                  <button onClick={wfNext.action} style={{...btnPrimary,padding:"11px 20px"}}>{wfNext.label} <ArrowRight size={14} /></button>
                </div>}
                {!wfNext&&<div style={{marginTop:20,fontSize:13,color:_.green,fontWeight:500}}>All steps complete</div>}
              </div>

              {/* ATTENTION — structured list */}
              {alerts.length>0&&<div style={{paddingTop:32,borderTop:`1px solid ${_.line}`}}>
                <div style={{fontSize:11,color:_.muted,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:16}}>Needs attention</div>
                {alerts.slice(0,5).map((a,i)=>(
                  <div key={i} onClick={()=>{setAi(a.idx);go(a.tab)}} style={{padding:"10px 0",display:"flex",alignItems:"center",gap:12,cursor:"pointer",borderBottom:i<Math.min(alerts.length,5)-1?`1px solid ${_.line}`:"none"}} onMouseEnter={e=>e.currentTarget.style.opacity="0.7"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                    <div style={{width:6,height:6,borderRadius:3,background:a.c,flexShrink:0}} />
                    <span style={{fontSize:13,color:_.body,lineHeight:1.4}}>{a.text}</span>
                  </div>
                ))}
              </div>}
            </div>

            {/* ── RIGHT: Context-aware next step + Activity ── */}
            <div style={{position:mobile?"static":"sticky",top:48}}>

              {/* Next step — context-aware, single CTA */}
              <div style={{marginBottom:40,paddingBottom:32,borderBottom:`1px solid ${_.line}`}}>
                <div style={{fontSize:11,color:_.muted,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:14}}>Next step</div>
                {wfNext ? (<>
                  <div style={{fontSize:14,fontWeight:500,color:_.ink,marginBottom:4}}>{wfNext.label}</div>
                  <div style={{fontSize:12,color:_.muted,marginBottom:12}}>{wfNext.detail}</div>
                  <button onClick={wfNext.action} style={{...btnPrimary,width:"100%",justifyContent:"center",padding:"10px 18px"}}>{wfNext.label} <ArrowRight size={14} /></button>
                </>) : (<>
                  <div style={{fontSize:14,fontWeight:500,color:_.ink,marginBottom:4}}>Project ready</div>
                  <div style={{fontSize:12,color:_.muted,marginBottom:12}}>All setup steps complete</div>
                  {quoteSent
                    ?<button onClick={()=>go("invoices")} style={{...btnPrimary,width:"100%",justifyContent:"center",padding:"10px 18px"}}>Manage invoices <ArrowRight size={14} /></button>
                    :<button onClick={()=>go("quote")} style={{...btnPrimary,width:"100%",justifyContent:"center",padding:"10px 18px"}}>View quote <ArrowRight size={14} /></button>
                  }
                </>)}
              </div>

              {/* Activity — structured list, dividers between items */}
              <div>
                <div style={{fontSize:11,color:_.muted,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:14}}>Activity</div>
                {recentActivity.length===0 ? (
                  <div style={{fontSize:13,color:_.faint,padding:"8px 0"}}>No activity yet</div>
                ) : recentActivity.slice(0,8).map((a,i)=>(
                  <div key={i} style={{padding:"10px 0",display:"flex",alignItems:"flex-start",gap:10,borderBottom:i<Math.min(recentActivity.length,8)-1?`1px solid ${_.line}`:"none"}}>
                    <div style={{width:5,height:5,borderRadius:3,background:_.line2,flexShrink:0,marginTop:6}} />
                    <div>
                      <div style={{fontSize:13,color:_.body,lineHeight:1.5}}>{a.action}</div>
                      <div style={{fontSize:11,color:_.faint,marginTop:2}}>{a.project} · {a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>}

        {/* ════ QUOTE — Clean guided flow ════ */}
        {tab==="quote"&&<Section key={anim}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:_.s2}}>
            <h1 style={{fontSize:40,fontWeight:700,letterSpacing:"-0.03em"}}>Quote</h1>
            {T.curr>0&&<span style={{fontSize:40,fontWeight:700,color:_.ink,letterSpacing:"-0.03em",fontVariantNumeric:"tabular-nums"}}>{fmt(T.curr)}</span>}
          </div>

          {/* Step indicator */}
          <div style={{display:"flex",gap:_.s6,marginBottom:_.s9,paddingBottom:_.s5,borderBottom:`1px solid ${_.line}`}}>
            {[["Details",!!p.client],["Scope",T.items>0],["Review",T.curr>0]].map(([l2,done],i)=>(
              <div key={l2} style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:20,height:20,borderRadius:10,background:done?_.green:_.well,border:done?"none":`1.5px solid ${_.line2}`,display:"flex",alignItems:"center",justifyContent:"center"}}>{done&&<Check size={11} strokeWidth={3} color="#fff" />}</div>
                <span style={{fontSize:13,fontWeight:done?600:400,color:done?_.ink:_.muted}}>{l2}</span>
              </div>
            ))}
          </div>

          {/* Client details */}
          <div style={{marginBottom:_.s9}}>
            <div style={{fontSize:18,fontWeight:600,color:_.ink,marginBottom:_.s5}}>Client & Project</div>
            <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 1fr",gap:`${_.s3}px ${_.s4}px`}}>
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
            <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 1fr 1fr",gap:_.s4,marginTop:_.s4}}>
              <div><label style={label}>Margin %</label><input type="number" style={{...input,textAlign:"center",fontWeight:600,fontSize:18}} value={p.margin} onChange={e=>up(pr=>{pr.margin=parseFloat(e.target.value)||0;return pr})} /></div>
              <div><label style={label}>Contingency %</label><input type="number" style={{...input,textAlign:"center",fontWeight:600,fontSize:18}} value={p.contingency} onChange={e=>up(pr=>{pr.contingency=parseFloat(e.target.value)||0;return pr})} /></div>
              <div><label style={label}>Status</label><select style={{...input,cursor:"pointer"}} value={p.status} onChange={e=>{const nv=e.target.value;up(pr=>{pr.status=nv;return pr});log("Status → "+nv)}}>{STAGES.map(s=><option key={s}>{s}</option>)}</select></div>
            </div>
          </div>

          {/* Scope of Works */}
          <div style={{marginBottom:_.s9}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:_.s5}}>
              <div style={{fontSize:18,fontWeight:600,color:_.ink}}>Scope of Works</div>
              {T.items>0&&<span style={{fontSize:14,color:_.body}}>{T.items} items · {fmt(T.sub)}</span>}
            </div>
            {Object.entries(p.scope).map(([cat,items])=>{
              const open=exp[cat];const catT=items.filter(i=>i.on).reduce((t,i)=>t+i.rate*i.qty,0);const n=items.filter(i=>i.on).length;
              return(<div key={cat} style={{marginBottom:2}}>
                <div onClick={()=>setExp(e2=>({...e2,[cat]:!e2[cat]}))} style={{padding:"10px 12px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",background:"transparent",borderRadius:0,borderLeft:n>0?`2px solid ${_.ac}`:`2px solid transparent`,transition:"background 0.1s"}}>

                  <div style={{display:"flex",alignItems:"center",gap:_.s2}}>
                    <span style={{transform:open?"rotate(90deg)":"none",display:"inline-flex",transition:"transform 0.15s"}}><ChevronRight size={13} color={n>0?_.ac:_.muted} /></span>
                    <span style={{fontSize:14,fontWeight:n>0?600:400,color:n>0?_.ink:_.muted}}>{cat}</span>
                    {n>0&&<span style={{fontSize:11,fontWeight:600,color:_.ac,marginLeft:4}}>{n}</span>}
                  </div>
                  {catT>0&&<span style={{fontSize:14,fontWeight:700,fontVariantNumeric:"tabular-nums",color:_.ink}}>{fmt(catT)}</span>}
                </div>
                {open&&<div style={{paddingBottom:_.s4,paddingLeft:24,borderLeft:`2px solid ${_.line}`,marginLeft:0}}>
                  {items.map((item,idx)=>(
                    <div key={item._id} style={{display:"flex",gap:_.s2,alignItems:"center",padding:"5px 0"}}>
                      <div onClick={()=>uI(cat,idx,"on",!item.on)} style={{width:16,height:16,borderRadius:4,border:`1.5px solid ${item.on?_.ac:_.line2}`,background:item.on?_.ac:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background 0.1s"}}>{item.on&&<Check size={10} strokeWidth={3} color="#fff" />}</div>
                      <span style={{flex:1,fontSize:13,color:item.on?_.ink:_.muted}}>{item.item}</span>
                      {item.on&&<>
                        <input type="number" style={{width:48,padding:"3px 5px",background:_.well,border:`1px solid ${_.line}`,borderRadius:_.rXs,color:_.ink,fontSize:12,textAlign:"center",outline:"none",fontWeight:600}} value={item.qty} onChange={e=>uI(cat,idx,"qty",parseFloat(e.target.value)||0)} />
                        <span style={{fontSize:11,color:_.muted,minWidth:22}}>{item.unit}</span>
                        <input type="number" style={{width:60,padding:"3px 5px",background:_.well,border:`1px solid ${_.line}`,borderRadius:_.rXs,color:_.ink,fontSize:12,textAlign:"right",outline:"none",fontWeight:600}} value={item.rate} onChange={e=>uI(cat,idx,"rate",parseFloat(e.target.value)||0)} />
                        <span style={{fontSize:13,fontWeight:600,minWidth:56,textAlign:"right",fontVariantNumeric:"tabular-nums"}}>{fmt(item.rate*item.qty)}</span>
                      </>}
                    </div>
                  ))}
                  <div onClick={()=>addC(cat)} style={{padding:"6px 0",cursor:"pointer",color:_.ac,fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:4}} onMouseEnter={e=>e.currentTarget.style.opacity="0.7"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}><Plus size={13} /> Add item</div>
                </div>}
              </div>)
            })}
          </div>

          {/* Review — distinct "ready to send" section */}
          {T.curr>0&&<div style={{paddingTop:_.s8,marginTop:_.s4,borderTop:`2px solid ${_.ink}`,marginBottom:_.s7}}>
            <div style={{fontSize:11,color:_.body,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:16}}>Review</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:_.s5}}>
              <div style={{fontSize:20,fontWeight:600,color:_.ink}}>Contract Total</div>
              <div style={{fontSize:mobile?40:56,fontWeight:700,letterSpacing:"-0.04em",lineHeight:1,fontVariantNumeric:"tabular-nums",color:"#0a0f1a"}}>{fmt(T.curr)}</div>
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:_.s6}}>
              <div style={{textAlign:"right",minWidth:200}}>
                {[["Subtotal",fmt(T.sub)],[`Margin ${p.margin}%`,fmt(T.mar)],[`Contingency ${p.contingency}%`,fmt(T.con)],["GST",fmt(T.gst)]].map(([l2,v2])=>(
                  <div key={l2} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",fontSize:13,color:_.muted}}>
                    <span>{l2}</span><span style={{fontVariantNumeric:"tabular-nums",marginLeft:24}}>{v2}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{display:"flex",gap:_.s2}}>
              {quoteReady
                ?<button onClick={()=>createProp()} style={{...btnPrimary,padding:"11px 24px",fontSize:14}}>Generate proposal <ArrowRight size={14} /></button>
                :<button onClick={()=>{}} style={{...btnPrimary,opacity:0.4,cursor:"default",padding:"11px 24px",fontSize:14}}>Add client details first</button>}
              <button onClick={()=>go("costs")} style={btnGhost}>Cost tracker</button>
            </div>
          </div>}
        </Section>}

        {/* ════ PLANS AI ════ */}
        {tab==="plans"&&<Section key={anim}>
          <h1 style={{fontSize:40,fontWeight:700,letterSpacing:"-0.03em",marginBottom:4}}>Plans AI</h1>
          <div style={{fontSize:14,color:_.muted,marginBottom:_.s3}}>Upload floor plans for AI-powered scope extraction</div>
          <div style={{fontSize:12,color:_.faint,marginBottom:_.s8}}>Analyses your plan image and suggests construction line items with Australian rates. Works with the local server ({`npm run server`}).</div>

          {/* Upload zone */}
          {!planData&&!planLoad&&<div style={{textAlign:"center",padding:`${_.s9}px ${_.s7}px`,border:`1.5px dashed ${_.line2}`,borderRadius:_.r,marginBottom:_.s7,transition:"border-color 0.15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=_.ink} onMouseLeave={e=>e.currentTarget.style.borderColor=_.line2}>
            <Upload size={28} strokeWidth={1.5} color={_.muted} style={{marginBottom:12}} />
            <div style={{fontSize:15,color:_.ink,marginBottom:4,fontWeight:500}}>Upload a floor plan</div>
            <div style={{fontSize:13,color:_.muted,marginBottom:_.s5}}>PNG, JPG, or PDF up to 20MB</div>
            <label style={btnPrimary}><input ref={planFileRef} type="file" accept="image/*,.pdf" style={{display:"none"}} onChange={e=>{if(e.target.files[0])analysePlan(e.target.files[0])}} />Choose file</label>
          </div>}

          {/* Loading */}
          {planLoad&&<div style={{textAlign:"center",padding:_.s9}}>
            <div style={{width:32,height:32,border:`3px solid ${_.line}`,borderTopColor:_.ac,borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 14px"}} />
            <div style={{fontSize:14,color:_.body,fontWeight:500}}>Analysing floor plan...</div>
          </div>}

          {/* Results — two-column structural layout */}
          {planData&&!planData.error&&<div>
            <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 1fr",gap:32,marginBottom:32}}>

              {/* LEFT: Floor plan image */}
              {planImg&&<div>
                <div style={{fontSize:11,color:_.muted,fontWeight:600,letterSpacing:"0.04em",textTransform:"uppercase",marginBottom:_.s3}}>Floor Plan</div>
                <div style={{border:`1px solid ${_.line}`,borderRadius:_.r,overflow:"hidden",background:_.well}}>
                  <img src={planImg} alt="Floor plan" style={{width:"100%",display:"block"}} />
                </div>
              </div>}

              {/* RIGHT: Analysis summary */}
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:_.s5}}>
                  <div style={{fontSize:11,color:_.muted,fontWeight:600,letterSpacing:"0.04em",textTransform:"uppercase"}}>AI Analysis</div>
                  <span style={badge(_.green)}>AI Confidence: High</span>
                </div>

                {/* Key metrics — divider-based, no boxes */}
                <div style={{display:"flex",gap:0,marginBottom:_.s6,borderBottom:`1px solid ${_.line}`}}>
                  <div style={{flex:1,padding:"16px 0"}}>
                    <div style={{fontSize:11,color:_.muted,fontWeight:600,letterSpacing:"0.04em",textTransform:"uppercase",marginBottom:4}}>Total Area</div>
                    <div style={{fontSize:28,fontWeight:700,fontVariantNumeric:"tabular-nums",letterSpacing:"-0.03em"}}>{planData.total_m2}m²</div>
                  </div>
                  <div style={{width:1,background:_.line,margin:"0 20px"}} />
                  <div style={{flex:1,padding:"16px 0"}}>
                    <div style={{fontSize:11,color:_.muted,fontWeight:600,letterSpacing:"0.04em",textTransform:"uppercase",marginBottom:4}}>Estimated Cost</div>
                    <div style={{fontSize:28,fontWeight:700,fontVariantNumeric:"tabular-nums",letterSpacing:"-0.03em"}}>{planData.scope_items?.length?fmt(planData.scope_items.reduce((s,si)=>s+si.rate*si.qty,0)):"—"}</div>
                  </div>
                </div>

                {/* Detected rooms */}
                <div style={{fontSize:11,color:_.muted,fontWeight:600,letterSpacing:"0.04em",textTransform:"uppercase",marginBottom:_.s3}}>Detected Rooms ({planData.rooms?.length||0})</div>
                {planData.rooms?.map((rm,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${_.line}`,fontSize:13}}>
                    <span style={{color:_.body}}>{rm.name}</span>
                    <span style={{fontWeight:600,fontVariantNumeric:"tabular-nums"}}>{rm.m2}m²</span>
                  </div>
                ))}

                {planData.notes&&<div style={{marginTop:_.s5,fontSize:13,color:_.muted,lineHeight:1.6}}>{planData.notes}</div>}
              </div>
            </div>

            {/* Scope breakdown */}
            {planData.scope_items?.length>0&&<div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:_.s4,paddingTop:_.s5,borderTop:`1px solid ${_.line}`}}>
                <div style={{fontSize:18,fontWeight:600,color:_.ink}}>Extracted Scope Items</div>
                <span style={{fontSize:16,fontWeight:700,fontVariantNumeric:"tabular-nums"}}>{fmt(planData.scope_items.reduce((s,si)=>s+si.rate*si.qty,0))}</span>
              </div>
              {planData.scope_items.map((si,i)=>(
                <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 100px 80px 100px",gap:8,padding:"10px 0",borderBottom:`1px solid ${_.line}`,fontSize:13,alignItems:"center"}}>
                  <div>
                    <div style={{fontWeight:500,color:_.ink}}>{si.item}</div>
                    <div style={{fontSize:11,color:_.muted,marginTop:1}}>{si.category}</div>
                  </div>
                  <div style={{color:_.muted,fontSize:12}}>{si.qty} {si.unit}</div>
                  <div style={{color:_.muted,fontSize:12,textAlign:"right"}}>@ {fmt(si.rate)}</div>
                  <div style={{fontWeight:600,textAlign:"right",fontVariantNumeric:"tabular-nums"}}>{fmt(si.rate*si.qty)}</div>
                </div>
              ))}
              {/* Handoff CTA — prominent */}
              <div style={{marginTop:_.s7,paddingTop:_.s6,borderTop:`1px solid ${_.line}`,display:"flex",alignItems:"center",gap:_.s3}}>
                <button onClick={addPlanItems} style={{...btnPrimary,padding:"12px 24px",fontSize:14}}>Add {planData.scope_items.length} items to Quote <ArrowRight size={14} /></button>
                <label style={{...btnGhost,cursor:"pointer"}}><input ref={planFileRef} type="file" accept="image/*,.pdf" style={{display:"none"}} onChange={e=>{if(e.target.files[0])analysePlan(e.target.files[0])}} />Re-upload</label>
              </div>
            </div>}

            {!planData.scope_items?.length&&<div style={{marginTop:_.s6,display:"flex",alignItems:"center",gap:_.s3}}>
              <button onClick={()=>{up(pr=>{pr.area=String(planData.total_m2);return pr});log("Plan analysed: "+planData.total_m2+"m²");go("quote");notify(planData.total_m2+"m² applied")}} style={{...btnPrimary,padding:"12px 24px",fontSize:14}}>Apply {planData.total_m2}m² to project <ArrowRight size={14} /></button>
              <label style={{...btnGhost,cursor:"pointer"}}><input type="file" accept="image/*,.pdf" style={{display:"none"}} onChange={e=>{if(e.target.files[0])analysePlan(e.target.files[0])}} />Re-upload</label>
            </div>}
          </div>}

          {planData?.error&&<div style={{padding:_.s4,border:`1px solid ${_.red}30`,borderRadius:_.r,background:`${_.red}08`,display:"flex",alignItems:"center",gap:_.s3}}>
            <AlertTriangle size={16} color={_.red} />
            <div style={{fontSize:14,color:_.red,fontWeight:500}}>{planData.error}</div>
          </div>}
        </Section>}

        {/* ════ COSTS ════ */}
        {tab==="costs"&&<Section key={anim}>
          <h1 style={{fontSize:40,fontWeight:700,letterSpacing:"-0.03em",marginBottom:_.s7}}>Cost Tracker</h1>
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
                <div key={item._id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",fontSize:13}}>
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
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:_.s7}}>
            <div>
              <h1 style={{fontSize:40,fontWeight:700,letterSpacing:"-0.03em",marginBottom:4}}>Schedule</h1>
              <div style={{fontSize:14,color:_.muted}}>{p.milestones.filter(m=>m.done).length} of {p.milestones.length} milestones · {p.milestones.length>0?Math.round((p.milestones.filter(m=>m.done).length/p.milestones.length)*100):0}%</div>
            </div>
            {/* TODO: Wire to real PDF export when backend supports it */}
            <button onClick={()=>notify("Export coming soon")} style={btnSecondary}><Printer size={14} /> Export</button>
          </div>

          {/* Progress + shift controls */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:_.s6,paddingBottom:_.s6,borderBottom:`1px solid ${_.line}`}}>
            <div>
              <div style={{fontSize:11,color:_.body,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:8}}>Build Progress</div>
              <div style={{fontSize:48,fontWeight:700,letterSpacing:"-0.04em",lineHeight:1,fontVariantNumeric:"tabular-nums",color:_.ink}}>{p.milestones.length>0?Math.round((p.milestones.filter(m=>m.done).length/p.milestones.length)*100):0}<span style={{fontSize:18,color:_.muted}}>%</span></div>
            </div>
            {/* Shift schedule control */}
            <div style={{display:"flex",alignItems:"center",gap:_.s2}}>
              <span style={{fontSize:12,color:_.muted}}>Shift undone by</span>
              <input type="number" style={{width:56,padding:"5px 8px",background:_.well,border:`1px solid ${_.line}`,borderRadius:_.rXs,color:_.ink,fontSize:13,textAlign:"center",outline:"none",fontWeight:600}} value={shiftWeeks} onChange={e=>setShiftWeeks(e.target.value)} placeholder="0" />
              <span style={{fontSize:12,color:_.muted}}>wks</span>
              <button onClick={()=>{const w=parseInt(shiftWeeks);if(!w)return;up(pr=>{pr.milestones.forEach(ms=>{if(!ms.done)ms.wk=Math.max(0,(ms.wk||0)+w)});return pr});log(`Schedule shifted ${w>0?"+":""}${w} weeks`);setShiftWeeks("");notify(`Shifted ${w>0?"+":""}${w} weeks`)}} style={{...btnSecondary,padding:"5px 12px",fontSize:12}}>Shift</button>
            </div>
          </div>

          {/* Gantt bar */}
          <div style={{marginBottom:_.s7}}>
            <div style={{position:"relative",height:24,background:_.well,borderRadius:_.rSm,marginBottom:_.s3,overflow:"hidden"}}>
              <div style={{position:"absolute",left:0,top:0,bottom:0,width:`${ganttPct}%`,background:_.ink,borderRadius:_.rSm,transition:"width 0.6s ease"}} />
              {p.milestones.map((ms,i)=>{
                const left=ganttMaxWk?((ms.wk||0)/ganttMaxWk)*100:0;
                return(
                  <div key={i} style={{position:"absolute",left:`${left}%`,top:"50%",transform:"translate(-50%,-50%)",width:ms.done?8:6,height:ms.done?8:6,borderRadius:"50%",background:ms.done?"#fff":_.line2,border:ms.done?"none":`1.5px solid ${_.muted}`,zIndex:1,transition:"all 0.2s"}} title={`${ms.name} — Wk ${ms.wk||0}`} />
                );
              })}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:_.faint}}>
              <span>Wk 0</span><span>Wk {ganttMaxWk}</span>
            </div>
          </div>

          {/* Milestone table header */}
          <div style={{display:"grid",gridTemplateColumns:"32px 1fr 60px 120px 120px 80px",gap:8,padding:"8px 0",borderBottom:`2px solid ${_.ink}`,fontSize:10,color:_.muted,fontWeight:600,letterSpacing:"0.04em",textTransform:"uppercase"}}>
            <span></span><span>Milestone</span><span style={{textAlign:"center"}}>Week</span><span>Planned</span><span>Completed</span><span></span>
          </div>

          {/* Milestone rows */}
          {p.milestones.map((ms,i)=>{
            const isNext=i===p.milestones.findIndex(m=>!m.done)&&!ms.done;
            const isEditing=editMsIdx===i;
            return(
              <div key={i} style={{display:"grid",gridTemplateColumns:"32px 1fr 60px 120px 120px 80px",gap:8,padding:"10px 0",borderBottom:`1px solid ${_.line}`,alignItems:"center",fontSize:13,background:isNext?`${_.ac}06`:"transparent"}}>
                {/* Done toggle */}
                <div onClick={()=>{const wasDone=ms.done;up(pr=>{pr.milestones[i]={...ms,done:!ms.done,date:!ms.done?ds():ms.date};return pr});if(!wasDone)log("Milestone: "+ms.name)}} style={{width:18,height:18,borderRadius:9,border:ms.done?"none":`1.5px solid ${isNext?_.ac:_.line2}`,background:ms.done?_.ink:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all 0.15s"}}>{ms.done&&<Check size={10} strokeWidth={3} color="#fff" />}</div>
                {/* Name — inline edit */}
                {isEditing
                  ?<input autoFocus style={{fontSize:13,fontWeight:500,color:_.ink,border:"none",borderBottom:`1px solid ${_.ac}`,outline:"none",padding:"2px 0",background:"transparent",fontFamily:"inherit"}} value={editMsName} onChange={e=>setEditMsName(e.target.value)} onBlur={()=>{if(editMsName.trim())up(pr=>{pr.milestones[i].name=editMsName.trim();return pr});setEditMsIdx(null)}} onKeyDown={e=>{if(e.key==="Enter"){if(editMsName.trim())up(pr=>{pr.milestones[i].name=editMsName.trim();return pr});setEditMsIdx(null)}if(e.key==="Escape")setEditMsIdx(null)}} />
                  :<div onClick={()=>{setEditMsIdx(i);setEditMsName(ms.name)}} style={{cursor:"text",display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontWeight:ms.done?500:isNext?600:400,color:ms.done?_.muted:_.ink}}>{ms.name}</span>
                    {isNext&&<span style={{fontSize:10,fontWeight:600,color:_.ac}}>NEXT</span>}
                  </div>}
                {/* Week — editable */}
                <input type="number" style={{width:48,padding:"3px 6px",background:_.well,border:`1px solid ${_.line}`,borderRadius:_.rXs,color:_.ink,fontSize:12,textAlign:"center",outline:"none",fontWeight:600,fontFamily:"inherit"}} value={ms.wk||0} onChange={e=>up(pr=>{pr.milestones[i].wk=parseInt(e.target.value)||0;return pr})} />
                {/* Planned date */}
                <input type="date" value={ms.planned||""} onChange={e=>up(pr=>{pr.milestones[i]={...ms,planned:e.target.value};return pr})} style={{padding:"3px 6px",background:_.well,border:`1px solid ${_.line}`,borderRadius:_.rXs,color:_.ink,fontSize:11,outline:"none",cursor:"pointer",fontFamily:"inherit"}} />
                {/* Completed date */}
                <div style={{fontSize:12,color:ms.done?_.green:_.faint}}>{ms.done&&ms.date?ms.date:"—"}</div>
                {/* Actions: move up/down, delete */}
                <div style={{display:"flex",alignItems:"center",gap:2}}>
                  {i>0&&<div onClick={()=>up(pr=>{const tmp=pr.milestones[i];pr.milestones[i]=pr.milestones[i-1];pr.milestones[i-1]=tmp;return pr})} style={{cursor:"pointer",color:_.faint,padding:2,display:"flex"}} onMouseEnter={e=>e.currentTarget.style.color=_.ink} onMouseLeave={e=>e.currentTarget.style.color=_.faint}><ChevronRight size={12} style={{transform:"rotate(-90deg)"}} /></div>}
                  {i<p.milestones.length-1&&<div onClick={()=>up(pr=>{const tmp=pr.milestones[i];pr.milestones[i]=pr.milestones[i+1];pr.milestones[i+1]=tmp;return pr})} style={{cursor:"pointer",color:_.faint,padding:2,display:"flex"}} onMouseEnter={e=>e.currentTarget.style.color=_.ink} onMouseLeave={e=>e.currentTarget.style.color=_.faint}><ChevronRight size={12} style={{transform:"rotate(90deg)"}} /></div>}
                  <div onClick={()=>{if(p.milestones.length<=1)return;up(pr=>{pr.milestones.splice(i,1);return pr});notify("Removed")}} style={{cursor:"pointer",color:_.faint,padding:2,display:"flex"}} onMouseEnter={e=>e.currentTarget.style.color=_.red} onMouseLeave={e=>e.currentTarget.style.color=_.faint}><X size={12} /></div>
                </div>
              </div>
            );
          })}

          {/* Add milestone */}
          <div style={{display:"flex",gap:_.s2,marginTop:_.s4,paddingTop:_.s4,borderTop:`1px solid ${_.line}`}}>
            <input style={{...input,flex:1}} placeholder="Add milestone…" value={newMs} onChange={e=>setNewMs(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&newMs.trim()){const maxWk=Math.max(...p.milestones.map(m=>m.wk||0),0);up(pr=>{pr.milestones.push({name:newMs.trim(),wk:maxWk+4,done:false,date:"",planned:""});return pr});log("Milestone added: "+newMs.trim());setNewMs("");notify("Milestone added")}}} />
            <button onClick={()=>{if(!newMs.trim())return;const maxWk=Math.max(...p.milestones.map(m=>m.wk||0),0);up(pr=>{pr.milestones.push({name:newMs.trim(),wk:maxWk+4,done:false,date:"",planned:""});return pr});log("Milestone added: "+newMs.trim());setNewMs("");notify("Milestone added")}} style={btnPrimary}>Add</button>
          </div>
        </Section>}

        {/* ════ VARIATIONS LIST ════ */}
        {tab==="variations"&&voView===null&&<Section key={anim}>
          <h1 style={{fontSize:40,fontWeight:700,letterSpacing:"-0.03em",marginBottom:4}}>Variation Orders</h1>
          <div style={{fontSize:14,color:_.muted,marginBottom:_.s7}}>Changes to original contract scope</div>

          {/* VO equation strip */}
          <div style={{display:"flex",gap:mobile?_.s4:_.s7,marginBottom:_.s7,paddingBottom:_.s6,borderBottom:`1px solid ${_.line}`,alignItems:"baseline",flexWrap:mobile?"wrap":"nowrap"}}>
            <div><div style={label}>Original</div><div style={{fontSize:22,fontWeight:700}}>{fmt(T.orig)}</div></div>
            <span style={{color:_.faint,fontSize:18}}>+</span>
            <div><div style={{...label,color:_.ac}}>Approved</div><div style={{fontSize:22,fontWeight:700,color:_.ac}}>{fmt(T.aV)}</div></div>
            <span style={{color:_.faint,fontSize:18}}>=</span>
            <div><div style={{...label,color:_.green}}>Current</div><div style={{fontSize:22,fontWeight:700,color:_.green}}>{fmt(T.curr)}</div></div>
          </div>

          {/* New VO form */}
          <div style={{marginBottom:_.s7,paddingBottom:_.s7,borderBottom:`1px solid ${_.line}`}}>
            <div style={{fontSize:11,color:_.muted,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:_.s4}}>New Variation</div>
            <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 1fr",gap:`${_.s3}px ${_.s4}px`,marginBottom:_.s3}}>
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
                <div style={{width:36,height:36,borderRadius:_.rXs,background:_.well,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:_.ink,flexShrink:0}}>{v.id.split("-")[1]}</div>
                <div><div style={{fontSize:14,fontWeight:500}}>{v.description}</div><div style={{fontSize:12,color:_.muted,marginTop:1}}>{v.category?`${v.category} · `:""}{v.date}</div></div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:_.s3}}>
                <span style={{fontSize:16,fontWeight:700,fontVariantNumeric:"tabular-nums"}}>{v.amount>=0?"+":""}{fmt(v.amount)}</span>
                <span style={badge(v.status==="approved"?_.green:v.status==="rejected"?_.red:_.amber)}>{v.status}</span>
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
              <span style={badge(voD.status==="approved"?_.green:voD.status==="pending"?_.amber:_.muted)}>{voD.status}</span>
              <div style={{flex:1}} /><button onClick={()=>printEl(voDocRef)} style={btnGhost}><Printer size={14} /> Print</button>
            </div>
            <div ref={voDocRef} style={{background:"#fff",fontFamily:"'Inter',sans-serif",borderRadius:_.r,overflow:"hidden",boxShadow:"0 4px 24px rgba(0,0,0,0.06)",border:`1px solid ${_.line}`}}>
              <div style={{background:_.ink,color:"#fff",padding:"18px 28px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:22,height:22,background:"#fff",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:_.ink}}>i</div><span style={{fontSize:13,fontWeight:700}}>iBuild National</span></div><div style={{textAlign:"right"}}><div style={{fontSize:9,color:_.ac,letterSpacing:"0.1em",fontWeight:600}}>VARIATION ORDER</div><div style={{fontSize:16,fontWeight:700,color:_.ac}}>{voD.id}</div></div></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",borderBottom:`1px solid ${_.line}`}}>{[["Project",pName(p)],["Client",p.client],["Date",voD.date]].map(([l2,v2])=>(<div key={l2} style={{padding:"10px 16px",borderRight:`1px solid ${_.line}`}}><div style={{fontSize:9,color:_.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>{l2}</div><div style={{fontSize:12,fontWeight:500,marginTop:1}}>{v2||"—"}</div></div>))}</div>
              <div style={{padding:"18px 28px",borderBottom:`1px solid ${_.line}`}}><div style={{fontSize:9,color:_.ac,letterSpacing:"0.06em",fontWeight:600,marginBottom:4}}>DESCRIPTION</div><div style={{fontSize:13,lineHeight:1.7}}>{voD.description}</div>{voD.reason&&<div style={{fontSize:11,color:_.muted,marginTop:3}}>Reason: {voD.reason}</div>}</div>
              <div style={{padding:"18px 28px",borderBottom:`1px solid ${_.line}`}}><div style={{fontSize:9,color:_.ac,letterSpacing:"0.06em",fontWeight:600,marginBottom:10}}>CONTRACT IMPACT</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}><div style={{background:_.well,padding:12,borderRadius:_.r}}><div style={{fontSize:9,color:_.muted,fontWeight:600}}>BEFORE</div><div style={{fontSize:17,fontWeight:600,marginTop:2}}>{fmt(voCB)}</div></div><div style={{background:_.ink,padding:12,borderRadius:_.r,color:"#f8f8f6"}}><div style={{fontSize:9,color:_.ac,fontWeight:600}}>THIS VO</div><div style={{fontSize:17,fontWeight:600,color:_.ac,marginTop:2}}>{voD.amount>=0?"+":""}{fmt(voD.amount)}</div></div><div style={{background:_.well,padding:12,borderRadius:_.r}}><div style={{fontSize:9,color:_.muted,fontWeight:600}}>REVISED</div><div style={{fontSize:17,fontWeight:600,color:_.ac,marginTop:2}}>{fmt(voCB+voD.amount)}</div></div></div></div>
              <div style={{padding:"18px 28px"}}><div style={{fontSize:9,color:_.ac,letterSpacing:"0.06em",fontWeight:600,marginBottom:10}}>AUTHORISATION</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>{[["Builder — iBuild National",voD.builderSig],[`Client — ${p.client||"Owner"}`,voD.clientSig]].map(([l2,sig])=>(<div key={l2}><div style={{fontSize:11,fontWeight:600,marginBottom:3}}>{l2}</div>{sig?<div><img src={sig} alt="" style={{maxHeight:34}} /><div style={{fontSize:9,color:_.muted,marginTop:2}}>Signed {voD.approvedDate||voD.date}</div></div>:<div style={{borderBottom:`1px solid ${_.line2}`,height:34}} />}</div>))}</div>
                {voD.status==="approved"&&<div style={{marginTop:10,padding:"8px 12px",background:`${_.green}0a`,borderRadius:_.rSm,fontSize:12,color:_.green,fontWeight:600}}>Approved {voD.approvedDate}</div>}</div>
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
              </div>:<div style={{padding:_.s3,background:`${_.green}0a`,borderRadius:_.rXs,fontSize:13,color:_.green,fontWeight:500}}>{voSignAs==="builder"?"Builder":"Client"} signed</div>}
            </div>}
        </Section>}

        {/* ════ INVOICES ════ */}
        {tab==="invoices"&&invView===null&&<Section key={anim}>
          <h1 style={{fontSize:40,fontWeight:700,letterSpacing:"-0.03em",marginBottom:_.s7}}>Invoices</h1>
          <div style={{display:"flex",gap:mobile?_.s4:_.s9,marginBottom:_.s5,alignItems:"baseline",flexWrap:mobile?"wrap":"nowrap"}}>
            <div><div style={label}>Contract</div><div style={{fontSize:24,fontWeight:700}}>{fmt(T.curr)}</div></div>
            <div><div style={{...label,color:_.ac}}>Claimed</div><div style={{fontSize:24,fontWeight:700,color:_.ac}}>{fmt(T.inv)}</div></div>
            <div><div style={{...label,color:_.green}}>Paid</div><div style={{fontSize:24,fontWeight:700,color:_.green}}>{fmt(T.paid)}</div></div>
          </div>
          <div style={{height:4,background:_.line,borderRadius:2,marginBottom:_.s2}}><div style={{height:"100%",width:`${Math.min((T.inv/(T.curr||1))*100,100)}%`,background:_.ac,borderRadius:2,transition:"width 0.4s"}} /></div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:_.muted,marginBottom:_.s7,paddingBottom:_.s6,borderBottom:`1px solid ${_.line}`}}><span>{((T.inv/(T.curr||1))*100).toFixed(1)}% claimed</span><span>{fmt(T.curr-T.inv)} remaining</span></div>

          <div style={{marginBottom:_.s7,paddingBottom:_.s6,borderBottom:`1px solid ${_.line}`}}>
            <div style={{fontSize:11,color:_.muted,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:_.s4}}>New Progress Claim</div>
            <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"80px 1fr auto",gap:_.s2,alignItems:mobile?"stretch":"end"}}>
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
                <div onClick={e=>{e.stopPropagation();up(pr=>{pr.invoices[i]={...inv,status:inv.status==="paid"?"pending":"paid"};return pr});log(`Invoice ${inv.status==="paid"?"unpaid":"paid"}: ${inv.desc}`);notify(inv.status==="paid"?"Unpaid":"Paid")}} style={{...badge(inv.status==="paid"?_.green:_.amber),cursor:"pointer"}}>{inv.status}</div>
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
          <h1 style={{fontSize:40,fontWeight:700,letterSpacing:"-0.03em",marginBottom:_.s7}}>Site Diary</h1>
          <div style={{marginBottom:_.s7,paddingBottom:_.s6,borderBottom:`1px solid ${_.line}`}}>
            <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 1fr 1fr",gap:`${_.s3}px ${_.s4}px`,marginBottom:_.s3}}>
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
                <div style={{display:"flex",alignItems:"center",gap:_.s2}}><span style={{fontSize:14,fontWeight:600}}>{d.date}</span><span style={badge(_.muted)}>{d.weather}</span></div>
                <div onClick={()=>{up(pr=>{pr.diary.splice(i,1);return pr});notify("Removed")}} style={{cursor:"pointer",color:_.faint,transition:"color 0.15s"}} onMouseEnter={e=>e.currentTarget.style.color=_.red} onMouseLeave={e=>e.currentTarget.style.color=_.faint}><X size={14} /></div>
              </div>
              {d.trades&&<div style={{fontSize:13,color:_.ac,fontWeight:500,marginBottom:2}}>{d.trades}</div>}
              {d.notes&&<div style={{fontSize:14,color:_.body,lineHeight:1.6}}>{d.notes}</div>}
            </div>
          ))}
        </Section>}

        {/* ════ DEFECTS ════ */}
        {tab==="defects"&&<Section key={anim}>
          <h1 style={{fontSize:40,fontWeight:700,letterSpacing:"-0.03em",marginBottom:4}}>Defects</h1>
          <div style={{fontSize:14,color:_.muted,marginBottom:_.s7}}>{p.defects.filter(d=>d.done).length} of {p.defects.length} resolved</div>
          <div style={{marginBottom:_.s7,paddingBottom:_.s6,borderBottom:`1px solid ${_.line}`}}>
            <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 1fr 1fr",gap:_.s4,marginBottom:_.s3}}>
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
          <h1 style={{fontSize:40,fontWeight:700,letterSpacing:"-0.03em",marginBottom:_.s7}}>Trades</h1>
          <div style={{marginBottom:_.s7,paddingBottom:_.s6,borderBottom:`1px solid ${_.line}`}}>
            <div style={{display:"grid",gridTemplateColumns:mobile?"1fr 1fr":"1fr 1fr 1fr 1fr",gap:_.s4}}>
              {[["Trade","trade","Electrician"],["Company","company","Spark Bros"],["Contact","contact","Dave"],["Phone","phone","0412..."]].map(([l2,k,ph])=>(<div key={k}><label style={label}>{l2}</label><input style={input} value={trForm[k]} onChange={e=>setTrForm({...trForm,[k]:e.target.value})} placeholder={ph} /></div>))}
            </div>
            <button onClick={()=>{if(!trForm.trade){notify("Enter trade","error");return}up(pr=>{pr.trades.push({...trForm});return pr});log("Trade added: "+trForm.trade);setTrForm({trade:"",company:"",contact:"",phone:""});notify("Added")}} style={{...btnPrimary,marginTop:_.s3}}>Add trade</button>
          </div>
          {p.trades.length===0&&<Empty icon={Wrench} text="No trades" />}
          {p.trades.map((tr,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:`${_.s4}px 0`,borderBottom:`1px solid ${_.line}`}}>
              <div><span style={badge(_.ink)}>{tr.trade}</span><div style={{fontSize:14,fontWeight:500,marginTop:6}}>{tr.company}</div>{tr.contact&&<div style={{fontSize:12,color:_.muted,marginTop:1}}>{tr.contact}</div>}</div>
              <div style={{display:"flex",gap:_.s2,alignItems:"center"}}>{tr.phone&&<a href={`tel:${tr.phone}`} style={{fontSize:13,color:_.ac,textDecoration:"none",fontWeight:500}}>{tr.phone}</a>}<div onClick={()=>{up(pr=>{pr.trades.splice(i,1);return pr});notify("Removed")}} style={{cursor:"pointer",color:_.faint,transition:"color 0.15s"}} onMouseEnter={e=>e.currentTarget.style.color=_.red} onMouseLeave={e=>e.currentTarget.style.color=_.faint}><X size={14} /></div></div>
            </div>
          ))}
        </Section>}

        {/* ════ PROPOSAL LIST ════ */}
        {tab==="proposal"&&propView===null&&<Section key={anim}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:_.s7}}>
            <h1 style={{fontSize:40,fontWeight:700,letterSpacing:"-0.03em"}}>Proposals</h1>
            {quoteReady&&<button onClick={()=>createProp()} style={btnPrimary}><Plus size={14} /> New from current scope</button>}
          </div>
          {!quoteReady&&<Empty icon={FileText} text="Complete your quote first" action={()=>go("quote")} actionText="Go to Quote" />}
          {quoteReady&&p.proposals.length===0&&<Empty icon={FileText} text="No proposals yet — save one from your current scope" />}
          {p.proposals.map((prop,i)=>(
            <div key={i} onClick={()=>setPropView(i)} style={{padding:`${_.s4}px 0`,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${_.line}`,transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.paddingLeft="4px"} onMouseLeave={e=>e.currentTarget.style.paddingLeft="0"}>
              <div><div style={{fontSize:14,fontWeight:500}}>{prop.name}</div><div style={{fontSize:12,color:_.muted,marginTop:1}}>{prop.id} · {prop.date}</div></div>
              <div style={{display:"flex",alignItems:"center",gap:_.s3}}>
                <span style={{fontSize:16,fontWeight:700,fontVariantNumeric:"tabular-nums"}}>{fmt(prop.pricing.total)}</span>
                <span style={badge(prop.status==="signed"?_.green:prop.status==="declined"?_.red:prop.status==="sent"?_.blue:_.amber)}>{prop.status}</span>
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
              <span style={badge(propD.status==="signed"?_.green:propD.status==="declined"?_.red:propD.status==="sent"?_.blue:_.amber)}>{propD.status}</span>
              <div style={{flex:1}} />
              <button onClick={()=>printEl(propRef)} style={btnGhost}><Printer size={14} /> Print</button>
            </div>
            <div style={{display:"flex",gap:_.s2,marginBottom:_.s5}}>
              {["draft","sent","signed","declined"].map(s=>(
                <div key={s} onClick={()=>{up(pr=>{pr.proposals[propView].status=s;return pr});log(`Proposal → ${s}`);notify(`Marked ${s}`)}} style={{padding:"6px 14px",borderRadius:_.rFull,fontSize:12,fontWeight:600,cursor:"pointer",background:propD.status===s?`${(s==="signed"?_.green:s==="declined"?_.red:s==="sent"?_.blue:_.amber)}14`:_.well,color:propD.status===s?(s==="signed"?_.green:s==="declined"?_.red:s==="sent"?_.blue:_.amber):_.muted,transition:"all 0.15s"}}>{s}</div>
              ))}
            </div>
            <div ref={propRef} style={{background:"#fff",fontFamily:"'Inter',sans-serif",borderRadius:_.r,overflow:"hidden",border:`1px solid ${_.line}`}}>
              {/* Header */}
              <div style={{padding:"28px 40px",borderBottom:`1px solid ${_.line}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:24,height:24,background:_.ink,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff"}}>i</div>
                  <span style={{fontSize:14,fontWeight:700,color:_.ink}}>iBuild National</span>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:10,color:_.muted,letterSpacing:"0.08em",fontWeight:600}}>PROPOSAL</div>
                  <div style={{fontSize:13,fontWeight:600,color:_.ink}}>{propD.name}</div>
                </div>
              </div>
              {/* Client */}
              <div style={{padding:"36px 40px",borderBottom:`1px solid ${_.line}`}}>
                <div style={{fontSize:10,color:_.muted,marginBottom:8,fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase"}}>Prepared for</div>
                <div style={{fontSize:32,fontWeight:700,letterSpacing:"-0.03em",color:_.ink,lineHeight:1.15}}>{propD.client}</div>
                <div style={{fontSize:14,color:_.body,marginTop:6}}>{propD.address}{propD.suburb?`, ${propD.suburb}`:""}</div>
              </div>
              {/* Meta grid */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",borderBottom:`1px solid ${_.line}`}}>
                {[["Date",propD.date],["Type",propD.type+(propD.stories?` · ${propD.stories}`:"")],["Valid",`${propD.validDays||30} days`],["Value",fmt(propD.pricing.total)]].map(([l2,v2],i)=>(
                  <div key={l2} style={{padding:"14px 20px",borderRight:i<3?`1px solid ${_.line}`:"none"}}>
                    <div style={{fontSize:9,color:_.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>{l2}</div>
                    <div style={{fontSize:13,fontWeight:i===3?700:500,color:_.ink,marginTop:3}}>{v2}</div>
                  </div>
                ))}
              </div>
              {/* Brief */}
              {propD.notes&&<div style={{padding:"20px 40px",borderBottom:`1px solid ${_.line}`}}>
                <div style={{fontSize:10,color:_.muted,fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:6}}>Brief</div>
                <div style={{fontSize:13,lineHeight:1.7,color:_.body}}>{propD.type}{propD.area?` · ${propD.area}m²`:""}. {propD.notes}</div>
              </div>}
              {/* Scope */}
              <div style={{padding:"24px 40px"}}>
                <div style={{fontSize:10,color:_.muted,fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:16}}>Scope of Works</div>
                {propDCats.map(([cat,items],ci)=>(
                  <div key={cat} style={{marginBottom:16}}>
                    <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`2px solid ${_.ink}`,fontSize:12,fontWeight:600,color:_.ink,marginBottom:4}}>
                      <span>{String(ci+1).padStart(2,"0")}. {cat}</span>
                      <span style={{fontVariantNumeric:"tabular-nums"}}>{fmt(propCT(propD.scope,cat))}</span>
                    </div>
                    {items.filter(i2=>i2.on).map((item,idx)=>(
                      <div key={idx} style={{display:"grid",gridTemplateColumns:"1fr 40px 56px 28px 64px",gap:4,padding:"4px 0",fontSize:10,borderBottom:`1px solid ${_.line}`,color:_.body}}>
                        <span style={{color:_.ink}}>{item.item}</span>
                        <span>{item.unit}</span>
                        <span style={{textAlign:"right"}}>{fmt(item.rate)}</span>
                        <span style={{textAlign:"center"}}>x{item.qty}</span>
                        <span style={{textAlign:"right",fontWeight:600,color:_.ink,fontVariantNumeric:"tabular-nums"}}>{fmt(item.rate*item.qty)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              {/* Pricing summary */}
              <div style={{padding:"0 40px 28px",display:"flex",justifyContent:"flex-end"}}>
                <div style={{width:260}}>
                  {[["Subtotal",propD.pricing.sub],[`Margin (${propD.pricing.margin}%)`,propD.pricing.mar],[`Contingency (${propD.pricing.contingency}%)`,propD.pricing.con],["GST",propD.pricing.gst]].map(([l2,v2])=>(
                    <div key={l2} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:11,color:_.muted}}>
                      <span>{l2}</span><span style={{fontVariantNumeric:"tabular-nums"}}>{fmt(v2)}</span>
                    </div>
                  ))}
                  <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0 4px",fontSize:20,fontWeight:700,borderTop:`2px solid ${_.ink}`,marginTop:6,letterSpacing:"-0.02em"}}>
                    <span>Total (inc GST)</span><span style={{fontVariantNumeric:"tabular-nums"}}>{fmt(propD.pricing.total)}</span>
                  </div>
                </div>
              </div>
              {/* Terms */}
              <div style={{padding:"16px 40px",borderTop:`1px solid ${_.line}`,fontSize:10,color:_.muted,lineHeight:1.7}}>
                <div style={{fontSize:10,color:_.muted,fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:4}}>Terms</div>
                {`Valid ${propD.validDays||30} days · 5% deposit · Progress claims 7 days · Variations via VO · Full insurance · 13-week defects`}
              </div>
              {/* Acceptance */}
              <div style={{padding:"16px 40px",borderTop:`1px solid ${_.line}`}}>
                <div style={{fontSize:10,color:_.muted,fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:8}}>Acceptance</div>
                <div style={{fontSize:10,color:_.muted,marginBottom:10}}>I/We accept and authorise iBuild National to proceed.</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
                  {["Client","Builder"].map(r=>(
                    <div key={r}>
                      <div style={{fontSize:10,fontWeight:600,marginBottom:4}}>{r}</div>
                      {propD.sigData&&r==="Client"
                        ?<div><img src={propD.sigData} alt="" style={{maxHeight:32}} /><div style={{fontSize:9,color:_.muted,marginTop:2}}>Signed</div></div>
                        :<div style={{borderBottom:`1px solid ${_.line2}`,height:32}} />}
                    </div>
                  ))}
                </div>
              </div>
              {/* Footer */}
              <div style={{padding:"10px 40px",background:_.ink,fontSize:9,color:"#888",display:"flex",justifyContent:"space-between"}}>
                <span>iBuild National Pty Ltd · ABN 12 345 678 901</span><span>(03) 8510 5472</span>
              </div>
            </div>
            {!propD.sigData&&<div style={{marginTop:_.s5}}>
              <div style={{fontSize:14,fontWeight:600,marginBottom:_.s2}}>Client signature</div>
              <div style={{background:"#fff",borderRadius:_.rXs,touchAction:"none",overflow:"hidden",border:`1.5px solid ${_.line2}`}}><canvas ref={mkCv(sigRef,sigCtx)} width={600} height={100} style={{width:"100%",height:100,cursor:"crosshair"}} {...cvH(sigRef,sigCtx,sigDr,()=>{up(pr=>{pr.proposals[propView].sigData=sigRef.current.toDataURL();pr.proposals[propView].status="signed";return pr});log("Proposal signed");notify("Signed")})} /></div>
              <div style={{display:"flex",gap:_.s2,marginTop:_.s2}}><button onClick={()=>{clr(sigRef,sigCtx)}} style={btnSecondary}>Clear</button></div>
            </div>}
            {propD.sigData&&<div style={{marginTop:_.s5,padding:`${_.s3}px`,background:`${_.green}0a`,borderRadius:_.rXs,fontSize:13,color:_.green,fontWeight:500,display:"flex",alignItems:"center",gap:4}}><Check size={13} /> Client signed</div>}
        </Section>}

        {/* ════ TEMPLATES ════ */}
        {tab==="templates"&&<Section key={anim}>
          <h1 style={{fontSize:40,fontWeight:700,letterSpacing:"-0.03em",marginBottom:_.s7}}>Templates</h1>
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

      {/* ═══ MOBILE BOTTOM TAB BAR ═══ */}
      {mobile&&<nav style={{position:"fixed",bottom:0,left:0,right:0,zIndex:50,background:_.surface,borderTop:`1px solid ${_.line}`,display:"flex",justifyContent:"space-around",padding:"6px 0 env(safe-area-inset-bottom,6px)"}}>
        {[{id:"dash",l:"Overview",Ic:BarChart3},{id:"quote",l:"Quote",Ic:PenLine},{id:"proposal",l:"Proposals",Ic:FileText},{id:"invoices",l:"Invoices",Ic:Receipt},{id:"diary",l:"Diary",Ic:BookOpen}].map(item=>(
          <div key={item.id} onClick={()=>{go(item.id);setMoreMenu(false)}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"4px 0",minWidth:56,minHeight:44,justifyContent:"center",cursor:"pointer",color:tab===item.id&&!moreMenu?_.ac:_.muted,transition:"color 0.15s"}}>
            <item.Ic size={20} strokeWidth={tab===item.id&&!moreMenu?2:1.5} />
            <span style={{fontSize:10,fontWeight:tab===item.id&&!moreMenu?600:400}}>{item.l}</span>
          </div>
        ))}
        <div onClick={()=>setMoreMenu(!moreMenu)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"4px 0",minWidth:56,minHeight:44,justifyContent:"center",cursor:"pointer",color:moreMenu?_.ac:_.muted,transition:"color 0.15s"}}>
          <Menu size={20} strokeWidth={moreMenu?2:1.5} />
          <span style={{fontSize:10,fontWeight:moreMenu?600:400}}>More</span>
        </div>
      </nav>}

      {/* ═══ MOBILE MORE MENU ═══ */}
      {mobile&&moreMenu&&<div onClick={()=>setMoreMenu(false)} style={{position:"fixed",inset:0,zIndex:48,background:"rgba(0,0,0,0.2)"}} />}
      {mobile&&moreMenu&&<div style={{position:"fixed",bottom:64,left:0,right:0,zIndex:49,background:_.surface,borderTop:`1px solid ${_.line}`,borderRadius:"8px 8px 0 0",boxShadow:_.sh3,padding:"12px 0",animation:"fadeUp 0.2s ease"}}>
        {[{id:"plans",l:"Plans AI",Ic:Ruler},{id:"costs",l:"Costs",Ic:DollarSign},{id:"schedule",l:"Schedule",Ic:ClipboardList},{id:"variations",l:"Variations",Ic:ArrowUpRight},{id:"defects",l:"Defects",Ic:AlertTriangle},{id:"trades",l:"Trades",Ic:Wrench},{id:"templates",l:"Templates",Ic:FolderOpen}].map(item=>(
          <div key={item.id} onClick={()=>{go(item.id);setMoreMenu(false)}} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 20px",fontSize:14,cursor:"pointer",color:tab===item.id?_.ac:_.body,fontWeight:tab===item.id?600:400,minHeight:44,transition:"background 0.1s"}} onMouseEnter={e=>e.currentTarget.style.background=_.well} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <item.Ic size={18} strokeWidth={tab===item.id?2:1.5} />
            {item.l}
          </div>
        ))}
      </div>}

      <style>{`
        *{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;box-sizing:border-box}
        ::selection{background:${_.ac}20;color:${_.ac}}
        select option{background:#fff;color:${_.ink}}
        input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none}
        input[type=number]{-moz-appearance:textfield}
        textarea{font-family:inherit}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${_.line};border-radius:99px}
        ::-webkit-scrollbar-thumb:hover{background:${_.line2}}
        input:focus,textarea:focus,select:focus{border-color:${_.ac}!important;background:#fff!important;box-shadow:0 0 0 2px ${_.ac}18!important;outline:none!important}
        button:active{transform:scale(0.98)!important}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @media print{aside,nav{display:none!important}main{padding:0!important}}
      `}</style>
    </div>
  );
}
