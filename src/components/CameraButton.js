import React from "react";
import styles from "../styles";
import useTranslation from '../useTranslation';

const CameraButton = ({ onClick, dark }) => {
  const t = useTranslation();
  return (
    <button
      onClick={onClick}
      className="haptic"
      title={t('Foto')}
      style={{ ...styles.glassyIconButton(dark), width: 40, height: 40, fontSize: 20 }}
    >
      📷
    </button>
  );
};

export default CameraButton;
