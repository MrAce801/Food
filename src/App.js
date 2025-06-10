// --- IMPORTS ---
import React, { useState, useRef, useEffect } from "react";

import useConnections from "./hooks/useConnections";
import { exportTableToPdf } from "./utils/pdf";

import styles from "./styles";
import { SYMPTOM_CHOICES, TIME_CHOICES, TAG_COLORS, TAG_COLOR_NAMES } from "./constants";
import { resizeToJpeg, now, vibrate, getTodayDateString, parseDateString, toDateTimePickerFormat, fromDateTimePickerFormat, sortSymptomsByTime, determineTagColor } from "./utils";
import PdfButton from "./components/PdfButton";
import PrintButton from "./components/PrintButton";
import InsightsButton from "./components/InsightsButton";
import BackButton from "./components/BackButton";
import CameraButton from "./components/CameraButton";
import ImgStack from "./components/ImgStack";
import SymTag from "./components/SymTag";
import Insights from "./components/Insights";
import NewEntryForm from "./components/NewEntryForm";
import QuickMenu from "./components/QuickMenu";
import FilterMenu from "./components/FilterMenu";
import ConnectionLines from "./components/ConnectionLines";
import DayGroup from "./components/DayGroup";

// spacing and sizing for collapsed day indicators
// slightly smaller rings but still large enough to show counts
const DAY_MARK_SPACING = 26;
const DAY_MARK_SIZE = 20;
const DAY_MARK_OFFSET = 40;
const DAY_MARK_TOP = 24;

const sortEntries = (a, b) => {
  const dateDiff = parseDateString(b.date) - parseDateString(a.date);
  if (dateDiff !== 0) return dateDiff;
  return (b.createdAt || 0) - (a.createdAt || 0);
};

const CATEGORY_ORDER = [
  TAG_COLORS.GREEN,
  TAG_COLORS.RED,
  TAG_COLORS.BLUE,
  TAG_COLORS.BROWN,
  TAG_COLORS.YELLOW,
];

