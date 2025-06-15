import React from "react";
import styles from "../styles";
import useTranslation from '../useTranslation';

const BackButton = ({ onClick }) => {
  const t = useTranslation();
  return (
    <button onClick={onClick} className="haptic" title={t('Zurück')} style={styles.backButton}>← {t('Zurück')}</button>
  );
};

export default BackButton;
