import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  TextInput,
  Keyboard,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, getThemeColors } from './theme';
import { authService } from './services/authService';
import { useTheme } from './context/ThemeContext';

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isMediumScreen = width >= 375 && width < 450;
const isTablet = width >= 768;

const EditProfileScreen = ({ onNavigate, params }) => {
  const { isDark } = useTheme();
  const themeColors = getThemeColors(isDark);
  const insets = useSafeAreaInsets();
  const initialUser = params?.user;
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    profileImage: ''
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Load current user if not passed via params
  useEffect(() => {
    const loadUser = async () => {
      try {
        if (initialUser) {
          console.log('📥 Using passed user data:', initialUser);
          setFormData({
            name: initialUser.name || '',
            email: initialUser.email || '',
            phone: initialUser.phone || '',
            bio: initialUser.bio || '',
            profileImage: initialUser.profileImage || initialUser.photo || ''
          });
        } else {
          console.log('📥 Fetching current user...');
          const currentUser = await authService.getCurrentUser();
          console.log('✅ Loaded current user:', currentUser);
          setFormData({
            name: currentUser.name || '',
            email: currentUser.email || '',
            phone: currentUser.phone || '',
            bio: currentUser.bio || '',
            profileImage: currentUser.profileImage || currentUser.photo || ''
          });
        }
      } catch (error) {
        console.error('❌ Failed to load user:', error.message);
        Alert.alert('Error', 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [initialUser]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.bio && formData.bio.length > 160) {
      newErrors.bio = 'Bio must be 160 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    Keyboard.dismiss();

    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors below');
      return;
    }

    try {
      setSaving(true);
      const updateData = {
        name: formData.name.trim(),
        bio: formData.bio.trim(),
        phone: formData.phone.trim(),
      };

      console.log('📝 Sending update data:', updateData);

      // Call update API
      const result = await authService.updateProfile(updateData);
      console.log('✅ Profile update result:', result);

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => onNavigate('Profile') }
      ]);
    } catch (error) {
      console.error('❌ Failed to update profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={{ flex: 1, paddingTop: 0 }} edges={['left', 'right', 'bottom']}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right, backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
          <TouchableOpacity onPress={() => onNavigate('Profile')}>
            <MaterialIcons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Edit Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        {loading ? (
          <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Profile Image Preview */}
              <View style={styles.imageSection}>
                <View style={[styles.profileImagePreview, { backgroundColor: themeColors.surface, borderColor: COLORS.primary }]}>
                  {formData.profileImage ? (
                    <Image
                      source={{ uri: formData.profileImage }}
                      style={StyleSheet.absoluteFill}
                    />
                  ) : (
                    <MaterialIcons name="person" size={isSmallScreen ? 36 : 48} color={COLORS.primary} />
                  )}
                </View>
                <TouchableOpacity style={[styles.changePhotoButton, { backgroundColor: themeColors.surface, borderColor: COLORS.primary }]}>
                  <MaterialIcons name="camera-alt" size={16} color={COLORS.primary} />
                  <Text style={[styles.changePhotoText, { color: COLORS.primary }]}>Change Photo</Text>
                </TouchableOpacity>
              </View>

              {/* Form Fields */}
              <View style={styles.formSection}>
                
                {/* Name Field */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: themeColors.text }]}>Full Name *</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: themeColors.surface, borderColor: themeColors.border }, errors.name && styles.inputError]}>
                    <MaterialIcons name="person-outline" size={18} color={COLORS.primary} />
                    <TextInput
                      style={[styles.input, { color: themeColors.text }]}
                      placeholder="Enter your full name"
                      placeholderTextColor={themeColors.textMuted}
                      value={formData.name}
                      onChangeText={(text) => handleInputChange('name', text)}
                      maxLength={50}
                    />
                  </View>
                  {errors.name && <Text style={styles.errorMessage}>{errors.name}</Text>}
                  <Text style={[styles.charCount, { color: themeColors.textMuted }]}>{formData.name.length}/50</Text>
                </View>

                {/* Phone Field */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: themeColors.text }]}>Phone</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: themeColors.surface, borderColor: themeColors.border }, errors.phone && styles.inputError]}>
                    <MaterialIcons name="phone" size={18} color={COLORS.primary} />
                    <TextInput
                      style={[styles.input, { color: themeColors.text }]}
                      placeholder="Your phone number"
                      placeholderTextColor={themeColors.textMuted}
                      value={formData.phone}
                      onChangeText={(text) => handleInputChange('phone', text)}
                      keyboardType="phone-pad"
                    />
                  </View>
                  {errors.phone && <Text style={styles.errorMessage}>{errors.phone}</Text>}
                </View>

                {/* Email Field */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: themeColors.text }]}>Email</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: themeColors.surface, borderColor: themeColors.border }, errors.email && styles.inputError]}>
                    <MaterialIcons name="mail-outline" size={18} color={COLORS.primary} />
                    <TextInput
                      style={[styles.input, { color: themeColors.text }]}
                      placeholder="your@email.com"
                      placeholderTextColor={themeColors.textMuted}
                      value={formData.email}
                      onChangeText={(text) => handleInputChange('email', text)}
                      keyboardType="email-address"
                      editable={false}
                    />
                  </View>
                  {errors.email && <Text style={styles.errorMessage}>{errors.email}</Text>}
                  <Text style={[styles.helpText, { color: themeColors.textMuted }]}>Email cannot be changed</Text>
                </View>

                {/* Bio Field */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: themeColors.text }]}>Bio</Text>
                  <View style={[styles.inputWrapper, styles.bioWrapper, { backgroundColor: themeColors.surface, borderColor: themeColors.border }, errors.bio && styles.inputError]}>
                    <TextInput
                      style={[styles.input, styles.bioInput, { color: themeColors.text }]}
                      placeholder="Tell us about yourself (max 160 characters)"
                      placeholderTextColor={themeColors.textMuted}
                      value={formData.bio}
                      onChangeText={(text) => handleInputChange('bio', text)}
                      maxLength={160}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>
                  {errors.bio && <Text style={styles.errorMessage}>{errors.bio}</Text>}
                  <Text style={[styles.charCount, { color: themeColors.textMuted }]}>{formData.bio.length}/160</Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonGroup}>
                  <TouchableOpacity 
                    style={[styles.cancelButton, { borderColor: COLORS.primary, backgroundColor: themeColors.surface }]}
                    onPress={() => onNavigate('Profile')}
                  >
                    <Text style={[styles.cancelButtonText, { color: COLORS.primary }]}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.saveButton, saving && styles.buttonDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <MaterialIcons name="check" size={20} color="#FFFFFF" />
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.spacer} />
            </ScrollView>
          </KeyboardAvoidingView>
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: isSmallScreen ? 12 : 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '700',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: isSmallScreen ? 12 : 16,
    paddingTop: isSmallScreen ? 16 : 24,
    paddingBottom: 16,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? 24 : 32,
  },
  profileImagePreview: {
    width: isSmallScreen ? 90 : 100,
    height: isSmallScreen ? 90 : 100,
    borderRadius: isSmallScreen ? 45 : 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: isSmallScreen ? 8 : 12,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: isSmallScreen ? 12 : 16,
    paddingVertical: isSmallScreen ? 6 : 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  changePhotoText: {
    fontSize: isSmallScreen ? 12 : 13,
    fontWeight: '600',
  },
  formSection: {
    gap: isSmallScreen ? 18 : 24,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: isSmallScreen ? 13 : 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1,
    gap: 10,
  },
  bioWrapper: {
    height: 'auto',
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  input: {
    flex: 1,
    fontSize: isSmallScreen ? 14 : 15,
    fontWeight: '500',
  },
  bioInput: {
    paddingRight: 14,
    minHeight: isSmallScreen ? 100 : 120,
  },
  atSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorMessage: {
    fontSize: isSmallScreen ? 11 : 12,
    color: '#EF4444',
    fontWeight: '600',
    marginTop: 4,
  },
  helpText: {
    fontSize: isSmallScreen ? 11 : 12,
    fontWeight: '500',
  },
  charCount: {
    fontSize: isSmallScreen ? 11 : 12,
    textAlign: 'right',
    marginTop: 4,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: isSmallScreen ? 8 : 12,
    marginTop: isSmallScreen ? 8 : 12,
  },
  cancelButton: {
    flex: 1,
    height: isSmallScreen ? 48 : 52,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: isSmallScreen ? 13 : 15,
    fontWeight: '700',
  },
  saveButton: {
    flex: 1,
    height: isSmallScreen ? 48 : 52,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: isSmallScreen ? 13 : 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  spacer: {
    height: 32,
  }
});

export default EditProfileScreen;
