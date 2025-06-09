import React from 'react';

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
  showEditSymptomQuick,
  setShowEditSymptomQuick
}) {
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
      ref={refCallback}
      id={`entry-card-${idx}`}
      style={styles.entryCard(dark, isSymptomOnlyEntry)}
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
              <ellipse cx="5" cy="8" rx="4" ry="2.5" stroke={linkingInfo && linkingInfo.baseIdx === idx ? '#FBC02D' : '#6EC1FF'} strokeWidth="2" fill="none" />
              <ellipse cx="11" cy="8" rx="4" ry="2.5" stroke={linkingInfo && linkingInfo.baseIdx === idx ? '#FBC02D' : '#B8E0FF'} strokeWidth="2" fill="none" />
            </g>
          </svg>
        </div>
      </div>
      {editingIdx === idx && !isExportingPdf ? (
        <>
          <button
            onClick={() => {
              if (window.confirm('Möchten Sie diesen Eintrag wirklich löschen?')) deleteEntry(idx);
            }}
            style={{ ...styles.buttonSecondary('#d32f2f'), position: 'absolute', bottom: 8, right: 8 }}
            title="Eintrag löschen"
          >
            ×
          </button>
          <input
            type="datetime-local"
            value={editForm.date}
            onChange={e => setEditForm(fm => ({ ...fm, date: e.target.value }))}
            style={{ ...styles.input, marginBottom: '12px', width: '100%' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <input
              placeholder="Eintrag..."
              value={editForm.food}
              onChange={e => setEditForm(fm => ({ ...fm, food: e.target.value }))}
              onFocus={handleFocus}
              style={{ ...styles.input, flexGrow: 1 }}
            />
            <button
              onClick={() => toggleFavoriteFood(editForm.food.trim())}
              title="Favorit"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 20, color: favoriteFoods.includes(editForm.food.trim()) ? '#FBC02D' : '#aaa' }}
            >
              ★
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0' }}>
            <CameraButton onClick={() => fileRefEdit.current?.click()} />
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

          <div style={{ marginBottom: 12 }}>
            <div id="edit-symptom-input-container" style={{ position: 'relative', marginBottom: '8px' }}>
              <input
                list="symptom-list-edit"
                placeholder="Symptom hinzufügen..."
                value={editForm.symptomInput}
                onChange={e => setEditForm(fm => ({ ...fm, symptomInput: e.target.value }))}
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
                  transform: 'translateY(-50%)'
                }}
                title="Favoriten"
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
            <datalist id="symptom-list-edit">
              {SYMPTOM_CHOICES.map(s => (
                <option key={s} value={s} />
              ))}
            </datalist>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap' }}>
              <select
                value={editForm.symptomTime}
                onChange={e => setEditForm(fm => ({ ...fm, symptomTime: Number(e.target.value) }))}
                onFocus={handleFocus}
                style={{ ...styles.smallInput, width: '110px', flexShrink: 0 }}
              >
                {TIME_CHOICES.map(t => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <select
                value={editForm.newSymptomStrength}
                onChange={e => setEditForm(fm => ({ ...fm, newSymptomStrength: Number(e.target.value) }))}
                onFocus={handleFocus}
                style={{ ...styles.smallInput, width: '100px', flexShrink: 0 }}
              >
                {[1, 2, 3].map(n => (
                  <option key={n} value={n}>
                    Stärke {n}
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
                  list="symptom-list-edit"
                  value={s.txt}
                  onChange={e_text =>
                    setEditForm(fm => ({
                      ...fm,
                      symptoms: fm.symptoms.map((sym, k) =>
                        k === j ? { ...sym, txt: e_text.target.value } : sym
                      )
                    }))
                  }
                  onFocus={handleFocus}
                  style={{ ...styles.smallInput, flexGrow: 1, marginRight: '6px' }}
                />
                <button
                  onClick={() => toggleFavoriteSymptom(s.txt)}
                  title="Favorit"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18, color: favoriteSymptoms.includes(s.txt) ? '#FBC02D' : '#aaa' }}
                >
                  ★
                </button>
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
                  style={{ ...styles.smallInput, width: '22px', flexShrink: 0, fontSize: '16px', padding: '6px 2px' }}
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
                  style={{ ...styles.smallInput, width: '15px', flexShrink: 0, fontSize: '16px', padding: '6px 2px' }}
                >
                  {[1, 2, 3].map(n => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => removeEditSymptom(j)}
                  title="Symptom löschen"
                  style={{ ...styles.deleteIcon, position: 'static', fontSize: '20px' }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 5, marginTop: '16px' }}>
            <button onClick={saveEdit} style={styles.buttonSecondary('#1976d2')}>
              Speichern
            </button>
            <button onClick={cancelEdit} style={styles.buttonSecondary('#888')}>
              Abbrechen
            </button>
          </div>
        </>
      ) : (
        <>
          {!isExportingPdf && (
            <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, display: 'flex', gap: '6px' }}>
              <button
                id={`note-icon-button-${idx}`}
                onClick={e => {
                  e.stopPropagation();
                  toggleNote(idx);
                }}
                style={{ ...styles.glassyIconButton(dark), padding: '6px' }}
                title="Notiz"
              >
                🗒️
              </button>
            </div>
          )}

          <div
            style={{
              fontSize: 12,
              opacity: 0.7,
              marginBottom: 4,
              marginRight: '65px',
              color: isExportingPdf ? '#fafafa' : dark ? '#cccccc' : '#444444'
            }}
          >
            {entry.date}
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
            {entry.food || (isSymptomOnlyEntry ? 'Nur Symptome' : '(Kein Essen)')}
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
                placeholder="Notiz..."
                style={{ ...styles.textarea, fontSize: '16px' }}
              />
              <button
                id={`note-save-button-${idx}`}
                onClick={() => saveNote(idx)}
                style={{ ...styles.buttonSecondary(dark ? '#555' : '#FBC02D'), color: dark ? '#fff' : '#333', marginTop: 8 }}
              >
                Notiz speichern
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
              style={styles.tagMarkerOuter(currentTagColor)}
              onClick={e => {
                if (isExportingPdf) return;
                e.stopPropagation();
                setColorPickerOpenForIdx(colorPickerOpenForIdx === idx ? null : idx);
                setNoteOpenIdx(null);
              }}
              title={
                !isExportingPdf
                  ? `Markierung: ${TAG_COLOR_NAMES[currentTagColor] || 'Unbekannt'}. Klicken zum Ändern.`
                  : `Markierung: ${TAG_COLOR_NAMES[currentTagColor] || 'Unbekannt'}`
              }
            />
            <div style={styles.tagMarkerInnerHint(cardBackgroundColor)} />

            {!isExportingPdf && colorPickerOpenForIdx === idx && (
              <div
                id={`color-picker-popup-${idx}`}
                style={styles.colorPickerPopup(dark)}
                onClick={e => e.stopPropagation()}
              >
                {[TAG_COLORS.GREEN, TAG_COLORS.RED, TAG_COLORS.YELLOW, TAG_COLORS.BROWN, TAG_COLORS.BLUE].map(colorValue => (
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
}

