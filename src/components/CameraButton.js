import React from "react";
import styles from "../styles";

const CameraButton = ({ onClick, dark }) => (
  <button
    onClick={onClick}
    className="haptic"
    title="Foto"
    style={{ ...styles.glassyIconButton(dark), width: 36, height: 36, fontSize: 20 }}
  >
    📷
  </button>
);

export default CameraButton;
