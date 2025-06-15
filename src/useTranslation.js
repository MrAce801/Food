import { useContext } from 'react';
import { LanguageContext } from './LanguageContext';
import translations from './translations';

export default function useTranslation() {
  const lang = useContext(LanguageContext);
  return (text) => translations[lang] && translations[lang][text] ? translations[lang][text] : text;
}
