import React, { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";

// ========== Helper Daten ==========
const SYMPTOMS = [
  "Bauchschmerzen", "Durchfall", "Blähungen", "Hautausschlag", "Juckreiz",
  "Schwellung am Gaumen", "Schleim im Hals", "Niesen", "Kopfschmerzen", "Rötung Haut"
];
const TIMES = [0, 5, 10, 15, 30, 60];
const LS_KEY = "fooddiary_v4";
const LS_STOOL = "fooddiary_stool_v4";

// ========== Mobilerkennung ==========
const useMobile = () => {
  const [mob, setMob] = useState(window.innerWidth < 650);
  useEffect(() => {
    const fn = () => setMob(window.innerWidth < 650);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mob;
};

// ========== KameraButton/Icon ==========
const CameraButton = ({ onClick }) =>
  <button onClick={onClick} style={{
    background: "#4070ea", border: 0, borderRadius: "50%", width: 34, height: 34,
    display: "flex", alignItems: "center", justifyContent: "center", margin: "0 4px",
    cursor: "pointer"
  }} title="Bild hinzufügen" tabIndex={-1}>
    <svg width={20} height={20} fill="#fff" viewBox="0 0 24 24">
      <circle cx={12} cy={12} r={7.5} stroke="#fff" strokeWidth="1.7" fill="#4070ea"/>
      <rect x={7.6} y={9.4} width={8.8} height={6.2} rx={2.3} fill="#fff"/>
      <circle cx={12} cy={12.5} r={1.5} fill="#4070ea"/>
    </svg>
  </button>;

// ========== Bild-Stack ==========
const ImgStack = ({ imgs = [], onClick }) =>
  !imgs.length ? null : (
    <div style={{ display: "flex", alignItems: "center", cursor: "pointer" }} onClick={onClick}>
      {imgs.slice(0, 3).map((img, i) =>
        <img
          key={i}
          src={img.data}
          alt=""
          style={{
            width: 31, height: 31, borderRadius: 8, objectFit: "cover",
            border: "2px solid #fff", marginLeft: i ? -12 : 0, boxShadow: "0 0 3px #0005"
          }}
        />
      )}
      {imgs.length > 3 &&
        <span style={{
          marginLeft: 4, fontSize: 13, background: "#333", color: "#fff", borderRadius: 7,
          padding: "0 5px", fontWeight: 500
        }}>+{imgs.length - 3}</span>
      }
    </div>
  );

// ========== Symptombadge ==========
const SymTag = ({ txt, time, onDel }) =>
  <span style={{
    display: "inline-flex", alignItems: "center", background: "#333", color: "#fff",
    borderRadius: 8, fontSize: 12.5, margin: "2px 3px 2px 0", padding: "4px 8px", fontWeight: 500
  }}>
    {txt}
    <span style={{
      fontSize: 12, marginLeft: 5, opacity: 0.75, background: "#222", borderRadius: 6, padding: "2px 6px"
    }}>{time === 0 ? "direkt" : `+${time}min`}</span>
    {onDel &&
      <span onClick={onDel} style={{
        marginLeft: 6, cursor: "pointer", color: "#fe7e7e", fontWeight: 700, fontSize: 15
      }}>×</span>
    }
  </span>;

// ========== Hilfsfunktion: Bilder automatisch verkleinern (max 900x900px) ==========
function resizeImg(file, maxWH = 900) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new window.Image();
      img.onload = function () {
        let { width, height } = img;
        if (width > maxWH || height > maxWH) {
          const ratio = Math.min(maxWH / width, maxWH / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.92));
      };
      img.onerror = () => resolve(null);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

// ========== Hauptkomponente ==========
export default function App() {
  const mobile = useMobile();
  const fileRef = useRef();
  const [pendingImgType, setPendingImgType] = useState(null);

  // Food
  const [form, setForm] = useState({
    food: "", symptoms: [], symptomInput: "", symptomTime: 0,
    foodImgs: [], symptomsImgs: []
  });
  const [entries, setEntries] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; }
  });
  const [editIdx, setEditIdx] = useState(null);

  // Stuhl
  const [stoolForm, setStoolForm] = useState({ date: "", note: "", imgs: [] });
  const [stools, setStools] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_STOOL)) || []; } catch { return []; }
  });
  const [editStoolIdx, setEditStoolIdx] = useState(null);

  // Fehlerbehandlung für Upload
  const [error, setError] = useState("");

  // LocalStorage persistieren
  useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(entries)); }, [entries]);
  useEffect(() => { localStorage.setItem(LS_STOOL, JSON.stringify(stools)); }, [stools]);

  // Bilder - jetzt: resizing und Fehlerhandling
  async function handleAddImg(e, typ) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    try {
      const imgs = [];
      for (const f of files) {
        const data = await resizeImg(f, 900); // Komprimiere auf max 900px
        if (data) imgs.push({ name: f.name, data });
      }
      if (!imgs.length) throw new Error("Fehler beim Bildimport");
      if (typ === "food") setForm(f => ({ ...f, foodImgs: [...(f.foodImgs || []), ...imgs] }));
      if (typ === "symptoms") setForm(f => ({ ...f, symptomsImgs: [...(f.symptomsImgs || []), ...imgs] }));
      if (typ === "stool") setStoolForm(f => ({ ...f, imgs: [...(f.imgs || []), ...imgs] }));
      setError("");
    } catch {
      setError("Bild konnte nicht verarbeitet werden – bitte anderes Bild wählen!");
    }
  }

  // Entry hinzuf./bearb.
  function addEntry() {
    if (!form.food) return;
    if (editIdx !== null) {
      setEntries(arr => arr.map((e, i) => i === editIdx ? { ...form, date: e.date } : e));
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
    setEditIdx(i); setForm({ ...entries[i] });
  }

  // Symptome
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

  // Stuhl
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
    setEditStoolIdx(i); setStoolForm({ ...stools[i] });
  }

  // Export Excel
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
      minHeight: "100vh",
      background: "#181a1b",
      color: "#fff",
      maxWidth: "100%",
      margin: 0,
      padding: mobile ? "0 0 25px 0" : "28px 0 30px 0",
      boxSizing: "border-box",
      overflowX: "hidden"
    }}>
      <div style={{ maxWidth: mobile ? 430 : 950, margin: "0 auto", padding: mobile ? "12px 8px 0 8px" : "0 0 0 0" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <button onClick={exportExcel} style={{
            background: "#3b82f6", color: "#fff", border: 0, borderRadius: 9,
            padding: "10px 20px", fontSize: 16, fontWeight: 600, boxShadow: "0 1px 4px #0003"
          }}>Exportieren (.xlsx)</button>
        </div>
        <h2 style={{
          fontWeight: 800, fontSize: mobile ? 21 : 24, margin: "7px 0 17px 2px",
          letterSpacing: 0.5, textAlign: "left"
        }}>Food Diary</h2>
        {/* Fehleranzeige */}
        {!!error && <div style={{
          background: "#ffaeae", color: "#600", borderRadius: 7, padding: "10px 15px", fontWeight: 600,
          marginBottom: 12, fontSize: 16, textAlign: "center"
        }}>{error}</div>}

        {/* Eingabe */}
        <div style={{
          display: "flex", flexDirection: mobile ? "column" : "row", alignItems: mobile ? "stretch" : "flex-end",
          gap: mobile ? 9 : 16, marginBottom: 16
        }}>
          {/* Essen */}
          <div style={{ flex: 2, display: "flex", flexDirection: "column", gap: 6 }}>
            <input
              value={form.food}
              onChange={e => setForm(f => ({ ...f, food: e.target.value }))}
              placeholder="Essen..."
              style={{
                width: "100%", maxWidth: mobile ? 340 : 380,
                borderRadius: 8, border: "1.5px solid #323441",
                fontSize: 16, padding: "10px 12px", background: "#23242b", color: "#fff", boxSizing: "border-box"
              }}
            />
            <div style={{ display: "flex", alignItems: "center" }}>
              <CameraButton onClick={() => { setPendingImgType("food"); fileRef.current.click(); }} />
              <ImgStack imgs={form.foodImgs} />
            </div>
          </div>
          {/* Symptome */}
          <div style={{ flex: 3, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                value={form.symptomInput}
                onChange={e => setForm(f => ({ ...f, symptomInput: e.target.value }))}
                placeholder="Symptom oder Auswahl..."
                style={{
                  flex: 3, borderRadius: 8, border: "1.5px solid #323441",
                  fontSize: 16, padding: "10px 12px", background: "#23242b", color: "#fff"
                }}
                onKeyDown={e => {
                  if (e.key === "Enter" && form.symptomInput.trim()) {
                    addSymptom(form.symptomInput.trim());
                  }
                }}
                list="symplist"
              />
              <datalist id="symplist">
                {SYMPTOMS.map(s => <option key={s} value={s} />)}
              </datalist>
              <select
                value={form.symptomTime}
                onChange={e => setForm(f => ({ ...f, symptomTime: Number(e.target.value) }))}
                style={{
                  flex: 1, minWidth: 70, borderRadius: 8, border: "1.5px solid #323441",
                  fontSize: 16, padding: "10px 7px", background: "#23242b", color: "#fff"
                }}
              >
                {TIMES.map(t =>
                  <option key={t} value={t}>{t === 0 ? "direkt" : `+${t}min`}</option>
                )}
              </select>
              <CameraButton onClick={() => { setPendingImgType("symptoms"); fileRef.current.click(); }} />
              <ImgStack imgs={form.symptomsImgs} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              {form.symptoms.map((s, i) =>
                <SymTag key={i} txt={s.txt} time={s.time} onDel={() => delSymptom(i)} />
              )}
            </div>
          </div>
          {/* Hinzufügen */}
          <div style={{
            flex: mobile ? "unset" : 1, display: "flex", alignItems: "center",
            justifyContent: mobile ? "flex-end" : "center", marginTop: mobile ? 8 : 0
          }}>
            <button
              onClick={addEntry}
              style={{
                padding: "12px 0", minWidth: mobile ? "97vw" : 120,
                background: "#4070ea", color: "#fff", fontWeight: 700, fontSize: 17,
                borderRadius: 10, border: 0, boxShadow: "0 1px 7px #0002", cursor: "pointer"
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
            // e.target.value = "" wäre nice, aber nicht bei allen Browsern nötig.
          }} />

        {/* Einträge-List (CARD-VIEW auf Mobile) */}
        <div style={{ marginBottom: 26 }}>
          {entries.length === 0 &&
            <div style={{ textAlign: "center", color: "#aaa", marginTop: 22, fontSize: 17 }}>
              Noch keine Einträge
            </div>
          }
          {entries.map((e, i) => mobile ? (
            <div key={i} style={{
              background: editIdx === i ? "#252638" : "#23242b", borderRadius: 11, marginBottom: 10,
              boxShadow: "0 1px 7px #0001", padding: "13px 11px"
            }}>
              <div style={{ fontSize: 14.5, marginBottom: 2, fontWeight: 600 }}>{e.date}</div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3 }}>
                <ImgStack imgs={e.foodImgs} />
                <span style={{ fontWeight: 500 }}>{e.food}</span>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 5 }}>
                <ImgStack imgs={e.symptomsImgs} />
                <div style={{ display: "flex", flexWrap: "wrap" }}>
                  {(e.symptoms || []).map((s, si) =>
                    <SymTag key={si} txt={s.txt} time={s.time} />
                  )}
                </div>
              </div>
              <div>
                <button onClick={() => onEditEntry(i)} style={{
                  background: "#23233a", color: "#fff", border: "1px solid #7e7e9c",
                  borderRadius: 8, padding: "8px 14px", marginRight: 7, fontSize: 14, cursor: "pointer"
                }}>Bearbeiten</button>
                <button onClick={() => setEntries(arr => arr.filter((_, j) => j !== i))}
                  style={{
                    background: "#fe7e7e", color: "#fff", border: 0,
                    borderRadius: 7, padding: "7px 13px", fontSize: 16, cursor: "pointer"
                  }}>×</button>
              </div>
            </div>
          ) : (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 9,
              background: editIdx === i ? "#252638" : "#23242b",
              borderRadius: 11, marginBottom: 10, padding: "13px 12px",
              boxShadow: "0 1px 6px #0001"
            }}>
              <div style={{ minWidth: 82 }}>
                <div style={{ fontSize: 14.2, fontWeight: 600 }}>{e.date}</div>
                <ImgStack imgs={e.foodImgs} />
              </div>
              <div style={{ flex: 1, fontWeight: 500 }}>{e.food}</div>
              <div style={{ minWidth: 90, display: "flex", flexDirection: "column" }}>
                <ImgStack imgs={e.symptomsImgs} />
                <div style={{ display: "flex", flexWrap: "wrap" }}>
                  {(e.symptoms || []).map((s, si) =>
                    <SymTag key={si} txt={s.txt} time={s.time} />
                  )}
                </div>
              </div>
              <div>
                <button onClick={() => onEditEntry(i)} style={{
                  background: "#23233a", color: "#fff", border: "1px solid #7e7e9c",
                  borderRadius: 8, padding: "8px 14px", marginRight: 7, fontSize: 14, cursor: "pointer"
                }}>Bearbeiten</button>
                <button onClick={() => setEntries(arr => arr.filter((_, j) => j !== i))}
                  style={{
                    background: "#fe7e7e", color: "#fff", border: 0,
                    borderRadius: 7, padding: "7px 13px", fontSize: 16, cursor: "pointer"
                  }}>×</button>
              </div>
            </div>
          ))}
        </div>

        {/* Stuhlgang-Einträge */}
        <div style={{ marginTop: 6 }}>
          <h3 style={{ fontWeight: 700, fontSize: mobile ? 17 : 19, marginBottom: 8 }}>Stuhlgang Einträge</h3>
          <div style={{
            display: "flex", flexDirection: mobile ? "column" : "row", gap: 8, alignItems: "center",
            marginBottom: 10
          }}>
            <input
              type="datetime-local"
              value={stoolForm.date}
              onChange={e => setStoolForm(f => ({ ...f, date: e.target.value }))}
              style={{
                borderRadius: 8, border: "1.5px solid #323441", background: "#23242b", color: "#fff",
                fontSize: 16, padding: "10px 10px", marginBottom: mobile ? 6 : 0, maxWidth: 220
              }}
            />
            <input
              value={stoolForm.note}
              onChange={e => setStoolForm(f => ({ ...f, note: e.target.value }))}
              placeholder="Notiz (optional)..."
              style={{
                borderRadius: 8, border: "1.5px solid #323441", background: "#23242b", color: "#fff",
                fontSize: 16, padding: "10px 10px", flex: 1, maxWidth: mobile ? 340 : 420
              }}
            />
            <CameraButton onClick={() => { setPendingImgType("stool"); fileRef.current.click(); }} />
            <ImgStack imgs={stoolForm.imgs} />
            <button
              onClick={addStool}
              style={{
                padding: "12px 0", minWidth: mobile ? "97vw" : 120,
                background: "#4070ea", color: "#fff", fontWeight: 700, fontSize: 16,
                borderRadius: 10, border: 0, boxShadow: "0 1px 7px #0002", cursor: "pointer"
              }}>
              {editStoolIdx !== null ? "Speichern" : "Eintrag speichern"}
            </button>
          </div>
          <div>
            {stools.length === 0 &&
              <div style={{ textAlign: "center", color: "#aaa", marginTop: 14, fontSize: 16 }}>
                Noch keine Stuhlgang-Einträge
              </div>
            }
            {stools.map((e, i) => (
              <div key={i} style={{
                background: editStoolIdx === i ? "#252638" : "#23242b", borderRadius: 11, marginBottom: 9,
                boxShadow: "0 1px 7px #0001", padding: "11px 11px"
              }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{e.date && (new Date(e.date)).toLocaleString([], { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" })}</div>
                <div style={{ fontSize: 15 }}>{e.note}</div>
                <ImgStack imgs={e.imgs} />
                <div style={{ marginTop: 6 }}>
                  <button onClick={() => onEditStool(i)} style={{
                    background: "#23233a", color: "#fff", border: "1px solid #7e7e9c",
                    borderRadius: 8, padding: "8px 15px", marginRight: 7, fontSize: 14, cursor: "pointer"
                  }}>Bearbeiten</button>
                  <button onClick={() => setStools(arr => arr.filter((_, j) => j !== i))}
                    style={{
                      background: "#fe7e7e", color: "#fff", border: 0,
                      borderRadius: 7, padding: "7px 13px", fontSize: 16, cursor: "pointer"
                    }}>×</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
