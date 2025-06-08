import React from "react";
import styles from "../styles";

const PrintButton = ({ onClick }) => (
  <button onClick={onClick} className="haptic" title="Print" style={styles.buttonSecondary("#5e35b1")}>Print</button>
);

export default PrintButton;
