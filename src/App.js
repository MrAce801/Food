import React, { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";

// ---------- Hilfsdaten ----------
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

function ImgStack({ imgs, onClick }) {
  if (!imgs?.length) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: -9, cursor: "pointer" }}>
      {imgs.map((im, i) => (
        <img
          key={i}
          src={im}
          alt=""
          style={{
            width: 34, height: 34, objectFit: "cover", borderRadius: 7,
            border: "2px solid #fff", boxShadow: "0 2px 6px #0003",
            marginLeft: i > 0 ? -16 : 0, zIndex: imgs.length - i,
            background: "#eee"
          }}
          onClick={e => { e.stopPropagation(); onClick?.(i); }}
        />
      ))}
    </div>
  );
}
function SymTag({ txt, time, dark, onDel }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", fontSize: 14, fontWeight: 500,
      background: dark ? "#2d343f" : "#e7edfd", color: dark ? "#fafafd" : "#1c2331",
      borderRadius: 6, padding: "5px 10px", margin: "2px 2px 2px 0"
    }}>
      {txt}{time !== undefined ? <span style={{ fontSize: 11, color: "#a7b" }}> {time === 0 ? "direkt" : "+" + time + "min"}</span> : ""}
      {onDel && (
        <span onClick={onDel} style={{
          marginLeft: 7, color: "#e47", fontWeight: 700, cursor: "pointer",
          fontSize: 17, lineHeight: "15px", userSelect: "none"
        }} title="Entfernen">×</span>
      )}
    </span>
  );
}
function CameraButton({ onClick }) {
  return (
    <button onClick={onClick}
      style={{
        background: "#2059e7",
        border: "none", borderRadius: "50%",
        width: 34, height: 34, marginLeft: 8,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer"
      }}
      title="Foto aufnehmen/hinzufügen"
      tabIndex={-1}
      type="button"
    >
      <svg width="22" height="22" viewBox="0 0 48 48">
        <rect x="11" y="18" width="26" height="14" rx="7" fill="#fff" />
        <circle cx="24" cy="25" r="6" fill="#2059e7" />
        <circle cx="24" cy="25" r="3.2" fill="#fff" />
        <rect x="17" y="11" width="14" height="5" rx="2" fill="#2059e7" />
      </svg>
    </button>
  );
}
function ThemeSwitch({ value, onChange }) {
  return (
    <button onClick={() => onChange(v => !v)}
      style={{
        background: "none", border: "none", outline: "none", cursor: "pointer",
        margin: "0 0 0 4px", padding: 0
      }} aria-label="Theme wechseln">
      <span style={{
        fontSize: 29, marginTop: 1,
        filter: value ? "none" : "grayscale(1)"
      }}>{value ? "🌙" : "🌞"}</span>
    </button>
  );
}

