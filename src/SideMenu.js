import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from './theme';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

const SideMenu = ({
  isOpen,
  onClose,
  onSearch,
  onSettings,
  onExport,
  onLogout
}) => {
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : -DRAWER_WIDTH,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isOpen]);

  const handleMenuPress = (action) => {
    onClose();
    // Small delay to allow animation to complete
    setTimeout(() => {
      action();
    }, 200);
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={onClose}
          activeOpacity={1}
        />
      )}

      {/* Side Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Menu</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <MaterialIcons name="close" size={28} color="#111811" />
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <ScrollView style={styles.menuContent} showsVerticalScrollIndicator={false}>
            {/* Search Entries */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuPress(onSearch)}
            >
              <MaterialIcons name="search" size={24} color={COLORS.primary} />
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuItemText}>Search Entries</Text>
                <Text style={styles.menuItemSubtext}>Find & filter your journals</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#D4A574" />
            </TouchableOpacity>

            {/* Settings */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuPress(onSettings)}
            >
              <MaterialIcons name="settings" size={24} color={COLORS.primary} />
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuItemText}>Settings</Text>
                <Text style={styles.menuItemSubtext}>Preferences & notifications</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#D4A574" />
            </TouchableOpacity>

            {/* Export */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuPress(onExport)}
            >
              <MaterialIcons name="file-download" size={24} color={COLORS.primary} />
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuItemText}>Export & Backup</Text>
                <Text style={styles.menuItemSubtext}>Download your entries as PDF</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#D4A574" />
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Logout */}
            <TouchableOpacity
              style={[styles.menuItem, styles.logoutItem]}
              onPress={() => handleMenuPress(onLogout)}
            >
              <MaterialIcons name="logout" size={24} color="#E74C3C" />
              <View style={styles.menuTextContainer}>
                <Text style={[styles.menuItemText, { color: '#E74C3C' }]}>Logout</Text>
                <Text style={styles.menuItemSubtext}>Sign out from your account</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#E74C3C" />
            </TouchableOpacity>
          </ScrollView>

          {/* Footer */}
          <View style={styles.drawerFooter}>
            <Text style={styles.versionText}>SoulDiary v1.0.0</Text>
          </View>
        </SafeAreaView>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 99,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#FDFBF7',
    zIndex: 100,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: '#111811',
  },
  menuContent: {
    flex: 1,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0E8E0',
  },
  menuTextContainer: {
    flex: 1,
    gap: 4,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    color: '#111811',
  },
  menuItemSubtext: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: '#A8A29E',
  },
  logoutItem: {
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 8,
  },
  drawerFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: '#A8A29E',
  },
});

export default SideMenu;
