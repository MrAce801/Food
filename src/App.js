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
    border: "1px solid #ccc",
    boxSizing: "border-box",
  },
  smallInput: {
    padding: "8px 10px",
    fontSize: 15,
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
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    background: isSymptomOnly
      ? (dark ? "#3c3c46" : "#f0f0f5")
      : (dark ? "#2a2a32" : "#fff"),
    boxShadow: "0 1px 4px #0002"
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
    background: "#F9A825",
    border: "1px solid #F0E68C",
    borderRadius: 6,
    padding: "4px",
    cursor: "pointer",
    fontSize: 16,
    lineHeight: 1
  })
};

// --- Symptom-Farb-Mapping ---
const SYMPTOM_COLOR_MAP = {
  Bauchschmerzen: "#D0E1F9",
  Durchfall: "#D6EAE0",
  Blähungen: "#E4D9F0",
  Hautausschlag: "#F0D9D9",
  Juckreiz: "#E1BEE7",
  "Schwellung am Gaumen": "#FFCCBC",
  "Schleim im Hals": "#D9F2F9",
  Niesen: "#C8E6C9",
  Kopfschmerzen: "#D9EAF9",
  "Rötung Haut": "#F2D9DB"
};

// --- Image-Helper ---
function resizeToJpeg(file, maxWidth = 800) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Bild lädt nicht"));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const w = img.width * scale;
        const h = img.height * scale;
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/jpeg", 0.8));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// --- Hilfsfunktion für Stärkefarbe ---
const getStrengthColor = (strengthVal) => {
    const s = parseInt(strengthVal) || 1;
    const hue = Math.max(0, 120 - ((s - 1) * 30));
    return `hsl(${hue}, 70%, 55%)`;
};

