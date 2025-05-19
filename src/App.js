import React, { useRef, useState, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const SYMPTOM_CHOICES = [
  "Bauchschmerzen", "Durchfall", "Blähungen", "Hautausschlag", "Juckreiz",
  "Schwellung am Gaumen", "Schleim im Hals", "Niesen", "Kopfschmerzen", "Rötung Haut"
];
const TIMES = [0, 5, 10, 15, 30, 60];

function now() {
  let d = new Date();
  return d.toLocaleDateString() + " " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const CameraButton = ({ onClick }) => (
  <button
    onClick={onClick}
    style={{
      background: "#1976d2", border: 0, borderRadius: "50%",
      width: 32, height: 32, marginLeft: 6, display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer"
    }}
    title="Bild hinzufügen"
    tabIndex={-1}
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="7" width="20" height="11" rx="4" fill="#fff" />
      <circle cx="12" cy="13" r="4" fill="#1976d2" />
      <rect x="7" y="2" width="10" height="5" rx="2.5" fill="#1976d2" />
    </svg>
  </button>
);

const SymTag = ({ txt, time, onDel }) => (
  <div style={{
    background: "#2d7bea22", color: "#1b1f2b", borderRadius: 8,
    display: "inline-flex", alignItems: "center", padding: "5px 11px", margin: 2, fontSize: 14
  }}>
    {txt}
    <span style={{ fontSize: 11, marginLeft: 4, color: "#888" }}>
      {time === 0 ? "direkt" : "+" + time + "min"}
    </span>
    {onDel && (
      <span onClick={onDel} style={{
        marginLeft: 6, color: "#d03", fontWeight: 700, cursor: "pointer", fontSize: 17, lineHeight: "13px"
      }}>&times;</span>
    )}
  </div>
);

const ImgStack = ({ imgs = [], onClick, editable, onDel }) =>
  imgs.length ? (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      {imgs.map((im, i) => (
        <div key={i} style={{
          position: "relative", zIndex: imgs.length - i,
          marginLeft: i > 0 ? -10 : 0
        }}>
          <img
            src={im}
            alt=""
            onClick={onClick ? () => onClick(i) : undefined}
            style={{
              width: 32, height: 32, objectFit: "cover", borderRadius: 8,
              border: "2px solid #fff", boxShadow: "0 1px 4px #0002", cursor: onClick ? "pointer" : "default"
            }}
          />
          {editable && onDel &&
            <span onClick={() => onDel(i)} style={{
              position: "absolute", top: -6, right: -6,
              background: "#fff", color: "#c00", borderRadius: "50%",
              width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 700, cursor: "pointer", border: "1px solid #ddd"
            }}>×</span>
          }
        </div>
      ))}
    </div>
  ) : null;

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 600);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 600);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

