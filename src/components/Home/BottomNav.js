import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, getThemeColors } from '../../theme';
import { useTheme } from '../../context/ThemeContext';

const NAV_ITEMS = [
  { id: 'Home', icon: 'home', label: 'Home' },
  { id: 'History', icon: 'menu-book', label: 'Diary' },
  { id: 'Calendar', icon: 'calendar-today', label: 'Calendar' },
  { id: 'Analytics', icon: 'analytics', label: 'Insights' },
];

export const BottomNav = ({ activeScreen = 'Home', onNavigate }) => {
  const { isDark } = useTheme();
  const themeColors = getThemeColors(isDark);
  const insets = useSafeAreaInsets();
  
  const surfaceColor = themeColors.surface || COLORS.cardLight;
  const borderColor = themeColors.border || COLORS.borderLight;
  const textColorMuted = themeColors.textMuted || '#A8A29E';

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: surfaceColor,
        borderTopColor: borderColor,
        paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 12) : 12,
      }
    ]}>
      {NAV_ITEMS.map((item) => {
        const isActive = activeScreen === item.id;
        const color = isActive ? COLORS.primary : textColorMuted;
        
        return (
          <TouchableOpacity 
            key={item.id}
            style={styles.navItem} 
            onPress={() => onNavigate(item.id)}
            activeOpacity={0.7}
          >
            <MaterialIcons name={item.icon} size={28} color={color} />
            <Text style={[styles.navLabel, { color }]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
  },
});

export default BottomNav;