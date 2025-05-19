import React, { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const SYMPTOMS = [
  "Bauchschmerzen", "Durchfall", "Blähungen", "Hautausschlag", "Juckreiz",
  "Schwellung am Gaumen", "Schleim im Hals", "Niesen", "Kopfschmerzen", "Rötung Haut"
];
const TIMES = [0, 5, 10, 15, 30, 60];

function now() {
  let d = new Date();
  return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Kamera Button
const CameraButton = ({ onClick }) => (
  <button onClick={onClick}
    style={{
      background: "#222", border: 0, borderRadius: "50%", width: 35, height: 35,
      display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 7, cursor: "pointer",
      boxShadow: "0 1px 5px #0001"
    }}
    title="Bild hinzufügen"
    tabIndex={-1}
  >
    <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
      <rect x="2" y="9" width="44" height="32" rx="7" fill="#fd3434" />
      <circle cx="24" cy="25" r="10" fill="#fff" />
      <circle cx="24" cy="25" r="6" fill="#fd3434" />
      <rect x="7" y="3" width="7" height="7" rx="2.5" fill="#fd3434" />
    </svg>
  </button>
);

// Plus Button (grün)
const PlusButton = ({ onClick }) => (
  <button onClick={onClick}
    style={{
      background: "#20d06b", border: 0, borderRadius: "50%", width: 33, height: 33,
      display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 7, cursor: "pointer",
      boxShadow: "0 1px 5px #0001"
    }}
    title="Symptom hinzufügen"
    tabIndex={-1}
  >
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
      <rect x="7" y="2" width="4" height="14" rx="2" fill="#fff" />
      <rect x="2" y="7" width="14" height="4" rx="2" fill="#fff" />
    </svg>
  </button>
);

// Bildstapel mit Löschen im Edit-Modus
function ImgStack({ imgs = [], onClick, editable, onRemove }) {
  if (!imgs.length) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
      {imgs.map((img, i) => (
        <div key={i} style={{ marginLeft: i === 0 ? 0 : -12, position: "relative" }}>
          <img
            src={img}
            alt=""
            style={{
              width: 38, height: 38, objectFit: "cover", borderRadius: 8,
              border: "2px solid #23242b", boxShadow: "0 1px 6px #0003", cursor: "pointer"
            }}
            onClick={() => onClick?.(i)}
            tabIndex={0}
          />
          {editable && (
            <button
              onClick={() => onRemove(i)}
              style={{
                position: "absolute", top: -7, right: -7, background: "#fe7e7e",
                border: "none", borderRadius: "50%", width: 19, height: 19, color: "#fff",
                fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: "0 1px 5px #0002", zIndex: 2
              }}>×</button>
          )}
        </div>
      ))}
    </div>
  );
}

function SymTag({ txt, time, onDel }) {
  return (
    <span style={{
      background: "#323441", color: "#fff", fontSize: 13.2, padding: "5px 11px 5px 8px",
      borderRadius: 7, margin: "0 3px 3px 0", display: "inline-flex", alignItems: "center"
    }}>
      {txt} <span style={{ fontSize: 12, opacity: 0.7, marginLeft: 3 }}>{time === 0 ? "direkt" : `+${time}min`}</span>
      {onDel && (
        <button onClick={onDel} style={{
          marginLeft: 6, color: "#fe7e7e", background: "none", border: "none", cursor: "pointer", fontSize: 16
        }}>×</button>
      )}
    </span>
  );
}

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 600);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 600);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

