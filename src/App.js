import React, { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

const now = () => {
  const d = new Date();
  return d.toLocaleDateString() + " " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// --- Kleine UI-Komponenten ---

const ThemeSwitch = ({ dark, setDark }) => (
  <button
    onClick={() => setDark(d => !d)}
    title="Theme wechseln"
    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24 }}
  >
    {dark ? "🌙" : "☀️"}
  </button>
);

const PdfButton = ({ onClick }) => (
  <button
    onClick={onClick}
    title="Export PDF"
    style={{
      background: "#d32f2f", color: "#fff",
      border: 0, borderRadius: 6,
      padding: "6px 16px", fontWeight: 600,
      cursor: "pointer"
    }}
  >PDF</button>
);

const CameraButton = ({ onClick }) => (
  <button
    onClick={onClick}
    title="Foto aufnehmen/hochladen"
    style={{
      width: 36, height: 36, borderRadius: "50%",
      border: 0, background: "#247be5",
      display: "flex", alignItems: "center",
      justifyContent: "center", cursor: "pointer"
    }}
  >📷</button>
);

const ImgStack = ({ imgs, onDelete }) => (
  <div style={{ display: "flex", alignItems: "center" }}>
    {imgs.map((src, i) => (
      <div key={i} style={{ position: "relative", marginLeft: i === 0 ? 0 : -12, zIndex: imgs.length - i }}>
        <img
          src={src}
          alt=""
          style={{
            width: 40, height: 40,
            objectFit: "cover", borderRadius: 6,
            border: "2px solid #fff", boxShadow: "0 1px 4px #0003"
          }}
        />
        {onDelete && (
          <span
            onClick={e => { e.stopPropagation(); onDelete(i); }}
            style={{
              position: "absolute", top: -6, right: -6,
              background: "#c00", color: "#fff",
              borderRadius: "50%", width: 18, height: 18,
              display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 12,
              cursor: "pointer"
            }}
          >×</span>
        )}
      </div>
    ))}
  </div>
);

const SymTag = ({ txt, time, dark, onDel, onClick }) => (
  <div
    onClick={onClick}
    style={{
      display: "inline-flex", alignItems: "center",
      background: dark ? "#343445" : "#e8f0ff",
      color: dark ? "#f1f1f6" : "#1a1f3d",
      borderRadius: 6, padding: "5px 10px",
      margin: "3px 4px 3px 0", fontSize: 14,
      cursor: onClick ? "pointer" : "default"
    }}
  >
    {txt}
    <span style={{ marginLeft: 6, fontSize: 12, opacity: 0.8 }}>
      {TIME_CHOICES.find(t => t.value === time)?.label || `${time} min`}
    </span>
    {onDel && (
      <span
        onClick={e => { e.stopPropagation(); onDel(); }}
        style={{ marginLeft: 6, cursor: "pointer", fontSize: 16, color: "#c00", fontWeight: 700 }}
      >×</span>
    )}
  </div>
);

// --- Haupt-App ---

