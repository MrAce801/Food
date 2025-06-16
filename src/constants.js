// --- GLOBALE KONSTANTEN & FARBMAPPINGS ---

const SYMPTOM_CHOICES = [
  "Bauchschmerzen","Durchfall","Blähungen","Hautausschlag",
  "Juckreiz","Schwellung am Gaumen","Schleim im Hals",
  "Niesen","Kopfschmerzen","Rötung Haut"
];
const TIME_CHOICES = [
  { label: "sofort", value: 0 }, { label: "nach 5 min", value: 5 },
  { label: "nach 10 min", value: 10 }, { label: "nach 15 min", value: 15 },
  { label: "nach 30 min", value: 30 }, { label: "nach 45 min", value: 45 },
  { label: "nach 60 min", value: 60 }, { label: "nach 1,5 h", value: 90 },
  { label: "nach 3 h", value: 180 }
];

const TAG_COLORS = {
  GREEN: 'green',
  RED: 'red',
  YELLOW: 'yellow',
  BROWN: '#c19a6b', // light brown for bowel movement
  BLUE: '#64b5f6',  // for medication
  PURPLE: '#ba68c8', // for exercise
  GRAY: 'gray', // for questions
};
const TAG_COLOR_NAMES = {
  [TAG_COLORS.GREEN]: 'Essen',
  [TAG_COLORS.PURPLE]: 'Exercise',
  [TAG_COLORS.RED]: 'Symptome',
  [TAG_COLORS.BLUE]: 'Medikamente',
  [TAG_COLORS.BROWN]: 'Stuhlgang',
  [TAG_COLORS.YELLOW]: 'Info',
  [TAG_COLORS.GRAY]: 'Fragen',
};

const TAG_COLOR_ICONS = {
  [TAG_COLORS.GREEN]: '🥗',
  [TAG_COLORS.PURPLE]: '💪🏻',
  [TAG_COLORS.RED]: '❗',
  [TAG_COLORS.BLUE]: '💊',
  [TAG_COLORS.BROWN]: '🚽',
  [TAG_COLORS.YELLOW]: '📋',
  [TAG_COLORS.GRAY]: '❔',
};

const PORTION_COLORS = {
  S: '#8bc34a',
  M: '#ffb74d',
  L: '#e57373',
};

export { SYMPTOM_CHOICES, TIME_CHOICES, TAG_COLORS, TAG_COLOR_NAMES, TAG_COLOR_ICONS, PORTION_COLORS };
