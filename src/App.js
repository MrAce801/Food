import React, { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// --- Styles ausgelagert ---
const styles = {
  container: isMobile => ({
    maxWidth: 600,
    margin: "0 auto",
    padding: isMobile ? "0 12px" : "0 24px",
    overflowAnchor: "none"
  }),
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0"
  },
  title: {
    textAlign: "center",
    margin: "8px 0 24px",
    fontSize: 28,
    fontWeight: 700
  },
  input: {
    flex: 1,
    padding: "10px 12px",
    fontSize: 16,
    borderRadius: 6,
    border: "1px solid #ccc"
  },
  smallInput: {
    flex: 1,
    padding: "8px 12px",
    fontSize: 16,
    WebkitTextSizeAdjust: "100%",
    borderRadius: 6,
    border: "1px solid #ccc"
  },
  buttonPrimary: {
    padding: "12px 0",
    fontSize: 16,
    borderRadius: 6,
    border: 0,
    background: "#388e3c",
    color: "#fff",
    cursor: "pointer",
    width: "100%"
  },
  buttonSecondary: bg => ({
    padding: "8px 16px",
    fontSize: 14,
    borderRadius: 6,
    border: 0,
    background: bg,
    color: "#fff",
    cursor: "pointer"
  }),
  entryCard: dark => ({
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    background: dark ? "#2a2a32" : "#fff",
    boxShadow: "0 1px 4px #0002"
  }),
  groupHeader: {
    fontSize: 18,
    fontWeight: 600,
    margin: "24px 0 8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  toast: {
    position: "fixed",
    top: 16,
    right: 16,
    background: "#333",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: 4,
    opacity: 0.9
  }
};

// --- Farben für Symptome ---
const SYMPTOM_COLOR_MAP = {
  Bauchschmerzen: "#D0E1F9",
  Durchfall: "#D6EAE0",
  Blähungen: "#E4D9F0",
  Hautausschlag: "#F0D9D9",
  Juckreiz: "#F5F3D1",
  "Schwellung am Gaumen": "#F6E0B5",
  "Schleim im Hals": "#D9F2F9",
  Niesen: "#FBF7D6",
  Kopfschmerzen: "#D9EAF9",
  "Rötung Haut": "#F2D9DB"
};

// --- UI-Komponenten ---
const PdfButton = ({ onClick }) => (
  <button onClick={onClick} style={styles.buttonSecondary("#d32f2f")}>PDF</button>
);
const InsightsButton = ({ onClick }) => (
  <button onClick={onClick} style={styles.buttonSecondary("#1976d2")}>Insights</button>
);
const CameraButton = ({ onClick }) => (
  <button onClick={onClick} style={{
    width: 36, height: 36, borderRadius: 8, border: 0, background: "#247be5",
    display: "flex",alignItems:"center",justifyContent:"center",cursor:"pointer"
  }}>📷</button>
);
const ImgStack = ({ imgs, onDelete }) => (
  <div style={{ display:"flex", alignItems:"center", marginBottom:8 }}>
    {imgs.map((src,i)=>(
      <div key={i} style={{ position:"relative", marginLeft: i? -12:0, zIndex: imgs.length - i }}>
        <img src={src} alt="" style={{
          width:40,height:40,objectFit:"cover",
          borderRadius:6,border:"2px solid #fff",
          boxShadow:"0 1px 4px #0003"
        }}/>
        {onDelete && (
          <span onClick={()=>onDelete(i)} style={{
            position:"absolute", top:-6, right:-6,
            background:"#c00",color:"#fff",
            borderRadius:"50%",width:18,height:18,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:12, cursor:"pointer"
          }}>×</span>
        )}
      </div>
    ))}
  </div>
);
const SymTag = ({ txt, time, dark, onDel }) => {
  const bg = SYMPTOM_COLOR_MAP[txt] || "#fafafa";
  return (
    <div style={{
      display:"inline-flex",alignItems:"center",
      background:bg,color:"#1a1f3d",
      borderRadius:6,padding:"5px 10px",margin:"3px 4px 3px 0",
      fontSize:14,overflowWrap:"break-word",whiteSpace:"normal"
    }}>
      {txt}
      <span style={{ marginLeft:6, fontSize:12, opacity:0.8 }}>{time===0? "sofort": `${time} min`}</span>
      {onDel && (
        <span onClick={e=>{e.stopPropagation();onDel();}} style={{
          marginLeft:6,cursor:"pointer",fontSize:16,color:"#c00",fontWeight:700
        }}>×</span>
      )}
    </div>
  );
};

