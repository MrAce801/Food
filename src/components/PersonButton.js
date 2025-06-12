import React from "react";
import styles from "../styles";

const PersonButton = ({ onClick, dark }) => (
  <button
    onClick={onClick}
    className="haptic"
    title="Personendaten"
    style={styles.glassyButton(dark)}
  >
    🧍
  </button>
);

export default PersonButton;
