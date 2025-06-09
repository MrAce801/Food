import React from 'react';

export default function QuickMenu({ items, onSelect, style }) {
  return (
    <div style={{ position: 'absolute', background: '#fff', border: '1px solid #ccc', borderRadius: 4, zIndex: 50, ...style }}>
      {items.length > 0 ? (
        items.map(item => (
          <div
            key={item}
            onClick={() => onSelect(item)}
            style={{ padding: '4px 8px', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            {item}
          </div>
        ))
      ) : (
        <div style={{ padding: '4px 8px', color: '#888' }}>Keine Favoriten</div>
      )}
    </div>
  );
}

