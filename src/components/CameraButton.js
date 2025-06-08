import React from "react";

const CameraButton = ({ onClick }) => (
  <button onClick={onClick} className="haptic" title="Foto" style={{
    width: 36, height: 36, borderRadius: 6, border: 0,
    background: "#247be5", display: "flex", alignItems: "center",
    justifyContent: "center", cursor: "pointer"
  }}>📷</button>
);

export default CameraButton;
