import React, { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";

const SYMPTOM_CHOICES = [
  "Bauchschmerzen", "Durchfall", "Blähungen", "Hautausschlag", "Juckreiz",
  "Schwellung am Gaumen", "Schleim im Hals", "Niesen", "Kopfschmerzen", "Rötung Haut"
];
const TIMES = [0, 5, 10, 15, 30, 60];

function now() {
  let d = new Date();
  return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const CameraButton = ({ onClick }) => (
  <button
    onClick={e => { e.stopPropagation(); onClick(); }}
    style={{
      background: "#f3f8fb", border: 0, borderRadius: "50%",
      width: 28, height: 28, margin: "0 2px", display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 1px 5px #0001", cursor: "pointer"
    }}
    title="Bild hinzufügen"
    type="button"
    tabIndex={-1}
  >
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" fill="#2d7bea" />
      <rect x="12" y="20" width="24" height="14" rx="4" fill="#fff" />
      <circle cx="24" cy="27" r="5" fill="#2d7bea" />
      <rect x="20" y="15" width="8" height="5" rx="2" fill="#fff" />
    </svg>
  </button>
);

const ImgStack = ({ imgs = [], onClick, onDel }) => (
  <div style={{
    display: "inline-block", position: "relative",
    minWidth: imgs.length ? 28 + (imgs.length - 1) * 12 : 0,
    height: 28, cursor: imgs.length ? "pointer" : "default", verticalAlign: "middle"
  }}>
    {imgs.slice(0, 3).map((img, idx) =>
      <span key={idx} style={{ position: "absolute", left: idx * 12, top: 0, zIndex: 5 - idx }}>
        <img
          src={img}
          alt=""
          style={{
            width: 28, height: 28, objectFit: "cover",
            borderRadius: 7, border: "2px solid #fff",
            boxShadow: "0 2px 6px #0001", background: "#eee"
          }}
          onClick={onClick}
        />
        {onDel &&
          <button
            onClick={e => { e.stopPropagation(); onDel(idx); }}
            style={{
              position: "absolute", top: -6, right: -6, background: "#fff", border: "1px solid #e00", borderRadius: "50%",
              width: 17, height: 17, fontSize: 11, color: "#e00", cursor: "pointer", padding: 0
            }}
            title="Bild entfernen"
          >×</button>
        }
      </span>
    )}
    {imgs.length > 3 &&
      <span style={{
        position: "absolute", left: 3 * 12 + 8, top: 9, zIndex: 10, fontSize: 12,
        background: "#fff", color: "#888", borderRadius: 7, padding: "0 4px", border: "1px solid #eee"
      }}>+{imgs.length - 3}</span>
    }
  </div>
);

function FieldInput({ value, onChange, placeholder = "", width = 145, bold, type = "text", styleOverride = {}, dark, ...rest }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width,
        border: "1.5px solid #c9d0d6",
        borderRadius: 7,
        padding: "8px 11px",
        fontSize: 15,
        fontWeight: bold ? 600 : 400,
        background: dark ? "#282b36" : "inherit",
        color: dark ? "#fff" : "#23222a",
        ...styleOverride
      }}
      {...rest}
    />
  );
}

const SymTag = ({ txt, time, onDel, isCustom, onFav, dark }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", background: dark ? "#31344c" : "#e4e7ea",
    color: dark ? "#fff" : "#222", borderRadius: 7, fontSize: 13, margin: "1px 3px", padding: "3px 8px"
  }}>
    {txt}
    <span style={{ color: dark ? "#ffd02c" : "#777", fontSize: 11, marginLeft: 2 }}>
      {time === 0 ? "direkt" : "+" + time + "min"}
    </span>
    {isCustom && onFav &&
      <button onClick={onFav} style={{
        background: "none", border: 0, color: "#ffb300", fontSize: 15, cursor: "pointer", marginLeft: 4
      }} title="Zum Katalog hinzufügen">⭐</button>
    }
    {onDel &&
      <button onClick={onDel} style={{
        border: 0, background: "none", color: "#a55", marginLeft: 3, fontSize: 13, cursor: "pointer"
      }}>×</button>}
  </span>
);

