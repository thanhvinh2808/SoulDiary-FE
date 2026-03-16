import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { COLORS, getThemeColors } from './theme';
import { diaryService } from './services/diaryService';
import { useTheme } from './context/ThemeContext';
import { BottomNav } from './components/Home';

const { width } = Dimensions.get('window');
const ANALYTICS_COLORS = {
  primary: '#f4af25',
  happy: '#82c91e',
  sad: '#93C5FD',
  neutral: '#6EE7B7',
  angry: '#FCA5A1',
  anxious: '#fa5252',
};

const AnalyticsScreen = ({ onNavigate }) => {
  const { isDark } = useTheme();
  const themeColors = getThemeColors(isDark);
  const insets = useSafeAreaInsets();
  
  const [timeframe, setTimeframe] = useState('7days');
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [moodStats, setMoodStats] = useState({ happy: 0, sad: 0, neutral: 0, angry: 0, anxious: 0 });
  const [overallMood, setOverallMood] = useState('Calm');

  const calculateMoodStats = useCallback((list) => {
    if (!list || list.length === 0) return { happy: 0, sad: 0, neutral: 0, angry: 0, anxious: 0 };
    const stats = { happy: 0, sad: 0, neutral: 0, angry: 0, anxious: 0 };
    list.forEach(e => {
      const m = e.mood?.toLowerCase();
      if (m in stats) stats[m]++;
    });
    const total = list.length;
    Object.keys(stats).forEach(k => stats[k] = Math.round((stats[k] / total) * 100));
    return stats;
  }, []);

  const getDominantMood = useCallback((stats) => {
    const moods = { happy: 'Happy', sad: 'Sad', neutral: 'Calm', angry: 'Angry', anxious: 'Anxious' };
    let dominant = 'Calm', max = -1;
    Object.entries(stats).forEach(([m, p]) => { if (p > max) { max = p; dominant = moods[m]; } });
    return dominant;
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await diaryService.getEntries({ limit: 100 });
      setEntries(data || []);
      const stats = calculateMoodStats(data);
      setMoodStats(stats);
      setOverallMood(getDominantMood(stats));
    } catch (error) {
      console.error('Error loading analytics:', error);
      Alert.alert('Error', 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [calculateMoodStats, getDominantMood]);

  useEffect(() => { loadData(); }, [loadData]);

  const getChartPoints = () => {
    const days = timeframe === '7days' ? 7 : 14;
    const points = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const count = entries.filter(e => (e.entryDate || e.createdAt)?.startsWith(ds)).length;
      points.push(Math.min(130, 20 + count * 30));
    }
    return points;
  };

  const chartPoints = getChartPoints();

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={{ flex: 1, paddingTop: 0 }} edges={['left', 'right', 'top']}>
        
        <View style={[styles.header, { paddingTop: insets.top, borderBottomColor: themeColors.border }]}>
          <TouchableOpacity onPress={() => onNavigate('Home')} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Analytics</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            
            <View style={styles.segmentedWrapper}>
              <View style={[styles.segmentedBg, { backgroundColor: themeColors.surface }]}>
                <TouchableOpacity style={[styles.segment, timeframe === '7days' && styles.segmentActive]} onPress={() => setTimeframe('7days')}>
                  <Text style={[styles.segmentText, { color: timeframe === '7days' ? COLORS.primary : themeColors.textMuted }]}>7 Days</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.segment, timeframe === '30days' && styles.segmentActive]} onPress={() => setTimeframe('30days')}>
                  <Text style={[styles.segmentText, { color: timeframe === '30days' ? COLORS.primary : themeColors.textMuted }]}>30 Days</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.cardWrapper}>
              <View style={[styles.chartCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                <Text style={{ color: themeColors.textMuted, fontSize: 12 }}>MOOD TREND</Text>
                <Text style={[styles.chartTitle, { color: themeColors.text }]}>{overallMood}</Text>
                
                <View style={styles.svgContainer}>
                  <Svg height="120" width={width - 80} viewBox="0 0 300 120">
                    <Defs>
                      <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={COLORS.primary} stopOpacity="0.3" />
                        <Stop offset="1" stopColor={COLORS.primary} stopOpacity="0" />
                      </LinearGradient>
                    </Defs>
                    <Path
                      d={`M0 ${120 - chartPoints[0]} ${chartPoints.map((p, i) => `L ${i * (300 / (chartPoints.length - 1))} ${120 - p}`).join(' ')} V 120 H 0 Z`}
                      fill="url(#grad)"
                    />
                    <Path
                      d={`M0 ${120 - chartPoints[0]} ${chartPoints.map((p, i) => `L ${i * (300 / (chartPoints.length - 1))} ${120 - p}`).join(' ')}`}
                      stroke={COLORS.primary} strokeWidth="3" fill="none"
                    />
                  </Svg>
                </View>
              </View>
            </View>

            <View style={styles.breakdownSection}>
              <Text style={[styles.breakdownTitle, { color: themeColors.textMuted }]}>MOOD BREAKDOWN</Text>
              {Object.entries(moodStats).map(([mood, percent]) => (
                <View key={mood} style={styles.progressItem}>
                  <View style={styles.progressHeader}>
                    <Text style={[styles.progressLabel, { color: themeColors.text }]}>{mood.charAt(0).toUpperCase() + mood.slice(1)}</Text>
                    <Text style={[styles.progressPercent, { color: themeColors.text }]}>{percent}%</Text>
                  </View>
                  <View style={[styles.progressBarBg, { backgroundColor: themeColors.border }]}>
                    <View style={[styles.progressBarFill, { width: `${percent}%`, backgroundColor: ANALYTICS_COLORS[mood] || COLORS.primary }]} />
                  </View>
                </View>
              ))}
            </View>

          </ScrollView>
        )}
      </SafeAreaView>

      <BottomNav
        activeScreen="Analytics"
        onNavigate={onNavigate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  segmentedWrapper: { padding: 16 },
  segmentedBg: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  segment: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  segmentActive: { backgroundColor: 'rgba(25, 230, 25, 0.1)' },
  segmentText: { fontWeight: '600', fontSize: 13 },
  cardWrapper: { paddingHorizontal: 16 },
  chartCard: { padding: 20, borderRadius: 16, borderWidth: 1 },
  chartTitle: { fontSize: 24, fontWeight: '800', marginVertical: 8 },
  svgContainer: { marginTop: 20, alignItems: 'center' },
  breakdownSection: { padding: 16, gap: 16 },
  breakdownTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  progressItem: { gap: 6 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 14, fontWeight: '600' },
  progressPercent: { fontSize: 14, fontWeight: '700' },
  progressBarBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 }
});

export default AnalyticsScreen;