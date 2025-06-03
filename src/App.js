// --- IMPORTS ---
import React, { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// --- STILDEFINITIONEN ---
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
    zIndex: 1000
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
    padding: "6px 8px", // Beibehaltung des Paddings für Klickfläche
    cursor: "pointer",
    fontSize: 16, // Schriftgröße des Emojis
    lineHeight: 1, // Stellt sicher, dass das Emoji vertikal zentriert ist
    color: dark ? '#f0f0f8' : '#333',
    display: 'flex', // Um das innere Span-Element zentrieren zu können (falls nötig)
    alignItems: 'center',
    justifyContent: 'center',
  }),
  rotatedIcon: { // Neuer Style für das gedrehte Icon-Span
    display: 'inline-block',
    transform: 'rotate(-45deg)',
  },
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
  tagMarkerBase: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    zIndex: 5,
  },
  tagMarkerOuter: (tagColor) => ({
    ...styles.tagMarkerBase,
    borderWidth: '0 0 28px 28px', // Gesamtgröße der Markierung
    borderColor: `transparent transparent ${tagColor} transparent`,
    cursor: 'pointer',
  }),
  tagMarkerInnerHint: (cardBgColor) => ({
    ...styles.tagMarkerBase,
    borderWidth: '0 0 16px 16px', // ANPASSUNG: Verkleinert für dickeren farbigen Rand
    borderColor: `transparent transparent ${cardBgColor} transparent`,
    pointerEvents: 'none',
    zIndex: 6,
  }),
  colorPickerPopup: (dark) => ({
    position: 'absolute',
    bottom: '30px', // ANPASSUNG: Position eventuell anpassen, wenn Markierung dicker/anders
    right: '5px',
    background: dark ? '#4a4a52' : '#fff',
    padding: '8px',
    borderRadius: '6px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
    zIndex: 30,
    display: 'flex',
    gap: '8px',
  }),
  colorPickerItem: (color, isActive, currentThemeDark) => ({
    width: '24px',
    height: '24px',
    backgroundColor: color,
    borderRadius: '4px',
    cursor: 'pointer',
    border: isActive ? (currentThemeDark ? '2px solid #FFFFFF' : '2px solid #000000') : '2px solid transparent',
    boxSizing: 'border-box',
  }),
};

// --- GLOBALE KONSTANTEN & FARBMAPPINGS ---
const SYMPTOM_COLOR_MAP = { /* ... unverändert ... */ };
const SYMPTOM_CHOICES = [ /* ... unverändert ... */ ];
const TIME_CHOICES = [ /* ... unverändert ... */ ];
const TAG_COLORS = { /* ... unverändert ... */ };
const TAG_COLOR_NAMES = { /* ... unverändert ... */ };

// --- HILFSFUNKTIONEN ---
// ... (resizeToJpeg, getStrengthColor, now, parseDateString, toDateTimePickerFormat, fromDateTimePickerFormat bleiben unverändert) ...

// --- UI UTILITY KOMPONENTEN ---
// ... (PdfButton, InsightsButton, BackButton, CameraButton, ImgStack, SymTag bleiben unverändert) ...

// --- DATENVERARBEITUNGSKOMPONENTEN (z.B. Insights) ---
// ... (Insights Komponente bleibt unverändert) ...

