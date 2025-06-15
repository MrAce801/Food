import { useState, useRef, useEffect } from 'react';
import { resizeToJpeg, now, vibrate, determineTagColor, sortSymptomsByTime, sortEntries } from '../utils';
import useTranslation from '../useTranslation';
import { TAG_COLORS } from '../constants';

export default function useNewEntryForm(setEntries, addToast) {
  const t = useTranslation();
  const [newForm, setNewForm] = useState(() => {
    const saved = localStorage.getItem('fd-form-new');
    const initialForm = { food: '', imgs: [], symptomInput: '', symptomTime: 0, symptomStrength: 1, tagColor: TAG_COLORS.GREEN, tagColorManual: false, portion: { size: 'M', grams: null } };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const strength = Math.min(parseInt(parsed.symptomStrength) || 1, 3);
        return {
          ...initialForm,
          ...parsed,
          symptomStrength: strength,
          tagColor: parsed.tagColor || TAG_COLORS.GREEN,
          tagColorManual: parsed.tagColorManual || false,
          portion: parsed.portion || { size: 'M', grams: null },
        };
      } catch {
        return initialForm;
      }
    }
    return initialForm;
  });

  const [newSymptoms, setNewSymptoms] = useState([]);
  const fileRefNew = useRef();
  const [showFoodQuick, setShowFoodQuick] = useState(false);
  const [showSymptomQuick, setShowSymptomQuick] = useState(false);
  const [showPortionQuick, setShowPortionQuick] = useState(false);

  useEffect(() => {
    localStorage.setItem('fd-form-new', JSON.stringify(newForm));
  }, [newForm]);

  const handleNewFile = async e => {
    for (let file of Array.from(e.target.files || [])) {
      try {
        if (file.size > 5 * 1024 * 1024) throw new Error('Datei zu groß (max 5MB)');
        const smallB64 = await resizeToJpeg(file, 800);
        setNewForm(fm => ({ ...fm, imgs: [...fm.imgs, smallB64] }));
        addToast('Foto hinzugefügt (verkleinert)');
      } catch (err) {
        console.error('Fehler beim Hinzufügen des Bildes (neuer Eintrag):', err);
        addToast(err.message || 'Ungültiges oder zu großes Bild');
      }
    }
    if (e.target) e.target.value = '';
  };

  const removeNewImg = idx => {
    setNewForm(fm => ({ ...fm, imgs: fm.imgs.filter((_, i) => i !== idx) }));
    addToast('Foto gelöscht');
  };

  const addNewSymptom = () => {
    if (!newForm.symptomInput.trim()) return;
    setNewSymptoms(s => sortSymptomsByTime([
      ...s,
      { txt: newForm.symptomInput.trim(), time: newForm.symptomTime, strength: newForm.symptomStrength }
    ]));
    setNewForm(fm => ({ ...fm, symptomInput: '', symptomTime: 0, symptomStrength: 1 }));
    vibrate(20);
  };

  const removeNewSymptom = idx => setNewSymptoms(s => s.filter((_, i) => i !== idx));

  const addEntry = () => {
    const pendingSymptom = newForm.symptomInput.trim()
      ? { txt: newForm.symptomInput.trim(), time: newForm.symptomTime, strength: newForm.symptomStrength }
      : null;
    const allSymptoms = sortSymptomsByTime([
      ...newSymptoms,
      ...(pendingSymptom ? [pendingSymptom] : [])
    ]);
    if (!newForm.food.trim() && allSymptoms.length === 0) return;
    const autoColor = determineTagColor(newForm.food.trim(), allSymptoms);
    const entry = {
      food: newForm.food.trim(),
      imgs: newForm.imgs,
      symptoms: allSymptoms,
      comment: '',
      date: now(),
      tagColor: newForm.tagColorManual ? newForm.tagColor : autoColor,
      tagColorManual: newForm.tagColorManual,
      linkId: null,
      createdAt: Date.now(),
      portion: newForm.portion,
    };
    setEntries(prev => [...prev, entry].sort(sortEntries));
    setNewForm({ food: '', imgs: [], symptomInput: '', symptomTime: 0, symptomStrength: 1, tagColor: TAG_COLORS.GREEN, tagColorManual: false, portion: { size: 'M', grams: null } });
    setNewSymptoms([]);
    addToast(t('Eintrag gespeichert'));
    vibrate(50);
  };

  return {
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
  };
}
