import React from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView, Switch, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [locationTrackingEnabled, setLocationTrackingEnabled] = React.useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = React.useState(false);
  const [biometricEnabled, setBiometricEnabled] = React.useState(false);

  const handleLogout = () => {
    // In a real app, clear authentication tokens/state
    router.replace('/welcome');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title">Settings</ThemedText>
        </View>

        <Card style={styles.profileCard}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <IconSymbol name="person.crop.circle.fill" size={60} color={Colors.light.primary} />
            </View>
            <View style={styles.profileInfo}>
              <ThemedText type="defaultSemiBold" style={styles.profileName}>John Doe</ThemedText>
              <ThemedText style={styles.profileRole}>Fleet Manager</ThemedText>
              <ThemedText style={styles.profileEmail}>john.doe@example.com</ThemedText>
            </View>
          </View>
          <TouchableOpacity style={styles.editProfileButton}>
            <ThemedText style={styles.editProfileText}>Edit Profile</ThemedText>
            <IconSymbol name="pencil" size={14} color={Colors.light.primary} />
          </TouchableOpacity>
        </Card>

        <View style={styles.sectionHeader}>
          <ThemedText type="defaultSemiBold">App Settings</ThemedText>
        </View>

        <Card style={styles.settingsCard}>
          <SettingItem 
            icon="bell.fill"
            iconColor="#f39c12"
            title="Push Notifications"
            description="Get notified about vehicle alerts and updates"
            control={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#d0d0d0', true: `${Colors.light.primary}80` }}
                thumbColor={notificationsEnabled ? Colors.light.primary : '#f4f3f4'}
              />
            }
          />
          
          <SettingItem 
            icon="location.fill"
            iconColor="#3498db"
            title="Location Tracking"
            description="Enable real-time location tracking for vehicles"
            control={
              <Switch
                value={locationTrackingEnabled}
                onValueChange={setLocationTrackingEnabled}
                trackColor={{ false: '#d0d0d0', true: `${Colors.light.primary}80` }}
                thumbColor={locationTrackingEnabled ? Colors.light.primary : '#f4f3f4'}
              />
            }
            hasDivider
          />
          
          <SettingItem 
            icon="moon.fill"
            iconColor="#9b59b6"
            title="Dark Mode"
            description="Switch between light and dark theme"
            control={
              <Switch
                value={darkModeEnabled}
                onValueChange={setDarkModeEnabled}
                trackColor={{ false: '#d0d0d0', true: `${Colors.light.primary}80` }}
                thumbColor={darkModeEnabled ? Colors.light.primary : '#f4f3f4'}
              />
            }
            hasDivider
          />
          
          <SettingItem 
            icon="faceid"
            iconColor="#2ecc71"
            title="Biometric Authentication"
            description="Use fingerprint or face ID to log in"
            control={
              <Switch
                value={biometricEnabled}
                onValueChange={setBiometricEnabled}
                trackColor={{ false: '#d0d0d0', true: `${Colors.light.primary}80` }}
                thumbColor={biometricEnabled ? Colors.light.primary : '#f4f3f4'}
              />
            }
            hasDivider
          />
        </Card>

        <View style={styles.sectionHeader}>
          <ThemedText type="defaultSemiBold">More Options</ThemedText>
        </View>

        <Card style={styles.settingsCard}>
          <SettingItem 
            icon="doc.plaintext.fill"
            iconColor="#34495e"
            title="Terms of Service"
            showArrow
          />
          
          <SettingItem 
            icon="lock.fill"
            iconColor="#3498db"
            title="Privacy Policy"
            showArrow
            hasDivider
          />
          
          <SettingItem 
            icon="questionmark.circle.fill"
            iconColor="#f39c12"
            title="Help & Support"
            showArrow
            hasDivider
          />
          
          <SettingItem 
            icon="info.circle.fill"
            iconColor="#95a5a6"
            title="About"
            description="Version 1.0.0"
            showArrow
            hasDivider
          />
        </Card>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <IconSymbol name="arrow.right.square" size={18} color="#e74c3c" />
          <ThemedText style={styles.logoutText}>Log Out</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingItem({ 
  icon, 
  iconColor,
  title, 
  description, 
  control,
  showArrow = false,
  hasDivider = false 
}) {
  return (
    <View>
      <View style={styles.settingItem}>
        <View style={[styles.settingIcon, { backgroundColor: `${iconColor}20` }]}>
          <IconSymbol name={icon} size={18} color={iconColor} />
        </View>
        <View style={styles.settingContent}>
          <ThemedText type="defaultSemiBold">{title}</ThemedText>
          {description && <ThemedText style={styles.settingDescription}>{description}</ThemedText>}
        </View>
        {control && control}
        {showArrow && <IconSymbol name="chevron.right" size={16} color="#999" />}
      </View>
      {hasDivider && <View style={styles.divider} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
  },
  profileCard: {
    marginBottom: 24,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    marginBottom: 4,
  },
  profileRole: {
    color: '#666',
    marginBottom: 2,
  },
  profileEmail: {
    color: '#666',
    fontSize: 14,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: `${Colors.light.primary}10`,
  },
  editProfileText: {
    color: Colors.light.primary,
    marginRight: 6,
  },
  sectionHeader: {
    marginBottom: 8,
    paddingLeft: 8,
  },
  settingsCard: {
    marginBottom: 24,
    paddingVertical: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 68,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e74c3c20',
  },
  logoutText: {
    marginLeft: 8,
    color: '#e74c3c',
    fontWeight: '500',
  },
}); 