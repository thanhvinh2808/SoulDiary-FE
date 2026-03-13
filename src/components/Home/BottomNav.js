import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme';

const NAV_ITEMS = [
  { id: 'Home', icon: 'home', label: 'Home' },
  { id: 'History', icon: 'menu-book', label: 'Diary' },
  { id: 'Calendar', icon: 'calendar-today', label: 'Calendar' },
  { id: 'Analytics', icon: 'analytics', label: 'Insights' },
];

export const BottomNav = ({ 
  activeScreen = 'Home',
  onNavigate,
  themeColors = {},
  diaryId
}) => {
  const insets = useSafeAreaInsets();
  const surfaceColor = themeColors.surface || COLORS.cardLight;
  const borderColor = themeColors.border || COLORS.borderLight;

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: surfaceColor,
        borderTopColor: borderColor,
        paddingBottom: Platform.OS === 'ios' ? insets.bottom : 12,
      }
    ]}>
      {NAV_ITEMS.map((item) => {
        const isActive = activeScreen === item.id;
        const color = isActive ? COLORS.primary : '#A8A29E';
        
        return (
          <TouchableOpacity 
            key={item.id}
            style={styles.navItem} 
            onPress={() => {
              if (item.id === 'Home') {
                onNavigate('Home');
              } else {
                onNavigate(item.id, { diaryId });
              }
            }}
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
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    marginTop: 0,
  },
});

export default BottomNav;
