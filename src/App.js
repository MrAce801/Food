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
  textarea: {
    width: "100%",
    padding: "8px",
    fontSize: 14,
    borderRadius: 6,
    border: "1px solid #ccc",
    marginTop: 8,
    resize: "vertical",
    overflowWrap: "break-word",
    whiteSpace: "pre-wrap"
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
  },
  backButton: {
    padding: "6px 12px",
    fontSize: 14,
    borderRadius: 6,
    border: 0,
    background: "#1976d2",
    color: "#fff",
    cursor: "pointer"
  },
  noteButton: isActive => ({
    background: isActive ? "#FFF59D" : "#FFFDE7",
    border: "1px solid #F0E68C",
    borderRadius: 6,
    padding: "4px",
    cursor: "pointer",
    fontSize: 16,
    lineHeight: 1
  })
};

// --- Symptom-Farb-Mapping Variante 2 ---
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
  <button onClick={onClick} title="Export PDF" style={styles.buttonSecondary("#d32f2f")}>PDF</button>
);
const InsightsButton = ({ onClick }) => (
  <button onClick={onClick} title="Insights" style={styles.buttonSecondary("#1976d2")}>Insights</button>
);
const BackButton = ({ onClick }) => (
  <button onClick={onClick} title="Zurück" style={styles.backButton}>← Zurück</button>
);
const CameraButton = ({ onClick }) => (
  <button
    onClick={onClick}
    title="Foto"
    style={{
      width: 36,
      height: 36,
      borderRadius: 8,
      border: 0,
      background: "#247be5",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer"
    }}
  >
    📷
  </button>
);
const ImgStack = ({ imgs, onDelete }) => (
  <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
    {imgs.map((src, i) => (
      <div key={i} style={{ position: "relative", marginLeft: i ? -12 : 0, zIndex: imgs.length - i }}>
        <img src={src} alt="" style={{
          width: 40, height: 40, objectFit: "cover",
          borderRadius: 6, border: "2px solid #fff",
          boxShadow: "0 1px 4px #0003"
        }}/>
        {onDelete && (
          <span onClick={() => onDelete(i)} style={{
            position: "absolute", top: -6, right: -6,
            background: "#c00", color: "#fff",
            borderRadius: "50%", width: 18, height: 18,
            display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 12,
            cursor: "pointer"
          }}>×</span>
        )}
      </div>
    ))}
  </div>
);
const SymTag = ({ txt, time, dark, onDel, onClick }) => {
  const bg = SYMPTOM_COLOR_MAP[txt] || "#fafafa";
  return (
    <div onClick={onClick} style={{
      display: "inline-flex", alignItems: "center",
      background: bg, color: "#1a1f3d",
      borderRadius: 6, padding: "5px 10px", margin: "3px 4px 3px 0",
      fontSize: 14, cursor: onClick ? "pointer" : "default",
      overflowWrap: "break-word", whiteSpace: "normal"
    }}>
      {txt}
      <span style={{ marginLeft: 6, fontSize: 12, opacity: 0.8, flexShrink: 0 }}>
        {TIME_CHOICES.find(t => t.value === time)?.label || `${time} min`}
      </span>
      {onDel && (
        <span onClick={e => { e.stopPropagation(); onDel(); }} style={{
          marginLeft: 6, cursor: "pointer",
          fontSize: 16, color: "#c00", fontWeight: 700
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
  { label: "sofort", value: 0 },
  { label: "nach 5 min", value: 5 },
  { label: "nach 10 min", value: 10 },
  { label: "nach 15 min", value: 15 },
  { label: "nach 30 min", value: 30 },
  { label: "nach 45 min", value: 45 },
  { label: "nach 60 min", value: 60 },
  { label: "nach 1,5 h", value: 90 },
  { label: "nach 3 h", value: 180 }
];
const now = () => {
  const d = new Date();
  return d.toLocaleDateString() + " " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// --- Insights-Komponente ---
function Insights({ entries }) {
  const map = {};
  entries.forEach(e => {
    e.symptoms.forEach(s => {
      if (!map[s.txt]) map[s.txt] = { count: 0, foods: {} };
      map[s.txt].count++;
      map[s.txt].foods[e.food] = (map[s.txt].foods[e.food] || 0) + 1;
    });
  });
  const sorted = Object.entries(map).sort((a,b)=>b[1].count-a[1].count);
  return (
    <div>
      <h2 style={{ textAlign:"center", margin:"16px 0" }}>Insights</h2>
      {!sorted.length && <p>Keine Symptome erfasst.</p>}
      {sorted.map(([symptom,data])=>(
        <div key={symptom} style={{marginBottom:24}}>
          <h3>{symptom} ({data.count})</h3>
          <ul>
            {Object.entries(data.foods).sort((a,b)=>b[1]-a[1]).map(([food,cnt])=>(
              <li key={food}>{food}: {cnt}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// --- Haupt-Komponente ---
export default function App(){
  const [dark,setDark]=useState(false);
  useEffect(()=>{
    const saved=localStorage.getItem("fd-theme");
    setDark(saved?saved==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches);
  },[]);

  const [view,setView]=useState("diary");
  const [entries,setEntries]=useState(()=>{
    try{ return JSON.parse(localStorage.getItem("fd-entries")||"[]").map(e=>({...e,comment:e.comment||""})); }
    catch{ return []; }
  });
  const [searchTerm,setSearchTerm]=useState("");
  const [displayCount,setDisplayCount]=useState(20);
  const [newForm,setNewForm]=useState(()=>{
    const saved=localStorage.getItem("fd-form-new");
    return saved?JSON.parse(saved):{food:"",imgs:[],symptomInput:"",symptomTime:0};
  });
  const [newSymptoms,setNewSymptoms]=useState([]);
  const fileRefNew=useRef();
  const [editingIdx,setEditingIdx]=useState(null);
  const [editForm,setEditForm]=useState(null);
  const [noteOpenIdx,setNoteOpenIdx]=useState(null);
  const [noteDraft,setNoteDraft]=useState("");
  const fileRefEdit=useRef();
  const [toasts,setToasts]=useState([]);
  const [isMobile,setIsMobile]=useState(window.innerWidth<700);

  // Accordion
  const [collapsedDays,setCollapsedDays]=useState({});
  const today=new Date().toLocaleDateString();
  const toggleDay=day=>setCollapsedDays(cd=>({...cd,[day]:!(cd[day]!==undefined?cd[day]:day!==today)}));

  // Persist + Theme
  useEffect(()=>{ localStorage.setItem("fd-entries",JSON.stringify(entries)); },[entries]);
  useEffect(()=>{ localStorage.setItem("fd-form-new",JSON.stringify(newForm)); },[newForm]);
  useEffect(()=>{
    document.body.style.background=dark?"#22222a":"#f4f7fc";
    document.body.style.color=dark?"#f0f0f8":"#111";
    localStorage.setItem("fd-theme",dark?"dark":"light");
  },[dark]);
  useEffect(()=>{
    const onResize=()=>setIsMobile(window.innerWidth<700);
    window.addEventListener("resize",onResize);
    return()=>window.removeEventListener("resize",onResize);
  },[]);

  // Scroll focus
  const handleFocus=e=>e.target.scrollIntoView({behavior:"smooth",block:"center"});
  useEffect(()=>{
    if(editingIdx!==null){
      document.getElementById(`entry-${editingIdx}`)?.scrollIntoView({behavior:"smooth",block:"center"});
    }
  },[editingIdx]);

  // Toast
  const addToast=msg=>{
    const id=Date.now();
    setToasts(t=>[...t,{id,msg}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),2000);
  };

  // PDF export
  const handleExportPDF=async()=>{
    const prev={...collapsedDays};
    setCollapsedDays({});
    await new Promise(r=>setTimeout(r,100));
    const el=document.getElementById("fd-table");
    if(!el)return;
    const imgs=Array.from(el.querySelectorAll("img"));
    const orig=imgs.map(i=>({w:i.style.width,h:i.style.height}));
    imgs.forEach(i=>{i.style.width="80px";i.style.height="80px";});
    const canvas=await html2canvas(el,{scale:2});
    const data=canvas.toDataURL("image/png");
    const pdf=new jsPDF({unit:"px",format:[canvas.width,canvas.height]});
    pdf.addImage(data,"PNG",0,0,canvas.width,canvas.height);
    pdf.save("FoodDiary.pdf");
    imgs.forEach((i,j)=>{i.style.width=orig[j].w;i.style.height=orig[j].h;});
    setCollapsedDays(prev);
  };

  // File → Base64
  const handleNewFile=e=>{
    Array.from(e.target.files||[]).forEach(f=>{
      const r=new FileReader();
      r.onload=()=>setNewForm(fm=>({...fm,imgs:[...fm.imgs,r.result]}));
      r.readAsDataURL(f);
    });
    e.target.value="";
    navigator.vibrate?.(50); addToast("Foto hinzugefügt");
  };
  const removeNewImg=idx=>{
    setNewForm(fm=>({...fm,imgs:fm.imgs.filter((_,i)=>i!==idx)}));
    navigator.vibrate?.(50); addToast("Foto gelöscht");
  };
  const handleEditFile=e=>{
    Array.from(e.target.files||[]).forEach(f=>{
      const r=new FileReader();
      r.onload=()=>setEditForm(fm=>({...fm,imgs:[...fm.imgs,r.result]}));
      r.readAsDataURL(f);
    });
    e.target.value="";
    navigator.vibrate?.(50); addToast("Foto hinzugefügt");
  };
  const removeEditImg=idx=>{
    setEditForm(fm=>({...fm,imgs:fm.imgs.filter((_,i)=>i!==idx)}));
    navigator.vibrate?.(50); addToast("Foto gelöscht");
  };

  // Symptome neu
  const addNewSymptom=()=>{
    if(!newForm.symptomInput.trim())return;
    setNewSymptoms(s=>[...s,{txt:newForm.symptomInput.trim(),time:newForm.symptomTime}]);
    setNewForm(fm=>({...fm,symptomInput:"",symptomTime:0}));
  };
  const removeNewSymptom=idx=>setNewSymptoms(s=>s.filter((_,i)=>i!==idx));

  // Eintrag hinzufügen
  const addEntry=()=>{
    if(!newForm.food.trim())return;
    const entry={food:newForm.food,imgs:newForm.imgs,symptoms:newSymptoms,comment:"",date:now()};
    setEntries(e=>[entry,...e]);
    setNewForm({food:"",imgs:[],symptomInput:"",symptomTime:0});
    setNewSymptoms([]);
    navigator.vibrate?.(50); addToast("Eintrag gespeichert");
  };

  // Edit
  const startEdit=i=>{
    setEditingIdx(i);
    const e=entries[i];
    setEditForm({food:e.food,imgs:[...e.imgs],symptoms:[...e.symptoms],symptomInput:"",symptomTime:0});
  };
  const cancelEdit=()=>{setEditingIdx(null);setEditForm(null);};
  const addEditSymptom=()=>{
    if(!editForm.symptomInput.trim())return;
    setEditForm(fm=>({
      ...fm,
      symptoms:[...fm.symptoms,{txt:fm.symptomInput.trim(),time:fm.symptomTime}],
      symptomInput:"",symptomTime:0
    }));
  };
  const removeEditSymptom=idx=>setEditForm(fm=>({...fm,symptoms:fm.symptoms.filter((_,i)=>i!==idx)}));
  const changeEditSymptomTime=idx=>{
    const curr=editForm.symptoms[idx];
    const val=prompt(`Neue Zeit für "${curr.txt}" (Minuten):`,String(curr.time));
    const t=Number(val);
    if(!isNaN(t)){
      setEditForm(fm=>{
        const arr=[...fm.symptoms];
        arr[idx]={...arr[idx],time:t};
        return{...fm,symptoms:arr};
      });
    }
  };
  const saveEdit=()=>{
    setEntries(e=>e.map((ent,i)=>i===editingIdx?{...editForm,comment:ent.comment,date:ent.date}:ent));
    cancelEdit();
    navigator.vibrate?.(50); addToast("Eintrag aktualisiert");
  };
  const deleteEntry=i=>{
    setEntries(e=>e.filter((_,j)=>j!==i));
    if(editingIdx===i) cancelEdit();
    navigator.vibrate?.(50); addToast("Eintrag gelöscht");
  };

  // Notizen
  const toggleNote=idx=>{
    setNoteOpenIdx(noteOpenIdx===idx?null:idx);
    if(noteOpenIdx!==idx) setNoteDraft(entries[idx].comment);
  };
  const saveNote=idx=>{
    setEntries(e=>e.map((ent,j)=>j===idx?{...ent,comment:noteDraft}:ent));
    setNoteOpenIdx(null);
    navigator.vibrate?.(50); addToast("Notiz gespeichert");
  };

  // Filter + Gruppierung + Pag.
  const filteredWithIdx=entries.map((e,idx)=>({entry:e,idx}))
    .filter(({entry})=>
      entry.food.toLowerCase().includes(searchTerm.toLowerCase())||
      entry.symptoms.some(s=>s.txt.toLowerCase().includes(searchTerm.toLowerCase()))||
      entry.comment.toLowerCase().includes(searchTerm.toLowerCase())
    );
  const toDisplay=filteredWithIdx.slice(0,displayCount);
  const grouped=toDisplay.reduce((acc,{entry,idx})=>{
    const day=entry.date.split(" ")[0];
    (acc[day]=acc[day]||[]).push({entry,idx});
    return acc;
  },{});
  const dates=Object.keys(grouped);

  if(view==="insights"){
    return(
      <div style={styles.container(isMobile)}>
        {toasts.map(t=><div key={t.id} style={styles.toast}>{t.msg}</div>)}
        <div style={styles.topBar}><BackButton onClick={()=>setView("diary")}/></div>
        <Insights entries={entries}/>
      </div>
    );
  }

  return(
    <div style={styles.container(isMobile)}>
      {toasts.map(t=><div key={t.id} style={styles.toast}>{t.msg}</div>)}

      <div style={styles.topBar}>
        <button onClick={()=>setDark(d=>!d)}
          style={{...styles.buttonSecondary("transparent"),fontSize:24}} title="Theme wechseln">
          {dark?"🌙":"☀️"}
        </button>
        <div>
          <PdfButton onClick={handleExportPDF}/> {" "}
          <InsightsButton onClick={()=>setView("insights")}/>
        </div>
      </div>

      <h2 style={styles.title}>Food Diary</h2>

      {/* Neuer Eintrag */}
      <div style={{marginBottom:24}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:48}}>
          <input placeholder="Essen..."
            value={newForm.food}
            onChange={e=>setNewForm(fm=>({...fm,food:e.target.value}))}
            onFocus={handleFocus}
            style={styles.input}/>
          <CameraButton onClick={()=>fileRefNew.current?.click()}/>
          <input ref={fileRefNew} type="file" accept="image/*" multiple
            capture={isMobile?"environment":undefined}
            onChange={handleNewFile} style={{display:"none"}}/>
        </div>
        {newForm.imgs.length>0 && <ImgStack imgs={newForm.imgs} onDelete={removeNewImg}/>}

        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <input list="symptom-list" placeholder="Symptom..."
            value={newForm.symptomInput}
            onChange={e=>setNewForm(fm=>({...fm,symptomInput:e.target.value}))}
            onFocus={handleFocus}
            style={styles.smallInput}/>
          <datalist id="symptom-list">{SYMPTOM_CHOICES.map(s=><option key={s} value={s}/>)} </datalist>
          <select value={newForm.symptomTime}
            onChange={e=>setNewForm(fm=>({...fm,symptomTime:Number(e.target.value)}))}
            onFocus={handleFocus}
            style={styles.smallInput}>
            {TIME_CHOICES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <button onClick={addNewSymptom}
            style={{...styles.buttonSecondary("#247be5"),flexShrink:0}}>+</button>
        </div>

        <div style={{display:"flex",flexWrap:"wrap",marginBottom:8}}>
          {newSymptoms.map((s,i)=>
            <SymTag key={i} txt={s.txt} time={s.time} dark={dark}
              onDel={()=>removeNewSymptom(i)}/>
          )}
        </div>

        <button onClick={addEntry}
          disabled={!newForm.food.trim()}
          style={{...styles.buttonPrimary,opacity:newForm.food.trim()?1:0.5}}>
          Eintrag hinzufügen
        </button>

        <div style={{display:"flex",gap:8,marginTop:16}}>
          <input placeholder="Suche..."
            value={searchTerm}
            onChange={e=>setSearchTerm(e.target.value)}
            style={styles.smallInput}/>
          <button onClick={()=>setDisplayCount(dc=>dc+20)}
            style={styles.buttonSecondary("#1976d2")}>Mehr laden</button>
        </div>
      </div>

      {/* Gruppierte Einträge mit gestapelter Vorschau */}
      <div id="fd-table">
        {dates.map(day=>{
          const group=grouped[day];
          const isCollapsed=collapsedDays[day]??(day!==today);
          const preview=group.slice(0,3);
          const stackOffset=8;
          const stackHeight=150+(preview.length-1)*stackOffset;

          return(
            <div key={day}>
              <div style={styles.groupHeader} onClick={()=>toggleDay(day)}>
                <span>{isCollapsed?"▶":"▼"} {day}</span>
                {isCollapsed&&group.length>3&&
                  <span style={{opacity:0.7}}>
                    +{group.length-preview.length} weitere
                  </span>
                }
              </div>
              {isCollapsed?(
                <div style={{
                  position:"relative",
                  height:stackHeight,
                  marginBottom:16,
                  overflow:"hidden"
                }}>
                  {preview.map(({entry,idx},i)=>{
                    const known=entry.symptoms.filter(s=>SYMPTOM_CHOICES.includes(s.txt));
                    const custom=entry.symptoms.filter(s=>!SYMPTOM_CHOICES.includes(s.txt));
                    const sortedAll=[...known.sort((a,b)=>a.txt.localeCompare(b.txt)),...custom];
                    const top=i===0;
                    const styleWrapper={
                      position:"absolute",
                      top:i*stackOffset,
                      left:i*stackOffset,
                      width:"100%",
                      zIndex:preview.length-i
                    };
                    return(
                      <div key={idx} style={styleWrapper}>
                        <div style={styles.entryCard(dark)}>
                          <div style={{fontSize:12,opacity:0.7,marginBottom:4}}>
                            {entry.date}
                          </div>
                          <div style={{fontSize:18,fontWeight:600,marginBottom:8}}>
                            {entry.food}
                          </div>
                          {entry.imgs.length>0&&<ImgStack imgs={entry.imgs}/>}
                          <div style={{display:"flex",flexWrap:"wrap",margin:"8px 0"}}>
                            {sortedAll.map((s,j)=>(
                              <SymTag key={j} txt={s.txt} time={s.time} dark={dark}/>
                            ))}
                          </div>
                        </div>
                        {top&&(
                          <div style={{
                            position:"absolute",top:0,left:0,
                            width:"100%",height:"100%",
                            backdropFilter:"blur(8px)",
                            backgroundColor:"rgba(0,0,0,0.2)",
                            borderRadius:8
                          }}/>
                        )}
                      </div>
                    );
                  })}
                </div>
              ):(
                <div style={{transition:"max-height 0.3s ease"}}>
                  {group.map(({entry,idx})=>{
                    const known=entry.symptoms.filter(s=>SYMPTOM_CHOICES.includes(s.txt));
                    const custom=entry.symptoms.filter(s=>!SYMPTOM_CHOICES.includes(s.txt));
                    const sortedAll=[...known.sort((a,b)=>a.txt.localeCompare(b.txt)),...custom];
                    return(
                      <div key={idx} id={`entry-${idx}`} style={styles.entryCard(dark)}>
                        {editingIdx===idx?(
                          <>
                            <input value={editForm.food}
                              onChange={e=>setEditForm(fm=>({...fm,food:e.target.value}))}
                              onFocus={handleFocus}
                              style={styles.input}/>
                            <div style={{display:"flex",alignItems:"center",gap:8,margin:"8px 0"}}>
                              <CameraButton onClick={()=>fileRefEdit.current?.click()}/>
                              <input ref={fileRefEdit} type="file" accept="image/*" multiple
                                capture={isMobile?"environment":undefined}
                                onChange={handleEditFile} style={{display:"none"}}/>
                              {editForm.imgs.length>0&&<ImgStack imgs={editForm.imgs} onDelete={removeEditImg}/>}
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                              <input list="symptom-list" placeholder="Symptom..."
                                value={editForm.symptomInput}
                                onChange={e=>setEditForm(fm=>({...fm,symptomInput:e.target.value}))}
                                onFocus={handleFocus}
                                style={styles.smallInput}/>
                              <select value={editForm.symptomTime}
                                onChange={e=>setEditForm(fm=>({...fm,symptomTime:Number(e.target.value)}))}
                                onFocus={handleFocus}
                                style={styles.smallInput}>
                                {TIME_CHOICES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                              </select>
                              <button onClick={addEditSymptom}
                                style={{...styles.buttonSecondary("#247be5"),flexShrink:0}}>+</button>
                            </div>
                            <div style={{display:"flex",flexWrap:"wrap",marginBottom:8}}>
                              {editForm.symptoms.map((s,j)=>(
                                <SymTag key={j} txt={s.txt} time={s.time} dark={dark}
                                  onDel={()=>removeEditSymptom(j)}
                                  onClick={()=>changeEditSymptomTime(j)}/>
                              ))}
                            </div>
                            <div style={{display:"flex",gap:8}}>
                              <button onClick={saveEdit} style={styles.buttonSecondary("#1976d2")}>Speichern</button>
                              <button onClick={cancelEdit} style={styles.buttonSecondary("#888")}>Abbrechen</button>
                            </div>
                          </>
                        ):(
                          <>
                            <div style={{fontSize:12,opacity:0.7,marginBottom:4}}>
                              {entry.date}
                            </div>
                            <div style={{fontSize:18,fontWeight:600,marginBottom:8}}>
                              {entry.food}
                            </div>
                            {entry.imgs.length>0&&<ImgStack imgs={entry.imgs}/>}
                            <div style={{display:"flex",flexWrap:"wrap",margin:"8px 0"}}>
                              {sortedAll.map((s,j)=><SymTag key={j} txt={s.txt} time={s.time} dark={dark}/>)}
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                              <button onClick={()=>startEdit(idx)} style={styles.buttonSecondary("#1976d2")}>Bearbeiten</button>
                              <button onClick={()=>deleteEntry(idx)} style={styles.buttonSecondary("#d32f2f")}>Löschen</button>
                              <span style={{marginLeft:"auto"}}>
                                <button onClick={()=>toggleNote(idx)} style={styles.noteButton(!!entry.comment)}>🗒️</button>
                              </span>
                            </div>
                            {noteOpenIdx===idx&&(
                              <div>
                                <textarea value={noteDraft}
                                  onChange={e=>setNoteDraft(e.target.value)}
                                  placeholder="Notiz..."
                                  style={styles.textarea}/>
                                <button onClick={()=>saveNote(idx)}
                                  style={{...styles.buttonSecondary("#FBC02D"),marginTop:8}}>
                                  Speichern
                                </button>
                              </div>
                            )}
                            {entry.comment&&noteOpenIdx!==idx&&(
                              <div style={{
                                marginTop:8, background:"#FFF9C4",
                                padding:"6px 8px", borderRadius:4,
                                color:dark?"#111":"#000",
                                overflowWrap:"break-word",
                                whiteSpace:"pre-wrap"
                              }}>
                                {entry.comment}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
