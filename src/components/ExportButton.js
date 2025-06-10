import React from "react";
import styles from "../styles";

const ExportButton = ({ onClick }) => (
  <button onClick={onClick} className="haptic" title="Export" style={styles.buttonSecondary("#5e35b1")}>Export</button>
);

export default ExportButton;
