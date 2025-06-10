import { useLayoutEffect, useState } from 'react';

export default function useConnections(entries, searchTerm, displayCount, collapsedDays, entryRefs, extraFlag) {
  const [connections, setConnections] = useState([]);
  const [maxLane, setMaxLane] = useState(0);

  useLayoutEffect(() => {
    const updateConnections = () => {
      const container = document.getElementById('fd-table');
      if (!container) return;
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
            const cRect = container.getBoundingClientRect();
            const sRect = startEl.getBoundingClientRect();
            const eRect = endEl.getBoundingClientRect();
            const cross = [];
            for (let i = 1; i < sorted.length - 1; i++) {
              const midEl = entryRefs.current[sorted[i]];
              if (midEl) {
                const mRect = midEl.getBoundingClientRect();
                cross.push(mRect.bottom - sRect.bottom);
              }
            }
            conns.push({
              id,
              top: sRect.bottom - cRect.top - 8,
              bottom: eRect.bottom - cRect.top - 8,
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
      setMaxLane(sortedConns.reduce((m, c) => Math.max(m, c.lane), 0));
    };
    updateConnections();
    window.addEventListener('scroll', updateConnections);
    window.addEventListener('resize', updateConnections);
    return () => {
      window.removeEventListener('scroll', updateConnections);
      window.removeEventListener('resize', updateConnections);
    };
  }, [entries, searchTerm, displayCount, collapsedDays, extraFlag]);

  return { connections, maxLane };
}
