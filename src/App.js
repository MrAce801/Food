// --- IMPORTS ---
import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// --- STILDEFINITIONEN ---
const styles = {
  container: isMobile => ({
    maxWidth: 600,
    margin: "0 auto",
    padding: isMobile ? "0 12px" : "0 24px",
    overflowAnchor: "none"
  }),
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0"
  },
  title: {
    textAlign: "center",
    margin: "8px 0 24px",
    fontSize: 28,
    fontWeight: 700
  },
  input: {
    flex: 1,
    padding: "10px 12px",
    fontSize: 16,
    borderRadius: 6,
    border: "1px solid #ccc",
    boxSizing: "border-box",
  },
  smallInput: {
    padding: "8px 10px",
    fontSize: 16,
    WebkitTextSizeAdjust: "100%",
    borderRadius: 6,
    border: "1px solid #ccc",
    minWidth: '70px',
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: "8px",
    fontSize: 16,
    WebkitTextSizeAdjust: "100%",
    borderRadius: 6,
    border: "1px solid #ccc",
    marginTop: 8,
    resize: "none",
    overflow: "hidden",
    overflowWrap: "break-word",
    whiteSpace: "pre-wrap",
    boxSizing: "border-box"
  },
  buttonPrimary: {
    padding: "12px 0",
    fontSize: 16,
    borderRadius: 6,
    border: 0,
    background: "#388e3c",
    color: "#fff",
    cursor: "pointer",
    width: "100%"
  },
  buttonSecondary: bg => ({
    padding: "8px 16px",
    fontSize: 14, // Standard-Fontsize für secondary buttons
    borderRadius: 6,
    border: 0,
    background: bg,
    color: "#fff",
    cursor: "pointer"
  }),
  symptomAddButton: bg => ({
    padding: "3px 10px",
    fontSize: 16,
    borderRadius: 6,
    border: 0,
    background: bg,
    color: "#fff",
    cursor: "pointer",
    flexShrink: 0,
    boxSizing: 'border-box'
  }),
  entryCard: (dark, isSymptomOnly = false) => ({
    position: 'relative',
    marginBottom: 16,
    marginLeft: 20,
    padding: 12,
    borderRadius: 8,
    background: isSymptomOnly
      ? (dark ? "#3c3c46" : "#f0f0f5")
      : (dark ? "#2a2a32" : "#fff"),
    boxShadow: "0 1px 4px #0002",
  }),
  groupHeader: (isPdf) => ({
    fontSize: 18,
    fontWeight: 600,
    margin: isPdf ? "32px 0 12px" : "24px 0 8px",
    color: isPdf ? '#333' : undefined,
  }),
  dayCover: (dark) => ({
    fontSize: 18,
    fontWeight: 600,
    margin: "24px 0 8px",
    textAlign: 'center',
    padding: '12px 0',
    borderRadius: 8,
    background: dark ? '#3a3a42' : '#e0e0e0',
    cursor: 'pointer'
  }),
  toast: {
    position: "fixed",
    top: 16,
    right: 16,
    background: "#333",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: 4,
    opacity: 0.9,
    zIndex: 1000
  },
  backButton: {
    padding: "6px 12px",
    fontSize: 14,
    borderRadius: 6,
    border: 0,
    background: "#1976d2",
    color: "#fff",
    cursor: "pointer"
  },
  glassyIconButton: (dark) => ({
    background: dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
    border: dark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.1)',
    borderRadius: 6,
    padding: "6px 8px",
    cursor: "pointer",
    fontSize: 16,
    lineHeight: 1,
    color: dark ? '#f0f0f8' : '#333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
  rotatedIcon: {
    display: 'inline-block',
    transform: 'rotate(90deg)', // Zurück zur vorherigen Ausrichtung
  },
  actionMenu: (dark) => ({
    position: 'absolute',
    right: '12px',
    top: '44px',
    background: dark ? '#383840' : '#ffffff',
    borderRadius: 8,
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    padding: '8px',
    zIndex: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minWidth: '120px',
  }),
  actionMenuItem: (dark, isDestructive = false) => ({
    background: isDestructive ? (dark? '#8B0000' : '#d32f2f') : (dark ? '#4a4a52' : '#efefef'),
    color: '#fff',
    border: 'none',
    padding: '8px 12px',
    borderRadius: 4,
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    fontSize: '14px',
  }),
  tagMarkerBase: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    zIndex: 5,
  },
  tagMarkerOuter: (tagColor) => ({
    ...styles.tagMarkerBase,
    borderWidth: '0 0 28px 28px',
    borderColor: `transparent transparent ${tagColor} transparent`,
    cursor: 'pointer',
  }),
  tagMarkerInnerHint: (cardBgColor) => ({
    ...styles.tagMarkerBase,
    borderWidth: '0 0 16px 16px',
    borderColor: `transparent transparent ${cardBgColor} transparent`,
    pointerEvents: 'none',
    zIndex: 6,
  }),
  colorPickerPopup: (dark) => ({
    position: 'absolute',
    bottom: '30px',
    right: '5px',
    background: dark ? '#4a4a52' : '#fff',
    padding: '8px',
    borderRadius: '6px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
    zIndex: 30,
    display: 'flex',
    gap: '8px',
  }),
  colorPickerItem: (color, isActive, currentThemeDark) => ({
    width: '24px',
    height: '24px',
    backgroundColor: color,
    borderRadius: '4px',
    cursor: 'pointer',
    border: isActive ? (currentThemeDark ? '2px solid #FFFFFF' : '2px solid #000000') : '2px solid transparent',
    boxSizing: 'border-box',
  }),
  pinContainer: {
    position: 'absolute',
    left: '0px',
    top: 0,
    bottom: 0,
    width: '20px',
    pointerEvents: 'none',
  },
  pin: (selected) => ({
    position: 'absolute',
    top: '-8px',
    left: '-8px',
    width: '16px',
    height: '16px',
    transform: 'rotate(270deg)',
    cursor: 'pointer',
    pointerEvents: 'auto',
    zIndex: 5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    color: selected ? '#FBC02D' : '#c00',
  }),
  connectionSvg: {
    position: 'absolute',
    left: '13px',
    width: '20px',
    pointerEvents: 'none',
    overflow: 'visible',
  },
};

// --- GLOBALE KONSTANTEN & FARBMAPPINGS ---

