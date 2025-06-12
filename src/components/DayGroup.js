import React from 'react';
import EntryCard from './EntryCard';

export default function DayGroup({
  day,
  entries,
  groups,
  collapsedDays,
  toggleDay,
  dark,
  isExportingPdf,
  isPrinting,
  entryRefs,
  entryCardProps,
  styles,
  TAG_COLORS,
  TAG_COLOR_ICONS,
}) {
  const colorCounts = entries.reduce((acc, { entry }) => {
    const color = entry.tagColor || TAG_COLORS.GREEN;
    acc[color] = (acc[color] || 0) + 1;
    return acc;
  }, {});

  const orderedColors = [
    TAG_COLORS.YELLOW,
    TAG_COLORS.BLUE,
    TAG_COLORS.BROWN,
    TAG_COLORS.RED,
    TAG_COLORS.GREEN,
  ].filter(c => colorCounts[c]);

  return (
    <div className="fd-day-group" style={styles.dayGroupContainer(isExportingPdf)}>
      {collapsedDays.has(day) && !(isExportingPdf || isPrinting) ? (
        <div onClick={() => toggleDay(day)} style={styles.dayCover(dark)}>
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
          <div style={styles.dayCoverCounts}>
            {orderedColors.map(color => (
              <div key={color} style={styles.dayCoverCountPair(dark)}>
                <span style={{ width: 18, textAlign: 'center' }}>{TAG_COLOR_ICONS[color]}</span>
                <span>{colorCounts[color]}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <React.Fragment>
          <div
            onClick={() => toggleDay(day)}
            className="fd-group-header"
            style={styles.groupHeader(isExportingPdf)}
          >
            <button
              onClick={e => { e.stopPropagation(); toggleDay(day); }}
              style={styles.collapseButton(dark)}
              aria-label="Collapse day"
            >
              ▼
            </button>
            {day}
          </div>
          {entries.map(({ entry, idx }, i) => {
            const next = entries[i + 1];
            const linkedLen = entry.linkId && groups[entry.linkId] ? groups[entry.linkId].length : 0;
            const marginBottom = linkedLen >= 2 && next && next.entry.linkId === entry.linkId ? 2 : 16;
            return (
              <EntryCard
                key={idx}
                refCallback={el => (entryRefs.current[idx] = el)}
                entry={entry}
                idx={idx}
                marginBottom={marginBottom}
                {...entryCardProps}
              />
            );
          })}
        </React.Fragment>
      )}
    </div>
  );
}
