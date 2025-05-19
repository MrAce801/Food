import React, { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";

// --- Hilfsdaten
const SYMPTOM_CHOICES = [
  "Bauchschmerzen", "Durchfall", "Blähungen", "Hautausschlag",
  "Juckreiz", "Schwellung am Gaumen", "Schleim im Hals",
  "Niesen", "Kopfschmerzen", "Rötung Haut"
];
const TIMES = [0, 5, 10, 15, 30, 60];
const now = () => {
  let d = new Date();
  return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// --- Kamera-Button
const CameraButton = ({ onClick }) => (
  <button
    onClick={onClick}
    style={{
      background: "#247be5", border: 0, borderRadius: "50%", width: 38, height: 38,
      display: "flex", alignItems: "center", justifyContent: "center",
      marginLeft: 8, marginRight: 0, cursor: "pointer"
    }}
    title="Bild aufnehmen/hochladen"
    tabIndex={-1}
  >
    <svg width="21" height="21" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#247be5" /><circle cx="16" cy="16" r="7" fill="#fff" /><rect x="10" y="6" width="12" height="6" rx="3" fill="#fff" /><circle cx="16" cy="16" r="4" fill="#247be5" /></svg>
  </button>
);

const PdfButton = ({ onClick }) => (
  <button onClick={onClick}
    style={{
      background: "#d32f2f", color: "#fff", border: 0, borderRadius: 11, fontWeight: 700,
      fontSize: 17, padding: "8px 22px", marginLeft: 16, marginTop: 2, float: "right", boxShadow: "0 1px 4px #0003"
    }}
    title="Export PDF"
  >PDF</button>
);

// --- Dark/Light Theme Switch
const ThemeSwitch = ({ dark, setDark }) => (
  <div style={{
    width: "100%", display: "flex", justifyContent: "flex-start",
    alignItems: "center", marginBottom: 4, height: 35
  }}>
    <button
      onClick={() => setDark(d => !d)}
      style={{
        background: "none", border: "none", cursor: "pointer", marginLeft: 6, marginTop: 3,
        outline: "none", fontSize: 26, transition: ".1s"
      }}
      tabIndex={0}
      aria-label={dark ? "Dark Mode aktiviert" : "Light Mode aktiviert"}
    >
      {dark
        ? <span style={{ fontSize: 29 }}>🌙</span>
        : <span style={{ fontSize: 27 }}>☀️</span>}
    </button>
  </div>
);

// --- IMG Stack (Bilder-Preview)
const ImgStack = ({ imgs, onClick }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
    {imgs && imgs.length > 0 && imgs.map((img, i) =>
      <img
        src={img}
        alt=""
        key={i}
        style={{
          width: 38, height: 38, objectFit: "cover", borderRadius: 9, boxShadow: "0 1.5px 8px #2223",
          border: "2.5px solid #fff", marginLeft: i > 0 ? -12 : 0, cursor: "pointer"
        }}
        onClick={() => onClick(i)}
      />
    )}
  </div>
);

// --- SYMPTOM TAG (Table und Form)
const SymTag = ({ txt, time, dark }) => (
  <div style={{
    background: dark ? "#343445" : "#f0f0fa", color: dark ? "#f1f1f6" : "#181A1F",
    borderRadius: 8, padding: "7px 12px 7px 10px", fontSize: 15, margin: "0 3px 3px 0",
    display: "inline-flex", alignItems: "center"
  }}>
    {txt}
    <span style={{
      fontWeight: 400, fontSize: 13, opacity: 0.8, marginLeft: 2,
      color: dark ? "#b3aaff" : "#5337bb"
    }}>{time === 0 ? " direkt" : ` +${time}min`}</span>
  </div>
);

// --- MAIN APP
export default function App() {
  // --- State mgmt
  const [dark, setDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [entries, setEntries] = useState(() => {
    // Persistent: localStorage
    try {
      const raw = localStorage.getItem("fd-entries");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [editIdx, setEditIdx] = useState(null);
  const [form, setForm] = useState({
    food: "", foodImgs: [],
    symptomInput: "",
    symptomDropdown: [],
    symptomTime: 0,
    symptoms: []
  });
  const [imgView, setImgView] = useState(null);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 690);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 690);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("fd-entries", JSON.stringify(entries));
  }, [entries]);

  // Theme auf Body
  useEffect(() => {
    document.body.style.background = dark ? "#23232a" : "#f3f4f9";
    document.body.style.color = dark ? "#fff" : "#111";
  }, [dark]);

  // Image upload ref
  const fileRef = useRef();

  // --- Handler
  const resetForm = () => setForm({
    food: "", foodImgs: [],
    symptomInput: "",
    symptomDropdown: [],
    symptomTime: 0,
    symptoms: []
  });

  // Symptom Dropdown Auswahl (MULTI)
  const handleSymptomDropdown = (val) => {
    setForm(f => {
      let list = [...f.symptomDropdown];
      if (list.some(s => s.txt === val && s.time === f.symptomTime)) {
        // Remove if already in list
        list = list.filter(s => !(s.txt === val && s.time === f.symptomTime));
      } else {
        list.push({ txt: val, time: f.symptomTime });
      }
      return { ...f, symptomDropdown: list };
    });
  };

  // Symptom über Enter oder Plus hinzufügen
  const handleAddSymptom = () => {
    // Manuelle Eingabe
    if (form.symptomInput.trim()) {
      setForm(f => ({
        ...f,
        symptoms: [...f.symptoms, { txt: f.symptomInput.trim(), time: f.symptomTime }],
        symptomInput: "",
        symptomTime: 0,
        symptomDropdown: []
      }));
    }
    // Auswahl Dropdown (Multi)
    if (form.symptomDropdown.length) {
      setForm(f => ({
        ...f,
        symptoms: [
          ...f.symptoms,
          ...f.symptomDropdown.filter(s =>
            !f.symptoms.some(existing => existing.txt === s.txt && existing.time === s.time)
          )
        ],
        symptomDropdown: [],
        symptomInput: "",
        symptomTime: 0
      }));
    }
  };

  // Image upload
  const handleFile = (e) => {
    const files = e.target.files;
    if (!files.length) return;
    let readers = [];
    for (let i = 0; i < files.length; ++i) {
      const r = new FileReader();
      r.onload = (ev) => {
        setForm(f => ({ ...f, foodImgs: [...f.foodImgs, ev.target.result] }));
      };
      r.readAsDataURL(files[i]);
      readers.push(r);
    }
    // Reset input value for subsequent upload of same file
    e.target.value = "";
  };

  // Add entry
  const addEntry = () => {
    if (!form.food.trim()) return;
    setEntries(e =>
      editIdx !== null
        ? e.map((entry, idx) =>
          idx === editIdx
            ? { ...entry, ...form, date: entry.date }
            : entry
        )
        : [...e, { ...form, date: now() }]
    );
    setEditIdx(null);
    resetForm();
  };

  // Edit entry
  const handleEdit = (idx) => {
    setEditIdx(idx);
    const entry = entries[idx];
    setForm({
      food: entry.food,
      foodImgs: entry.foodImgs || [],
      symptomInput: "",
      symptomDropdown: [],
      symptomTime: 0,
      symptoms: entry.symptoms || []
    });
    window.scrollTo(0, 0);
  };

  // Delete entry
  const handleDelete = idx => {
    setEntries(e => e.filter((_, i) => i !== idx));
    setEditIdx(null);
    resetForm();
  };

  // Delete img in Bearbeiten
  const handleImgDelete = idx => {
    setForm(f => ({
      ...f, foodImgs: f.foodImgs.filter((_, i) => i !== idx)
    }));
  };

  // PDF Export (nur Text + Bilder als Vorschau)
  const exportPDF = () => {
    const doc = new jsPDF();
    let y = 12;
    doc.setFontSize(18);
    doc.text("Food Diary", 14, y);
    y += 10;
    doc.setFontSize(11);

    entries.forEach((e, i) => {
      y += 10;
      doc.setFont("helvetica", "bold");
      doc.text(`Datum: `, 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(`${e.date}`, 34, y);
      y += 7;
      doc.setFont("helvetica", "bold");
      doc.text(`Essen: `, 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(e.food, 34, y);
      y += 7;

      if (e.symptoms?.length) {
        doc.setFont("helvetica", "bold");
        doc.text(`Symptome: `, 14, y);
        doc.setFont("helvetica", "normal");
        let syms = e.symptoms.map(s =>
          `${s.txt} ${s.time === 0 ? "(direkt)" : `(+${s.time}min)`}`
        ).join(", ");
        doc.text(syms, 37, y);
        y += 7;
      }

      if (e.foodImgs?.length) {
        doc.setFont("helvetica", "bold");
        doc.text("Bilder:", 14, y);
        y += 2;
        e.foodImgs.forEach((img, j) => {
          try {
            doc.addImage(img, "JPEG", 22 + (j * 30), y, 22, 22);
          } catch { /* skip */ }
        });
        y += 26;
      }
      y += 3;
      if (y > 260) { doc.addPage(); y = 14; }
    });

    doc.save("FoodDiary.pdf");
  };

  // --- RENDERING ---
  return (
    <div
      style={{
        minHeight: "100vh",
        background: dark ? "#23232a" : "#f3f4f9",
        color: dark ? "#f8f9fe" : "#171818",
        paddingBottom: 24,
        fontFamily: "Inter, Segoe UI, Arial, sans-serif"
      }}
    >
      {/* --- HEADER ROW mit Switch + PDF Export --- */}
      <ThemeSwitch dark={dark} setDark={setDark} />
      <div style={{
        width: "100%",
        maxWidth: 950,
        margin: "0 auto 0 auto",
        display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center"
      }}>
        <div style={{ display: "block", width: "100%" }}>
          <h2 style={{
            fontWeight: 700, fontSize: 34,
            letterSpacing: 0.3, margin: "0 0 17px 0"
          }}>
            Food Diary
          </h2>
        </div>
        <PdfButton onClick={exportPDF} />
      </div>

      {/* --- EINGABE --- */}
      <div style={{
        width: "100%", maxWidth: 950, margin: "0 auto", display: "flex", flexWrap: isMobile ? "wrap" : "nowrap",
        gap: isMobile ? 6 : 12, alignItems: "flex-start", marginBottom: 14,
        padding: isMobile ? "0 4px" : "0 32px",
      }}>
        {/* --- Essen --- */}
        <div style={{
          display: "flex", alignItems: "center", gap: 7,
          width: isMobile ? "100%" : 240, flex: isMobile ? "1 1 100%" : undefined
        }}>
          <input
            style={{
              borderRadius: 9, border: "1.2px solid #aaa", fontSize: 18,
              width: "100%", padding: "10px 12px", background: dark ? "#2d2d39" : "#f5f7fb",
              color: dark ? "#fff" : "#181a20", outline: "none",
              marginBottom: isMobile ? 7 : 0, boxSizing: "border-box"
            }}
            placeholder="Essen..."
            value={form.food}
            onChange={e => setForm(f => ({ ...f, food: e.target.value }))}
          />
          <CameraButton onClick={() => fileRef.current.click()} />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handleFile}
            style={{ display: "none" }}
          />
        </div>
        {/* --- Symptome (NEU: Dropdown MULTI + Manuell) --- */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          flex: "2 1 330px", width: isMobile ? "100%" : 370, minWidth: 180, position: "relative"
        }}>
          {/* Integriertes Feld: Dropdown & manuelle Eingabe */}
          <div style={{
            display: "flex", alignItems: "center", gap: 3, width: "100%", position: "relative"
          }}>
            {/* DROPDOWN PFEIL */}
            <div style={{
              position: "relative", marginRight: 4, width: isMobile ? 150 : 165
            }}>
              <select
                style={{
                  width: "100%", borderRadius: 8, border: "1.2px solid #aaa", padding: "10px 7px 10px 10px",
                  fontSize: 16, background: dark ? "#2d2d39" : "#f5f7fb", color: dark ? "#fff" : "#1a1a1a",
                  appearance: "none", outline: "none"
                }}
                multiple
                size={isMobile ? 2 : 3}
                value={form.symptomDropdown.map(s => s.txt)}
                onChange={e => {
                  const opts = Array.from(e.target.selectedOptions).map(opt => opt.value);
                  // mit Zeit (einheitlich für alle gewählten)
                  setForm(f => ({
                    ...f,
                    symptomDropdown: opts.map(txt => ({
                      txt,
                      time: f.symptomTime
                    }))
                  }));
                }}
              >
                {SYMPTOM_CHOICES.map((sym, i) =>
                  <option key={i} value={sym}>
                    {sym}
                  </option>
                )}
              </select>
              {/* Down-Arrow */}
              <span style={{
                pointerEvents: "none",
                position: "absolute", right: 8, top: "42%",
                fontSize: 12, color: "#777"
              }}>▼</span>
            </div>
            {/* Zeit für alle */}
            <select
              style={{
                borderRadius: 8, border: "1.2px solid #aaa", fontSize: 15,
                background: dark ? "#2d2d39" : "#f5f7fb", color: dark ? "#fff" : "#232324",
                padding: "10px 5px", width: 67
              }}
              value={form.symptomTime}
              onChange={e => setForm(f => ({ ...f, symptomTime: Number(e.target.value) }))}
            >
              {TIMES.map(t =>
                <option key={t} value={t}>{t === 0 ? "direkt" : "+" + t + "min"}</option>
              )}
            </select>
            {/* Manuelle Eingabe */}
            <input
              style={{
                borderRadius: 8, border: "1.2px solid #aaa", fontSize: 16, width: isMobile ? 130 : 170,
                background: dark ? "#2d2d39" : "#f5f7fb", color: dark ? "#fff" : "#232324",
                padding: "10px 8px"
              }}
              placeholder="Symptom manuell..."
              value={form.symptomInput}
              onChange={e => setForm(f => ({ ...f, symptomInput: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && handleAddSymptom()}
            />
            {/* Add Symptom */}
            <button
              onClick={handleAddSymptom}
              style={{
                borderRadius: "50%", background: "#18bf53", color: "#fff",
                border: 0, fontSize: 23, width: 38, height: 38, marginLeft: 5, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}
              tabIndex={0}
            >+</button>
          </div>
        </div>
      </div>

      {/* Bilder Vorschau + Löschen im Bearbeiten */}
      {(form.foodImgs?.length > 0 && editIdx !== null) &&
        <div style={{
          display: "flex", gap: 7, margin: "5px 0 15px 22px"
        }}>
          {form.foodImgs.map((img, i) =>
            <div key={i} style={{ position: "relative" }}>
              <img src={img} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 7, border: "1.5px solid #fff" }} />
              <button
                onClick={() => handleImgDelete(i)}
                style={{
                  position: "absolute", top: -6, right: -7, background: "#c00", color: "#fff",
                  borderRadius: "50%", width: 19, height: 19, fontSize: 13, border: 0, cursor: "pointer"
                }}
                tabIndex={0}
              >×</button>
            </div>
          )}
        </div>
      }

      {/* --- Button Hinzufügen */}
      <div style={{
        width: "100%", maxWidth: 950, margin: "0 auto 0 auto",
        display: "flex", justifyContent: isMobile ? "flex-start" : "flex-end"
      }}>
        <button onClick={addEntry} style={{
          padding: "15px 32px", borderRadius: 9, background: "#3178ed", color: "#fff",
          fontWeight: 600, border: 0, fontSize: 21, cursor: "pointer", marginTop: 8
        }}>
          {editIdx !== null ? "Speichern" : "Hinzufügen"}
        </button>
      </div>

      {/* --- TABELLE --- */}
      <div style={{
        width: "100%", maxWidth: 950, margin: "0 auto", marginTop: 15,
        borderRadius: 18, background: dark ? "#22232a" : "#fff", boxShadow: "0 2px 10px #0002"
      }}>
        <table style={{
          width: "100%", borderCollapse: "collapse", fontSize: isMobile ? 15 : 16, background: "inherit"
        }}>
          <thead>
            <tr style={{
              borderBottom: `2.5px solid ${dark ? "#363748" : "#eaeaea"}`, fontSize: isMobile ? 15 : 16,
              background: dark ? "#262637" : "#fafcff"
            }}>
              <th style={{ textAlign: "left", padding: "10px 8px", minWidth: 70 }}>Datum</th>
              <th style={{ textAlign: "left", padding: "10px 8px", minWidth: 80 }}>Essen</th>
              <th style={{ textAlign: "left", padding: "10px 8px", minWidth: 55 }}>Bilder</th>
              <th style={{ textAlign: "left", padding: "10px 8px", minWidth: 120 }}>Symptome</th>
              <th style={{ textAlign: "center", padding: "10px 8px", minWidth: 84 }}>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 &&
              <tr><td colSpan={5}
                style={{ textAlign: "center", color: "#aaa", padding: "36px 0", fontSize: 19 }}>
                Noch keine Einträge
              </td></tr>
            }
            {entries.map((e, i) =>
              <tr key={i} style={{
                borderBottom: `1.5px solid ${dark ? "#23242e" : "#f0f0f0"}`,
                background: editIdx === i ? (dark ? "#222a44" : "#f8f9fb") : "inherit",
                boxShadow: editIdx === i ? "0 2px 8px #d5d6ff22" : "none"
              }}>
                {/* Datum (Mitte ausgerichtet) */}
                <td style={{
                  padding: "13px 8px", verticalAlign: "middle", textAlign: "left"
                }}>{e.date}</td>
                {/* Essen */}
                <td style={{ padding: "13px 8px", verticalAlign: "middle" }}>{e.food}</td>
                {/* Bilder */}
                <td style={{ padding: "13px 8px", verticalAlign: "middle" }}>
                  <ImgStack imgs={e.foodImgs} onClick={(idx) => setImgView({ imgs: e.foodImgs, idx })} />
                </td>
                {/* Symptome */}
                <td style={{ padding: "13px 8px", verticalAlign: "middle" }}>
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {e.symptoms?.map((s, si) =>
                      <SymTag key={si} txt={s.txt} time={s.time} dark={dark} />
                    )}
                  </div>
                </td>
                {/* Aktionen */}
                <td style={{
                  padding: "10px 8px", textAlign: "center", verticalAlign: "middle"
                }}>
                  <button onClick={() => handleEdit(i)} style={{
                    background: dark ? "#232a38" : "#f5f5f7", border: "1px solid #bbb", borderRadius: 6,
                    padding: "8px 13px", margin: 2, fontSize: 14, cursor: "pointer", color: dark ? "#fff" : "#232324"
                  }}>Bearbeiten</button>
                  <button onClick={() => handleDelete(i)} style={{
                    background: "#fff0f0", border: "1.5px solid #e88", borderRadius: 7,
                    padding: "8px 14px", margin: 2, color: "#c00", fontSize: 16, cursor: "pointer"
                  }}>✕</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- Image Viewer Modal --- */}
      {imgView &&
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "#111a",
          zIndex: 99, display: "flex", alignItems: "center", justifyContent: "center"
        }}
          onClick={() => setImgView(null)}
        >
          <img
            src={imgView.imgs[imgView.idx]}
            alt=""
            style={{
              maxWidth: "97vw", maxHeight: "88vh", borderRadius: 13, border: "3px solid #fff",
              boxShadow: "0 2px 25px #0006"
            }}
            onClick={e => e.stopPropagation()}
          />
        </div>
      }
    </div>
  );
}
