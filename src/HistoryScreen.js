import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  SectionList,
  Image,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from './theme';

// Dữ liệu mẫu (Dummy Data)
const DATA = [
  {
    title: 'October 2023',
    data: [
      {
        id: '1',
        day: 'Mon, 24 Oct',
        time: '10:30 AM',
        content: 'Today I felt a lot of peace while walking in the park. I noticed the leaves are starting to change color and it felt like...',
        moodIcon: 'sentiment-satisfied',
        moodColor: '#CA8A04', // Yellow-600
        moodBg: '#FEF9C3', // Yellow-100
        tags: ['Nature', 'Peaceful'],
      },
      {
        id: '2',
        day: 'Sun, 23 Oct',
        time: '08:15 AM',
        content: 'Morning routine felt so grounded today. Made a fresh cup of coffee and just sat with my thoughts for twenty minutes.',
        moodIcon: 'self-improvement', // self_care alternative
        moodColor: '#2563EB', // Blue-600
        moodBg: '#DBEAFE', // Blue-100
        tags: ['Morning', 'Self-Care'],
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSWCz6VJCT33vV9dm9_9ZnxdaRYm6yvmyVYQIPNtzSPcEEkE5rB5My7MYONrf7AHGUE-XGAX8zONsf-rGc9Y8Ag6-6z6NrRJiOx6nFmC0v_SHJTVIr7nbZPdbUM9e8im5--upTwpwwDXZ7dPJHcjTeVVP3xxGv_IpF1s6bNQomBCL_J7r307g_fIsFshW1FIHlntpTedPkypfVs0dUx72O4HLcR3Z_M47go9jv4y9B9R6ejzcvlane4BdAq7L9ykgniOjo6-oiSqHM',
      },
      {
        id: '3',
        day: 'Fri, 21 Oct',
        time: '09:45 PM',
        content: 'Gratitude list for tonight: 1. The warm sun 2. A good talk with Sarah 3. Finishing that difficult project at work.',
        moodIcon: 'auto-awesome',
        moodColor: '#9333EA', // Purple-600
        moodBg: '#F3E8FF', // Purple-100
        tags: ['Gratitude'],
      },
    ],
  },
  {
    title: 'September 2023',
    data: [
      {
        id: '4',
        day: 'Wed, 28 Sep',
        time: '02:20 PM',
        content: 'Felt a burst of creative energy this afternoon. Sketched out some ideas for the new living room layout.',
        moodIcon: 'bolt',
        moodColor: '#EA580C', // Orange-600
        moodBg: '#FFEDD5', // Orange-100
        tags: ['Creative', 'Home'],
      },
    ],
  },
];

