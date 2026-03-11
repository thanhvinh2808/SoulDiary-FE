import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, getThemeColors } from './theme';
import { authService } from './services/authService';
import { useTheme } from './context/ThemeContext';
import { api } from './services/api';

const ChangePasswordScreen = ({ onNavigate, onClose }) => {
  const { isDark } = useTheme();
  const themeColors = getThemeColors(isDark);
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePasswords = (isSettingPasswordForFirstTime = false) => {
    // If user has existing password, require current password verification
    if (!isSettingPasswordForFirstTime && !currentPassword.trim()) {
      Alert.alert('Validation Error', 'Please enter your current password');
      return false;
    }
    
    if (!newPassword.trim()) {
      Alert.alert('Validation Error', 'Please enter a new password');
      return false;
    }
    if (newPassword.length < 8) {
      Alert.alert('Validation Error', 'New password must be at least 8 characters long');
      return false;
    }
    if (!confirmPassword.trim()) {
      Alert.alert('Validation Error', 'Please confirm your new password');
      return false;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'New passwords do not match');
      return false;
    }
    if (!isSettingPasswordForFirstTime && currentPassword === newPassword) {
      Alert.alert('Validation Error', 'New password must be different from current password');
      return false;
    }
    return true;
  };

  const handleChangePassword = async () => {
    // Check if user has entered current password
    const isSettingPasswordForFirstTime = !currentPassword.trim();
    
    if (!validatePasswords(isSettingPasswordForFirstTime)) return;

    try {
      setLoading(true);

      console.log('🔐 Attempting password change...');
      console.log('Is setting password for first time:', isSettingPasswordForFirstTime);
      
      // Use the centralized API wrapper from services
      // Backend route: PATCH /api/v1/users/updateMyPassword
      const requestBody = {
        newPassword: newPassword,
        confirmPassword: confirmPassword,
      };

      // Only include currentPassword if user provided one
      if (currentPassword.trim()) {
        requestBody.currentPassword = currentPassword;
      }

      const result = await api('/users/updateMyPassword', {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
      });

      console.log('✅ Password changed successfully', result);

      // Show success message
      const successMessage = isSettingPasswordForFirstTime 
        ? 'Your password has been set successfully!' 
        : 'Your password has been changed successfully!';

      Alert.alert(
        'Success',
        successMessage,
        [
          {
            text: 'OK',
            onPress: () => {
              // Clear fields
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
              // Close the screen
              if (onClose) {
                onClose();
              } else if (onNavigate) {
                onNavigate('Profile');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Error changing password:', error);
      Alert.alert('Error', error.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'top']}>
        
        {/* Header */}
        <View style={[styles.header, { paddingLeft: insets.left, paddingRight: insets.right, backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
          <TouchableOpacity 
            onPress={() => onClose ? onClose() : onNavigate('Profile')}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <MaterialIcons name="arrow-back" size={28} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Change Password</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* Info Section */}
          <View style={styles.infoSection}>
            <MaterialIcons name="lock" size={48} color={COLORS.primary} />
            <Text style={[styles.infoTitle, { color: themeColors.text }]}>Update Your Password</Text>
            <Text style={[styles.infoDesc, { color: themeColors.textMuted }]}>
              {currentPassword.trim() 
                ? 'To keep your account secure, please verify your current password and choose a new one.'
                : 'Please choose a strong new password to secure your account.'}
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            
            {/* Current Password */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: themeColors.text }]}>
                Current Password
                {!currentPassword.trim() && <Text style={{ color: themeColors.textMuted, fontSize: 12 }}> (optional)</Text>}
              </Text>
              <View style={[styles.passwordInputContainer, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                <TextInput
                  style={[styles.input, { color: themeColors.text }]}
                  placeholder={currentPassword.trim() ? "Enter your current password" : "Skip if you don't have one yet"}
                  placeholderTextColor={themeColors.textMuted}
                  secureTextEntry={!showCurrentPassword}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  editable={!loading}
                />
                <TouchableOpacity 
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  disabled={loading}
                >
                  <MaterialIcons 
                    name={showCurrentPassword ? 'visibility' : 'visibility-off'} 
                    size={20} 
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* New Password */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: themeColors.text }]}>New Password</Text>
              <View style={[styles.passwordInputContainer, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                <TextInput
                  style={[styles.input, { color: themeColors.text }]}
                  placeholder="Enter a new password (min. 8 characters)"
                  placeholderTextColor={themeColors.textMuted}
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  editable={!loading}
                />
                <TouchableOpacity 
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  disabled={loading}
                >
                  <MaterialIcons 
                    name={showNewPassword ? 'visibility' : 'visibility-off'} 
                    size={20} 
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
              </View>
              <Text style={[styles.hint, { color: themeColors.textMuted }]}>
                • At least 8 characters long
              </Text>
            </View>

            {/* Confirm Password */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: themeColors.text }]}>Confirm New Password</Text>
              <View style={[styles.passwordInputContainer, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                <TextInput
                  style={[styles.input, { color: themeColors.text }]}
                  placeholder="Confirm your new password"
                  placeholderTextColor={themeColors.textMuted}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!loading}
                />
                <TouchableOpacity 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  <MaterialIcons 
                    name={showConfirmPassword ? 'visibility' : 'visibility-off'} 
                    size={20} 
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Password Requirements */}
            <View style={[styles.requirementsBox, { backgroundColor: themeColors.text === '#FFFFFF' ? 'rgba(25, 230, 25, 0.1)' : 'rgba(25, 230, 25, 0.08)' }]}>
              <Text style={[styles.requirementsTitle, { color: themeColors.text }]}>Password Requirements:</Text>
              <Text style={[styles.requirementItem, { color: themeColors.textMuted }]}>✓ At least 8 characters long</Text>
              {currentPassword.trim() && (
                <Text style={[styles.requirementItem, { color: themeColors.textMuted }]}>✓ Different from your current password</Text>
              )}
              <Text style={[styles.requirementItem, { color: themeColors.textMuted }]}>✓ Passwords must match</Text>
            </View>

            {/* Change Password Button */}
            <TouchableOpacity
              style={[styles.changeButton, loading && { opacity: 0.6 }]}
              onPress={handleChangePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#111811" />
              ) : (
                <>
                  <MaterialIcons name="check" size={20} color="#111811" />
                  <Text style={styles.changeButtonText}>Change Password</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: themeColors.border, backgroundColor: themeColors.surface }]}
              onPress={() => onClose ? onClose() : onNavigate('Profile')}
              disabled={loading}
            >
              <Text style={[styles.cancelButtonText, { color: themeColors.text }]}>Cancel</Text>
            </TouchableOpacity>

          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
  },
  content: {
    flex: 1,
    paddingVertical: 24,
  },
  infoSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  infoDesc: {
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  formSection: {
    paddingHorizontal: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    marginBottom: 8,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    paddingVertical: 0,
  },
  hint: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    marginTop: 6,
  },
  requirementsBox: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  requirementsTitle: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    marginBottom: 8,
  },
  requirementItem: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    lineHeight: 18,
  },
  changeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  changeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: '#111811',
  },
  cancelButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
  },
});

export default ChangePasswordScreen;
