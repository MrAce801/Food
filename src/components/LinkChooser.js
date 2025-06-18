import React from 'react';
import useTranslation from '../useTranslation';

const LinkChooser = ({ linkChoice, chooseLink, dark, setLinkChoice }) => {
  const t = useTranslation();
  if (!linkChoice) return null;
  return (
    <div
      className="link-chooser"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={() => setLinkChoice(null)}
    >
      <div
        style={{ background: dark ? '#333' : '#fff', padding: 24, borderRadius: 8, minWidth: 200 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ marginBottom: 8 }}>{t('Link-ID wählen')}</div>
        {linkChoice.options.map(id => (
          <button key={id} style={{ margin: 6, padding: '6px 12px', fontSize: 16 }} onClick={() => chooseLink(id)}>
            {id}
          </button>
        ))}
        <button style={{ margin: 6, padding: '6px 12px', fontSize: 16 }} onClick={() => chooseLink('new')}>
          {t('Neu')}
        </button>
        <button style={{ margin: 6, padding: '6px 12px', fontSize: 16 }} onClick={() => chooseLink(null)}>
          {t('Abbrechen')}
        </button>
      </div>
    </div>
  );
};

export default LinkChooser;
