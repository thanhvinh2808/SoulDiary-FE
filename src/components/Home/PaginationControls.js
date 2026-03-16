import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme';

export const PaginationControls = ({ 
  currentPage, 
  totalPages, 
  startIndex,
  totalItems,
  itemsPerPage,
  onPreviousPress,
  onNextPress,
  themeColors = {}
}) => {
  const surfaceColor = themeColors.surface || COLORS.cardLight;
  const borderColor = themeColors.border || COLORS.borderLight;
  const textColor = themeColors.text || COLORS.textPrimary;
  const textSecondaryColor = themeColors.textSecondary || COLORS.textSecondary;

  if (totalPages <= 1) return null;

  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: surfaceColor,
        borderColor: borderColor
      }
    ]}>
      <TouchableOpacity
        style={[styles.paginationButton, currentPage === 1 && styles.buttonDisabled]}
        onPress={onPreviousPress}
        disabled={currentPage === 1}
      >
        <MaterialIcons 
          name="chevron-left" 
          size={20} 
          color={currentPage === 1 ? '#D1D5DB' : COLORS.primary} 
        />
        <Text style={[styles.paginationButtonText, currentPage === 1 && styles.textDisabled]}>
          Previous
        </Text>
      </TouchableOpacity>

      <View style={styles.pageIndicator}>
        <Text style={[styles.pageIndicatorText, { color: textColor }]}>
          {currentPage} - {totalPages}
        </Text>
        
      </View>

      <TouchableOpacity
        style={[styles.paginationButton, currentPage === totalPages && styles.buttonDisabled]}
        onPress={onNextPress}
        disabled={currentPage === totalPages}
      >
        <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.textDisabled]}>
          Next
        </Text>
        <MaterialIcons 
          name="chevron-right" 
          size={20} 
          color={currentPage === totalPages ? '#D1D5DB' : COLORS.primary} 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F4',
    flex: 1,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    color: COLORS.primary,
  },
  textDisabled: {
    color: '#D1D5DB',
  },
  pageIndicator: {
    alignItems: 'center',
    flex: 1,
  },
  pageIndicatorText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
  },
  pageCountText: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    marginTop: 2,
  },
});

export default PaginationControls;