// --- Konstanten ---
const SYMPTOM_CHOICES = [
  "Bauchschmerzen","Durchfall","Blähungen","Hautausschlag",
  "Juckreiz","Schwellung am Gaumen","Schleim im Hals",
  "Niesen","Kopfschmerzen","Rötung Haut"
];
const TIME_CHOICES = [
  { label:"sofort",value:0 },
  { label:"nach 5 min",value:5 },
  { label:"nach 10 min",value:10 },
  { label:"nach 15 min",value:15 },
  { label:"nach 30 min",value:30 },
  { label:"nach 45 min",value:45 },
  { label:"nach 60 min",value:60 },
  { label:"nach 1,5 h",value:90 },
  { label:"nach 3 h",value:180 }
];
const now = ()=>{
  const d=new Date();
  return d.toLocaleDateString()+" "+d.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
};

// --- Insights-Komponente (unverändert) ---
function Insights({ entries }) { /* ... */ }

// --- Haupt-App ---
export default function App(){
  const [dark,setDark]=useState(false);
  useEffect(()=>{
    const saved=localStorage.getItem("fd-theme");
    setDark(saved? saved==="dark": window.matchMedia("(prefers-color-scheme: dark)").matches);
  },[]);

  const [view,setView]=useState("diary");
  const [entries,setEntries]=useState(()=>{
    try{return JSON.parse(localStorage.getItem("fd-entries")||"[]");}
    catch{return [];}
  });
  const [newForm,setNewForm]=useState({food:"",imgs:[],symptomInput:"",symptomTime:0});
  const [newSymptoms,setNewSymptoms]=useState([]);
  const fileRefNew=useRef();
  const [editingIdx,setEditingIdx]=useState(null);
  const [editForm,setEditForm]=useState(null);
  const [toasts,setToasts]=useState([]);
  const [isMobile,setIsMobile]=useState(window.innerWidth<700);
  const [searchTerm,setSearchTerm]=useState("");
  const [displayCount,setDisplayCount]=useState(20);

  // Accordion: alle Tage von Anfang an zugeklappt
  const [collapsedDays,setCollapsedDays]=useState({});
  const toggleDay=day=>setCollapsedDays(cd=>({...cd,[day]:!cd[day]}));

  // Persist + Theme
  useEffect(()=>{ localStorage.setItem("fd-entries",JSON.stringify(entries)); },[entries]);
  useEffect(()=>{
    document.body.style.background=dark?"#22222a":"#f4f7fc";
    document.body.style.color=dark?"#f0f0f8":"#111";
    localStorage.setItem("fd-theme",dark?"dark":"light");
  },[dark]);
  useEffect(()=>{
    const r=()=>setIsMobile(window.innerWidth<700);
    window.addEventListener("resize",r);
    return()=>window.removeEventListener("resize",r);
  },[]);

  // Toast helper
  const addToast=msg=>{
    const id=Date.now();
    setToasts(t=>[...t,{id,msg}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),2000);
  };

  // PDF-Export (alle Tage entfaltet)
  const handleExportPDF=async()=>{
    const prev={...collapsedDays};
    const days=Object.keys(grouped);
    days.forEach(day=>collapsedDays[day]=false);
    await new Promise(r=>setTimeout(r,100));

    const el=document.getElementById("fd-table");
    if(!el)return;
    const imgs=Array.from(el.querySelectorAll("img"));
    const orig=imgs.map(i=>({w:i.style.width,h:i.style.height}));
    imgs.forEach(i=>{i.style.width="80px";i.style.height="80px";});

    const canvas=await html2canvas(el,{scale:2});
    const data=canvas.toDataURL();
    const pdf=new jsPDF({unit:"px",format:[canvas.width,canvas.height]});
    pdf.addImage(data,"PNG",0,0,canvas.width,canvas.height);
    pdf.save("FoodDiary.pdf");

    imgs.forEach((i,j)=>{i.style.width=orig[j].w;i.style.height=orig[j].h;});
    setCollapsedDays(prev);
  };

  // File → Base64 + Feedback
  const handleNewFile=e=>{
    Array.from(e.target.files||[]).forEach(f=>{
      const r=new FileReader();
      r.onload=()=>setNewForm(fm=>({...fm,imgs:[...fm.imgs,r.result]}));
      r.readAsDataURL(f);
    });
    e.target.value="";
    navigator.vibrate?.(50);
    addToast("Foto hinzugefügt");
  };
  const removeNewImg=idx=>{
    setNewForm(fm=>({...fm,imgs:fm.imgs.filter((_,i)=>i!==idx)}));
    navigator.vibrate?.(50);
    addToast("Foto gelöscht");
  };

  // Symptome
  const addNewSymptom=()=>{
    if(!newForm.symptomInput.trim())return;
    setNewSymptoms(s=>[...s,{txt:newForm.symptomInput.trim(),time:newForm.symptomTime}]);
    setNewForm(fm=>({...fm,symptomInput:"",symptomTime:0}));
  };
  const removeNewSymptom=idx=>setNewSymptoms(s=>s.filter((_,i)=>i!==idx));

  // Eintrag
  const addEntry=()=>{
    if(!newForm.food.trim())return;
    setEntries(e=>[{...newForm,symptoms:newSymptoms,date:now()},...e]);
    setNewForm({food:"",imgs:[],symptomInput:"",symptomTime:0});
    setNewSymptoms([]);
    navigator.vibrate?.(50);
    addToast("Eintrag gespeichert");
  };

  // Bearbeiten & Notizen etc... (unverändert)

  // Filter, Gruppierung
  const filtered=entries.map((e,i)=>({e,i}))
    .filter(({e})=>
      e.food.toLowerCase().includes(searchTerm.toLowerCase())||
      e.symptoms.some(s=>s.txt.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  const toDisplay=filtered.slice(0,displayCount);
  const grouped=toDisplay.reduce((acc,{e,i})=>{
    const day=e.date.split(" ")[0];
    (acc[day]=acc[day]||[]).push({entry:e,idx:i});
    return acc;
  },{});
  const dates=Object.keys(grouped);

  return (
    <div style={styles.container(isMobile)}>
      {/* Toasts */}
      {toasts.map(t=>(
        <div key={t.id} style={styles.toast}>{t.msg}</div>
      ))}

      {/* Top Bar */}
      <div style={styles.topBar}>
        <button
          onClick={()=>setDark(d=>!d)}
          style={{...styles.buttonSecondary("transparent"),fontSize:24}}
        >
          {dark?"🌙":"☀️"}
        </button>
        <div>
          <PdfButton onClick={handleExportPDF}/> {" "}
          <InsightsButton onClick={()=>setView("insights")}/>
        </div>
      </div>

      {/* Titel */}
      <h2 style={styles.title}>Food Diary</h2>

      {/* Neuer Eintrag */}
      <div style={{marginBottom:24}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:48}}>
          <input
            placeholder="Essen..."
            value={newForm.food}
            onChange={e=>setNewForm(fm=>({...fm,food:e.target.value}))}
            style={styles.input}
          />
          <CameraButton onClick={()=>fileRefNew.current?.click()}/>
          <input
            ref={fileRefNew}
            type="file"
            accept="image/*"
            multiple
            capture={isMobile?"environment":undefined}
            onChange={handleNewFile}
            style={{display:"none"}}
          />
        </div>
        {newForm.imgs.length>0 && <ImgStack imgs={newForm.imgs} onDelete={removeNewImg}/>}

        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <input
            list="symptom-list"
            placeholder="Symptom..."
            value={newForm.symptomInput}
            onChange={e=>setNewForm(fm=>({...fm,symptomInput:e.target.value}))}
            style={styles.smallInput}
          />
          <datalist id="symptom-list">
            {SYMPTOM_CHOICES.map(s=><option key={s} value={s}/>)}
          </datalist>
          <select
            value={newForm.symptomTime}
            onChange={e=>setNewForm(fm=>({...fm,symptomTime:+e.target.value}))}
            style={styles.smallInput}
          >
            {TIME_CHOICES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <button
            onClick={addNewSymptom}
            style={{...styles.buttonSecondary("#247be5"),flexShrink:0}}
          >+</button>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",marginBottom:8}}>
          {newSymptoms.map((s,i)=>
            <SymTag key={i} txt={s.txt} time={s.time} onDel={()=>removeNewSymptom(i)}/>
          )}
        </div>
        <button
          onClick={addEntry}
          disabled={!newForm.food.trim()}
          style={{...styles.buttonPrimary,opacity:newForm.food.trim()?1:0.5}}
        >
          Eintrag hinzufügen
        </button>

        {/* Suche + Mehr laden */}
        <div style={{display:"flex",gap:8,marginTop:16}}>
          <input
            placeholder="Suche..."
            value={searchTerm}
            onChange={e=>setSearchTerm(e.target.value)}
            style={styles.smallInput}
          />
          <button
            onClick={()=>setDisplayCount(dc=>dc+20)}
            style={styles.buttonSecondary("#1976d2")}
          >
            Mehr laden
          </button>
        </div>
      </div>

      {/* Einträge gruppiert mit korrigiertem Collapse */}
      <div id="fd-table">
        {dates.map(day=>{
          const group=grouped[day];
          const collapsed=collapsedDays[day] ?? true;
          const preview=group.slice(0,3);
          const offset=8;
          const height=150 + (preview.length-1)*offset;

          return (
            <div key={day}>
              <div style={styles.groupHeader} onClick={()=>toggleDay(day)}>
                <span>{collapsed?"▶":"▼"} {day}</span>
                {collapsed && group.length>3 && (
                  <span style={{opacity:0.7}}>
                    +{group.length - preview.length} weitere
                  </span>
                )}
              </div>

              {collapsed ? (
                <div style={{
                  position:"relative",
                  height,
                  marginBottom:16,
                  overflow:"hidden",
                  border:"1px solid #ccc",
                  borderRadius:8,
                  boxShadow:"0 4px 8px rgba(0,0,0,0.1)"
                }}>
                  {preview.map(({entry,idx},i=>{
                    const isTop=i===0;
                    const styleWrapper={
                      position:"absolute",
                      top:i*offset,
                      left:i*offset,
                      width:"100%",
                      zIndex:preview.length - i,
                      filter:isTop?"blur(4px)":"none",
                      opacity:isTop?0.4:1
                    };
                    return (
                      <div key={idx} style={styleWrapper}>
                        <div style={styles.entryCard(dark)}>
                          <div style={{fontSize:12,opacity:0.7,marginBottom:4}}>
                            {entry.date}
                          </div>
                          <div style={{fontSize:18,fontWeight:600,marginBottom:8}}>
                            {entry.food}
                          </div>
                        </div>
                      </div>
                    );
                  }))}
                </div>
              ) : (
                group.map(({entry,idx})=>(
                  <div key={idx} style={styles.entryCard(dark)}>
                    {/* vollständige Anzeige uncollapsed */}
                    {/* ... */}
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
