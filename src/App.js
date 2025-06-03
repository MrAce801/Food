// --- IMPORTS ---
import React, { useState, useRef, useEffect, useCallback } from "react"; // useCallback hinzugefügt
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// --- STILDEFINITIONEN ---
// ... (Styles bleiben unverändert von der letzten Version) ...
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
    border: "1px solid #ccc",
    boxSizing: "border-box",
  },
  smallInput: {
    padding: "8px 10px",
    fontSize: 16,
    WebkitTextSizeAdjust: "100%",
    borderRadius: 6,
    border: "1px solid #ccc",
    minWidth: '70px',
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: "8px",
    fontSize: 16,
    WebkitTextSizeAdjust: "100%",
    borderRadius: 6,
    border: "1px solid #ccc",
    marginTop: 8,
    resize: "vertical",
    overflowWrap: "break-word",
    whiteSpace: "pre-wrap",
    boxSizing: "border-box"
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
  entryCard: (dark, isSymptomOnly = false) => ({
    position: 'relative', 
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    background: isSymptomOnly
      ? (dark ? "#3c3c46" : "#f0f0f5")
      : (dark ? "#2a2a32" : "#fff"),
    boxShadow: "0 1px 4px #0002",
    overflow: 'hidden', 
  }),
  groupHeader: {
    fontSize: 18,
    fontWeight: 600,
    margin: "24px 0 8px"
  },
  toast: {
    position: "fixed",
    top: 16,
    right: 16,
    background: "#333",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: 4,
    opacity: 0.9,
    zIndex: 100 
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
  glassyIconButton: (dark) => ({
    background: dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
    border: dark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.1)',
    borderRadius: 6,
    padding: "6px 8px",
    cursor: "pointer",
    fontSize: 16,
    lineHeight: 1,
    color: dark ? '#f0f0f8' : '#333',
  }),
  actionMenu: (dark) => ({
    position: 'absolute',
    right: '12px',
    top: '44px', 
    background: dark ? '#383840' : '#ffffff',
    borderRadius: 8,
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    padding: '8px',
    zIndex: 20, 
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minWidth: '120px',
  }),
  actionMenuItem: (dark, isDestructive = false) => ({
    background: isDestructive ? (dark? '#8B0000' : '#d32f2f') : (dark ? '#4a4a52' : '#efefef'),
    color: '#fff', 
    border: 'none',
    padding: '8px 12px',
    borderRadius: 4,
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    fontSize: '14px',
  }),
  entryTagBanner: (color) => ({
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderWidth: '0 0 30px 30px', 
    borderColor: `transparent transparent ${color} transparent`,
    position: 'absolute',
    bottom: '0px',
    right: '0px',
    zIndex: 1, 
  }),
  formRow: { 
    display: "flex",
    alignItems: "center",
    gap: '8px',
    marginBottom: '10px' 
  },
  formLabel: {
    minWidth: '90px', 
    fontSize: '15px', 
    flexShrink: 0,
  }
};

// --- GLOBALE KONSTANTEN & FARBMAPPINGS ---
const SYMPTOM_COLOR_MAP = { /* ... unverändert ... */ };
const SYMPTOM_CHOICES = [ /* ... unverändert ... */ ];
const TIME_CHOICES = [ /* ... unverändert ... */ ];
const ENTRY_TYPES = [ /* ... unverändert ... */ ];
const ENTRY_TYPE_COLORS = ENTRY_TYPES.reduce((acc, type) => { acc[type.value] = type.color; return acc; }, {});
// (Konstanten hier vollständig einfügen, wie in der vorherigen Antwort)
Object.assign(window, { SYMPTOM_COLOR_MAP, SYMPTOM_CHOICES, TIME_CHOICES, ENTRY_TYPES, ENTRY_TYPE_COLORS });


