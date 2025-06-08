import React from "react";

const ImgStack = ({ imgs, onDelete }) => (
  <div className="img-stack-container" style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
    {imgs.map((src, i) => (
      <div key={i} className="img-stack-item" style={{ position: "relative", marginLeft: i ? -12 : 0, zIndex: imgs.length - i }}>
        <img
          src={src}
          alt={`entry_image_${i}`}
          className="fade-img"
          style={{
            width: 40, height: 40, objectFit: "cover",
            borderRadius: 6, border: "2px solid #fff",
            boxShadow: "0 1px 4px #0003",
            opacity: 0,
            transition: 'opacity 0.3s ease'
          }}
          onLoad={e => { e.currentTarget.style.opacity = 1; }}
          onError={e => { e.currentTarget.style.display = "none"; }}
        />
        {onDelete && (
          <span onClick={() => onDelete(i)} style={{
            position: "absolute", top: -6, right: -6,
            background: "#c00", color: "#fff",
            borderRadius: "50%", width: 18, height: 18,
            display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 12,
            cursor: "pointer"
          }}>×</span>
        )}
      </div>
    ))}
  </div>
);

export default ImgStack;
