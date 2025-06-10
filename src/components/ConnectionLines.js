import React from 'react';

export default function ConnectionLines({ connections, styles, handleConnectionClick, maxLane }) {
  if (!connections || connections.length === 0) {
    return null;
  }

  // Calculate the total size needed for the SVG canvas
  const maxBottom = Math.max(...connections.map(c => c.bottom), 0);
  const gutterWidth = 20 + (maxLane * 5);

  return (
    <svg
      width={gutterWidth}
      height={maxBottom}
      // This style is critical: zIndex puts it ON TOP, and positioning places it in the gutter.
      style={{
        ...styles.connectionSvg,
        position: 'absolute',
        top: 0,
        left: 0,
        height: maxBottom,
        width: gutterWidth,
        zIndex: 10
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {connections.map(c => {
        // Position the line's X-coordinate within the SVG canvas
        const verticalLineX = 5 + (c.lane * 5); // Draw from the left edge
        const stubEndX = verticalLineX + 8; // Draw stubs to the right

        let pathData = ``;
        // Main vertical line
        pathData += `M ${verticalLineX} ${c.top} L ${verticalLineX} ${c.bottom} `;
        // Top horizontal stub
        pathData += `M ${verticalLineX} ${c.top} L ${stubEndX} ${c.top} `;
        // Bottom horizontal stub
        pathData += `M ${verticalLineX} ${c.bottom} L ${stubEndX} ${c.bottom} `;

        // Add stubs for any intermediate "crossed" entries
        c.cross.forEach(crossPointY => {
          const absoluteY = c.top + crossPointY;
          pathData += `M ${verticalLineX} ${absoluteY} L ${stubEndX} ${absoluteY} `;
        });

        return (
          <path
            key={c.id}
            d={pathData}
            stroke="#b22222"
            strokeWidth="2"
            strokeDasharray="4 3"
            fill="none"
            onClick={e => { e.stopPropagation(); handleConnectionClick(c.id); }}
            style={{ cursor: 'pointer' }}
          />
        );
      })}
    </svg>
  );
}