export default function App() {
  const [entries, setEntries] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fd_entries") || "[]"); }
    catch { return []; }
  });
  const [form, setForm] = useState({
    food: "", foodImgs: [], symptomInput: "", symptomTime: 0, symptoms: []
  });
  const [editIdx, setEditIdx] = useState(null);
  const [imgModal, setImgModal] = useState(null);
  const [pendingImgType, setPendingImgType] = useState(null);
  const fileRef = useRef();
  const mobile = useIsMobile();

  useEffect(() => {
    localStorage.setItem("fd_entries", JSON.stringify(entries));
  }, [entries]);

  function addSymptom() {
    if (!form.symptomInput.trim()) return;
    setForm(f => ({
      ...f,
      symptoms: [...f.symptoms, { txt: f.symptomInput.trim(), time: f.symptomTime }],
      symptomInput: ""
    }));
  }

  function delSymptom(i) {
    setForm(f => ({ ...f, symptoms: f.symptoms.filter((_, j) => j !== i) }));
  }

  function handleAddImg(e, type) {
    let files = Array.from(e.target.files || []);
    if (!files.length) return;
    Promise.all(files.map(f =>
      new Promise(res => {
        const r = new FileReader();
        r.onload = ev => res(ev.target.result);
        r.readAsDataURL(f);
      })
    )).then(imgs => {
      setForm(f => ({
        ...f,
        [type === "food" ? "foodImgs" : "foodImgs"]: [...(f[type === "food" ? "foodImgs" : "foodImgs"] || []), ...imgs]
      }));
    });
    e.target.value = "";
  }

  function addEntry() {
    if (!form.food.trim()) return;
    const entry = {
      date: now(), food: form.food, foodImgs: form.foodImgs,
      symptoms: form.symptoms
    };
    if (editIdx !== null) {
      let arr = [...entries];
      arr[editIdx] = entry;
      setEntries(arr);
      setEditIdx(null);
    } else {
      setEntries(arr => [entry, ...arr]);
    }
    setForm({
      food: "", foodImgs: [], symptomInput: "", symptomTime: 0, symptoms: []
    });
  }

  function onEditEntry(idx) {
    let e = entries[idx];
    setEditIdx(idx);
    setForm({
      food: e.food,
      foodImgs: e.foodImgs,
      symptomInput: "",
      symptomTime: 0,
      symptoms: e.symptoms || []
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // PDF Export
  function handleExportPDF() {
    // Element, das als PDF exportiert werden soll (nur der Bereich mit Einträgen)
    const area = document.getElementById("export-pdf-area");
    if (!area) return;

    html2canvas(area, { scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4"
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      // Verhältnis wahren
      const imgWidth = pageWidth - 40;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let y = 20;
      pdf.addImage(imgData, "PNG", 20, y, imgWidth, imgHeight, undefined, 'FAST');
      pdf.save("FoodDiary.pdf");
    });
  }

  // Mobil: Button Farbe für PDF Export
  const pdfBtnStyle = {
    background: "#fd3434",
    color: "#fff",
    border: "none",
    borderRadius: 9,
    padding: mobile ? "11px 0" : "10px 28px",
    fontWeight: 700,
    fontSize: mobile ? 17 : 16,
    cursor: "pointer",
    marginRight: 20,
    minWidth: mobile ? "96vw" : 160,
    boxShadow: "0 1px 7px #0002",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10
  };

  // Haupt-Layout
  return (
    <div style={{
      minHeight: "100vh",
      background: "#191a22",
      color: "#fff",
      fontFamily: "Inter, Arial, sans-serif",
      padding: mobile ? 6 : 0
    }}>
      <div style={{
        maxWidth: 620, margin: "0 auto", background: "#23242b",
        borderRadius: 15, boxShadow: "0 3px 28px #0002",
        padding: mobile ? "15px 7px" : "32px 35px", marginTop: 24
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{
            fontWeight: 700, fontSize: 26, margin: 0, letterSpacing: 0.2, color: "#fff"
          }}>Food Diary</h2>
          <button
            onClick={handleExportPDF}
            style={pdfBtnStyle}
            title="Exportiere deine Daten als PDF"
          >
            <svg height="19" viewBox="0 0 24 24" width="19" style={{ marginRight: 6 }}>
              <rect width="24" height="24" rx="4" fill="#fff" />
              <rect x="3" y="3" width="18" height="18" rx="4" fill="#fd3434" />
              <text x="12" y="17" fontFamily="Arial, Helvetica, sans-serif" fontWeight="bold" fontSize="10" textAnchor="middle" fill="#fff">PDF</text>
            </svg>
            Export PDF
          </button>
        </div>
        {/* Formulare */}
        <div style={{
          display: "flex", flexDirection: mobile ? "column" : "row", gap: 10, alignItems: "flex-start",
          marginBottom: 14
        }}>
          {/* Essen */}
          <div style={{
            flex: mobile ? "unset" : 2,
            display: "flex", alignItems: "center", width: mobile ? "100vw" : "auto", maxWidth: 350
          }}>
            <input
              value={form.food}
              onChange={e => setForm(f => ({ ...f, food: e.target.value }))}
              placeholder="Essen..."
              style={{
                flex: 3, borderRadius: 8, border: "1.5px solid #323441",
                fontSize: 16, padding: "10px 12px", background: "#23242b", color: "#fff",
                minWidth: 0, width: mobile ? "90vw" : 190, marginRight: 7
              }}
              onKeyDown={e => {
                if (e.key === "Enter" && form.food.trim()) addEntry();
              }}
            />
            <CameraButton onClick={() => { setPendingImgType("food"); fileRef.current.click(); }} />
          </div>
          {/* Symptome */}
          <div style={{
            flex: 3, minWidth: mobile ? "98vw" : 180,
            display: "flex", flexDirection: "column"
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              width: "100%", marginBottom: 6
            }}>
              <input
                value={form.symptomInput}
                onChange={e => setForm(f => ({ ...f, symptomInput: e.target.value }))}
                placeholder="Symptom oder Auswahl..."
                style={{
                  flex: 3, borderRadius: 8, border: "1.5px solid #323441",
                  fontSize: 16, padding: "10px 12px", background: "#23242b", color: "#fff"
                }}
                onKeyDown={e => {
                  if (e.key === "Enter" && form.symptomInput.trim()) addSymptom();
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
              <PlusButton onClick={addSymptom} />
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
          }} />

        {/* Einträge-List */}
        <div id="export-pdf-area" style={{ marginBottom: 26 }}>
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
                <ImgStack
                  imgs={e.foodImgs}
                  onClick={idx => setImgModal({ open: true, imgs: e.foodImgs, idx })}
                  editable={editIdx === i}
                  onRemove={idx => {
                    if (editIdx === i) setForm(f => ({ ...f, foodImgs: f.foodImgs.filter((_, j) => j !== idx) }));
                  }}
                />
                <span style={{ fontWeight: 500 }}>{e.food}</span>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3, flexWrap: "wrap" }}>
                {e.symptoms.map((s, si) => (
                  <SymTag key={si} txt={s.txt} time={s.time} />
                ))}
              </div>
              <div style={{ display: "flex", gap: 7, marginTop: 6 }}>
                <button onClick={() => onEditEntry(i)}
                  style={{
                    background: "#323441", color: "#fff", borderRadius: 7, border: 0,
                    padding: "8px 16px", fontSize: 15, fontWeight: 600, cursor: "pointer"
                  }}>Bearbeiten</button>
                <button onClick={() => setEntries(arr => arr.filter((_, j) => j !== i))}
                  style={{
                    background: "#fe7e7e", color: "#fff", borderRadius: 7, border: 0,
                    padding: "8px 12px", fontWeight: 700, fontSize: 15, cursor: "pointer"
                  }}>×</button>
              </div>
            </div>
          ) : (
            <div key={i} style={{
              display: "flex", alignItems: "center",
              background: editIdx === i ? "#252638" : "#23242b",
              borderRadius: 11, marginBottom: 10, boxShadow: "0 1px 7px #0001", padding: "10px 17px"
            }}>
              <div style={{ width: 100, fontWeight: 600, fontSize: 14.5 }}>{e.date}</div>
              <div style={{ minWidth: 120, flex: 2, display: "flex", alignItems: "center", gap: 7 }}>
                <ImgStack
                  imgs={e.foodImgs}
                  onClick={idx => setImgModal({ open: true, imgs: e.foodImgs, idx })}
                  editable={editIdx === i}
                  onRemove={idx => {
                    if (editIdx === i) setForm(f => ({ ...f, foodImgs: f.foodImgs.filter((_, j) => j !== idx) }));
                  }}
                />
                <span style={{ fontWeight: 500 }}>{e.food}</span>
              </div>
              <div style={{ flex: 3, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 3, minHeight: 28 }}>
                {e.symptoms.map((s, si) => (
                  <SymTag key={si} txt={s.txt} time={s.time} />
                ))}
              </div>
              <div style={{ display: "flex", gap: 7 }}>
                <button onClick={() => onEditEntry(i)}
                  style={{
                    background: "#323441", color: "#fff", borderRadius: 7, border: 0,
                    padding: "8px 16px", fontSize: 15, fontWeight: 600, cursor: "pointer"
                  }}>Bearbeiten</button>
                <button onClick={() => setEntries(arr => arr.filter((_, j) => j !== i))}
                  style={{
                    background: "#fe7e7e", color: "#fff", borderRadius: 7, border: 0,
                    padding: "8px 12px", fontWeight: 700, fontSize: 15, cursor: "pointer"
                  }}>×</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bild-Anzeige Modal */}
      {imgModal?.open &&
        <div style={{
          position: "fixed", inset: 0, background: "#000a", zIndex: 99, display: "flex",
          alignItems: "center", justifyContent: "center", flexDirection: "column"
        }}>
          <img
            src={imgModal.imgs[imgModal.idx]}
            alt=""
            style={{
              maxWidth: "95vw", maxHeight: "85vh", borderRadius: 13, boxShadow: "0 2px 22px #0008"
            }}
          />
          {imgModal.imgs.length > 1 &&
            <div style={{ display: "flex", gap: 18, marginTop: 13 }}>
              <button onClick={() =>
                setImgModal(m => ({
                  ...m,
                  idx: (m.idx - 1 + m.imgs.length) % m.imgs.length
                }))
              } style={{
                background: "#fff1", color: "#fff", border: 0, borderRadius: "50%",
                width: 40, height: 40, fontSize: 23, fontWeight: 900, cursor: "pointer"
              }}>‹</button>
              <button onClick={() =>
                setImgModal(m => ({
                  ...m,
                  idx: (m.idx + 1) % m.imgs.length
                }))
              } style={{
                background: "#fff1", color: "#fff", border: 0, borderRadius: "50%",
                width: 40, height: 40, fontSize: 23, fontWeight: 900, cursor: "pointer"
              }}>›</button>
            </div>
          }
          <button
            onClick={() => setImgModal(null)}
            style={{
              marginTop: 20, padding: "11px 30px", background: "#23242b", color: "#fff",
              borderRadius: 8, fontWeight: 700, fontSize: 17, border: 0, cursor: "pointer"
            }}
          >Schließen</button>
        </div>
      }
    </div>
  );
}
