import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import useTranslation from '../useTranslation';
import { PORTION_COLORS } from '../constants';

export default function EntryCard({
  entry,
  idx,
  refCallback,
  dark,
  isMobile,
  isExportingPdf,
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
  showEditPortionQuickIdx,
  setShowEditPortionQuickIdx,
  marginBottom = 16
}) {
  const t = useTranslation();
  const [quickGrams, setQuickGrams] = useState(
    entry.portion?.size === 'custom' ? entry.portion.grams || '' : ''
  );
  const [showDateInput, setShowDateInput] = useState(false);
  const dateInputRef = useRef(null);
  const lastFoodTapRef = useRef(0);
  const lastSymptomInputTapRef = useRef(0);
  const lastSymptomTapRefs = useRef({});
  const cardRef = useRef(null);
  const firstRowRef = useRef(null);
  const [iconTop, setIconTop] = useState(36);
  const DOUBLE_TAP_MS = 350;
  useEffect(() => {
    setQuickGrams(
      entry.portion?.size === 'custom' ? entry.portion.grams || '' : ''
    );
  }, [entry.portion]);
  useEffect(() => {
    if (showDateInput) {
      const input = dateInputRef.current;
      input?.focus();
      input?.showPicker?.();
    }
  }, [showDateInput]);
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
  const currentPortion =
    editingIdx === idx && editForm
      ? editForm.portion || { size: null, grams: null }
      : entry.portion || { size: null, grams: null };
  const portionDisplay =
    currentPortion.size === 'custom'
      ? `${currentPortion.grams || ''}g`
      : currentPortion.size;
  const showPortion =
    [TAG_COLORS.GREEN, TAG_COLORS.RED].includes(entry.tagColor || TAG_COLORS.GREEN) &&
    (editingIdx === idx || (entry.portion && entry.portion.size));

  useLayoutEffect(() => {
    const update = () => {
      if (editingIdx === idx) return;
      const cardEl = cardRef.current;
      const rowEl = firstRowRef.current;
      if (cardEl && rowEl) {
        const cardRect = cardEl.getBoundingClientRect();
        const rowRect = rowEl.getBoundingClientRect();
        setIconTop(rowRect.top - cardRect.top + rowRect.height / 2);
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [editingIdx, entry.date, entry.food]);

  const handleFoodTap = e => {
    const now = Date.now();
    if (now - lastFoodTapRef.current < DOUBLE_TAP_MS) {
      toggleFavoriteFood(editForm.food.trim());
      e.target.blur();
      e.preventDefault();
    }
    lastFoodTapRef.current = now;
  };

  const handleNewSymptomTap = e => {
    const now = Date.now();
    if (now - lastSymptomInputTapRef.current < DOUBLE_TAP_MS) {
      toggleFavoriteSymptom(editForm.symptomInput.trim());
      e.target.blur();
      e.preventDefault();
    }
    lastSymptomInputTapRef.current = now;
  };

  const handleSymptomTap = (e, j, text) => {
    const now = Date.now();
    if (now - (lastSymptomTapRefs.current[j] || 0) < DOUBLE_TAP_MS) {
      toggleFavoriteSymptom(text.trim());
      e.target.blur();
      e.preventDefault();
    }
    lastSymptomTapRefs.current[j] = now;
  };

  return (
    <div
      ref={el => {
        cardRef.current = el;
        refCallback(el);
      }}
      id={`entry-card-${idx}`}
      style={{ ...styles.entryCard(dark, isSymptomOnlyEntry), marginBottom }}
      onClick={e => {
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
          onClick={e => {
            e.stopPropagation();
            handlePinClick(idx);
          }}
          style={styles.pin(linkingInfo && linkingInfo.baseIdx === idx)}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            <g transform="rotate(45 8 8)">
              <ellipse cx="5" cy="8" rx="4" ry="2.5" stroke={entry.linkId || (linkingInfo && linkingInfo.baseIdx === idx) ? '#FBC02D' : '#6EC1FF'} strokeWidth="2" fill="none" />
              <ellipse cx="11" cy="8" rx="4" ry="2.5" stroke={entry.linkId || (linkingInfo && linkingInfo.baseIdx === idx) ? '#FBC02D' : '#B8E0FF'} strokeWidth="2" fill="none" />
            </g>
          </svg>
        </div>
      </div>
      {showPortion && (
        <div style={styles.portionContainer(editingIdx === idx, `${iconTop}px`)}>
          {editingIdx === idx && !isExportingPdf && (
            <>
              <button
                id={`note-icon-button-${idx}`}
                onClick={e => {
                  e.stopPropagation();
                  toggleNote(idx);
                }}
                style={{ ...styles.glassyIconButton(dark), width: 40, height: 40 }}
                title={t('Notiz')}
              >
                🗒️
              </button>
              <CameraButton onClick={() => fileRefEdit.current?.click()} dark={dark} />
            </>
          )}
          <button
            id={`portion-label-${idx}`}
            style={{
              ...(editingIdx === idx ? styles.glassyIconButton(dark) : styles.plainIconButton),
              ...styles.portionLabel(
                currentPortion.size === 'custom' ? 'M' : currentPortion.size
              ),
              width: 40,
              height: 40,
            }}
            onClick={e => {
              if (isExportingPdf) return;
              e.stopPropagation();
              setQuickGrams(
                entry.portion?.size === 'custom' ? entry.portion.grams || '' : ''
              );
              setShowEditPortionQuickIdx(prev => (prev === idx ? null : idx));
            }}
            title={t('Portion wählen')}
          >
            {portionDisplay || '📏'}
          </button>
          {!isExportingPdf && showEditPortionQuickIdx === idx && (
            <div
              id="portion-picker-container"
              style={styles.portionPickerPopup(dark, true)}
              onClick={e => e.stopPropagation()}
            >
              {['S','M','L'].map(size => (
                <div
                  key={size}
                  style={styles.portionPickerItem(
                    PORTION_COLORS[size],
                    (editingIdx === idx ? editForm.portion : entry.portion || { size: null }).size === size,
                    dark
                  )}
                  onClick={() => {
                    if (editingIdx === idx) {
                      setEditForm(fm => ({ ...fm, portion: { size, grams: null } }));
                    } else {
                      handlePortionChange(idx, { size, grams: null });
                    }
                  }}
                >
                  {size}
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="number"
                  value={editingIdx === idx ? (editForm.portion?.size === 'custom' ? editForm.portion.grams || '' : '') : quickGrams}
                  onChange={e => {
                    if (editingIdx === idx) {
                      setEditForm(fm => ({ ...fm, portion: { size: 'custom', grams: e.target.value } }));
                    } else {
                      setQuickGrams(e.target.value);
                    }
                  }}
                  style={{ ...styles.smallInput, width: '70px' }}
                />
                <span>g</span>
                <button
                  onClick={() => {
                    if (editingIdx !== idx) {
                      handlePortionChange(idx, { size: 'custom', grams: quickGrams });
                    }
                    setShowEditPortionQuickIdx(null);
                  }}
                  style={{ ...styles.buttonSecondary('#1976d2'), padding: '4px 8px', fontSize: 12 }}
                >
                  OK
                </button>
                <button
                  onClick={() => {
                    if (editingIdx === idx) {
                      setEditForm(fm => ({ ...fm, portion: null }));
                    } else {
                      handlePortionChange(idx, null);
                    }
                    setShowEditPortionQuickIdx(null);
                  }}
                  style={{ ...styles.buttonSecondary('#d32f2f'), padding: '4px 8px', fontSize: 12 }}
                  title={t('Portion entfernen')}
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {editingIdx === idx && !isExportingPdf ? (
        <>
          <button
            onClick={() => {
              if (window.confirm(t('Möchten Sie diesen Eintrag wirklich löschen?'))) deleteEntry(idx);
            }}
            style={{ ...styles.buttonSecondary('#d32f2f'), position: 'absolute', bottom: 8, right: 12 }}
            title={t('Eintrag löschen')}
          >
            ×
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              setShowDateInput(s => !s);
            }}
            style={{
              ...styles.glassyIconButton(dark),
              alignSelf: 'flex-start',
              padding: '6px',
              marginBottom: '8px',
              marginRight: '8px',
              width: 40,
              height: 40,
            }}
            title={t('Datum / Zeit ändern')}
          >
            📅
          </button>
          {showDateInput && (
            <input
              ref={dateInputRef}
              type="datetime-local"
              value={editForm.date}
              onChange={e => setEditForm(fm => ({ ...fm, date: e.target.value }))}
              style={{
                ...styles.input,
                display: 'inline-block',
                marginBottom: '12px',
                width: 'fit-content',
                marginRight: showPortion ? '70px' : 0
              }}
            />
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '40px', marginTop: '4px' }}>
            <div id="edit-food-input-container" style={{ position: 'relative', flexGrow: 1 }}>
              <input
                placeholder={t('Eintrag...')}
                value={editForm.food}
                onChange={e => setEditForm(fm => ({ ...fm, food: e.target.value }))}
                onClick={handleFoodTap}
                onFocus={handleFocus}
                style={{ ...styles.input, flexGrow: 1, width: '100%', paddingRight: '30px' }}
              />
              <button
                className="quick-arrow"
                onClick={() => setShowEditFoodQuick(s => !s)}
                style={{
                  ...styles.glassyIconButton(dark),
                  padding: '4px',
                  position: 'absolute',
                  top: 'calc(50% - 2px)',
                  right: '6px',
                  transform: 'translateY(-50%)',
                  color: '#333'
                }}
                title={t('Favoriten')}
              >
                ▼
              </button>
              {showEditFoodQuick && (
                <QuickMenu
                  items={favoriteFoods}
                  onSelect={f => {
                    setEditForm(fm => ({ ...fm, food: f }));
                    setShowEditFoodQuick(false);
                  }}
                  style={{ top: '32px', left: 0 }}
                />
              )}
            </div>
            <input
              ref={fileRefEdit}
              type="file"
              accept="image/*"
              multiple
              capture={isMobile ? 'environment' : undefined}
              onChange={handleEditFile}
              style={{ display: 'none' }}
            />
            {editForm.imgs.length > 0 && <ImgStack imgs={editForm.imgs} onDelete={removeEditImg} />}
          </div>

          <div style={{ marginBottom: 40 }}>
            <div id="edit-symptom-input-container" style={{ position: 'relative', marginBottom: '8px' }}>
              <input
                className="hide-datalist-arrow"
                placeholder={t('Symptom hinzufügen...')}
                value={editForm.symptomInput}
                onChange={e => setEditForm(fm => ({ ...fm, symptomInput: e.target.value }))}
                onClick={handleNewSymptomTap}
                onFocus={handleFocus}
                style={{ ...styles.smallInput, width: '100%', paddingRight: '30px' }}
              />
              <button
                className="quick-arrow"
                onClick={() => setShowEditSymptomQuick(s => !s)}
                style={{
                  ...styles.glassyIconButton(dark),
                  padding: '4px',
                  position: 'absolute',
                  top: '50%',
                  right: '6px',
                  transform: 'translateY(-50%)',
                  color: '#333'
                }}
                title={t('Favoriten')}
              >
                ▼
              </button>
              {showEditSymptomQuick && (
                <QuickMenu
                  items={favoriteSymptoms}
                  onSelect={sym => {
                    setEditForm(fm => ({ ...fm, symptomInput: sym }));
                    setShowEditSymptomQuick(false);
                  }}
                  style={{ top: '32px', left: 0 }}
                />
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap' }}>
              <select
                value={editForm.symptomTime}
                onChange={e => setEditForm(fm => ({ ...fm, symptomTime: Number(e.target.value) }))}
                onFocus={handleFocus}
                style={{ ...styles.smallInput, width: '130px', flexShrink: 0 }}
              >
                {TIME_CHOICES.map(tc => (
                  <option key={tc.value} value={tc.value}>
                    {t(tc.label)}
                  </option>
                ))}
              </select>
              <select
                value={editForm.newSymptomStrength}
                onChange={e => setEditForm(fm => ({ ...fm, newSymptomStrength: Number(e.target.value) }))}
                onFocus={handleFocus}
                style={{ ...styles.smallInput, width: '120px', flexShrink: 0 }}
              >
                {[1, 2, 3].map(n => (
                  <option key={n} value={n}>
                    {t('Stärke')} {n}
                  </option>
                ))}
              </select>
              <button onClick={addEditSymptom} style={styles.symptomAddButton('#388e3c')}>
                +
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 8 }}>
              {sortSymptomsByTime(editForm.symptoms).map((s, j) => (
              <div
                key={j}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'nowrap' }}
              >
                <input
                  type="text"
                  className="hide-datalist-arrow"
                  value={s.txt}
                  onChange={e_text =>
                    setEditForm(fm => ({
                      ...fm,
                      symptoms: fm.symptoms.map((sym, k) =>
                        k === j ? { ...sym, txt: e_text.target.value } : sym
                      )
                    }))
                  }
                  onClick={e => handleSymptomTap(e, j, s.txt)}
                  onFocus={handleFocus}
                  style={{ ...styles.smallInput, flexGrow: 1, marginRight: '6px' }}
                />
                <select
                  value={s.time}
                  onChange={e_select =>
                    setEditForm(fm => {
                      const updated = fm.symptoms.map((sym, k) =>
                        k === j ? { ...sym, time: Number(e_select.target.value) } : sym
                      );
                      return { ...fm, symptoms: sortSymptomsByTime(updated) };
                    })
                  }
                  style={{ ...styles.smallInput, width: '32px', flexShrink: 0, fontSize: '16px', padding: '6px 2px' }}
                >
                  {TIME_CHOICES.map(t => (
                    <option key={t.value} value={t.value}>
                      {t.value === 0 ? '0' : t.value}
                    </option>
                  ))}
                </select>
                <select
                  value={s.strength || 1}
                  onChange={e_strength =>
                    setEditForm(fm => ({
                      ...fm,
                      symptoms: fm.symptoms.map((sym, k) =>
                        k === j ? { ...sym, strength: Number(e_strength.target.value) } : sym
                      )
                    }))
                  }
                  style={{ ...styles.smallInput, width: '25px', flexShrink: 0, fontSize: '16px', padding: '6px 2px' }}
                >
                  {[1, 2, 3].map(n => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => removeEditSymptom(j)}
                  title={t('Symptom löschen')}
                  style={{ ...styles.deleteIcon, position: 'static', fontSize: '20px' }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 5, marginTop: '16px', alignItems: 'center' }}>
            <button onClick={saveEdit} style={styles.buttonSecondary('#1976d2')}>
              {t('Speichern')}
            </button>
            <button onClick={cancelEdit} style={styles.buttonSecondary('#888')}>
              {t('Abbrechen')}
            </button>
          </div>

          {noteOpenIdx === idx && !isExportingPdf && (
            <div onClick={e => e.stopPropagation()} style={{ marginTop: '12px', zIndex: 15 }}>
              <textarea
                id={`note-textarea-${idx}`}
                value={noteDraft}
                onChange={e => {
                  setNoteDraft(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                placeholder={t('Notiz...')}
                style={{ ...styles.textarea, fontSize: '16px' }}
              />
              <button
                id={`note-save-button-${idx}`}
                onClick={() => saveNote(idx)}
                style={{ ...styles.buttonSecondary(dark ? '#555' : '#FBC02D'), color: dark ? '#fff' : '#333', marginTop: 8 }}
              >
                {t('Notiz speichern')}
              </button>
            </div>
          )}
        </>
      ) : (
        <>

          <div
            ref={firstRowRef}
            style={{
              fontSize: 12,
              opacity: 0.7,
              marginBottom: 4,
              marginRight: '65px',
              color: isExportingPdf
                ? dark
                  ? '#ffffff'
                  : '#444444'
                : dark
                ? '#cccccc'
                : '#444444'
            }}
          >
            {(entry.date && entry.date.split(' ')[1]) || entry.date}
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              marginBottom: 8,
              marginRight: '65px',
              overflowWrap: 'break-word',
              whiteSpace: 'normal'
            }}
          >
            {entry.food || (isSymptomOnlyEntry ? t('Nur Symptome') : t('(Kein Essen)'))}
          </div>

          {entry.imgs.length > 0 && <ImgStack imgs={entry.imgs} />}
          <div style={{ display: 'flex', flexWrap: 'wrap', margin: '8px 0 0' }}>
            {sortedAllDisplay.map((s, j) => (
              <SymTag key={j} txt={s.txt} time={s.time} strength={s.strength} dark={dark} />
            ))}
          </div>

          {noteOpenIdx === idx && !isExportingPdf && (
            <div onClick={e => e.stopPropagation()} style={{ marginTop: '8px', zIndex: 15 }}>
              <textarea
                id={`note-textarea-${idx}`}
                value={noteDraft}
                onChange={e => {
                  setNoteDraft(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                placeholder={t('Notiz...')}
                style={{ ...styles.textarea, fontSize: '16px' }}
              />
              <button
                id={`note-save-button-${idx}`}
                onClick={() => saveNote(idx)}
                style={{ ...styles.buttonSecondary(dark ? '#555' : '#FBC02D'), color: dark ? '#fff' : '#333', marginTop: 8 }}
              >
                {t('Notiz speichern')}
              </button>
            </div>
          )}

          {entry.comment && noteOpenIdx !== idx && (!isExportingPdf || isPrinting) && (
            <div
              id={`displayed-note-text-${idx}`}
              onClick={e => {
                e.stopPropagation();
                toggleNote(idx);
              }}
              style={{
                marginTop: 8,
                background: dark ? '#3a3a42' : '#f0f0f5',
                padding: '6px 8px',
                borderRadius: 4,
                color: dark ? '#e0e0e0' : '#333',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
            >
              {entry.comment}
            </div>
          )}

          <>
            <div
              id={`tag-marker-${idx}`}
              style={styles.categoryIcon(editingIdx === idx ? '31px' : `${iconTop}px`)}
              onClick={e => {
                if (isExportingPdf) return;
                e.stopPropagation();
                setColorPickerOpenForIdx(colorPickerOpenForIdx === idx ? null : idx);
                setNoteOpenIdx(null);
              }}
              title={
                !isExportingPdf
                  ? `${t('Markierung')}: ${t(TAG_COLOR_NAMES[currentTagColor] || 'Unbekannt')}. ${t('Klicken zum Ändern.')}`
                  : `${t('Markierung')}: ${t(TAG_COLOR_NAMES[currentTagColor] || 'Unbekannt')}`
              }
            >
              {TAG_COLOR_ICONS[currentTagColor]}
            </div>

            {!isExportingPdf && colorPickerOpenForIdx === idx && (
              <div
                id={`color-picker-popup-${idx}`}
                style={styles.colorPickerPopup(dark)}
                onClick={e => e.stopPropagation()}
              >
                {[TAG_COLORS.GREEN, TAG_COLORS.PURPLE, TAG_COLORS.RED, TAG_COLORS.BLUE, TAG_COLORS.BROWN, TAG_COLORS.YELLOW].map(colorValue => (
                  <div
                    key={colorValue}
                    style={styles.colorPickerItem(colorValue, currentTagColor === colorValue, dark)}
                    title={t(TAG_COLOR_NAMES[colorValue] || colorValue)}
                    onClick={() => handleTagColorChange(idx, colorValue)}
                  >
                    {TAG_COLOR_ICONS[colorValue]}
                  </div>
                ))}
              </div>
            )}

          </>
        </>
      )}
    </div>
  );
}

