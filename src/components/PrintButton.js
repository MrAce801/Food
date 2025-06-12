import React from "react";
import styles from "../styles";

const PrintButton = ({ onClick, dark }) => (
  <button onClick={onClick} className="haptic" title="Print" style={styles.glassyButton(dark)}>Print</button>
);

export default PrintButton;
