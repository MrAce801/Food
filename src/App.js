import React, { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const SYMPTOM_CHOICES = [
  "Bauchschmerzen", "Durchfall", "Blähungen", "Hautausschlag",
  "Juckreiz", "Schwellung am Gaumen", "Schleim im Hals",
  "Niesen", "Kopfschmerzen", "Rötung Haut"
];
const TIMES = [0, 5, 10, 15, 30, 60];
const now = () => {
  const d = new Date();
  return (
    d.toLocaleDateString() +
    " " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
};

// Kamera-Button
const CameraButton = ({ onClick }) => (
  <button
    onClick={onClick}
    type="button"
    title="Foto aufnehmen/hochladen"
    style={{
      width: 34, height: 34, borderRadius: "50%", border: 0,
      background: "#247be5", display: "flex", alignItems: "center",
      justifyContent: "center", cursor: "pointer", marginLeft: 8
    }}
  >
    <svg width="22" height="22" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="16" fill="#247be5" />
      <circle cx="16" cy="16" r="7" fill="#fff" />
      <circle cx="16" cy="16" r="4" fill="#247be5" />
      <rect x="10" y="6" width="12" height="6" rx="3" fill="#fff" />
    </svg>
  </button>
);

// PDF-Button
const PdfButton = ({ onClick }) => (
  <button
    onClick={onClick}
    title="Export PDF"
    style={{
      background: "#d32f2f", color: "#fff", border: 0, borderRadius: 8,
      padding: "6px 18px", fontWeight: 600, fontSize: 16, cursor: "pointer",
      boxShadow: "0 1px 4px #0003"
    }}
  >
    PDF
  </button>
);

// Theme Switch
const ThemeSwitch = ({ dark, setDark }) => (
  <div style={{ height: 40, display: "flex", alignItems: "center", padding: "0 12px" }}>
    <button
      onClick={() => setDark(d => !d)}
      title="Theme wechseln"
      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24 }}
    >
      {dark ? "🌙" : "☀️"}
    </button>
  </div>
);

// Bild‐Stack (Vorschau)
const ImgStack = ({ imgs, onDelete }) => (
  <div style={{ display: "flex", alignItems: "center" }}>
    {imgs.map((src, i) => (
      <div key={i} style={{ position: "relative", marginLeft: i === 0 ? 0 : -12, zIndex: imgs.length - i }}>
        <img
          src={src}
          alt=""
          style={{
            width: 36, height: 36, objectFit: "cover", borderRadius: 8,
            border: "2px solid #fff", boxShadow: "0 1px 6px #0003",
          }}
        />
        {onDelete && (
          <span
            onClick={(e) => { e.stopPropagation(); onDelete(i); }}
            style={{
              position: "absolute", top: -6, right: -6, background: "#c00",
              color: "#fff", borderRadius: "50%", width: 18, height: 18,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, cursor: "pointer"
            }}
          >
            ×
          </span>
        )}
      </div>
    ))}
  </div>
);

// Symptom‐Tag
const SymTag = ({ txt, time, dark, onDel, onClick }) => (
  <div
    onClick={onClick}
    style={{
      display: "inline-flex", alignItems: "center",
      background: dark ? "#343445" : "#e8f0ff",
      color: dark ? "#f1f1f6" : "#1a1f3d",
      borderRadius: 6, padding: "5px 10px", margin: "3px 4px 3px 0",
      fontSize: 14, cursor: onClick ? "pointer" : "default",
      position: "relative"
    }}
  >
    {txt}
    <span style={{ marginLeft: 4, fontSize: 12, opacity: 0.8 }}>
      {time === 0 ? "direkt" : `+${time}min`}
    </span>
    {onDel && (
      <span
        onClick={(e) => { e.stopPropagation(); onDel(); }}
        style={{ marginLeft: 6, cursor: "pointer", fontSize: 16, color: "#c00", fontWeight: 700 }}
      >
        ×
      </span>
    )}
  </div>
);

