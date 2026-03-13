// Daily inspiration quotes - one for each day
export const DAILY_QUOTES = [
  "Small steps lead to big changes.",
  "Your story matters.",
  "Every day is a fresh start.",
  "Write the truth you know.",
  "Growth happens in stillness.",
  "Your voice deserves to be heard.",
  "Reflection is the path to clarity.",
  "Progress over perfection.",
  "Document your journey, celebrate your growth.",
  "In writing, you find yourself.",
  "Let your pages hold your secrets.",
  "Today is full of possibility.",
  "Your feelings are valid and important.",
  "Write boldly, live fully.",
  "Gratitude transforms everything.",
  "You are stronger than you think.",
  "Every entry is a step forward.",
  "Your perspective is unique and valuable.",
  "Healing happens when we honor our truth.",
  "Dreams written down become plans.",
  "Be honest, be brave, be you.",
  "Your past shaped you, your future awaits.",
  "In moments of doubt, read your progress.",
  "Emotions are meant to be felt, understood, and written.",
  "You are becoming who you're meant to be.",
  "Give yourself the same compassion you give others.",
  "Your story is still being written.",
  "Each entry is a conversation with yourself.",
  "Vulnerability is your greatest strength.",
  "Keep going, you're doing better than you think.",
];

export const MOODS = [
  { id: 'happy', emoji: '😊', label: 'Happy' },
  { id: 'neutral', emoji: '😐', label: 'Neutral' },
  { id: 'sad', emoji: '😔', label: 'Sad' },
  { id: 'angry', emoji: '😠', label: 'Angry' },
  { id: 'anxious', emoji: '😰', label: 'Anxious' },
];

export const MOOD_MAP = {
  happy: { icon: 'sentiment-very-satisfied', color: '#22c55e', bg: '#dcfce7' },
  sad: { icon: 'sentiment-very-dissatisfied', color: '#3b82f6', bg: '#dbeafe' },
  neutral: { icon: 'sentiment-neutral', color: '#f59e0b', bg: '#fef3c7' },
  angry: { icon: 'sentiment-very-dissatisfied', color: '#ef4444', bg: '#fee2e2' },
  anxious: { icon: 'sentiment-dissatisfied', color: '#d946ef', bg: '#f3e8ff' },
  excited: { icon: 'sentiment-very-satisfied', color: '#ec4899', bg: '#fce7f3' },
  tired: { icon: 'bedtime', color: '#6366f1', bg: '#e0e7ff' },
};

export const PAGINATION = {
  ENTRIES_PER_PAGE: 5,
};