// --- UI-Komponenten ---
const PdfButton = ({ onClick }) => (
  <button onClick={onClick} title="Export PDF" style={styles.buttonSecondary("#d32f2f")}>
    PDF
  </button>
);
const InsightsButton = ({ onClick }) => (
  <button onClick={onClick} title="Insights" style={styles.buttonSecondary("#1976d2")}>
    Insights
  </button>
);
const BackButton = ({ onClick }) => (
  <button onClick={onClick} title="Zurück" style={styles.backButton}>← Zurück</button>
);
const CameraButton = ({ onClick }) => (
  <button onClick={onClick} title="Foto" style={{
    width: 36, height: 36, borderRadius: 6, border: 0,
    background: "#247be5", display: "flex", alignItems: "center",
    justifyContent: "center", cursor: "pointer"
  }}>📷</button>
);
const ImgStack = ({ imgs, onDelete }) => (
  <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
    {imgs.map((src, i) => (
      <div key={i} style={{ position: "relative", marginLeft: i ? -12 : 0, zIndex: imgs.length - i }}>
        <img src={src} alt="" style={{
          width: 40, height: 40, objectFit: "cover",
          borderRadius: 6, border: "2px solid #fff",
          boxShadow: "0 1px 4px #0003"
        }} onError={e => { e.currentTarget.style.display = "none"; }}/>
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

const SymTag = ({ txt, time, strength, dark, onDel, onClick }) => {
  const bg = SYMPTOM_COLOR_MAP[txt] || "#fafafa";
  return (
    <div onClick={onClick} style={{
      display: "inline-flex", alignItems: "center",
      background: bg, color: "#1a1f3d",
      borderRadius: 6, padding: "6px 10px",
      margin: "3px 4px 3px 0", fontSize: 14,
      cursor: onClick ? "pointer" : "default",
      overflowWrap: "break-word", whiteSpace: "normal"
    }}>
      {strength && (
        <span style={{ // MODIFIED: Kreisgröße und Schriftgröße angepasst
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '18px', // War 22px
            height: '18px', // War 22px
            borderRadius: '50%',
            backgroundColor: getStrengthColor(strength),
            color: '#fff', 
            fontSize: '11px', // War 13px
            fontWeight: 'bold',
            marginRight: '6px', // War 8px
            flexShrink: 0,
            border: dark ? '1px solid #555' : '1px solid #ddd'
        }}>
            {strength}
        </span>
      )}
      {txt}
      <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.8, flexShrink: 0 }}>
        {TIME_CHOICES.find(t => t.value === time)?.label || `${time} min`}
      </span>
      {onDel && (
        <span onClick={e => { e.stopPropagation(); onDel(); }} style={{
          marginLeft: 8, cursor: "pointer",
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
  { label: "sofort", value: 0 }, { label: "nach 5 min", value: 5 }, 
  { label: "nach 10 min", value: 10 }, { label: "nach 15 min", value: 15 }, 
  { label: "nach 30 min", value: 30 }, { label: "nach 45 min", value: 45 }, 
  { label: "nach 60 min", value: 60 }, { label: "nach 1,5 h", value: 90 }, 
  { label: "nach 3 h", value: 180 }
];

// --- Datums- und Zeitfunktionen ---
const now = () => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${day}.${month}.${year} ${time}`;
};

const parseDateString = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return new Date(0);
    const [datePart, timePart] = dateStr.split(' ');
    if (!datePart || !timePart) return new Date(0);
    const dateComponents = datePart.split('.').map(Number);
    const timeComponents = timePart.split(':').map(Number);
    if (dateComponents.length !== 3 || timeComponents.length !== 2) return new Date(0);
    if ([...dateComponents, ...timeComponents].some(isNaN)) return new Date(0);
    const [day, month, year] = dateComponents;
    const [hour, minute] = timeComponents;
    return new Date(year, month - 1, day, hour, minute);
};

const toDateTimePickerFormat = (displayDateStr) => {
    if (!displayDateStr || typeof displayDateStr !== 'string') return "";
    const [datePart, timePart] = displayDateStr.split(' ');
    if (!datePart || !timePart) return "";
    const dateComponents = datePart.split('.');
    if (dateComponents.length !== 3) return "";
    const [day, month, year] = dateComponents.map(s => String(s).padStart(2,'0'));
    const timeParts = timePart.split(':').map(s => String(s).padStart(2,'0'));
    if (timeParts.length !== 2) return "";
    if (isNaN(parseInt(year)) || isNaN(parseInt(month)) || isNaN(parseInt(day)) || isNaN(parseInt(timeParts[0])) || isNaN(parseInt(timeParts[1]))) return "";
    return `${year}-${month}-${day}T${timeParts[0]}:${timeParts[1]}`;
};

const fromDateTimePickerFormat = (pickerDateStr) => {
    if (!pickerDateStr || typeof pickerDateStr !== 'string') return "";
    const [datePart, timePart] = pickerDateStr.split('T');
    if (!datePart || !timePart) return "";
    const dateComponents = datePart.split('-');
    if (dateComponents.length !== 3) return "";
    const [year, month, day] = dateComponents;
    const timeParts = timePart.split(':');
    if (timeParts.length !== 2) return "";
    if (isNaN(parseInt(year)) || isNaN(parseInt(month)) || isNaN(parseInt(day)) || isNaN(parseInt(timeParts[0])) || isNaN(parseInt(timeParts[1]))) return "";
    return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year} ${String(timeParts[0]).padStart(2, '0')}:${String(timeParts[1]).padStart(2, '0')}`;
};

// --- Insights-Komponente ---
function Insights({ entries }) {
  const map = {};
  entries.forEach(e => {
    e.symptoms.forEach(s => {
      if (!map[s.txt]) map[s.txt] = { count: 0, foods: {} };
      map[s.txt].count++;
      const foodKey = e.food || "(Kein Essen)";
      map[s.txt].foods[foodKey] = (map[s.txt].foods[foodKey] || 0) + 1;
    });
  });
  const sorted = Object.entries(map).sort((a, b) => b[1].count - a[1].count);
  return (
    <div>
      <h2 style={{ textAlign: "center", margin: "16px 0" }}>Insights</h2>
      {sorted.length === 0 && <p>Keine Symptome erfasst.</p>}
      {sorted.map(([symptom, data]) => (
        <div key={symptom} style={{ marginBottom: 24 }}>
          <h3>{symptom} ({data.count})</h3>
          <ul>
            {Object.entries(data.foods).sort((a, b) => b[1] - a[1]).map(([food, cnt]) => (
              <li key={food}>{food}: {cnt}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// --- Haupt-Komponente ---
export default function App() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("fd-theme");
    setDark(saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);

  const [view, setView] = useState("diary");
  const [entries, setEntries] = useState(() => {
    try {
      const loadedEntries = JSON.parse(localStorage.getItem("fd-entries") || "[]")
        .map(e => ({ 
            ...e, 
            comment: e.comment || "", 
            food: e.food || "",
            symptoms: (e.symptoms || []).map(s => ({ ...s, strength: s.strength || 1 }))
        }));
      return loadedEntries.sort((a, b) => parseDateString(b.date) - parseDateString(a.date));
    } catch { return []; }
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [displayCount, setDisplayCount] = useState(20);
  const [newForm, setNewForm] = useState(() => {
    const saved = localStorage.getItem("fd-form-new");
    const initialForm = { food: "", imgs: [], symptomInput: "", symptomTime: 0, symptomStrength: 1 };
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            return { ...initialForm, ...parsed, symptomStrength: parsed.symptomStrength || 1 };
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

  useEffect(() => { localStorage.setItem("fd-entries", JSON.stringify(entries)); }, [entries]);
  useEffect(() => { localStorage.setItem("fd-form-new", JSON.stringify(newForm)); }, [newForm]);
  useEffect(() => {
    document.body.style.background = dark ? "#22222a" : "#f4f7fc";
    document.body.style.color = dark ? "#f0f0f8" : "#111";
    localStorage.setItem("fd-theme", dark ? "dark" : "light");
  }, [dark]);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleFocus = e => e.target.scrollIntoView({ behavior: "smooth", block: "center" });
  useEffect(() => {
    if (editingIdx !== null) {
      document.getElementById(`entry-${editingIdx}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [editingIdx]);

  const addToast = msg => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2000);
  };

  const handleExportPDF = async () => {
    const el = document.getElementById("fd-table");
    if (!el) return;
    const imgs = Array.from(el.querySelectorAll("img"));
    const originals = imgs.map(img => ({ w: img.style.width, h: img.style.height }));
    imgs.forEach(img => { img.style.width = "80px"; img.style.height = "80px"; });
    const canvas = await html2canvas(el, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "px", format: [canvas.width, canvas.height] });
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save("FoodDiary.pdf");
    imgs.forEach((img, i) => { img.style.width = originals[i].w; img.style.height = originals[i].h; });
  };

  const handleNewFile = async e => {
    for (let file of Array.from(e.target.files || [])) {
      try {
        if (file.size > 2 * 1024 * 1024) throw new Error("Datei zu groß");
        const smallB64 = await resizeToJpeg(file, 800);
        setNewForm(fm => ({ ...fm, imgs: [...fm.imgs, smallB64] }));
        addToast("Foto hinzugefügt (verkleinert)");
      } catch { addToast("Ungültiges oder zu großes Bild"); }
    }
    e.target.value = "";
  };
  const removeNewImg = idx => {
    setNewForm(fm => ({ ...fm, imgs: fm.imgs.filter((_, i) => i !== idx) }));
    addToast("Foto gelöscht");
  };

  const handleEditFile = async e => {
    for (let file of Array.from(e.target.files || [])) {
      try {
        if (file.size > 2 * 1024 * 1024) throw new Error("Datei zu groß");
        const smallB64 = await resizeToJpeg(file, 800);
        setEditForm(fm => ({ ...fm, imgs: [...fm.imgs, smallB64] }));
        addToast("Foto hinzugefügt (verkleinert)");
      } catch { addToast("Ungültiges oder zu großes Bild"); }
    }
    e.target.value = "";
  };
  const removeEditImg = idx => {
    setEditForm(fm => ({ ...fm, imgs: fm.imgs.filter((_, i) => i !== idx) }));
    addToast("Foto gelöscht");
  };
  
  const addNewSymptom = () => {
    if (!newForm.symptomInput.trim()) return;
    setNewSymptoms(s => [...s, { 
        txt: newForm.symptomInput.trim(), 
        time: newForm.symptomTime, 
        strength: newForm.symptomStrength 
    }]);
    setNewForm(fm => ({ ...fm, symptomInput: "", symptomTime: 0, symptomStrength: 1 }));
  };
  const removeNewSymptom = idx => setNewSymptoms(s => s.filter((_, i) => i !== idx));

  const addEntry = () => {
    if (!newForm.food.trim() && newSymptoms.length === 0) return;
    const entry = {
      food: newForm.food.trim(),
      imgs: newForm.imgs,
      symptoms: newSymptoms,
      comment: "",
      date: now()
    };
    setEntries(prevEntries =>
      [...prevEntries, entry].sort((a, b) => parseDateString(b.date) - parseDateString(a.date))
    );
    setNewForm({ food: "", imgs: [], symptomInput: "", symptomTime: 0, symptomStrength: 1 });
    setNewSymptoms([]);
    addToast("Eintrag gespeichert");
  };

  const startEdit = i => {
    const e = entries[i];
    setEditingIdx(i);
    setEditForm({ 
        food: e.food, 
        imgs: [...e.imgs], 
        symptoms: (e.symptoms || []).map(s => ({ ...s, strength: s.strength || 1 })), 
        symptomInput: "", 
        symptomTime: 0, 
        newSymptomStrength: 1,
        date: toDateTimePickerFormat(e.date) 
    });
  };
  const cancelEdit = () => { setEditingIdx(null); setEditForm(null); };
  
  const addEditSymptom = () => {
    if (!editForm.symptomInput.trim()) return;
    setEditForm(fm => ({ 
        ...fm, 
        symptoms: [...fm.symptoms, { 
            txt: fm.symptomInput.trim(), 
            time: fm.symptomTime, 
            strength: fm.newSymptomStrength 
        }], 
        symptomInput: "", 
        symptomTime: 0,
        newSymptomStrength: 1 
    }));
  };
  const removeEditSymptom = idx => setEditForm(fm => ({ 
      ...fm, 
      symptoms: fm.symptoms.filter((_, i) => i !== idx) 
  }));

  const saveEdit = () => {
    const displayDateToSave = fromDateTimePickerFormat(editForm.date);
    if (!displayDateToSave) { addToast("Ungültiges Datum/Zeit Format. Bitte prüfen."); return; }

    setEntries(prevEntries =>
      prevEntries.map((ent, j) =>
        j === editingIdx
        ? { 
            food: editForm.food.trim(), 
            imgs: editForm.imgs, 
            symptoms: editForm.symptoms, 
            comment: ent.comment, 
            date: displayDateToSave 
          }
        : ent
      ).sort((a, b) => parseDateString(b.date) - parseDateString(a.date))
    );
    cancelEdit(); addToast("Eintrag aktualisiert");
  };
  const deleteEntry = i => {
    setEntries(e => e.filter((_, j) => j !== i));
    if (editingIdx === i) cancelEdit();
    addToast("Eintrag gelöscht");
  };

  const toggleNote = idx => {
    setNoteOpenIdx(noteOpenIdx === idx ? null : idx);
    if (noteOpenIdx !== idx) setNoteDraft(entries[idx].comment);
  };
  const saveNote = idx => {
    setEntries(e => e.map((ent, j) => j === idx ? { ...ent, comment: noteDraft } : ent));
    setNoteOpenIdx(null);
    addToast("Notiz gespeichert");
  };

  const filteredWithIdx = entries.map((e, idx) => ({ entry: e, idx }))
    .filter(({ entry }) =>
      (entry.food && entry.food.toLowerCase().includes(searchTerm.toLowerCase())) ||
      entry.symptoms.some(s => s.txt.toLowerCase().includes(searchTerm.toLowerCase())) ||
      entry.comment.toLowerCase().includes(searchTerm.toLowerCase())
    );
  const toDisplay = filteredWithIdx.slice(0, displayCount);
  const grouped = toDisplay.reduce((acc, { entry, idx }) => {
    const day = entry.date.split(" ")[0];
    (acc[day] = acc[day] || []).push({ entry, idx });
    return acc;
  }, {});
  const dates = Object.keys(grouped)
    .sort((a,b) => parseDateString(grouped[b][0].entry.date) - parseDateString(grouped[a][0].entry.date));

  if (view === "insights") {
    return (
      <div style={styles.container(isMobile)}>
        {toasts.map(t => <div key={t.id} style={styles.toast}>{t.msg}</div>)}
        <div style={styles.topBar}><BackButton onClick={() => setView("diary")} /></div>
        <Insights entries={entries} />
      </div>
    );
  }

  return (
    <div style={styles.container(isMobile)}>
      {toasts.map(t => <div key={t.id} style={styles.toast}>{t.msg}</div>)}

      <div style={styles.topBar}>
        <button onClick={() => setDark(d => !d)} style={{ ...styles.buttonSecondary("transparent"), fontSize: 24 }} title="Theme wechseln">
          {dark ? "🌙" : "☀️"}
        </button>
        <div>
          <PdfButton onClick={handleExportPDF} />{" "}
          <InsightsButton onClick={() => setView("insights")} />
        </div>
      </div>

      <h2 style={styles.title}>Food Diary</h2>

      {/* Neuer Eintrag Form */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 48 }}>
          <input placeholder="Essen..." value={newForm.food} onChange={e => setNewForm(fm => ({ ...fm, food: e.target.value }))} onFocus={handleFocus} style={styles.input} />
          <CameraButton onClick={() => fileRefNew.current?.click()} />
          <input ref={fileRefNew} type="file" accept="image/*" multiple capture={isMobile ? "environment" : undefined} onChange={handleNewFile} style={{ display: "none" }} />
        </div>
        {newForm.imgs.length > 0 && <ImgStack imgs={newForm.imgs} onDelete={removeNewImg} />}
        
        <div style={{ display: "flex", alignItems: "center", gap: '6px', marginBottom: 8, flexWrap: 'wrap' }}>
          <input
            list="symptom-list" placeholder="Symptom..."
            value={newForm.symptomInput}
            onChange={e => setNewForm(fm => ({ ...fm, symptomInput: e.target.value }))}
            onFocus={handleFocus} style={{...styles.smallInput, flexGrow: 1, minWidth: '120px'}}
          />
          <datalist id="symptom-list">{SYMPTOM_CHOICES.map(s => <option key={s} value={s} />)}</datalist>
          <select
            value={newForm.symptomTime}
            onChange={e => setNewForm(fm => ({ ...fm, symptomTime: Number(e.target.value) }))}
            onFocus={handleFocus} style={{...styles.smallInput, flexBasis: '110px', flexShrink: 0}}
          >
            {TIME_CHOICES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select
            value={newForm.symptomStrength}
            onChange={e => setNewForm(fm => ({ ...fm, symptomStrength: Number(e.target.value) }))}
            onFocus={handleFocus} style={{...styles.smallInput, flexBasis: '100px', flexShrink: 0}}
          >
            {[1,2,3,4,5].map(n => <option key={n} value={n}>Stärke {n}</option>)}
          </select>
          <button onClick={addNewSymptom} style={{ ...styles.buttonSecondary("#247be5"), flexShrink: 0, padding: '8px 12px' }}>+</button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 8 }}>
          {newSymptoms.map((s, i) => (
            <SymTag key={i} txt={s.txt} time={s.time} strength={s.strength} dark={dark} onDel={() => removeNewSymptom(i)} />
          ))}
        </div>
        <button onClick={addEntry} disabled={!newForm.food.trim() && newSymptoms.length === 0} style={{ ...styles.buttonPrimary, opacity: (newForm.food.trim() || newSymptoms.length > 0) ? 1 : 0.5 }} >Eintrag hinzufügen</button>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <input placeholder="Suche..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{...styles.smallInput, flexGrow: 1}} />
          <button onClick={() => setDisplayCount(dc => dc + 20)} style={styles.buttonSecondary("#1976d2")}>Mehr laden</button>
        </div>
      </div>

      {/* Gruppierte Einträge */}
      <div id="fd-table">
        {dates.map(day => (
          <div key={day}>
            <div style={styles.groupHeader}>{day}</div>
            {grouped[day].map(({ entry, idx }) => {
              const isSymptomOnlyEntry = !entry.food && entry.symptoms && entry.symptoms.length > 0;
              const symptomsForDisplay = (entry.symptoms || []).map(s => ({...s, strength: s.strength || 1}));
              const knownDisplay = symptomsForDisplay.filter(s => SYMPTOM_CHOICES.includes(s.txt)).sort((a,b) => a.txt.localeCompare(b.txt));
              const customDisplay = symptomsForDisplay.filter(s => !SYMPTOM_CHOICES.includes(s.txt));
              const sortedAllDisplay = [...knownDisplay, ...customDisplay];

              return (
                <div key={idx} id={`entry-${idx}`} style={styles.entryCard(dark, isSymptomOnlyEntry)}>
                  {editingIdx === idx ? (
                    <>
                      <input
                        type="datetime-local"
                        value={editForm.date}
                        onChange={e => setEditForm(fm => ({ ...fm, date: e.target.value }))}
                        style={{...styles.input, marginBottom: '12px', width: '100%'}}
                      />
                      <input
                        value={editForm.food}
                        onChange={e => setEditForm(fm => ({ ...fm, food: e.target.value }))}
                        onFocus={handleFocus}
                        style={{...styles.input, marginBottom: '8px'}}
                      />
                      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0" }}>
                        <CameraButton onClick={() => fileRefEdit.current?.click()} />
                        <input ref={fileRefEdit} type="file" accept="image/*" multiple capture={isMobile ? "environment" : undefined} onChange={handleEditFile} style={{ display: "none" }} />
                        {editForm.imgs.length > 0 && <ImgStack imgs={editForm.imgs} onDelete={removeEditImg} />}
                      </div>
                      
                      <div style={{ display: "flex", alignItems: "center", gap: '6px', marginBottom: 12, flexWrap: 'wrap' }}>
                        <input list="symptom-list-edit" placeholder="Symptom..." value={editForm.symptomInput} onChange={e => setEditForm(fm => ({ ...fm, symptomInput: e.target.value }))} onFocus={handleFocus} style={{...styles.smallInput, flexGrow: 1, minWidth: '100px'}} />
                        <datalist id="symptom-list-edit">{SYMPTOM_CHOICES.map(s => <option key={s} value={s} />)}</datalist>
                        <select value={editForm.symptomTime} onChange={e => setEditForm(fm => ({ ...fm, symptomTime: Number(e.target.value) }))} onFocus={handleFocus} style={{...styles.smallInput, flexBasis: '110px', flexShrink: 0 }}>
                          {TIME_CHOICES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <select
                          value={editForm.newSymptomStrength}
                          onChange={e => setEditForm(fm => ({ ...fm, newSymptomStrength: Number(e.target.value) }))}
                          onFocus={handleFocus} style={{...styles.smallInput, flexBasis: '100px', flexShrink: 0}}
                        >
                          {[1,2,3,4,5].map(n => <option key={n} value={n}>Stärke {n}</option>)}
                        </select>
                        <button onClick={addEditSymptom} style={{...styles.buttonSecondary("#247be5"),flexShrink:0, padding: '8px 12px'}}>+</button>
                      </div>

                      <div style={{ marginBottom: 8 }}>
                        {editForm.symptoms.map((s, j) => (
                          <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'nowrap' }}>
                            <span style={{ flexGrow: 1, overflowWrap: 'break-word', minWidth: '80px', fontSize: '15px', paddingRight: '5px' }}>{s.txt}</span>
                            <select
                              value={s.time}
                              onChange={e_select => {
                                const newTime = Number(e_select.target.value);
                                setEditForm(fm => { const updatedSymptoms = [...fm.symptoms]; updatedSymptoms[j] = { ...updatedSymptoms[j], time: newTime }; return { ...fm, symptoms: updatedSymptoms }; });
                              }}
                              style={{...styles.smallInput, flexBasis: '120px', flexShrink: 0, padding: '6px 10px', fontSize: '14px' }}
                            >
                              {TIME_CHOICES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                            <select
                                value={s.strength || 1}
                                onChange={e_strength => {
                                    const newStrength = Number(e_strength.target.value);
                                    setEditForm(fm => {
                                        const updatedSymptoms = [...fm.symptoms];
                                        updatedSymptoms[j] = { ...updatedSymptoms[j], strength: newStrength };
                                        return { ...fm, symptoms: updatedSymptoms };
                                    });
                                }}
                                style={{...styles.smallInput, flexBasis: '90px', flexShrink: 0, padding: '6px 10px', fontSize: '14px' }}
                            >
                                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                            <button onClick={() => removeEditSymptom(j)} title="Symptom löschen" style={{...styles.buttonSecondary("#d32f2f"), padding: '6px 10px', fontSize: 14, flexShrink: 0, lineHeight: '1.2' }} >×</button>
                          </div>
                        ))}
                      </div>
                      
                      <div style={{ display: "flex", gap: 5, marginTop: '16px' }}>
                        <button onClick={saveEdit} style={styles.buttonSecondary("#1976d2")}>Speichern</button>
                        <button onClick={cancelEdit} style={styles.buttonSecondary("#888")}>Abbrechen</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize:12, opacity:0.7, marginBottom:4 }}>{entry.date}</div>
                      <div style={{ fontSize:18, fontWeight:600, marginBottom:8 }}>{entry.food}</div>
                      {entry.imgs.length>0 && <ImgStack imgs={entry.imgs}/>}
                      <div style={{ display:"flex", flexWrap:"wrap", margin:"8px 0 20px" }}>
                        {sortedAllDisplay.map((s,j) => (
                          <SymTag key={j} txt={s.txt} time={s.time} strength={s.strength} dark={dark}/>
                        ))}
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                        <button onClick={() => startEdit(idx)} style={styles.buttonSecondary("#1976d2")}>Bearbeiten</button>
                        <button onClick={() => { if (window.confirm("Möchten Sie diesen Eintrag wirklich löschen?")) { deleteEntry(idx); } }} style={styles.buttonSecondary("#d32f2f")} >Löschen</button>
                        <span style={{ marginLeft:"auto" }}>
                          <button onClick={() => toggleNote(idx)} style={styles.noteButton(!!entry.comment)}>🗒️</button>
                        </span>
                      </div>
                      {noteOpenIdx === idx && (
                        <div>
                          <textarea value={noteDraft} onChange={e => setNoteDraft(e.target.value)} placeholder="Notiz..." style={styles.textarea} />
                          <button onClick={() => saveNote(idx)} style={{ ...styles.buttonSecondary("#FBC02D"), marginTop: 8 }} >Notiz speichern</button>
                        </div>
                      )}
                      {entry.comment && noteOpenIdx !== idx && (
                        <div style={{ marginTop: 8, background: dark ? "#3a3a42" : "#f0f0f5", padding: "6px 8px", borderRadius: 4, color: dark ? "#e0e0e0" : "#333", overflowWrap: "break-word", whiteSpace: "pre-wrap", boxSizing: "border-box" }}>
                          {entry.comment}
                        </div>
                      )}
                    </>
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