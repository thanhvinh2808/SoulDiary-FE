import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, getThemeColors } from './theme';
import { useTheme } from './context/ThemeContext';
import ChangePasswordScreen from './ChangePasswordScreen';

const SettingsScreen = ({ onClose, onNavigate }) => {
  const { isDark, toggleTheme } = useTheme();
  const themeColors = getThemeColors(isDark);
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const handleOpenLink = (url) => {
    Linking.openURL(url).catch(err => {
      Alert.alert('Error', 'Could not open link');
    });
  };

  // Show ChangePasswordScreen if requested
  if (showChangePassword) {
    return (
      <ChangePasswordScreen 
        onNavigate={onNavigate}
        onClose={() => setShowChangePassword(false)}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'top']}>
        
        {/* Header */}
        <View style={[styles.header, { paddingLeft: insets.left, paddingRight: insets.right, backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <MaterialIcons name="arrow-back" size={28} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Settings</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Settings Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* 🔔 Notifications Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            
            <View style={[styles.settingItem, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <View style={styles.settingLeft}>
                <MaterialIcons name="notifications" size={24} color={COLORS.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, { color: themeColors.text }]}>Enable Notifications</Text>
                  <Text style={[styles.settingDesc, { color: themeColors.textMuted }]}>Get app notifications</Text>
                </View>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#E5E5E5', true: COLORS.primary }}
                thumbColor="#FFF"
              />
            </View>

            <View style={[styles.settingItem, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <View style={styles.settingLeft}>
                <MaterialIcons name="schedule" size={24} color={COLORS.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, { color: themeColors.text }]}>Daily Writing Reminder</Text>
                  <Text style={[styles.settingDesc, { color: themeColors.textMuted }]}>Remind me to write every day at 8 PM</Text>
                </View>
              </View>
              <Switch
                value={dailyReminder}
                onValueChange={setDailyReminder}
                trackColor={{ false: '#E5E5E5', true: COLORS.primary }}
                thumbColor="#FFF"
                disabled={!notifications}
              />
            </View>
          </View>

          {/* 🎨 Display Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Display</Text>
            
            <TouchableOpacity style={[styles.settingItem, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]} onPress={() => isDark && toggleTheme()}>
              <View style={styles.settingLeft}>
                <MaterialIcons name="light-mode" size={24} color={!isDark ? COLORS.primary : '#A8A29E'} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, { color: themeColors.text }]}>Light Theme</Text>
                  <Text style={[styles.settingDesc, { color: themeColors.textMuted }]}>Light background with dark text</Text>
                </View>
              </View>
              {!isDark && (
                <MaterialIcons name="check-circle" size={24} color={COLORS.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.settingItem, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]} onPress={() => !isDark && toggleTheme()}>
              <View style={styles.settingLeft}>
                <MaterialIcons name="dark-mode" size={24} color={isDark ? COLORS.primary : '#A8A29E'} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, { color: themeColors.text }]}>Dark Theme</Text>
                  <Text style={[styles.settingDesc, { color: themeColors.textMuted }]}>Dark background with light text</Text>
                </View>
              </View>
              {isDark && (
                <MaterialIcons name="check-circle" size={24} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          </View>

          {/* 🔐 Privacy & Security Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy & Security</Text>
            
            <TouchableOpacity 
              style={[styles.settingItem, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
              onPress={() => setShowChangePassword(true)}
            >
              <View style={styles.settingLeft}>
                <MaterialIcons name="lock" size={24} color={COLORS.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, { color: themeColors.text }]}>Change Password</Text>
                  <Text style={[styles.settingDesc, { color: themeColors.textMuted }]}>Update your account password</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#D4A574" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.settingItem, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <View style={styles.settingLeft}>
                <MaterialIcons name="privacy-tip" size={24} color={COLORS.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, { color: themeColors.text }]}>Privacy Policy</Text>
                  <Text style={[styles.settingDesc, { color: themeColors.textMuted }]}>Read our privacy policy</Text>
                </View>
              </View>
              <MaterialIcons name="open-in-new" size={20} color="#D4A574" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.settingItem, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <View style={styles.settingLeft}>
                <MaterialIcons name="description" size={24} color={COLORS.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, { color: themeColors.text }]}>Terms of Service</Text>
                  <Text style={[styles.settingDesc, { color: themeColors.textMuted }]}>Review our terms & conditions</Text>
                </View>
              </View>
              <MaterialIcons name="open-in-new" size={20} color="#D4A574" />
            </TouchableOpacity>
          </View>

          {/* 📱 About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            
            <View style={[styles.settingItem, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <View style={styles.settingLeft}>
                <MaterialIcons name="info" size={24} color={COLORS.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, { color: themeColors.text }]}>App Version</Text>
                  <Text style={[styles.settingDesc, { color: themeColors.textMuted }]}>v1.0.0</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={[styles.settingItem, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <View style={styles.settingLeft}>
                <MaterialIcons name="help" size={24} color={COLORS.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, { color: themeColors.text }]}>Help & Support</Text>
                  <Text style={[styles.settingDesc, { color: themeColors.textMuted }]}>Get help or contact us</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#D4A574" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.settingItem, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <View style={styles.settingLeft}>
                <MaterialIcons name="star" size={24} color={COLORS.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, { color: themeColors.text }]}>Rate Our App</Text>
                  <Text style={[styles.settingDesc, { color: themeColors.textMuted }]}>Leave a review on the store</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#D4A574" />
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
    paddingVertical: 16,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  settingItem: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  settingLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    color: '#111811',
  },
  settingDesc: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    marginTop: 4,
  },
});

export default SettingsScreen;
