import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, getThemeColors } from '../../theme';
import { useTheme } from '../../context/ThemeContext';

export const HomeHeader = ({ 
  onMenuPress, 
  onRefresh, 
  onProfilePress,
  themeColors = {}
}) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const headerBgColor = themeColors.background || COLORS.backgroundLight;
  const borderColor = themeColors.border || COLORS.borderLight;
  const textColor = themeColors.text || COLORS.textPrimary;

  return (
    <View style={[
      styles.header, 
      { 
        paddingTop: insets.top, 
        paddingLeft: insets.left, 
        paddingRight: insets.right,
        backgroundColor: headerBgColor,
        borderBottomColor: borderColor
      }
    ]}>
      <TouchableOpacity style={styles.iconButton} onPress={onMenuPress}>
        <MaterialIcons name="menu" size={28} color={textColor} />
      </TouchableOpacity>
      
      <View style={styles.titleContainer}>
        <View style={styles.titleContent}>
          <MaterialIcons name="favorite" size={24} color={COLORS.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.headerTitle, { color: textColor }]}>SoulDiary</Text>
        </View>
        <Text style={[styles.headerSubtitle, { color: themeColors.textMuted || '#A8A29E' }]}>
          Your Stories, Your Journey
        </Text>
      </View>
      
      <View style={{ flexDirection: 'row', gap: 12 }}>

        <TouchableOpacity style={styles.iconButton} onPress={onProfilePress}>
          <MaterialIcons name="person" size={28} color={textColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  titleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'Manrope_700Bold',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: 'Manrope_400Regular',
    marginTop: 2,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  iconButton: {
    padding: 8,
  },
});

export default HomeHeader;
