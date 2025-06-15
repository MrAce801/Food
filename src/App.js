// --- IMPORTS ---
import React, { useState, useRef, useEffect } from "react";

import { exportTableToPdf } from "./utils/pdf";

import styles from "./styles";
import { SYMPTOM_CHOICES, TIME_CHOICES, TAG_COLORS, TAG_COLOR_NAMES, TAG_COLOR_ICONS } from "./constants";
import { resizeToJpeg, now, vibrate, getTodayDateString, parseDateString, toDateTimePickerFormat, fromDateTimePickerFormat, sortSymptomsByTime, determineTagColor } from "./utils";
import ExportButton from "./components/ExportButton";
import LanguageButton from "./components/LanguageButton";
import PersonButton from "./components/PersonButton";
import CameraButton from "./components/CameraButton";
import ImgStack from "./components/ImgStack";
import SymTag from "./components/SymTag";
import NewEntryForm from "./components/NewEntryForm";
import QuickMenu from "./components/QuickMenu";
import FilterMenu from "./components/FilterMenu";
import DayGroup from "./components/DayGroup";
import { LanguageContext } from './LanguageContext';
import useTranslation from './useTranslation';
import useNewEntryForm from "./hooks/useNewEntryForm";
import { sortEntries, sortEntriesByCategory } from "./utils";

