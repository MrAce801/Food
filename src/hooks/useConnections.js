import { useLayoutEffect, useState } from 'react';

export default function useConnections(entries, searchTerm, displayCount, collapsedDays, entryRefs, extraFlag) {
  const [connections, setConnections] = useState([]);

  useLayoutEffect(() => {
    const updateConnections = () => {
      const container = document.getElementById('fd-table');
      if (!container) return;
      const containerRects = Array.from(container.getClientRects());
      const rectFor = rect => {
        let cTop = containerRects[0].top;
        for (const cr of containerRects) {
          if (rect.bottom <= cr.bottom && rect.top >= cr.top) {
            cTop = cr.top;
            break;
          }
        }
        return rect.bottom - cTop;
      };
      const linkGroups = {};
      const rendered = Array.from(entryRefs.current.keys());
      rendered.forEach(idx => {
        const entry = entries[idx];
        if (entry && entry.linkId) {
          (linkGroups[entry.linkId] = linkGroups[entry.linkId] || []).push(idx);
        }
      });
      const conns = [];
      Object.entries(linkGroups).forEach(([id, arr]) => {
        if (arr.length >= 2) {
          const sorted = arr.slice().sort((a, b) => a - b);
          const startEl = entryRefs.current[sorted[0]];
          const endEl = entryRefs.current[sorted[sorted.length - 1]];
          if (startEl && endEl) {
            const sRect = startEl.getBoundingClientRect();
            const eRect = endEl.getBoundingClientRect();
            const startB = rectFor(sRect);
            const endB = rectFor(eRect);
            const cross = [];
            for (let i = 1; i < sorted.length - 1; i++) {
              const midEl = entryRefs.current[sorted[i]];
              if (midEl) {
                const mRect = midEl.getBoundingClientRect();
                const midB = rectFor(mRect);
                cross.push(midB - startB);
              }
            }
            conns.push({
              id,
              top: startB - 8,
              bottom: endB - 8,
              cross,
            });
          }
        }
      });
      // Offset overlapping lines - shorter connections use inner lanes
      const sortedConns = conns
        .slice()
        .sort((a, b) => {
          const lenDiff = (a.bottom - a.top) - (b.bottom - b.top);
          return lenDiff !== 0 ? lenDiff : a.top - b.top;
        });
      const active = [];
      sortedConns.forEach((c) => {
        let lane = 0;
        while (active.some((a) => a.lane === lane && !(c.bottom < a.top || c.top > a.bottom))) {
          lane++;
        }
        c.lane = lane;
        active.push(c);
      });
      setConnections(sortedConns);
    };
    updateConnections();
    window.addEventListener('scroll', updateConnections);
    window.addEventListener('resize', updateConnections);
    window.addEventListener('beforeprint', updateConnections);
    window.addEventListener('afterprint', updateConnections);
    return () => {
      window.removeEventListener('scroll', updateConnections);
      window.removeEventListener('resize', updateConnections);
      window.removeEventListener('beforeprint', updateConnections);
      window.removeEventListener('afterprint', updateConnections);
    };
  }, [entries, searchTerm, displayCount, collapsedDays, extraFlag]);

  return connections;
}
