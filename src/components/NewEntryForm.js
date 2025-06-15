import React, { useEffect, useRef, useState } from 'react';
import useTranslation from '../useTranslation';
import { PORTION_COLORS } from '../constants';

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
  showPortionQuick,
  setShowPortionQuick,
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
  const formRef = useRef(null);
  const foodQuickBtnRef = useRef(null);
  const foodQuickMenuRef = useRef(null);
  const symptomQuickBtnRef = useRef(null);
  const symptomQuickMenuRef = useRef(null);
  const portionBtnRef = useRef(null);
  const portionMenuRef = useRef(null);
  const filterBtnRef = useRef(null);
  const filterMenuRef = useRef(null);
  const [showCategories, setShowCategories] = useState(false);
  const t = useTranslation();

  useEffect(() => {
    const handler = e => {
      const target = e.target;
      const insideForm = formRef.current && formRef.current.contains(target);

      if (!insideForm) {
        setNewForm(fm =>
          fm.tagColorManual
            ? { ...fm, tagColor: TAG_COLORS.GREEN, tagColorManual: false }
            : fm
        );
      }

      if (
        showFoodQuick &&
        foodQuickMenuRef.current &&
        !foodQuickMenuRef.current.contains(target) &&
        foodQuickBtnRef.current &&
        !foodQuickBtnRef.current.contains(target)
      ) {
        setShowFoodQuick(false);
      }

      if (
        showSymptomQuick &&
        symptomQuickMenuRef.current &&
        !symptomQuickMenuRef.current.contains(target) &&
        symptomQuickBtnRef.current &&
        !symptomQuickBtnRef.current.contains(target)
      ) {
        setShowSymptomQuick(false);
      }

      if (
        showPortionQuick &&
        portionMenuRef.current &&
        !portionMenuRef.current.contains(target) &&
        portionBtnRef.current &&
        !portionBtnRef.current.contains(target)
      ) {
        setShowPortionQuick(false);
      }

      if (
        filterMenuOpen &&
        filterMenuRef.current &&
        !filterMenuRef.current.contains(target) &&
        filterBtnRef.current &&
        !filterBtnRef.current.contains(target)
      ) {
        setFilterMenuOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [
    setNewForm,
    showFoodQuick,
    setShowFoodQuick,
    showSymptomQuick,
    setShowSymptomQuick,
    showPortionQuick,
    setShowPortionQuick,
    filterMenuOpen,
    setFilterMenuOpen,
  ]);
  return (
    <div ref={formRef} className="new-entry-form" style={{ marginBottom: 24 }}>
      <div id="food-input-container" style={{ position: 'relative', marginBottom: 8, display: 'flex', alignItems: 'center', gap: '6px' }}>
        <input
          placeholder={TAG_COLOR_NAMES[newForm.tagColor] ? `${t(TAG_COLOR_NAMES[newForm.tagColor])}...` : t('Eintrag...')}
          value={newForm.food}
          onChange={e => setNewForm(fm => ({ ...fm, food: e.target.value }))}
          onFocus={handleFocus}
          style={{ ...styles.input, flexGrow: 1, paddingRight: '32px' }}
        />
        <button
          ref={foodQuickBtnRef}
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
          title={t('Favoriten')}
        >
          ▼
        </button>
        {showFoodQuick && (
          <QuickMenu
            ref={foodQuickMenuRef}
            items={favoriteFoods}
            onSelect={item => {
              setNewForm(fm => ({ ...fm, food: item }));
              setShowFoodQuick(false);
            }}
            style={{ top: '40px', left: 0 }}
          />
        )}
        <CameraButton onClick={() => fileRefNew.current?.click()} dark={dark} />
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
        style={{
          display: 'flex',
          gap: '8px',
          marginTop: newForm.imgs.length > 0 ? 8 : 0,
          marginBottom: 8,
          alignItems: 'center',
        }}
      >
        <button
          type="button"
          onClick={() => setShowCategories(s => !s)}
          style={styles.glassyButton(dark)}
        >
          {t('Kategorien')} {showCategories ? '▼' : '▶'}
        </button>
        <div style={{ position: 'relative', marginLeft: 4 }}>
          <button
            ref={portionBtnRef}
            type="button"
            onClick={() => setShowPortionQuick(s => !s)}
            style={{
              ...styles.glassyButton(dark),
              color: PORTION_COLORS[
                newForm.portion.size === 'custom' ? 'M' : newForm.portion.size
              ],
            }}
          >
            {newForm.portion.size === 'custom' ? `${newForm.portion.grams || ''}g` : newForm.portion.size}
          </button>
          {showPortionQuick && (
            <div ref={portionMenuRef} style={styles.portionPickerPopup(dark)}>
              {['S','M','L'].map(size => (
                <div
                  key={size}
                  style={styles.portionPickerItem(PORTION_COLORS[size], newForm.portion.size === size, dark)}
                  onClick={() => { setNewForm(fm => ({ ...fm, portion: { size, grams: null } })); setShowPortionQuick(false); }}
                >
                  {size}
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="number"
                  value={newForm.portion.size === 'custom' ? newForm.portion.grams || '' : ''}
                  onChange={e => setNewForm(fm => ({ ...fm, portion: { size: 'custom', grams: e.target.value } }))}
                  style={{ ...styles.smallInput, width: '70px' }}
                />
                <span>g</span>
                <button onClick={() => setShowPortionQuick(false)} style={{ ...styles.buttonSecondary('#1976d2'), padding: '4px 8px', fontSize: 12 }}>OK</button>
              </div>
            </div>
          )}
        </div>
        {showCategories &&
          [
            TAG_COLORS.PURPLE,
            TAG_COLORS.BLUE,
            TAG_COLORS.BROWN,
            TAG_COLORS.YELLOW,
          ].map(colorValue => (
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
              style={styles.categoryButton(
                colorValue,
                newForm.tagColorManual && newForm.tagColor === colorValue,
                dark
              )}
              title={t(TAG_COLOR_NAMES[colorValue] || colorValue)}
            >
              {TAG_COLOR_ICONS[colorValue]}
            </button>
          ))}
      </div>

      <div style={{ marginBottom: 8 }}>
      <div id="symptom-input-container" style={{ position: 'relative', marginBottom: '8px' }}>
        <input
          placeholder={t('Symptom...')}
          value={newForm.symptomInput}
          onChange={e => setNewForm(fm => ({ ...fm, symptomInput: e.target.value }))}
          onFocus={handleFocus}
          style={{ ...styles.smallInput, width: '100%', paddingRight: '30px' }}
        />
        <button
          ref={symptomQuickBtnRef}
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
          title={t('Favoriten')}
        >
          ▼
        </button>
          {showSymptomQuick && (
            <QuickMenu
              ref={symptomQuickMenuRef}
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
            style={{ ...styles.smallInput, width: '130px', flexShrink: 0 }}
          >
            {TIME_CHOICES.map(tc => (
              <option key={tc.value} value={tc.value}>
                {t(tc.label)}
              </option>
            ))}
          </select>
          <select
            value={newForm.symptomStrength}
            onChange={e => setNewForm(fm => ({ ...fm, symptomStrength: Number(e.target.value) }))}
            onFocus={handleFocus}
            style={{ ...styles.smallInput, width: '120px', flexShrink: 0 }}
          >
            {[1, 2, 3].map(n => (
              <option key={n} value={n}>
                {t('Stärke')} {n}
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
        {t('Eintrag hinzufügen')}
      </button>

      <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center' }}>
        <button onClick={() => setShowSearch(s => !s)} style={{ ...styles.glassyIconButton(dark), padding: '6px' }} title={t('Suche')}>
          🔍
        </button>
        {showSearch && (
          <input
            ref={searchInputRef}
            placeholder={t('Suche...')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ ...styles.smallInput, flexGrow: 1 }}
          />
        )}
        <div id="filter-menu-container" style={{ position: 'relative', marginLeft: 'auto' }}>
          <button
            ref={filterBtnRef}
            onClick={() => setFilterMenuOpen(o => !o)}
            style={{ ...styles.glassyIconButton(dark), padding: '6px' }}
            title={t('Filter')}
          >
            ⚙️
          </button>
          {filterMenuOpen && (
            <FilterMenu
              ref={filterMenuRef}
              options={Object.values(TAG_COLORS).map(val => ({ value: val, label: t(TAG_COLOR_NAMES[val] || val) }))}
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
