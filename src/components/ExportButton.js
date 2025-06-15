import React, { useState, useRef, useEffect } from 'react';
import styles from '../styles';
import useTranslation from '../useTranslation';

const ExportButton = ({ onExportPdf, onPrint, dark }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const t = useTranslation();

  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="haptic"
        title={t('Export')}
        style={styles.glassyButtonAccent(dark)}
      >
        {t('Export')}
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            background: dark ? '#333' : '#fff',
            border: '1px solid #ccc',
            borderRadius: 4,
            padding: 4,
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 80,
          }}
        >
          <button
            className="haptic"
            onClick={() => { setOpen(false); onExportPdf(); }}
            style={{ ...styles.buttonSecondary('transparent'), textAlign: 'left' }}
          >
            {t('PDF')}
          </button>
          <button
            className="haptic"
            onClick={() => { setOpen(false); onPrint(); }}
            style={{ ...styles.buttonSecondary('transparent'), textAlign: 'left' }}
          >
            {t('Print')}
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportButton;
