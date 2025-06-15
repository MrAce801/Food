import React from 'react';
import styles from '../styles';
import { useLanguage } from '../LanguageContext';

const FLAG = { en: '🇺🇸', de: '🇩🇪' };

const LanguageButton = ({ toggle, dark }) => {
  const lang = useLanguage();
  return (
    <button
      onClick={toggle}
      className="haptic"
      title="Language"
      style={styles.glassyButtonAccent(dark)}
    >
      {FLAG[lang] || lang}
    </button>
  );
};

export default LanguageButton;
