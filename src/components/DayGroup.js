import React from 'react';
import EntryCard from './EntryCard';
import { groupEntriesByLink } from '../utils';

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

  const entryConnectionGroups = groupEntriesByLink(entries);

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
          <div onClick={() => toggleDay(day)} style={styles.groupHeader(isExportingPdf || isPrinting)}>
            <button
              onClick={e => { e.stopPropagation(); toggleDay(day); }}
              style={styles.collapseButton(dark)}
              aria-label="Collapse day"
            >
              ▼
            </button>
            {day}
          </div>
          {entryConnectionGroups.map((group, groupIndex) => (
            group.length > 1 ? (
              <div
                key={group[0].entry.linkId || `group-${groupIndex}`}
                className="connection-group"
              >
                {group.map(({ entry, idx }) => (
                  <EntryCard
                    key={idx}
                    refCallback={el => (entryRefs.current[idx] = el)}
                    entry={entry}
                    idx={idx}
                    {...entryCardProps}
                  />
                ))}
              </div>
            ) : (
              group.length === 1 && (
                <EntryCard
                  key={group[0].idx}
                  refCallback={el => (entryRefs.current[group[0].idx] = el)}
                  entry={group[0].entry}
                  idx={group[0].idx}
                  {...entryCardProps}
                />
              )
            )
          ))}
        </React.Fragment>
      )}
    </div>
  );
}