const HistoryScreen = ({ onNavigate }) => {
  // FORCE LIGHT MODE
  const isDark = false; 

  const themeStyles = {
    container: { backgroundColor: COLORS.backgroundLight },
    textPrimary: { color: COLORS.textMain },
    textSecondary: { color: COLORS.textGray },
    cardBg: { backgroundColor: '#FFFFFF' },
    navBg: { backgroundColor: 'rgba(255, 255, 255, 0.95)' },
  };

  const renderEntry = ({ item }) => (
    <View style={styles.card}>
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.cardImage} />
      )}
      <View style={styles.cardContent}>
        <View style={styles.moodContainer}>
           <View style={[styles.moodCircle, { backgroundColor: item.moodBg }]}>
             <MaterialIcons name={item.moodIcon} size={28} color={item.moodColor} />
           </View>
        </View>
        
        <View style={{ flex: 1 }}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardDay}>{item.day}</Text>
                <Text style={styles.cardTime}>{item.time}</Text>
            </View>
            <Text style={styles.cardText} numberOfLines={2}>
                {item.content}
            </Text>
            <View style={styles.tagsRow}>
                {item.tags.map((tag, index) => (
                    <View 
                        key={index} 
                        style={[
                            styles.tag, 
                            tag === 'Self-Care' ? { backgroundColor: 'rgba(25, 230, 25, 0.1)' } : {}
                        ]}
                    >
                        <Text style={[
                            styles.tagText,
                            tag === 'Self-Care' ? { color: COLORS.primary } : {}
                        ]}>
                            {tag}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, themeStyles.container]}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        
        {/* Header */}
        <View style={styles.header}>
            <View style={styles.headerTop}>
                <TouchableOpacity style={styles.iconButton}>
                    <MaterialIcons name="menu" size={24} color="#57534E" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Journal History</Text>
                <TouchableOpacity style={styles.iconButton} onPress={() => onNavigate('Calendar')}>
                    <MaterialIcons name="calendar-month" size={24} color="#57534E" />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <MaterialIcons name="search" size={24} color="#A8A29E" style={{ marginLeft: 12 }} />
                    <TextInput 
                        style={styles.searchInput}
                        placeholder="Search reflections..."
                        placeholderTextColor="#A8A29E"
                    />
                </View>
                <TouchableOpacity style={styles.filterButton}>
                    <MaterialIcons name="tune" size={24} color="#57534E" />
                </TouchableOpacity>
            </View>
        </View>

        {/* Filter Chips */}
        <View style={{ height: 60 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                <TouchableOpacity style={styles.chipActive}>
                    <Text style={styles.chipTextActive}>All Moods</Text>
                    <MaterialIcons name="expand-more" size={18} color="#1C1917" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.chip}>
                    <Text style={styles.chipText}>Work</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.chip}>
                    <Text style={styles.chipText}>Gratitude</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.chip}>
                    <Text style={styles.chipText}>Health</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>

        {/* Section List */}
        <SectionList
            sections={DATA}
            keyExtractor={(item) => item.id}
            renderItem={renderEntry}
            renderSectionHeader={({ section: { title } }) => (
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionHeaderText}>{title}</Text>
                </View>
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
        />

        {/* FAB */}
        <TouchableOpacity 
            style={styles.fab}
            onPress={() => onNavigate('Editor')}
        >
            <MaterialIcons name="add" size={32} color="#112111" />
        </TouchableOpacity>

        {/* Bottom Navigation */}
        <View style={[styles.bottomNav, themeStyles.navBg]}>
             <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('Home')}>
                  <MaterialIcons name="home" size={28} color="#A8A29E" />
                  <Text style={styles.navLabel}>Home</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('History')}>
                  <MaterialIcons name="menu-book" size={28} color={COLORS.primary} />
                  <Text style={[styles.navLabel, { color: COLORS.primary }]}>Diary</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('Calendar')}>
                  <MaterialIcons name="calendar-today" size={28} color="#A8A29E" />
                  <Text style={styles.navLabel}>Calendar</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('Analytics')}>
                  <MaterialIcons name="analytics" size={28} color="#A8A29E" />
                  <Text style={styles.navLabel}>Insights</Text>
             </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: 'rgba(253, 251, 247, 0.95)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F4', // Stone-100
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
    color: '#1C1917',
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F4',
    borderRadius: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    fontSize: 16,
    fontFamily: 'Manrope_400Regular',
    color: '#1C1917',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F5F5F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#F5F5F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(25, 230, 25, 0.2)', // Primary/20
    borderWidth: 1,
    borderColor: 'rgba(25, 230, 25, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Manrope_500Medium',
    color: '#1C1917',
  },
  chipTextActive: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    color: '#1C1917',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Space for Bottom Nav + FAB
  },
  sectionHeader: {
    paddingVertical: 16,
    paddingTop: 8,
    backgroundColor: COLORS.backgroundLight, // Sticky header bg
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: '#78716C', // Stone-500
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F5F5F4',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 128,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 16,
    flexDirection: 'row',
    gap: 16,
  },
  moodContainer: {
    flexShrink: 0,
  },
  moodCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardDay: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: '#1C1917',
  },
  cardTime: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Manrope_500Medium',
    color: '#A8A29E', // Stone-400
  },
  cardText: {
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    color: '#78716C', // Stone-500
    lineHeight: 22,
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#F5F5F4',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: '#57534E', // Stone-600
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fab: {
    position: 'absolute',
    bottom: 90, // Above bottom nav
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
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

export default HistoryScreen;
