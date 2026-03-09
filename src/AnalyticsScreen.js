import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { COLORS } from './theme';
import { diaryService } from './services/diaryService';

const { width } = Dimensions.get('window');
const ANALYTICS_COLORS = {
  primary: '#f4af25', // Yellow from design
  bgLight: '#f8f7f5',
  cardBorder: '#f0eee9',
  happy: '#82c91e',
  sad: '#93C5FD',
  neutral: '#6EE7B7',
  angry: '#FCA5A1',
  anxious: '#fa5252',
  textBrown: '#8a7c60',
  textDark: '#181611',
};

const AnalyticsScreen = ({ navigation, onNavigate, diaryId: passedDiaryId, ...props }) => {
  const insets = useSafeAreaInsets();
  // Handle diaryId from both route.params and direct props
  const [diaryId, setDiaryId] = useState(props.route?.params?.diaryId || passedDiaryId);
  const [timeframe, setTimeframe] = useState('7days');
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [moodStats, setMoodStats] = useState({
    happy: 0,
    sad: 0,
    neutral: 0,
    angry: 0,
    anxious: 0,
  });
  const [overallMood, setOverallMood] = useState('Calm');
  const [trendDifference, setTrendDifference] = useState(0);

  // Calculate mood statistics
  const calculateMoodStats = useCallback((entriesList) => {
    if (!entriesList || entriesList.length === 0) {
      return { happy: 0, sad: 0, neutral: 0, angry: 0, anxious: 0 };
    }

    const stats = { happy: 0, sad: 0, neutral: 0, angry: 0, anxious: 0 };
    let total = entriesList.length;

    entriesList.forEach(entry => {
      const mood = entry.mood?.toLowerCase() || 'neutral';
      if (mood in stats) {
        stats[mood]++;
      }
    });

    // Convert to percentages
    Object.keys(stats).forEach(key => {
      stats[key] = Math.round((stats[key] / total) * 100);
    });

    return stats;
  }, []);

  // Get dominant mood
  const getDominantMood = useCallback((stats) => {
    const moods = {
      happy: 'Happy',
      sad: 'Sad',
      neutral: 'Calm',
      angry: 'Angry',
      anxious: 'Anxious',
    };
    
    let dominant = 'Calm';
    let maxPercent = 0;

    Object.entries(stats).forEach(([mood, percent]) => {
      if (percent > maxPercent) {
        maxPercent = percent;
        dominant = moods[mood];
      }
    });

    return dominant;
  }, []);

  // Load entries
  const loadEntries = useCallback(async (targetDiaryId) => {
    try {
      setLoading(true);
      const finalDiaryId = targetDiaryId || diaryId;
      
      // If still no diaryId, fetch default diary
      if (!finalDiaryId) {
        console.log('⚠️ No diaryId provided in AnalyticsScreen, fetching default diary...');
        const diaries = await diaryService.getDiaries();
        if (diaries && diaries.length > 0) {
          const defaultId = diaries[0].id || diaries[0]._id;
          setDiaryId(defaultId);
          const data = await diaryService.getEntries(defaultId);
          setEntries(data || []);
          return;
        } else {
          console.error('❌ No diaries found');
          setEntries([]);
          return;
        }
      }
      
      const data = await diaryService.getEntries(finalDiaryId);
      setEntries(data || []);

      // Calculate stats
      const stats = calculateMoodStats(data);
      setMoodStats(stats);
      setOverallMood(getDominantMood(stats));

      // Calculate trend (simplified - random for demo)
      setTrendDifference(Math.floor(Math.random() * 20) - 10);
    } catch (error) {
      console.error('📊 Error loading analytics:', error);
      Alert.alert('Error', 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [diaryId, calculateMoodStats, getDominantMood]);

  useEffect(() => {
    loadEntries(diaryId);
  }, [diaryId, loadEntries]);

  // Get last N days
  const getEntriesForTimeframe = useCallback(() => {
    const days = timeframe === '7days' ? 7 : 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return entries.filter(entry => {
      const entryDate = new Date(entry.createdAt);
      return entryDate >= cutoffDate;
    });
  }, [entries, timeframe]);

  // Get chart data points
  const getChartPoints = useCallback(() => {
    const days = timeframe === '7days' ? 7 : 30;
    const points = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayEntries = entries.filter(e => e.createdAt?.startsWith(dateStr));
      const avgMood = dayEntries.length > 0 ? dayEntries.length * 20 : 50;
      
      points.push(Math.min(120, Math.max(20, avgMood)));
    }

    return points;
  }, [entries, timeframe]);

  const chartPoints = getChartPoints();
  const timeframeEntries = getEntriesForTimeframe();
  const timeframeStats = calculateMoodStats(timeframeEntries);
  
  const totalPercent = Object.values(timeframeStats).reduce((a, b) => a + b, 0);

  // Normalize for display
  const displayStats = totalPercent > 0 ? timeframeStats : moodStats;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1, paddingTop: 0 }} edges={['left', 'right', 'bottom']}>
        
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('Home')}>
            <MaterialIcons name="arrow-back-ios" size={20} color={ANALYTICS_COLORS.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{timeframe === '7days' ? 'Weekly' : 'Monthly'} Overview</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            
            {/* Segmented Control */}
            <View style={styles.segmentedWrapper}>
              <View style={styles.segmentedBg}>
                <TouchableOpacity 
                  style={[styles.segment, timeframe === '7days' && styles.segmentActive]}
                  onPress={() => setTimeframe('7days')}
                >
                  <Text style={[styles.segmentText, timeframe === '7days' && styles.segmentTextActive]}>Last 7 Days</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.segment, timeframe === '30days' && styles.segmentActive]}
                  onPress={() => setTimeframe('30days')}
                >
                  <Text style={[styles.segmentText, timeframe === '30days' && styles.segmentTextActive]}>Last 30 Days</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Chart Card */}
            <View style={styles.cardWrapper}>
              <View style={styles.chartCard}>
                <Text style={styles.chartSub}>Emotional Journey</Text>
                <View style={styles.chartMainInfo}>
                  <Text style={styles.chartTitle}>{overallMood}</Text>
                  <View style={[styles.trendBadge, { backgroundColor: trendDifference >= 0 ? '#E7F5E8' : '#FFE7E7' }]}>
                    <Text style={[styles.trendText, { color: trendDifference >= 0 ? '#078810' : '#C41E3A' }]}>
                      {trendDifference >= 0 ? '+' : ''}{trendDifference}% vs last {timeframe === '7days' ? 'week' : 'month'}
                    </Text>
                  </View>
                </View>

                {/* SVG Chart */}
                <View style={styles.svgContainer}>
                  <Svg height="150" width={width - 80} viewBox="0 0 400 150">
                    <Defs>
                      <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={ANALYTICS_COLORS.primary} stopOpacity="0.3" />
                        <Stop offset="1" stopColor={ANALYTICS_COLORS.primary} stopOpacity="0" />
                      </LinearGradient>
                    </Defs>
                    {/* Generate path from chart points */}
                    {chartPoints.length > 0 && (
                      <>
                        <Path
                          d={`M0 ${130 - chartPoints[0]} ${chartPoints.map((p, i) => `C ${i * 50} ${130 - p}, ${(i + 1) * 50} ${130 - (chartPoints[i + 1] || p)}, ${(i + 1) * 50} ${130 - (chartPoints[i + 1] || p)}`).join(' ')} V 150 H 0 V ${130 - chartPoints[0]} Z`}
                          fill="url(#grad)"
                        />
                        <Path
                          d={`M0 ${130 - chartPoints[0]} ${chartPoints.map((p, i) => `C ${i * 50} ${130 - p}, ${(i + 1) * 50} ${130 - (chartPoints[i + 1] || p)}, ${(i + 1) * 50} ${130 - (chartPoints[i + 1] || p)}`).join(' ')}`}
                          stroke={ANALYTICS_COLORS.primary}
                          strokeWidth="4"
                          fill="none"
                        />
                      </>
                    )}
                  </Svg>
                  
                  {/* Days Labels */}
                  <View style={styles.daysLabels}>
                    {(timeframe === '7days' ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['W1', 'W2', 'W3', 'W4']).map((day, i) => (
                      <Text key={i} style={styles.dayLabel}>
                        {day}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* Insights */}
            <View style={styles.insightSection}>
              <Text style={styles.insightTitle}>
                You felt mostly <Text style={{ color: ANALYTICS_COLORS.primary }}>{overallMood}</Text> this {timeframe === '7days' ? 'week' : 'month'}
              </Text>
              <Text style={styles.insightDesc}>
                {entries.length} total entries recorded. Keep journaling to track your emotional patterns.
              </Text>
            </View>

            {/* Mood Breakdown */}
            <View style={styles.breakdownSection}>
              <Text style={styles.breakdownTitle}>MOOD BREAKDOWN</Text>
              
              {/* Happy */}
              <View style={styles.progressItem}>
                <View style={styles.progressHeader}>
                  <View style={styles.labelGroup}>
                    <View style={[styles.dot, { backgroundColor: ANALYTICS_COLORS.happy }]} />
                    <Text style={styles.progressLabel}>Happy</Text>
                  </View>
                  <Text style={styles.progressPercent}>{displayStats.happy}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${displayStats.happy}%`, backgroundColor: ANALYTICS_COLORS.happy }]} />
                </View>
              </View>

              {/* Neutral */}
              <View style={styles.progressItem}>
                <View style={styles.progressHeader}>
                  <View style={styles.labelGroup}>
                    <View style={[styles.dot, { backgroundColor: ANALYTICS_COLORS.neutral }]} />
                    <Text style={styles.progressLabel}>Calm</Text>
                  </View>
                  <Text style={styles.progressPercent}>{displayStats.neutral}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${displayStats.neutral}%`, backgroundColor: ANALYTICS_COLORS.neutral }]} />
                </View>
              </View>

              {/* Sad */}
              <View style={styles.progressItem}>
                <View style={styles.progressHeader}>
                  <View style={styles.labelGroup}>
                    <View style={[styles.dot, { backgroundColor: ANALYTICS_COLORS.sad }]} />
                    <Text style={styles.progressLabel}>Sad</Text>
                  </View>
                  <Text style={styles.progressPercent}>{displayStats.sad}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${displayStats.sad}%`, backgroundColor: ANALYTICS_COLORS.sad }]} />
                </View>
              </View>

              {/* Anxious */}
              <View style={styles.progressItem}>
                <View style={styles.progressHeader}>
                  <View style={styles.labelGroup}>
                    <View style={[styles.dot, { backgroundColor: ANALYTICS_COLORS.anxious }]} />
                    <Text style={styles.progressLabel}>Anxious</Text>
                  </View>
                  <Text style={styles.progressPercent}>{displayStats.anxious}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${displayStats.anxious}%`, backgroundColor: ANALYTICS_COLORS.anxious }]} />
                </View>
              </View>

              {/* Angry */}
              <View style={styles.progressItem}>
                <View style={styles.progressHeader}>
                  <View style={styles.labelGroup}>
                    <View style={[styles.dot, { backgroundColor: ANALYTICS_COLORS.angry }]} />
                    <Text style={styles.progressLabel}>Angry</Text>
                  </View>
                  <Text style={styles.progressPercent}>{displayStats.angry}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${displayStats.angry}%`, backgroundColor: ANALYTICS_COLORS.angry }]} />
                </View>
              </View>
            </View>

            {/* Insights Card */}
            <View style={styles.cardWrapper}>
              <View style={styles.triggersCard}>
                <View style={styles.triggersHeader}>
                  <MaterialIcons name="auto-awesome" size={20} color={ANALYTICS_COLORS.primary} />
                  <Text style={styles.triggersTitle}>Keep Journaling</Text>
                </View>
                <Text style={styles.insightDesc}>
                  More entries = Better insights. Share what makes you feel good or bad!
                </Text>
              </View>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>
        )}

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('Home')}>
            <MaterialIcons name="home" size={28} color="#A8A29E" />
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('History', { diaryId })}>
            <MaterialIcons name="menu-book" size={28} color="#A8A29E" />
            <Text style={styles.navLabel}>Diary</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('Calendar', { diaryId })}>
            <MaterialIcons name="calendar-today" size={28} color="#A8A29E" />
            <Text style={styles.navLabel}>Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('Analytics')}>
            <MaterialIcons name="analytics" size={28} color={COLORS.primary} />
            <Text style={[styles.navLabel, { color: COLORS.primary }]}>Insights</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ANALYTICS_COLORS.bgLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: ANALYTICS_COLORS.textDark,
    fontFamily: 'Manrope_800ExtraBold',
    marginRight: 40, // Balance back button
  },
  segmentedWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  segmentedBg: {
    flexDirection: 'row',
    backgroundColor: '#EDECE9',
    borderRadius: 12,
    padding: 6,
    height: 48,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8A7C60',
    fontFamily: 'Manrope_600SemiBold',
  },
  segmentTextActive: {
    color: ANALYTICS_COLORS.textDark,
  },
  cardWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: ANALYTICS_COLORS.cardBorder,
    shadowColor: ANALYTICS_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  chartSub: {
    fontSize: 14,
    color: '#8A7C60',
    fontWeight: '500',
    marginBottom: 4,
  },
  chartMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: ANALYTICS_COLORS.textDark,
    fontFamily: 'Manrope_800ExtraBold',
  },
  trendBadge: {
    backgroundColor: '#E7F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  trendText: {
    color: '#078810',
    fontSize: 11,
    fontWeight: '700',
  },
  svgContainer: {
    alignItems: 'center',
  },
  daysLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
    marginTop: 16,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A7C60',
  },
  dayLabelActive: {
    color: ANALYTICS_COLORS.primary,
    fontWeight: '800',
  },
  insightSection: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    alignItems: 'center',
  },
  insightTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    color: ANALYTICS_COLORS.textDark,
    lineHeight: 30,
  },
  insightDesc: {
    fontSize: 16,
    color: '#5C5340',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 12,
    paddingHorizontal: 16,
  },
  breakdownSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 16,
  },
  breakdownTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: ANALYTICS_COLORS.textDark,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  progressItem: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: ANALYTICS_COLORS.textDark,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '800',
    color: ANALYTICS_COLORS.textDark,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#EDECE9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  triggersCard: {
    backgroundColor: 'rgba(244, 175, 37, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(244, 175, 37, 0.2)',
  },
  triggersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  triggersTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ANALYTICS_COLORS.textDark,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 12,
    borderTopWidth: 1,
    borderTopColor: '#E7E5E4',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
    color: '#A8A29E',
  },
});

export default AnalyticsScreen;
