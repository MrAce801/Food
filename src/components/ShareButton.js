import React from "react";
import styles from "../styles";

const ShareButton = ({ onClick }) => (
  <button onClick={onClick} className="haptic" title="Share Link" style={styles.buttonSecondary("#00796b")}>Share</button>
);

export default ShareButton;
