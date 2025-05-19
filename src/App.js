import React, { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";

// === Helper Daten ===
const SYMPTOM_CHOICES = [
  "Bauchschmerzen", "Durchfall", "Blähungen", "Hautausschlag", "Juckreiz",
  "Schwellung am Gaumen", "Schleim im Hals", "Niesen", "Kopfschmerzen", "Rötung Haut"
];
const TIMES = [0, 5, 10, 15, 30, 60];

// === Responsive Helper ===
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return width;
}

// === Kamera-Icon Button ===
function CameraButton({ onClick }) {
  return (
    <button onClick={onClick} style={{
      background: "#4070ea", border: 0, borderRadius: "50%", width: 38, height: 38,
      display: "flex", alignItems: "center", justifyContent: "center", margin: "0 4px",
      cursor: "pointer", boxShadow: "0 1px 4px #0003"
    }} title="Bild hinzufügen" tabIndex={-1}>
      <svg width={21} height={21} fill="#fff" viewBox="0 0 24 24">
        <circle cx={12} cy={12} r={7.5} stroke="#fff" strokeWidth="1.7" fill="#4070ea"/>
        <rect x={7.6} y={9.4} width={8.8} height={6.2} rx={2.3} fill="#fff"/>
        <circle cx={12} cy={12.5} r={1.5} fill="#4070ea"/>
      </svg>
    </button>
  );
}

// === Mini-Bild-Stack für Einträge ===
function ImgStack({ imgs = [], onClick }) {
  if (!imgs.length) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", cursor: "pointer" }} onClick={onClick}>
      {imgs.slice(0, 3).map((img, i) =>
        <img
          key={i}
          src={img.data}
          alt="bild"
          style={{
            width: 33, height: 33, borderRadius: 8, objectFit: "cover",
            border: "2px solid #fff", marginLeft: i ? -13 : 0, boxShadow: "0 0 4px #0005"
          }}
        />
      )}
      {imgs.length > 3 && (
        <span style={{
          marginLeft: 5, fontSize: 15, background: "#333", color: "#fff", borderRadius: 7,
          padding: "0 6px", fontWeight: 500
        }}>+{imgs.length - 3}</span>
      )}
    </div>
  );
}

// === Symptombadge ===
function SymTag({ txt, time, onDel }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", background: "#333", color: "#fff",
      borderRadius: 8, fontSize: 13, margin: "2px 3px 2px 0", padding: "4px 9px", fontWeight: 500
    }}>
      {txt}
      {time !== undefined &&
        <span style={{
          fontSize: 12, marginLeft: 5, opacity: 0.75,
          background: "#222", borderRadius: 6, padding: "2px 6px"
        }}>
          {time === 0 ? "direkt" : `+${time}min`}
        </span>
      }
      {onDel &&
        <span onClick={onDel} style={{
          marginLeft: 7, cursor: "pointer", color: "#fe7e7e", fontWeight: 700, fontSize: 15
        }}>×</span>
      }
    </span>
  );
}

