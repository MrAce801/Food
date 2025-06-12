import React from "react";
import styles from "../styles";

const PdfButton = ({ onClick, dark }) => (
  <button onClick={onClick} className="haptic" title="Export PDF" style={styles.glassyButton(dark)}>
    PDF
  </button>
);

export default PdfButton;
