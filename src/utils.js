// --- HILFSFUNKTIONEN ---
import { TAG_COLORS } from "./constants";
const MONTH_NAMES = {
  en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
  de: ["Januar","Februar","Mrz","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"]
};
function englishOrdinal(n){
  if(n%10===1&&n%100!==11) return "st";
  if(n%10===2&&n%100!==12) return "nd";
  if(n%10===3&&n%100!==13) return "rd";
  return "th";
}
function formatCollapsedDay(day, lang){
  const [d,m] = day.split(".");
  const dayNum = parseInt(d,10);
  const monthIdx = parseInt(m,10)-1;
  if(lang==="de") return `${dayNum}. ${MONTH_NAMES.de[monthIdx]}`;
  return `${dayNum}${englishOrdinal(dayNum)} of ${MONTH_NAMES.en[monthIdx]}`;
}

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
        if (tA === tB) {
            const sA = typeof a.strength === 'number' ? a.strength : parseInt(a.strength) || 0;
            const sB = typeof b.strength === 'number' ? b.strength : parseInt(b.strength) || 0;
            if (sA !== sB) return sA - sB;
            return (a.txt || '').localeCompare(b.txt || '');
        }
        return tA - tB;
    });
};
const determineTagColor = (food = "", symptoms = []) => {
  const trimmed = String(food).trim().toLowerCase();
  if (trimmed.startsWith("stuhl:")) return TAG_COLORS.BROWN;
  if (symptoms.length > 0) return TAG_COLORS.RED;
  return TAG_COLORS.GREEN;
};

const sortEntries = (a, b) => {
  const dateDiff = parseDateString(b.date) - parseDateString(a.date);
  if (dateDiff !== 0) return dateDiff;
  return (b.createdAt || 0) - (a.createdAt || 0);
};

const CATEGORY_ORDER = [
  TAG_COLORS.GREEN,
  TAG_COLORS.PURPLE,
  TAG_COLORS.RED,
  TAG_COLORS.BLUE,
  TAG_COLORS.BROWN,
  TAG_COLORS.YELLOW,
];

const sortEntriesByCategory = (a, b) => {
  const ca = CATEGORY_ORDER.indexOf(a.tagColor || TAG_COLORS.GREEN);
  const cb = CATEGORY_ORDER.indexOf(b.tagColor || TAG_COLORS.GREEN);
  if (ca !== cb) return ca - cb;
  return sortEntries(a, b);
};


export { resizeToJpeg, getStrengthColor, now, vibrate, getTodayDateString, parseDateString, toDateTimePickerFormat, fromDateTimePickerFormat, sortSymptomsByTime, determineTagColor, sortEntries, sortEntriesByCategory , formatCollapsedDay };