// === Hauptkomponente ===
export default function App() {
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 700;

  // -- States für Food-Entries --
  const [form, setForm] = useState({
    food: "", symptoms: [], symptomInput: "", symptomTime: 0,
    foodImgs: [], symptomsImgs: [],
  });
  const [entries, setEntries] = useState([]);
  const [editIdx, setEditIdx] = useState(null);
  const fileRef = useRef();
  const [pendingImgType, setPendingImgType] = useState(null);

  // -- States für Stuhlgang --
  const [stoolForm, setStoolForm] = useState({
    date: "", note: "", imgs: []
  });
  const [stools, setStools] = useState([]);
  const [editStoolIdx, setEditStoolIdx] = useState(null);

  // -- Bilderhandling --
  function handleAddImg(e, typ, idx) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    Promise.all(files.map(f =>
      new Promise(res => {
        const r = new FileReader();
        r.onload = ev => res({ name: f.name, data: ev.target.result });
        r.readAsDataURL(f);
      })
    )).then(imgs => {
      if (typ === "food") setForm(f => ({ ...f, foodImgs: [...(f.foodImgs || []), ...imgs] }));
      if (typ === "symptoms") setForm(f => ({ ...f, symptomsImgs: [...(f.symptomsImgs || []), ...imgs] }));
      if (typ === "stool") setStoolForm(f => ({ ...f, imgs: [...(f.imgs || []), ...imgs] }));
    });
  }

  // -- Entry hinzufügen/bearbeiten --
  function addEntry() {
    if (!form.food) return;
    if (editIdx !== null) {
      setEntries(arr => arr.map((e, i) => i === editIdx ? {
        ...form, date: e.date
      } : e));
      setEditIdx(null);
    } else {
      setEntries(arr => [
        ...arr,
        { ...form, date: new Date().toLocaleString([], { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" }) }
      ]);
    }
    setForm({ food: "", symptoms: [], symptomInput: "", symptomTime: 0, foodImgs: [], symptomsImgs: [] });
  }

  function onEditEntry(i) {
    setEditIdx(i);
    setForm({ ...entries[i] });
  }

  // -- Symptome Handling --
  function addSymptom(sym) {
    if (!sym) return;
    setForm(f => ({
      ...f,
      symptoms: [...(f.symptoms || []), { txt: sym, time: f.symptomTime }],
      symptomInput: ""
    }));
  }
  function delSymptom(idx) {
    setForm(f => ({ ...f, symptoms: f.symptoms.filter((_, i) => i !== idx) }));
  }

  // -- Stuhlgang Hinzufügen/Bearbeiten --
  function addStool() {
    if (!stoolForm.date) return;
    if (editStoolIdx !== null) {
      setStools(arr => arr.map((e, i) => i === editStoolIdx ? { ...stoolForm } : e));
      setEditStoolIdx(null);
    } else {
      setStools(arr => [...arr, { ...stoolForm }]);
    }
    setStoolForm({ date: "", note: "", imgs: [] });
  }

  function onEditStool(i) {
    setEditStoolIdx(i);
    setStoolForm({ ...stools[i] });
  }

  // -- Export Excel --
  function exportExcel() {
    const ws = XLSX.utils.json_to_sheet(
      entries.map(e => ({
        Datum: e.date,
        Essen: e.food,
        Symptome: (e.symptoms || []).map(s => s.txt + (s.time !== undefined ? ` (${s.time === 0 ? "direkt" : "+" + s.time + "min"})` : "")).join(", "),
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Food Diary");
    XLSX.writeFile(wb, "FoodDiary.xlsx");
  }

  // ========== Render ==========
  return (
    <div style={{
      maxWidth: isMobile ? "100vw" : 950,
      margin: isMobile ? 0 : "22px auto",
      background: isMobile ? "#181a1b" : "#181a1b",
      borderRadius: isMobile ? 0 : 18,
      boxShadow: isMobile ? "none" : "0 2px 18px #0002",
      padding: isMobile ? 8 : 26,
      minHeight: "100vh",
      color: "#fff"
    }}>
      {/* Export-Button */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap"
      }}>
        <button onClick={exportExcel} style={{
          background: "#3b82f6", color: "#fff", border: 0, borderRadius: 9,
          padding: isMobile ? "12px 19px" : "12px 27px",
          fontSize: isMobile ? 17 : 16,
          fontWeight: 600,
          marginBottom: 7,
          marginRight: 12,
          boxShadow: "0 1px 4px #0003",
          marginTop: isMobile ? 7 : 0,
        }}>
          Exportieren (.xlsx)
        </button>
      </div>

      <h2 style={{
        fontWeight: 800, fontSize: isMobile ? 20 : 24, margin: "7px 0 17px 2px",
        letterSpacing: 0.5, textAlign: "left"
      }}>Food Diary</h2>

      {/* Eingabe */}
      <div style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "stretch" : "flex-end",
        gap: isMobile ? 9 : 16,
        marginBottom: 18
      }}>
        {/* Essen + Bilder */}
        <div style={{ flex: 2, display: "flex", flexDirection: "column", gap: 6 }}>
          <input
            value={form.food}
            onChange={e => setForm(f => ({ ...f, food: e.target.value }))}
            placeholder="Essen..."
            style={{
              width: "100%", borderRadius: 8, border: "1.5px solid #323441",
              fontSize: isMobile ? 17 : 15, padding: "11px 13px",
              marginBottom: 3, background: "#23242b", color: "#fff"
            }}
          />
          <div style={{ display: "flex", alignItems: "center" }}>
            <CameraButton onClick={() => { setPendingImgType("food"); fileRef.current.click(); }} />
            <ImgStack imgs={form.foodImgs} onClick={() => {}} />
          </div>
        </div>
        {/* Symptome */}
        <div style={{ flex: 3, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={form.symptomInput}
              onChange={e => setForm(f => ({ ...f, symptomInput: e.target.value }))}
              placeholder="Symptom manuell oder Auswahl..."
              style={{
                flex: 3, borderRadius: 8, border: "1.5px solid #323441",
                fontSize: isMobile ? 17 : 15, padding: "11px 13px",
                background: "#23242b", color: "#fff"
              }}
              onKeyDown={e => {
                if (e.key === "Enter" && form.symptomInput.trim()) {
                  addSymptom(form.symptomInput.trim());
                }
              }}
            />
            <select
              value={form.symptomTime}
              onChange={e => setForm(f => ({ ...f, symptomTime: Number(e.target.value) }))}
              style={{
                flex: 1, minWidth: 70, borderRadius: 8, border: "1.5px solid #323441",
                fontSize: isMobile ? 17 : 15, padding: "11px 7px",
                background: "#23242b", color: "#fff"
              }}
            >
              {TIMES.map(t =>
                <option key={t} value={t}>{t === 0 ? "direkt" : `+${t}min`}</option>
              )}
            </select>
            <button onClick={() => addSymptom(form.symptomInput.trim())}
              style={{
                background: "#32d17c", color: "#fff", border: 0, borderRadius: 8,
                fontSize: isMobile ? 18 : 15, padding: "0 14px", fontWeight: 700, marginLeft: 4
              }}
              title="Symptom hinzufügen"
            >+</button>
            <CameraButton onClick={() => { setPendingImgType("symptoms"); fileRef.current.click(); }} />
            <ImgStack imgs={form.symptomsImgs} onClick={() => {}} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {form.symptoms.map((s, i) =>
              <SymTag
                key={i}
                txt={s.txt}
                time={s.time}
                onDel={() => delSymptom(i)}
              />
            )}
          </div>
        </div>
        {/* Hinzufügen */}
        <div style={{
          flex: isMobile ? "unset" : 1, display: "flex", alignItems: "center",
          justifyContent: isMobile ? "flex-end" : "center", marginTop: isMobile ? 8 : 0
        }}>
          <button
            onClick={addEntry}
            style={{
              padding: isMobile ? "14px 0" : "13px 23px",
              minWidth: isMobile ? "98vw" : 120,
              background: "#4070ea", color: "#fff", fontWeight: 700, fontSize: isMobile ? 18 : 16,
              borderRadius: 11, border: 0, boxShadow: "0 1px 7px #0002", cursor: "pointer"
            }}>
            {editIdx !== null ? "Speichern" : "Hinzufügen"}
          </button>
        </div>
      </div>

      {/* Upload-Input (versteckt) */}
      <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }}
        onChange={e => {
          if (!pendingImgType) return;
          handleAddImg(e, pendingImgType);
          setPendingImgType(null);
        }} />

      {/* Tabelle */}
      <div style={{ overflowX: isMobile ? "auto" : "visible", marginBottom: 28 }}>
        <table style={{
          width: "100%",
          minWidth: 570, borderCollapse: "collapse",
          fontSize: isMobile ? 13.2 : 15, background: "inherit"
        }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #29292c" }}>
              <th style={{ textAlign: "left", padding: "7px 7px" }}>Datum</th>
              <th style={{ textAlign: "left", padding: "7px 7px" }}>Essen / Bild</th>
              <th style={{ textAlign: "left", padding: "7px 7px" }}>Symptome / Bild</th>
              <th style={{ textAlign: "center", padding: "7px 7px" }}>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) =>
              <tr key={i} style={{
                borderBottom: "1.5px solid #242428", background: editIdx === i ? "#252638" : "inherit"
              }}>
                <td style={{ padding: "6px 7px" }}>{e.date}</td>
                <td style={{ padding: "6px 7px", verticalAlign: "top" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <ImgStack imgs={e.foodImgs} />
                    <span style={{ fontWeight: 500 }}>{e.food}</span>
                  </div>
                </td>
                <td style={{ padding: "6px 7px", verticalAlign: "top" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <ImgStack imgs={e.symptomsImgs} />
                    <div style={{ display: "flex", flexWrap: "wrap" }}>
                      {(e.symptoms || []).map((s, si) =>
                        <SymTag key={si} txt={s.txt} time={s.time} />
                      )}
                    </div>
                  </div>
                </td>
                <td style={{ padding: "6px 7px", textAlign: "center", verticalAlign: "top" }}>
                  <button onClick={() => onEditEntry(i)} style={{
                    background: "#23233a", color: "#fff", border: "1px solid #7e7e9c",
                    borderRadius: 8, padding: "8px 15px", margin: 2, fontSize: 14, cursor: "pointer"
                  }}>Bearbeiten</button>
                  <button onClick={() => setEntries(arr => arr.filter((_, j) => j !== i))}
                    style={{
                      background: "#fe7e7e", color: "#fff", border: 0,
                      borderRadius: 7, padding: "7px 13px", margin: 2, fontSize: 16, cursor: "pointer"
                    }}>×</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {!entries.length &&
          <div style={{ textAlign: "center", color: "#aaa", marginTop: 36, fontSize: 18 }}>
            Noch keine Einträge
          </div>
        }
      </div>

      {/* --- Stuhlgang Einträge --- */}
      <div style={{ marginTop: isMobile ? 10 : 32 }}>
        <h3 style={{
          fontWeight: 700, fontSize: isMobile ? 17 : 19, marginBottom: 8
        }}>Stuhlgang Einträge</h3>
        <div style={{
          display: "flex", flexDirection: isMobile ? "column" : "row", gap: 10, alignItems: "center",
          marginBottom: 10
        }}>
          <input
            type="datetime-local"
            value={stoolForm.date}
            onChange={e => setStoolForm(f => ({ ...f, date: e.target.value }))}
            style={{
              borderRadius: 8, border: "1.5px solid #323441", background: "#23242b", color: "#fff",
              fontSize: isMobile ? 16 : 15, padding: "11px 12px", marginBottom: isMobile ? 6 : 0
            }}
          />
          <input
            value={stoolForm.note}
            onChange={e => setStoolForm(f => ({ ...f, note: e.target.value }))}
            placeholder="Notiz (optional)..."
            style={{
              borderRadius: 8, border: "1.5px solid #323441", background: "#23242b", color: "#fff",
              fontSize: isMobile ? 16 : 15, padding: "11px 12px", flex: 1
            }}
          />
          <CameraButton onClick={() => { setPendingImgType("stool"); fileRef.current.click(); }} />
          <ImgStack imgs={stoolForm.imgs} />
          <button
            onClick={addStool}
            style={{
              padding: isMobile ? "14px 0" : "13px 23px",
              minWidth: isMobile ? "98vw" : 120,
              background: "#4070ea", color: "#fff", fontWeight: 700, fontSize: isMobile ? 17 : 16,
              borderRadius: 11, border: 0, boxShadow: "0 1px 7px #0002", cursor: "pointer"
            }}>
            {editStoolIdx !== null ? "Speichern" : "Eintrag speichern"}
          </button>
        </div>
        <div style={{ overflowX: isMobile ? "auto" : "visible" }}>
          <table style={{
            width: "100%", minWidth: 440, borderCollapse: "collapse",
            fontSize: isMobile ? 13.2 : 15, background: "inherit"
          }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #29292c" }}>
                <th style={{ textAlign: "left", padding: "7px 7px" }}>Datum</th>
                <th style={{ textAlign: "left", padding: "7px 7px" }}>Notiz</th>
                <th style={{ textAlign: "left", padding: "7px 7px" }}>Bild(er)</th>
                <th style={{ textAlign: "center", padding: "7px 7px" }}>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {stools.map((e, i) =>
                <tr key={i} style={{
                  borderBottom: "1.5px solid #242428", background: editStoolIdx === i ? "#252638" : "inherit"
                }}>
                  <td style={{ padding: "6px 7px" }}>{e.date && (new Date(e.date)).toLocaleString([], { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" })}</td>
                  <td style={{ padding: "6px 7px" }}>{e.note}</td>
                  <td style={{ padding: "6px 7px", textAlign: "center" }}>
                    <ImgStack imgs={e.imgs} />
                  </td>
                  <td style={{ padding: "6px 7px", textAlign: "center" }}>
                    <button onClick={() => onEditStool(i)} style={{
                      background: "#23233a", color: "#fff", border: "1px solid #7e7e9c",
                      borderRadius: 8, padding: "8px 15px", margin: 2, fontSize: 14, cursor: "pointer"
                    }}>Bearbeiten</button>
                    <button onClick={() => setStools(arr => arr.filter((_, j) => j !== i))}
                      style={{
                        background: "#fe7e7e", color: "#fff", border: 0,
                        borderRadius: 7, padding: "7px 13px", margin: 2, fontSize: 16, cursor: "pointer"
                      }}>×</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {!stools.length &&
            <div style={{ textAlign: "center", color: "#aaa", marginTop: 18, fontSize: 17 }}>
              Noch keine Stuhlgang-Einträge
            </div>
          }
        </div>
      </div>
    </div>
  );
}
