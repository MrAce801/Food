import React from 'react';

export default function ConnectionLines({ connections, styles, handleConnectionClick }) {
  return (
    <>
      {connections.map(c => {
        const offset = -c.lane * 5;
        const height = c.bottom - c.top;
        let d = `M10 0 H${offset} V${height} H10`;
        c.cross.forEach(y => {
          d += ` M10 ${y} H${offset}`;
        });
        return (
          <svg
            key={c.id}
            className="connection-line"
            onClick={e => { e.stopPropagation(); handleConnectionClick(c.id); }}
            style={{ ...styles.connectionSvg, top: c.top, height }}
          >
            <path
              d={d}
              stroke="#b22222"
              strokeWidth="2"
              fill="none"
              strokeDasharray="4 2"
              strokeLinecap="round"
            />
          </svg>
        );
      })}
    </>
  );
}
