import React from "react";
import styles from "../styles";

const InsightsButton = ({ onClick }) => (
  <button onClick={onClick} className="haptic" title="Insights" style={styles.buttonSecondary("#1976d2")}> 
    Insights
  </button>
);

export default InsightsButton;
