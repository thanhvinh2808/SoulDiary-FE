import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme';

export const FormInput = ({ 
  icon,
  placeholder, 
  value, 
  onChangeText,
  secureTextEntry = false,
  showPassword = false,
  onTogglePassword,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete = 'off',
  editable = true,
  maxLength,
  themeColors = {}
}) => {
  const bgColor = themeColors.surface || '#FFFFFF';
  const textColor = themeColors.text || COLORS.textPrimary;
  const borderColor = themeColors.border || COLORS.borderLight;
  const placeholderColor = themeColors.textMuted || '#D4CCCC';
  const iconColor = themeColors.textMuted || '#A8A29E';

  return (
    <View style={[styles.inputBox, { backgroundColor: bgColor, borderColor }]}>
      {icon && (
        <MaterialIcons name={icon} size={20} color={iconColor} />
      )}
      
      <TextInput 
        style={[styles.input, { color: textColor }]}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry && !showPassword}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        autoCorrect={false}
        editable={editable}
        maxLength={maxLength}
      />
      
      {onTogglePassword && (
        <TouchableOpacity 
          onPress={onTogglePassword}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons 
            name={showPassword ? "visibility" : "visibility-off"} 
            size={20} 
            color={iconColor} 
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
  },
});

export default FormInput;
