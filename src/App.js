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
  return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// Kamera-Button
const CameraButton = ({ onClick }) => (
  <button onClick={onClick} type="button" title="Foto aufnehmen/hochladen"
    style={{
      width: 34, height: 34, borderRadius: "50%", border: 0,
      background: "#247be5", display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", marginLeft: 8
    }}>
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
  <button onClick={onClick} title="Export PDF"
    style={{
      background: "#d32f2f", color: "#fff", border: 0, borderRadius: 8,
      padding: "6px 18px", fontWeight: 600, fontSize: 16, cursor: "pointer",
      boxShadow: "0 1px 4px #0003"
    }}>
    PDF
  </button>
);

// Theme Switch
const ThemeSwitch = ({ dark, setDark }) => (
  <div style={{ height: 40, display: "flex", alignItems: "center", padding: "0 12px" }}>
    <button onClick={() => setDark(d => !d)} title="Theme wechseln"
      style={{
        background: "none", border: "none", cursor: "pointer", fontSize: 24
      }}>
      {dark ? "🌙" : "☀️"}
    </button>
  </div>
);

// Bild‐Stack (Vorschau)
const ImgStack = ({ imgs, onClick }) => (
  <div style={{ display: "flex", alignItems: "center", gap: -10 }}>
    {imgs.map((src, i) => (
      <img key={i} src={src} alt=""
        onClick={() => onClick?.(i)}
        style={{
          width: 36, height: 36, objectFit: "cover", borderRadius: 8,
          border: "2px solid #fff", boxShadow: "0 1px 6px #0003", zIndex: imgs.length - i,
          marginLeft: i > 0 ? -12 : 0, cursor: onClick ? "pointer" : "default"
        }} />
    ))}
  </div>
);

// Symptom‐Tag
const SymTag = ({ txt, time, dark, onDel }) => (
  <div style={{
    display: "inline-flex", alignItems: "center",
    background: dark ? "#343445" : "#e8f0ff",
    color: dark ? "#f1f1f6" : "#1a1f3d",
    borderRadius: 6, padding: "5px 10px", margin: "3px 4px 3px 0", fontSize: 14
  }}>
    {txt}
    <span style={{ marginLeft: 4, fontSize: 12, opacity: 0.8 }}>
      {time === 0 ? "direkt" : `+${time}min`}
    </span>
    {onDel && (
      <span onClick={onDel} style={{
        marginLeft: 6, cursor: "pointer", fontSize: 16, color: "#c00", fontWeight: 700
      }}>×</span>
    )}
  </div>
);

