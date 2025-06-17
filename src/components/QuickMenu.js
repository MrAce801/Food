import React, { useLayoutEffect, useRef, useState } from 'react';
import useTranslation from '../useTranslation';

const QuickMenu = React.forwardRef(function QuickMenu({ items, onSelect, style }, ref) {
  const t = useTranslation();
  const localRef = useRef(null);
  const [adjust, setAdjust] = useState({});

  const setRefs = el => {
    localRef.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) ref.current = el;
  };

  useLayoutEffect(() => {
    const el = localRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    let dx = 0;
    let dy = 0;
    if (rect.right > window.innerWidth) dx -= rect.right - window.innerWidth + 4;
    if (rect.left < 0) dx += -rect.left + 4;
    if (rect.bottom > window.innerHeight) dy -= rect.bottom - window.innerHeight + 4;
    if (rect.top < 0) dy += -rect.top + 4;
    if (dx !== 0 || dy !== 0) {
      setAdjust({ transform: `translate(${dx}px, ${dy}px)` });
    }
  }, [style, items]);

  return (
    <div
      ref={setRefs}
      className="quick-menu"
      style={{ position: 'absolute', background: '#fff', border: '1px solid #ccc', borderRadius: 4, zIndex: 50, ...style, ...adjust }}
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

