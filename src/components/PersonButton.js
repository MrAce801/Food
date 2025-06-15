import React from "react";
import styles from "../styles";
import useTranslation from '../useTranslation';

const PersonButton = ({ onClick, dark }) => {
  const t = useTranslation();
  return (
    <button
      onClick={onClick}
      className="haptic"
      title={t('Personendaten')}
      style={styles.glassyButtonAccent(dark)}
    >
      🧍
    </button>
  );
};

export default PersonButton;