export default function App() {
  const [dark, setDark] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const [entries, setEntries] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fd-entries") || "[]"); }
    catch { return []; }
  });
  const [editIdx, setEditIdx] = useState(null);
  const [form, setForm] = useState({
    food: "", foodImgs: [],
    symptomInput: "", symptomTime: 0,
    symptomDropdown: [], symptoms: []
  });
  const fileRef = useRef();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);

  // Persist
  useEffect(() => { localStorage.setItem("fd-entries", JSON.stringify(entries)); }, [entries]);
  useEffect(() => {
    document.body.style.background = dark ? "#22222a" : "#f4f7fc";
    document.body.style.color = dark ? "#f0f0f8" : "#111";
    localStorage.setItem("fd-theme", dark ? "dark" : "light");
  }, [dark]);

  // Responsive
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Handlers
  const resetForm = () => setForm({
    food: "", foodImgs: [],
    symptomInput: "", symptomTime: 0,
    symptomDropdown: [], symptoms: []
  });

  const handleFile = e => {
    const files = e.target.files;
    if (!files?.length) return;
    Array.from(files).forEach(f => {
      const r = new FileReader();
      r.onload = ev => {
        try {
          setForm(fm => ({ ...fm, foodImgs: [...fm.foodImgs, ev.target.result] }));
        } catch (err) {
          console.error("Bild konnte nicht geladen werden", err);
        }
      };
      r.readAsDataURL(f);
    });
    e.target.value = "";
  };

  const handleCameraClick = () => fileRef.current?.click();

  const handleSymptomDropdown = val => {
    setForm(fm => {
      const exists = fm.symptomDropdown.find(s => s.txt === val && s.time === fm.symptomTime);
      const list = exists
        ? fm.symptomDropdown.filter(s => !(s.txt === val && s.time === fm.symptomTime))
        : [...fm.symptomDropdown, { txt: val, time: fm.symptomTime }];
      return { ...fm, symptomDropdown: list };
    });
  };

  const handleAddSymptom = () => {
    if (form.symptomInput.trim()) {
      setForm(fm => ({
        ...fm,
        symptoms: [...fm.symptoms, { txt: fm.symptomInput.trim(), time: fm.symptomTime }],
        symptomInput: "", symptomDropdown: []
      }));
      return;
    }
    if (form.symptomDropdown.length) {
      setForm(fm => ({
        ...fm,
        symptoms: [
          ...fm.symptoms,
          ...fm.symptomDropdown.filter(s =>
            !fm.symptoms.some(ex => ex.txt === s.txt && ex.time === s.time)
          )
        ],
        symptomDropdown: []
      }));
    }
  };

  const handleRemoveSymptom = idx => {
    setForm(fm => ({ ...fm, symptoms: fm.symptoms.filter((_, i) => i !== idx) }));
  };

  const handleExportPDF = async () => {
    const el = document.getElementById("fd-table");
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2 });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "px", format: [canvas.width, canvas.height] });
    pdf.addImage(img, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save("FoodDiary.pdf");
  };

  const addEntry = () => {
    if (!form.food.trim()) return;
    if (editIdx !== null) {
      setEntries(en => en.map((e, i) => i === editIdx ? { ...form, date: e.date } : e));
      setEditIdx(null);
    } else {
      setEntries(en => [...en, { ...form, date: now() }]);
    }
    resetForm();
  };

  const handleEdit = i => {
    const e = entries[i];
    setForm({
      food: e.food, foodImgs: e.foodImgs,
      symptomInput: "", symptomTime: 0,
      symptomDropdown: [], symptoms: e.symptoms
    });
    setEditIdx(i);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = i => {
    setEntries(en => en.filter((_, j) => j !== i));
    resetForm();
    setEditIdx(null);
  };

  const handleImgDelete = idx => {
    setForm(fm => ({ ...fm, foodImgs: fm.foodImgs.filter((_, i) => i !== idx) }));
  };

  const changeSymptomTime = (idx) => {
    const current = form.symptoms[idx];
    const input = prompt(`Neue Zeit für "${current.txt}" in Minuten:`, current.time);
    const t = Number(input);
    if (!isNaN(t)) {
      setForm(fm => {
        const arr = [...fm.symptoms];
        arr[idx] = { ...arr[idx], time: t };
        return { ...fm, symptoms: arr };
      });
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto 40px", padding: isMobile ? "0 6px" : "0 24px" }}>
      <ThemeSwitch dark={dark} setDark={setDark} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>Food Diary</h2>
        <PdfButton onClick={handleExportPDF} />
      </div>

      {/* Formular */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 12 : 16, marginBottom: 14 }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <input
            placeholder="Essen..."
            value={form.food}
            onChange={e => setForm(fm => ({ ...fm, food: e.target.value }))}
            style={{ flex: 1, padding: "8px 12px", fontSize: 16, borderRadius: 4, border: "1px solid #ccc" }}
          />
          <CameraButton onClick={handleCameraClick} />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture
            multiple
            onChange={handleFile}
            style={{ display: "none" }}
          />
        </div>
        {form.foodImgs.length > 0 && <ImgStack imgs={form.foodImgs} onDelete={handleImgDelete} />}
      </div>

      {/* Symptome */}
      <div style={{ marginBottom: 14 }}>
        {/* Zeit für Schnellauswahl */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
          <select
            value={form.symptomTime}
            onChange={e => setForm(fm => ({ ...fm, symptomTime: Number(e.target.value) }))}
            style={{ padding: "6px 10px", fontSize: 14, borderRadius: 4, border: "1px solid #ccc", marginRight: 8 }}
          >
            {TIMES.map(t => (
              <option key={t} value={t}>{t === 0 ? "direkt" : `+${t}min`}</option>
            ))}
          </select>
          <span>für Schnellauswahl</span>
        </div>

        {/* Schnellauswahl */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
          {SYMPTOM_CHOICES.map(s => (
            <button
              key={s}
              onClick={() => handleSymptomDropdown(s)}
              style={{
                padding: "4px 8px", fontSize: 14, borderRadius: 4,
                border: form.symptomDropdown.some(x => x.txt === s && x.time === form.symptomTime)
                  ? "2px solid #247be5" : "1px solid #ccc",
                background: form.symptomDropdown.some(x => x.txt === s && x.time === form.symptomTime)
                  ? "#e8f0ff" : "#fff",
                cursor: "pointer"
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Vorschau Schnellauswahl */}
        {form.symptomDropdown.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <strong>Gewählte Symptome:</strong>
            <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap" }}>
              {form.symptomDropdown.map((s, i) => (
                <SymTag
                  key={i} txt={s.txt} time={s.time} dark={dark}
                  onDel={() => setForm(fm => ({
                    ...fm,
                    symptomDropdown: fm.symptomDropdown.filter((_, j) => j !== i)
                  }))}
                />
              ))}
            </div>
          </div>
        )}

        {/* Manueller Eintrag */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <input
            placeholder="Eigenes Symptom..."
            value={form.symptomInput}
            onChange={e => setForm(fm => ({ ...fm, symptomInput: e.target.value }))}
            style={{ flex: 1, padding: "6px 10px", fontSize: 14, borderRadius: 4, border: "1px solid #ccc" }}
          />
          <select
            value={form.symptomTime}
            onChange={e => setForm(fm => ({ ...fm, symptomTime: Number(e.target.value) }))}
            style={{ padding: "6px 10px", fontSize: 14, borderRadius: 4 }}
          >
            {TIMES.map(t => (
              <option key={t} value={t}>{t === 0 ? "direkt" : `+${t}min`}</option>
            ))}
          </select>
          <button
            onClick={handleAddSymptom}
            style={{
              padding: "6px 14px", fontSize: 14, borderRadius: 4,
              border: 0, background: "#247be5", color: "#fff", cursor: "pointer"
            }}
          >
            Hinzufügen
          </button>
        </div>

        {/* Bereits hinzugefügte Symptome (mit Klick zum Zeit ändern) */}
        {form.symptoms.length > 0 && (
          <div>
            <strong>Symptome im Eintrag:</strong>
            <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap" }}>
              {form.symptoms.map((s, i) => (
                <SymTag
                  key={i} txt={s.txt} time={s.time} dark={dark}
                  onDel={() => handleRemoveSymptom(i)}
                  onClick={editIdx !== null ? () => changeSymptomTime(i) : null}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={addEntry}
        style={{
          padding: "10px 18px", fontSize: 16, borderRadius: 6,
          border: 0, background: "#388e3c", color: "#fff", cursor: "pointer"
        }}
      >
        {editIdx !== null ? "Speichern" : "Eintrag hinzufügen"}
      </button>

      {/* Einträge-Liste */}
      <div id="fd-table" style={{ marginTop: 24 }}>
        {entries.map((e, i) => (
          <div
            key={i}
            style={{
              padding: 12, marginBottom: 12, borderRadius: 8,
              background: dark ? "#2a2a32" : "#fff",
              boxShadow: "0 1px 4px #0002",
              display: "flex", flexDirection: isMobile ? "column" : "row",
              justifyContent: "space-between", alignItems: "center", flexWrap: "wrap"
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>{e.date}</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{e.food}</div>
              {e.foodImgs.length > 0 && <ImgStack imgs={e.foodImgs} />}
              <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap" }}>
                {e.symptoms.map((s, j) => (
                  <SymTag key={j} txt={s.txt} time={s.time} dark={dark} />
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: isMobile ? 12 : 0 }}>
              <button
                onClick={() => handleEdit(i)}
                style={{
                  padding: "6px 12px", fontSize: 14, borderRadius: 4,
                  border: 0, background: "#1976d2", color: "#fff", cursor: "pointer"
                }}
              >
                Bearbeiten
              </button>
              <button
                onClick={() => handleDelete(i)}
                style={{
                  padding: "6px 12px", fontSize: 14, borderRadius: 4,
                  border: 0, background: "#d32f2f", color: "#fff", cursor: "pointer"
                }}
              >
                Löschen
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
