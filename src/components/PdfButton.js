import React from "react";
import styles from "../styles";

const PdfButton = ({ onClick }) => (
  <button onClick={onClick} className="haptic" title="Export PDF" style={styles.buttonSecondary("#d32f2f")}> 
    PDF
  </button>
);

export default PdfButton;
