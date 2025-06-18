import React, { createContext, useContext } from 'react';
import useEntries from '../hooks/useEntries';

const EntriesContext = createContext(null);

export function EntriesProvider({ children, addToast }) {
  const value = useEntries(addToast);
  return (
    <EntriesContext.Provider value={value}>
      {children}
    </EntriesContext.Provider>
  );
}

export function useEntriesContext() {
  const ctx = useContext(EntriesContext);
  if (!ctx) {
    throw new Error('useEntriesContext must be used within EntriesProvider');
  }
  return ctx;
}

export default EntriesContext;
