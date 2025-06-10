import { useLayoutEffect, useState } from 'react';

export default function useConnections(entries, searchTerm, displayCount, collapsedDays, entryRefs, extraFlag) {
  const [connections, setConnections] = useState([]);

  useLayoutEffect(() => {
    const updateConnections = () => {
      const container = document.getElementById('fd-table');
      if (!container) return;
      const containerRects = Array.from(container.getClientRects());
      const offsetFor = y => {
        let cTop = containerRects[0].top;
        for (const cr of containerRects) {
          if (y <= cr.bottom && y >= cr.top) {
            cTop = cr.top;
            break;
          }
        }
        return y - cTop;
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
            const startPin = startEl.querySelector('.entry-pin');
            const endPin = endEl.querySelector('.entry-pin');
            if (!startPin || !endPin) return;
            const startRect = startPin.getBoundingClientRect();
            const endRect = endPin.getBoundingClientRect();
            const startY = startRect.top + startRect.height / 2;
            const endY = endRect.top + endRect.height / 2;
            const startOff = offsetFor(startY);
            const endOff = offsetFor(endY);
            const cross = [];
            for (let i = 1; i < sorted.length - 1; i++) {
              const midEl = entryRefs.current[sorted[i]];
              if (midEl) {
                const midPin = midEl.querySelector('.entry-pin');
                if (!midPin) continue;
                const midRect = midPin.getBoundingClientRect();
                const midY = midRect.top + midRect.height / 2;
                const midOff = offsetFor(midY);
                cross.push(midOff - startOff);
              }
            }
            conns.push({
              id,
              top: startOff,
              bottom: endOff,
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
