import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from './theme';
import { authService } from './services/authService';

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isMediumScreen = width >= 375 && width < 450;
const isTablet = width >= 768;

const EditProfileScreen = ({ onNavigate, params }) => {
  const isDark = false;
  const insets = useSafeAreaInsets();
  const initialUser = params?.user;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    profileImage: ''
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialUser) {
      setFormData({
        name: initialUser.name || '',
        email: initialUser.email || '',
        phone: initialUser.phone || '',
        bio: initialUser.bio || '',
        profileImage: initialUser.profileImage || initialUser.photo || ''
      });
    }
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

      if (formData.profileImage) {
        updateData.profileImage = formData.profileImage;
      }

      // Call update API
      await authService.updateProfile(updateData);

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => onNavigate('Profile') }
      ]);
    } catch (error) {
      console.error('Failed to update profile:', error);
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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1, paddingTop: 0 }} edges={['left', 'right', 'bottom']}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }]}>
          <TouchableOpacity onPress={() => onNavigate('Profile')}>
            <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 24 }} />
        </View>

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
              <View style={styles.profileImagePreview}>
                {formData.profileImage ? (
                  <Image
                    source={{ uri: formData.profileImage }}
                    style={StyleSheet.absoluteFill}
                  />
                ) : (
                  <MaterialIcons name="person" size={isSmallScreen ? 36 : 48} color={COLORS.primary} />
                )}
              </View>
              <TouchableOpacity style={styles.changePhotoButton}>
                <MaterialIcons name="camera-alt" size={16} color={COLORS.primary} />
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View style={styles.formSection}>
              
              {/* Name Field */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <View style={[styles.inputWrapper, errors.name && styles.inputError]}>
                  <MaterialIcons name="person-outline" size={18} color={COLORS.primary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor={COLORS.textLightGray}
                    value={formData.name}
                    onChangeText={(text) => handleInputChange('name', text)}
                    maxLength={50}
                  />
                </View>
                {errors.name && <Text style={styles.errorMessage}>{errors.name}</Text>}
                <Text style={styles.charCount}>{formData.name.length}/50</Text>
              </View>

              {/* Phone Field */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Phone</Text>
                <View style={[styles.inputWrapper, errors.phone && styles.inputError]}>
                  <MaterialIcons name="phone" size={18} color={COLORS.primary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Your phone number"
                    placeholderTextColor={COLORS.textLightGray}
                    value={formData.phone}
                    onChangeText={(text) => handleInputChange('phone', text)}
                    keyboardType="phone-pad"
                  />
                </View>
                {errors.phone && <Text style={styles.errorMessage}>{errors.phone}</Text>}
              </View>

              {/* Email Field */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                  <MaterialIcons name="mail-outline" size={18} color={COLORS.primary} />
                  <TextInput
                    style={styles.input}
                    placeholder="your@email.com"
                    placeholderTextColor={COLORS.textLightGray}
                    value={formData.email}
                    onChangeText={(text) => handleInputChange('email', text)}
                    keyboardType="email-address"
                    editable={false}
                  />
                </View>
                {errors.email && <Text style={styles.errorMessage}>{errors.email}</Text>}
                <Text style={styles.helpText}>Email cannot be changed</Text>
              </View>

              {/* Bio Field */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Bio</Text>
                <View style={[styles.inputWrapper, styles.bioWrapper, errors.bio && styles.inputError]}>
                  <TextInput
                    style={[styles.input, styles.bioInput]}
                    placeholder="Tell us about yourself (max 160 characters)"
                    placeholderTextColor={COLORS.textLightGray}
                    value={formData.bio}
                    onChangeText={(text) => handleInputChange('bio', text)}
                    maxLength={160}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
                {errors.bio && <Text style={styles.errorMessage}>{errors.bio}</Text>}
                <Text style={styles.charCount}>{formData.bio.length}/160</Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonGroup}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => onNavigate('Profile')}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
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
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: isSmallScreen ? 12 : 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '700',
    color: COLORS.textMain,
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
    backgroundColor: COLORS.beigeAccent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    overflow: 'hidden',
    marginBottom: isSmallScreen ? 8 : 12,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: isSmallScreen ? 12 : 16,
    paddingVertical: isSmallScreen ? 6 : 8,
    backgroundColor: COLORS.beigeAccent,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  changePhotoText: {
    fontSize: isSmallScreen ? 12 : 13,
    fontWeight: '600',
    color: COLORS.primary,
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
    color: COLORS.textMain,
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
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
    color: COLORS.textMain,
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
    color: COLORS.textLightGray,
    fontWeight: '500',
  },
  charCount: {
    fontSize: isSmallScreen ? 11 : 12,
    color: COLORS.textLightGray,
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
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: isSmallScreen ? 13 : 15,
    fontWeight: '700',
    color: COLORS.primary,
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
