import React from 'react';
import useTranslation from '../useTranslation';

const sizeMap = {
  S: 'Small',
  M: 'Medium',
  L: 'Large'
};

const Legend = ({ TAG_COLOR_ICONS, TAG_COLOR_NAMES, PORTION_COLORS, dark }) => {
  const t = useTranslation();
  const textColor = dark ? '#f0f0f8' : '#333';
  return (
    <div style={{ marginTop: 16, fontSize: 14, color: textColor }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{t('Legende')}</div>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{t('Kategorien')}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {Object.entries(TAG_COLOR_ICONS).map(([color, icon]) => (
            <div key={color} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>{icon}</span>
              <span>{t(TAG_COLOR_NAMES[color] || color)}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{t('Portionsgrößen')}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {Object.entries(PORTION_COLORS).map(([size, color]) => (
            <div key={size} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{
                display: 'inline-block',
                width: 18,
                height: 18,
                lineHeight: '18px',
                textAlign: 'center',
                borderRadius: 4,
                backgroundColor: color,
                color: '#fff',
                fontSize: 12
              }}>{size}</span>
              <span>{t(sizeMap[size])}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Legend;
