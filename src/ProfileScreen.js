import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Dimensions,
  Image,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from './theme';
import { authService } from './services/authService';

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isMediumScreen = width >= 375 && width < 450;
const isTablet = width >= 768;

const ProfileScreen = ({ onNavigate }) => {
  const isDark = false;
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    entries: 0,
    insights: 0,
    streaks: 0
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        // Calculate stats based on user data
        const entriesCount = currentUser.entriesCount || 0;
        setStats({
          entries: entriesCount,
          insights: Math.floor(entriesCount * 0.3),
          streaks: calculateStreak(currentUser.createdAt)
        });
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (createdAt) => {
    if (!createdAt) return 0;
    const created = new Date(createdAt);
    const today = new Date();
    const days = Math.floor((today - created) / (1000 * 60 * 60 * 24));
    return Math.min(days, 365);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await authService.logout();
              onNavigate('Auth');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.errorText}>User data not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1, paddingTop: 0 }} edges={['left', 'right', 'bottom']}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header with Background */}
          <View style={[styles.headerBackground, { paddingTop: insets.top }]}>
            <View style={styles.headerTop}>
              <TouchableOpacity onPress={() => onNavigate('Home')}>
                <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>My Profile</Text>
              <TouchableOpacity onPress={() => onNavigate('EditProfile', { user })}>
                <MaterialIcons name="edit" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Profile Picture */}
            <View style={styles.profileImageContainer}>
              <View style={styles.profileImage}>
                {user.profileImage ? (
                  <Image
                    source={{ uri: user.profileImage }}
                    style={StyleSheet.absoluteFill}
                  />
                ) : (
                  <MaterialIcons name="person" size={isSmallScreen ? 48 : 64} color={COLORS.primary} />
                )}
              </View>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => onNavigate('EditProfile', { user })}
              >
                <MaterialIcons name="edit" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* User Info */}
          <View style={styles.userInfoSection}>
            <Text style={styles.userName}>{user.name || 'User'}</Text>
            {user.phone && (
              <Text style={styles.userHandle}>{user.phone}</Text>
            )}
            {user.bio && (
              <Text style={styles.userBio}>{user.bio}</Text>
            )}
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.entries}</Text>
              <Text style={styles.statLabel}>Entries</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.insights}</Text>
              <Text style={styles.statLabel}>Insights</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.streaks}</Text>
              <Text style={styles.statLabel}>Days Active</Text>
            </View>
          </View>

          {/* Settings Section */}
          <View style={styles.settingsSection}>
            <View style={styles.settingsDivider} />
            
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => onNavigate('EditProfile', { user })}
            >
              <View style={styles.settingContent}>
                <MaterialIcons name="person-outline" size={20} color={COLORS.primary} />
                <Text style={styles.settingText}>Edit Profile</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={COLORS.textLightGray} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingContent}>
                <MaterialIcons name="notifications-outline" size={20} color={COLORS.primary} />
                <Text style={styles.settingText}>Notifications</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={COLORS.textLightGray} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingContent}>
                <MaterialIcons name="privacy-tip" size={20} color={COLORS.primary} />
                <Text style={styles.settingText}>Privacy & Security</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={COLORS.textLightGray} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingContent}>
                <MaterialIcons name="help-outline" size={20} color={COLORS.primary} />
                <Text style={styles.settingText}>Help & Support</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={COLORS.textLightGray} />
            </TouchableOpacity>

            <View style={styles.settingsDivider} />

            <TouchableOpacity 
              style={[styles.settingItem, styles.logoutItem]}
              onPress={handleLogout}
            >
              <View style={styles.settingContent}>
                <MaterialIcons name="logout" size={20} color="#EF4444" />
                <Text style={[styles.settingText, styles.logoutText]}>Logout</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.spacer} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  headerBackground: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: isSmallScreen ? 60 : 80,
    alignItems: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: isSmallScreen ? 12 : 16,
    marginBottom: isSmallScreen ? 16 : 24,
    width: '100%',
  },
  headerTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileImageContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: isSmallScreen ? -32 : -40,
  },
  profileImage: {
    width: isSmallScreen ? 100 : 120,
    height: isSmallScreen ? 100 : 120,
    borderRadius: isSmallScreen ? 50 : 60,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: COLORS.backgroundLight,
    overflow: 'hidden',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: isSmallScreen ? -4 : -8,
    backgroundColor: COLORS.primary,
    width: isSmallScreen ? 40 : 44,
    height: isSmallScreen ? 40 : 44,
    borderRadius: isSmallScreen ? 20 : 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.backgroundLight,
  },
  userInfoSection: {
    alignItems: 'center',
    paddingTop: isSmallScreen ? 44 : 56,
    paddingHorizontal: isMediumScreen ? 20 : 24,
    paddingBottom: isSmallScreen ? 16 : 24,
  },
  userName: {
    fontSize: isSmallScreen ? 24 : 28,
    fontWeight: '800',
    color: COLORS.textMain,
    marginBottom: 4,
  },
  userHandle: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
    color: COLORS.textLightGray,
    marginBottom: isSmallScreen ? 8 : 12,
  },
  userBio: {
    fontSize: isSmallScreen ? 12 : 14,
    color: COLORS.textGray,
    textAlign: 'center',
    marginBottom: 8,
    maxWidth: '90%',
    lineHeight: 20,
  },
  userEmail: {
    fontSize: isSmallScreen ? 11 : 12,
    color: COLORS.textLightGray,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: isSmallScreen ? 8 : 16,
    paddingBottom: isSmallScreen ? 24 : 32,
    gap: isSmallScreen ? 8 : 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.beigeAccent,
    borderRadius: 12,
    padding: isSmallScreen ? 12 : 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  statValue: {
    fontSize: isSmallScreen ? 20 : 24,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: isSmallScreen ? 10 : 12,
    fontWeight: '600',
    color: COLORS.textGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsSection: {
    paddingHorizontal: isSmallScreen ? 8 : 16,
  },
  settingsDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: isSmallScreen ? 12 : 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: isSmallScreen ? 12 : 16,
    paddingHorizontal: isSmallScreen ? 8 : 12,
    borderRadius: 12,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isSmallScreen ? 10 : 12,
    flex: 1,
  },
  settingText: {
    fontSize: isSmallScreen ? 13 : 15,
    fontWeight: '600',
    color: COLORS.textMain,
  },
  logoutItem: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginBottom: 16,
  },
  logoutText: {
    color: '#EF4444',
  },
  spacer: {
    height: 32,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textMain,
  }
});

export default ProfileScreen;
