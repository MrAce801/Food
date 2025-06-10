import React from 'react';

export default function ConnectionLines({ connections, styles, handleConnectionClick }) {
  if (!connections || connections.length === 0) {
    return null;
  }

  // Calculate the total size needed for the SVG canvas
  const maxBottom = Math.max(...connections.map(c => c.bottom), 0);
  const maxLane = Math.max(...connections.map(c => c.lane), 0);
  const svgWidth = 25 + (maxLane * 5); // Give it a little padding

  return (
    <svg
      width={svgWidth}
      height={maxBottom}
      style={{ ...styles.connectionSvg, position: 'absolute', top: 0, left: 0, overflow: 'visible' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {connections.map(c => {
        // Calculate the X position for the vertical line based on its lane
        // We draw from left to right. Lane 0 is furthest left.
        const verticalLineX = 15 - (c.lane * 5);
        const stubEndX = verticalLineX + 8;

        // Use a single SVG <path> element to draw everything for one connection.
        // 'M' is "move to", 'L' is "line to".
        let pathData = ``;
        // Main vertical line
        pathData += `M ${verticalLineX} ${c.top} L ${verticalLineX} ${c.bottom} `;
        // Top horizontal stub
        pathData += `M ${verticalLineX} ${c.top} L ${stubEndX} ${c.top} `;
        // Bottom horizontal stub
        pathData += `M ${verticalLineX} ${c.bottom} L ${stubEndX} ${c.bottom} `;

        // Add stubs for any intermediate "crossed" entries
        c.cross.forEach(crossPointY => {
          // The 'y' in cross is an offset from the top of the connection line
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