// ========== Hauptkomponente ==========
export default function FoodDiary() {
  const [form, setForm] = useState({
    food: "", symptoms: [], symptomInput: "", symptomTime: 0, foodImgs: []
  });
  const [entries, setEntries] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("fd-entries") || "[]");
    } catch { return []; }
  });
  const [editIdx, setEditIdx] = useState(null);
  const [imgView, setImgView] = useState(null);
  const fileRef = useRef();
  const mobile = useIsMobile();

  useEffect(() => {
    localStorage.setItem("fd-entries", JSON.stringify(entries));
  }, [entries]);

  function addImgs(e, arrKey = "foodImgs") {
    let files = Array.from(e.target.files);
    Promise.all(files.map(f => {
      return new Promise(res => {
        let r = new FileReader();
        r.onload = ev => res(ev.target.result);
        r.readAsDataURL(f);
      });
    })).then(imgs => {
      setForm(f => ({
        ...f, [arrKey]: [...(f[arrKey] || []), ...imgs]
      }));
      fileRef.current.value = null;
    });
  }

  function handleAddSymptom() {
    if (!form.symptomInput.trim()) return;
    setForm(f => ({
      ...f,
      symptoms: [
        ...(f.symptoms || []),
        { custom: f.symptomInput.trim(), time: f.symptomTime }
      ],
      symptomInput: ""
    }));
  }

  function addEntry() {
    if (!form.food.trim() && !form.symptoms.length) return;
    const newEntry = {
      date: now(),
      food: form.food,
      foodImgs: form.foodImgs,
      symptoms: form.symptoms
    };
    if (editIdx !== null) {
      setEntries(e =>
        e.map((x, i) => (i === editIdx ? newEntry : x))
      );
      setEditIdx(null);
    } else {
      setEntries(e => [newEntry, ...e]);
    }
    setForm({
      food: "", symptoms: [], symptomInput: "", symptomTime: 0, foodImgs: []
    });
  }

  function handleEdit(i) {
    const e = entries[i];
    setForm({
      food: e.food,
      foodImgs: [...(e.foodImgs || [])],
      symptoms: e.symptoms ? [...e.symptoms] : [],
      symptomInput: "",
      symptomTime: 0
    });
    setEditIdx(i);
  }

  function handleDelete(i) {
    setEntries(e => e.filter((_, j) => j !== i));
    if (editIdx === i) setEditIdx(null);
  }

  function handleDelFoodImg(idx) {
    setForm(f => ({
      ...f, foodImgs: f.foodImgs.filter((_, i) => i !== idx)
    }));
  }

  async function handleExportPDF() {
    const el = document.getElementById("food-diary-table");
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [canvas.width, canvas.height]
    });
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save("food-diary.pdf");
  }

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "20px auto",
        background: "#181a20",
        color: "#f6f6fa",
        borderRadius: 18,
        boxShadow: "0 2px 24px #0003",
        padding: mobile ? "16px 4px" : 32,
        fontFamily: "Inter,sans-serif",
        position: "relative",
        minHeight: "100vh",
        overflowX: "hidden"
      }}
    >
      {/* Header mit PDF-Button */}
      <div style={{
        position: "relative",
        minHeight: 38,
        marginBottom: 20
      }}>
        <button
          onClick={handleExportPDF}
          style={{
            background: "#b71c1c",
            color: "#fff",
            fontWeight: 600,
            fontSize: 15,
            padding: "5px 17px",
            borderRadius: 7,
            border: 0,
            position: "absolute",
            top: 0,
            right: 0,
            zIndex: 10,
            cursor: "pointer",
            boxShadow: "0 1px 5px #0002"
          }}
        >
          PDF
        </button>
        <h2 style={{
          margin: 0,
          padding: 0,
          fontWeight: 600,
          fontSize: 23,
          letterSpacing: 0.3,
          color: "#f6f6fa"
        }}>
          Food Diary
        </h2>
      </div>

      {/* Eingabebereich: Responsive Stacking! */}
      <div style={{
        display: "flex",
        flexDirection: mobile ? "column" : "row",
        gap: mobile ? 10 : 14,
        alignItems: mobile ? "stretch" : "flex-end",
        marginBottom: 18,
        position: "relative"
      }}>
        {/* Essen */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          width: mobile ? "100%" : 210
        }}>
          <input
            value={form.food}
            onChange={e => setForm(f => ({ ...f, food: e.target.value }))}
            placeholder="Essen..."
            style={{
              border: "1.4px solid #40444c",
              background: "#232531",
              color: "#f6f6fa",
              borderRadius: 7,
              fontSize: 15,
              padding: "8px 13px",
              flex: 1,
              width: mobile ? "100%" : 160,
              minWidth: 0,
              outline: "none"
            }}
          />
          <CameraButton onClick={() => fileRef.current.click()} />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={e => addImgs(e, "foodImgs")}
          />
        </div>

        {/* Bilder */}
        <div style={{ alignSelf: "center", marginTop: mobile ? 6 : 0 }}>
          <ImgStack
            imgs={form.foodImgs}
            onClick={i => setImgView({ imgs: form.foodImgs, idx: i })}
            editable={editIdx !== null}
            onDel={handleDelFoodImg}
          />
        </div>

        {/* Symptome als eigene Zeile auf Mobile */}
        <div style={{
          width: mobile ? "100%" : 320,
          display: "flex",
          alignItems: "center",
          gap: 7,
          marginTop: mobile ? 8 : 0
        }}>
          <input
            value={form.symptomInput || ""}
            onChange={e => setForm(f => ({ ...f, symptomInput: e.target.value }))}
            placeholder="Symptom manuell..."
            style={{
              width: mobile ? "66%" : 135,
              border: "1.4px solid #40444c",
              background: "#232531",
              color: "#f6f6fa",
              borderRadius: 7,
              fontSize: 15,
              padding: "8px 11px",
              flex: 2
            }}
            onKeyDown={e => e.key === "Enter" && handleAddSymptom()}
          />
          <select
            value={form.symptomTime || 0}
            onChange={e => setForm(f => ({ ...f, symptomTime: Number(e.target.value) }))}
            style={{
              height: 33,
              borderRadius: 6,
              fontSize: 14,
              background: "#232531",
              color: "#f6f6fa",
              border: "1.4px solid #40444c",
              flex: 1,
              minWidth: 64
            }}
          >
            {TIMES.map(t => (
              <option key={t} value={t}>
                {t === 0 ? "direkt" : "+" + t + "min"}
              </option>
            ))}
          </select>
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
              fontSize: 18,
              marginLeft: 2
            }}
            tabIndex={-1}
            title="Symptom hinzufügen"
          >+</button>
        </div>
      </div>

      {/* Symptome als Tags */}
      <div style={{ margin: "2px 0 15px 0", minHeight: 24, display: "flex", flexWrap: "wrap", gap: 2 }}>
        {(form.symptoms || []).map((s, i) => (
          <SymTag
            key={i}
            txt={s.custom}
            time={s.time}
            onDel={() => setForm(f => ({ ...f, symptoms: f.symptoms.filter((_, k) => k !== i) }))}
          />
        ))}
      </div>

      {/* Hinzufügen/Ändern */}
      <button
        onClick={addEntry}
        style={{
          display: "block",
          marginLeft: "auto",
          marginRight: 0,
          marginBottom: 10,
          background: "#2d7bea",
          color: "#fff",
          fontWeight: 600,
          fontSize: 16,
          padding: "10px 26px",
          borderRadius: 8,
          border: 0,
          cursor: "pointer",
          boxShadow: "0 1px 6px #0002"
        }}
      >{editIdx !== null ? "Ändern" : "Hinzufügen"}</button>

      {/* Einträge als Tabelle */}
      <div
        id="food-diary-table"
        style={{
          background: "#22232a",
          borderRadius: 15,
          marginTop: 16,
          boxShadow: "0 1px 8px #0002",
          overflowX: "auto"
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ color: "#fff", fontSize: 15, borderBottom: "2px solid #353540" }}>
              <th style={{ textAlign: "left", padding: "8px 10px" }}>Datum</th>
              <th style={{ textAlign: "left", padding: "8px 10px" }}>Essen</th>
              <th style={{ textAlign: "left", padding: "8px 10px" }}>Bilder</th>
              <th style={{ textAlign: "left", padding: "8px 10px" }}>Symptome</th>
              <th style={{ textAlign: "center", padding: "8px 10px" }}>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={i}
                style={{
                  borderBottom: "1.5px solid #292936",
                  background: editIdx === i ? "#21294a" : "inherit"
                }}>
                <td style={{ padding: "8px 10px" }}>{e.date}</td>
                <td style={{ padding: "8px 10px", fontWeight: 500 }}>{e.food}</td>
                <td style={{ padding: "8px 10px" }}>
                  <ImgStack
                    imgs={e.foodImgs}
                    onClick={ii => setImgView({ imgs: e.foodImgs, idx: ii })}
                  />
                </td>
                <td style={{ padding: "8px 10px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                    {e.symptoms?.map((s, si) =>
                      <SymTag
                        key={si}
                        txt={s.custom}
                        time={s.time}
                      />
                    )}
                  </div>
                </td>
                <td style={{ padding: "8px 10px", textAlign: "center" }}>
                  <button
                    onClick={() => handleEdit(i)}
                    style={{
                      background: "#191e29", color: "#fff", border: "1px solid #4763a5",
                      borderRadius: 6, padding: "6px 14px", margin: 2, fontSize: 13, cursor: "pointer"
                    }}
                  >Bearbeiten</button>
                  <button
                    onClick={() => handleDelete(i)}
                    style={{
                      background: "#fff0f0", border: "1px solid #e88", borderRadius: 6,
                      padding: "6px 11px", margin: 2, color: "#c00", fontSize: 15, cursor: "pointer"
                    }}
                  >×</button>
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} style={{ color: "#aaa", textAlign: "center", fontSize: 17, padding: 34 }}>
                  Noch keine Einträge
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Image Viewer (Pop-up) */}
      {imgView &&
        <div style={{
          position: "fixed", zIndex: 10000, inset: 0,
          background: "#222a", display: "flex", alignItems: "center", justifyContent: "center"
        }}
          onClick={() => setImgView(null)}
        >
          <img
            src={imgView.imgs[imgView.idx || 0]}
            alt=""
            style={{
              maxWidth: "97vw", maxHeight: "85vh", borderRadius: 16, boxShadow: "0 2px 16px #000c",
              background: "#333", padding: 8
            }}
            onClick={e => e.stopPropagation()}
          />
          {imgView.imgs.length > 1 &&
            <div style={{
              position: "absolute", bottom: 33, left: 0, right: 0,
              display: "flex", justifyContent: "center", gap: 6
            }}>
              {imgView.imgs.map((im, i) =>
                <img
                  key={i}
                  src={im}
                  alt=""
                  style={{
                    width: 54, height: 54, objectFit: "cover", borderRadius: 9,
                    border: "2.5px solid #fff",
                    opacity: i === imgView.idx ? 1 : 0.65,
                    cursor: "pointer"
                  }}
                  onClick={ev => { ev.stopPropagation(); setImgView(v => ({ ...v, idx: i })); }}
                />
              )}
            </div>
          }
        </div>
      }
    </div>
  );
}
