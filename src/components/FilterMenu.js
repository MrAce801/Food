import React from 'react';
import useTranslation from '../useTranslation';

const FilterMenu = React.forwardRef(function FilterMenu({ options, selected, onToggle, sortMode, setSortMode, style }, ref) {
  const t = useTranslation();
  return (
    <div
      ref={ref}
      className="filter-menu"
      style={{ position: 'absolute', background: '#fff', border: '1px solid #ccc', borderRadius: 4, zIndex: 50, padding: 4, fontSize: 14, ...style }}
    >
      <div style={{ padding: '4px 8px', borderBottom: '1px solid #ddd', marginBottom: 4 }}>
        <strong>{t('Sortierung:')}</strong>
        <label style={{ marginLeft: 8, fontSize: 14 }}>
          <input
            type="radio"
            name="sortMode"
            checked={sortMode === 'date'}
            onChange={() => setSortMode('date')}
            style={{ marginRight: 4 }}
          />
          {t('Datum')}
        </label>
        <label style={{ marginLeft: 8, fontSize: 14 }}>
          <input
            type="radio"
            name="sortMode"
            checked={sortMode === 'category'}
            onChange={() => setSortMode('category')}
            style={{ marginRight: 4 }}
          />
          {t('Kategorie')}
        </label>
      </div>
      {options.map(opt => (
        <label key={opt.value} style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', cursor: 'pointer', whiteSpace: 'nowrap', color: '#222', fontSize: 14 }}>
          <input
            type="checkbox"
            checked={selected.includes(opt.value)}
            onChange={() => onToggle(opt.value)}
            style={{ marginRight: 4 }}
          />
          {t(opt.label)}
        </label>
      ))}
    </div>
  );
});

export default FilterMenu;