const sortEntriesByCategory = (a, b) => {
  const ca = CATEGORY_ORDER.indexOf(a.tagColor || TAG_COLORS.GREEN);
  const cb = CATEGORY_ORDER.indexOf(b.tagColor || TAG_COLORS.GREEN);
  if (ca !== cb) return ca - cb;
  return sortEntries(a, b);
};
// --- HAUPTANWENDUNGSKOMPONENTE: App ---
export default function App() {
  // --- STATE VARIABLEN ---
  const [dark, setDark] = useState(false);
  const [view, setView] = useState("diary");
  const [entries, setEntries] = useState(() => {
    try {
      const loadedEntries = JSON.parse(localStorage.getItem("fd-entries") || "[]")
        .map((e, i) => {
          const symptoms = (e.symptoms || []).map(s => ({
            ...s,
            strength: Math.min(parseInt(s.strength) || 1, 3),
          }));
          const base = {
            ...e,
            comment: e.comment || "",
            food: e.food || "",
            symptoms,
            tagColor: e.tagColor || TAG_COLORS.GREEN,
            tagColorManual: e.tagColorManual || false,
            linkId: e.linkId || null,
            createdAt: e.createdAt || (parseDateString(e.date).getTime() + i / 1000),
          };
          if (!base.tagColorManual) {
            base.tagColor = determineTagColor(base.food, base.symptoms);
          }
          return base;
        });
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
  const [favoriteFoods, setFavoriteFoods] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fd-fav-foods') || '[]')
        .sort((a, b) => a.localeCompare(b));
    } catch { return []; }
  });
  const [favoriteSymptoms, setFavoriteSymptoms] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('fd-fav-symptoms'));
      const arr =
        stored && Array.isArray(stored) && stored.length > 0
          ? stored
          : SYMPTOM_CHOICES.slice();
      return arr.sort((a, b) => a.localeCompare(b));
    } catch {
      return SYMPTOM_CHOICES.slice().sort((a, b) => a.localeCompare(b));
    }
  });
  const [showFoodQuick, setShowFoodQuick] = useState(false);
  const [showSymptomQuick, setShowSymptomQuick] = useState(false);
  const [showEditFoodQuick, setShowEditFoodQuick] = useState(false);
  const [showEditSymptomQuick, setShowEditSymptomQuick] = useState(false);
  const [filterTags, setFilterTags] = useState([]);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [sortMode, setSortMode] = useState('date');

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
    localStorage.setItem('fd-fav-foods', JSON.stringify(favoriteFoods));
  }, [favoriteFoods]);

  useEffect(() => {
    localStorage.setItem('fd-fav-symptoms', JSON.stringify(favoriteSymptoms));
  }, [favoriteSymptoms]);

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

  useEffect(() => {
    const handleQuickClose = (e) => {
      if (showFoodQuick) {
        const area = document.getElementById('food-input-container');
        if (area && !area.contains(e.target)) setShowFoodQuick(false);
      }
      if (showSymptomQuick) {
        const area = document.getElementById('symptom-input-container');
        if (area && !area.contains(e.target)) setShowSymptomQuick(false);
      }
      if (showEditFoodQuick) {
        const area = document.getElementById('edit-food-input-container');
        if (area && !area.contains(e.target)) setShowEditFoodQuick(false);
      }
      if (showEditSymptomQuick) {
        const area = document.getElementById('edit-symptom-input-container');
        if (area && !area.contains(e.target)) setShowEditSymptomQuick(false);
      }
      if (filterMenuOpen) {
        const area = document.getElementById('filter-menu-container');
        if (area && !area.contains(e.target)) setFilterMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleQuickClose);
    return () => document.removeEventListener('mousedown', handleQuickClose);
  }, [showFoodQuick, showSymptomQuick, showEditFoodQuick, showEditSymptomQuick, filterMenuOpen]);

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
      const total = entries.filter(e => {
        const matchesSearch =
          (e.food && e.food.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (e.symptoms || []).some(s => s.txt.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (e.comment && e.comment.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesFilter =
          filterTags.length === 0 ||
          filterTags.includes(e.tagColor || TAG_COLORS.GREEN);
        return matchesSearch && matchesFilter;
      }).length;

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100) {
        setDisplayCount(dc => dc >= total ? dc : Math.min(dc + 20, total));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [entries, searchTerm, filterTags]);

  useEffect(() => {
    if (noteOpenIdx !== null) {
      const ta = document.getElementById(`note-textarea-${noteOpenIdx}`);
      if (ta) {
        ta.focus();
        ta.selectionStart = ta.selectionEnd = ta.value.length;
      }
    }
  }, [noteOpenIdx]);

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
      tagColor: determineTagColor(newForm.food.trim(), allSymptoms),
      tagColorManual: false,
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
    setShowEditFoodQuick(false);
    setShowEditSymptomQuick(false);
  };
  const cancelEdit = () => {
    setEditingIdx(null);
    setEditForm(null);
    setShowEditFoodQuick(false);
    setShowEditSymptomQuick(false);
  };

  const addEditSymptom = () => {
    if (!editForm || !editForm.symptomInput.trim()) return;
    const updated = sortSymptomsByTime([
      ...editForm.symptoms,
      {
        txt: editForm.symptomInput.trim(),
        time: editForm.symptomTime,
        strength: editForm.newSymptomStrength,
      },
    ]);
    setEditForm(fm => ({
      ...fm,
      symptoms: updated,
      symptomInput: "",
      symptomTime: 0,
      newSymptomStrength: 1,
    }));
    if (editingIdx !== null && !entries[editingIdx].tagColorManual) {
      const newColor = determineTagColor(editForm.food.trim(), updated);
      setEntries(prev => prev.map((e,i) => i === editingIdx ? { ...e, tagColor: newColor } : e));
    }
    setShowEditSymptomQuick(false);
  };
  const removeEditSymptom = idx => {
    setEditForm(fm => {
      const updated = fm.symptoms.filter((_, i) => i !== idx);
      if (editingIdx !== null && !entries[editingIdx].tagColorManual) {
        const newColor = determineTagColor(fm.food.trim(), updated);
        setEntries(prev => prev.map((e,i) => i === editingIdx ? { ...e, tagColor: newColor } : e));
      }
      return { ...fm, symptoms: updated };
    });
  };

  const toggleFavoriteFood = (food) => {
    setFavoriteFoods(favs => {
      const newSet = favs.includes(food) ? favs.filter(f => f !== food) : [...favs, food];
      return newSet.sort((a, b) => a.localeCompare(b));
    });
  };

  const toggleFavoriteSymptom = (sym) => {
    setFavoriteSymptoms(favs => {
      const newSet = favs.includes(sym) ? favs.filter(s => s !== sym) : [...favs, sym];
      return newSet.sort((a, b) => a.localeCompare(b));
    });
  };

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

    const manual = entries[editingIdx]?.tagColorManual;
    const newColor = manual
      ? entries[editingIdx].tagColor
      : determineTagColor(editForm.food.trim(), symptomsToSave);
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
                tagColor: newColor,
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
            i === entryIdx ? { ...entry, tagColor: newColor, tagColorManual: true } : entry
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
    .filter(({ entry }) => {
      const matchesSearch =
        (entry.food && entry.food.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (entry.symptoms || []).some(s => s.txt.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (entry.comment && entry.comment.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesFilter =
        filterTags.length === 0 ||
        filterTags.includes(entry.tagColor || TAG_COLORS.GREEN);
      return matchesSearch && matchesFilter;
    });

  const sortedFiltered = filteredWithIdx.slice().sort((a, b) =>
    sortMode === 'category'
      ? sortEntriesByCategory(a.entry, b.entry)
      : sortEntries(a.entry, b.entry)
  );
  const entriesToRenderForUiOrPdf = (isExportingPdf || isPrinting)
    ? sortedFiltered
    : sortedFiltered.slice(0, displayCount);

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
        TIME_CHOICES={TIME_CHOICES}
        sortSymptomsByTime={sortSymptomsByTime}
        SymTag={SymTag}
        ImgStack={ImgStack}
        CameraButton={CameraButton}
        styles={styles}
        favoriteFoods={favoriteFoods}
        favoriteSymptoms={favoriteSymptoms}
        showFoodQuick={showFoodQuick}
        setShowFoodQuick={setShowFoodQuick}
        showSymptomQuick={showSymptomQuick}
        setShowSymptomQuick={setShowSymptomQuick}
        QuickMenu={QuickMenu}
        filterTags={filterTags}
        setFilterTags={setFilterTags}
        filterMenuOpen={filterMenuOpen}
        setFilterMenuOpen={setFilterMenuOpen}
        FilterMenu={FilterMenu}
        TAG_COLORS={TAG_COLORS}
        TAG_COLOR_NAMES={TAG_COLOR_NAMES}
        sortMode={sortMode}
        setSortMode={setSortMode}
      />
      {/* Eintragsliste */}
      <div id="fd-table" style={{position:'relative'}}>
        <ConnectionLines
          connections={connections}
          styles={styles}
          handleConnectionClick={handleConnectionClick}
        />
        {dates.map(day => (
          <DayGroup
            key={day}
            day={day}
            entries={grouped[day]}
            collapsedDays={collapsedDays}
            toggleDay={toggleDay}
            dark={dark}
            isExportingPdf={isExportingPdf}
            isPrinting={isPrinting}
            entryRefs={entryRefs}
            entryCardProps={{
              isMobile,
              dark,
              isExportingPdf: isExportingPdf || isPrinting,
              isPrinting,
              editingIdx,
              editForm,
              setEditForm,
              startEdit,
              cancelEdit,
              saveEdit,
              deleteEntry,
              addEditSymptom,
              removeEditSymptom,
              handleEditFile,
              fileRefEdit,
              removeEditImg,
              handlePinClick,
              linkingInfo,
              colorPickerOpenForIdx,
              setColorPickerOpenForIdx,
              handleTagColorChange,
              noteOpenIdx,
              setNoteOpenIdx,
              toggleNote,
              noteDraft,
              setNoteDraft,
              saveNote,
              favoriteFoods,
              favoriteSymptoms,
              toggleFavoriteFood,
              toggleFavoriteSymptom,
              SYMPTOM_CHOICES,
              TIME_CHOICES,
              sortSymptomsByTime,
              TAG_COLORS,
              TAG_COLOR_NAMES,
              handleFocus,
              ImgStack,
              CameraButton,
              SymTag,
              styles,
              QuickMenu,
              showEditFoodQuick,
              setShowEditFoodQuick,
              showEditSymptomQuick,
              setShowEditSymptomQuick,
            }}
            styles={styles}
            TAG_COLORS={TAG_COLORS}
            dayMarkSpacing={DAY_MARK_SPACING}
            dayMarkSize={DAY_MARK_SIZE}
            dayMarkOffset={DAY_MARK_OFFSET}
            dayMarkTop={DAY_MARK_TOP}
          />
        ))}
      </div>
    </div>
  );
}
