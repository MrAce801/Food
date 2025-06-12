import React, { useEffect, useRef } from 'react';

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
  TIME_CHOICES,
  sortSymptomsByTime,
  SymTag,
  ImgStack,
  CameraButton,
  styles,
  favoriteFoods,
  favoriteSymptoms,
  showFoodQuick,
  setShowFoodQuick,
  showSymptomQuick,
  setShowSymptomQuick,
  QuickMenu,
  filterTags,
  setFilterTags,
  filterMenuOpen,
  setFilterMenuOpen,
  FilterMenu,
  TAG_COLORS,
  TAG_COLOR_NAMES,
  TAG_COLOR_ICONS,
  sortMode,
  setSortMode
}) {
  const categoryRowRef = useRef(null);

  useEffect(() => {
    const handler = e => {
      if (categoryRowRef.current && !categoryRowRef.current.contains(e.target)) {
        setNewForm(fm =>
          fm.tagColorManual
            ? { ...fm, tagColor: TAG_COLORS.GREEN, tagColorManual: false }
            : fm
        );
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [setNewForm]);
  return (
    <div className="new-entry-form" style={{ marginBottom: 24 }}>
      <div id="food-input-container" style={{ position: 'relative', marginBottom: 8, display: 'flex', alignItems: 'center', gap: '6px' }}>
        <input
          placeholder="Eintrag..."
          value={newForm.food}
          onChange={e => setNewForm(fm => ({ ...fm, food: e.target.value }))}
          onFocus={handleFocus}
          style={{ ...styles.input, flexGrow: 1, paddingRight: '32px' }}
        />
        <button
          className="quick-arrow"
          onClick={() => setShowFoodQuick(s => !s)}
          style={{
            ...styles.glassyIconButton(dark),
            padding: '4px',
            position: 'absolute',
            top: 'calc(50% - 2px)',
            right: '48px',
            transform: 'translateY(-50%)',
            color: '#333'
          }}
          title="Favoriten"
        >
          ▼
        </button>
        {showFoodQuick && (
          <QuickMenu
            items={favoriteFoods}
            onSelect={item => {
              setNewForm(fm => ({ ...fm, food: item }));
              setShowFoodQuick(false);
            }}
            style={{ top: '40px', left: 0 }}
          />
        )}
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

      <div
        ref={categoryRowRef}
        style={{ display: 'flex', gap: '8px', marginTop: newForm.imgs.length > 0 ? 8 : 0, marginBottom: 8 }}
      >
        {[TAG_COLORS.GREEN, TAG_COLORS.PURPLE, TAG_COLORS.RED, TAG_COLORS.BLUE, TAG_COLORS.BROWN, TAG_COLORS.YELLOW].map(colorValue => (
          <button
            key={colorValue}
            type="button"
            onClick={() =>
              setNewForm(fm =>
                fm.tagColorManual && fm.tagColor === colorValue
                  ? { ...fm, tagColor: TAG_COLORS.GREEN, tagColorManual: false }
                  : { ...fm, tagColor: colorValue, tagColorManual: true }
              )
            }
            style={styles.categoryButton(colorValue, newForm.tagColorManual && newForm.tagColor === colorValue, dark)}
            title={TAG_COLOR_NAMES[colorValue] || colorValue}
          >
            {TAG_COLOR_ICONS[colorValue]}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 8 }}>
      <div id="symptom-input-container" style={{ position: 'relative', marginBottom: '8px' }}>
        <input
          placeholder="Symptom..."
          value={newForm.symptomInput}
          onChange={e => setNewForm(fm => ({ ...fm, symptomInput: e.target.value }))}
          onFocus={handleFocus}
          style={{ ...styles.smallInput, width: '100%', paddingRight: '30px' }}
        />
        <button
          className="quick-arrow"
          onClick={() => setShowSymptomQuick(s => !s)}
          style={{
            ...styles.glassyIconButton(dark),
            padding: '4px',
            position: 'absolute',
            top: '50%',
            right: '6px',
            transform: 'translateY(-50%)',
            color: '#333'
          }}
          title="Favoriten"
        >
          ▼
        </button>
          {showSymptomQuick && (
            <QuickMenu
              items={favoriteSymptoms}
              onSelect={sym => {
                setNewForm(fm => ({ ...fm, symptomInput: sym }));
                setShowSymptomQuick(false);
              }}
              style={{ top: '32px', left: 0 }}
            />
          )}
        </div>
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
          <button
            onClick={addNewSymptom}
            disabled={!newForm.symptomInput.trim()}
            style={{
              ...styles.symptomAddButton('#388e3c'),
              opacity: newForm.symptomInput.trim() ? 1 : 0.5,
            }}
          >
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
        <div id="filter-menu-container" style={{ position: 'relative', marginLeft: 'auto' }}>
          <button
            onClick={() => setFilterMenuOpen(o => !o)}
            style={{ ...styles.glassyIconButton(dark), padding: '6px' }}
            title="Filter"
          >
            ⚙️
          </button>
          {filterMenuOpen && (
            <FilterMenu
              options={Object.values(TAG_COLORS).map(val => ({ value: val, label: TAG_COLOR_NAMES[val] || val }))}
              selected={filterTags}
              onToggle={tag => setFilterTags(t => t.includes(tag) ? t.filter(x => x !== tag) : [...t, tag])}
              sortMode={sortMode}
              setSortMode={setSortMode}
              style={{ top: '40px', right: 0 }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
