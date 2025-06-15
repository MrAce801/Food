import React from 'react';
import useTranslation from '../useTranslation';

const QuickMenu = React.forwardRef(function QuickMenu({ items, onSelect, style }, ref) {
  const t = useTranslation();
  return (
    <div
      ref={ref}
      className="quick-menu"
      style={{ position: 'absolute', background: '#fff', border: '1px solid #ccc', borderRadius: 4, zIndex: 50, ...style }}
    >
      {items.length > 0 ? (
        items.map(item => (
          <div
            key={item}
            onClick={() => onSelect(item)}
            style={{ padding: '4px 8px', cursor: 'pointer', whiteSpace: 'nowrap', color: '#222' }}
          >
            {t(item)}
          </div>
        ))
      ) : (
        <div style={{ padding: '4px 8px', color: '#444' }}>{t('Keine Favoriten')}</div>
      )}
    </div>
  );
});

export default QuickMenu;

