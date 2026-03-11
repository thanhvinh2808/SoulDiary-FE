import { DAILY_QUOTES, MOOD_MAP } from './constants';

// Get daily quote based on current date
export const getDailyQuote = () => {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today - new Date(today.getFullYear(), 0, 0)) / 86400000
  );
  return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
};

// Format date string to readable format
export const formatDate = (dateString) => {
  if (!dateString) {
    const today = new Date();
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return {
      month: months[today.getMonth()],
      day: today.getDate().toString()
    };
  }
  const date = new Date(dateString);
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return {
    month: months[date.getMonth()],
    day: date.getDate().toString()
  };
};

// Get mood icon by mood type
export const getMoodIcon = (mood) => {
  const moodData = MOOD_MAP[mood?.toLowerCase()];
  return moodData?.icon || 'sentiment-neutral';
};

// Get mood color by mood type
export const getMoodColor = (mood) => {
  const moodData = MOOD_MAP[mood?.toLowerCase()];
  return moodData?.color || '#9CA3AF';
};

// Get mood background color
export const getMoodBgColor = (mood) => {
  const moodData = MOOD_MAP[mood?.toLowerCase()];
  return moodData?.bg || '#F3F4F6';
};

// Calculate streak from entries
export const calculateStreak = (entries) => {
  let streak = 0;
  
  if (!entries || entries.length === 0) return streak;
  
  const entryDateStrings = new Set();
  entries.forEach((entry) => {
    const dateStr = entry.entryDate || entry.createdAt || entry.date;
    if (dateStr) {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      entryDateStrings.add(dateString);
    }
  });
  
  const today = new Date();
  let checkDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  while (true) {
    const year = checkDate.getFullYear();
    const month = String(checkDate.getMonth() + 1).padStart(2, '0');
    const day = String(checkDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    if (entryDateStrings.has(dateString)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
};

// Get motivational message based on streak
export const getStreakMessage = (streak) => {
  if (streak === 0) {
    return "Start writing to build your streak!";
  } else if (streak === 1) {
    return "Great start! Write again tomorrow.";
  } else if (streak === 2) {
    return "Nice momentum! Keep going! 💪";
  } else if (streak === 3) {
    return "Three days strong! You're unstoppable!";
  } else if (streak >= 4 && streak <= 6) {
    return "Amazing consistency! You're on fire! 🔥";
  } else if (streak >= 7 && streak <= 13) {
    return "Two weeks of greatness! You're a journaling champion!";
  } else if (streak >= 14 && streak <= 30) {
    return "One month+ streak! Absolutely incredible! 🌟";
  } else if (streak > 30) {
    return `${streak} days of pure dedication! You're a legend! 👑`;
  }
};
