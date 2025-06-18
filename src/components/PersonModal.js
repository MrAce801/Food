import React from 'react';
import useTranslation from '../useTranslation';

const PersonModal = ({
  showPerson,
  closePerson,
  personInfo,
  handlePersonChange,
  toggleBlurCategory,
  blurCategories,
  TAG_COLORS,
  TAG_COLOR_NAMES,
  TAG_COLOR_ICONS,
  styles,
  dark,
}) => {
  const t = useTranslation();
  if (!showPerson) return null;
  return (
    <div
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
      onClick={closePerson}
    >
      <div
        style={{ background: dark ? '#333' : '#fff', padding: 24, borderRadius: 8, minWidth: 250 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ marginBottom: 8 }}>{t('Persönliche Daten')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            placeholder={t('Alter')}
            value={personInfo.age}
            onChange={e => handlePersonChange('age', e.target.value)}
            style={styles.input}
          />
          <input
            placeholder={t('Geschlecht')}
            value={personInfo.gender}
            onChange={e => handlePersonChange('gender', e.target.value)}
            style={styles.input}
          />
          <input
            placeholder={t('Größe (cm)')}
            value={personInfo.height}
            onChange={e => handlePersonChange('height', e.target.value)}
            style={styles.input}
          />
          <input
            placeholder={t('Gewicht (kg)')}
            value={personInfo.weight}
            onChange={e => handlePersonChange('weight', e.target.value)}
            style={styles.input}
          />
          <div style={{ marginTop: 8, fontWeight: 600 }}>{t('Blur')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[TAG_COLORS.GREEN, TAG_COLORS.PURPLE, TAG_COLORS.RED, TAG_COLORS.BLUE, TAG_COLORS.BROWN, TAG_COLORS.YELLOW, TAG_COLORS.GRAY].map(colorValue => (
              <button
                key={colorValue}
                onClick={() => toggleBlurCategory(colorValue)}
                style={styles.categoryButton(colorValue, blurCategories.includes(colorValue), dark)}
                title={t(TAG_COLOR_NAMES[colorValue] || colorValue)}
              >
                {TAG_COLOR_ICONS[colorValue]}
              </button>
            ))}
          </div>
          <button
            onClick={closePerson}
            style={{ ...styles.buttonSecondary('#1976d2'), marginTop: 8 }}
          >
            {t('Schließen')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonModal;