function IOSSwitch({ checked, onChange }) {
  return (
    <label style={{
      display: "inline-flex", alignItems: "center", cursor: "pointer", userSelect: "none", gap: 10
    }}>
      <span style={{ fontSize: 18, color: checked ? "#ffd02c" : "#444" }}>
        {checked ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="#ffd02c">
            <circle cx="10" cy="10" r="7" />
            <g>
              <rect x="9" y="1" width="2" height="3" rx="1" fill="#ffd02c" />
              <rect x="9" y="16" width="2" height="3" rx="1" fill="#ffd02c" />
              <rect x="1" y="9" width="3" height="2" rx="1" fill="#ffd02c" />
              <rect x="16" y="9" width="3" height="2" rx="1" fill="#ffd02c" />
            </g>
          </svg>
        ) : (
          <svg width="19" height="19" viewBox="0 0 20 20" fill="#b7cdf7">
            <path d="M17 12.5A7.5 7.5 0 1 1 7.5 3c.25 0 .44.22.39.46A7.001 7.001 0 0 0 17 12.11c.04.24-.14.39-.39.39Z"/>
          </svg>
        )}
      </span>
      <span style={{
        display: "inline-block", width: 42, height: 24, background: checked ? "#62a4ff" : "#ccc",
        borderRadius: 13, position: "relative", transition: "background 0.2s"
      }}>
        <span style={{
          position: "absolute", left: checked ? 22 : 3, top: 3, width: 18, height: 18, borderRadius: "50%",
          background: checked ? "#fff" : "#e2e2e2", boxShadow: "0 2px 8px #2222", transition: "left 0.19s"
        }} />
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
          style={{ opacity: 0, position: "absolute", width: "100%", height: "100%", cursor: "pointer" }}
        />
      </span>
    </label>
  );
}

