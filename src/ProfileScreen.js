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
import { diaryService } from './services/diaryService';

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
    streaks: 0,
    bestStreak: 0
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
        
        // Fetch actual entries to count and calculate streak
        try {
          const entries = await diaryService.getEntries();
          const entryCount = Array.isArray(entries) ? entries.length : 0;
          const streak = calculateStreakFromEntries(entries);
          const bestStreak = calculateBestStreak(entries);
          
          console.log('📊 Calculated stats:', { entryCount, streak, bestStreak });
          
          setStats({
            entries: entryCount,
            streaks: streak,
            bestStreak: bestStreak
          });
        } catch (error) {
          console.error('Failed to fetch entries for stats:', error);
          setStats({ entries: 0, streaks: 0, bestStreak: 0 });
        }
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Calculate current streak: consecutive days with entries ending today
  const calculateStreakFromEntries = (entries) => {
    if (!Array.isArray(entries) || entries.length === 0) return 0;
    
    console.log('📈 Calculating streak from', entries.length, 'entries');
    
    // Get all unique dates with entries
    const entryDates = new Set();
    entries.forEach(entry => {
      const dateStr = entry.entryDate || entry.createdAt || entry.date;
      if (dateStr) {
        const date = new Date(dateStr);
        // Normalize date to YYYY-MM-DD
        const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        entryDates.add(normalized.getTime());
      }
    });
    
    if (entryDates.size === 0) return 0;
    
    // Sort dates descending (most recent first)
    const dates = Array.from(entryDates).sort((a, b) => b - a);
    
    // Check if most recent date is today or yesterday
    const today = new Date();
    const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const lastEntryTime = dates[0];
    const daysDiff = Math.floor((todayNormalized - lastEntryTime) / (1000 * 60 * 60 * 24));
    
    console.log('🔍 Last entry:', new Date(lastEntryTime), 'Days diff:', daysDiff);
    
    // If no entry today or yesterday, streak is 0
    if (daysDiff > 1) {
      console.log('❌ Streak broken - last entry not today or yesterday');
      return 0;
    }
    
    // Count consecutive days backwards from today
    let streak = 0;
    let checkDate = lastEntryTime;
    
    for (const entryTime of dates) {
      if (entryTime === checkDate) {
        streak++;
        checkDate -= 1000 * 60 * 60 * 24; // Go back one day
      } else {
        break; // Streak broken
      }
    }
    
    console.log('✅ Current streak:', streak);
    return streak;
  };

  // Calculate best streak ever
  const calculateBestStreak = (entries) => {
    if (!Array.isArray(entries) || entries.length === 0) return 0;
    
    // Get all unique dates with entries
    const entryDates = new Map();
    entries.forEach(entry => {
      const dateStr = entry.entryDate || entry.createdAt || entry.date;
      if (dateStr) {
        const date = new Date(dateStr);
        const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const timeKey = normalized.getTime();
        if (!entryDates.has(timeKey)) {
          entryDates.set(timeKey, true);
        }
      }
    });
    
    if (entryDates.size === 0) return 0;
    
    // Sort dates ascending
    const dates = Array.from(entryDates.keys()).sort((a, b) => a - b);
    
    // Find longest consecutive streak
    let maxStreak = 1;
    let currentStreak = 1;
    
    for (let i = 1; i < dates.length; i++) {
      const diff = (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
      if (Math.abs(diff - 1) < 0.5) {
        currentStreak++;
      } else {
        maxStreak = Math.max(maxStreak, currentStreak);
        currentStreak = 1;
      }
    }
    
    const best = Math.max(maxStreak, currentStreak);
    console.log('🏆 Best streak ever:', best);
    return best;
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
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity onPress={loadUserProfile}>
                  <MaterialIcons name="refresh" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onNavigate('EditProfile', { user })}>
                  <MaterialIcons name="edit" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
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
            <Text style={styles.userEmail}>{user.email}</Text>
            {user.phone ? (
              <Text style={styles.userHandle}>📱 {user.phone}</Text>
            ) : (
              <Text style={styles.userPlaceholder}>No phone number added</Text>
            )}
            {user.bio ? (
              <Text style={styles.userBio}>{user.bio}</Text>
            ) : (
              <Text style={styles.userPlaceholder}>No bio added yet</Text>
            )}
            {user.createdAt && (
              <Text style={styles.userMemberSince}>
                Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </Text>
            )}
            {user.isVerified && (
              <View style={styles.verificationBadge}>
                <MaterialIcons name="verified" size={14} color={COLORS.primary} />
                <Text style={styles.verificationText}>Verified</Text>
              </View>
            )}
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.entries}</Text>
              <Text style={styles.statLabel}>Entries</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.streaks}</Text>
              <Text style={styles.statLabel}>Current Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.bestStreak}</Text>
              <Text style={styles.statLabel}>Best Streak</Text>
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
                <MaterialIcons name="notifications" size={20} color={COLORS.primary} />
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
  userPlaceholder: {
    fontSize: isSmallScreen ? 13 : 14,
    color: COLORS.textLightGray,
    fontStyle: 'italic',
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
    marginBottom: 8,
  },
  userMemberSince: {
    fontSize: isSmallScreen ? 10 : 11,
    color: COLORS.textGray,
    marginTop: 4,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(25, 230, 25, 0.1)',
    borderRadius: 12,
  },
  verificationText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '600',
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
