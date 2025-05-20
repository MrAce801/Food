import React, { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// --- Styles ausgelagert ---
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
    border: "1px solid #ccc"
  },
  smallInput: {
    flex: 1,
    padding: "8px 12px",
    fontSize: 16,
    WebkitTextSizeAdjust: "100%",
    borderRadius: 6,
    border: "1px solid #ccc"
  },
  textarea: {
    width: "100%",
    padding: "8px",
    fontSize: 14,
    borderRadius: 6,
    border: "1px solid #ccc",
    marginTop: 8,
    resize: "vertical",
    overflowWrap: "break-word",
    whiteSpace: "pre-wrap"
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
    fontSize: 14,
    borderRadius: 6,
    border: 0,
    background: bg,
    color: "#fff",
    cursor: "pointer"
  }),
  entryCard: dark => ({
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    background: dark ? "#2a2a32" : "#fff",
    boxShadow: "0 1px 4px #0002"
  }),
  toast: {
    position: "fixed",
    top: 16,
    right: 16,
    background: "#333",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: 4,
    opacity: 0.9
  },
  backButton: {
    padding: "6px 12px",
    fontSize: 14,
    borderRadius: 6,
    border: 0,
    background: "#1976d2",
    color: "#fff",
    cursor: "pointer"
  }
};

// --- Symptom-Farb-Mapping ---
const SYMPTOM_COLOR_MAP = {
  Bauchschmerzen: "#D0E1F9",
  Durchfall: "#D6EAE0",
  Blähungen: "#E4D9F0",
  Hautausschlag: "#F0D9D9",
  Juckreiz: "#F5F3D1",
  "Schwellung am Gaumen": "#F6E0B5",
  "Schleim im Hals": "#D9F2F9",
  Niesen: "#FBF7D6",
  Kopfschmerzen: "#D9EAF9",
  "Rötung Haut": "#F2D9DB"
};

// --- UI-Komponenten ---
const PdfButton = ({ onClick }) => (
  <button onClick={onClick} title="Export PDF" style={styles.buttonSecondary("#d32f2f")}>
    PDF
  </button>
);
const InsightsButton = ({ onClick }) => (
  <button onClick={onClick} title="Insights" style={styles.buttonSecondary("#1976d2")}>
    Insights
  </button>
);
const BackButton = ({ onClick }) => (
  <button onClick={onClick} title="Zurück" style={styles.backButton}>
    ← Zurück
  </button>
);
const CameraButton = ({ onClick }) => (
  <button
    onClick={onClick}
    title="Foto"
    style={{
      width: 36,
      height: 36,
      borderRadius: 8,
      border: 0,
      background: "#247be5",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer"
    }}
  >
    📷
  </button>
);
const ImgStack = ({ imgs, onDelete }) => (
  <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
    {imgs.map((src, i) => (
      <div
        key={i}
        style={{
          position: "relative",
          marginLeft: i ? -12 : 0,
          zIndex: imgs.length - i
        }}
      >
        <img
          src={src}
          alt=""
          style={{
            width: 40,
            height: 40,
            objectFit: "cover",
            borderRadius: 6,
            border: "2px solid #fff",
            boxShadow: "0 1px 4px #0003"
          }}
        />
        {onDelete && (
          <span
            onClick={() => onDelete(i)}
            style={{
              position: "absolute",
              top: -6,
              right: -6,
              background: "#c00",
              color: "#fff",
              borderRadius: "50%",
              width: 18,
              height: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              cursor: "pointer"
            }}
          >
            ×
          </span>
        )}
      </div>
    ))}
  </div>
);
const SymTag = ({ txt, time }) => {
  const bg = SYMPTOM_COLOR_MAP[txt] || "#fafafa";
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: bg,
        color: "#1a1f3d",
        borderRadius: 6,
        padding: "5px 10px",
        margin: "3px 4px 3px 0",
        fontSize: 14,
        overflowWrap: "break-word",
        whiteSpace: "normal"
      }}
    >
      {txt}{" "}
      <span style={{ marginLeft: 6, fontSize: 12, opacity: 0.8 }}>
        {time === 0 ? "sofort" : `nach ${time} min`}
      </span>
    </div>
  );
};

