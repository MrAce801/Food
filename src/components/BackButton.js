import React from "react";
import styles from "../styles";

const BackButton = ({ onClick }) => (
  <button onClick={onClick} className="haptic" title="Zurück" style={styles.backButton}>← Zurück</button>
);

export default BackButton;