const SYMPTOM_CHOICES = [
  "Bauchschmerzen","Durchfall","Blähungen","Hautausschlag",
  "Juckreiz","Schwellung am Gaumen","Schleim im Hals",
  "Niesen","Kopfschmerzen","Rötung Haut"
];
const TIME_CHOICES = [
  { label: "sofort", value: 0 }, { label: "nach 5 min", value: 5 },
  { label: "nach 10 min", value: 10 }, { label: "nach 15 min", value: 15 },
  { label: "nach 30 min", value: 30 }, { label: "nach 45 min", value: 45 },
  { label: "nach 60 min", value: 60 }, { label: "nach 1,5 h", value: 90 },
  { label: "nach 3 h", value: 180 }
];

const TAG_COLORS = {
  GREEN: 'green',
  RED: 'red',
  YELLOW: 'yellow',
  BROWN: '#c19a6b', // light brown for bowel movement
};
const TAG_COLOR_NAMES = {
  [TAG_COLORS.GREEN]: "Standard",
  [TAG_COLORS.RED]: "Symptome",
  [TAG_COLORS.YELLOW]: "Vorgeschichte",
  [TAG_COLORS.BROWN]: "Stuhlgang",
};

// --- HILFSFUNKTIONEN ---
function resizeToJpeg(file, maxWidth = 800) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = (e) => { console.error("FileReader Error:", e); reject(reader.error); };
    reader.onload = () => {
      const img = new Image();
      img.onerror = (e) => { console.error("Image Load Error:", e); reject(new Error("Bild konnte nicht als Bild interpretiert werden")); };
      img.onload = () => {
        try {
          const scale = Math.min(1, maxWidth / img.width);
          const w = img.width * scale;
          const h = img.height * scale;
          const c = document.createElement("canvas");
          c.width = w;
          c.height = h;
          const ctx = c.getContext("2d");
          if (!ctx) {
            console.error("Canvas Context nicht erhalten");
            return reject(new Error("Canvas Context Fehler"));
          }
          ctx.drawImage(img, 0, 0, w, h);
          resolve(c.toDataURL("image/jpeg", 0.8));
        } catch (canvasError) {
          console.error("Canvas Error:", canvasError);
          reject(new Error("Fehler bei der Bildverkleinerung (Canvas)"));
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

const getStrengthColor = (strengthVal) => {
    const s = parseInt(strengthVal);
    switch (s) {
        case 1: return 'hsl(120, 65%, 50%)';
        case 2: return 'hsl(35, 90%, 55%)';
        case 3: return 'hsl(0, 75%, 55%)';
        default:
            if (s && s >= 3) return 'hsl(0, 75%, 55%)';
            return 'hsl(120, 65%, 50%)';
    }
};

const now = () => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  // Force 24h format to ensure parseDateString works regardless of locale
  const time = d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${day}.${month}.${year} ${time}`;
};
const vibrate = (pattern) => {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch {}
};


const getTodayDateString = () => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
};

const parseDateString = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return new Date(0);
    const [datePart, timePart] = dateStr.split(' ');
    if (!datePart || !timePart) return new Date(0);
    const dateComponents = datePart.split('.').map(Number);
    const timeComponents = timePart.split(':').map(Number);
    if (dateComponents.length !== 3 || timeComponents.length !== 2) return new Date(0);
    if ([...dateComponents, ...timeComponents].some(isNaN)) return new Date(0);
    const [day, month, year] = dateComponents;
    const [hour, minute] = timeComponents;
    if (year < 1000 || year > 3000 || month < 1 || month > 12 || day < 1 || day > 31) return new Date(0);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return new Date(0);
    return new Date(year, month - 1, day, hour, minute);
};

const toDateTimePickerFormat = (displayDateStr) => {
    if (!displayDateStr || typeof displayDateStr !== 'string') return "";
    const [datePart, timePart] = displayDateStr.split(' ');
    if (!datePart || !timePart) return "";
    const dateComponents = datePart.split('.');
    if (dateComponents.length !== 3) return "";
    const [day, month, year] = dateComponents.map(s => String(s).padStart(2,'0'));
    const timeParts = timePart.split(':').map(s => String(s).padStart(2,'0'));
    if (timeParts.length !== 2) return "";
    if (isNaN(parseInt(year)) || isNaN(parseInt(month)) || isNaN(parseInt(day)) || isNaN(parseInt(timeParts[0])) || isNaN(parseInt(timeParts[1]))) return "";
    if (parseInt(month) < 1 || parseInt(month) > 12 || parseInt(day) < 1 || parseInt(day) > 31 || parseInt(timeParts[0]) < 0 || parseInt(timeParts[0]) > 23 || parseInt(timeParts[1]) < 0 || parseInt(timeParts[1]) > 59) return "";
    return `${year}-${month}-${day}T${timeParts[0]}:${timeParts[1]}`;
};

const fromDateTimePickerFormat = (pickerDateStr) => {
    if (!pickerDateStr || typeof pickerDateStr !== 'string') return "";
    const [datePart, timePart] = pickerDateStr.split('T');
    if (!datePart || !timePart) return "";
    const dateComponents = datePart.split('-');
    if (dateComponents.length !== 3) return "";
    const [year, month, day] = dateComponents;
    const timeParts = timePart.split(':');
    if (timeParts.length !== 2) return "";
    if (isNaN(parseInt(year)) || isNaN(parseInt(month)) || isNaN(parseInt(day)) || isNaN(parseInt(timeParts[0])) || isNaN(parseInt(timeParts[1]))) return "";
    if (parseInt(month) < 1 || parseInt(month) > 12 || parseInt(day) < 1 || parseInt(day) > 31 || parseInt(timeParts[0]) < 0 || parseInt(timeParts[0]) > 23 || parseInt(timeParts[1]) < 0 || parseInt(timeParts[1]) > 59) return "";
    return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year} ${String(timeParts[0]).padStart(2, '0')}:${String(timeParts[1]).padStart(2, '0')}`;
};

const sortSymptomsByTime = (symptoms) => {
    return [...symptoms].sort((a, b) => {
        const tA = typeof a.time === 'number' ? a.time : parseFloat(a.time) || 0;
        const tB = typeof b.time === 'number' ? b.time : parseFloat(b.time) || 0;
        if (tA === tB) return (a.txt || '').localeCompare(b.txt || '');
        return tA - tB;
    });
};

// --- UI UTILITY KOMPONENTEN ---
const PdfButton = ({ onClick }) => (
  <button onClick={onClick} className="haptic" title="Export PDF" style={styles.buttonSecondary("#d32f2f")}>
    PDF
  </button>
);
const InsightsButton = ({ onClick }) => (
  <button onClick={onClick} className="haptic" title="Insights" style={styles.buttonSecondary("#1976d2")}>
    Insights
  </button>
);
const BackButton = ({ onClick }) => (
  <button onClick={onClick} className="haptic" title="Zurück" style={styles.backButton}>← Zurück</button>
);
const CameraButton = ({ onClick }) => (
  <button onClick={onClick} className="haptic" title="Foto" style={{
    width: 36, height: 36, borderRadius: 6, border: 0,
    background: "#247be5", display: "flex", alignItems: "center",
    justifyContent: "center", cursor: "pointer"
  }}>📷</button>
);
const ImgStack = ({ imgs, onDelete }) => (
  <div className="img-stack-container" style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
    {imgs.map((src, i) => (
      <div key={i} className="img-stack-item" style={{ position: "relative", marginLeft: i ? -12 : 0, zIndex: imgs.length - i }}>
        <img
          src={src}
          alt={`entry_image_${i}`}
          className="fade-img"
          style={{
            width: 40, height: 40, objectFit: "cover",
            borderRadius: 6, border: "2px solid #fff",
            boxShadow: "0 1px 4px #0003",
            opacity: 0,
            transition: 'opacity 0.3s ease'
          }}
          onLoad={e => { e.currentTarget.style.opacity = 1; }}
          onError={e => { e.currentTarget.style.display = "none"; }}
        />
        {onDelete && (
          <span onClick={() => onDelete(i)} style={{
            position: "absolute", top: -6, right: -6,
            background: "#c00", color: "#fff",
            borderRadius: "50%", width: 18, height: 18,
            display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 12,
            cursor: "pointer"
          }}>×</span>
        )}
      </div>
    ))}
  </div>
);

const SymTag = ({ txt, time, strength, dark, onDel, onClick }) => {
  const tagBackgroundColor = "#fafafa"; // Einheitliche Farbe für alle Symptome
  const tagTextColor = "#1a1f3d";
  const displayStrength = Math.min(parseInt(strength) || 1, 3);

  return (
    <div onClick={onClick} style={{
      display: "inline-flex", alignItems: "center",
      background: tagBackgroundColor,
      color: tagTextColor,
      borderRadius: 6, padding: "6px 10px",
      margin: "3px 4px 3px 0", fontSize: 14,
      cursor: onClick ? "pointer" : "default",
      overflowWrap: "break-word", whiteSpace: "normal"
    }}>
      {strength && (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: '#333333',
            fontSize: '10px',
            fontWeight: 'bold',
            marginRight: '5px',
            lineHeight: 1,
            flexShrink: 0,
            border: `2px solid ${getStrengthColor(displayStrength)}`,
            boxSizing: 'border-box',
        }}>
            {displayStrength}
        </span>
      )}
      {txt}
      <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.8, flexShrink: 0 }}>
        {TIME_CHOICES.find(t => t.value === time)?.label || `${time} min`}
      </span>
      {onDel && (
        <span onClick={e => { e.stopPropagation(); onDel(); }} style={{
          marginLeft: 8, cursor: "pointer",
          fontSize: 16,
          color: "#c00",
          fontWeight: 700
        }}>×</span>
      )}
    </div>
  );
};