export default function FoodDiary() {
  // --- States
  const [entries, setEntries] = useState(() => {
    // Local Storage Load
    try {
      return JSON.parse(localStorage.getItem("food-diary-entries") || "[]");
    } catch {
      return [];
    }
  });
  const [form, setForm] = useState({
    food: "",
    foodImgs: [],
    symptomInput: "",
    symptomSelect: "",
    symptomTime: 0,
    symptoms: []
  });
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("food-diary-theme") === "dark";
    } catch { return true; }
  });
  const [editIdx, setEditIdx] = useState(null);
  const [imgView, setImgView] = useState(null);
  const fileRef = useRef();
  const [imgLoading, setImgLoading] = useState(false);

  // --- Theme + Entries Persistenz
  useEffect(() => {
    try { localStorage.setItem("food-diary-theme", dark ? "dark" : "light"); } catch { }
  }, [dark]);
  useEffect(() => {
    try { localStorage.setItem("food-diary-entries", JSON.stringify(entries)); } catch { }
  }, [entries]);

  // --- Entry Hinzufügen / Bearbeiten
  function resetForm() {
    setForm({ food: "", foodImgs: [], symptomInput: "", symptomSelect: "", symptomTime: 0, symptoms: [] });
    setEditIdx(null);
  }
  function addEntry() {
    if (!form.food.trim()) return;
    const entry = {
      date: now(),
      food: form.food.trim(),
      foodImgs: [...form.foodImgs],
      symptoms: [...form.symptoms]
    };
    if (editIdx !== null) {
      setEntries(es => es.map((e, i) => i === editIdx ? entry : e));
      setEditIdx(null);
    } else {
      setEntries(es => [entry, ...es]);
    }
    resetForm();
  }
  function handleEdit(i) {
    const e = entries[i];
    setForm({
      food: e.food,
      foodImgs: [...(e.foodImgs || [])],
      symptomInput: "",
      symptomSelect: "",
      symptomTime: 0,
      symptoms: [...(e.symptoms || [])]
    });
    setEditIdx(i);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function handleDelete(i) {
    setEntries(es => es.filter((_, j) => j !== i));
    resetForm();
  }

  // --- Food Image hinzufügen/entfernen
  async function handleImgAdd(e) {
    const files = e.target.files;
    if (!files || !files[0]) return;
    setImgLoading(true);
    try {
      const imgs = await Promise.all(Array.from(files).map(f => {
        return new Promise(res => {
          const r = new FileReader();
          r.onload = ev => res(ev.target.result);
          r.readAsDataURL(f);
        });
      }));
      setForm(f => ({ ...f, foodImgs: [...f.foodImgs, ...imgs] }));
    } finally { setImgLoading(false); }
    e.target.value = "";
  }
  function handleImgDelete(idx) {
    setForm(f => ({ ...f, foodImgs: f.foodImgs.filter((_, i) => i !== idx) }));
  }

  // --- Symptome hinzufügen/entfernen
  function handleAddSymptom() {
    let val = form.symptomInput?.trim() || form.symptomSelect?.trim();
    if (!val) return;
    setForm(f => ({
      ...f,
      symptoms: [...(f.symptoms || []), { custom: val, time: f.symptomTime }],
      symptomInput: "", symptomSelect: "", symptomTime: 0
    }));
  }
  function handleDeleteSymptom(idx) {
    setForm(f => ({ ...f, symptoms: f.symptoms.filter((_, i) => i !== idx) }));
  }

  // --- PDF Export
  function handleExportPDF() {
    const pdf = new jsPDF();
    pdf.setFont("helvetica");
    pdf.setFontSize(18);
    pdf.text("Food Diary", 14, 16);
    let y = 28;
    pdf.setFontSize(11);
    entries.forEach((e, idx) => {
      pdf.text(`${e.date}`, 14, y);
      pdf.text(`Essen: ${e.food}`, 14, y + 7);
      if (e.symptoms?.length)
        pdf.text(
          `Symptome: ${e.symptoms.map(s => `${s.custom} (${s.time === 0 ? "direkt" : "+" + s.time + "min"})`).join(", ")}`,
          14, y + 14
        );
      // Bilder einfügen
      if (e.foodImgs?.length) {
        let imgY = y + 18;
        e.foodImgs.forEach((im, j) => {
          try {
            pdf.addImage(im, "JPEG", 15 + j * 28, imgY, 24, 24);
          } catch { /* skip invalid img */ }
        });
        y = imgY + 28;
      } else {
        y += 20;
      }
      y += 18;
      if (y > 270 && idx < entries.length - 1) {
        pdf.addPage(); y = 18;
      }
    });
    pdf.save("FoodDiary.pdf");
  }

  // --- Responsives Layout
  const isMobile = window.innerWidth < 620;
  const minInputFont = 16; // Kein Zoom auf Mobile

  // -- Render --
  return (
    <div style={{
      minHeight: "100vh", background: dark ? "#1a1b22" : "#f5f7fd", color: dark ? "#f6f6fa" : "#181a20",
      transition: "background 0.2s,color 0.2s", padding: 0, fontFamily: "Inter,sans-serif"
    }}>
      {/* EIGENE OBERE ZEILE NUR FÜR THEME SWITCH */}
      <div style={{
        width: "100%", height: 44, display: "flex", alignItems: "center",
        padding: isMobile ? "2px 4px" : "2px 26px", justifyContent: "flex-start"
      }}>
        <ThemeSwitch value={dark} onChange={setDark} />
      </div>
      {/* HEADER & PDF EXPORT */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: isMobile ? "2px 10px" : "0 32px 0 32px", marginBottom: 7
      }}>
        <h2 style={{
          fontWeight: 700, fontSize: 27, margin: 0, letterSpacing: 0.2,
          lineHeight: 1.15
        }}>Food Diary</h2>
        <button
          onClick={handleExportPDF}
          style={{
            padding: "7px 17px", borderRadius: 8,
            background: "#ce2323", color: "#fff", fontWeight: 600, border: 0, fontSize: 17,
            boxShadow: "0 1px 4px #0001", cursor: "pointer"
          }}>PDF</button>
      </div>
      {/* FORMULAR */}
      <div style={{
        display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 10 : 15,
        alignItems: isMobile ? "stretch" : "center",
        padding: isMobile ? "0 9px 5px 9px" : "0 32px 0 32px", marginBottom: 8
      }}>
        {/* Essen */}
        <div style={{ display: "flex", alignItems: "center", flex: isMobile ? "1 1 100%" : "1 1 250px", minWidth: isMobile ? undefined : 180 }}>
          <input
            value={form.food}
            onChange={e => setForm(f => ({ ...f, food: e.target.value }))}
            placeholder="Essen..."
            style={{
              width: isMobile ? "100%" : 130, minWidth: isMobile ? "0" : 90,
              fontSize: minInputFont, border: "1.4px solid #40444c", borderRadius: 8, padding: "9px 10px",
              background: dark ? "#232531" : "#fff", color: dark ? "#f6f6fa" : "#232531",
              marginRight: 6, flex: "1 1 130px"
            }}
            autoComplete="off"
            inputMode="text"
          />
          <CameraButton onClick={() => fileRef.current.click()} />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            style={{ display: "none" }}
            onChange={handleImgAdd}
          />
        </div>
        {/* Symptome */}
        <div style={{
          display: "flex", flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "center",
          flex: isMobile ? "1 1 100%" : "2 1 340px", minWidth: isMobile ? undefined : 230, gap: 4
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 3, width: isMobile ? "100%" : undefined
          }}>
            {/* --- DROPDOWN --- */}
            <select
              value={form.symptomSelect}
              onChange={e => setForm(f => ({ ...f, symptomSelect: e.target.value }))}
              style={{
                height: 33, borderRadius: 6, fontSize: minInputFont, border: "1.4px solid #40444c",
                background: dark ? "#232531" : "#fff", color: dark ? "#f6f6fa" : "#232531", minWidth: 97, marginRight: 4
              }}>
              <option value="">Symptom wählen</option>
              {SYMPTOM_CHOICES.map(sym => <option key={sym} value={sym}>{sym}</option>)}
            </select>
            {/* --- Freitextfeld --- */}
            <input
              value={form.symptomInput}
              onChange={e => setForm(f => ({ ...f, symptomInput: e.target.value }))}
              placeholder="Symptom manuell..."
              style={{
                width: 140, fontSize: minInputFont, border: "1.4px solid #40444c",
                borderRadius: 8, padding: "9px 10px",
                background: dark ? "#232531" : "#fff", color: dark ? "#f6f6fa" : "#232531"
              }}
              onKeyDown={e => e.key === "Enter" && handleAddSymptom()}
              inputMode="text"
              autoComplete="off"
            />
            <select
              value={form.symptomTime}
              onChange={e => setForm(f => ({ ...f, symptomTime: Number(e.target.value) }))}
              style={{
                height: 33, borderRadius: 6, fontSize: minInputFont,
                background: dark ? "#232531" : "#fff", color: dark ? "#f6f6fa" : "#232531",
                border: "1.4px solid #40444c", minWidth: 64, marginLeft: 5
              }}
            >
              {TIMES.map(t => (
                <option key={t} value={t}>{t === 0 ? "direkt" : "+" + t + "min"}</option>
              ))}
            </select>
            {/* --- Add Button --- */}
            <button
              onClick={handleAddSymptom}
              style={{
                background: "#19d236",
                color: "#fff",
                border: 0,
                borderRadius: "50%",
                width: 31,
                height: 31,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 20,
                marginLeft: 4
              }}
              tabIndex={-1}
              title="Symptom hinzufügen"
              type="button"
            >+</button>
          </div>
        </div>
      </div>

      {/* Bild wird geladen */}
      {imgLoading &&
        <div style={{
          background: "#000c", color: "#ffe57f", borderRadius: 8,
          padding: 15, margin: "15px 0", textAlign: "center", fontWeight: 700
        }}>
          Bild wird verarbeitet...
        </div>
      }

      {/* Symptome als Tags */}
      <div style={{
        margin: "2px 0 15px 0", minHeight: 24, display: "flex", flexWrap: "wrap", gap: 2,
        paddingLeft: isMobile ? 9 : 32
      }}>
        {(form.symptoms || []).map((s, i) => (
          <SymTag
            key={i}
            txt={s.custom}
            time={s.time}
            dark={dark}
            onDel={() => handleDeleteSymptom(i)}
          />
        ))}
      </div>

      {/* HINZUFÜGEN */}
      <div style={{ paddingLeft: isMobile ? 9 : 32, paddingRight: isMobile ? 9 : 32 }}>
        <button
          onClick={addEntry}
          style={{
            padding: "13px 26px", borderRadius: 8, background: "#257bf3", color: "#fff",
            fontWeight: 600, border: 0, fontSize: 17, cursor: "pointer", float: isMobile ? undefined : "right"
          }}
        >{editIdx !== null ? "Speichern" : "Hinzufügen"}</button>
      </div>

      {/* EINTRAG TABELLE */}
      <div style={{
        width: "100%",
        margin: "28px auto 0 auto",
        padding: isMobile ? "0 4px" : "0 32px",
        maxWidth: 950
      }}>
        <table style={{
          width: "100%", borderCollapse: "collapse", marginTop: 8, background: "inherit",
          borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 12px #0001",
          fontSize: 15
        }}>
          <thead>
            <tr style={{ background: dark ? "#23242e" : "#e6eef7" }}>
              <th style={{ textAlign: "left", padding: "9px 8px" }}>Datum</th>
              <th style={{ textAlign: "left", padding: "9px 8px" }}>Essen</th>
              <th style={{ textAlign: "left", padding: "9px 8px" }}>Bilder</th>
              <th style={{ textAlign: "left", padding: "9px 8px" }}>Symptome</th>
              <th style={{ textAlign: "center", padding: "9px 8px" }}>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 &&
              <tr>
                <td colSpan={5} style={{
                  textAlign: "center", color: dark ? "#a8a8c0" : "#999",
                  fontSize: 18, padding: 22
                }}>Noch keine Einträge</td>
              </tr>
            }
            {entries.map((e, i) =>
              <tr key={i}
                style={{
                  background: editIdx === i ? "#35393e" : dark ? "#20222a" : "#fff",
                  borderBottom: "1.5px solid #ddd"
                }}>
                <td style={{ padding: "8px 8px" }}>{e.date}</td>
                <td style={{ padding: "8px 8px", verticalAlign: "top", fontWeight: 500 }}>{e.food}</td>
                <td style={{ padding: "8px 8px", verticalAlign: "top" }}>
                  <ImgStack imgs={e.foodImgs} onClick={idx =>
                    setImgView({ imgs: e.foodImgs, idx: idx || 0 })
                  } />
                </td>
                <td style={{ padding: "8px 8px", verticalAlign: "top" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                    {(e.symptoms || []).map((s, si) =>
                      <SymTag key={si} txt={s.custom} time={s.time} dark={dark} />
                    )}
                  </div>
                </td>
                <td style={{ padding: "8px 8px", textAlign: "center", verticalAlign: "top" }}>
                  <button
                    onClick={() => handleEdit(i)}
                    style={{
                      background: "none", border: "1.2px solid #7a88a4", borderRadius: 6,
                      padding: "6px 12px", margin: 2, fontSize: 13, cursor: "pointer", color: dark ? "#fff" : "#181a20"
                    }}>Bearbeiten</button>
                  <button
                    onClick={() => handleDelete(i)}
                    style={{
                      background: "#ffefef", border: "1.2px solid #ff4444", borderRadius: 6,
                      padding: "6px 10px", margin: 2, color: "#c00", fontSize: 18, cursor: "pointer"
                    }} title="Löschen">×</button>
                  {/* Im Bearbeitungsmodus Bilder löschen */}
                  {editIdx === i && e.foodImgs?.length > 0 &&
                    <div style={{ marginTop: 7, display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {e.foodImgs.map((img, idx) =>
                        <div key={idx} style={{ position: "relative" }}>
                          <img src={img} alt="" style={{
                            width: 34, height: 34, borderRadius: 7, objectFit: "cover",
                            border: "2px solid #fff", boxShadow: "0 2px 6px #0003"
                          }} />
                          <button onClick={() => handleImgDelete(idx)} style={{
                            position: "absolute", top: -10, right: -10, background: "#e47", color: "#fff",
                            border: "none", borderRadius: "50%", width: 22, height: 22, fontWeight: 700, cursor: "pointer"
                          }}>×</button>
                        </div>
                      )}
                    </div>
                  }
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Image-Modal/Lightbox */}
      {imgView &&
        <div style={{
          position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh", zIndex: 22222,
          background: "#181a", display: "flex", alignItems: "center", justifyContent: "center"
        }}
          onClick={() => setImgView(null)}
        >
          <img src={imgView.imgs[imgView.idx]} alt="" style={{
            maxWidth: "92vw", maxHeight: "82vh", borderRadius: 10, boxShadow: "0 6px 40px #0008"
          }} onClick={e => e.stopPropagation()} />
          {imgView.imgs.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); setImgView(v => ({ ...v, idx: (v.idx - 1 + v.imgs.length) % v.imgs.length })); }}
                style={{
                  position: "absolute", left: 24, top: "50%", background: "#2d2c38", color: "#fff",
                  border: "none", borderRadius: 16, width: 38, height: 38, fontWeight: 700, fontSize: 23, cursor: "pointer"
                }}>‹</button>
              <button
                onClick={e => { e.stopPropagation(); setImgView(v => ({ ...v, idx: (v.idx + 1) % v.imgs.length })); }}
                style={{
                  position: "absolute", right: 24, top: "50%", background: "#2d2c38", color: "#fff",
                  border: "none", borderRadius: 16, width: 38, height: 38, fontWeight: 700, fontSize: 23, cursor: "pointer"
                }}>›</button>
            </>
          )}
        </div>
      }
    </div>
  );
}
