export function generateShareUrl(entries) {
  try {
    const json = JSON.stringify(entries);
    const encoded = btoa(unescape(encodeURIComponent(json)));
    return `${window.location.origin}${window.location.pathname}?data=${encoded}`;
  } catch {
    return '';
  }
}

export function loadEntriesFromQuery() {
  try {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('data');
    if (!encoded) return null;
    const json = decodeURIComponent(escape(atob(encoded)));
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
