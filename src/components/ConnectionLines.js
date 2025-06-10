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
                position: 'absolute',
                left: offset,
                top: 0,
                height: height,
                borderLeft: '2px dashed #b22222',
                boxSizing: 'border-box',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: offset,
                top: 0,
                width: horizWidth,
                borderTop: '2px dashed #b22222',
                boxSizing: 'border-box',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: offset,
                top: height,
                width: horizWidth,
                borderTop: '2px dashed #b22222',
                boxSizing: 'border-box',
              }}
            />
            {c.cross.map(y => (
              <div
                key={y}
                style={{
                  position: 'absolute',
                  left: offset,
                  top: y,
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
