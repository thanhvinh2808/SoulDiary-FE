export const COLORS = {
  // Brand
  primary: '#19E619',

  // ========== LIGHT MODE ==========
  // Backgrounds
  backgroundLight: '#FDFBF7',   // Cozy cream journal paper
  
  // Surfaces
  cardLight: '#FFFFFF',
  
  // Text
  textPrimary: '#111811',
  textSecondary: '#638863',
  textMuted: '#A8BAA8',
  textWhite: '#FFFFFF',
  textMain: '#111811',
  textGray: '#78716C',
  textLightGray: '#A8A29E',
  
  // Borders
  borderLight: '#EEEBE4',
  
  // Accent
  accentBeige: '#F2EDE4',

  // ========== DARK MODE ==========
  // Backgrounds
  backgroundDark: '#0F0F0F',
  
  // Surfaces  
  cardDark: '#1A1A1A',
  
  // Text for dark mode
  textDarkPrimary: '#FFFFFF',
  textDarkSecondary: '#B8D4B8',
  textDarkMuted: '#808080',
  
  // Borders for dark mode
  borderDark: 'rgba(255,255,255,0.1)',
  
  // Accent for dark mode
  accentDarkBeige: '#2A2520',

  // ========== MOOD COLORS ==========
  mood: {
    happy: '#19E619',
    neutral: '#9CA3AF',
    sad: '#4B5563'
  }
};

// Global Typography Sync
export const FONTS = {
  // UI - Modern & Clean
  ui: {
    regular: 'Manrope_400Regular',
    medium: 'Manrope_500Medium',
    semiBold: 'Manrope_600SemiBold',
    bold: 'Manrope_700Bold',
    extraBold: 'Manrope_800ExtraBold',
  },
  // Content - Storytelling & Classic
  content: {
    regular: 'Lora_400Regular',
    medium: 'Lora_500Medium',
    italic: 'Lora_400Regular_Italic',
  }
};

export const TYPOGRAPHY = {
  h1: { fontFamily: FONTS.ui.extraBold, fontSize: 32 },
  h2: { fontFamily: FONTS.ui.bold, fontSize: 24 },
  h3: { fontFamily: FONTS.ui.bold, fontSize: 18 },
  body: { fontFamily: FONTS.ui.regular, fontSize: 14 },
  bodyMedium: { fontFamily: FONTS.ui.medium, fontSize: 14 },
  bodyBold: { fontFamily: FONTS.ui.bold, fontSize: 14 },
  caption: { fontFamily: FONTS.ui.medium, fontSize: 12 },
  
  // Đặc biệt cho trang viết nhật ký
  journalTitle: { fontFamily: FONTS.ui.bold, fontSize: 24 },
  journalContent: { fontFamily: FONTS.content.regular, fontSize: 16, lineHeight: 26 },
};

// Helper function to get colors based on theme
export const getThemeColors = (isDark) => {
  if (isDark) {
    return {
      background: COLORS.backgroundDark,
      surface: COLORS.cardDark,
      text: COLORS.textDarkPrimary,
      textSecondary: COLORS.textDarkSecondary,
      textMuted: COLORS.textDarkMuted,
      border: COLORS.borderDark,
      accent: COLORS.accentDarkBeige,
      statusBarStyle: 'light-content'
    };
  }
  return {
    background: COLORS.backgroundLight,
    surface: COLORS.cardLight,
    text: COLORS.textPrimary,
    textSecondary: COLORS.textSecondary,
    textMuted: COLORS.textMuted,
    border: COLORS.borderLight,
    accent: COLORS.accentBeige,
    statusBarStyle: 'dark-content'
  };
};