// --- HAUPTANWENDUNGSKOMPONENTE: App ---
export default function App() {
  // --- STATE VARIABLEN ---
  const [dark, setDark] = useState(false);
  const [language, setLanguage] = useState(() => localStorage.getItem('fd-lang') || 'de');
  const t = useTranslation();
  const [entries, setEntries] = useState(() => {
    try {
      const initialArr = JSON.parse(localStorage.getItem("fd-entries") || "[]");
      const loadedEntries = initialArr
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
            portion: e.portion || { size: 'M', grams: null },
            linkId: typeof e.linkId === 'number'
              ? e.linkId
              : (e.linkId ? parseInt(e.linkId, 10) || null : null),
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
  const [editingIdx, setEditingIdx] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [noteOpenIdx, setNoteOpenIdx] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const fileRefEdit = useRef();
  const [toasts, setToasts] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);
  const [exportStatus, setExportStatus] = useState('idle'); // 'idle' | 'preparing' | 'ready'
  const pdfExportTriggered = useRef(false);
  const printTriggered = useRef(false);
  const isExporting = exportStatus !== 'idle';
  const [colorPickerOpenForIdx, setColorPickerOpenForIdx] = useState(null);
  const [collapsedDays, setCollapsedDays] = useState(new Set());
  const [linkingInfo, setLinkingInfo] = useState(null); // { baseIdx, id }
  const linkingInfoRef = useRef(null);
  const [linkChoice, setLinkChoice] = useState(null); // { idx, options, day }
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
  const [showEditFoodQuick, setShowEditFoodQuick] = useState(false);
  const [showEditSymptomQuick, setShowEditSymptomQuick] = useState(false);
  const [showEditPortionQuick, setShowEditPortionQuick] = useState(false);
  const [filterTags, setFilterTags] = useState([]);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [sortMode, setSortMode] = useState('date');

  const [showPerson, setShowPerson] = useState(false);
  const [personInfo, setPersonInfo] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem('fd-person-info')) || {
          age: '',
          gender: '',
          height: '',
          weight: '',
        }
      );
    } catch {
      return { age: '', gender: '', height: '', weight: '' };
    }
  });

  const dayOf = (entry) => entry.date.split(' ')[0];

  const entriesForDay = (currentEntries, day) =>
    currentEntries.filter(e => dayOf(e) === day);

  const getNextLinkId = (currentEntries, day) => {
    const used = new Set(
      entriesForDay(currentEntries, day)
        .map(e => e.linkId)
        .filter(id => id != null)
    );
    let id = 1;
    while (used.has(id)) id++;
    return id;
  };

  const getExistingIdsForDay = (currentEntries, day) => {
    const counts = {};
    entriesForDay(currentEntries, day).forEach(e => {
      if (e.linkId != null) counts[e.linkId] = (counts[e.linkId] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, c]) => c >= 2)
      .map(([id]) => Number(id))
      .sort((a, b) => a - b);
  };

  // keep ref in sync so event handlers see latest state immediately
  useEffect(() => {
    linkingInfoRef.current = linkingInfo;
  }, [linkingInfo]);

  useEffect(() => {
    const handleDocMouseDown = (e) => {
      if (linkingInfoRef.current !== null) {
        const targetEl = e.target instanceof Element ? e.target : e.target.parentElement;
        const pinClicked = targetEl && targetEl.closest('.entry-pin');
        if (!pinClicked) {
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
        addToast(t('Speicherlimit erreicht! Neue Einträge können evtl. nicht gespeichert werden.'));
      } else {
        console.error("Fehler beim Speichern der Einträge in localStorage:", e);
        addToast(t('Ein Fehler ist beim Speichern der Daten aufgetreten.'));
      }
    }
  }, [entries]);


  useEffect(() => {
    localStorage.setItem('fd-fav-foods', JSON.stringify(favoriteFoods));
  }, [favoriteFoods]);

  useEffect(() => {
    localStorage.setItem('fd-fav-symptoms', JSON.stringify(favoriteSymptoms));
  }, [favoriteSymptoms]);

  useEffect(() => {
    localStorage.setItem('fd-person-info', JSON.stringify(personInfo));
  }, [personInfo]);

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
    if (editingIdx !== null && !isExporting) {
      document.getElementById(`entry-card-${editingIdx}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [editingIdx, isExporting]);

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
      if (showEditFoodQuick) {
        const area = document.getElementById('edit-food-input-container');
        if (area && !area.contains(e.target)) setShowEditFoodQuick(false);
      }
      if (showEditSymptomQuick) {
        const area = document.getElementById('edit-symptom-input-container');
        if (area && !area.contains(e.target)) setShowEditSymptomQuick(false);
      }
      if (showEditPortionQuick) {
        const area = document.getElementById('portion-picker-container');
        if (area && !area.contains(e.target)) setShowEditPortionQuick(false);
      }
      if (filterMenuOpen) {
        const area = document.getElementById('filter-menu-container');
        if (area && !area.contains(e.target)) setFilterMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleQuickClose);
    return () => document.removeEventListener('mousedown', handleQuickClose);
  }, [showEditFoodQuick, showEditSymptomQuick, showEditPortionQuick, filterMenuOpen]);

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

  // When layout is ready, advance export status
  useEffect(() => {
    if (exportStatus === 'preparing') {
      setExportStatus('ready');
    }
  }, [exportStatus]);

  // Run export or print when ready
  useEffect(() => {
    if (exportStatus !== 'ready') return;

    const el = document.getElementById('fd-table');
    if (!el) {
      setExportStatus('idle');
      pdfExportTriggered.current = false;
      printTriggered.current = false;
      return;
    }

    const cleanup = () => {
      setExportStatus('idle');
      pdfExportTriggered.current = false;
      printTriggered.current = false;
      window.removeEventListener('afterprint', cleanup);
    };

    if (pdfExportTriggered.current) {
      exportTableToPdf(el)
        .then(ok => {
          addToast(ok ? t('PDF erfolgreich exportiert!') : t('Fehler beim PDF-Export.'));
        })
        .finally(cleanup);
    } else if (printTriggered.current) {
      window.addEventListener('afterprint', cleanup, { once: true });
      window.dispatchEvent(new Event('resize'));
      window.print();
    }
  }, [exportStatus]);

  // --- KERNLOGIK & EVENT HANDLER ---
  const handleFocus = e => e.target.scrollIntoView({ behavior: "smooth", block: "center" });

  const addToast = msg => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2000);
  };

  const {
    newForm,
    setNewForm,
    newSymptoms,
    addNewSymptom,
    removeNewSymptom,
    addEntry,
    handleNewFile,
    removeNewImg,
    fileRefNew,
    showFoodQuick,
    setShowFoodQuick,
    showSymptomQuick,
    setShowSymptomQuick,
    showPortionQuick,
    setShowPortionQuick
  } = useNewEntryForm(setEntries, addToast);

  const toggleDay = day => {
    setCollapsedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(day)) newSet.delete(day); else newSet.add(day);
      return newSet;
    });
  };

  const handleExportPDF = () => {
    if (exportStatus !== 'idle') return;
    pdfExportTriggered.current = true;
    printTriggered.current = false;
    setExportStatus('preparing');
    addToast(t('PDF Export wird vorbereitet...'));
  };

  const handlePrint = () => {
    if (exportStatus !== 'idle') return;
    printTriggered.current = true;
    pdfExportTriggered.current = false;
    setExportStatus('preparing');
  };

  const toggleLanguage = () => {
    setLanguage(lang => {
      const newLang = lang === 'de' ? 'en' : 'de';
      localStorage.setItem('fd-lang', newLang);
      return newLang;
    });
  };

  const handlePersonChange = (field, value) => {
    setPersonInfo(info => ({ ...info, [field]: value }));
  };

  const closePerson = () => setShowPerson(false);

  const handleEditFile = async e => {
    if (!editForm) return;
    for (let file of Array.from(e.target.files || [])) {
      try {
        if (file.size > 5 * 1024 * 1024) throw new Error("Datei zu groß (max 5MB)");
        const smallB64 = await resizeToJpeg(file, 800);
        setEditForm(fm => ({ ...fm, imgs: [...fm.imgs, smallB64] }));
        addToast(t('Foto hinzugefügt (verkleinert)'));
      } catch (err) {
        console.error("Fehler beim Hinzufügen des Bildes (Eintrag bearbeiten):", err);
        addToast(err.message || t('Ungültiges oder zu großes Bild'));
      }
    }
    if (e.target) e.target.value = "";
  };
  const removeEditImg = idx => {
    setEditForm(fm => ({ ...fm, imgs: fm.imgs.filter((_, i) => i !== idx) }));
    addToast(t('Foto gelöscht'));
  };

  // addEntry and symptom handlers provided by useNewEntryForm

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
        linkId: e.linkId || null,
        portion: e.portion || { size: 'M', grams: null }
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
    setShowEditPortionQuick(false);
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
    if (!displayDateToSave) { addToast(t('Ungültiges Datum/Zeit Format. Bitte prüfen.')); return; }

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
                portion: editForm.portion,
              }
            : ent
        )
        .sort(sortEntries)
    );
    cancelEdit();
    addToast(t('Eintrag aktualisiert'));
    vibrate(30);
  };
  const deleteEntry = i => {
    setEntries(e => e.filter((_, j) => j !== i));
    if (editingIdx === i) cancelEdit();
    setColorPickerOpenForIdx(null);
    setNoteOpenIdx(null);
    addToast(t('Eintrag gelöscht'));
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
    addToast(t('Notiz gespeichert'));
  };

  const handleTagColorChange = (entryIdx, newColor) => {
    setEntries(prevEntries =>
        prevEntries.map((entry, i) =>
            i === entryIdx ? { ...entry, tagColor: newColor, tagColorManual: true } : entry
        )
    );
    const colorName = TAG_COLOR_NAMES[newColor] || newColor;
    addToast(
      t('Markierung auf "{{color}}" geändert.').replace(
        '{{color}}',
        t(colorName)
      )
    );
    setColorPickerOpenForIdx(null);
  };

  const handlePortionChange = (entryIdx, portion) => {
    setEntries(prevEntries =>
      prevEntries.map((entry, i) =>
        i === entryIdx ? { ...entry, portion } : entry
      )
    );
    addToast(t('Portion geändert'));
    setShowEditPortionQuick(false);
  };

  const handlePinClick = (idx) => {
    const day = dayOf(entries[idx]);

    if (!linkingInfoRef.current) {
      const currentId = entries[idx].linkId;
      if (currentId) {
        if (window.confirm(t('Verknüpfung entfernen?'))) {
          const count = entries.filter(
            e => e.linkId === currentId && dayOf(e) === day
          ).length;
          setEntries(prev =>
            prev
              .map((e, i) => {
                if (dayOf(e) === day && e.linkId === currentId) {
                  if (count === 2) {
                    return { ...e, linkId: null };
                  }
                  if (i === idx) {
                    return { ...e, linkId: null };
                  }
                }
                return e;
              })
              .sort(sortEntries)
          );
        }
      } else {
        const existing = getExistingIdsForDay(entries, day);
        if (existing.length === 0) {
          const newId = getNextLinkId(entries, day);
          setEntries(prev => prev.map((e,i) =>
            dayOf(e) === day && i === idx ? { ...e, linkId: newId } : e
          ));
          linkingInfoRef.current = { baseIdx: idx, id: newId };
          setLinkingInfo(linkingInfoRef.current);
        } else {
          setLinkChoice({ idx, options: existing, day });
        }
      }
    } else {
      if (idx === linkingInfoRef.current.baseIdx) {
        cancelLinking();
        return;
      }
      const baseGroupId = linkingInfoRef.current.id;
      const targetGroupId = entries[idx].linkId;
      const baseDay = dayOf(entries[linkingInfoRef.current.baseIdx]);
      if (day !== baseDay) {
        cancelLinking();
        return;
      }
      if (linkingInfoRef.current.baseIdx === null && targetGroupId === baseGroupId) {
        cancelLinking();
        return;
      }
      if (targetGroupId) {
        setEntries(prev => prev.map(e => e.linkId === baseGroupId ? { ...e, linkId: targetGroupId } : e));
      } else {
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

  const chooseLink = (choice) => {
    if (!linkChoice) return;
    const { idx, options, day } = linkChoice;
    if (choice === null) {
      setLinkChoice(null);
      return;
    }
    if (choice === 'new') {
      const newId = getNextLinkId(entries, day);
      setEntries(prev => prev.map((e,i) =>
        i === idx && dayOf(e) === day ? { ...e, linkId: newId } : e
      ));
      linkingInfoRef.current = { baseIdx: idx, id: newId };
      setLinkingInfo(linkingInfoRef.current);
    } else {
      const id = choice;
      if (options.includes(id)) {
        setEntries(prev => prev.map((e,i) =>
          i === idx && dayOf(e) === day ? { ...e, linkId: id } : e
        ));
      }
    }
    setLinkChoice(null);
  };

  const handleRootMouseDown = (e) => {
    if (linkingInfoRef.current !== null) {
      const targetEl = e.target instanceof Element ? e.target : e.target.parentElement;
      const pinClicked = targetEl && targetEl.closest('.entry-pin');
      if (!pinClicked) {
        cancelLinking();
      }
    }
    if (linkChoice) {
      const targetEl = e.target instanceof Element ? e.target : e.target.parentElement;
      const chooser = targetEl && targetEl.closest('.link-chooser');
      if (!chooser) setLinkChoice(null);
    }
  };

  const handleContainerClick = (e) => {
      const targetEl = e.target instanceof Element ? e.target : e.target.parentElement;

      if (linkingInfoRef.current !== null) {
          const pinClicked = targetEl && targetEl.closest('.entry-pin');
          if (!pinClicked) {
              cancelLinking();
              return;
          }
      }

      if (linkChoice) {
          const chooser = targetEl && targetEl.closest('.link-chooser');
          if (!chooser) {
              setLinkChoice(null);
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
  const entriesToRenderForUiOrPdf = isExporting
    ? sortedFiltered
    : sortedFiltered.slice(0, displayCount);

  const perDay = entriesToRenderForUiOrPdf.reduce((acc, { entry, idx }) => {
    const day = entry.date.split(' ')[0];
    if (!acc[day]) acc[day] = { all: [], groups: {} };
    acc[day].all.push({ entry, idx });
    if (entry.linkId) {
      (acc[day].groups[entry.linkId] = acc[day].groups[entry.linkId] || []).push({ entry, idx });
    }
    return acc;
  }, {});

  const grouped = Object.fromEntries(
    Object.entries(perDay).map(([day, { all, groups }]) => {
      const multiIds = new Set(
        Object.keys(groups)
          .filter(id => groups[id].length >= 2)
          .map(id => Number(id))
      );

      const added = new Set();
      const list = [];

      for (const item of all) {
        const id = item.entry.linkId;
        if (id && multiIds.has(id)) {
          if (!added.has(id)) {
            list.push(...groups[id]);
            added.add(id);
          }
        } else {
          list.push(item);
        }
      }

      return [day, { list, groups }];
    })
  );

  const dates = Object.keys(grouped)
    .sort((a,b) => parseDateString(grouped[b].list[0].entry.date) - parseDateString(grouped[a].list[0].entry.date));



  // --- JSX RENDERING LOGIK ---

  return (
    <LanguageContext.Provider value={language}>
    <div ref={containerRef} style={styles.container(isMobile)} onMouseDownCapture={handleRootMouseDown} onClick={handleContainerClick}>
      {toasts.map(t => <div key={t.id} className="toast-fade" style={styles.toast}>{t.msg}</div>)}
      <div style={styles.topBar} className="top-bar">
        <button onClick={() => setDark(d => !d)} style={{ ...styles.buttonSecondary("transparent"), fontSize: 24, color: dark ? '#f0f0f8' : '#111' }} title={t('Theme wechseln')}>
          {dark ? "🌙" : "☀️"}
        </button>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <PersonButton onClick={() => setShowPerson(true)} dark={dark} />
          <ExportButton onExportPdf={handleExportPDF} onPrint={handlePrint} dark={dark} />
          <LanguageButton toggle={toggleLanguage} dark={dark} />
        </div>
      </div>
      <h2 style={styles.title}>{t('Food Diary')}</h2>

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
        showPortionQuick={showPortionQuick}
        setShowPortionQuick={setShowPortionQuick}
        QuickMenu={QuickMenu}
        filterTags={filterTags}
        setFilterTags={setFilterTags}
        filterMenuOpen={filterMenuOpen}
        setFilterMenuOpen={setFilterMenuOpen}
        FilterMenu={FilterMenu}
        TAG_COLORS={TAG_COLORS}
        TAG_COLOR_NAMES={TAG_COLOR_NAMES}
        TAG_COLOR_ICONS={TAG_COLOR_ICONS}
        sortMode={sortMode}
        setSortMode={setSortMode}
      />
      {/* Eintragsliste */}
      <div
        id="fd-table"
        style={{
          position: 'relative',
          width: '100%',
        }}
      >
        {isExporting && (
          <div style={styles.personInfoBox(dark)}>
            {personInfo.age && <span>Alter: {personInfo.age}</span>}
            {personInfo.gender && <span>Geschlecht: {personInfo.gender}</span>}
            {personInfo.height && <span>Größe: {personInfo.height} cm</span>}
            {personInfo.weight && <span>Gewicht: {personInfo.weight} kg</span>}
          </div>
        )}
        {dates.map(day => (
          <DayGroup
            key={day}
            day={day}
            entries={grouped[day].list}
            groups={grouped[day].groups}
            collapsedDays={collapsedDays}
            toggleDay={toggleDay}
            dark={dark}
            isExportingPdf={isExporting}
            isPrinting={isExporting}
            entryRefs={entryRefs}
            entryCardProps={{
              isMobile,
              dark,
              isExportingPdf: isExporting,
              isPrinting: isExporting,
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
              handlePortionChange,
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
              TAG_COLOR_ICONS,
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
              showEditPortionQuick,
              setShowEditPortionQuick,
            }}
            styles={styles}
            TAG_COLORS={TAG_COLORS}
            TAG_COLOR_ICONS={TAG_COLOR_ICONS}
            language={language}
          />
        ))}
      </div>
      {linkChoice && (
        <div
          className="link-chooser"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setLinkChoice(null)}
        >
          <div
            style={{ background: dark ? '#333' : '#fff', padding: 24, borderRadius: 8, minWidth: 200 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ marginBottom: 8 }}>{t('Link-ID wählen')}</div>
            {linkChoice.options.map(id => (
              <button key={id} style={{ margin: 6, padding: '6px 12px', fontSize: 16 }} onClick={() => chooseLink(id)}>
                {id}
              </button>
            ))}
            <button style={{ margin: 6, padding: '6px 12px', fontSize: 16 }} onClick={() => chooseLink('new')}>
              {t('Neu')}
            </button>
            <button style={{ margin: 6, padding: '6px 12px', fontSize: 16 }} onClick={() => chooseLink(null)}>
              {t('Abbrechen')}
            </button>
          </div>
        </div>
      )}
      {showPerson && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={closePerson}
        >
          <div
            style={{ background: dark ? '#333' : '#fff', padding: 24, borderRadius: 8, minWidth: 250 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ marginBottom: 8 }}>{t('Persönliche Daten')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                placeholder={t('Alter')}
                value={personInfo.age}
                onChange={e => handlePersonChange('age', e.target.value)}
                style={styles.input}
              />
              <input
                placeholder={t('Geschlecht')}
                value={personInfo.gender}
                onChange={e => handlePersonChange('gender', e.target.value)}
                style={styles.input}
              />
              <input
                placeholder={t('Größe (cm)')}
                value={personInfo.height}
                onChange={e => handlePersonChange('height', e.target.value)}
                style={styles.input}
              />
              <input
                placeholder={t('Gewicht (kg)')}
                value={personInfo.weight}
                onChange={e => handlePersonChange('weight', e.target.value)}
                style={styles.input}
              />
              <button
                onClick={closePerson}
                style={{ ...styles.buttonSecondary('#1976d2'), marginTop: 8 }}
              >
                {t('Schließen')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </LanguageContext.Provider>
  );
}
