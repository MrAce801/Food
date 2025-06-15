import React from 'react';
import styles from '../styles';
import { useLanguage } from '../LanguageContext';
import useTranslation from '../useTranslation';

const FLAG = { en: '🇬🇧', de: '🇩🇪' };

const LanguageButton = ({ toggle, dark }) => {
  const lang = useLanguage();
  const t = useTranslation();
  return (
    <button
      onClick={toggle}
      className="haptic"
      title={t('Language')}
      style={styles.glassyButtonAccent(dark)}
    >
      {FLAG[lang] || lang}
    </button>
  );
};

export default LanguageButton;
