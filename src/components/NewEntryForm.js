import React from 'react';

export default function NewEntryForm({
  newForm,
  setNewForm,
  newSymptoms,
  addNewSymptom,
  removeNewSymptom,
  addEntry,
  handleNewFile,
  removeNewImg,
  searchTerm,
  setSearchTerm,
  showSearch,
  setShowSearch,
  searchInputRef,
  fileRefNew,
  dark,
  isMobile,
  handleFocus,
  SYMPTOM_CHOICES,
  TIME_CHOICES,
  sortSymptomsByTime,
  SymTag,
  ImgStack,
  CameraButton,
  styles
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <input
          placeholder="Eintrag..."
          value={newForm.food}
          onChange={e => setNewForm(fm => ({ ...fm, food: e.target.value }))}
          onFocus={handleFocus}
          style={styles.input}
        />
        <CameraButton onClick={() => fileRefNew.current?.click()} />
        <input
          ref={fileRefNew}
          type="file"
          accept="image/*"
          multiple
          capture={isMobile ? 'environment' : undefined}
          onChange={handleNewFile}
          style={{ display: 'none' }}
        />
      </div>
      {newForm.imgs.length > 0 && <ImgStack imgs={newForm.imgs} onDelete={removeNewImg} />}

      <div style={{ marginTop: newForm.imgs.length > 0 ? 8 : 0, marginBottom: 8 }}>
        <input
          list="symptom-list"
          placeholder="Symptom..."
          value={newForm.symptomInput}
          onChange={e => setNewForm(fm => ({ ...fm, symptomInput: e.target.value }))}
          onFocus={handleFocus}
          style={{ ...styles.smallInput, width: '100%', marginBottom: '8px' }}
        />
        <datalist id="symptom-list">
          {SYMPTOM_CHOICES.map(s => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap' }}>
          <select
            value={newForm.symptomTime}
            onChange={e => setNewForm(fm => ({ ...fm, symptomTime: Number(e.target.value) }))}
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
            value={newForm.symptomStrength}
            onChange={e => setNewForm(fm => ({ ...fm, symptomStrength: Number(e.target.value) }))}
            onFocus={handleFocus}
            style={{ ...styles.smallInput, width: '100px', flexShrink: 0 }}
          >
            {[1, 2, 3].map(n => (
              <option key={n} value={n}>
                Stärke {n}
              </option>
            ))}
          </select>
          <button onClick={addNewSymptom} style={styles.symptomAddButton('#388e3c')}>
            +
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: 8 }}>
        {sortSymptomsByTime(newSymptoms).map((s, i) => (
          <SymTag key={i} txt={s.txt} time={s.time} strength={s.strength} dark={dark} onDel={() => removeNewSymptom(i)} />
        ))}
      </div>
      <button
        onClick={addEntry}
        disabled={!newForm.food.trim() && newSymptoms.length === 0}
        style={{ ...styles.buttonPrimary, opacity: newForm.food.trim() || newSymptoms.length > 0 ? 1 : 0.5 }}
      >
        Eintrag hinzufügen
      </button>

      <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center' }}>
        <button onClick={() => setShowSearch(s => !s)} style={{ ...styles.glassyIconButton(dark), padding: '6px' }} title="Suche">
          🔍
        </button>
        {showSearch && (
          <input
            ref={searchInputRef}
            placeholder="Suche..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ ...styles.smallInput, flexGrow: 1 }}
          />
        )}
      </div>
    </div>
  );
}
