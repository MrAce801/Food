// --- IMPORTS ---
import React, { useState, useRef, useEffect } from "react";

import useConnections from "./hooks/useConnections";
import { exportTableToPdf } from "./utils/pdf";

import styles from "./styles";
import { SYMPTOM_CHOICES, TIME_CHOICES, TAG_COLORS, TAG_COLOR_NAMES } from "./constants";
import { resizeToJpeg, now, vibrate, getTodayDateString, parseDateString, toDateTimePickerFormat, fromDateTimePickerFormat, sortSymptomsByTime } from "./utils";
import PdfButton from "./components/PdfButton";
import PrintButton from "./components/PrintButton";
import InsightsButton from "./components/InsightsButton";
import BackButton from "./components/BackButton";
import CameraButton from "./components/CameraButton";
import ImgStack from "./components/ImgStack";
import SymTag from "./components/SymTag";
import Insights from "./components/Insights";
import NewEntryForm from "./components/NewEntryForm";
import EntryCard from "./components/EntryCard";

const DAY_BAND_SPACING = 25; // further reduce spacing between indicator bars
const DAY_BAND_WIDTH = 11;
const DAY_BAND_OFFSET = 40;

const sortEntries = (a, b) => {
  const dateDiff = parseDateString(b.date) - parseDateString(a.date);
  if (dateDiff !== 0) return dateDiff;
  return (b.createdAt || 0) - (a.createdAt || 0);
};
// --- HAUPTANWENDUNGSKOMPONENTE: App ---
export default function App() {
  // --- STATE VARIABLEN ---
  const [dark, setDark] = useState(false);
  const [view, setView] = useState("diary");
  const [entries, setEntries] = useState(() => {
    try {
      const loadedEntries = JSON.parse(localStorage.getItem("fd-entries") || "[]")
        .map((e, i) => ({
          ...e,
          comment: e.comment || "",
          food: e.food || "",
          symptoms: (e.symptoms || []).map(s => ({ ...s, strength: Math.min(parseInt(s.strength) || 1, 3) })),
          tagColor: e.tagColor || TAG_COLORS.GREEN,
          linkId: e.linkId || null,
          createdAt: e.createdAt || (parseDateString(e.date).getTime() + i / 1000),
        }));
      return loadedEntries.sort(sortEntries);
    } catch { return []; }
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef(null);
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
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [colorPickerOpenForIdx, setColorPickerOpenForIdx] = useState(null);
  const [collapsedDays, setCollapsedDays] = useState(new Set());
  const [linkingInfo, setLinkingInfo] = useState(null); // { baseIdx, id }
  const linkingInfoRef = useRef(null);
  const containerRef = useRef(null);
  const entryRefs = useRef([]);

  // keep ref in sync so event handlers see latest state immediately
  useEffect(() => {
    linkingInfoRef.current = linkingInfo;
  }, [linkingInfo]);

  useEffect(() => {
    const handleDocMouseDown = (e) => {
      if (linkingInfoRef.current !== null) {
        const targetEl = e.target instanceof Element ? e.target : e.target.parentElement;
        const pinClicked = targetEl && targetEl.closest('.entry-pin');
        const lineClicked = targetEl && targetEl.closest('.connection-line');
        if (!pinClicked && !lineClicked) {
          cancelLinking();
        }
      }
    };
    document.addEventListener('mousedown', handleDocMouseDown);
    return () => document.removeEventListener('mousedown', handleDocMouseDown);
  }, []);

  // --- EFFECT HOOKS ---
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
    if (editingIdx !== null && !(isExportingPdf || isPrinting)) {
      document.getElementById(`entry-card-${editingIdx}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [editingIdx, isExportingPdf, isPrinting]);

  useEffect(() => {
    if (showSearch) {
      searchInputRef.current?.focus();
    }
  }, [showSearch]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (editingIdx !== null && containerRef.current && !containerRef.current.contains(e.target)) {
        cancelEdit();
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [editingIdx]);

  const knownDaysRef = useRef(new Set());

  useEffect(() => {
    const today = getTodayDateString();
    const allDays = new Set();
    setCollapsedDays(prev => {
      const newSet = new Set(prev);
      const known = knownDaysRef.current;
      entries.forEach(e => {
        const day = e.date.split(' ')[0];
        allDays.add(day);
        if (!known.has(day)) {
          known.add(day);
          if (day !== today) newSet.add(day);
        }
      });
      known.forEach(d => {
        if (!allDays.has(d)) {
          known.delete(d);
          newSet.delete(d);
        }
      });
      return newSet;
    });
  }, [entries]);

  // Automatisches Nachladen alter Einträge beim Scrollen
  useEffect(() => {
    const handleScroll = () => {
      const total = entries.filter(e =>
        (e.food && e.food.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.symptoms || []).some(s => s.txt.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.comment && e.comment.toLowerCase().includes(searchTerm.toLowerCase()))
      ).length;

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100) {
        setDisplayCount(dc => dc >= total ? dc : Math.min(dc + 20, total));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [entries, searchTerm]);

  useEffect(() => {
    if (noteOpenIdx !== null) {
      const ta = document.getElementById(`note-textarea-${noteOpenIdx}`);
      if (ta) {
        ta.style.height = 'auto';
        ta.style.height = `${ta.scrollHeight}px`;
      }
    }
  }, [noteOpenIdx, noteDraft]);

  const connections = useConnections(entries, searchTerm, displayCount, collapsedDays, entryRefs, isExportingPdf || isPrinting);

  // --- KERNLOGIK & EVENT HANDLER ---
  const handleFocus = e => e.target.scrollIntoView({ behavior: "smooth", block: "center" });

  const addToast = msg => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2000);
  };

  const toggleDay = day => {
    setCollapsedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(day)) newSet.delete(day); else newSet.add(day);
      return newSet;
    });
  };

  const handleExportPDF = async () => {
    const el = document.getElementById("fd-table");
    if (!el) return;

    setColorPickerOpenForIdx(null);
    setNoteOpenIdx(null);

    addToast("PDF Export wird vorbereitet...");
    setIsExportingPdf(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    const ok = await exportTableToPdf(el);
    if (ok) addToast("PDF erfolgreich exportiert!");
    else addToast("Fehler beim PDF-Export.");
    setIsExportingPdf(false);
  };

  const handlePrint = async () => {
    const finish = () => setIsPrinting(false);
    const before = () => {
      window.dispatchEvent(new Event('resize'));
    };
    setIsPrinting(true);
    window.addEventListener('beforeprint', before, { once: true });
    window.addEventListener('afterprint', finish, { once: true });
    await new Promise(resolve => setTimeout(resolve, 100));
    window.print();
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
    setNewSymptoms(s => sortSymptomsByTime([
        ...s,
        {
            txt: newForm.symptomInput.trim(),
            time: newForm.symptomTime,
            strength: newForm.symptomStrength
        }
    ]));
    setNewForm(fm => ({ ...fm, symptomInput: "", symptomTime: 0, symptomStrength: 1 }));
    vibrate(20);
  };
  const removeNewSymptom = idx => setNewSymptoms(s => s.filter((_, i) => i !== idx));

  const addEntry = () => {
    const pendingSymptom = newForm.symptomInput.trim()
      ? {
          txt: newForm.symptomInput.trim(),
          time: newForm.symptomTime,
          strength: newForm.symptomStrength,
        }
      : null;
    const allSymptoms = sortSymptomsByTime([
      ...newSymptoms,
      ...(pendingSymptom ? [pendingSymptom] : []),
    ]);
    if (!newForm.food.trim() && allSymptoms.length === 0) return;
    const entry = {
      food: newForm.food.trim(),
      imgs: newForm.imgs,
      symptoms: allSymptoms,
      comment: "",
      date: now(),
      tagColor: TAG_COLORS.GREEN,
      linkId: null,
      createdAt: Date.now(),
    };
    setEntries(prevEntries => [...prevEntries, entry].sort(sortEntries));
    setNewForm({ food: "", imgs: [], symptomInput: "", symptomTime: 0, symptomStrength: 1 });
    setNewSymptoms([]);
    addToast("Eintrag gespeichert");
    vibrate(50);
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
        date: toDateTimePickerFormat(e.date),
        linkId: e.linkId || null
    });
    setColorPickerOpenForIdx(null);
    setNoteOpenIdx(null);
  };
  const cancelEdit = () => {
    setEditingIdx(null);
    setEditForm(null);
  };

  const addEditSymptom = () => {
    if (!editForm || !editForm.symptomInput.trim()) return;
    setEditForm(fm => ({
        ...fm,
        symptoms: sortSymptomsByTime([
            ...fm.symptoms,
            {
                txt: fm.symptomInput.trim(),
                time: fm.symptomTime,
                strength: fm.newSymptomStrength
            }
        ]),
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

    const pendingSymptom = editForm.symptomInput.trim()
      ? {
          txt: editForm.symptomInput.trim(),
          time: editForm.symptomTime,
          strength: editForm.newSymptomStrength,
        }
      : null;

    const symptomsToSave = [
      ...editForm.symptoms,
      ...(pendingSymptom ? [pendingSymptom] : [])
    ].map(s => ({ ...s, strength: Math.min(parseInt(s.strength) || 1, 3) }));

    setEntries(prevEntries =>
      prevEntries
        .map((ent, j) =>
          j === editingIdx
            ? {
                ...ent,
                food: editForm.food.trim(),
                imgs: editForm.imgs,
                symptoms: sortSymptomsByTime(symptomsToSave),
                date: displayDateToSave,
                linkId: editForm.linkId || null,
              }
            : ent
        )
        .sort(sortEntries)
    );
    cancelEdit();
    addToast("Eintrag aktualisiert");
    vibrate(30);
  };
  const deleteEntry = i => {
    setEntries(e => e.filter((_, j) => j !== i));
    if (editingIdx === i) cancelEdit();
    setColorPickerOpenForIdx(null);
    setNoteOpenIdx(null);
    addToast("Eintrag gelöscht");
    vibrate(100);
  };

  const toggleNote = idx => {
    setNoteOpenIdx(prevOpenIdx => {
        if (prevOpenIdx === idx) {
            return null;
        } else {
            setNoteDraft(entries[idx].comment || "");
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

  const handlePinClick = (idx) => {
    if (!linkingInfoRef.current) {
      const group = entries[idx].linkId;
      if (group) {
        // Entferne bestehende Verknüpfung
        setEntries(prev => prev.map(e => e.linkId === group ? { ...e, linkId: null } : e));
      } else {
        // Starte neuen Link-Vorgang und weise erste ID zu
        const newGroupId = `g-${Date.now()}`;
        setEntries(prev => prev.map((e,i) => i === idx ? { ...e, linkId: newGroupId } : e));
        linkingInfoRef.current = { baseIdx: idx, id: newGroupId };
        setLinkingInfo(linkingInfoRef.current);
      }
    } else {
      if (idx === linkingInfoRef.current.baseIdx) {
        // Beenden des Link-Vorgangs
        cancelLinking();
        return;
      }
      const baseGroupId = linkingInfoRef.current.id;
      const targetGroupId = entries[idx].linkId;
      if (linkingInfoRef.current.baseIdx === null && targetGroupId === baseGroupId) {
        // Already part of this group, nothing to do
        cancelLinking();
        return;
      }
      if (targetGroupId) {
        // Ziel hat bereits eine Gruppe -> verschmelze
        setEntries(prev => prev.map(e => e.linkId === baseGroupId ? { ...e, linkId: targetGroupId } : e));
      } else {
        // Ziel zur aktuellen Gruppe hinzufügen
        setEntries(prev => prev.map((e,i) => i === idx ? { ...e, linkId: baseGroupId } : e));
      }
      linkingInfoRef.current = null;
      setLinkingInfo(null);
    }
  };

  const cancelLinking = () => {
    // Check if there is an active linking process.
    if (linkingInfoRef.current) {
      const { baseIdx, id } = linkingInfoRef.current;

      // A non-null 'baseIdx' indicates that the linking process was started
      // by clicking a specific pin to create a *new* chain.
      // This is the scenario that needs cleaning up on cancellation.
      if (baseIdx !== null) {
        // We know this link was temporary. Remove the linkId from any entry
        // that has it. Using the functional update form `setEntries(prev => ...)`
        // guarantees this logic runs on the latest state, resolving the race condition.
        setEntries(prev =>
          prev.map(e => (e.linkId === id ? { ...e, linkId: null } : e))
        );
      }

      // For all cancellation scenarios (whether from a new link or from
      // deselecting an existing one), we must reset the linking state to exit
      // "linking mode".
      linkingInfoRef.current = null;
      setLinkingInfo(null);
    }
  };

  const handleConnectionClick = (id) => {
    if (linkingInfoRef.current && linkingInfoRef.current.id === id) {
      cancelLinking();
    } else {
      linkingInfoRef.current = { baseIdx: null, id };
      setLinkingInfo(linkingInfoRef.current);
    }
  };

  const handleRootMouseDown = (e) => {
    if (linkingInfoRef.current !== null) {
      const targetEl = e.target instanceof Element ? e.target : e.target.parentElement;
      const pinClicked = targetEl && targetEl.closest('.entry-pin');
      const lineClicked = targetEl && targetEl.closest('.connection-line');
      if (!pinClicked && !lineClicked) {
        cancelLinking();
      }
    }
  };

  const handleContainerClick = (e) => {
      const targetEl = e.target instanceof Element ? e.target : e.target.parentElement;

      if (linkingInfoRef.current !== null) {
          const pinClicked = targetEl && targetEl.closest('.entry-pin');
          const lineClicked = targetEl && targetEl.closest('.connection-line');
          if (!pinClicked && !lineClicked) {
              cancelLinking();
              return;
          }
      }

      if (noteOpenIdx !== null) {
          const noteTextareaClicked = targetEl && targetEl.closest(`#note-textarea-${noteOpenIdx}`);
          const noteSaveButtonClicked = targetEl && targetEl.closest(`#note-save-button-${noteOpenIdx}`);
          const noteIconButtonClicked = targetEl && targetEl.closest(`#note-icon-button-${noteOpenIdx}`);
          const displayedNoteTextTrigger = entries[noteOpenIdx]?.comment && targetEl && targetEl.closest(`#displayed-note-text-${noteOpenIdx}`);
          if (!noteTextareaClicked && !noteSaveButtonClicked && !noteIconButtonClicked && !displayedNoteTextTrigger) {
              setNoteOpenIdx(null);
          }
      }
      if (colorPickerOpenForIdx !== null) {
          const pickerTriggerClicked = targetEl && targetEl.closest(`#tag-marker-${colorPickerOpenForIdx}`);
          const pickerContentClicked = targetEl && targetEl.closest(`#color-picker-popup-${colorPickerOpenForIdx}`);
          if (!pickerTriggerClicked && !pickerContentClicked) {
              setColorPickerOpenForIdx(null);
          }
      }

      if (editingIdx !== null) {
          const cardEl = document.getElementById(`entry-card-${editingIdx}`);
          if (!cardEl || !cardEl.contains(targetEl)) {
              cancelEdit();
          }
      }
  };

  // --- DATENVORBEREITUNG FÜR DIE ANZEIGE ---
  const filteredWithIdx = entries.map((e, idx) => ({ entry: e, idx }))
    .filter(({ entry }) =>
      (entry.food && entry.food.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (entry.symptoms || []).some(s => s.txt.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (entry.comment && entry.comment.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  const entriesToRenderForUiOrPdf = (isExportingPdf || isPrinting) ? filteredWithIdx : filteredWithIdx.slice(0, displayCount);

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
      <div ref={containerRef} style={styles.container(isMobile)} onMouseDownCapture={handleRootMouseDown} onClick={handleContainerClick}>
        {toasts.map(t => <div key={t.id} className="toast-fade" style={styles.toast}>{t.msg}</div>)}
        <div style={styles.topBar} className="top-bar">
          <BackButton onClick={() => setView("diary")} />{" "}
          <div>
            <PrintButton onClick={handlePrint} />
          </div>
        </div>
        <Insights entries={entries} />
      </div>
    );
  }

  return (
    <div ref={containerRef} style={styles.container(isMobile)} onMouseDownCapture={handleRootMouseDown} onClick={handleContainerClick}>
      {toasts.map(t => <div key={t.id} className="toast-fade" style={styles.toast}>{t.msg}</div>)}
      <div style={styles.topBar} className="top-bar">
        <button onClick={() => setDark(d => !d)} style={{ ...styles.buttonSecondary("transparent"), fontSize: 24, color: dark ? '#f0f0f8' : '#111' }} title="Theme wechseln">
          {dark ? "🌙" : "☀️"}
        </button>
        <div>
          <PdfButton onClick={handleExportPDF} />{" "}
          <PrintButton onClick={handlePrint} />{" "}
          <InsightsButton onClick={() => setView("insights")} />
        </div>
      </div>
      <h2 style={styles.title}>Food Diary</h2>

      {/* Neuer Eintrag Formular */}

      <NewEntryForm
        newForm={newForm}
        setNewForm={setNewForm}
        newSymptoms={newSymptoms}
        addNewSymptom={addNewSymptom}
        removeNewSymptom={removeNewSymptom}
        addEntry={addEntry}
        handleNewFile={handleNewFile}
        removeNewImg={removeNewImg}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        searchInputRef={searchInputRef}
        fileRefNew={fileRefNew}
        dark={dark}
        isMobile={isMobile}
        handleFocus={handleFocus}
        SYMPTOM_CHOICES={SYMPTOM_CHOICES}
        TIME_CHOICES={TIME_CHOICES}
        sortSymptomsByTime={sortSymptomsByTime}
        SymTag={SymTag}
        ImgStack={ImgStack}
        CameraButton={CameraButton}
        styles={styles}
      />
      {/* Eintragsliste */}
      <div id="fd-table" style={{position:'relative'}}>
        {connections.map(c => {
          const offset = -c.lane * 5;
          const height = c.bottom - c.top;
          let d = `M10 0 H${offset} V${height} H10`;
          c.cross.forEach(y => {
            d += ` M10 ${y} H${offset}`;
          });
          return (
            <svg
              key={c.id}
              className="connection-line"
              onClick={(e) => { e.stopPropagation(); handleConnectionClick(c.id); }}
              style={{...styles.connectionSvg, top: c.top, height}}
            >
              <path
                d={d}
                stroke="#b22222"
                strokeWidth="2"
                fill="none"
                strokeDasharray="4 2"
                strokeLinecap="round"
              />
            </svg>
          );
        })}
        {dates.map(day => {
          const colorsInDay = new Set(
            grouped[day].map(({ entry }) => entry.tagColor || TAG_COLORS.GREEN)
          );
          const orderedColors = [
            TAG_COLORS.GREEN,
            TAG_COLORS.RED,
            TAG_COLORS.BLUE,
            TAG_COLORS.BROWN,
            TAG_COLORS.YELLOW,
          ].filter(c => colorsInDay.has(c));
          return (
            <div key={day}>
              {collapsedDays.has(day) && !(isExportingPdf || isPrinting) ? (
                <div
                  onClick={() => toggleDay(day)}
                  style={styles.dayCover(dark, orderedColors.length, DAY_BAND_SPACING, DAY_BAND_OFFSET)}
                >
                  <div style={styles.dayCoverText}>
                    <button
                      onClick={e => { e.stopPropagation(); toggleDay(day); }}
                      style={styles.collapseButton(dark)}
                      aria-label="Expand day"
                    >
                      ▶
                    </button>
                    {day}
                  </div>
                  {orderedColors.map((color, i) => (
                    <div
                      key={color}
                      style={styles.dayCoverBand(color, i * DAY_BAND_SPACING + DAY_BAND_OFFSET, DAY_BAND_WIDTH)}
                    />
                  ))}
                </div>
              ) : (
              <React.Fragment>
                <div onClick={() => toggleDay(day)} style={styles.groupHeader(isExportingPdf)}>
                  <button
                    onClick={e => { e.stopPropagation(); toggleDay(day); }}
                    style={styles.collapseButton(dark)}
                    aria-label="Collapse day"
                  >
                    ▼
                  </button>
                  {day}
                </div>
                {grouped[day].map(({ entry, idx }) => (
                  <EntryCard
                    key={idx}
                    refCallback={el => (entryRefs.current[idx] = el)}
            entry={entry}
            idx={idx}
            dark={dark}
            isMobile={isMobile}
            isExportingPdf={isExportingPdf || isPrinting}
            isPrinting={isPrinting}
            editingIdx={editingIdx}
            editForm={editForm}
            setEditForm={setEditForm}
            startEdit={startEdit}
            cancelEdit={cancelEdit}
            saveEdit={saveEdit}
            deleteEntry={deleteEntry}
            addEditSymptom={addEditSymptom}
            removeEditSymptom={removeEditSymptom}
            handleEditFile={handleEditFile}
            fileRefEdit={fileRefEdit}
            removeEditImg={removeEditImg}
            handlePinClick={handlePinClick}
            linkingInfo={linkingInfo}
            colorPickerOpenForIdx={colorPickerOpenForIdx}
            setColorPickerOpenForIdx={setColorPickerOpenForIdx}
            handleTagColorChange={handleTagColorChange}
            noteOpenIdx={noteOpenIdx}
            setNoteOpenIdx={setNoteOpenIdx}
            toggleNote={toggleNote}
            noteDraft={noteDraft}
            setNoteDraft={setNoteDraft}
            saveNote={saveNote}
            SYMPTOM_CHOICES={SYMPTOM_CHOICES}
            TIME_CHOICES={TIME_CHOICES}
            sortSymptomsByTime={sortSymptomsByTime}
            TAG_COLORS={TAG_COLORS}
            TAG_COLOR_NAMES={TAG_COLOR_NAMES}
            handleFocus={handleFocus}
                    ImgStack={ImgStack}
                    CameraButton={CameraButton}
                    SymTag={SymTag}
                    styles={styles}
                  />
                ))}
              </React.Fragment>
            )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
