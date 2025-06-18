import { useState, useRef } from 'react';
import { resizeToJpeg, sortSymptomsByTime, determineTagColor, fromDateTimePickerFormat, toDateTimePickerFormat, vibrate, sortEntries } from '../utils';
import { TAG_COLOR_NAMES, SYMPTOM_CHOICES } from '../constants';
import useTranslation from '../useTranslation';

export default function useEntryEditing(entries, setEntries, addToast) {
  const t = useTranslation();

  const [editingIdx, setEditingIdx] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [noteOpenIdx, setNoteOpenIdx] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');
  const fileRefEdit = useRef();
  const [colorPickerOpenForIdx, setColorPickerOpenForIdx] = useState(null);
  const [showEditFoodQuick, setShowEditFoodQuick] = useState(false);
  const [showEditSymptomQuick, setShowEditSymptomQuick] = useState(false);
  const [showEditPortionQuickIdx, setShowEditPortionQuickIdx] = useState(null);
  const [favoriteFoods, setFavoriteFoods] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fd-fav-foods') || '[]').sort((a,b) => a.localeCompare(b));
    } catch { return []; }
  });
  const [favoriteSymptoms, setFavoriteSymptoms] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('fd-fav-symptoms'));
      const arr =
        stored && Array.isArray(stored) && stored.length > 0
          ? stored
          : SYMPTOM_CHOICES.slice();
      return arr.sort((a,b) => a.localeCompare(b));
    } catch {
      return SYMPTOM_CHOICES.slice().sort((a,b) => a.localeCompare(b));
    }
  });

  const handleEditFile = async e => {
    if (!editForm) return;
    for (let file of Array.from(e.target.files || [])) {
      try {
        if (file.size > 5 * 1024 * 1024) throw new Error('Datei zu groß (max 5MB)');
        const smallB64 = await resizeToJpeg(file, 800);
        setEditForm(fm => ({ ...fm, imgs: [...fm.imgs, smallB64] }));
        addToast(t('Foto hinzugefügt (verkleinert)'));
      } catch (err) {
        console.error('Fehler beim Hinzufügen des Bildes (Eintrag bearbeiten):', err);
        addToast(err.message || t('Ungültiges oder zu großes Bild'));
      }
    }
    if (e.target) e.target.value = '';
  };

  const removeEditImg = idx => {
    setEditForm(fm => ({ ...fm, imgs: fm.imgs.filter((_, i) => i !== idx) }));
    addToast(t('Foto gelöscht'));
  };

  const startEdit = i => {
    const e = entries[i];
    setEditingIdx(i);
    setEditForm({
      food: e.food,
      imgs: [...e.imgs],
      symptoms: (e.symptoms || []).map(s => ({ ...s, strength: Math.min(parseInt(s.strength) || 1, 3) })),
      symptomInput: '',
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
      { txt: editForm.symptomInput.trim(), time: editForm.symptomTime, strength: editForm.newSymptomStrength },
    ]);
    setEditForm(fm => ({ ...fm, symptoms: updated, symptomInput: '', symptomTime: 0, newSymptomStrength: 1 }));
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
      return newSet.sort((a,b) => a.localeCompare(b));
    });
  };

  const toggleFavoriteSymptom = sym => {
    setFavoriteSymptoms(favs => {
      const exists = favs.includes(sym);
      const newSet = exists ? favs.filter(s => s !== sym) : [...favs, sym];
      addToast(t(exists ? 'Aus Favoriten entfernt' : 'Zu Favoriten hinzugefügt'));
      return newSet.sort((a,b) => a.localeCompare(b));
    });
  };

  const saveEdit = () => {
    if (!editForm) return;
    const displayDateToSave = fromDateTimePickerFormat(editForm.date);
    if (!displayDateToSave) { addToast(t('Ungültiges Datum/Zeit Format. Bitte prüfen.')); return; }

    const pendingSymptom = editForm.symptomInput.trim()
      ? { txt: editForm.symptomInput.trim(), time: editForm.symptomTime, strength: editForm.newSymptomStrength }
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
        setNoteDraft(entries[idx].comment || '');
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
    setShowEditPortionQuickIdx(null);
  };

  return {
    editingIdx,
    editForm,
    setEditForm,
    noteOpenIdx,
    noteDraft,
    fileRefEdit,
    colorPickerOpenForIdx,
    showEditFoodQuick,
    showEditSymptomQuick,
    showEditPortionQuickIdx,
    favoriteFoods,
    favoriteSymptoms,
    setNoteDraft,
    setColorPickerOpenForIdx,
    setShowEditFoodQuick,
    setShowEditSymptomQuick,
    setShowEditPortionQuickIdx,
    startEdit,
    cancelEdit,
    addEditSymptom,
    removeEditSymptom,
    saveEdit,
    deleteEntry,
    handleEditFile,
    removeEditImg,
    toggleNote,
    saveNote,
    handleTagColorChange,
    handlePortionChange,
    toggleFavoriteFood,
    toggleFavoriteSymptom,
  };
}