export default function FoodDiaryMinimal() {
  // Theme Switch
  const [dark, setDark] = useState(() =>
    localStorage.getItem("fd_dark") === "1" ||
    (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );
  useEffect(() => {
    document.body.style.background = dark ? "#20232a" : "#e8eaf3";
    localStorage.setItem("fd_dark", dark ? "1" : "0");
  }, [dark]);

  // Food Diary States
  const [form, setForm] = useState({
    food: "", foodImgs: [],
    symptoms: [], symptomsImgs: [],
    symptomInput: "", symptomTime: 0,
  });
  const [entries, setEntries] = useState([]);
  const [editIdx, setEditIdx] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [symCatalog, setSymCatalog] = useState([...SYMPTOM_CHOICES]);
  const [imgView, setImgView] = useState(null);

  // Stuhlgang States
  const [stoolEntries, setStoolEntries] = useState([]);
  const [stoolForm, setStoolForm] = useState({
    date: new Date().toISOString().slice(0, 16),
    imgs: [],
    note: ""
  });
  const [stoolEditIdx, setStoolEditIdx] = useState(null);
  const [stoolEditDraft, setStoolEditDraft] = useState(null);

  // File upload
  const fileRef = useRef();
  const [pendingImg, setPendingImg] = useState({ type: "", idx: null, area: "" });

  // Handler für Food Diary Bilder
  const addImgs = (e, key, targetIdx = null) => {
    const files = Array.from(e.target.files);
    Promise.all(
      files.map(f => new Promise(r => {
        let rd = new FileReader();
        rd.onload = () => r(rd.result);
        rd.readAsDataURL(f);
      }))
    ).then(imgs => {
      if (editIdx !== null && targetIdx === null) {
        setEditDraft(f => ({ ...f, [key]: [...(f[key] || []), ...imgs] }));
      } else if (typeof targetIdx === "number") {
        setEntries(es => es.map((entry, idx) =>
          idx === targetIdx ? { ...entry, [key]: [...(entry[key] || []), ...imgs] } : entry
        ));
      } else {
        setForm(f => ({ ...f, [key]: [...(f[key] || []), ...imgs] }));
      }
    });
    e.target.value = "";
    setPendingImg({ type: "", idx: null, area: "" });
  };

  // Handler für Stuhlgang Bilder
  const addStoolImgs = (e, idx = null, isEdit = false) => {
    const files = Array.from(e.target.files);
    Promise.all(
      files.map(f => new Promise(r => {
        let rd = new FileReader();
        rd.onload = () => r(rd.result);
        rd.readAsDataURL(f);
      }))
    ).then(imgs => {
      if (isEdit) {
        setStoolEditDraft(f => ({ ...f, imgs: [...(f.imgs || []), ...imgs] }));
      } else if (idx === null) {
        setStoolForm(f => ({ ...f, imgs: [...(f.imgs || []), ...imgs] }));
      } else {
        setStoolEntries(es => es.map((entry, i) =>
          i === idx ? { ...entry, imgs: [...(entry.imgs || []), ...imgs] } : entry
        ));
      }
    });
    e.target.value = "";
    setPendingImg({ type: "", idx: null, area: "" });
  };

  // Symptome zum Katalog hinzufügen
  const addSymptomToCatalog = txt => {
    if (txt && !symCatalog.includes(txt)) setSymCatalog(c => [...c, txt]);
  };

  const addEntry = () => {
    setEntries(es => [...es, {
      ...form,
      date: now()
    }]);
    setForm({
      food: "", foodImgs: [],
      symptoms: [], symptomsImgs: [],
      symptomInput: "", symptomTime: 0,
    });
  };

  // Stuhlgang Eintrag hinzufügen
  const addStoolEntry = () => {
    setStoolEntries(es => [...es, {
      date: new Date(stoolForm.date).toLocaleString(),
      imgs: stoolForm.imgs || [],
      note: stoolForm.note || ""
    }]);
    setStoolForm({ date: new Date().toISOString().slice(0, 16), imgs: [], note: "" });
  };

  // Stuhlgang Bearbeiten
  const startStoolEdit = idx => {
    setStoolEditIdx(idx);
    const entry = stoolEntries[idx];
    setStoolEditDraft({
      date: (() => {
        const d = new Date(entry.date);
        return !isNaN(d) ? d.toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16);
      })(),
      imgs: entry.imgs ? [...entry.imgs] : [],
      note: entry.note || ""
    });
  };
  const saveStoolEdit = () => {
    setStoolEntries(es => es.map((e, i) =>
      i === stoolEditIdx
        ? {
            ...e,
            date: new Date(stoolEditDraft.date).toLocaleString(),
            imgs: stoolEditDraft.imgs,
            note: stoolEditDraft.note
          }
        : e
    ));
    setStoolEditIdx(null);
    setStoolEditDraft(null);
  };
  const cancelStoolEdit = () => {
    setStoolEditIdx(null);
    setStoolEditDraft(null);
  };

  // Bearbeiten starten
  const startEdit = i => {
    setEditIdx(i);
    setEditDraft({ ...entries[i] });
  };
  const saveEdit = () => {
    setEntries(es => es.map((e, i) => i === editIdx ? { ...editDraft } : e));
    setEditIdx(null);
    setEditDraft(null);
  };
  const cancelEdit = () => {
    setEditIdx(null);
    setEditDraft(null);
  };

  // Symptome inline (Bearbeiten)
  const [editSymptomInput, setEditSymptomInput] = useState("");
  const [editSymptomTime, setEditSymptomTime] = useState(0);

  // Upload Handler
  const onCameraClick = (area, type, idx = null, isEdit = false) => {
    setPendingImg({ area, type, idx, isEdit });
    setTimeout(() => fileRef.current?.click(), 0);
  };

  // === EXPORT Excel
  const handleExport = () => {
    // Haupttabelle (Food)
    const data = [
      ["Datum", "Essen", "Symptome", "Symptome Bilder (Count)", "Essensbilder (Count)"]
    ];
    entries.forEach(e => {
      data.push([
        e.date,
        e.food,
        (e.symptoms || []).map(s =>
          (s.custom || symCatalog[s.symIdx]) + (s.time === 0 ? " (direkt)" : ` (+${s.time}min)`)
        ).join(", "),
        (e.symptomsImgs || []).length,
        (e.foodImgs || []).length
      ]);
    });
    // Stuhlgang
    const stoolData = [
      ["Datum", "Notiz", "Bilder (Count)"]
    ];
    stoolEntries.forEach(e => {
      stoolData.push([
        e.date,
        e.note || "",
        (e.imgs || []).length
      ]);
    });

    // Sheets erstellen
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws1, "Food Diary");
    const ws2 = XLSX.utils.aoa_to_sheet(stoolData);
    XLSX.utils.book_append_sheet(wb, ws2, "Stuhlgang");

    XLSX.writeFile(wb, "FoodDiary.xlsx");
  };

  const isMobile = /iPhone|Android|Mobile|iPad|iPod/i.test(navigator.userAgent);

  // === RENDER
  return (
    <div style={{
      maxWidth: 950, margin: "24px auto", background: dark ? "#21232a" : "#fff",
      borderRadius: 18, boxShadow: "0 2px 18px #0001", padding: 28, fontFamily: "Inter,sans-serif",
      color: dark ? "#f0f2f7" : "#23222a", transition: "background 0.23s, color 0.18s"
    }}>
      {/* Seitenleiste/Links-Header für Export, Switch und Titel */}
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        {/* Links */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
          <button onClick={handleExport}
            style={{
              background: "#2d7bea", color: "#fff", padding: "7px 16px",
              borderRadius: 8, fontWeight: 600, border: 0, fontSize: 15, cursor: "pointer",
              marginBottom: 8, marginTop: 2
            }}>
            Exportieren (.xlsx)
          </button>
          <div style={{ marginBottom: 8 }}>
            <IOSSwitch checked={!dark} onChange={v => setDark(!v)} />
          </div>
          <div style={{ fontWeight: 600, fontSize: 23, marginTop: 3, letterSpacing: 0.3 }}>
            Food Diary
          </div>
        </div>
        {/* Rechts: Haupt-Eingabefeld */}
        <div style={{ display: "flex", flex: 1, flexDirection: "column" }}>
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start",
            marginBottom: 30, marginTop: 10, justifyContent: "flex-end"
          }}>
            {/* Essen */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 180, flex: "1 1 160px" }}>
              <FieldInput value={form.food} onChange={v => setForm(f => ({ ...f, food: v }))}
                placeholder="Essen..." width={135} bold dark={dark} />
              <CameraButton onClick={() => onCameraClick("food", "foodImgs")} />
              <ImgStack imgs={form.foodImgs} onClick={() => form.foodImgs.length && setImgView({ imgs: form.foodImgs })} />
            </div>
            {/* Symptome */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6, minWidth: 230, flex: "2 1 240px",
              flexWrap: "wrap"
            }}>
              <input
                value={form.symptomInput || ""}
                onChange={e => setForm(f => ({ ...f, symptomInput: e.target.value }))}
                placeholder="Symptom manuell..."
                style={{
                  width: 115, border: "1px solid #ddd", borderRadius: 7, padding: "7px 9px", fontSize: 14,
                  background: dark ? "#282b36" : "#fff", color: dark ? "#fff" : "#23222a"
                }}
                onKeyDown={e => {
                  if (e.key === "Enter" && form.symptomInput?.trim()) {
                    setForm(f => ({
                      ...f,
                      symptoms: [...(f.symptoms || []), { symIdx: null, time: f.symptomTime || 0, custom: f.symptomInput.trim() }],
                      symptomInput: ""
                    }));
                  }
                }}
              />
              <select
                value={form.symptomTime || 0}
                onChange={e => setForm(f => ({ ...f, symptomTime: Number(e.target.value) }))}
                style={{
                  height: 32, borderRadius: 6, fontSize: 13, border: "1px solid #ddd",
                  background: dark ? "#282b36" : "#fff", color: dark ? "#fff" : "#23222a"
                }}
              >
                {TIMES.map(t => <option key={t} value={t}>{t === 0 ? "direkt" : "+" + t + "min"}</option>)}
              </select>
              <CameraButton onClick={() => onCameraClick("symptoms", "symptomsImgs")} />
              <ImgStack imgs={form.symptomsImgs} onClick={() => form.symptomsImgs.length && setImgView({ imgs: form.symptomsImgs })} />
              {/* Aktuelle Symptome als Tags */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2 }}>
                {(form.symptoms || []).map((s, i) =>
                  <SymTag
                    key={i}
                    txt={s.custom ? s.custom : symCatalog[s.symIdx]}
                    time={s.time}
                    dark={dark}
                    isCustom={!!s.custom && !symCatalog.includes(s.custom)}
                    onFav={s.custom ? () => addSymptomToCatalog(s.custom) : undefined}
                    onDel={() => setForm(f => ({ ...f, symptoms: f.symptoms.filter((_, k) => k !== i) }))}
                  />
                )}
              </div>
            </div>
            {/* Eintrag speichern ganz rechts */}
            <div style={{ minWidth: 110, flex: "0 0 auto", marginLeft: "auto" }}>
              <button onClick={addEntry} style={{
                padding: "15px 20px", borderRadius: 8, background: "#2d7bea", color: "#fff",
                fontWeight: 600, border: 0, fontSize: 16, cursor: "pointer"
              }}>Eintrag speichern</button>
            </div>
          </div>
        </div>
      </div>
      {/* Bildinput */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        capture={isMobile ? "environment" : undefined}
        style={{ display: "none" }}
        onChange={e => {
          const { area, type, idx, isEdit } = pendingImg;
          if (area === "food" || area === "symptoms") {
            if (editIdx !== null && idx === null) addImgs(e, type);
            else if (typeof idx === "number") addImgs(e, type, idx);
            else addImgs(e, type, null);
          }
          if (area === "stool") addStoolImgs(e, idx, isEdit);
        }}
      />

      {/* Food Diary Tabelle */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 6, fontSize: 15, background: "inherit" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #eaeaea", fontSize: 15 }}>
            <th style={{ textAlign: "left", padding: "7px 8px" }}>Datum</th>
            <th style={{ textAlign: "left", padding: "7px 8px" }}>Essen / Bild</th>
            <th style={{ textAlign: "left", padding: "7px 8px" }}>Symptome / Bild</th>
            <th style={{ textAlign: "center", padding: "7px 8px" }}>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) =>
            editIdx === i ? (
              <tr key={i} style={{ background: "#19192a22" }}>
                <td style={{ padding: "6px 8px" }}>{e.date}</td>
                {/* Essen */}
                <td style={{ padding: "6px 8px", verticalAlign: "top" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <FieldInput value={editDraft.food} onChange={v => setEditDraft(f => ({ ...f, food: v }))} width={110} dark={dark} />
                    <CameraButton onClick={() => onCameraClick("food", "foodImgs", null, false)} />
                    <ImgStack
                      imgs={editDraft.foodImgs}
                      onClick={() => editDraft.foodImgs.length && setImgView({ imgs: editDraft.foodImgs })}
                      onDel={idx => setEditDraft(f => ({ ...f, foodImgs: f.foodImgs.filter((_, k) => k !== idx) }))}
                    />
                  </div>
                </td>
                {/* Symptome */}
                <td style={{ padding: "6px 8px", verticalAlign: "top" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <CameraButton onClick={() => onCameraClick("symptoms", "symptomsImgs", null, false)} />
                    <ImgStack
                      imgs={editDraft.symptomsImgs}
                      onClick={() => editDraft.symptomsImgs.length && setImgView({ imgs: editDraft.symptomsImgs })}
                      onDel={idx => setEditDraft(f => ({ ...f, symptomsImgs: f.symptomsImgs.filter((_, k) => k !== idx) }))}
                    />
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2, marginTop: 5 }}>
                    {(editDraft.symptoms || []).map((s, j) =>
                      <SymTag
                        key={j}
                        txt={s.custom ? s.custom : symCatalog[s.symIdx]}
                        time={s.time}
                        dark={dark}
                        isCustom={!!s.custom && !symCatalog.includes(s.custom)}
                        onFav={s.custom ? () => addSymptomToCatalog(s.custom) : undefined}
                        onDel={() => setEditDraft(f => ({ ...f, symptoms: f.symptoms.filter((_, k) => k !== j) }))}
                      />
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 5, marginTop: 7 }}>
                    <input
                      value={editSymptomInput}
                      onChange={e => setEditSymptomInput(e.target.value)}
                      placeholder="Symptom..."
                      style={{ width: 105, border: "1px solid #ddd", borderRadius: 7, padding: "5px 8px", fontSize: 14,
                        background: dark ? "#282b36" : "#fff", color: dark ? "#fff" : "#23222a"
                      }}
                      onKeyDown={e => {
                        if (e.key === "Enter" && editSymptomInput.trim()) {
                          setEditDraft(f => ({
                            ...f,
                            symptoms: [...(f.symptoms || []), { symIdx: null, time: editSymptomTime || 0, custom: editSymptomInput.trim() }]
                          }));
                          setEditSymptomInput("");
                        }
                      }}
                    />
                    <select
                      value={editSymptomTime}
                      onChange={e => setEditSymptomTime(Number(e.target.value))}
                      style={{
                        height: 30, borderRadius: 6, fontSize: 13, border: "1px solid #ddd",
                        background: dark ? "#282b36" : "#fff", color: dark ? "#fff" : "#23222a"
                      }}
                    >
                      {TIMES.map(t => <option key={t} value={t}>{t === 0 ? "direkt" : "+" + t + "min"}</option>)}
                    </select>
                    <button
                      onClick={() => {
                        if (editSymptomInput.trim()) {
                          setEditDraft(f => ({
                            ...f,
                            symptoms: [...(f.symptoms || []), { symIdx: null, time: editSymptomTime || 0, custom: editSymptomInput.trim() }]
                          }));
                          setEditSymptomInput("");
                        }
                      }}
                      style={{ background: "#2d7bea", color: "#fff", border: 0, borderRadius: 5, padding: "5px 12px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                    >+</button>
                  </div>
                </td>
                <td style={{ padding: "6px 8px", textAlign: "center" }}>
                  <button
                    onClick={saveEdit}
                    style={{
                      background: "#2d7bea", color: "#fff", border: 0, borderRadius: 7,
                      padding: "7px 14px", fontWeight: 600, fontSize: 15, margin: 3, cursor: "pointer"
                    }}>Speichern</button>
                  <button
                    onClick={cancelEdit}
                    style={{
                      background: "#fff0f0", border: "1px solid #e88", borderRadius: 7,
                      padding: "7px 12px", color: "#c00", fontSize: 18, fontWeight: 600, margin: 3, cursor: "pointer"
                    }}
                  >✖</button>
                </td>
              </tr>
            ) : (
              <tr key={i}>
                <td style={{ padding: "6px 8px" }}>{e.date}</td>
                <td style={{ padding: "6px 8px", verticalAlign: "top" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <ImgStack imgs={e.foodImgs} onClick={() => e.foodImgs?.length && setImgView({ imgs: e.foodImgs })} />
                    <div style={{ fontWeight: 500 }}>{e.food}</div>
                  </div>
                </td>
                <td style={{ padding: "6px 8px", verticalAlign: "top" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <ImgStack imgs={e.symptomsImgs} onClick={() => e.symptomsImgs?.length && setImgView({ imgs: e.symptomsImgs })} />
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2 }}>
                      {e.symptoms?.map((s, si) =>
                        <SymTag
                          key={si}
                          txt={s.custom ? s.custom : symCatalog[s.symIdx]}
                          time={s.time}
                          dark={dark}
                          isCustom={!!s.custom && !symCatalog.includes(s.custom)}
                          onFav={s.custom ? () => addSymptomToCatalog(s.custom) : undefined}
                        />
                      )}
                    </div>
                  </div>
                </td>
                <td style={{ padding: "6px 8px", textAlign: "center" }}>
                  <button
                    onClick={() => startEdit(i)}
                    style={{
                      background: dark ? "#242736" : "#f5f5f7",
                      color: dark ? "#fff" : "#23222a",
                      border: "1px solid #bbb", borderRadius: 6,
                      padding: "7px 13px", margin: 2, fontSize: 13, cursor: "pointer"
                    }}>Bearbeiten</button>
                  <button
                    onClick={() => setEntries(es => es.filter((_, j) => j !== i))}
                    style={{
                      background: "#fff0f0", border: "1px solid #e88", borderRadius: 6,
                      padding: "7px 13px", color: "#c00", fontSize: 20, fontWeight: 600, cursor: "pointer"
                    }}
                    title="Löschen"
                  >✖</button>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>

      {/* STUHLGANG EINTRÄGE */}
      <div style={{ marginTop: 40 }}>
        <div style={{ fontWeight: 600, fontSize: 18, margin: "14px 0 8px 0" }}>Stuhlgang Einträge</div>
        {/* Eingabe */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14, marginBottom: 14
        }}>
          <input
            type="datetime-local"
            value={stoolForm.date}
            onChange={e => setStoolForm(f => ({ ...f, date: e.target.value }))}
            style={{
              border: "1.5px solid #c9d0d6", borderRadius: 7, padding: "8px 10px",
              fontSize: 15, width: 175, background: dark ? "#23263a" : "#fff", color: dark ? "#ffd" : "#111"
            }}
          />
          <input
            value={stoolForm.note}
            onChange={e => setStoolForm(f => ({ ...f, note: e.target.value }))}
            placeholder="Notiz (optional)..."
            style={{
              border: "1.5px solid #c9d0d6", borderRadius: 7, padding: "8px 10px",
              fontSize: 15, width: 210, background: dark ? "#23263a" : "#fff", color: dark ? "#ffd" : "#111"
            }}
          />
          <CameraButton onClick={() => onCameraClick("stool", null)} />
          <ImgStack imgs={stoolForm.imgs} onClick={() => stoolForm.imgs.length && setImgView({ imgs: stoolForm.imgs })} />
          <button onClick={addStoolEntry} style={{
            padding: "15px 20px", borderRadius: 8, background: "#2d7bea", color: "#fff",
            fontWeight: 600, border: 0, fontSize: 16, marginLeft: 20, cursor: "pointer"
          }}>Eintrag speichern</button>
        </div>
        {/* Tabelle */}
        <table style={{ width: "100%", borderCollapse: "collapse", background: "inherit" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #eaeaea", fontSize: 15 }}>
              <th style={{ textAlign: "left", padding: "7px 8px" }}>Datum</th>
              <th style={{ textAlign: "left", padding: "7px 8px" }}>Notiz</th>
              <th style={{ textAlign: "center", padding: "7px 8px" }}>Bild(er)</th>
              <th style={{ textAlign: "center", padding: "7px 8px" }}>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {stoolEntries.map((e, idx) =>
              stoolEditIdx === idx ? (
                <tr key={idx} style={{ background: "#1b213a22" }}>
                  <td style={{ padding: "6px 8px" }}>
                    <input
                      type="datetime-local"
                      value={stoolEditDraft.date}
                      onChange={ev => setStoolEditDraft(f => ({ ...f, date: ev.target.value }))}
                      style={{
                        border: "1.2px solid #bbb", borderRadius: 6, padding: "7px 8px",
                        fontSize: 14, width: 170, background: dark ? "#23263a" : "#fff", color: dark ? "#ffd" : "#111"
                      }}
                    />
                  </td>
                  <td style={{ padding: "6px 8px" }}>
                    <input
                      value={stoolEditDraft.note}
                      onChange={ev => setStoolEditDraft(f => ({ ...f, note: ev.target.value }))}
                      placeholder="Notiz..."
                      style={{
                        border: "1.2px solid #bbb", borderRadius: 6, padding: "7px 8px",
                        fontSize: 14, width: 200, background: dark ? "#23263a" : "#fff", color: dark ? "#ffd" : "#111"
                      }}
                    />
                  </td>
                  <td style={{ textAlign: "center", padding: "6px 8px" }}>
                    <CameraButton onClick={() => onCameraClick("stool", null, idx, true)} />
                    <ImgStack
                      imgs={stoolEditDraft.imgs}
                      onClick={() => stoolEditDraft.imgs?.length && setImgView({ imgs: stoolEditDraft.imgs })}
                      onDel={i2 => setStoolEditDraft(f => ({ ...f, imgs: f.imgs.filter((_, j) => j !== i2) }))}
                    />
                  </td>
                  <td style={{ textAlign: "center", padding: "6px 8px" }}>
                    <button
                      onClick={saveStoolEdit}
                      style={{
                        background: "#2d7bea", color: "#fff", border: 0, borderRadius: 7,
                        padding: "7px 14px", fontWeight: 600, fontSize: 15, margin: 3, cursor: "pointer"
                      }}>Speichern</button>
                    <button
                      onClick={cancelStoolEdit}
                      style={{
                        background: "#fff0f0", border: "1px solid #e88", borderRadius: 7,
                        padding: "7px 12px", color: "#c00", fontSize: 18, fontWeight: 600, margin: 3, cursor: "pointer"
                      }}
                    >✖</button>
                  </td>
                </tr>
              ) : (
                <tr key={idx}>
                  <td style={{ padding: "6px 8px" }}>{e.date}</td>
                  <td style={{ padding: "6px 8px" }}>{e.note}</td>
                  <td style={{ textAlign: "center", padding: "6px 8px" }}>
                    <ImgStack
                      imgs={e.imgs}
                      onClick={() => e.imgs?.length && setImgView({ imgs: e.imgs })}
                    />
                  </td>
                  <td style={{ textAlign: "center", padding: "6px 8px" }}>
                    <button
                      onClick={() => startStoolEdit(idx)}
                      style={{
                        background: dark ? "#242736" : "#f5f5f7",
                        color: dark ? "#fff" : "#23222a",
                        border: "1px solid #bbb", borderRadius: 6,
                        padding: "7px 13px", margin: 2, fontSize: 13, cursor: "pointer"
                      }}>Bearbeiten</button>
                    <button
                      onClick={() => setStoolEntries(e2 => e2.filter((_, j) => j !== idx))}
                      style={{
                        background: "#fff0f0", border: "1px solid #e88", borderRadius: 6,
                        padding: "7px 13px", color: "#c00", fontSize: 20, fontWeight: 600, cursor: "pointer"
                      }}
                      title="Löschen"
                    >✖</button>
                  </td>
                </tr>
              )
            )}
            {stoolEntries.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", color: "#aaa", padding: "28px 0", fontSize: 17 }}>
                  Noch keine Einträge
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Popup für Bild-View */}
      {imgView &&
        <div
          style={{
            position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh",
            background: "#000b", zIndex: 99, display: "flex", alignItems: "center", justifyContent: "center"
          }}
          onClick={() => setImgView(null)}
        >
          <div style={{ display: "flex", gap: 22, padding: 20 }}>
            {(imgView.imgs || []).map((img, idx) =>
              <img
                key={idx}
                src={img}
                alt=""
                style={{
                  maxHeight: "75vh", maxWidth: "30vw", objectFit: "contain",
                  borderRadius: 12, background: "#fff"
                }}
                onClick={e => e.stopPropagation()}
              />
            )}
          </div>
        </div>
      }
    </div>
  );
}
