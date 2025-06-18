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
import { useEntriesContext } from './context/EntriesContext';

// --- HAUPTANWENDUNGSKOMPONENTE: App ---
export default function App() {
  // --- STATE VARIABLEN ---
  const [dark, setDark] = useState(false);
  const [language, setLanguage] = useState(() => localStorage.getItem('fd-lang') || 'de');
  const t = useTranslation();
  const {
    entries,
    setEntries,
    linkingInfo,
    linkChoice,
    linkingInfoRef,
    setLinkChoice,
    saveEdit,
    deleteEntry,
    saveNote,
    handleTagColorChange,
    handlePortionChange,
    handlePinClick,
    cancelLinking,
    chooseLink
  } = useEntriesContext();
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
  const [showEditPortionQuickIdx, setShowEditPortionQuickIdx] = useState(null);
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

  const [blurCategories, setBlurCategories] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('fd-blur-cats'));
      if (Array.isArray(saved)) return saved;
    } catch {}
    return [TAG_COLORS.BROWN];
  });

  const toggleBlurCategory = cat => {
    setBlurCategories(prev => {
      const updated = prev.includes(cat)
        ? prev.filter(c => c !== cat)
        : [...prev, cat];
      localStorage.setItem('fd-blur-cats', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    try {
      localStorage.setItem('fd-blur-cats', JSON.stringify(blurCategories));
    } catch {}
  }, [blurCategories]);


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
      if (showEditPortionQuickIdx !== null) {
        const area = document.getElementById('portion-picker-container');
        if (area && !area.contains(e.target)) setShowEditPortionQuickIdx(null);
      }
      if (filterMenuOpen) {
        const area = document.getElementById('filter-menu-container');
        if (area && !area.contains(e.target)) setFilterMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleQuickClose);
    return () => document.removeEventListener('mousedown', handleQuickClose);
  }, [showEditFoodQuick, showEditSymptomQuick, showEditPortionQuickIdx, filterMenuOpen]);

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
        portion: e.portion || { size: null, grams: null }
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
    setShowEditPortionQuickIdx(null);
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

  const toggleFavoriteFood = food => {
    setFavoriteFoods(favs => {
      const exists = favs.includes(food);
      const newSet = exists ? favs.filter(f => f !== food) : [...favs, food];
      addToast(t(exists ? 'Aus Favoriten entfernt' : 'Zu Favoriten hinzugefügt'));
      return newSet.sort((a, b) => a.localeCompare(b));
    });
  };

  const toggleFavoriteSymptom = sym => {
    setFavoriteSymptoms(favs => {
      const exists = favs.includes(sym);
      const newSet = exists ? favs.filter(s => s !== sym) : [...favs, sym];
      addToast(t(exists ? 'Aus Favoriten entfernt' : 'Zu Favoriten hinzugefügt'));
      return newSet.sort((a, b) => a.localeCompare(b));
    });
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
            isMobile={isMobile}
            dark={dark}
            isExportingPdf={isExporting}
            isPrinting={isExporting}
            editingIdx={editingIdx}
            editForm={editForm}
            setEditForm={setEditForm}
            startEdit={startEdit}
            cancelEdit={cancelEdit}
            addEditSymptom={addEditSymptom}
            removeEditSymptom={removeEditSymptom}
            handleEditFile={handleEditFile}
            fileRefEdit={fileRefEdit}
            removeEditImg={removeEditImg}
            colorPickerOpenForIdx={colorPickerOpenForIdx}
            setColorPickerOpenForIdx={setColorPickerOpenForIdx}
            noteOpenIdx={noteOpenIdx}
            setNoteOpenIdx={setNoteOpenIdx}
            toggleNote={toggleNote}
            noteDraft={noteDraft}
            setNoteDraft={setNoteDraft}
            favoriteFoods={favoriteFoods}
            favoriteSymptoms={favoriteSymptoms}
            toggleFavoriteFood={toggleFavoriteFood}
            toggleFavoriteSymptom={toggleFavoriteSymptom}
            SYMPTOM_CHOICES={SYMPTOM_CHOICES}
            TIME_CHOICES={TIME_CHOICES}
            sortSymptomsByTime={sortSymptomsByTime}
            TAG_COLORS={TAG_COLORS}
            TAG_COLOR_NAMES={TAG_COLOR_NAMES}
            TAG_COLOR_ICONS={TAG_COLOR_ICONS}
            handleFocus={handleFocus}
            ImgStack={ImgStack}
            CameraButton={CameraButton}
            SymTag={SymTag}
            styles={styles}
            QuickMenu={QuickMenu}
            showEditFoodQuick={showEditFoodQuick}
            setShowEditFoodQuick={setShowEditFoodQuick}
            showEditSymptomQuick={showEditSymptomQuick}
            setShowEditSymptomQuick={setShowEditSymptomQuick}
            showEditPortionQuickIdx={showEditPortionQuickIdx}
            setShowEditPortionQuickIdx={setShowEditPortionQuickIdx}
            blurCategories={blurCategories}
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
              <div style={{ marginTop: 8, fontWeight: 600 }}>{t('Blur')}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[TAG_COLORS.GREEN, TAG_COLORS.PURPLE, TAG_COLORS.RED, TAG_COLORS.BLUE, TAG_COLORS.BROWN, TAG_COLORS.YELLOW, TAG_COLORS.GRAY].map(colorValue => (
                  <button
                    key={colorValue}
                    onClick={() => toggleBlurCategory(colorValue)}
                    style={styles.categoryButton(colorValue, blurCategories.includes(colorValue), dark)}
                    title={t(TAG_COLOR_NAMES[colorValue] || colorValue)}
                  >
                    {TAG_COLOR_ICONS[colorValue]}
                  </button>
                ))}
              </div>
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
