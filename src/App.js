import React, { useState, useRef, useEffect, useCallback } from "react";
// jsPDF und html2canvas werden nun über CDN geladen und sind global verfügbar.
// Die Import-Statements werden entfernt, da sie nicht mehr benötigt werden und den Fehler verursachen.

// --- Konstanten für Symptom-Auswahl und Zeitangaben ---
const SYMPTOM_CHOICES = [
  "Bauchschmerzen", "Durchfall", "Blähungen", "Hautausschlag",
  "Juckreiz", "Schwellung am Gaumen", "Schleim im Hals",
  "Niesen", "Kopfschmerzen", "Rötung Haut"
];

const TIME_CHOICES = [
  { label: "sofort", value: 0 },
  { label: "nach 5 min", value: 5 },
  { label: "nach 10 min", value: 10 },
  { label: "nach 15 min", value: 15 },
  { label: "nach 30 min", value: 30 },
  { label: "nach 45 min", value: 45 },
  { label: "nach 60 min", value: 60 },
  { label: "nach 1,5 h", value: 90 },
  { label: "nach 3 h", value: 180 }
];

// --- Symptom-Farb-Mapping mit Pastelltönen (für dynamisches Styling) ---
const SYMPTOM_COLOR_MAP = {
  Bauchschmerzen: "#D0E1F9", // hellblau
  Durchfall: "#D6EAE0", // hellgrün
  Blähungen: "#E4D9F0", // flieder
  Hautausschlag: "#F0D9D9", // rosa
  Juckreiz: "#E1BEE7", // lavendel
  "Schwellung am Gaumen": "#FFCCBC", // pfirsich
  "Schleim im Hals": "#D9F2F9", // hellcyan
  Niesen: "#C8E6C9", // mint
  Kopfschmerzen: "#D9EAF9", // hellblau
  "Rötung Haut": "#F2D9DB" // zartrosa
};

