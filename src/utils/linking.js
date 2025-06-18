export const dayOf = (entry) => entry.date.split(' ')[0];

export const entriesForDay = (entries, day) =>
  entries.filter(e => dayOf(e) === day);

export const getNextLinkId = (entries, day) => {
  const used = new Set(
    entriesForDay(entries, day)
      .map(e => e.linkId)
      .filter(id => id != null)
  );
  let id = 1;
  while (used.has(id)) id++;
  return id;
};

export const getExistingIdsForDay = (entries, day) => {
  const counts = {};
  entriesForDay(entries, day).forEach(e => {
    if (e.linkId != null) counts[e.linkId] = (counts[e.linkId] || 0) + 1;
  });
  return Object.entries(counts)
    .filter(([, c]) => c >= 2)
    .map(([id]) => Number(id))
    .sort((a, b) => a - b);
};
