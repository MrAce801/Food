import { useState, useEffect } from 'react';
import { TAG_COLORS } from '../constants';

export default function useBlurCategories() {
  const [blurCategories, setBlurCategories] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('fd-blur-cats'));
      if (Array.isArray(saved)) return saved;
    } catch {}
    return [TAG_COLORS.BROWN];
  });

  useEffect(() => {
    try {
      localStorage.setItem('fd-blur-cats', JSON.stringify(blurCategories));
    } catch {}
  }, [blurCategories]);

  const toggleBlurCategory = (cat) => {
    setBlurCategories(prev => {
      const updated = prev.includes(cat)
        ? prev.filter(c => c !== cat)
        : [...prev, cat];
      localStorage.setItem('fd-blur-cats', JSON.stringify(updated));
      return updated;
    });
  };

  return { blurCategories, toggleBlurCategory };
}