// --- DATENVERARBEITUNGSKOMPONENTEN (z.B. Insights) ---
function Insights({ entries }) {
  const map = {};
  entries.forEach(e => {
    (e.symptoms || []).forEach(s => {
      if (!map[s.txt]) map[s.txt] = { count: 0, foods: {} };
      map[s.txt].count++;
      const foodKey = e.food || "(Kein Essen)";
      map[s.txt].foods[foodKey] = (map[s.txt].foods[foodKey] || 0) + 1;
    });
  });
  const sorted = Object.entries(map).sort((a, b) => b[1].count - a[1].count);
  return (
    <div>
      <h2 style={{ textAlign: "center", margin: "16px 0" }}>Insights</h2>
      {sorted.length === 0 && <p>Keine Symptome erfasst.</p>}
      {sorted.map(([symptom, data]) => (
        <div key={symptom} style={{ marginBottom: 24 }}>
          <h3>{symptom} ({data.count})</h3>
          <ul>
            {Object.entries(data.foods).sort((a, b) => b[1] - a[1]).map(([food, cnt]) => (
              <li key={food}>{food}: {cnt}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// --- HAUPTANWENDUNGSKOMPONENTE: App ---
export default function App() {
  // --- STATE VARIABLEN ---
  const [dark, setDark] = useState(false);
  const [view, setView] = useState("diary");
  const [entries, setEntries] = useState(() => {
    try {
      const loadedEntries = JSON.parse(localStorage.getItem("fd-entries") || "[]")
        .map(e => ({
          ...e,
          comment: e.comment || "",
          food: e.food || "",
          symptoms: (e.symptoms || []).map(s => ({ ...s, strength: Math.min(parseInt(s.strength) || 1, 3) })),
          tagColor: e.tagColor || TAG_COLORS.GREEN,
          linkId: e.linkId || null,
        }));
      return loadedEntries.sort((a, b) => parseDateString(b.date) - parseDateString(a.date));
    } catch { return []; }
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [displayCount, setDisplayCount] = useState(20);
  const [newForm, setNewForm] = useState(() => {
    const saved = localStorage.getItem("fd-form-new");
    const initialForm = { food: "", imgs: [], symptomInput: "", symptomTime: 0, symptomStrength: 1 };
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            const strength = Math.min(parseInt(parsed.symptomStrength) || 1, 3);
            return { ...initialForm, ...parsed, symptomStrength: strength };
        } catch { return initialForm; }
    }
    return initialForm;
  });
  const [newSymptoms, setNewSymptoms] = useState([]);
  const fileRefNew = useRef();
  const [editingIdx, setEditingIdx] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [noteOpenIdx, setNoteOpenIdx] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const fileRefEdit = useRef();
  const [toasts, setToasts] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);
  const [actionMenuOpenForIdx, setActionMenuOpenForIdx] = useState(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [colorPickerOpenForIdx, setColorPickerOpenForIdx] = useState(null);
  const [collapsedDays, setCollapsedDays] = useState(new Set());
  const [linkingIdx, setLinkingIdx] = useState(null);
  const entryRefs = useRef([]);
  const [connections, setConnections] = useState([]);

  // --- EFFECT HOOKS ---
  useEffect(() => {
    const saved = localStorage.getItem("fd-theme");
    setDark(saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("fd-entries", JSON.stringify(entries));
    } catch (e) {
      if (e.name === 'QuotaExceededError' ||
          e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
          (e.code && (e.code === 22 || e.code === 1014))) {
        console.error("LocalStorage Quota Exceeded:", e);
        addToast("Speicherlimit erreicht! Neue Einträge können evtl. nicht gespeichert werden.");
      } else {
        console.error("Fehler beim Speichern der Einträge in localStorage:", e);
        addToast("Ein Fehler ist beim Speichern der Daten aufgetreten.");
      }
    }
  }, [entries]);

  useEffect(() => {
    localStorage.setItem("fd-form-new", JSON.stringify(newForm));
  }, [newForm]);

  useEffect(() => {
    document.body.style.background = dark ? "#22222a" : "#f4f7fc";
    document.body.style.color = dark ? "#f0f0f8" : "#111";
    localStorage.setItem("fd-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (editingIdx !== null && !isExportingPdf) {
      document.getElementById(`entry-card-${editingIdx}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [editingIdx, isExportingPdf]);

  useEffect(() => {
    const today = getTodayDateString();
    setCollapsedDays(prev => {
      const newSet = new Set(prev);
      entries.forEach(e => {
        const day = e.date.split(' ')[0];
        if (day !== today && !prev.has(day)) {
          newSet.add(day);
        }
      });
      return newSet;
    });
  }, [entries]);

  // Automatisches Nachladen alter Einträge beim Scrollen
  useEffect(() => {
    const handleScroll = () => {
      const total = entries.filter(e =>
        (e.food && e.food.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.symptoms || []).some(s => s.txt.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.comment && e.comment.toLowerCase().includes(searchTerm.toLowerCase()))
      ).length;

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100) {
        setDisplayCount(dc => dc >= total ? dc : Math.min(dc + 20, total));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [entries, searchTerm]);

  useEffect(() => {
    if (noteOpenIdx !== null) {
      const ta = document.getElementById(`note-textarea-${noteOpenIdx}`);
      if (ta) {
        ta.style.height = 'auto';
        ta.style.height = `${ta.scrollHeight}px`;
      }
    }
  }, [noteOpenIdx, noteDraft]);

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
          const startEl = entryRefs.current[arr[0]];
          const endEl = entryRefs.current[arr[1]];
          if (startEl && endEl) {
            const cRect = container.getBoundingClientRect();
            const sRect = startEl.getBoundingClientRect();
            const eRect = endEl.getBoundingClientRect();
            conns.push({
              id,
              top: sRect.top - cRect.top + 8,
              bottom: eRect.top - cRect.top + 8,
            });
          }
        }
      });
      setConnections(conns);
    };
    updateConnections();
    window.addEventListener('scroll', updateConnections);
    window.addEventListener('resize', updateConnections);
    return () => {
      window.removeEventListener('scroll', updateConnections);
      window.removeEventListener('resize', updateConnections);
    };
  }, [entries, searchTerm, displayCount, collapsedDays]);

  // --- KERNLOGIK & EVENT HANDLER ---
  const handleFocus = e => e.target.scrollIntoView({ behavior: "smooth", block: "center" });

  const addToast = msg => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2000);
  };

  const toggleDay = day => {
    setCollapsedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(day)) newSet.delete(day); else newSet.add(day);
      return newSet;
    });
  };

  const handleExportPDF = async () => {
    const el = document.getElementById("fd-table");
    if (!el) return;

    setActionMenuOpenForIdx(null);
    setColorPickerOpenForIdx(null);
    setNoteOpenIdx(null);

    addToast("PDF Export wird vorbereitet...");
    setIsExportingPdf(true);

    await new Promise(resolve => setTimeout(resolve, 300));

    const imgStackItemOriginalStyles = [];
    const individualImageOriginalStyles = [];
    let prevClassName = '';

    try {
      const imgStackContainers = Array.from(el.querySelectorAll(".img-stack-container"));
      imgStackContainers.forEach(stackContainer => {
        const childrenItems = Array.from(stackContainer.children).filter(child => child.classList.contains("img-stack-item"));
        childrenItems.forEach((item, index) => {
          imgStackItemOriginalStyles.push({ el: item, marginLeft: item.style.marginLeft, zIndex: item.style.zIndex });
          item.style.marginLeft = index > 0 ? "4px" : "0px";
          item.style.zIndex = "auto";
        });
      });

      const allImagesInTable = Array.from(el.querySelectorAll("#fd-table img"));
      allImagesInTable.forEach(img => {
        individualImageOriginalStyles.push({ el: img, width: img.style.width, height: img.style.height, objectFit: img.style.objectFit });
        img.style.width = "120px";
        img.style.height = "120px";
        img.style.objectFit = "contain";
      });

      // Temporäres hexagonales Hintergrundmuster für den PDF-Export setzen
      prevClassName = el.className;
      el.classList.add('pdf-hex-bg');

      const canvas = await html2canvas(el, {
        scale: 2,
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
        useCORS: true,
        backgroundColor: null,
      });

      // Ursprüngliche Klassen wiederherstellen
      el.className = prevClassName;
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ unit: "px", format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save("FoodDiary.pdf");
      addToast("PDF erfolgreich exportiert!");

    } catch (error) {
      console.error("Fehler beim Erstellen des PDFs:", error);
      addToast("Fehler beim PDF-Export.");
    } finally {
      imgStackItemOriginalStyles.forEach(orig => {
        orig.el.style.marginLeft = orig.marginLeft;
        orig.el.style.zIndex = orig.zIndex;
      });
      individualImageOriginalStyles.forEach(orig => {
        orig.el.style.width = orig.width;
        orig.el.style.height = orig.height;
        orig.el.style.objectFit = orig.objectFit;
      });
      if (prevClassName) el.className = prevClassName;
      setIsExportingPdf(false);
    }
  };

  const handleNewFile = async e => {
    for (let file of Array.from(e.target.files || [])) {
      try {
        if (file.size > 5 * 1024 * 1024) throw new Error("Datei zu groß (max 5MB)");
        const smallB64 = await resizeToJpeg(file, 800);
        setNewForm(fm => ({ ...fm, imgs: [...fm.imgs, smallB64] }));
        addToast("Foto hinzugefügt (verkleinert)");
      } catch (err) {
        console.error("Fehler beim Hinzufügen des Bildes (neuer Eintrag):", err);
        addToast(err.message || "Ungültiges oder zu großes Bild");
      }
    }
    if (e.target) e.target.value = "";
  };
  const removeNewImg = idx => {
    setNewForm(fm => ({ ...fm, imgs: fm.imgs.filter((_, i) => i !== idx) }));
    addToast("Foto gelöscht");
  };

  const handleEditFile = async e => {
    if (!editForm) return;
    for (let file of Array.from(e.target.files || [])) {
      try {
        if (file.size > 5 * 1024 * 1024) throw new Error("Datei zu groß (max 5MB)");
        const smallB64 = await resizeToJpeg(file, 800);
        setEditForm(fm => ({ ...fm, imgs: [...fm.imgs, smallB64] }));
        addToast("Foto hinzugefügt (verkleinert)");
      } catch (err) {
        console.error("Fehler beim Hinzufügen des Bildes (Eintrag bearbeiten):", err);
        addToast(err.message || "Ungültiges oder zu großes Bild");
      }
    }
    if (e.target) e.target.value = "";
  };
  const removeEditImg = idx => {
    setEditForm(fm => ({ ...fm, imgs: fm.imgs.filter((_, i) => i !== idx) }));
    addToast("Foto gelöscht");
  };

  const addNewSymptom = () => {
    if (!newForm.symptomInput.trim()) return;
    setNewSymptoms(s => sortSymptomsByTime([
        ...s,
        {
            txt: newForm.symptomInput.trim(),
            time: newForm.symptomTime,
            strength: newForm.symptomStrength
        }
    ]));
    setNewForm(fm => ({ ...fm, symptomInput: "", symptomTime: 0, symptomStrength: 1 }));
    vibrate(20);
  };
  const removeNewSymptom = idx => setNewSymptoms(s => s.filter((_, i) => i !== idx));

  const addEntry = () => {
    if (!newForm.food.trim() && newSymptoms.length === 0) return;
    const entry = {
      food: newForm.food.trim(),
      imgs: newForm.imgs,
      symptoms: sortSymptomsByTime(newSymptoms),
      comment: "",
      date: now(),
      tagColor: TAG_COLORS.GREEN,
      linkId: null,
    };
    setEntries(prevEntries =>
      [...prevEntries, entry].sort((a, b) => parseDateString(b.date) - parseDateString(a.date))
    );
    setNewForm({ food: "", imgs: [], symptomInput: "", symptomTime: 0, symptomStrength: 1 });
    setNewSymptoms([]);
    addToast("Eintrag gespeichert");
    vibrate(50);
  };

  const startEdit = i => {
    const e = entries[i];
    setEditingIdx(i);
    setEditForm({
        food: e.food,
        imgs: [...e.imgs],
        symptoms: (e.symptoms || []).map(s => ({ ...s, strength: Math.min(parseInt(s.strength) || 1, 3) })),
        symptomInput: "",
        symptomTime: 0,
        newSymptomStrength: 1,
        date: toDateTimePickerFormat(e.date),
        linkId: e.linkId || null
    });
    setActionMenuOpenForIdx(null);
    setColorPickerOpenForIdx(null);
    setNoteOpenIdx(null);
  };
  const cancelEdit = () => {
    setEditingIdx(null);
    setEditForm(null);
    setActionMenuOpenForIdx(null);
  };

  const addEditSymptom = () => {
    if (!editForm || !editForm.symptomInput.trim()) return;
    setEditForm(fm => ({
        ...fm,
        symptoms: sortSymptomsByTime([
            ...fm.symptoms,
            {
                txt: fm.symptomInput.trim(),
                time: fm.symptomTime,
                strength: fm.newSymptomStrength
            }
        ]),
        symptomInput: "",
        symptomTime: 0,
        newSymptomStrength: 1
    }));
  };
  const removeEditSymptom = idx => setEditForm(fm => ({
      ...fm,
      symptoms: fm.symptoms.filter((_, i) => i !== idx)
  }));

  const saveEdit = () => {
    if (!editForm) return;
    const displayDateToSave = fromDateTimePickerFormat(editForm.date);
    if (!displayDateToSave) { addToast("Ungültiges Datum/Zeit Format. Bitte prüfen."); return; }

    const pendingSymptom = editForm.symptomInput.trim()
      ? {
          txt: editForm.symptomInput.trim(),
          time: editForm.symptomTime,
          strength: editForm.newSymptomStrength,
        }
      : null;

    const symptomsToSave = [
      ...editForm.symptoms,
      ...(pendingSymptom ? [pendingSymptom] : [])
    ].map(s => ({ ...s, strength: Math.min(parseInt(s.strength) || 1, 3) }));

    setEntries(prevEntries =>
      prevEntries.map((ent, j) =>
        j === editingIdx
        ? {
            ...ent,
            food: editForm.food.trim(),
            imgs: editForm.imgs,
            symptoms: sortSymptomsByTime(symptomsToSave),
            date: displayDateToSave,
            linkId: editForm.linkId || null
          }
        : ent
      ).sort((a, b) => parseDateString(b.date) - parseDateString(a.date))
    );
    cancelEdit();
    addToast("Eintrag aktualisiert");
    vibrate(30);
  };
  const deleteEntry = i => {
    setEntries(e => e.filter((_, j) => j !== i));
    if (editingIdx === i) cancelEdit();
    setActionMenuOpenForIdx(null);
    setColorPickerOpenForIdx(null);
    setNoteOpenIdx(null);
    addToast("Eintrag gelöscht");
    vibrate(100);
  };

  const toggleNote = idx => {
    setNoteOpenIdx(prevOpenIdx => {
        if (prevOpenIdx === idx) {
            return null;
        } else {
            setNoteDraft(entries[idx].comment || "");
            setActionMenuOpenForIdx(null);
            setColorPickerOpenForIdx(null);
            return idx;
        }
    });
  };
  const saveNote = idx => {
    setEntries(e => e.map((ent, j) => j === idx ? { ...ent, comment: noteDraft } : ent));
    setNoteOpenIdx(null);
    addToast("Notiz gespeichert");
  };

  const handleTagColorChange = (entryIdx, newColor) => {
    setEntries(prevEntries =>
        prevEntries.map((entry, i) =>
            i === entryIdx ? { ...entry, tagColor: newColor } : entry
        )
    );
    const colorName = TAG_COLOR_NAMES[newColor] || newColor;
    addToast(`Markierung auf "${colorName}" geändert.`);
    setColorPickerOpenForIdx(null);
  };

  const handlePinClick = (idx) => {
    if (linkingIdx === null) {
      const group = entries[idx].linkId;
      if (group) {
        setEntries(prev => prev.map(e => e.linkId === group ? { ...e, linkId: null } : e));
      } else {
        setLinkingIdx(idx);
      }
    } else {
      if (idx === linkingIdx) { setLinkingIdx(null); return; }
      const groupId = `g-${Date.now()}`;
      setEntries(prev => prev.map((e, i) =>
        (i === linkingIdx || i === idx) ? { ...e, linkId: groupId } : e
      ));
      setLinkingIdx(null);
    }
  };

  const handleContainerClick = (e) => {
      if (actionMenuOpenForIdx !== null) {
          const triggerClicked = e.target.closest(`#action-menu-trigger-${actionMenuOpenForIdx}`);
          const menuClicked = e.target.closest(`#action-menu-content-${actionMenuOpenForIdx}`);
          if (!triggerClicked && !menuClicked) {
              setActionMenuOpenForIdx(null);
          }
      }
      if (noteOpenIdx !== null) {
          const noteTextareaClicked = e.target.closest(`#note-textarea-${noteOpenIdx}`);
          const noteSaveButtonClicked = e.target.closest(`#note-save-button-${noteOpenIdx}`);
          const noteIconButtonClicked = e.target.closest(`#note-icon-button-${noteOpenIdx}`);
          const displayedNoteTextTrigger = entries[noteOpenIdx]?.comment && e.target.closest(`#displayed-note-text-${noteOpenIdx}`);
          if (!noteTextareaClicked && !noteSaveButtonClicked && !noteIconButtonClicked && !displayedNoteTextTrigger) {
              setNoteOpenIdx(null);
          }
      }
      if (colorPickerOpenForIdx !== null) {
          const pickerTriggerClicked = e.target.closest(`#tag-marker-${colorPickerOpenForIdx}`);
          const pickerContentClicked = e.target.closest(`#color-picker-popup-${colorPickerOpenForIdx}`);
          if (!pickerTriggerClicked && !pickerContentClicked) {
              setColorPickerOpenForIdx(null);
          }
      }
      if (linkingIdx !== null) {
          const pinClicked = e.target.closest('.entry-pin');
          if (!pinClicked) {
              setLinkingIdx(null);
          }
      }
  };

  // --- DATENVORBEREITUNG FÜR DIE ANZEIGE ---
  const filteredWithIdx = entries.map((e, idx) => ({ entry: e, idx }))
    .filter(({ entry }) =>
      (entry.food && entry.food.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (entry.symptoms || []).some(s => s.txt.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (entry.comment && entry.comment.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  const entriesToRenderForUiOrPdf = isExportingPdf ? filteredWithIdx : filteredWithIdx.slice(0, displayCount);

  const grouped = entriesToRenderForUiOrPdf.reduce((acc, { entry, idx }) => {
    const day = entry.date.split(" ")[0];
    (acc[day] = acc[day] || []).push({ entry, idx });
    return acc;
  }, {});
  const dates = Object.keys(grouped)
    .sort((a,b) => parseDateString(grouped[b][0].entry.date) - parseDateString(grouped[a][0].entry.date));


  // --- JSX RENDERING LOGIK ---
  if (view === "insights") {
    return (
      <div style={styles.container(isMobile)} onClick={handleContainerClick}>
        {toasts.map(t => <div key={t.id} className="toast-fade" style={styles.toast}>{t.msg}</div>)}
        <div style={styles.topBar}><BackButton onClick={() => setView("diary")} /></div>
        <Insights entries={entries} />
      </div>
    );
  }

  return (
    <div style={styles.container(isMobile)} onClick={handleContainerClick}>
      {toasts.map(t => <div key={t.id} className="toast-fade" style={styles.toast}>{t.msg}</div>)}
      <div style={styles.topBar}>
        <button onClick={() => setDark(d => !d)} style={{ ...styles.buttonSecondary("transparent"), fontSize: 24, color: dark ? '#f0f0f8' : '#111' }} title="Theme wechseln">
          {dark ? "🌙" : "☀️"}
        </button>
        <div>
          <PdfButton onClick={handleExportPDF} />{" "}
          <InsightsButton onClick={() => setView("insights")} />
        </div>
      </div>
      <h2 style={styles.title}>Food Diary</h2>

      {/* Neuer Eintrag Formular */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <input placeholder="Essen..." value={newForm.food} onChange={e => setNewForm(fm => ({ ...fm, food: e.target.value }))} onFocus={handleFocus} style={styles.input} />
          <CameraButton onClick={() => fileRefNew.current?.click()} />
          <input ref={fileRefNew} type="file" accept="image/*" multiple capture={isMobile ? "environment" : undefined} onChange={handleNewFile} style={{ display: "none" }} />
        </div>
        {newForm.imgs.length > 0 && <ImgStack imgs={newForm.imgs} onDelete={removeNewImg} />}

        <div style={{ marginTop: newForm.imgs.length > 0 ? 8 : 0, marginBottom: 8 }}>
          <input list="symptom-list" placeholder="Symptom..." value={newForm.symptomInput} onChange={e => setNewForm(fm => ({ ...fm, symptomInput: e.target.value }))} onFocus={handleFocus} style={{...styles.smallInput, width: '100%', marginBottom: '8px'}}/>
          <datalist id="symptom-list">{SYMPTOM_CHOICES.map(s => <option key={s} value={s} />)}</datalist>
          <div style={{ display: "flex", alignItems: "center", gap: '6px', flexWrap: 'nowrap' }}>
            <select value={newForm.symptomTime} onChange={e => setNewForm(fm => ({ ...fm, symptomTime: Number(e.target.value) }))} onFocus={handleFocus} style={{...styles.smallInput, width: '110px', flexShrink: 0 }}>
              {TIME_CHOICES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select value={newForm.symptomStrength} onChange={e => setNewForm(fm => ({ ...fm, symptomStrength: Number(e.target.value) }))} onFocus={handleFocus} style={{...styles.smallInput, width: '100px', flexShrink: 0 }}>
              {[1,2,3].map(n => <option key={n} value={n}>Stärke {n}</option>)}
            </select>
            <button
              onClick={addNewSymptom}
              style={styles.symptomAddButton("#388e3c")}
            >+</button>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 8 }}>
          {sortSymptomsByTime(newSymptoms).map((s, i) => (
            <SymTag key={i} txt={s.txt} time={s.time} strength={s.strength} dark={dark} onDel={() => removeNewSymptom(i)} />
          ))}
        </div>
        <button onClick={addEntry} disabled={!newForm.food.trim() && newSymptoms.length === 0} style={{ ...styles.buttonPrimary, opacity: (newForm.food.trim() || newSymptoms.length > 0) ? 1 : 0.5 }} >Eintrag hinzufügen</button>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <input placeholder="Suche..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{...styles.smallInput, flexGrow: 1}} />
          { !isExportingPdf && <button onClick={() => setDisplayCount(dc => dc + 20)} style={styles.buttonSecondary("#1976d2")}>Mehr laden</button> }
        </div>
      </div>

      {/* Eintragsliste */}
      <div id="fd-table" style={{position:'relative'}}>
        {connections.map(c => (
          <svg key={c.id} style={{...styles.connectionSvg, top: c.top, height: c.bottom - c.top}}>
            <path d={`M10 0 H0 V${c.bottom - c.top} H10`} stroke="#b22222" strokeWidth="2" fill="none" strokeDasharray="4 2" strokeLinecap="round" />
          </svg>
        ))}
        {dates.map(day => (
          <div key={day}>
            {collapsedDays.has(day) && !isExportingPdf ? (
              <div onClick={() => toggleDay(day)} style={styles.dayCover(dark)}>{day}</div>
            ) : (
              <React.Fragment>
                <div onClick={() => toggleDay(day)} style={styles.groupHeader(isExportingPdf)}>{day}</div>
                {grouped[day].map(({ entry, idx }, j) => {
              const isSymptomOnlyEntry = !entry.food && (entry.symptoms || []).length > 0;
              const sortedAllDisplay = sortSymptomsByTime(
                (entry.symptoms || []).map(s => ({
                  ...s,
                  strength: Math.min(parseInt(s.strength) || 1, 3)
                }))
              );

              const cardBackgroundColor = isSymptomOnlyEntry
                ? (dark ? styles.entryCard(dark, true).background : styles.entryCard(false, true).background)
                : (dark ? styles.entryCard(dark, false).background : styles.entryCard(false, false).background);
              
              const currentTagColor = entry.tagColor || TAG_COLORS.GREEN;

              return (
                <div ref={el => entryRefs.current[idx] = el} key={idx} id={`entry-card-${idx}`} style={styles.entryCard(dark, isSymptomOnlyEntry)}>
                  <div style={styles.pinContainer}>
                    <div
                      className="entry-pin"
                      onClick={(e) => { e.stopPropagation(); handlePinClick(idx); }}
                      style={styles.pin(linkingIdx === idx)}
                    >📌</div>
                  </div>
                  {editingIdx === idx && !isExportingPdf ? (
                    <> {/* Editieransicht */}
                      <input type="datetime-local" value={editForm.date} onChange={e => setEditForm(fm => ({ ...fm, date: e.target.value }))} style={{...styles.input, marginBottom: '12px', width: '100%'}} />
                      <input placeholder="Essen..." value={editForm.food} onChange={e => setEditForm(fm => ({ ...fm, food: e.target.value }))} onFocus={handleFocus} style={{...styles.input, width: '100%', marginBottom: '8px'}} />
                      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0" }}> <CameraButton onClick={() => fileRefEdit.current?.click()} /> <input ref={fileRefEdit} type="file" accept="image/*" multiple capture={isMobile ? "environment" : undefined} onChange={handleEditFile} style={{ display: "none" }} /> {editForm.imgs.length > 0 && <ImgStack imgs={editForm.imgs} onDelete={removeEditImg} />} </div>
                      
                      <div style={{ marginBottom: 12 }}>
                        <input list="symptom-list-edit" placeholder="Symptom hinzufügen..." value={editForm.symptomInput} onChange={e => setEditForm(fm => ({ ...fm, symptomInput: e.target.value }))} onFocus={handleFocus} style={{...styles.smallInput, width: '100%', marginBottom: '8px'}} />
                        <datalist id="symptom-list-edit">{SYMPTOM_CHOICES.map(s => <option key={s} value={s} />)}</datalist>
                        <div style={{ display: "flex", alignItems: "center", gap: '6px', flexWrap: 'nowrap' }}>
                          <select value={editForm.symptomTime} onChange={e => setEditForm(fm => ({ ...fm, symptomTime: Number(e.target.value) }))} onFocus={handleFocus} style={{...styles.smallInput, width: '110px', flexShrink:0 }}>
                            {TIME_CHOICES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                          <select value={editForm.newSymptomStrength} onChange={e => setEditForm(fm => ({ ...fm, newSymptomStrength: Number(e.target.value) }))} onFocus={handleFocus} style={{...styles.smallInput, width: '100px', flexShrink:0 }}>
                            {[1,2,3].map(n => <option key={n} value={n}>Stärke {n}</option>)}
                          </select>
                          <button
                            onClick={addEditSymptom}
                            style={styles.symptomAddButton("#388e3c")}
                          >+</button>
                        </div>
                      </div>

                      <div style={{ marginBottom: 8 }}>
                        {sortSymptomsByTime(editForm.symptoms).map((s, j) => (
                          <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'nowrap' }}>
                            <input
                              type="text"
                              list="symptom-list-edit"
                              value={s.txt}
                              onChange={e_text => setEditForm(fm => ({ ...fm, symptoms: fm.symptoms.map((sym, k) => k === j ? {...sym, txt: e_text.target.value} : sym) }))}
                              onFocus={handleFocus}
                              style={{...styles.smallInput, flexGrow: 1, marginRight: '6px'}}
                            />
                            <select value={s.time} onChange={e_select => setEditForm(fm => {
                                const updated = fm.symptoms.map((sym, k) => k === j ? {...sym, time: Number(e_select.target.value)} : sym);
                                return { ...fm, symptoms: sortSymptomsByTime(updated) };
                            })}
                              style={{...styles.smallInput, width: '37px', flexShrink: 0, fontSize: '16px', padding: '6px 2px' }}
                            >
                              {TIME_CHOICES.map(t => (<option key={t.value} value={t.value}>{t.value === 0 ? '0' : t.value}</option>))}
                            </select>
                            <select value={s.strength || 1} onChange={e_strength => setEditForm(fm => ({ ...fm, symptoms: fm.symptoms.map((sym, k) => k === j ? {...sym, strength: Number(e_strength.target.value)} : sym) }))}
                              style={{...styles.smallInput, width: '25px', flexShrink: 0, fontSize: '16px', padding: '6px 2px' }}
                            >
                              {[1,2,3].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                            <button onClick={() => removeEditSymptom(j)} title="Symptom löschen" style={{...styles.buttonSecondary("#d32f2f"), padding: '6px 10px', fontSize: 14, flexShrink: 0, lineHeight: '1.2' }} >×</button>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 5, marginTop: '16px' }}>
                        <button onClick={saveEdit} style={styles.buttonSecondary("#1976d2")}>Speichern</button>
                        <button onClick={cancelEdit} style={styles.buttonSecondary("#888")}>Abbrechen</button>
                      </div>
                    </>
                  ) : (
                    <> {/* Anzeigeansicht */}
                      {!isExportingPdf && (
                        <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, display: 'flex', gap: '6px' }}>
                          <button
                            id={`note-icon-button-${idx}`}
                            onClick={(e) => { e.stopPropagation(); toggleNote(idx); }}
                            style={{...styles.glassyIconButton(dark), padding: '6px'}}
                            title="Notiz"
                          >🗒️</button>
                          <button
                            id={`action-menu-trigger-${idx}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionMenuOpenForIdx(actionMenuOpenForIdx === idx ? null : idx);
                              setNoteOpenIdx(null);
                              setColorPickerOpenForIdx(null);
                            }}
                            style={{...styles.glassyIconButton(dark), padding: '6px'}}
                            title="Aktionen"
                          >
                            <span style={styles.rotatedIcon}>✏️</span>
                          </button>
                        </div>
                      )}

                      <div style={{ fontSize:12, opacity:0.7, marginBottom:4, marginRight: '65px', color: isExportingPdf ? '#fafafa' : (dark ? '#cccccc' : '#444444') }}>{entry.date}</div>
                      <div style={{ fontSize:18, fontWeight:600, marginBottom:8, marginRight: '65px', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
                        {entry.food || (isSymptomOnlyEntry ? "Nur Symptome" : "(Kein Essen)") }
                      </div>

                      {entry.imgs.length>0 && <ImgStack imgs={entry.imgs}/>}
                      <div style={{ display:"flex", flexWrap:"wrap", margin:"8px 0 0" }}>
                        {sortedAllDisplay.map((s,j) => (
                          <SymTag key={j} txt={s.txt} time={s.time} strength={s.strength} dark={dark}/>
                        ))}
                      </div>

                      {actionMenuOpenForIdx === idx && !isExportingPdf && (
                        <div id={`action-menu-content-${idx}`} style={styles.actionMenu(dark)} onClick={e => e.stopPropagation()}>
                            <button onClick={() => { startEdit(idx); }} style={styles.actionMenuItem(dark)} > Bearbeiten </button>
                            <button onClick={() => { if (window.confirm("Möchten Sie diesen Eintrag wirklich löschen?")) { deleteEntry(idx); } else { setActionMenuOpenForIdx(null); } }} style={styles.actionMenuItem(dark, true)} > Löschen </button>
                        </div>
                      )}

                      {noteOpenIdx === idx && !isExportingPdf && (
                        <div onClick={e => e.stopPropagation()} style={{marginTop: '8px', zIndex: 15 }}>
                          <textarea
                            id={`note-textarea-${idx}`}
                            value={noteDraft}
                            onChange={e => {
                              setNoteDraft(e.target.value);
                              e.target.style.height = 'auto';
                              e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                            placeholder="Notiz..."
                            style={{...styles.textarea, fontSize: '16px'}}
                          />
                          <button id={`note-save-button-${idx}`} onClick={() => saveNote(idx)} style={{ ...styles.buttonSecondary(dark ? '#555' : "#FBC02D"), color: dark ? '#fff' : '#333', marginTop: 8 }} >Notiz speichern</button>
                        </div>
                      )}
                      {entry.comment && noteOpenIdx !== idx && !isExportingPdf && (
                        <div
                          id={`displayed-note-text-${idx}`}
                          onClick={(e) => { e.stopPropagation(); toggleNote(idx);}}
                          style={{ marginTop: 8, background: dark ? "#3a3a42" : "#f0f0f5", padding: "6px 8px", borderRadius: 4, color: dark ? "#e0e0e0" : "#333", overflowWrap: "break-word", whiteSpace: "pre-wrap", boxSizing: "border-box", cursor: 'pointer' }}
                        >
                          {entry.comment}
                        </div>
                      )}

                      {/* ANPASSUNG: Tag-Markierung jetzt auch im PDF sichtbar, außer Farbauswahl-Popup */}
                      <> {/* Wrapper für die Markierungsteile */}
                        <div
                          id={`tag-marker-${idx}`}
                          style={styles.tagMarkerOuter(currentTagColor)}
                          onClick={(e) => {
                            // Click-Handler nur aktiv, wenn nicht im PDF-Export
                            if (isExportingPdf) return;
                            e.stopPropagation();
                            setColorPickerOpenForIdx(colorPickerOpenForIdx === idx ? null : idx);
                            setActionMenuOpenForIdx(null);
                            setNoteOpenIdx(null);
                          }}
                          title={!isExportingPdf ? `Markierung: ${TAG_COLOR_NAMES[currentTagColor] || 'Unbekannt'}. Klicken zum Ändern.` : `Markierung: ${TAG_COLOR_NAMES[currentTagColor] || 'Unbekannt'}`}
                        />
                        <div style={styles.tagMarkerInnerHint(cardBackgroundColor)} />
                      
                        {/* Farbauswahl-Popup bleibt nur im UI, nicht im PDF */}
                        {!isExportingPdf && colorPickerOpenForIdx === idx && (
                          <div 
                            id={`color-picker-popup-${idx}`}
                            style={styles.colorPickerPopup(dark)} 
                            onClick={e => e.stopPropagation()}
                          >
                            {[TAG_COLORS.GREEN, TAG_COLORS.RED, TAG_COLORS.YELLOW, TAG_COLORS.BROWN].map(colorValue => (
                              <div
                                key={colorValue}
                                style={styles.colorPickerItem(colorValue, currentTagColor === colorValue, dark)}
                                title={TAG_COLOR_NAMES[colorValue] || colorValue}
                                onClick={() => handleTagColorChange(idx, colorValue)}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    </>
                  )}
                </div>
              );
              })}
              </React.Fragment>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
