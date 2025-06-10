import React from 'react';

export default function ConnectionLines({ connections, styles, handleConnectionClick }) {
  return (
    <>
      {connections.map(c => {
        const offset = -c.lane * 5;
        const height = c.bottom - c.top;
        const horizWidth = 10 - offset;
        return (
          <div
            key={c.id}
            className="connection-line"
            onClick={e => { e.stopPropagation(); handleConnectionClick(c.id); }}
            style={{ ...styles.connectionSvg, top: c.top, height }}
          >
            <div
              style={{
                marginLeft: offset,
                height: height,
                borderLeft: '2px dashed #b22222',
                boxSizing: 'border-box',
                position: 'relative',
              }}
            />
            <div
              style={{
                marginLeft: offset,
                width: horizWidth,
                borderTop: '2px dashed #b22222',
                boxSizing: 'border-box',
              }}
            />
            <div
              style={{
                marginLeft: offset,
                transform: `translateY(${height}px)`,
                width: horizWidth,
                borderTop: '2px dashed #b22222',
                boxSizing: 'border-box',
              }}
            />
            {c.cross.map(y => (
              <div
                key={y}
                style={{
                  marginLeft: offset,
                  transform: `translateY(${y}px)`,
                  width: horizWidth,
                  borderTop: '2px dashed #b22222',
                  boxSizing: 'border-box',
                }}
              />
            ))}
          </div>
        );
      })}
    </>
  );
}
