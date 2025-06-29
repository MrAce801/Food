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
  const formRef = useRef(null);
  const foodTextareaRef = useRef(null);
  const symptomTextareaRef = useRef(null);
  const foodQuickBtnRef = useRef(null);
  const foodQuickMenuRef = useRef(null);
  const symptomQuickBtnRef = useRef(null);
  const symptomQuickMenuRef = useRef(null);
  const portionBtnRef = useRef(null);
  const portionMenuRef = useRef(null);
  const filterBtnRef = useRef(null);
  const filterMenuRef = useRef(null);
  const categoryBtnRef = useRef(null);
  const categoryMenuRef = useRef(null);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const t = useTranslation();

  const handleTagSelect = color => {
    setNewForm(fm => ({ ...fm, tagColor: color, tagColorManual: true }));
    setShowCategoryMenu(false);
  };

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

      if (
        showCategoryMenu &&
        categoryMenuRef.current &&
        !categoryMenuRef.current.contains(target) &&
        categoryBtnRef.current &&
        !categoryBtnRef.current.contains(target)
      ) {
        setShowCategoryMenu(false);
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
    showCategoryMenu,
    setShowCategoryMenu,
  ]);

  useEffect(() => {
    const el = foodTextareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [newForm.food]);

  useEffect(() => {
    const el = symptomTextareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [newForm.symptomInput]);
  return (
    <div ref={formRef} className="new-entry-form" style={{ marginBottom: 24 }}>
      <div id="food-input-container" style={{ position: 'relative', marginBottom: 8, display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          ref={categoryBtnRef}
          type="button"
          onClick={() => setShowCategoryMenu(s => !s)}
          style={{
            position: 'absolute',
            left: '8px',
            top: '0',
            bottom: '0',
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            fontSize: 22,
            color: '#555',
            textAlign: 'center',
            width: '36px',
          }}
          title={t('Klicken zum Ändern.')}
        >
          {TAG_COLOR_ICONS[newForm.tagColor]}
        </button>
        <div
          style={{
            position: 'absolute',
            left: '46px',
            top: '8px',
            bottom: '8px',
            width: '1px',
            background: '#ccc',
          }}
        />
        {showCategoryMenu && (
          <div
            ref={categoryMenuRef}
            style={{
              position: 'absolute',
              left: '8px',
              top: 'calc(100% + 4px)',
              background: dark ? '#4a4a52' : '#fff',
              padding: '8px',
              borderRadius: '6px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
              zIndex: 30,
              display: 'flex',
              gap: '8px',
            }}
            onClick={e => e.stopPropagation()}
          >
            {[TAG_COLORS.GREEN, TAG_COLORS.PURPLE, TAG_COLORS.RED, TAG_COLORS.BLUE, TAG_COLORS.BROWN, TAG_COLORS.YELLOW, TAG_COLORS.GRAY].map(colorValue => (
              <div
                key={colorValue}
                style={styles.colorPickerItem(colorValue, newForm.tagColor === colorValue, dark)}
                title={t(TAG_COLOR_NAMES[colorValue] || colorValue)}
                onClick={() => handleTagSelect(colorValue)}
              >
                {TAG_COLOR_ICONS[colorValue]}
              </div>
            ))}
          </div>
        )}
        <textarea
          ref={foodTextareaRef}
          rows={1}
          placeholder={t('Eintrag...')}
          value={newForm.food}
          onChange={e => {
            setNewForm(fm => ({ ...fm, food: e.target.value }));
            e.target.style.height = 'auto';
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onFocus={handleFocus}
          style={{
            ...styles.textarea,
            fontSize: 16,
            paddingRight: '32px',
            paddingLeft: '56px',
            marginTop: 0,
          }}
        />
        <button
          ref={foodQuickBtnRef}
          className="quick-arrow"
          onClick={() => setShowFoodQuick(s => !s)}
          style={{
            ...styles.textFieldIconButton,
            position: 'absolute',
            top: 'calc(50% - 2px)',
            right: '48px',
            transform: 'translateY(-50%)'
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
            anchorRef={foodTextareaRef}
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
        style={{
          display: 'flex',
          gap: '8px',
          marginTop: newForm.imgs.length > 0 ? 8 : 0,
          marginBottom: 8,
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative', marginLeft: 0 }}>
          <button
            ref={portionBtnRef}
            type="button"
            onClick={() => setShowPortionQuick(s => !s)}
            style={{
              ...styles.glassyButton(dark),
              color: PORTION_COLORS[
                newForm.portion.size === 'custom' ? 'M' : newForm.portion.size
              ] || '#aaa',
            }}
          >
            {newForm.portion.size === 'custom'
              ? `${newForm.portion.grams || ''}g`
              : newForm.portion.size || '📏'}
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
                <button
                  onClick={() => { setNewForm(fm => ({ ...fm, portion: { size: null, grams: null } })); setShowPortionQuick(false); }}
                  style={{ ...styles.buttonSecondary('#d32f2f'), padding: '4px 8px', fontSize: 12 }}
                  title={t('Portion entfernen')}
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
      <div id="symptom-input-container" style={{ position: 'relative', marginBottom: '8px' }}>
        <textarea
          ref={symptomTextareaRef}
          rows={1}
          placeholder={t('Symptom...')}
          value={newForm.symptomInput}
          onChange={e => {
            setNewForm(fm => ({ ...fm, symptomInput: e.target.value }));
            e.target.style.height = 'auto';
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onFocus={handleFocus}
          style={{ ...styles.textarea, fontSize: 16, width: '100%', paddingRight: '30px', marginTop: 0 }}
        />
        <button
          ref={symptomQuickBtnRef}
          className="quick-arrow"
          onClick={() => setShowSymptomQuick(s => !s)}
          style={{
            ...styles.textFieldIconButton,
            position: 'absolute',
            top: '50%',
            right: '6px',
            transform: 'translateY(-50%)'
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
              anchorRef={symptomTextareaRef}
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
