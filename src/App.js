// --- IMPORTS ---
import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import styles from "./styles";
import { SYMPTOM_CHOICES, TIME_CHOICES, TAG_COLORS, TAG_COLOR_NAMES } from "./constants";
import { resizeToJpeg, getStrengthColor, now, vibrate, getTodayDateString, parseDateString, toDateTimePickerFormat, fromDateTimePickerFormat, sortSymptomsByTime } from "./utils";
import PdfButton from "./components/PdfButton";
import InsightsButton from "./components/InsightsButton";
import BackButton from "./components/BackButton";
import CameraButton from "./components/CameraButton";
import ImgStack from "./components/ImgStack";
import SymTag from "./components/SymTag";
import Insights from "./components/Insights";
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
          tagColor: e.tagColor || TAG_COLORS.GREEN,
          linkId: e.linkId || null,
        }));
      return loadedEntries.sort((a, b) => parseDateString(b.date) - parseDateString(a.date));
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
  const [colorPickerOpenForIdx, setColorPickerOpenForIdx] = useState(null);
  const [collapsedDays, setCollapsedDays] = useState(new Set());
  const [linkingInfo, setLinkingInfo] = useState(null); // { baseIdx, id }
  const linkingInfoRef = useRef(null);
  const containerRef = useRef(null);
  const entryRefs = useRef([]);
  const [connections, setConnections] = useState([]);

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
    if (editingIdx !== null && !isExportingPdf) {
      document.getElementById(`entry-card-${editingIdx}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [editingIdx, isExportingPdf]);

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

  useLayoutEffect(() => {
    const updateConnections = () => {
      const container = document.getElementById('fd-table');
      if (!container) return;
      const linkGroups = {};
      const rendered = Array.from(entryRefs.current.keys());
      rendered.forEach(idx => {
        const entry = entries[idx];
        if (entry && entry.linkId) {
          (linkGroups[entry.linkId] = linkGroups[entry.linkId] || []).push(idx);
        }
      });
      const conns = [];
      Object.entries(linkGroups).forEach(([id, arr]) => {
        if (arr.length >= 2) {
          const sorted = arr.slice().sort((a, b) => a - b);
          const startEl = entryRefs.current[sorted[0]];
          const endEl = entryRefs.current[sorted[sorted.length - 1]];
          if (startEl && endEl) {
            const cRect = container.getBoundingClientRect();
            const sRect = startEl.getBoundingClientRect();
            const eRect = endEl.getBoundingClientRect();
            const cross = [];
            for (let i = 1; i < sorted.length - 1; i++) {
              const midEl = entryRefs.current[sorted[i]];
              if (midEl) {
                const mRect = midEl.getBoundingClientRect();
                cross.push(mRect.bottom - sRect.bottom);
              }
            }
            conns.push({
              id,
              top: sRect.bottom - cRect.top - 8,
              bottom: eRect.bottom - cRect.top - 8,
              cross,
            });
          }
        }
      });

      // Offset overlapping lines
      // sort by length so that shorter connections use inner lanes
      const sortedConns = conns
        .slice()
        .sort((a, b) => {
          const lenDiff = (a.bottom - a.top) - (b.bottom - b.top);
          return lenDiff !== 0 ? lenDiff : a.top - b.top;
        });
      const active = [];
      sortedConns.forEach((c) => {
        let lane = 0;
        while (active.some((a) => a.lane === lane && !(c.bottom < a.top || c.top > a.bottom))) {
          lane++;
        }
        c.lane = lane;
        active.push(c);
      });
      setConnections(sortedConns);
    };
    updateConnections();
    window.addEventListener('scroll', updateConnections);
    window.addEventListener('resize', updateConnections);
    return () => {
      window.removeEventListener('scroll', updateConnections);
      window.removeEventListener('resize', updateConnections);
    };
  }, [entries, searchTerm, displayCount, collapsedDays]);

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

    const imgStackItemOriginalStyles = [];
    const individualImageOriginalStyles = [];
    let prevClassName = '';

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

      // Temporäres hexagonales Hintergrundmuster für den PDF-Export setzen
      prevClassName = el.className;
      el.classList.add('pdf-hex-bg');

      const canvas = await html2canvas(el, {
        scale: 2,
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
        useCORS: true,
        backgroundColor: null,
      });

      // Ursprüngliche Klassen wiederherstellen
      el.className = prevClassName;
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
      if (prevClassName) el.className = prevClassName;
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
    if (!newForm.food.trim() && newSymptoms.length === 0) return;
    const entry = {
      food: newForm.food.trim(),
      imgs: newForm.imgs,
      symptoms: sortSymptomsByTime(newSymptoms),
      comment: "",
      date: now(),
      tagColor: TAG_COLORS.GREEN,
      linkId: null,
    };
    setEntries(prevEntries =>
      [...prevEntries, entry].sort((a, b) => parseDateString(b.date) - parseDateString(a.date))
    );
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
      prevEntries.map((ent, j) =>
        j === editingIdx
        ? {
            ...ent,
            food: editForm.food.trim(),
            imgs: editForm.imgs,
            symptoms: sortSymptomsByTime(symptomsToSave),
            date: displayDateToSave,
            linkId: editForm.linkId || null
          }
        : ent
      ).sort((a, b) => parseDateString(b.date) - parseDateString(a.date))
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
      <div ref={containerRef} style={styles.container(isMobile)} onMouseDownCapture={handleRootMouseDown} onClick={handleContainerClick}>
        {toasts.map(t => <div key={t.id} className="toast-fade" style={styles.toast}>{t.msg}</div>)}
        <div style={styles.topBar}><BackButton onClick={() => setView("diary")} /></div>
        <Insights entries={entries} />
      </div>
    );
  }

  return (
    <div ref={containerRef} style={styles.container(isMobile)} onMouseDownCapture={handleRootMouseDown} onClick={handleContainerClick}>
      {toasts.map(t => <div key={t.id} className="toast-fade" style={styles.toast}>{t.msg}</div>)}
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

      {/* Neuer Eintrag Formular */}
      <div style={{ marginBottom: 24 }}>
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
              style={styles.symptomAddButton("#388e3c")}
            >+</button>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 8 }}>
          {sortSymptomsByTime(newSymptoms).map((s, i) => (
            <SymTag key={i} txt={s.txt} time={s.time} strength={s.strength} dark={dark} onDel={() => removeNewSymptom(i)} />
          ))}
        </div>
        <button onClick={addEntry} disabled={!newForm.food.trim() && newSymptoms.length === 0} style={{ ...styles.buttonPrimary, opacity: (newForm.food.trim() || newSymptoms.length > 0) ? 1 : 0.5 }} >Eintrag hinzufügen</button>

        <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: 'center' }}>
          <button
            onClick={() => setShowSearch(s => !s)}
            style={{...styles.glassyIconButton(dark), padding: '6px'}}
            title="Suche"
          >🔍</button>
          {showSearch && (
            <input
              ref={searchInputRef}
              placeholder="Suche..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{...styles.smallInput, flexGrow: 1}}
            />
          )}
        </div>
      </div>

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
        {dates.map(day => (
          <div key={day}>
            {collapsedDays.has(day) && !isExportingPdf ? (
              <div onClick={() => toggleDay(day)} style={styles.dayCover(dark)}>{day}</div>
            ) : (
              <React.Fragment>
                <div onClick={() => toggleDay(day)} style={styles.groupHeader(isExportingPdf)}>{day}</div>
                {grouped[day].map(({ entry, idx }, j) => {
              const isSymptomOnlyEntry = !entry.food && (entry.symptoms || []).length > 0;
              const sortedAllDisplay = sortSymptomsByTime(
                (entry.symptoms || []).map(s => ({
                  ...s,
                  strength: Math.min(parseInt(s.strength) || 1, 3)
                }))
              );

              const cardBackgroundColor = isSymptomOnlyEntry
                ? (dark ? styles.entryCard(dark, true).background : styles.entryCard(false, true).background)
                : (dark ? styles.entryCard(dark, false).background : styles.entryCard(false, false).background);
              
              const currentTagColor = entry.tagColor || TAG_COLORS.GREEN;

              return (
                <div
                  ref={el => entryRefs.current[idx] = el}
                  key={idx}
                  id={`entry-card-${idx}`}
                  style={styles.entryCard(dark, isSymptomOnlyEntry)}
                  onClick={(e) => {
                    if (isExportingPdf) return;
                    e.stopPropagation();
                    if (editingIdx === null) {
                      startEdit(idx);
                    } else if (editingIdx !== idx) {
                      cancelEdit();
                    }
                  }}
                >
                  <div style={styles.pinContainer}>
                    <div
                      className="entry-pin"
                      onClick={(e) => { e.stopPropagation(); handlePinClick(idx); }}
                      style={styles.pin(linkingInfo && linkingInfo.baseIdx === idx)}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g transform="rotate(45 8 8)">
                          <ellipse
                            cx="5"
                            cy="8"
                            rx="4"
                            ry="2.5"
                            stroke={linkingInfo && linkingInfo.baseIdx === idx ? '#FBC02D' : '#6EC1FF'}
                            strokeWidth="2"
                            fill="none"
                          />
                          <ellipse
                            cx="11"
                            cy="8"
                            rx="4"
                            ry="2.5"
                            stroke={linkingInfo && linkingInfo.baseIdx === idx ? '#FBC02D' : '#B8E0FF'}
                            strokeWidth="2"
                            fill="none"
                          />
                        </g>
                      </svg>
                    </div>
                  </div>
                  {editingIdx === idx && !isExportingPdf ? (
                    <> {/* Editieransicht */}
                      <button
                        onClick={() => { if (window.confirm("Möchten Sie diesen Eintrag wirklich löschen?")) deleteEntry(idx); }}
                        style={styles.deleteIcon}
                        title="Eintrag löschen"
                      >×</button>
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
                            style={styles.symptomAddButton("#388e3c")}
                          >+</button>
                        </div>
                      </div>

                      <div style={{ marginBottom: 8 }}>
                        {sortSymptomsByTime(editForm.symptoms).map((s, j) => (
                          <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'nowrap' }}>
                            <input
                              type="text"
                              list="symptom-list-edit"
                              value={s.txt}
                              onChange={e_text => setEditForm(fm => ({ ...fm, symptoms: fm.symptoms.map((sym, k) => k === j ? {...sym, txt: e_text.target.value} : sym) }))}
                              onFocus={handleFocus}
                              style={{...styles.smallInput, flexGrow: 1, marginRight: '6px'}}
                            />
                            <select value={s.time} onChange={e_select => setEditForm(fm => {
                                const updated = fm.symptoms.map((sym, k) => k === j ? {...sym, time: Number(e_select.target.value)} : sym);
                                return { ...fm, symptoms: sortSymptomsByTime(updated) };
                            })}
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
                      {!isExportingPdf && (
                        <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, display: 'flex', gap: '6px' }}>
                          <button
                            id={`note-icon-button-${idx}`}
                            onClick={(e) => { e.stopPropagation(); toggleNote(idx); }}
                            style={{...styles.glassyIconButton(dark), padding: '6px'}}
                            title="Notiz"
                          >🗒️</button>
                          
                        </div>
                      )}

                      <div style={{ fontSize:12, opacity:0.7, marginBottom:4, marginRight: '65px', color: isExportingPdf ? '#fafafa' : (dark ? '#cccccc' : '#444444') }}>{entry.date}</div>
                      <div style={{ fontSize:18, fontWeight:600, marginBottom:8, marginRight: '65px', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
                        {entry.food || (isSymptomOnlyEntry ? "Nur Symptome" : "(Kein Essen)") }
                      </div>

                      {entry.imgs.length>0 && <ImgStack imgs={entry.imgs}/>}
                      <div style={{ display:"flex", flexWrap:"wrap", margin:"8px 0 0" }}>
                        {sortedAllDisplay.map((s,j) => (
                          <SymTag key={j} txt={s.txt} time={s.time} strength={s.strength} dark={dark}/>
                        ))}
                      </div>


                      {noteOpenIdx === idx && !isExportingPdf && (
                        <div onClick={e => e.stopPropagation()} style={{marginTop: '8px', zIndex: 15 }}>
                          <textarea
                            id={`note-textarea-${idx}`}
                            value={noteDraft}
                            onChange={e => {
                              setNoteDraft(e.target.value);
                              e.target.style.height = 'auto';
                              e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                            placeholder="Notiz..."
                            style={{...styles.textarea, fontSize: '16px'}}
                          />
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

                      {/* ANPASSUNG: Tag-Markierung jetzt auch im PDF sichtbar, außer Farbauswahl-Popup */}
                      <> {/* Wrapper für die Markierungsteile */}
                        <div
                          id={`tag-marker-${idx}`}
                          style={styles.tagMarkerOuter(currentTagColor)}
                          onClick={(e) => {
                            // Click-Handler nur aktiv, wenn nicht im PDF-Export
                            if (isExportingPdf) return;
                            e.stopPropagation();
                            setColorPickerOpenForIdx(colorPickerOpenForIdx === idx ? null : idx);
                            setNoteOpenIdx(null);
                          }}
                          title={!isExportingPdf ? `Markierung: ${TAG_COLOR_NAMES[currentTagColor] || 'Unbekannt'}. Klicken zum Ändern.` : `Markierung: ${TAG_COLOR_NAMES[currentTagColor] || 'Unbekannt'}`}
                        />
                        <div style={styles.tagMarkerInnerHint(cardBackgroundColor)} />
                      
                        {/* Farbauswahl-Popup bleibt nur im UI, nicht im PDF */}
                        {!isExportingPdf && colorPickerOpenForIdx === idx && (
                          <div 
                            id={`color-picker-popup-${idx}`}
                            style={styles.colorPickerPopup(dark)} 
                            onClick={e => e.stopPropagation()}
                          >
                            {[TAG_COLORS.GREEN, TAG_COLORS.RED, TAG_COLORS.YELLOW, TAG_COLORS.BROWN].map(colorValue => (
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
                    </>
                  )}
                </div>
              );
              })}
              </React.Fragment>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
