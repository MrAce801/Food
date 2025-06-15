import React, { createContext, useContext } from 'react';

export const LanguageContext = createContext('de');
export const useLanguage = () => useContext(LanguageContext);