// --- Hilfsfunktion für aktuelles Datum und Uhrzeit ---
const now = () => {
  const d = new Date();
  return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// --- Image-Helper: resize + convert to JPEG ---
// Reduziert die Größe eines Bildes und konvertiert es in JPEG, um die Dateigröße zu optimieren.
function resizeToJpeg(file, maxWidth = 800) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Bild lädt nicht"));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const w = img.width * scale;
        const h = img.height * scale;
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/jpeg", 0.8));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// --- UI-Komponenten ---

// Allgemeine Button-Komponente
const Button = ({ onClick, children, className = "", title = "" }) => (
  <button
    onClick={onClick}
    title={title}
    className={`px-4 py-2 rounded-md border-0 cursor-pointer text-white transition-colors duration-200 ${className}`}
  >
    {children}
  </button>
);

// PDF Export Button
const PdfButton = ({ onClick }) => (
  <Button onClick={onClick} title="Export PDF" className="bg-red-600 hover:bg-red-700">
    PDF
  </Button>
);

// Insights Button
const InsightsButton = ({ onClick }) => (
  <Button onClick={onClick} title="Insights" className="bg-blue-600 hover:bg-blue-700">
    Insights
  </Button>
);

// Zurück Button
const BackButton = ({ onClick }) => (
  <Button onClick={onClick} title="Zurück" className="bg-blue-600 hover:bg-blue-700">
    ← Zurück
  </Button>
);

// Kamera Button
const CameraButton = ({ onClick }) => (
  <Button onClick={onClick} title="Foto" className="w-9 h-9 rounded-md bg-blue-500 flex items-center justify-center text-lg hover:bg-blue-600">
    📷
  </Button>
);

// Bild-Stapel-Komponente
const ImgStack = ({ imgs, onDelete }) => (
  <div className="flex items-center mb-2">
    {imgs.map((src, i) => (
      <div key={i} className={`relative ${i ? '-ml-3' : 'ml-0'} z-[${imgs.length - i}]`}>
        <img
          src={src}
          alt=""
          className="w-10 h-10 object-cover rounded-md border-2 border-white shadow-md"
          onError={e => { e.currentTarget.style.display = "none"; }}
        />
        {onDelete && (
          <span
            onClick={() => onDelete(i)}
            className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full w-4.5 h-4.5 flex items-center justify-center text-xs cursor-pointer font-bold"
          >
            ×
          </span>
        )}
      </div>
    ))}
  </div>
);

// Symptom-Tag-Komponente
const SymTag = ({ txt, time, onDel, onClick }) => {
  const bgColor = SYMPTOM_COLOR_MAP[txt] || "#fafafa"; // Fallback-Farbe
  return (
    <div
      onClick={onClick}
      style={{ backgroundColor: bgColor }} // Dynamische Hintergrundfarbe
      className={`inline-flex items-center rounded-md px-2.5 py-1.5 m-0.5 text-sm cursor-pointer break-words whitespace-normal text-gray-900 ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      {txt}
      <span className="ml-1.5 text-xs opacity-80 flex-shrink-0">
        {TIME_CHOICES.find(t => t.value === time)?.label || `${time} min`}
      </span>
      {onDel && (
        <span
          onClick={e => { e.stopPropagation(); onDel(); }}
          className="ml-1.5 cursor-pointer text-base text-red-600 font-bold"
        >
          ×
        </span>
      )}
    </div>
  );
};

// Modal-Komponente
const Modal = ({ isOpen, onClose, title, children, onConfirm, confirmText, cancelText }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-semibold mb-4">{title}</h3>
        <div>{children}</div>
        <div className="mt-6 flex justify-end gap-3">
          <Button onClick={onClose} className="bg-gray-500 hover:bg-gray-600">
            {cancelText || "Abbrechen"}
          </Button>
          {onConfirm && (
            <Button onClick={onConfirm} className="bg-blue-600 hover:bg-blue-700">
              {confirmText || "Bestätigen"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Insights-Komponente ---
function Insights({ entries }) {
  const map = {};
  entries.forEach(e => {
    e.symptoms.forEach(s => {
      if (!map[s.txt]) map[s.txt] = { count: 0, foods: {} };
      map[s.txt].count++;
      map[s.txt].foods[e.food] = (map[s.txt].foods[e.food] || 0) + 1;
    });
  });
  const sorted = Object.entries(map).sort((a, b) => b[1].count - a[1].count);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-center my-4">Insights</h2>
      {sorted.length === 0 && <p className="text-center text-gray-600 dark:text-gray-400">Keine Symptome erfasst.</p>}
      {sorted.map(([symptom, data]) => (
        <div key={symptom} className="mb-6 bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-2">{symptom} ({data.count})</h3>
          <ul className="list-disc list-inside">
            {Object.entries(data.foods).sort((a, b) => b[1] - a[1]).map(([food, cnt]) => (
              <li key={food} className="text-gray-700 dark:text-gray-300">{food}: {cnt}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// --- Haupt-Komponente: App ---
export default function App() {
  // State für Dark Mode
  const [dark, setDark] = useState(false);
  // State für die aktuelle Ansicht (Tagebuch oder Insights)
  const [view, setView] = useState("diary");
  // State für alle Tagebuch-Einträge, initial aus localStorage geladen
  const [entries, setEntries] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("fd-entries") || "[]")
        .map(e => ({ ...e, comment: e.comment || "" })); // Sicherstellen, dass comment existiert
    } catch {
      console.error("Fehler beim Laden der Einträge aus localStorage.");
      return [];
    }
  });
  // State für Suchbegriff
  const [searchTerm, setSearchTerm] = useState("");
  // State für die Anzahl der angezeigten Einträge (für "Mehr laden")
  const [displayCount, setDisplayCount] = useState(20);
  // State für das Formular eines neuen Eintrags
  const [newForm, setNewForm] = useState(() => {
    const saved = localStorage.getItem("fd-form-new");
    return saved ? JSON.parse(saved) : { food: "", imgs: [], symptomInput: "", symptomTime: 0 };
  });
  // State für die Symptome des neuen Eintrags
  const [newSymptoms, setNewSymptoms] = useState([]);
  // Ref für den Date-Input des neuen Eintrags
  const fileRefNew = useRef();
  // State für den Index des Eintrags, der gerade bearbeitet wird
  const [editingIdx, setEditingIdx] = useState(null);
  // State für das Formular des bearbeiteten Eintrags
  const [editForm, setEditForm] = useState(null);
  // Ref für den Date-Input des bearbeiteten Eintrags
  const fileRefEdit = useRef();
  // State für den Index des Eintrags, dessen Notiz geöffnet ist
  const [noteOpenIdx, setNoteOpenIdx] = useState(null);
  // State für den Entwurf der Notiz
  const [noteDraft, setNoteDraft] = useState("");
  // State für Toast-Nachrichten
  const [toasts, setToasts] = useState([]);

  // Modal States
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalCallback, setConfirmModalCallback] = useState(null);
  const [confirmModalMessage, setConfirmModalMessage] = useState("");

  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [promptModalCallback, setPromptModalCallback] = useState(null);
  const [promptModalTitle, setPromptModalTitle] = useState("");
  const [promptModalDefaultValue, setPromptModalDefaultValue] = useState("");
  const [promptModalInput, setPromptModalInput] = useState("");


  // --- Effekte zur Persistenz und Theme-Anpassung ---
  // Lädt Theme-Einstellungen beim ersten Rendern
  useEffect(() => {
    const saved = localStorage.getItem("fd-theme");
    setDark(saved ?
      saved === "dark" :
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }, []);

  // Speichert Einträge in localStorage bei Änderungen
  useEffect(() => { localStorage.setItem("fd-entries", JSON.stringify(entries)); }, [entries]);
  // Speichert das Formular für neue Einträge in localStorage bei Änderungen
  useEffect(() => { localStorage.setItem("fd-form-new", JSON.stringify(newForm)); }, [newForm]);
  // Passt Body-Hintergrund und -Farbe an das Theme an und speichert es
  useEffect(() => {
    document.body.style.background = dark ? "#22222a" : "#f4f7fc";
    document.body.style.color = dark ? "#f0f0f8" : "#111";
    localStorage.setItem("fd-theme", dark ? "dark" : "light");
  }, [dark]);

  // Scrollt zu einem Element, wenn es fokussiert wird (für bessere UX auf mobilen Geräten)
  const handleFocus = useCallback(e => {
    e.target.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  // Scrollt zum bearbeiteten Eintrag, wenn der Bearbeitungsmodus aktiviert wird
  useEffect(() => {
    if (editingIdx !== null) {
      document.getElementById(`entry-${editingIdx}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [editingIdx]);

  // Fügt eine Toast-Nachricht hinzu
  const addToast = useCallback(msg => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2000);
  }, []);

  // --- Handler für PDF Export ---
  const handleExportPDF = async () => {
    // Überprüfen, ob jsPDF und html2canvas global verfügbar sind
    if (typeof window.jsPDF === 'undefined' || typeof window.html2canvas === 'undefined') {
      addToast("PDF-Export-Bibliotheken sind nicht geladen. Bitte überprüfen Sie Ihre HTML-Datei.");
      console.error("jsPDF or html2canvas not loaded. Please ensure CDN scripts are included in index.html.");
      return;
    }

    const el = document.getElementById("fd-table");
    if (!el) return;

    // Temporäre Größenanpassung der Bilder für den PDF-Export
    const imgs = Array.from(el.querySelectorAll("img"));
    const originals = imgs.map(img => ({ w: img.style.width, h: img.style.height }));
    imgs.forEach(img => { img.style.width = "80px"; img.style.height = "80px"; }); // Kleinere Bilder für PDF

    // Verwenden der globalen html2canvas-Funktion
    const canvas = await window.html2canvas(el, { scale: 2 }); // Höhere Skalierung für bessere Qualität
    const imgData = canvas.toDataURL("image/png");

    // PDF-Erstellung unter Verwendung der globalen jsPDF-Funktion
    const pdf = new window.jsPDF({ unit: "px", format: [canvas.width, canvas.height] });
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save("FoodDiary.pdf");

    // Ursprüngliche Bildgrößen wiederherstellen
    imgs.forEach((img, i) => {
      img.style.width = originals[i].w;
      img.style.height = originals[i].h;
    });
  };

  // --- Handler für Bild-Upload (neuer Eintrag) ---
  const handleNewFile = async e => {
    for (let file of Array.from(e.target.files || [])) {
      try {
        if (file.size > 2 * 1024 * 1024) throw new Error("Datei zu groß (max. 2MB)");
        const smallB64 = await resizeToJpeg(file, 800); // Bild verkleinern und konvertieren
        setNewForm(fm => ({ ...fm, imgs: [...fm.imgs, smallB64] }));
        addToast("Foto hinzugefügt (verkleinert)");
      } catch (error) {
        addToast(`Fehler: ${error.message || "Ungültiges oder zu großes Bild"}`);
      }
    }
    e.target.value = ""; // Input leeren, damit onChange auch bei gleicher Dateiauswahl feuert
  };

  // Entfernt ein Bild aus dem neuen Eintrag
  const removeNewImg = idx => {
    setNewForm(fm => ({ ...fm, imgs: fm.imgs.filter((_, i) => i !== idx) }));
    addToast("Foto gelöscht");
  };

  // --- Handler für Bild-Upload (bearbeiteter Eintrag) ---
  const handleEditFile = async e => {
    for (let file of Array.from(e.target.files || [])) {
      try {
        if (file.size > 2 * 1024 * 1024) throw new Error("Datei zu groß (max. 2MB)");
        const smallB64 = await resizeToJpeg(file, 800);
        setEditForm(fm => ({ ...fm, imgs: [...fm.imgs, smallB64] }));
        addToast("Foto hinzugefügt (verkleinert)");
      } catch (error) {
        addToast(`Fehler: ${error.message || "Ungültiges oder zu großes Bild"}`);
      }
    }
    e.target.value = "";
  };

  // Entfernt ein Bild aus dem bearbeiteten Eintrag
  const removeEditImg = idx => {
    setEditForm(fm => ({ ...fm, imgs: fm.imgs.filter((_, i) => i !== idx) }));
    addToast("Foto gelöscht");
  };

  // --- Handler für Symptome (neuer Eintrag) ---
  const addNewSymptom = () => {
    if (!newForm.symptomInput.trim()) return;
    setNewSymptoms(s => [...s, { txt: newForm.symptomInput.trim(), time: newForm.symptomTime }]);
    setNewForm(fm => ({ ...fm, symptomInput: "", symptomTime: 0 }));
  };

  // Entfernt ein Symptom aus dem neuen Eintrag
  const removeNewSymptom = idx => setNewSymptoms(s => s.filter((_, i) => i !== idx));

  // --- Handler für neuen Eintrag hinzufügen ---
  const addEntry = () => {
    if (!newForm.food.trim()) return;
    const entry = { food: newForm.food, imgs: newForm.imgs, symptoms: newSymptoms, comment: "", date: now() };
    setEntries(e => [entry, ...e]); // Neuen Eintrag am Anfang hinzufügen
    setNewForm({ food: "", imgs: [], symptomInput: "", symptomTime: 0 });
    setNewSymptoms([]);
    addToast("Eintrag gespeichert");
  };

  // --- Handler für Bearbeitungsmodus ---
  const startEdit = i => {
    const e = entries[i];
    setEditingIdx(i);
    setEditForm({ food: e.food, imgs: [...e.imgs], symptoms: [...e.symptoms], symptomInput: "", symptomTime: 0, date: e.date });
  };

  const cancelEdit = () => {
    setEditingIdx(null);
    setEditForm(null);
  };

  // Fügt ein Symptom zum bearbeiteten Eintrag hinzu
  const addEditSymptom = () => {
    if (!editForm.symptomInput.trim()) return;
    setEditForm(fm => ({ ...fm, symptoms: [...fm.symptoms, { txt: fm.symptomInput.trim(), time: fm.symptomTime }], symptomInput: "", symptomTime: 0 }));
  };

  // Entfernt ein Symptom aus dem bearbeiteten Eintrag
  const removeEditSymptom = idx => setEditForm(fm => ({ ...fm, symptoms: fm.symptoms.filter((_, i) => i !== idx) }));

  // Ändert die Zeit eines Symptoms (via Prompt Modal)
  const changeEditSymptomTime = idx => {
    const curr = editForm.symptoms[idx];
    setPromptModalTitle(`Neue Zeit für "${curr.txt}"`);
    setPromptModalDefaultValue(String(curr.time));
    setPromptModalInput(String(curr.time)); // Initialwert für das Inputfeld setzen
    setPromptModalCallback(() => (value) => {
      const t = Number(value);
      if (!isNaN(t)) {
        setEditForm(fm => {
          const arr = [...fm.symptoms];
          arr[idx] = { ...arr[idx], time: t };
          return { ...fm, symptoms: arr };
        });
      } else {
        addToast("Ungültige Zeitangabe.");
      }
      setIsPromptModalOpen(false);
    });
    setIsPromptModalOpen(true);
  };

  // Speichert die Änderungen eines bearbeiteten Eintrags
  const saveEdit = () => {
    setEntries(e => e.map((ent, j) => j === editingIdx
      ? { food: editForm.food, imgs: editForm.imgs, symptoms: editForm.symptoms, comment: ent.comment, date: editForm.date }
      : ent
    ));
    cancelEdit();
    addToast("Eintrag aktualisiert");
  };

  // Löscht einen Eintrag (via Confirm Modal)
  const handleDeleteEntry = (idx) => {
    setConfirmModalMessage("Möchten Sie diesen Eintrag wirklich löschen?");
    setConfirmModalCallback(() => () => {
      setEntries(e => e.filter((_, j) => j !== idx));
      if (editingIdx === idx) cancelEdit();
      addToast("Eintrag gelöscht");
      setIsConfirmModalOpen(false);
    });
    setIsConfirmModalOpen(true);
  };

  // --- Handler für Notizen ---
  const toggleNote = idx => {
    setNoteOpenIdx(noteOpenIdx === idx ? null : idx);
    if (noteOpenIdx !== idx) setNoteDraft(entries[idx].comment);
  };

  const saveNote = idx => {
    setEntries(e => e.map((ent, j) => j === idx ? { ...ent, comment: noteDraft } : ent));
    setNoteOpenIdx(null);
    addToast("Notiz gespeichert");
  };

  // --- Filter- und Gruppierungslogik ---
  const filteredWithIdx = entries.map((e, idx) => ({ entry: e, idx }))
    .filter(({ entry }) =>
      entry.food.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.symptoms.some(s => s.txt.toLowerCase().includes(searchTerm.toLowerCase())) ||
      entry.comment.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const toDisplay = filteredWithIdx.slice(0, displayCount);
  const grouped = toDisplay.reduce((acc, { entry, idx }) => {
    const day = entry.date.split(" ")[0]; // Datumsteil extrahieren
    (acc[day] = acc[day] || []).push({ entry, idx });
    return acc;
  }, {});
  const dates = Object.keys(grouped); // Sortierte Tage

  // --- Render-Logik für Insights-Ansicht ---
  if (view === "insights") {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-4 min-h-screen overflow-anchor-none">
        {/* Toast Nachrichten */}
        {toasts.map(t => (
          <div key={t.id} className="fixed top-4 right-4 bg-gray-800 text-white px-3 py-2 rounded-md opacity-90 z-50">
            {t.msg}
          </div>
        ))}
        <div className="flex justify-between items-center py-3">
          <BackButton onClick={() => setView("diary")} />
        </div>
        <Insights entries={entries} />
      </div>
    );
  }

  // --- Haupt-Render-Logik für Tagebuch-Ansicht ---
  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-4 min-h-screen overflow-anchor-none">
      {/* Toast Nachrichten */}
      {toasts.map(t => (
        <div key={t.id} className="fixed top-4 right-4 bg-gray-800 text-white px-3 py-2 rounded-md opacity-90 z-50">
          {t.msg}
        </div>
      ))}

      {/* Bestätigungs-Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Bestätigung"
        onConfirm={confirmModalCallback}
        confirmText="Löschen"
        cancelText="Abbrechen"
      >
        <p className="text-gray-700 dark:text-gray-300">{confirmModalMessage}</p>
      </Modal>

      {/* Prompt-Modal */}
      <Modal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        title={promptModalTitle}
        onConfirm={() => promptModalCallback(promptModalInput)}
        confirmText="OK"
        cancelText="Abbrechen"
      >
        <input
          type="text"
          value={promptModalInput}
          onChange={(e) => setPromptModalInput(e.target.value)}
          placeholder={promptModalDefaultValue}
          className="w-full p-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </Modal>

      {/* Top Bar mit Theme-Wechsel und Export-Buttons */}
      <div className="flex justify-between items-center py-3">
        <Button
          onClick={() => setDark(d => !d)}
          className="bg-transparent text-2xl p-0 hover:bg-gray-700 dark:hover:bg-gray-200 rounded-full w-10 h-10 flex items-center justify-center"
          title="Theme wechseln"
        >
          {dark ? "🌙" : "☀️"}
        </Button>
        <div className="flex space-x-2">
          <PdfButton onClick={handleExportPDF} />
          <InsightsButton onClick={() => setView("insights")} />
        </div>
      </div>

      <h1 className="text-3xl font-bold text-center my-2 sm:my-4">Food Diary</h1>

      {/* Neuer Eintrag Bereich */}
      <section className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Neuer Eintrag</h2>
        <div className="flex items-center gap-2 mb-6">
          <label htmlFor="new-food-input" className="sr-only">Essen</label>
          <input
            id="new-food-input"
            placeholder="Essen..."
            value={newForm.food}
            onChange={e => setNewForm(fm => ({ ...fm, food: e.target.value }))}
            onFocus={handleFocus}
            className="flex-1 p-2.5 text-base rounded-md border border-gray-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <CameraButton onClick={() => fileRefNew.current?.click()} />
          <input
            ref={fileRefNew}
            type="file"
            accept="image/*"
            multiple
            capture="environment" // Für mobile Geräte: direkter Kamerazugriff
            onChange={handleNewFile}
            className="hidden"
            aria-label="Foto hinzufügen"
          />
        </div>
        {newForm.imgs.length > 0 && <ImgStack imgs={newForm.imgs} onDelete={removeNewImg} />}

        <div className="flex items-center gap-2 mb-2">
          <label htmlFor="new-symptom-input" className="sr-only">Symptom</label>
          <input
            id="new-symptom-input"
            list="symptom-list"
            placeholder="Symptom..."
            value={newForm.symptomInput}
            onChange={e => setNewForm(fm => ({ ...fm, symptomInput: e.target.value }))}
            onFocus={handleFocus}
            className="flex-1 p-2 text-base rounded-md border border-gray-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <datalist id="symptom-list">
            {SYMPTOM_CHOICES.map(s => <option key={s} value={s} />)}
          </datalist>
          <label htmlFor="new-symptom-time" className="sr-only">Symptom Zeit</label>
          <select
            id="new-symptom-time"
            value={newForm.symptomTime}
            onChange={e => setNewForm(fm => ({ ...fm, symptomTime: Number(e.target.value) }))}
            onFocus={handleFocus}
            className="flex-1 p-2 text-base rounded-md border border-gray-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TIME_CHOICES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <Button onClick={addNewSymptom} className="bg-blue-500 hover:bg-blue-600 flex-shrink-0 text-xl font-bold w-9 h-9 flex items-center justify-center">
            +
          </Button>
        </div>

        <div className="flex flex-wrap mb-2">
          {newSymptoms.map((s, i) => (
            <SymTag key={i} txt={s.txt} time={s.time} onDel={() => removeNewSymptom(i)} />
          ))}
        </div>

        <Button
          onClick={addEntry}
          disabled={!newForm.food.trim()}
          className={`w-full py-3 text-lg font-semibold bg-green-600 hover:bg-green-700 ${!newForm.food.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Eintrag hinzufügen
        </Button>

        <div className="flex gap-2 mt-4">
          <label htmlFor="search-input" className="sr-only">Suche</label>
          <input
            id="search-input"
            placeholder="Suche..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1 p-2 text-base rounded-md border border-gray-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button onClick={() => setDisplayCount(dc => dc + 20)} className="bg-blue-600 hover:bg-blue-700">
            Mehr laden
          </Button>
        </div>
      </section>

      {/* Gruppierte Einträge */}
      <div id="fd-table">
        {dates.map(day => (
          <div key={day}>
            <h2 className="text-xl font-semibold my-4 text-gray-900 dark:text-gray-100">{day}</h2>
            {grouped[day].map(({ entry, idx }) => {
              const known = entry.symptoms.filter(s => SYMPTOM_CHOICES.includes(s.txt));
              const custom = entry.symptoms.filter(s => !SYMPTOM_CHOICES.includes(s.txt));
              const sortedAll = [...known.sort((a, b) => a.txt.localeCompare(b.txt)), ...custom];

              return (
                <div key={idx} id={`entry-${idx}`} className="mb-4 p-4 rounded-lg shadow-md bg-white dark:bg-gray-800">
                  {editingIdx === idx ? (
                    <>
                      <label htmlFor={`edit-date-${idx}`} className="sr-only">Datum & Uhrzeit</label>
                      <input
                        id={`edit-date-${idx}`}
                        value={editForm.date}
                        onChange={e => setEditForm(fm => ({ ...fm, date: e.target.value }))}
                        placeholder="Datum & Uhrzeit"
                        className="w-full p-2.5 text-base rounded-md border border-gray-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                      />
                      <label htmlFor={`edit-food-${idx}`} className="sr-only">Essen</label>
                      <input
                        id={`edit-food-${idx}`}
                        value={editForm.food}
                        onChange={e => setEditForm(fm => ({ ...fm, food: e.target.value }))}
                        onFocus={handleFocus}
                        className="w-full p-2.5 text-base rounded-md border border-gray-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                      />
                      <div className="flex items-center gap-2 my-2">
                        <CameraButton onClick={() => fileRefEdit.current?.click()} />
                        <input
                          ref={fileRefEdit}
                          type="file"
                          accept="image/*"
                          multiple
                          capture="environment"
                          onChange={handleEditFile}
                          className="hidden"
                          aria-label="Foto hinzufügen"
                        />
                        {editForm.imgs.length > 0 && <ImgStack imgs={editForm.imgs} onDelete={removeEditImg} />}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <label htmlFor={`edit-symptom-input-${idx}`} className="sr-only">Symptom</label>
                        <input
                          id={`edit-symptom-input-${idx}`}
                          list="symptom-list"
                          placeholder="Symptom..."
                          value={editForm.symptomInput}
                          onChange={e => setEditForm(fm => ({ ...fm, symptomInput: e.target.value }))}
                          onFocus={handleFocus}
                          className="flex-1 p-2 text-base rounded-md border border-gray-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <label htmlFor={`edit-symptom-time-${idx}`} className="sr-only">Symptom Zeit</label>
                        <select
                          id={`edit-symptom-time-${idx}`}
                          value={editForm.symptomTime}
                          onChange={e => setEditForm(fm => ({ ...fm, symptomTime: Number(e.target.value) }))}
                          onFocus={handleFocus}
                          className="flex-1 p-2 text-base rounded-md border border-gray-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {TIME_CHOICES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <Button onClick={addEditSymptom} className="bg-blue-500 hover:bg-blue-600 flex-shrink-0 text-xl font-bold w-9 h-9 flex items-center justify-center">
                          +
                        </Button>
                      </div>
                      <div className="flex flex-wrap mb-2">
                        {editForm.symptoms.map((s, j) => (
                          <SymTag
                            key={j}
                            txt={s.txt}
                            time={s.time}
                            onDel={() => removeEditSymptom(j)}
                            onClick={() => changeEditSymptomTime(j)}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button onClick={saveEdit} className="bg-blue-600 hover:bg-blue-700">Speichern</Button>
                        <Button onClick={cancelEdit} className="bg-gray-500 hover:bg-gray-600">Abbrechen</Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-xs opacity-70 mb-1 text-gray-700 dark:text-gray-300">{entry.date}</div>
                      <div className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">{entry.food}</div>
                      {entry.imgs.length > 0 && <ImgStack imgs={entry.imgs} />}
                      <div className="flex flex-wrap my-2 sm:my-4">
                        {sortedAll.map((s, j) => (
                          <SymTag key={j} txt={s.txt} time={s.time} />
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button onClick={() => startEdit(idx)} className="bg-blue-600 hover:bg-blue-700">Bearbeiten</Button>
                        <Button onClick={() => handleDeleteEntry(idx)} className="bg-red-600 hover:bg-red-700">Löschen</Button>
                        <span className="ml-auto">
                          <Button
                            onClick={() => toggleNote(idx)}
                            className={`w-9 h-9 rounded-md border border-yellow-300 text-base flex items-center justify-center ${entry.comment ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-yellow-400 hover:bg-yellow-500'}`}
                            title="Notiz"
                          >
                            🗒️
                          </Button>
                        </span>
                      </div>
                      {noteOpenIdx === idx && (
                        <div className="mt-2">
                          <label htmlFor={`note-textarea-${idx}`} className="sr-only">Notiz</label>
                          <textarea
                            id={`note-textarea-${idx}`}
                            value={noteDraft}
                            onChange={e => setNoteDraft(e.target.value)}
                            placeholder="Notiz..."
                            rows="3"
                            className="w-full p-2 text-base rounded-md border border-gray-300 mt-2 resize-y overflow-auto break-words whitespace-pre-wrap box-border bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <Button
                            onClick={() => saveNote(idx)}
                            className="bg-yellow-600 hover:bg-yellow-700 mt-2"
                          >
                            Speichern
                          </Button>
                        </div>
                      )}
                      {entry.comment && noteOpenIdx !== idx && (
                        <div className="mt-2 p-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-300 break-words whitespace-pre-wrap box-border">
                          {entry.comment}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