export default function App() {
  const [dark, setDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const [entries, setEntries] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fd-entries") || "[]"); }
    catch { return []; }
  });

  // Neuer Eintrag
  const [newForm, setNewForm] = useState({
    food: "", imgs: [], symptomInput: "", symptomTime: 0
  });
  const [newSymptoms, setNewSymptoms] = useState([]);
  const fileRefNew = useRef();

  // Inline-Bearbeitung
  const [editingIdx, setEditingIdx] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const fileRefEdit = useRef();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);

  // Fokus-Handler für sanftes Zentrieren
  const handleFocus = e => e.target.scrollIntoView({ behavior: "smooth", block: "center" });

  // Scroll on edit start
  useEffect(() => {
    if (editingIdx !== null) {
      const el = document.getElementById(`entry-${editingIdx}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [editingIdx]);

  // Persist & Theme
  useEffect(() => {
    localStorage.setItem("fd-entries", JSON.stringify(entries));
  }, [entries]);
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

  // PDF Export
  const handleExportPDF = async () => {
    const el = document.getElementById("fd-table");
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2 });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "px", format: [canvas.width, canvas.height] });
    pdf.addImage(img, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save("FoodDiary.pdf");
  };

  // Image-Handling
  const handleNewFile = e => {
    const files = e.target.files;
    if (!files) return;
    const urls = Array.from(files).map(f => URL.createObjectURL(f));
    setNewForm(fm => ({ ...fm, imgs: [...fm.imgs, ...urls] }));
    e.target.value = "";
  };
  const removeNewImg = idx => {
    setNewForm(fm => {
      URL.revokeObjectURL(fm.imgs[idx]);
      return { ...fm, imgs: fm.imgs.filter((_, i) => i !== idx) };
    });
  };
  const handleEditFile = e => {
    const files = e.target.files;
    if (!files) return;
    const urls = Array.from(files).map(f => URL.createObjectURL(f));
    setEditForm(fm => ({ ...fm, imgs: [...fm.imgs, ...urls] }));
    e.target.value = "";
  };
  const removeEditImg = idx => {
    setEditForm(fm => {
      URL.revokeObjectURL(fm.imgs[idx]);
      return { ...fm, imgs: fm.imgs.filter((_, i) => i !== idx) };
    });
  };

  // Symptome neu
  const addNewSymptom = () => {
    if (!newForm.symptomInput.trim()) return;
    setNewSymptoms(s => [...s, { txt: newForm.symptomInput.trim(), time: newForm.symptomTime }]);
    setNewForm(fm => ({ ...fm, symptomInput: "", symptomTime: 0 }));
  };
  const removeNewSymptom = idx => setNewSymptoms(s => s.filter((_, i) => i !== idx));

  // Eintrag hinzufügen
  const addEntry = () => {
    if (!newForm.food.trim()) return;
    setEntries(e => [...e, { food: newForm.food, imgs: newForm.imgs, symptoms: newSymptoms, date: now() }]);
    setNewForm({ food: "", imgs: [], symptomInput: "", symptomTime: 0 });
    setNewSymptoms([]);
  };

  // Bearbeiten starten
  const startEdit = i => {
    setEditingIdx(i);
    const e = entries[i];
    setEditForm({ food: e.food, imgs: [...e.imgs], symptoms: [...e.symptoms], symptomInput: "", symptomTime: 0 });
  };
  const cancelEdit = () => { setEditingIdx(null); setEditForm(null); };

  const addEditSymptom = () => {
    if (!editForm.symptomInput.trim()) return;
    setEditForm(fm => ({
      ...fm,
      symptoms: [...fm.symptoms, { txt: fm.symptomInput.trim(), time: fm.symptomTime }],
      symptomInput: "", symptomTime: 0
    }));
  };
  const removeEditSymptom = idx => setEditForm(fm => ({ ...fm, symptoms: fm.symptoms.filter((_, i) => i !== idx) }));
  const changeEditSymptomTime = idx => {
    const curr = editForm.symptoms[idx];
    const val = prompt(`Neue Zeit für "${curr.txt}" (Minuten):`, String(curr.time));
    const t = Number(val);
    if (!isNaN(t)) {
      setEditForm(fm => {
        const arr = [...fm.symptoms];
        arr[idx] = { ...arr[idx], time: t };
        return { ...fm, symptoms: arr };
      });
    }
  };
  const saveEdit = () => {
    setEntries(e => e.map((ent, i) => i === editingIdx ? { ...editForm, date: ent.date } : ent));
    cancelEdit();
  };
  const deleteEntry = i => {
    setEntries(e => e.filter((_, j) => j !== i));
    if (editingIdx === i) cancelEdit();
  };

  // --- Render ---
  return (
    <div style={{
      maxWidth: 600,
      margin: "0 auto",
      padding: isMobile ? "0 12px" : "0 24px",
      overflowAnchor: "none"
    }}>
      {/* Top-Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0" }}>
        <ThemeSwitch dark={dark} setDark={setDark} />
        <PdfButton onClick={handleExportPDF} />
      </div>

      {/* Titel */}
      <h2 style={{ textAlign: "center", margin: "8px 0 24px", fontSize: 28, fontWeight: 700 }}>
        Food Diary
      </h2>

      {/* Neuer Eintrag */}
      <div style={{ marginBottom: 24 }}>
        {/* Essen + Foto */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <input
            placeholder="Essen..."
            value={newForm.food}
            onChange={e => setNewForm(fm => ({ ...fm, food: e.target.value }))}
            onFocus={handleFocus}
            style={{ flex: 1, padding: "10px 12px", fontSize: 16, borderRadius: 6, border: "1px solid #ccc" }}
          />
          <CameraButton onClick={() => fileRefNew.current?.click()} />
          {isMobile ? (
            <input ref={fileRefNew} type="file" accept="image/*" multiple capture="environment" onChange={handleNewFile} style={{ display: "none" }} />
          ) : (
            <input ref={fileRefNew} type="file" accept="image/*" multiple onChange={handleNewFile} style={{ display: "none" }} />
          )}
        </div>
        {newForm.imgs.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <ImgStack imgs={newForm.imgs} onDelete={removeNewImg} />
          </div>
        )}

        {/* Symptome */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <input
              list="symptom-list"
              placeholder="Symptom..."
              value={newForm.symptomInput}
              onChange={e => setNewForm(fm => ({ ...fm, symptomInput: e.target.value }))}
              onFocus={handleFocus}
              style={{ flex: 1, padding: "8px 12px", fontSize: 14, borderRadius: 6, border: "1px solid #ccc" }}
            />
            <datalist id="symptom-list">{SYMPTOM_CHOICES.map(s => <option key={s} value={s} />)}</datalist>
            <select
              value={newForm.symptomTime}
              onChange={e => setNewForm(fm => ({ ...fm, symptomTime: Number(e.target.value) }))}
              onFocus={handleFocus}
              style={{ padding: "8px 12px", fontSize: 14, borderRadius: 6, border: "1px solid #ccc" }}
            >
              {TIME_CHOICES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <button onClick={addNewSymptom} style={{ padding: "8px 16px", fontSize: 14, borderRadius: 6, border: 0, background: "#247be5", color: "#fff", cursor: "pointer" }}>
              Hinzufügen
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {newSymptoms.map((s, i) => (
              <SymTag key={i} txt={s.txt} time={s.time} dark={dark} onDel={() => removeNewSymptom(i)} />
            ))}
          </div>
        </div>

        <button onClick={addEntry} style={{ width: "100%", padding: "12px 0", fontSize: 16, borderRadius: 6, border: 0, background: "#388e3c", color: "#fff", cursor: "pointer" }}>
          Eintrag hinzufügen
        </button>
      </div>

      {/* Einträge-Liste */}
      <div id="fd-table">
        {entries.map((e, i) => (
          <div
            id={`entry-${i}`}
            key={i}
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 8,
              background: dark ? "#2a2a32" : "#fff",
              boxShadow: "0 1px 4px #0002"
            }}
          >
            {editingIdx === i ? (
              <>
                {/* Inline-Bearbeitung (Inputs ebenfalls mit onFocus) */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <input
                    value={editForm.food}
                    onChange={e => setEditForm(fm => ({ ...fm, food: e.target.value }))}
                    onFocus={handleFocus}
                    style={{ flex: 1, padding: "8px 12px", fontSize: 16, borderRadius: 6, border: "1px solid #ccc" }}
                  />
                  <CameraButton onClick={() => fileRefEdit.current?.click()} />
                  {isMobile ? (
                    <input ref={fileRefEdit} type="file" accept="image/*" multiple capture="environment" onChange={handleEditFile} style={{ display: "none" }} />
                  ) : (
                    <input ref={fileRefEdit} type="file" accept="image/*" multiple onChange={handleEditFile} style={{ display: "none" }} />
                  )}
                </div>
                {editForm.imgs.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <ImgStack imgs={editForm.imgs} onDelete={removeEditImg} />
                  </div>
                )}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <input
                      list="symptom-list"
                      placeholder="Symptom..."
                      value={editForm.symptomInput}
                      onChange={e => setEditForm(fm => ({ ...fm, symptomInput: e.target.value }))}
                      onFocus={handleFocus}
                      style={{ flex: 1, padding: "8px 12px", fontSize: 14, borderRadius: 6, border: "1px solid #ccc" }}
                    />
                    <select
                      value={editForm.symptomTime}
                      onChange={e => setEditForm(fm => ({ ...fm, symptomTime: Number(e.target.value) }))}
                      onFocus={handleFocus}
                      style={{ padding: "8px 12px", fontSize: 14, borderRadius: 6, border: "1px solid #ccc" }}
                    >
                      {TIME_CHOICES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <button onClick={addEditSymptom} style={{ padding: "8px 16px", fontSize: 14, borderRadius: 6, border: 0, background: "#247be5", color: "#fff", cursor: "pointer" }}>
                      Hinzufügen
                    </button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {editForm.symptoms.map((s, j) => (
                      <SymTag
                        key={j}
                        txt={s.txt}
                        time={s.time}
                        dark={dark}
                        onDel={() => removeEditSymptom(j)}
                        onClick={() => changeEditSymptomTime(j)}
                      />
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={saveEdit} style={{ flex: 1, padding: "10px 0", fontSize: 16, borderRadius: 6, border: 0, background: "#1976d2", color: "#fff", cursor: "pointer" }}>
                    Speichern
                  </button>
                  <button onClick={cancelEdit} style={{ flex: 1, padding: "10px 0", fontSize: 16, borderRadius: 6, border: 0, background: "#888", color: "#fff", cursor: "pointer" }}>
                    Abbrechen
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Anzeige-Modus */}
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>{e.date}</div>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{e.food}</div>
                {e.imgs.length > 0 && (
                  <div style={{ marginBottom: 8 }}><ImgStack imgs={e.imgs} /></div>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 12 }}>
                  {e.symptoms.map((s, j) => (
                    <SymTag key={j} txt={s.txt} time={s.time} dark={dark} />
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => startEdit(i)} style={{ flex: 1, padding: "8px 0", fontSize: 14, borderRadius: 6, border: 0, background: "#1976d2", color: "#fff", cursor: "pointer" }}>
                    Bearbeiten
                  </button>
                  <button onClick={() => deleteEntry(i)} style={{ flex: 1, padding: "8px 0", fontSize: 14, borderRadius: 6, border: 0, background: "#d32f2f", color: "#fff", cursor: "pointer" }}>
                    Löschen
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