export default function App() {
  // States
  const [dark, setDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
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
  const [imgView, setImgView] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);

  // Persist
  useEffect(() => localStorage.setItem("fd-entries", JSON.stringify(entries)), [entries]);
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
    if (!files || !files.length) return;
    Array.from(files).forEach(f => {
      const r = new FileReader();
      r.onload = ev => setForm(fm => ({ ...fm, foodImgs: [...fm.foodImgs, ev.target.result] }));
      r.readAsDataURL(f);
    });
    e.target.value = "";
  };

  const handleSymptomDropdown = val => {
    setForm(fm => {
      const exists = fm.symptomDropdown.find(s => s.txt === val && s.time === fm.symptomTime);
      let list = exists
        ? fm.symptomDropdown.filter(s => !(s.txt === val && s.time === fm.symptomTime))
        : [...fm.symptomDropdown, { txt: val, time: fm.symptomTime }];
      return { ...fm, symptomDropdown: list };
    });
  };

  const handleAddSymptom = () => {
    // manuell
    if (form.symptomInput.trim()) {
      setForm(fm => ({
        ...fm,
        symptoms: [...fm.symptoms, { txt: fm.symptomInput.trim(), time: fm.symptomTime }],
        symptomInput: "",
        symptomDropdown: []
      }));
    }
    // aus Dropdown (Multi)
    if (form.symptomDropdown.length) {
      setForm(fm => ({
        ...fm,
        symptoms: [
          ...fm.symptoms,
          ...fm.symptomDropdown.filter(s =>
            !fm.symptoms.some(ex => ex.txt === s.txt && ex.time === s.time)
          )
        ],
        symptomInput: "",
        symptomDropdown: []
      }));
    }
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
      food: e.food,
      foodImgs: e.foodImgs,
      symptomInput: "",
      symptomTime: 0,
      symptomDropdown: [],
      symptoms: e.symptoms
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

  // Export PDF
  const handleExportPDF = async () => {
    const el = document.getElementById("fd-table");
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2 });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "px", format: [canvas.width, canvas.height] });
    pdf.addImage(img, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save("FoodDiary.pdf");
  };

  return (
    <div style={{
      maxWidth: 900, margin: "0 auto 40px auto",
      padding: isMobile ? "0 6px" : "0 24px",
    }}>
      {/* Theme Switch */}
      <ThemeSwitch dark={dark} setDark={setDark} />

      {/* Header + PDF */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 12
      }}>
        <h2 style={{
          margin: 0, fontSize: 28, fontWeight: 700,
          color: dark ? "#f0f0f8" : "#111"
        }}>Food Diary</h2>
        <PdfButton onClick={handleExportPDF} />
      </div>

      {/* Formular */}
      <div style={{
        display: "flex", flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? 12 : 16, marginBottom: 14
      }}>
        {/* Essen */}
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <input
            placeholder="Essen..."
            value={form.food}
            onChange={e => setForm(fm => ({ ...fm, food: e.target.value }))}
            style={{
              flex: 1, fontSize: 16, padding: "10px 12px",
              borderRadius: 8, border: "1px solid #aaa",
              background: dark ? "#2d2d39" : "#fff",
              color: dark ? "#f0f0f8" : "#111"
            }}
          />
          <CameraButton onClick={() => fileRef.current.click()} />
          <input
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            ref={fileRef}
            onChange={handleFile}
          />
        </div>

        {/* Symptome-Eingabe mit Datalist */}
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <input
            list="symptom-list"
            placeholder="Symptom eingeben oder wählen..."
            value={form.symptomInput}
            onChange={e => setForm(fm => ({ ...fm, symptomInput: e.target.value }))}
            style={{
              flex: 2, fontSize: 16, padding: "10px 12px",
              borderRadius: 8, border: "1px solid #aaa",
              background: dark ? "#2d2d39" : "#fff",
              color: dark ? "#f0f0f8" : "#111"
            }}
            onKeyDown={e => e.key === "Enter" && handleAddSymptom()}
          />
          <datalist id="symptom-list">
            {SYMPTOM_CHOICES.map((sym, i) => (
              <option key={i} value={sym} />
            ))}
          </datalist>

          <select
            value={form.symptomTime}
            onChange={e => setForm(fm => ({ ...fm, symptomTime: Number(e.target.value) }))}
            style={{
              flex: 0, marginLeft: 8, fontSize: 15,
              padding: "9px 6px", borderRadius: 8,
              border: "1px solid #aaa",
              background: dark ? "#2d2d39" : "#fff",
              color: dark ? "#f0f0f8" : "#111"
            }}
          >
            {TIMES.map(t => (
              <option key={t} value={t}>
                {t === 0 ? "direkt" : `+${t}min`}
              </option>
            ))}
          </select>

          <button
            onClick={handleAddSymptom}
            title="Symptom hinzufügen"
            style={{
              marginLeft: 8, width: 34, height: 34, borderRadius: "50%",
              border: 0, background: "#18bf53", color: "#fff",
              fontSize: 20, cursor: "pointer"
            }}
          >+</button>
        </div>
      </div>

      {/* Bild-Löschen im Bearbeiten */}
      {form.foodImgs.length > 0 && editIdx !== null && (
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {form.foodImgs.map((img, i) => (
            <div key={i} style={{ position: "relative" }}>
              <img
                src={img} alt=""
                style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 8 }}
              />
              <button
                onClick={() => handleImgDelete(i)}
                style={{
                  position: "absolute", top: -6, right: -6,
                  width: 20, height: 20, borderRadius: "50%",
                  background: "#c00", color: "#fff", border: 0,
                  fontSize: 14, cursor: "pointer"
                }}
                title="Bild entfernen"
              >×</button>
            </div>
          ))}
        </div>
      )}

      {/* Hinzufügen / Speichern */}
      <div style={{ textAlign: isMobile ? "left" : "right", marginBottom: 20 }}>
        <button
          onClick={addEntry}
          style={{
            padding: "12px 28px", fontSize: 18,
            borderRadius: 8, border: 0,
            background: "#247be5", color: "#fff",
            fontWeight: 600, cursor: "pointer"
          }}
        >{editIdx !== null ? "Speichern" : "Hinzufügen"}</button>
      </div>

      {/* Tabelle */}
      <div id="fd-table" style={{
        overflowX: "auto",
        borderRadius: 12, boxShadow: "0 2px 10px #0002"
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
          <thead>
            <tr style={{
              background: dark ? "#262637" : "#f7faff",
              borderBottom: "2px solid #ddd"
            }}>
              {["Datum","Essen","Bilder","Symptome","Aktionen"].map((h, i) => (
                <th key={i} style={{ textAlign: i===4?"center":"left", padding: "10px 8px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.length===0 && (
              <tr>
                <td colSpan={5} style={{
                  textAlign: "center", padding: 28, color: "#888"
                }}>Noch keine Einträge</td>
              </tr>
            )}
            {entries.map((e,i) => (
              <tr key={i} style={{
                background: editIdx===i
                  ? dark?"#2a2c44":"#eef2fa"
                  : "inherit",
                borderBottom: "1.5px solid #ddd"
              }}>
                <td style={{
                  padding: "12px 8px", verticalAlign: "middle"
                }}>{e.date}</td>
                <td style={{
                  padding: "12px 8px", verticalAlign: "middle"
                }}>{e.food}</td>
                <td style={{ padding: "12px 8px" }}>
                  <ImgStack imgs={e.foodImgs} onClick={idx=>setImgView({imgs:e.foodImgs,idx})}/>
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <div style={{ display:"flex", flexWrap:"wrap" }}>
                    {e.symptoms.map((s,si)=>
                      <SymTag key={si} txt={s.txt} time={s.time} dark={dark}/>
                    )}
                  </div>
                </td>
                <td style={{ padding: "8px", textAlign:"center" }}>
                  <button onClick={()=>handleEdit(i)}
                    style={{
                      margin:4,padding:"6px 12px",fontSize:14,
                      borderRadius:6,border:"1px solid #aaa",
                      background:"none",cursor:"pointer"
                    }}>Bearbeiten</button>
                  <button onClick={()=>handleDelete(i)}
                    style={{
                      margin:4,padding:"6px 10px",fontSize:16,
                      borderRadius:6,border:"1px solid #e33",
                      background:"#fee",color:"#c00",cursor:"pointer"
                    }}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Lightbox */}
      {imgView && (
        <div onClick={()=>setImgView(null)} style={{
          position:"fixed",inset:0,background:"#000a",
          display:"flex",alignItems:"center",justifyContent:"center",zIndex:99
        }}>
          <img src={imgView.imgs[imgView.idx]} alt=""
            onClick={e=>e.stopPropagation()}
            style={{
              maxWidth:"95vw",maxHeight:"85vh",borderRadius:12,
              boxShadow:"0 2px 18px #0008"
            }}
          />
        </div>
      )}
    </div>
  );
}
