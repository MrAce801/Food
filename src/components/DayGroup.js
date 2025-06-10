import React from 'react';
import EntryCard from './EntryCard';

export default function DayGroup({
  day,
  entries,
  collapsedDays,
  toggleDay,
  dark,
  isExportingPdf,
  isPrinting,
  entryRefs,
  entryCardProps,
  styles,
  TAG_COLORS,
  dayMarkSpacing,
  dayMarkSize,
  dayMarkOffset,
  dayMarkTop,
}) {
  const colorCounts = entries.reduce((acc, { entry }) => {
    const color = entry.tagColor || TAG_COLORS.GREEN;
    acc[color] = (acc[color] || 0) + 1;
    return acc;
  }, {});

  const orderedColors = [
    TAG_COLORS.GREEN,
    TAG_COLORS.RED,
    TAG_COLORS.BLUE,
    TAG_COLORS.BROWN,
    TAG_COLORS.YELLOW,
  ].filter(c => colorCounts[c]);

  return (
    <div>
      {collapsedDays.has(day) && !(isExportingPdf || isPrinting) ? (
        <div
          onClick={() => toggleDay(day)}
          style={styles.dayCover(dark, orderedColors.length, dayMarkSpacing, dayMarkOffset)}
        >
          <div style={styles.dayCoverText}>
            <button
              onClick={e => { e.stopPropagation(); toggleDay(day); }}
              style={styles.collapseButton(dark)}
              aria-label="Expand day"
            >
              ▶
            </button>
            {day}
          </div>
          {orderedColors.map((color, i) => (
            <div
              key={color}
              style={styles.dayCoverCircle(
                color,
                i * dayMarkSpacing + dayMarkOffset,
                dayMarkSize,
                dayMarkTop,
                dark
              )}
            >
              {colorCounts[color]}
            </div>
          ))}
        </div>
      ) : (
        <React.Fragment>
          <div onClick={() => toggleDay(day)} style={styles.groupHeader(isExportingPdf)}>
            <button
              onClick={e => { e.stopPropagation(); toggleDay(day); }}
              style={styles.collapseButton(dark)}
              aria-label="Collapse day"
            >
              ▼
            </button>
            {day}
          </div>
          {entries.map(({ entry, idx }) => (
            <EntryCard
              key={idx}
              refCallback={el => (entryRefs.current[idx] = el)}
              entry={entry}
              idx={idx}
              {...entryCardProps}
            />
          ))}
        </React.Fragment>
      )}
    </div>
  );
}
