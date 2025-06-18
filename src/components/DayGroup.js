import React from 'react';
import EntryCard from './EntryCard';
import { formatCollapsedDay } from '../utils';
import useTranslation from '../useTranslation';

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
  styles,
  TAG_COLORS,
  TAG_COLOR_ICONS,
  language,
}) {
  const t = useTranslation();
  const colorCounts = entries.reduce((acc, { entry }) => {
    const color = entry.tagColor || TAG_COLORS.GREEN;
    acc[color] = (acc[color] || 0) + 1;
    return acc;
  }, {});

  const orderedColors = [
    TAG_COLORS.GRAY,
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
              aria-label={t('Expand day')}
            >
              ▶
            </button>
            {/* display day without year when collapsed */}
            {formatCollapsedDay(day, language)}
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
              aria-label={t('Collapse day')}
            >
              ▼
            </button>
            {day}
          </div>
          {entries.map(({ entry, idx }, i) => {
            const prev = entries[i - 1];
            const next = entries[i + 1];
            const group = entry.linkId && groups[entry.linkId] ? groups[entry.linkId] : null;
            const linkedLen = group ? group.length : 0;
            const inGroup = linkedLen >= 2;
            const prevSame = inGroup && prev && prev.entry.linkId === entry.linkId;
            const nextSame = inGroup && next && next.entry.linkId === entry.linkId;
            const linkPosition = {
              inGroup,
              firstInGroup: inGroup && !prevSame,
              lastInGroup: inGroup && !nextSame,
            };
            const marginBottom = inGroup && nextSame ? 0 : 16;
            return (
              <EntryCard
                key={idx}
                refCallback={el => (entryRefs.current[idx] = el)}
                entry={entry}
                idx={idx}
                marginBottom={marginBottom}
                linkPosition={linkPosition}
              />
            );
          })}
        </React.Fragment>
      )}
    </div>
  );
}
