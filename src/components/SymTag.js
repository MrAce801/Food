import React from "react";
import { TIME_CHOICES } from "../constants";
import { getStrengthColor } from "../utils";
import useTranslation from '../useTranslation';

const SymTag = ({ txt, time, strength, dark, onDel, onClick }) => {
  const t = useTranslation();
  const tagBackgroundColor = "#fafafa";
  const tagTextColor = "#1a1f3d";
  const displayStrength = Math.min(parseInt(strength) || 1, 3);
  const indentLeft = strength ? 21 : 0; // align "time" text with symptom text

  return (
    <div onClick={onClick} style={{
      display: "inline-flex",
      alignItems: "flex-start",
      background: tagBackgroundColor,
      color: tagTextColor,
      borderRadius: 6,
      padding: "6px 10px",
      margin: "3px 4px 3px 0",
      fontSize: 14,
      cursor: onClick ? "pointer" : "default",
      overflowWrap: "break-word",
      whiteSpace: "normal",
      wordBreak: "break-word",
      maxWidth: "100%",
      flexWrap: "wrap"
    }}>
      {strength && (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: '#333333',
            fontSize: '10px',
            fontWeight: 'bold',
            marginRight: '5px',
            lineHeight: 1,
            flexShrink: 0,
            border: `2px solid ${getStrengthColor(displayStrength)}`,
            boxSizing: 'border-box',
        }}>
            {displayStrength}
        </span>
      )}
      <span style={{
        overflowWrap: 'break-word',
        wordBreak: 'break-word',
        whiteSpace: 'normal',
        maxWidth: '100%'
      }}>
        {txt}
      </span>
      <span style={{
        flexBasis: '100%',
        paddingLeft: `${indentLeft}px`,
        marginTop: 2,
        fontSize: 12,
        opacity: 0.8
      }}>
        {t(TIME_CHOICES.find(opt => opt.value === time)?.label || `${time} min`)}
      </span>
      {onDel && (
        <span onClick={e => { e.stopPropagation(); onDel(); }} style={{
          marginLeft: 8,
          cursor: "pointer",
          fontSize: 16,
          color: "#c00",
          fontWeight: 700
        }}>×</span>
      )}
    </div>
  );
};

export default SymTag;