// --- HAUPTANWENDUNGSKOMPONENTE: App ---
export default function App() {
  // --- STATE VARIABLEN ---
  // ... (alle State Variablen bleiben unverändert) ...
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
          tagColor: e.tagColor || TAG_COLORS.GREEN,
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
            const strength = Math.min(parseInt(parsed.symptomStrength) || 1, 3);
            return { ...initialForm, ...parsed, symptomStrength: strength };
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
  const [colorPickerOpenForIdx, setColorPickerOpenForIdx] = useState(null);

  // --- EFFECT HOOKS ---
  // ... (alle Effect Hooks bleiben unverändert) ...
  useEffect(() => {
    const saved = localStorage.getItem("fd-theme");
    setDark(saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("fd-entries", JSON.stringify(entries));
    } catch (e) {
      if (e.name === 'QuotaExceededError' ||
          e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
          (e.code && (e.code === 22 || e.code === 1014))) {
        console.error("LocalStorage Quota Exceeded:", e);
        addToast("Speicherlimit erreicht! Neue Einträge können evtl. nicht gespeichert werden.");
      } else {
        console.error("Fehler beim Speichern der Einträge in localStorage:", e);
        addToast("Ein Fehler ist beim Speichern der Daten aufgetreten.");
      }
    }
  }, [entries]);

  useEffect(() => {
    localStorage.setItem("fd-form-new", JSON.stringify(newForm));
  }, [newForm]);

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

  useEffect(() => {
    if (editingIdx !== null && !isExportingPdf) {
      document.getElementById(`entry-card-${editingIdx}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [editingIdx, isExportingPdf]);


  // --- KERNLOGIK & EVENT HANDLER ---
  // ... (handleFocus, addToast, handleExportPDF, Datei-Handling, Symptom-Management, Eintrags-Management etc. bleiben unverändert) ...
  const handleFocus = e => e.target.scrollIntoView({ behavior: "smooth", block: "center" });

  const addToast = msg => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2000);
  };

  const handleExportPDF = async () => {
    const el = document.getElementById("fd-table");
    if (!el) return;

    const currentActionMenu = actionMenuOpenForIdx;
    const currentColorPicker = colorPickerOpenForIdx;
    const currentNote = noteOpenIdx;

    setActionMenuOpenForIdx(null);
    setColorPickerOpenForIdx(null);
    setNoteOpenIdx(null);


    addToast("PDF Export wird vorbereitet...");
    setIsExportingPdf(true);

    await new Promise(resolve => setTimeout(resolve, 300));

    const imgStackItemOriginalStyles = [];
    const individualImageOriginalStyles = [];

    try {
      const imgStackContainers = Array.from(el.querySelectorAll(".img-stack-container"));
      imgStackContainers.forEach(stackContainer => {
        const childrenItems = Array.from(stackContainer.children).filter(child => child.classList.contains("img-stack-item"));
        childrenItems.forEach((item, index) => {
          imgStackItemOriginalStyles.push({ el: item, marginLeft: item.style.marginLeft, zIndex: item.style.zIndex });
          item.style.marginLeft = index > 0 ? "4px" : "0px";
          item.style.zIndex = "auto";
        });
      });

      const allImagesInTable = Array.from(el.querySelectorAll("#fd-table img"));
      allImagesInTable.forEach(img => {
        individualImageOriginalStyles.push({ el: img, width: img.style.width, height: img.style.height, objectFit: img.style.objectFit });
        img.style.width = "120px";
        img.style.height = "120px";
        img.style.objectFit = "contain";
      });

      const canvas = await html2canvas(el, {
        scale: 2,
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ unit: "px", format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save("FoodDiary.pdf");
      addToast("PDF erfolgreich exportiert!");

    } catch (error) {
      console.error("Fehler beim Erstellen des PDFs:", error);
      addToast("Fehler beim PDF-Export.");
    } finally {
      imgStackItemOriginalStyles.forEach(orig => {
        orig.el.style.marginLeft = orig.marginLeft;
        orig.el.style.zIndex = orig.zIndex;
      });
      individualImageOriginalStyles.forEach(orig => {
        orig.el.style.width = orig.width;
        orig.el.style.height = orig.height;
        orig.el.style.objectFit = orig.objectFit;
      });
      setIsExportingPdf(false);
    }
  };

  const handleNewFile = async e => {
    for (let file of Array.from(e.target.files || [])) {
      try {
        if (file.size > 5 * 1024 * 1024) throw new Error("Datei zu groß (max 5MB)");
        const smallB64 = await resizeToJpeg(file, 800);
        setNewForm(fm => ({ ...fm, imgs: [...fm.imgs, smallB64] }));
        addToast("Foto hinzugefügt (verkleinert)");
      } catch (err) {
        console.error("Fehler beim Hinzufügen des Bildes (neuer Eintrag):", err);
        addToast(err.message || "Ungültiges oder zu großes Bild");
      }
    }
    if (e.target) e.target.value = "";
  };
  const removeNewImg = idx => {
    setNewForm(fm => ({ ...fm, imgs: fm.imgs.filter((_, i) => i !== idx) }));
    addToast("Foto gelöscht");
  };

  const handleEditFile = async e => {
    if (!editForm) return;
    for (let file of Array.from(e.target.files || [])) {
      try {
        if (file.size > 5 * 1024 * 1024) throw new Error("Datei zu groß (max 5MB)");
        const smallB64 = await resizeToJpeg(file, 800);
        setEditForm(fm => ({ ...fm, imgs: [...fm.imgs, smallB64] }));
        addToast("Foto hinzugefügt (verkleinert)");
      } catch (err) {
        console.error("Fehler beim Hinzufügen des Bildes (Eintrag bearbeiten):", err);
        addToast(err.message || "Ungültiges oder zu großes Bild");
      }
    }
    if (e.target) e.target.value = "";
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
      date: now(),
      tagColor: TAG_COLORS.GREEN,
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
        symptoms: (e.symptoms || []).map(s => ({ ...s, strength: Math.min(parseInt(s.strength) || 1, 3) })),
        symptomInput: "",
        symptomTime: 0,
        newSymptomStrength: 1,
        date: toDateTimePickerFormat(e.date)
    });
    setActionMenuOpenForIdx(null);
    setColorPickerOpenForIdx(null);
    setNoteOpenIdx(null);
  };
  const cancelEdit = () => {
    setEditingIdx(null);
    setEditForm(null);
    setActionMenuOpenForIdx(null);
  };

  const addEditSymptom = () => {
    if (!editForm || !editForm.symptomInput.trim()) return;
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
    if (!editForm) return;
    const displayDateToSave = fromDateTimePickerFormat(editForm.date);
    if (!displayDateToSave) { addToast("Ungültiges Datum/Zeit Format. Bitte prüfen."); return; }

    setEntries(prevEntries =>
      prevEntries.map((ent, j) =>
        j === editingIdx
        ? {
            ...ent,
            food: editForm.food.trim(),
            imgs: editForm.imgs,
            symptoms: editForm.symptoms.map(s => ({...s, strength: Math.min(parseInt(s.strength) || 1, 3)})),
            date: displayDateToSave
          }
        : ent
      ).sort((a, b) => parseDateString(b.date) - parseDateString(a.date))
    );
    cancelEdit();
    addToast("Eintrag aktualisiert");
  };
  const deleteEntry = i => {
    setEntries(e => e.filter((_, j) => j !== i));
    if (editingIdx === i) cancelEdit();
    setActionMenuOpenForIdx(null);
    setColorPickerOpenForIdx(null);
    setNoteOpenIdx(null);
    addToast("Eintrag gelöscht");
  };

  const toggleNote = idx => {
    setNoteOpenIdx(prevOpenIdx => {
        if (prevOpenIdx === idx) {
            return null;
        } else {
            setNoteDraft(entries[idx].comment || "");
            setActionMenuOpenForIdx(null);
            setColorPickerOpenForIdx(null);
            return idx;
        }
    });
  };
  const saveNote = idx => {
    setEntries(e => e.map((ent, j) => j === idx ? { ...ent, comment: noteDraft } : ent));
    setNoteOpenIdx(null);
    addToast("Notiz gespeichert");
  };

  const handleTagColorChange = (entryIdx, newColor) => {
    setEntries(prevEntries =>
        prevEntries.map((entry, i) =>
            i === entryIdx ? { ...entry, tagColor: newColor } : entry
        )
    );
    const colorName = TAG_COLOR_NAMES[newColor] || newColor;
    addToast(`Markierung auf "${colorName}" geändert.`);
    setColorPickerOpenForIdx(null);
  };

  const handleContainerClick = (e) => {
      if (actionMenuOpenForIdx !== null) {
          const triggerClicked = e.target.closest(`#action-menu-trigger-${actionMenuOpenForIdx}`);
          const menuClicked = e.target.closest(`#action-menu-content-${actionMenuOpenForIdx}`);
          if (!triggerClicked && !menuClicked) {
              setActionMenuOpenForIdx(null);
          }
      }
      if (noteOpenIdx !== null) {
          const noteTextareaClicked = e.target.closest(`#note-textarea-${noteOpenIdx}`);
          const noteSaveButtonClicked = e.target.closest(`#note-save-button-${noteOpenIdx}`);
          const noteIconButtonClicked = e.target.closest(`#note-icon-button-${noteOpenIdx}`);
          const displayedNoteTextTrigger = entries[noteOpenIdx]?.comment && e.target.closest(`#displayed-note-text-${noteOpenIdx}`);
          if (!noteTextareaClicked && !noteSaveButtonClicked && !noteIconButtonClicked && !displayedNoteTextTrigger) {
              setNoteOpenIdx(null);
          }
      }
      if (colorPickerOpenForIdx !== null) {
          const pickerTriggerClicked = e.target.closest(`#tag-marker-${colorPickerOpenForIdx}`);
          const pickerContentClicked = e.target.closest(`#color-picker-popup-${colorPickerOpenForIdx}`);
          if (!pickerTriggerClicked && !pickerContentClicked) {
              setColorPickerOpenForIdx(null);
          }
      }
  };
  const filteredWithIdx = entries.map((e, idx) => ({ entry: e, idx }))
  .filter(({ entry }) =>
    (entry.food && entry.food.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (entry.symptoms || []).some(s => s.txt.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (entry.comment && entry.comment.toLowerCase().includes(searchTerm.toLowerCase()))
  );

const entriesToRenderForUiOrPdf = isExportingPdf ? filteredWithIdx : filteredWithIdx.slice(0, displayCount);

const grouped = entriesToRenderForUiOrPdf.reduce((acc, { entry, idx }) => {
  const day = entry.date.split(" ")[0];
  (acc[day] = acc[day] || []).push({ entry, idx });
  return acc;
}, {});
const dates = Object.keys(grouped)
  .sort((a,b) => parseDateString(grouped[b][0].entry.date) - parseDateString(grouped[a][0].entry.date));


  // --- JSX RENDERING LOGIK ---
  if (view === "insights") {
    return (
      <div style={styles.container(isMobile)} onClick={handleContainerClick}>
        {toasts.map(t => <div key={t.id} style={styles.toast}>{t.msg}</div>)}
        <div style={styles.topBar}><BackButton onClick={() => setView("diary")} /></div>
        <Insights entries={entries} />
      </div>
    );
  }

  return (
    <div style={styles.container(isMobile)} onClick={handleContainerClick}>
      {toasts.map(t => <div key={t.id} style={styles.toast}>{t.msg}</div>)}
      <div style={styles.topBar}>
        <button onClick={() => setDark(d => !d)} style={{ ...styles.buttonSecondary("transparent"), fontSize: 24, color: dark ? '#f0f0f8' : '#111' }} title="Theme wechseln">
          {dark ? "🌙" : "☀️"}
        </button>
        <div>
          <PdfButton onClick={handleExportPDF} />{" "}
          <InsightsButton onClick={() => setView("insights")} />
        </div>
      </div>
      <h2 style={styles.title}>Food Diary</h2>

      <div style={{ marginBottom: 24 }}>
        {/* ... Neuer Eintrag Formular (unverändert) ... */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <input placeholder="Essen..." value={newForm.food} onChange={e => setNewForm(fm => ({ ...fm, food: e.target.value }))} onFocus={handleFocus} style={styles.input} />
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
            <button
              onClick={addNewSymptom}
              style={{
                ...styles.buttonSecondary("#247be5"),
                flexShrink: 0,
                fontSize: '16px',
                padding: '9px 12px',
                boxSizing: 'border-box'
              }}
            >+</button>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 8 }}>
          {newSymptoms.map((s, i) => ( <SymTag key={i} txt={s.txt} time={s.time} strength={s.strength} dark={dark} onDel={() => removeNewSymptom(i)} /> ))}
        </div>
        <button onClick={addEntry} disabled={!newForm.food.trim() && newSymptoms.length === 0} style={{ ...styles.buttonPrimary, opacity: (newForm.food.trim() || newSymptoms.length > 0) ? 1 : 0.5 }} >Eintrag hinzufügen</button>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <input placeholder="Suche..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{...styles.smallInput, flexGrow: 1}} />
          { !isExportingPdf && <button onClick={() => setDisplayCount(dc => dc + 20)} style={styles.buttonSecondary("#1976d2")}>Mehr laden</button> }
        </div>
      </div>

      <div id="fd-table">
        {dates.map(day => (
          <div key={day}>
            <div style={styles.groupHeader}>{day}</div>
            {grouped[day].map(({ entry, idx }) => {
              const isSymptomOnlyEntry = !entry.food && (entry.symptoms || []).length > 0;
              const symptomsForDisplay = (entry.symptoms || []).map(s => ({...s, strength: Math.min(parseInt(s.strength) || 1, 3)}));
              const knownDisplay = symptomsForDisplay.filter(s => SYMPTOM_CHOICES.includes(s.txt)).sort((a,b) => a.txt.localeCompare(b.txt));
              const customDisplay = symptomsForDisplay.filter(s => !SYMPTOM_CHOICES.includes(s.txt));
              const sortedAllDisplay = [...knownDisplay, ...customDisplay];

              const cardBackgroundColor = isSymptomOnlyEntry
                ? (dark ? styles.entryCard(dark, true).background : styles.entryCard(false, true).background)
                : (dark ? styles.entryCard(dark, false).background : styles.entryCard(false, false).background);
              
              const currentTagColor = entry.tagColor || TAG_COLORS.GREEN;

              return (
                <div key={idx} id={`entry-card-${idx}`} style={styles.entryCard(dark, isSymptomOnlyEntry)}>
                  {editingIdx === idx && !isExportingPdf ? (
                    <> {/* Editieransicht unverändert */}
                       <input type="datetime-local" value={editForm.date} onChange={e => setEditForm(fm => ({ ...fm, date: e.target.value }))} style={{...styles.input, marginBottom: '12px', width: '100%'}} />
                      <input placeholder="Essen..." value={editForm.food} onChange={e => setEditForm(fm => ({ ...fm, food: e.target.value }))} onFocus={handleFocus} style={{...styles.input, width: '100%', marginBottom: '8px'}} />
                      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0" }}> <CameraButton onClick={() => fileRefEdit.current?.click()} /> <input ref={fileRefEdit} type="file" accept="image/*" multiple capture={isMobile ? "environment" : undefined} onChange={handleEditFile} style={{ display: "none" }} /> {editForm.imgs.length > 0 && <ImgStack imgs={editForm.imgs} onDelete={removeEditImg} />} </div>
                      
                      <div style={{ marginBottom: 12 }}>
                        <input list="symptom-list-edit" placeholder="Symptom hinzufügen..." value={editForm.symptomInput} onChange={e => setEditForm(fm => ({ ...fm, symptomInput: e.target.value }))} onFocus={handleFocus} style={{...styles.smallInput, width: '100%', marginBottom: '8px'}} />
                        <datalist id="symptom-list-edit">{SYMPTOM_CHOICES.map(s => <option key={s} value={s} />)}</datalist>
                        <div style={{ display: "flex", alignItems: "center", gap: '6px', flexWrap: 'nowrap' }}>
                          <select value={editForm.symptomTime} onChange={e => setEditForm(fm => ({ ...fm, symptomTime: Number(e.target.value) }))} onFocus={handleFocus} style={{...styles.smallInput, width: '110px', flexShrink:0 }}>
                            {TIME_CHOICES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                          <select value={editForm.newSymptomStrength} onChange={e => setEditForm(fm => ({ ...fm, newSymptomStrength: Number(e.target.value) }))} onFocus={handleFocus} style={{...styles.smallInput, width: '100px', flexShrink:0 }}>
                            {[1,2,3].map(n => <option key={n} value={n}>Stärke {n}</option>)}
                          </select>
                          <button
                            onClick={addEditSymptom}
                            style={{
                              ...styles.buttonSecondary("#247be5"),
                              flexShrink:0,
                              fontSize: '16px',
                              padding: '9px 12px',
                              boxSizing: 'border-box'
                            }}
                          >+</button>
                        </div>
                      </div>

                      <div style={{ marginBottom: 8 }}>
                        {editForm.symptoms.map((s, j) => (
                          <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'nowrap' }}>
                            <input
                              type="text"
                              list="symptom-list-edit"
                              value={s.txt}
                              onChange={e_text => setEditForm(fm => ({ ...fm, symptoms: fm.symptoms.map((sym, k) => k === j ? {...sym, txt: e_text.target.value} : sym) }))}
                              onFocus={handleFocus}
                              style={{...styles.smallInput, flexGrow: 1, marginRight: '6px'}}
                            />
                            <select value={s.time} onChange={e_select => setEditForm(fm => ({ ...fm, symptoms: fm.symptoms.map((sym, k) => k === j ? {...sym, time: Number(e_select.target.value)} : sym) }))}
                              style={{...styles.smallInput, width: '37px', flexShrink: 0, fontSize: '16px', padding: '6px 2px' }}
                            >
                              {TIME_CHOICES.map(t => (<option key={t.value} value={t.value}>{t.value === 0 ? '0' : t.value}</option>))}
                            </select>
                            <select value={s.strength || 1} onChange={e_strength => setEditForm(fm => ({ ...fm, symptoms: fm.symptoms.map((sym, k) => k === j ? {...sym, strength: Number(e_strength.target.value)} : sym) }))}
                              style={{...styles.smallInput, width: '25px', flexShrink: 0, fontSize: '16px', padding: '6px 2px' }}
                            >
                              {[1,2,3].map(n => <option key={n} value={n}>{n}</option>)}
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
                    <> {/* Anzeigeansicht */}
                      <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, display: 'flex', gap: '6px' }}>
                        <button
                          id={`note-icon-button-${idx}`}
                          onClick={(e) => { e.stopPropagation(); toggleNote(idx); }}
                          style={{...styles.glassyIconButton(dark), padding: '6px'}}
                          title="Notiz"
                        >🗒️</button>
                        <button
                          id={`action-menu-trigger-${idx}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionMenuOpenForIdx(actionMenuOpenForIdx === idx ? null : idx);
                            setNoteOpenIdx(null);
                            setColorPickerOpenForIdx(null);
                          }}
                          style={{...styles.glassyIconButton(dark), padding: '6px'}} // Padding hier beibehalten für Klickfläche
                          title="Aktionen"
                        >
                          <span style={styles.rotatedIcon}>✏️</span> {/* ANPASSUNG: Icon gedreht */}
                        </button>
                      </div>

                      <div style={{ fontSize:12, opacity:0.7, marginBottom:4, marginRight: '65px' }}>{entry.date}</div>
                      <div style={{ fontSize:18, fontWeight:600, marginBottom:8, marginRight: '65px', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
                        {entry.food || (isSymptomOnlyEntry ? "Nur Symptome" : "(Kein Essen)") }
                      </div>

                      {entry.imgs.length>0 && <ImgStack imgs={entry.imgs}/>}
                      <div style={{ display:"flex", flexWrap:"wrap", margin:"8px 0 0" }}>
                        {sortedAllDisplay.map((s,j) => (
                          <SymTag key={j} txt={s.txt} time={s.time} strength={s.strength} dark={dark}/>
                        ))}
                      </div>

                      {actionMenuOpenForIdx === idx && !isExportingPdf && (
                        <div id={`action-menu-content-${idx}`} style={styles.actionMenu(dark)} onClick={e => e.stopPropagation()}>
                            <button onClick={() => { startEdit(idx); }} style={styles.actionMenuItem(dark)} > Bearbeiten </button>
                            <button onClick={() => { if (window.confirm("Möchten Sie diesen Eintrag wirklich löschen?")) { deleteEntry(idx); } else { setActionMenuOpenForIdx(null); } }} style={styles.actionMenuItem(dark, true)} > Löschen </button>
                        </div>
                      )}

                      {noteOpenIdx === idx && !isExportingPdf && (
                        <div onClick={e => e.stopPropagation()} style={{marginTop: '8px', zIndex: 15 }}>
                          <textarea id={`note-textarea-${idx}`} value={noteDraft} onChange={e => setNoteDraft(e.target.value)} placeholder="Notiz..." style={{...styles.textarea, fontSize: '16px'}} />
                          <button id={`note-save-button-${idx}`} onClick={() => saveNote(idx)} style={{ ...styles.buttonSecondary(dark ? '#555' : "#FBC02D"), color: dark ? '#fff' : '#333', marginTop: 8 }} >Notiz speichern</button>
                        </div>
                      )}
                      {entry.comment && noteOpenIdx !== idx && !isExportingPdf && (
                        <div
                          id={`displayed-note-text-${idx}`}
                          onClick={(e) => { e.stopPropagation(); toggleNote(idx);}}
                          style={{ marginTop: 8, background: dark ? "#3a3a42" : "#f0f0f5", padding: "6px 8px", borderRadius: 4, color: dark ? "#e0e0e0" : "#333", overflowWrap: "break-word", whiteSpace: "pre-wrap", boxSizing: "border-box", cursor: 'pointer' }}
                        >
                          {entry.comment}
                        </div>
                      )}

                      {!isExportingPdf && (
                        <>
                          <div
                            id={`tag-marker-${idx}`}
                            style={styles.tagMarkerOuter(currentTagColor)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setColorPickerOpenForIdx(colorPickerOpenForIdx === idx ? null : idx);
                              setActionMenuOpenForIdx(null);
                              setNoteOpenIdx(null);
                            }}
                            title={`Markierung: ${TAG_COLOR_NAMES[currentTagColor] || 'Unbekannt'}. Klicken zum Ändern.`}
                          />
                          <div style={styles.tagMarkerInnerHint(cardBackgroundColor)} />
                        
                          {colorPickerOpenForIdx === idx && (
                            <div 
                              id={`color-picker-popup-${idx}`}
                              style={styles.colorPickerPopup(dark)} 
                              onClick={e => e.stopPropagation()}
                            >
                              {[TAG_COLORS.GREEN, TAG_COLORS.RED, TAG_COLORS.YELLOW].map(colorValue => (
                                <div
                                  key={colorValue}
                                  style={styles.colorPickerItem(colorValue, currentTagColor === colorValue, dark)}
                                  title={TAG_COLOR_NAMES[colorValue] || colorValue}
                                  onClick={() => handleTagColorChange(idx, colorValue)}
                                />
                              ))}
                            </div>
                          )}
                        </>
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