// --- Konstanten ---
const SYMPTOM_CHOICES = [
  "Bauchschmerzen",
  "Durchfall",
  "Blähungen",
  "Hautausschlag",
  "Juckreiz",
  "Schwellung am Gaumen",
  "Schleim im Hals",
  "Niesen",
  "Kopfschmerzen",
  "Rötung Haut"
];
const TIME_CHOICES = [
  { label: "sofort", value: 0 },
  { label: "nach 5 min", value: 5 },
  { label: "nach 10 min", value: 10 },
  { label: "nach 15 min", value: 15 },
  { label: "nach 30 min", value: 30 },
  { label: "nach 45 min", value: 45 },
  { label: "nach 60 min", value: 60 },
  { label: "nach 90 min", value: 90 },
  { label: "nach 180 min", value: 180 }
];
const now = () => {
  const d = new Date();
  return `${d.toLocaleDateString()} ${d
    .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
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
    <div>
      <h2 style={{ textAlign: "center", margin: "16px 0" }}>Insights</h2>
      {sorted.length === 0 && <p>Keine Symptome erfasst.</p>}
      {sorted.map(([symptom, data]) => (
        <div key={symptom} style={{ marginBottom: 24 }}>
          <h3>
            {symptom} ({data.count})
          </h3>
          <ul>
            {Object.entries(data.foods)
              .sort((a, b) => b[1] - a[1])
              .map(([food, cnt]) => (
                <li key={food}>
                  {food}: {cnt}
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// --- Haupt-Komponente ---
export default function App() {
  const [dark, setDark] = useState(false);
  const [view, setView] = useState("diary");
  const [entries, setEntries] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("fd-entries") || "[]").map(e => ({
        ...e,
        comment: e.comment || ""
      }));
    } catch {
      return [];
    }
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [displayCount, setDisplayCount] = useState(20);
  const [newForm, setNewForm] = useState(() => {
    const saved = localStorage.getItem("fd-form-new");
    return saved
      ? JSON.parse(saved)
      : { food: "", imgs: [], symptomInput: "", symptomTime: 0 };
  });
  const [newSymptoms, setNewSymptoms] = useState([]);
  const fileRefNew = useRef();
  const [toasts, setToasts] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);

  // Persist states
  useEffect(() => {
    localStorage.setItem("fd-entries", JSON.stringify(entries));
  }, [entries]);
  useEffect(() => {
    localStorage.setItem("fd-form-new", JSON.stringify(newForm));
  }, [newForm]);
  useEffect(() => {
    const saved = localStorage.getItem("fd-theme");
    setDark(
      saved
        ? saved === "dark"
        : window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }, []);
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

  // Toast helper
  const addToast = msg => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2000);
  };

  // File upload for new entries
  const handleNewFile = e => {
    Array.from(e.target.files || []).forEach(f => {
      const reader = new FileReader();
      reader.onload = () =>
        setNewForm(fm => ({ ...fm, imgs: [...fm.imgs, reader.result] }));
      reader.readAsDataURL(f);
    });
    e.target.value = "";
    addToast("Foto hinzugefügt");
  };
  const removeNewImg = idx => {
    setNewForm(fm => ({
      ...fm,
      imgs: fm.imgs.filter((_, i) => i !== idx)
    }));
    addToast("Foto gelöscht");
  };

  // Symptoms handling
  const addNewSymptom = () => {
    if (!newForm.symptomInput.trim()) return;
    setNewSymptoms(s => [
      ...s,
      { txt: newForm.symptomInput.trim(), time: newForm.symptomTime }
    ]);
    setNewForm(fm => ({ ...fm, symptomInput: "", symptomTime: 0 }));
  };
  const removeNewSymptom = idx => {
    setNewSymptoms(s => s.filter((_, i) => i !== idx));
  };

  // Add entry (fixed hanging)
  const addEntry = () => {
    if (!newForm.food.trim()) return;
    const entryDate = now();
    const entry = {
      food: newForm.food,
      imgs: newForm.imgs,
      symptoms: newSymptoms,
      comment: "",
      date: entryDate
    };
    setEntries(e => [entry, ...e]);
    setNewForm({ food: "", imgs: [], symptomInput: "", symptomTime: 0 });
    setNewSymptoms([]);
    addToast("Eintrag gespeichert");
  };

  // Group entries by day
  const filteredWithIdx = entries
    .map((e, idx) => ({ entry: e, idx }))
    .filter(({ entry }) =>
      entry.food.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.symptoms.some(s => s.txt.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  const toDisplay = filteredWithIdx.slice(0, displayCount);
  const grouped = toDisplay.reduce((acc, { entry, idx }) => {
    const day = entry.date.split(" ")[0];
    (acc[day] = acc[day] || []).push({ entry, idx });
    return acc;
  }, {});
  const dates = Object.keys(grouped).sort((a, b) =>
    new Date(b) - new Date(a)
  );

  // PDF export
  const handleExportPDF = async () => {
    const el = document.getElementById("fd-table");
    if (!el) return;
    const imgs = Array.from(el.querySelectorAll("img"));
    const originals = imgs.map(img => ({ w: img.style.width, h: img.style.height }));
    imgs.forEach(img => {
      img.style.width = "80px";
      img.style.height = "80px";
    });
    const canvas = await html2canvas(el, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "px", format: [canvas.width, canvas.height] });
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save("FoodDiary.pdf");
    originals.forEach((o, i) => {
      imgs[i].style.width = o.w;
      imgs[i].style.height = o.h;
    });
  };

  if (view === "insights") {
    return (
      <div style={styles.container(isMobile)}>
        {toasts.map(t => (
          <div key={t.id} style={styles.toast}>{t.msg}</div>
        ))}
        <div style={styles.topBar}>
          <BackButton onClick={() => setView("diary")} />
        </div>
        <Insights entries={entries} />
      </div>
    );
  }

  return (
    <div style={styles.container(isMobile)}>
      {toasts.map(t => (
        <div key={t.id} style={styles.toast}>{t.msg}</div>
      ))}
      <div style={styles.topBar}>
        <button
          onClick={() => setDark(d => !d)}
          style={{ ...styles.buttonSecondary("transparent"), fontSize: 24 }}
        >
          {dark ? "🌙" : "☀️"}
        </button>
        <div>
          <PdfButton onClick={handleExportPDF} />{" "}
          <InsightsButton onClick={() => setView("insights")} />
        </div>
      </div>

      <h2 style={styles.title}>Food Diary</h2>

      {/* Neuer Eintrag */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 48 }}>
          <input
            placeholder="Essen..."
            value={newForm.food}
            onChange={e => setNewForm(fm => ({ ...fm, food: e.target.value }))}
            style={styles.input}
          />
          <CameraButton onClick={() => fileRefNew.current?.click()} />
          <input
            ref={fileRefNew}
            type="file"
            accept="image/*"
            multiple
            capture={isMobile ? "environment" : undefined}
            onChange={handleNewFile}
            style={{ display: "none" }}
          />
        </div>
        {newForm.imgs.length > 0 && <ImgStack imgs={newForm.imgs} onDelete={removeNewImg} />}

        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            list="symptom-list"
            placeholder="Symptom..."
            value={newForm.symptomInput}
            onChange={e => setNewForm(fm => ({ ...fm, symptomInput: e.target.value }))}
            style={styles.smallInput}
          />
          <datalist id="symptom-list">
            {SYMPTOM_CHOICES.map(s => <option key={s} value={s} />)}
          </datalist>
          <select
            value={newForm.symptomTime}
            onChange={e => setNewForm(fm => ({ ...fm, symptomTime: Number(e.target.value) }))}
            style={styles.smallInput}
          >
            {TIME_CHOICES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <button onClick={addNewSymptom} style={styles.buttonSecondary("#247be5")}>+</button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 8 }}>
          {newSymptoms.map((s, i) => <SymTag key={i} txt={s.txt} time={s.time} />)}
        </div>

        <button
          onClick={addEntry}
          disabled={!newForm.food.trim()}
          style={{ ...styles.buttonPrimary, opacity: newForm.food.trim() ? 1 : 0.5 }}
        >
          Eintrag hinzufügen
        </button>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <input
            placeholder="Suche..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={styles.smallInput}
          />
          <button onClick={() => setDisplayCount(dc => dc + 20)} style={styles.buttonSecondary("#1976d2")}>
            Mehr laden
          </button>
        </div>
      </div>

      {/* Alle Einträge nach Tag gruppiert */}
      <div id="fd-table">
        {dates.map(day => (
          <div key={day}>
            <h3 style={{ marginTop: 24 }}>{day}</h3>
            {grouped[day].map(({ entry, idx }) => (
              <div key={idx} style={styles.entryCard(dark)}>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>{entry.date}</div>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{entry.food}</div>
                {entry.imgs.length > 0 && <ImgStack imgs={entry.imgs} />}
                <div style={{ display: "flex", flexWrap: "wrap", margin: "8px 0" }}>
                  {entry.symptoms.map((s, j) => <SymTag key={j} txt={s.txt} time={s.time} />)}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
