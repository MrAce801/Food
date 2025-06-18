import { useState, useEffect, useRef } from 'react';
import useTranslation from '../useTranslation';
import { TAG_COLORS, TAG_COLOR_NAMES } from '../constants';
import { fromDateTimePickerFormat, sortSymptomsByTime, determineTagColor, sortEntries, parseDateString } from '../utils';
import { vibrate } from '../utils';

export default function useEntries(addToast) {
  const t = useTranslation();

  const [entries, setEntries] = useState(() => {
    try {
      const initialArr = JSON.parse(localStorage.getItem('fd-entries') || '[]');
      const loadedEntries = initialArr.map((e, i) => {
        const symptoms = (e.symptoms || []).map(s => ({
          ...s,
          strength: Math.min(parseInt(s.strength) || 1, 3),
        }));
        const base = {
          ...e,
          comment: e.comment || '',
          food: e.food || '',
          symptoms,
          tagColor: e.tagColor || TAG_COLORS.GREEN,
          tagColorManual: e.tagColorManual || false,
          portion: e.portion || { size: null, grams: null },
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
    } catch {
      return [];
    }
  });

  const [linkingInfo, setLinkingInfo] = useState(null); // { baseIdx, id }
  const linkingInfoRef = useRef(null);
  const [linkChoice, setLinkChoice] = useState(null); // { idx, options, day }

  useEffect(() => {
    linkingInfoRef.current = linkingInfo;
  }, [linkingInfo]);

  useEffect(() => {
    try {
      localStorage.setItem('fd-entries', JSON.stringify(entries));
    } catch (e) {
      if (e.name === 'QuotaExceededError' ||
          e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
          (e.code && (e.code === 22 || e.code === 1014))) {
        console.error('LocalStorage Quota Exceeded:', e);
        addToast && addToast(t('Speicherlimit erreicht! Neue Einträge können evtl. nicht gespeichert werden.'));
      } else {
        console.error('Fehler beim Speichern der Einträge in localStorage:', e);
        addToast && addToast(t('Ein Fehler ist beim Speichern der Daten aufgetreten.'));
      }
    }
  }, [entries, addToast, t]);

  const dayOf = entry => entry.date.split(' ')[0];

  const entriesForDay = (current, day) =>
    current.filter(e => dayOf(e) === day);

  const getNextLinkId = (current, day) => {
    const used = new Set(
      entriesForDay(current, day)
        .map(e => e.linkId)
        .filter(id => id != null)
    );
    let id = 1;
    while (used.has(id)) id++;
    return id;
  };

  const getExistingIdsForDay = (current, day) => {
    const counts = {};
    entriesForDay(current, day).forEach(e => {
      if (e.linkId != null) counts[e.linkId] = (counts[e.linkId] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, c]) => c >= 2)
      .map(([id]) => Number(id))
      .sort((a, b) => a - b);
  };

  const saveEdit = (editingIdx, editForm) => {
    if (!editForm) return;
    const displayDateToSave = fromDateTimePickerFormat(editForm.date);
    if (!displayDateToSave) {
      addToast && addToast(t('Ungültiges Datum/Zeit Format. Bitte prüfen.'));
      return;
    }

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
    addToast && addToast(t('Eintrag aktualisiert'));
    vibrate(30);
  };

  const deleteEntry = (i) => {
    setEntries(e => e.filter((_, j) => j !== i));
    addToast && addToast(t('Eintrag gelöscht'));
    vibrate(100);
  };

  const saveNote = (idx, text) => {
    setEntries(e => e.map((ent, j) => j === idx ? { ...ent, comment: text } : ent));
    addToast && addToast(t('Notiz gespeichert'));
  };

  const handleTagColorChange = (entryIdx, newColor) => {
    setEntries(prevEntries =>
      prevEntries.map((entry, i) =>
        i === entryIdx ? { ...entry, tagColor: newColor, tagColorManual: true } : entry
      )
    );
    const colorName = TAG_COLOR_NAMES[newColor] || newColor;
    addToast && addToast(
      t('Markierung auf "{{color}}" geändert.').replace(
        '{{color}}',
        t(colorName)
      )
    );
  };

  const handlePortionChange = (entryIdx, portion) => {
    setEntries(prevEntries =>
      prevEntries.map((entry, i) =>
        i === entryIdx ? { ...entry, portion } : entry
      )
    );
    addToast && addToast(t('Portion geändert'));
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
    if (linkingInfoRef.current) {
      const { baseIdx, id } = linkingInfoRef.current;
      if (baseIdx !== null) {
        setEntries(prev => prev.map(e => (e.linkId === id ? { ...e, linkId: null } : e)));
      }
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

  return {
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
  };
}
