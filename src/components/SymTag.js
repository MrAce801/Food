import React from "react";
import { TIME_CHOICES } from "../constants";
import { getStrengthColor } from "../utils";
import useTranslation from '../useTranslation';

const SymTag = ({ txt, time, strength, dark, onDel, onClick }) => {
  const t = useTranslation();
  const tagBackgroundColor = "#fafafa";
  const tagTextColor = "#1a1f3d";
  const displayStrength = Math.min(parseInt(strength) || 1, 3);

  return (
    <div onClick={onClick} style={{
      display: "inline-flex",
      alignItems: "center",
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
      <span style={{
        flex: '0 1 auto',
        minWidth: 0,
        overflowWrap: 'break-word',
        wordBreak: 'break-word',
        whiteSpace: 'normal',
        maxWidth: '100%'
      }}>
        {txt}
      </span>
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        marginLeft: 8,
        flexShrink: 0
      }}>
        <span style={{ fontSize: 12, opacity: 0.8 }}>
          {t(TIME_CHOICES.find(opt => opt.value === time)?.label || `${time} min`)}
        </span>
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
              marginLeft: '5px',
              lineHeight: 1,
              flexShrink: 0,
              border: `2px solid ${getStrengthColor(displayStrength)}`,
              boxSizing: 'border-box',
          }}>
              {displayStrength}
          </span>
        )}
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