// --- HILFSFUNKTIONEN ---
// ... (alle Hilfsfunktionen bleiben unverändert, inkl. der Object.defineProperty-Versionen, wenn du diese beibehalten hast, oder der direkten Funktionsdefinitionen)
function resizeToJpeg(file, maxWidth = 800) { /* ... */ }
const getStrengthColor = (strengthVal) => { /* ... */ };
const now = () => { /* ... */ };
const parseDateString = (dateStr) => { /* ... */ };
const toDateTimePickerFormat = (displayDateStr) => { /* ... */ };
const fromDateTimePickerFormat = (pickerDateStr) => { /* ... */ };
// (Diese Hilfsfunktionen hier vollständig einfügen, wie in der vorherigen Antwort)
const _resizeToJpeg = (file, maxWidth = 800) => { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onerror = (e) => { console.error("FileReader Error:", e); reject(reader.error); }; reader.onload = () => { const img = new Image(); img.onerror = (e) => { console.error("Image Load Error:", e, img.src.substring(0,100)); reject(new Error("Bild konnte nicht als Bild interpretiert werden")); }; img.onload = () => { try { const scale = Math.min(1, maxWidth / img.width); const w = img.width * scale; const h = img.height * scale; const c = document.createElement("canvas"); c.width = w; c.height = h; const ctx = c.getContext("2d"); if (!ctx) { console.error("Canvas Context nicht erhalten"); return reject(new Error("Canvas Context Fehler")); } ctx.drawImage(img, 0, 0, w, h); resolve(c.toDataURL("image/jpeg", 0.8)); } catch (canvasError) { console.error("Canvas Error:", canvasError); reject(new Error("Fehler bei der Bildverkleinerung (Canvas)")); } }; img.src = reader.result; }; reader.readAsDataURL(file); }); }; Object.defineProperty(window, 'resizeToJpeg', { value: _resizeToJpeg });
const _getStrengthColor = (strengthVal) => { const s = parseInt(strengthVal); switch (s) { case 1: return 'hsl(120, 65%, 50%)'; case 2: return 'hsl(35, 90%, 55%)'; case 3: return 'hsl(0, 75%, 55%)'; default: if (s && s >= 3) return 'hsl(0, 75%, 55%)'; return 'hsl(120, 65%, 50%)'; } }; Object.defineProperty(window, 'getStrengthColor', { value: _getStrengthColor });
const _now = () => { const d = new Date(); const day = String(d.getDate()).padStart(2, '0'); const month = String(d.getMonth() + 1).padStart(2, '0'); const year = d.getFullYear(); const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); return `${day}.${month}.${year} ${time}`; }; Object.defineProperty(window, 'now', { value: _now });
const _parseDateString = (dateStr) => { if (!dateStr || typeof dateStr !== 'string') return new Date(0); const [datePart, timePart] = dateStr.split(' '); if (!datePart || !timePart) return new Date(0); const dateComponents = datePart.split('.').map(Number); const timeComponents = timePart.split(':').map(Number); if (dateComponents.length !== 3 || timeComponents.length !== 2) return new Date(0); if ([...dateComponents, ...timeComponents].some(isNaN)) return new Date(0); const [day, month, year] = dateComponents; const [hour, minute] = timeComponents; if (year < 1000 || year > 3000 || month < 1 || month > 12 || day < 1 || day > 31) return new Date(0); if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return new Date(0); return new Date(year, month - 1, day, hour, minute); }; Object.defineProperty(window, 'parseDateString', { value: _parseDateString });
const _toDateTimePickerFormat = (displayDateStr) => { if (!displayDateStr || typeof displayDateStr !== 'string') return ""; const [datePart, timePart] = displayDateStr.split(' '); if (!datePart || !timePart) return ""; const dateComponents = displayDateStr.split(' ')[0].split('.'); if (dateComponents.length !== 3) return ""; const [day, month, year] = dateComponents.map(s => String(s).padStart(2,'0')); const timeParts = displayDateStr.split(' ')[1]?.split(':').map(s => String(s).padStart(2,'0')); if (!timeParts || timeParts.length !== 2) return ""; if (isNaN(parseInt(year)) || isNaN(parseInt(month)) || isNaN(parseInt(day)) || isNaN(parseInt(timeParts[0])) || isNaN(parseInt(timeParts[1]))) return ""; if (parseInt(month) < 1 || parseInt(month) > 12 || parseInt(day) < 1 || parseInt(day) > 31 || parseInt(timeParts[0]) < 0 || parseInt(timeParts[0]) > 23 || parseInt(timeParts[1]) < 0 || parseInt(timeParts[1]) > 59) return ""; return `${year}-${month}-${day}T${timeParts[0]}:${timeParts[1]}`; }; Object.defineProperty(window, 'toDateTimePickerFormat', { value: _toDateTimePickerFormat });
const _fromDateTimePickerFormat = (pickerDateStr) => { if (!pickerDateStr || typeof pickerDateStr !== 'string') return ""; const [datePart, timePart] = pickerDateStr.split('T'); if (!datePart || !timePart) return ""; const dateComponents = datePart.split('-'); if (dateComponents.length !== 3) return ""; const [year, month, day] = dateComponents; const timeParts = timePart.split(':'); if (timeParts.length !== 2) return ""; if (isNaN(parseInt(year)) || isNaN(parseInt(month)) || isNaN(parseInt(day)) || isNaN(parseInt(timeParts[0])) || isNaN(parseInt(timeParts[1]))) return ""; if (parseInt(month) < 1 || parseInt(month) > 12 || parseInt(day) < 1 || parseInt(day) > 31 || parseInt(timeParts[0]) < 0 || parseInt(timeParts[0]) > 23 || parseInt(timeParts[1]) < 0 || parseInt(timeParts[1]) > 59) return ""; return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year} ${String(timeParts[0]).padStart(2, '0')}:${String(timeParts[1]).padStart(2, '0')}`; }; Object.defineProperty(window, 'fromDateTimePickerFormat', { value: _fromDateTimePickerFormat });


// --- UI UTILITY KOMPONENTEN ---
// ... (bleiben unverändert) ...
const PdfButton = ({ onClick }) => ( <button onClick={onClick} title="Export PDF" style={styles.buttonSecondary("#d32f2f")}> PDF </button> );
const InsightsButton = ({ onClick }) => ( <button onClick={onClick} title="Insights" style={styles.buttonSecondary("#1976d2")}> Insights </button> );
const BackButton = ({ onClick }) => ( <button onClick={onClick} title="Zurück" style={styles.backButton}>← Zurück</button> );
const CameraButton = ({ onClick }) => ( <button onClick={onClick} title="Foto" style={{ width: 36, height: 36, borderRadius: 6, border: 0, background: "#247be5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>📷</button> );
const ImgStack = ({ imgs, onDelete }) => ( <div className="img-stack-container" style={{ display: "flex", alignItems: "center", marginBottom: 8 }}> {imgs.map((src, i) => ( <div key={i} className="img-stack-item" style={{ position: "relative", marginLeft: i ? -12 : 0, zIndex: imgs.length - i }}> <img src={src} alt={`entry_image_${i}`} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6, border: "2px solid #fff", boxShadow: "0 1px 4px #0003" }} onError={e => { e.currentTarget.style.display = "none"; }} /> {onDelete && ( <span onClick={() => onDelete(i)} style={{ position: "absolute", top: -6, right: -6, background: "#c00", color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, cursor: "pointer" }}>×</span> )} </div> ))} </div> );
const SymTag = ({ txt, time, strength, dark, onDel, onClick }) => { /* ... wie zuvor ... */ };


// --- DATENVERARBEITUNGSKOMPONENTEN (z.B. Insights) ---
// ... (bleibt unverändert) ...
function Insights({ entries }) { /* ... wie zuvor ... */ }

// --- HAUPTANWENDUNGSKOMPONENTE: App ---
export default function App() {
  // --- STATE VARIABLEN ---
  const [dark, setDark] = useState(false);
  const [view, setView] = useState("diary");
  const [entries, setEntries] = useState(() => {
    try {
      const loadedEntries = JSON.parse(localStorage.getItem("fd-entries") || "[]")
        .map(e => ({
            ...e,
            comment: e.comment || "",
            food: e.food || "", 
            symptoms: (e.symptoms || []).map(s => ({ ...s, strength: Math.min(parseInt(s.strength) || 1, 3) })),
            entryType: e.entryType || "food" 
        }));
      return loadedEntries.sort((a, b) => parseDateString(b.date) - parseDateString(a.date));
    } catch { return []; }
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [displayCount, setDisplayCount] = useState(20);
  const [newForm, setNewForm] = useState(() => {
    const saved = localStorage.getItem("fd-form-new");
    const initialForm = { 
        food: "", imgs: [], symptomInput: "", symptomTime: 0, 
        symptomStrength: 1, entryType: "food" 
    };
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            const strength = Math.min(parseInt(parsed.symptomStrength) || 1, 3);
            return { ...initialForm, ...parsed, symptomStrength: strength, entryType: parsed.entryType || "food" };
        } catch { return initialForm; }
    }
    return initialForm;
  });
  const [newSymptoms, setNewSymptoms] = useState([]);
  const fileRefNew = useRef();
  const [editingIdx, setEditingIdx] = useState(null);
  const [editForm, setEditForm] = useState(null); 
  const [noteOpenIdx, setNoteOpenIdx] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const fileRefEdit = useRef();
  const [toasts, setToasts] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);
  const [actionMenuOpenForIdx, setActionMenuOpenForIdx] = useState(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // --- EFFECT HOOKS ---
  useEffect(() => { 
    const saved = localStorage.getItem("fd-theme");
    setDark(saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);

  // NEU: addToast mit useCallback memoisiert
  const addToast = useCallback(msg => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg }]);
    setTimeout(() => {
      setToasts(currentToasts => currentToasts.filter(x => x.id !== id));
    }, 2000);
  }, []); // Leeres Dependency Array, da setToasts stabil ist

  useEffect(() => { 
    try {
      localStorage.setItem("fd-entries", JSON.stringify(entries));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || (e.code && (e.code === 22 || e.code === 1014))) {
        console.error("LocalStorage Quota Exceeded:", e);
        addToast("Speicherlimit erreicht! Neue Einträge können evtl. nicht gespeichert werden.");
      } else {
        console.error("Fehler beim Speichern der Einträge in localStorage:", e);
        addToast("Ein Fehler ist beim Speichern der Daten aufgetreten.");
      }
    }
  }, [entries, addToast]); // addToast als Dependency hinzugefügt, da es im Catch verwendet wird

  useEffect(() => { localStorage.setItem("fd-form-new", JSON.stringify(newForm)); }, [newForm]);
  useEffect(() => { document.body.style.background = dark ? "#22222a" : "#f4f7fc"; document.body.style.color = dark ? "#f0f0f8" : "#111"; localStorage.setItem("fd-theme", dark ? "dark" : "light"); }, [dark]);
  useEffect(() => { const onResize = () => setIsMobile(window.innerWidth < 700); window.addEventListener("resize", onResize); return () => window.removeEventListener("resize", onResize); }, []);
  useEffect(() => { if (editingIdx !== null && !isExportingPdf) { document.getElementById(`entry-card-${editingIdx}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); } }, [editingIdx, isExportingPdf]);

  // --- KERNLOGIK & EVENT HANDLER ---
  const handleFocus = e => e.target.scrollIntoView({ behavior: "smooth", block: "center" });
  
  const handleExportPDF = async () => { /* ... wie zuvor ... */ };
  const handleNewFile = async e => { /* ... wie zuvor (mit 5MB Limit) ... */ };
  const removeNewImg = idx => { /* ... wie zuvor ... */ };
  const handleEditFile = async e => { /* ... wie zuvor (mit 5MB Limit) ... */ };
  const removeEditImg = idx => { /* ... wie zuvor ... */ };
  const addNewSymptom = () => { /* ... wie zuvor ... */ };
  const removeNewSymptom = idx => { /* ... wie zuvor ... */ };

  const addEntry = () => {
    if (!newForm.food.trim() && newSymptoms.length === 0) return; 
    const entry = {
      food: newForm.food.trim(), 
      imgs: newForm.imgs,
      symptoms: newSymptoms,
      comment: "",
      date: now(),
      entryType: newForm.entryType 
    };
    setEntries(prevEntries => [...prevEntries, entry].sort((a, b) => parseDateString(b.date) - parseDateString(a.date)) );
    setNewForm({ food: "", imgs: [], symptomInput: "", symptomTime: 0, symptomStrength: 1, entryType: "food" });
    setNewSymptoms([]);
    addToast("Eintrag gespeichert");
  };

  const startEdit = i => {
    const e = entries[i];
    setEditingIdx(i);
    setEditForm({
        food: e.food, imgs: [...e.imgs],
        symptoms: (e.symptoms || []).map(s => ({ ...s, strength: Math.min(parseInt(s.strength) || 1, 3) })),
        symptomInput: "", symptomTime: 0, newSymptomStrength: 1,
        date: toDateTimePickerFormat(e.date),
        entryType: e.entryType || "food" 
    });
    setActionMenuOpenForIdx(null);
  };
  
  const saveEdit = () => { /* ... wie zuvor (inkl. entryType) ... */ };
  const addEditSymptom = () => { /* ... wie zuvor ... */ };
  const removeEditSymptom = idx => { /* ... wie zuvor ... */ };
  const cancelEdit = () => { /* ... wie zuvor ... */ };
  const deleteEntry = i => { /* ... wie zuvor ... */ };
  const toggleNote = idx => { /* ... wie zuvor ... */ };
  const saveNote = idx => { /* ... wie zuvor ... */ };
  const handleContainerClick = (e) => { /* ... wie zuvor ... */ };
  // (Diese Handler hier vollständig einfügen, wie in der vorherigen Antwort)
  const _saveEdit = () => { if (!editForm) return; const displayDateToSave = fromDateTimePickerFormat(editForm.date); if (!displayDateToSave) { addToast("Ungültiges Datum/Zeit Format. Bitte prüfen."); return; } setEntries(prevEntries => prevEntries.map((ent, j) => j === editingIdx ? { ...ent, food: editForm.food.trim(), imgs: editForm.imgs, symptoms: editForm.symptoms.map(s => ({...s, strength: Math.min(parseInt(s.strength) || 1, 3)})), date: displayDateToSave, entryType: editForm.entryType } : ent ).sort((a, b) => parseDateString(b.date) - parseDateString(a.date)) ); cancelEdit(); addToast("Eintrag aktualisiert"); }; Object.defineProperty(window, 'saveEdit', { value: _saveEdit });
  const _addEditSymptom = () => { if (!editForm || !editForm.symptomInput.trim()) return; setEditForm(fm => ({ ...fm, symptoms: [...fm.symptoms, { txt: fm.symptomInput.trim(), time: fm.symptomTime, strength: fm.newSymptomStrength }], symptomInput: "", symptomTime: 0, newSymptomStrength: 1 })); }; Object.defineProperty(window, 'addEditSymptom', { value: _addEditSymptom });
  const _removeEditSymptom = idx => setEditForm(fm => ({ ...fm, symptoms: fm.symptoms.filter((_, i) => i !== idx) })); Object.defineProperty(window, 'removeEditSymptom', { value: _removeEditSymptom });
  const _cancelEdit = () => { setEditingIdx(null); setEditForm(null); setActionMenuOpenForIdx(null); }; Object.defineProperty(window, 'cancelEdit', { value: _cancelEdit });
  const _deleteEntry = i => { setEntries(e => e.filter((_, j) => j !== i)); if (editingIdx === i) cancelEdit(); setActionMenuOpenForIdx(null); addToast("Eintrag gelöscht"); }; Object.defineProperty(window, 'deleteEntry', { value: _deleteEntry });
  const _toggleNote = idx => { setNoteOpenIdx(prevOpenIdx => { if (prevOpenIdx === idx) { return null; } else { setNoteDraft(entries[idx].comment || ""); return idx; } }); setActionMenuOpenForIdx(null); }; Object.defineProperty(window, 'toggleNote', { value: _toggleNote });
  const _saveNote = idx => { setEntries(e => e.map((ent, j) => j === idx ? { ...ent, comment: noteDraft } : ent)); setNoteOpenIdx(null); addToast("Notiz gespeichert"); }; Object.defineProperty(window, 'saveNote', { value: _saveNote });
  const _handleContainerClick = (e) => { if (actionMenuOpenForIdx !== null) { const t = e.target.closest(`#action-menu-trigger-${actionMenuOpenForIdx}`),n=e.target.closest(`#action-menu-content-${actionMenuOpenForIdx}`);t||n||setActionMenuOpenForIdx(null)} if (noteOpenIdx !== null) { const t=e.target.closest(`#note-textarea-${noteOpenIdx}`),n=e.target.closest(`#note-save-button-${noteOpenIdx}`),o=e.target.closest(`#note-icon-button-${noteOpenIdx}`),a=entries[noteOpenIdx]?.comment&&e.target.closest(`#displayed-note-text-${noteOpenIdx}`);t||n||o||a||setNoteOpenIdx(null)} }; Object.defineProperty(window, 'handleContainerClick', { value: _handleContainerClick });


  // --- DATENVORBEREITUNG FÜR DIE ANZEIGE ---
  const filteredWithIdx = entries.map((e, idx) => ({ entry: e, idx })).filter(({ entry }) => (entry.food && entry.food.toLowerCase().includes(searchTerm.toLowerCase())) || (entry.symptoms || []).some(s => s.txt.toLowerCase().includes(searchTerm.toLowerCase())) || (entry.comment && entry.comment.toLowerCase().includes(searchTerm.toLowerCase())) );
  const entriesToRenderForUiOrPdf = isExportingPdf ? filteredWithIdx : filteredWithIdx.slice(0, displayCount);
  const grouped = entriesToRenderForUiOrPdf.reduce((acc, { entry, idx }) => { const day = entry.date.split(" ")[0]; (acc[day] = acc[day] || []).push({ entry, idx }); return acc; }, {});
  const dates = Object.keys(grouped).sort((a,b) => parseDateString(grouped[b][0].entry.date) - parseDateString(grouped[a][0].entry.date));

  // --- JSX RENDERING LOGIK ---
  // ... (Rest des JSX bleibt wie in der vorherigen Antwort, inklusive der Formulare und der Kartenanzeige mit dem entryTagBanner) ...
  if (view === "insights") {
    return ( <div style={styles.container(isMobile)} onClick={handleContainerClick}> {toasts.map(t => <div key={t.id} style={styles.toast}>{t.msg}</div>)} <div style={styles.topBar}><BackButton onClick={() => setView("diary")} /></div> <Insights entries={entries} /> </div> );
  }

  return (
    <div style={styles.container(isMobile)} onClick={handleContainerClick}>
      {toasts.map(t => <div key={t.id} style={styles.toast}>{t.msg}</div>)}
      <div style={styles.topBar}>
        <button onClick={() => setDark(d => !d)} style={{ ...styles.buttonSecondary("transparent"), fontSize: 24, color: dark ? '#f0f0f8' : '#111' }} title="Theme wechseln"> {dark ? "🌙" : "☀️"} </button>
        <div> <PdfButton onClick={handleExportPDF} />{" "} <InsightsButton onClick={() => setView("insights")} /> </div>
      </div>
      <h2 style={styles.title}>Food Diary</h2>

      <div style={{ marginBottom: 24 }}>
        <div style={styles.formRow}>
            <label htmlFor="entryTypeSelectNew" style={styles.formLabel}>Typ:</label>
            <select id="entryTypeSelectNew" value={newForm.entryType} onChange={e => setNewForm(fm => ({ ...fm, entryType: e.target.value }))} style={{...styles.smallInput, flexGrow: 1}} >
              {ENTRY_TYPES.map(type => ( <option key={type.value} value={type.value} style={{color: type.value === 'neutral' ? (dark? '#ccc':'#555') : type.color}}> {type.label} </option> ))}
            </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <input placeholder="Neuer Eintrag Titel/Text..." value={newForm.food} onChange={e => setNewForm(fm => ({ ...fm, food: e.target.value }))} onFocus={handleFocus} style={styles.input} />
          <CameraButton onClick={() => fileRefNew.current?.click()} />
          <input ref={fileRefNew} type="file" accept="image/*" multiple capture={isMobile ? "environment" : undefined} onChange={handleNewFile} style={{ display: "none" }} />
        </div>
        {newForm.imgs.length > 0 && <ImgStack imgs={newForm.imgs} onDelete={removeNewImg} />}
        <div style={{ marginTop: newForm.imgs.length > 0 ? 8 : 0, marginBottom: 8 }}>
          <input list="symptom-list" placeholder="Symptom..." value={newForm.symptomInput} onChange={e => setNewForm(fm => ({ ...fm, symptomInput: e.target.value }))} onFocus={handleFocus} style={{...styles.smallInput, width: '100%', marginBottom: '8px'}}/>
          <datalist id="symptom-list">{SYMPTOM_CHOICES.map(s => <option key={s} value={s} />)}</datalist>
          <div style={{ display: "flex", alignItems: "center", gap: '6px', flexWrap: 'nowrap' }}>
            <select value={newForm.symptomTime} onChange={e => setNewForm(fm => ({ ...fm, symptomTime: Number(e.target.value) }))} onFocus={handleFocus} style={{...styles.smallInput, width: '110px', flexShrink: 0 }}>
              {TIME_CHOICES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select value={newForm.symptomStrength} onChange={e => setNewForm(fm => ({ ...fm, symptomStrength: Number(e.target.value) }))} onFocus={handleFocus} style={{...styles.smallInput, width: '100px', flexShrink: 0 }}>
              {[1,2,3].map(n => <option key={n} value={n}>Stärke {n}</option>)}
            </select>
            <button onClick={addNewSymptom} style={{ ...styles.buttonSecondary("#247be5"), flexShrink: 0, fontSize: '16px', padding: '9px 12px', boxSizing: 'border-box' }}>+</button>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 8 }}> {newSymptoms.map((s, i) => ( <SymTag key={i} txt={s.txt} time={s.time} strength={s.strength} dark={dark} onDel={() => removeNewSymptom(i)} /> ))} </div>
        <button onClick={addEntry} disabled={!newForm.food.trim() && newSymptoms.length === 0} style={{ ...styles.buttonPrimary, opacity: (newForm.food.trim() || newSymptoms.length > 0) ? 1 : 0.5 }} >Eintrag hinzufügen</button>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <input placeholder="Suche..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{...styles.smallInput, flexGrow: 1}} />
          { !isExportingPdf && <button onClick={() => setDisplayCount(dc => dc + 20)} style={styles.buttonSecondary("#1976d2")}>Mehr laden</button> }
        </div>
      </div>

      <div id="fd-table">
        {dates.map(day => (
          <div key={day}> <div style={styles.groupHeader}>{day}</div>
            {grouped[day].map(({ entry, idx }) => {
              const isSymptomOnlyEntry = !entry.food && (entry.symptoms || []).length > 0;
              const symptomsForDisplay = (entry.symptoms || []).map(s => ({...s, strength: Math.min(parseInt(s.strength) || 1, 3)}));
              const knownDisplay = symptomsForDisplay.filter(s => SYMPTOM_CHOICES.includes(s.txt)).sort((a,b) => a.txt.localeCompare(b.txt));
              const customDisplay = symptomsForDisplay.filter(s => !SYMPTOM_CHOICES.includes(s.txt));
              const sortedAllDisplay = [...knownDisplay, ...customDisplay];
              const entryTypeColor = ENTRY_TYPE_COLORS[entry.entryType || "food"]; 
              const entryTypeLabel = ENTRY_TYPES.find(t=>t.value === (entry.entryType || "food"))?.label || (entry.entryType || "food");

              return (
                <div key={idx} id={`entry-card-${idx}`} style={styles.entryCard(dark, isSymptomOnlyEntry)}>
                  {entry.entryType && entry.entryType !== 'neutral' && entryTypeColor && (
                    <div style={styles.entryTagBanner(entryTypeColor)} title={`Typ: ${entryTypeLabel}`}></div>
                  )}
                  {editingIdx === idx && !isExportingPdf ? (
                    <> 
                      <div style={styles.formRow}>
                        <label htmlFor={`entryTypeSelectEdit-${idx}`} style={styles.formLabel}>Typ:</label>
                        <select id={`entryTypeSelectEdit-${idx}`} value={editForm.entryType} onChange={e => setEditForm(fm => ({ ...fm, entryType: e.target.value }))} style={{...styles.smallInput, flexGrow: 1}} >
                          {ENTRY_TYPES.map(type => ( <option key={type.value} value={type.value} style={{color: type.value === 'neutral' ? (dark? '#ccc':'#555') : type.color}}> {type.label} </option> ))}
                        </select>
                      </div>
                      <input type="datetime-local" value={editForm.date} onChange={e => setEditForm(fm => ({ ...fm, date: e.target.value }))} style={{...styles.input, marginBottom: '12px', width: '100%'}} />
                      <input placeholder="Titel/Text des Eintrags..." value={editForm.food} onChange={e => setEditForm(fm => ({ ...fm, food: e.target.value }))} onFocus={handleFocus} style={{...styles.input, width: '100%', marginBottom: '8px'}} />
                      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0" }}> <CameraButton onClick={() => fileRefEdit.current?.click()} /> <input ref={fileRefEdit} type="file" accept="image/*" multiple capture={isMobile ? "environment" : undefined} onChange={handleEditFile} style={{ display: "none" }} /> {editForm.imgs.length > 0 && <ImgStack imgs={editForm.imgs} onDelete={removeEditImg} />} </div>
                      <div style={{ marginBottom: 12 }}> <input list="symptom-list-edit" placeholder="Symptom hinzufügen..." value={editForm.symptomInput} onChange={e => setEditForm(fm => ({ ...fm, symptomInput: e.target.value }))} onFocus={handleFocus} style={{...styles.smallInput, width: '100%', marginBottom: '8px'}} /> <datalist id="symptom-list-edit">{SYMPTOM_CHOICES.map(s => <option key={s} value={s} />)}</datalist> <div style={{ display: "flex", alignItems: "center", gap: '6px', flexWrap: 'nowrap' }}> <select value={editForm.symptomTime} onChange={e => setEditForm(fm => ({ ...fm, symptomTime: Number(e.target.value) }))} onFocus={handleFocus} style={{...styles.smallInput, width: '110px', flexShrink:0 }}> {TIME_CHOICES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)} </select> <select value={editForm.newSymptomStrength} onChange={e => setEditForm(fm => ({ ...fm, newSymptomStrength: Number(e.target.value) }))} onFocus={handleFocus} style={{...styles.smallInput, width: '100px', flexShrink:0 }}> {[1,2,3].map(n => <option key={n} value={n}>Stärke {n}</option>)} </select> <button onClick={addEditSymptom} style={{ ...styles.buttonSecondary("#247be5"), flexShrink:0, fontSize: '16px', padding: '9px 12px', boxSizing: 'border-box' }}>+</button> </div> </div>
                      <div style={{ marginBottom: 8 }}> {editForm.symptoms.map((s, j) => ( <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'nowrap' }}> <input type="text" list="symptom-list-edit" value={s.txt} onChange={e_text => { const newText = e_text.target.value; setEditForm(fm => ({ ...fm, symptoms: fm.symptoms.map((sym, index) => index === j ? { ...sym, txt: newText.trim() } : sym ) })); }} onFocus={handleFocus} style={{ ...styles.smallInput, flexGrow: 1, marginRight: '6px' }} /> <select value={s.time} onChange={e_select => { const newTime = Number(e_select.target.value); setEditForm(fm => ({ ...fm, symptoms: fm.symptoms.map((sym, index) => index === j ? { ...sym, time: newTime } : sym ) })); }} style={{ ...styles.smallInput, width: '37px', flexShrink: 0, fontSize: '16px', padding: '6px 2px' }} > {TIME_CHOICES.map(t => ( <option key={t.value} value={t.value}> {t.value === 0 ? '0' : t.value} </option> ))} </select> <select value={s.strength || 1} onChange={e_strength => { const newStrength = Number(e_strength.target.value); setEditForm(fm => ({ ...fm, symptoms: fm.symptoms.map((sym, index) => index === j ? { ...sym, strength: Math.min(Math.max(newStrength,1),3) } : sym ) })); }} style={{ ...styles.smallInput, width: '25px', flexShrink: 0, fontSize: '16px', padding: '6px 2px' }} > {[1,2,3].map(n => <option key={n} value={n}>{n}</option>)} </select> <button onClick={() => removeEditSymptom(j)} title="Symptom löschen" style={{...styles.buttonSecondary("#d32f2f"), padding: '6px 10px', fontSize: 14, flexShrink: 0, lineHeight: '1.2' }} >×</button> </div> ))} </div>
                      <div style={{ display: "flex", gap: 5, marginTop: '16px' }}> <button onClick={saveEdit} style={styles.buttonSecondary("#1976d2")}>Speichern</button> <button onClick={cancelEdit} style={styles.buttonSecondary("#888")}>Abbrechen</button> </div>
                    </>
                  ) : ( <> <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, display: 'flex', gap: '6px' }}> <button id={`note-icon-button-${idx}`} onClick={(e) => { e.stopPropagation(); toggleNote(idx); setActionMenuOpenForIdx(null);}} style={{...styles.glassyIconButton(dark), padding: '6px'}} title="Notiz" >🗒️</button> <button id={`action-menu-trigger-${idx}`} onClick={(e) => { e.stopPropagation(); setActionMenuOpenForIdx(actionMenuOpenForIdx === idx ? null : idx); setNoteOpenIdx(null);}} style={{...styles.glassyIconButton(dark), padding: '6px'}} title="Aktionen" >✏️</button> </div> <div style={{ fontSize:12, opacity:0.7, marginBottom:4, marginRight: '65px' }}>{entry.date}</div> <div style={{ fontSize:18, fontWeight:600, marginBottom:8, marginRight: '65px', overflowWrap: 'break-word', whiteSpace: 'normal' }}> {entry.food || (isSymptomOnlyEntry ? "Nur Symptome" : "(Kein Titel/Text)") } </div> {entry.imgs.length>0 && <ImgStack imgs={entry.imgs}/>} <div style={{ display:"flex", flexWrap:"wrap", margin:"8px 0 0" }}> {sortedAllDisplay.map((s,j) => ( <SymTag key={j} txt={s.txt} time={s.time} strength={s.strength} dark={dark}/> ))} </div> {actionMenuOpenForIdx === idx && !isExportingPdf && ( <div id={`action-menu-content-${idx}`} style={styles.actionMenu(dark)} onClick={e => e.stopPropagation()}> <button onClick={() => { startEdit(idx); }} style={styles.actionMenuItem(dark)} > Bearbeiten </button> <button onClick={() => { if (window.confirm("Möchten Sie diesen Eintrag wirklich löschen?")) { deleteEntry(idx); } else { setActionMenuOpenForIdx(null); } }} style={styles.actionMenuItem(dark, true)} > Löschen </button> </div> )} {noteOpenIdx === idx && !isExportingPdf && ( <div onClick={e => e.stopPropagation()} style={{marginTop: '8px'}}> <textarea id={`note-textarea-${idx}`} value={noteDraft} onChange={e => setNoteDraft(e.target.value)} placeholder="Notiz..." style={{...styles.textarea, fontSize: '16px'}} /> <button id={`note-save-button-${idx}`} onClick={() => saveNote(idx)} style={{ ...styles.buttonSecondary(dark ? '#555' : "#FBC02D"), color: dark ? '#fff' : '#333', marginTop: 8 }} >Notiz speichern</button> </div> )} {entry.comment && noteOpenIdx !== idx && !isExportingPdf && ( <div id={`displayed-note-text-${idx}`} onClick={(e) => { e.stopPropagation(); setNoteOpenIdx(idx); setNoteDraft(entry.comment || ""); setActionMenuOpenForIdx(null);}} style={{ marginTop: 8, background: dark ? "#3a3a42" : "#f0f0f5", padding: "6px 8px", borderRadius: 4, color: dark ? "#e0e0e0" : "#333", overflowWrap: "break-word", whiteSpace: "pre-wrap", boxSizing: "border-box", cursor: 'pointer' }} > {entry.comment} </div> )} </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}