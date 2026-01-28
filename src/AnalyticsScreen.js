import React, { useState } from 'react';
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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { COLORS } from './theme';

const { width } = Dimensions.get('window');
const ANALYTICS_COLORS = {
  primary: '#f4af25', // Yellow from design
  bgLight: '#f8f7f5',
  cardBorder: '#f0eee9',
  happy: '#82c91e',
  anxious: '#fa5252',
  textBrown: '#8a7c60',
  textDark: '#181611',
};

const AnalyticsScreen = ({ onNavigate }) => {
  const [timeframe, setTimeframe] = useState('7days');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        
        {/* Header */}
        <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('Home')}>
                <MaterialIcons name="arrow-back-ios" size={20} color={ANALYTICS_COLORS.textDark} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Weekly Overview</Text>
            <View style={{ width: 40 }} />
        </View>

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
                        <Text style={styles.chartTitle}>Mostly Calm</Text>
                        <View style={styles.trendBadge}>
                            <Text style={styles.trendText}>+12% vs last week</Text>
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
                            {/* Area Fill */}
                            <Path
                                d="M0 100 C 40 100, 60 40, 100 40 C 140 40, 160 80, 200 80 C 240 80, 260 20, 300 20 C 340 20, 360 120, 400 120 V 150 H 0 V 100 Z"
                                fill="url(#grad)"
                            />
                            {/* Line */}
                            <Path
                                d="M0 100 C 40 100, 60 40, 100 40 C 140 40, 160 80, 200 80 C 240 80, 260 20, 300 20 C 340 20, 360 120, 400 120"
                                stroke={ANALYTICS_COLORS.primary}
                                strokeWidth="4"
                                fill="none"
                            />
                            {/* Dots */}
                            <Circle cx="100" cy="40" r="5" fill={ANALYTICS_COLORS.primary} stroke="white" strokeWidth="2" />
                            <Circle cx="300" cy="20" r="5" fill={ANALYTICS_COLORS.primary} stroke="white" strokeWidth="2" />
                        </Svg>
                        
                        {/* Days Labels */}
                        <View style={styles.daysLabels}>
                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                                <Text key={i} style={[
                                    styles.dayLabel, 
                                    (day === 'W' || day === 'F') && styles.dayLabelActive
                                ]}>
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
                    You felt mostly <Text style={{ color: ANALYTICS_COLORS.primary }}>Calm</Text> this week
                </Text>
                <Text style={styles.insightDesc}>
                    Your mood peaked on Wednesday after your morning walk in the park. You're doing great!
                </Text>
            </View>

            {/* Mood Breakdown */}
            <View style={styles.breakdownSection}>
                <Text style={styles.breakdownTitle}>MOOD BREAKDOWN</Text>
                
                {/* Item 1 */}
                <View style={styles.progressItem}>
                    <View style={styles.progressHeader}>
                        <View style={styles.labelGroup}>
                            <View style={[styles.dot, { backgroundColor: ANALYTICS_COLORS.primary }]} />
                            <Text style={styles.progressLabel}>Calm</Text>
                        </View>
                        <Text style={styles.progressPercent}>65%</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: '65%', backgroundColor: ANALYTICS_COLORS.primary }]} />
                    </View>
                </View>

                {/* Item 2 */}
                <View style={styles.progressItem}>
                    <View style={styles.progressHeader}>
                        <View style={styles.labelGroup}>
                            <View style={[styles.dot, { backgroundColor: ANALYTICS_COLORS.happy }]} />
                            <Text style={styles.progressLabel}>Happy</Text>
                        </View>
                        <Text style={styles.progressPercent}>25%</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: '25%', backgroundColor: ANALYTICS_COLORS.happy }]} />
                    </View>
                </View>

                {/* Item 3 */}
                <View style={styles.progressItem}>
                    <View style={styles.progressHeader}>
                        <View style={styles.labelGroup}>
                            <View style={[styles.dot, { backgroundColor: ANALYTICS_COLORS.anxious }]} />
                            <Text style={styles.progressLabel}>Anxious</Text>
                        </View>
                        <Text style={styles.progressPercent}>10%</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: '10%', backgroundColor: ANALYTICS_COLORS.anxious }]} />
                    </View>
                </View>
            </View>

            {/* Triggers */}
            <View style={styles.cardWrapper}>
                <View style={styles.triggersCard}>
                    <View style={styles.triggersHeader}>
                        <MaterialIcons name="auto-awesome" size={20} color={ANALYTICS_COLORS.primary} />
                        <Text style={styles.triggersTitle}>What uplifted you?</Text>
                    </View>
                    <View style={styles.chipsWrapper}>
                        {['🌿 Morning Walk', '☕ Coffee', '📖 Reading', '🧘 Meditation'].map((item, i) => (
                            <View key={i} style={styles.chip}>
                                <Text style={styles.chipText}>{item}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
             <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('Home')}>
                  <MaterialIcons name="home" size={28} color="#A8A29E" />
                  <Text style={styles.navLabel}>Home</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('History')}>
                  <MaterialIcons name="menu-book" size={28} color="#A8A29E" />
                  <Text style={styles.navLabel}>Diary</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('Calendar')}>
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
  chipsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chipText: {
    fontSize: 12,
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
