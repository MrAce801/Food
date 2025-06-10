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
  BLUE: '#64b5f6',  // light blue for supplements
};
const TAG_COLOR_NAMES = {
  [TAG_COLORS.GREEN]: "Essen",
  [TAG_COLORS.RED]: "Symptome",
  [TAG_COLORS.YELLOW]: "Vorgeschichte",
  [TAG_COLORS.BROWN]: "Stuhlgang",
  [TAG_COLORS.BLUE]: "Supplemente",
};

export { SYMPTOM_CHOICES, TIME_CHOICES, TAG_COLORS, TAG_COLOR_NAMES };
