import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Switch,
  Alert,
  ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/services/api.config';
import { getProfile, getToken } from '@/services/auth.service';

// Define the user profile type
type UserProfile = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
};

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(0);
  
  // Protect route - only authenticated users can access
  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
    }
  }, [user]);
  
  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const data = await getProfile();
        setProfileData(data.user);
        // You might load notification preferences from the server here
      } catch (error) {
        console.error('Error fetching profile:', error);
        Alert.alert('Error', 'Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      fetchProfile();
    }
  }, [user]);
  
  // Toggle email notifications
  const toggleEmailNotifications = async () => {
    const newValue = !emailNotifications;
    setEmailNotifications(newValue);
    
    try {
      // Get token for the request
      const token = await getToken();
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // API call to update notification preferences
      const response = await fetch(`${API_BASE_URL}/auth/notifications`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ emailNotifications: newValue }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update notification preferences');
      }
      
      // Show success message
      Alert.alert('Success', 'Notification preferences updated');
    } catch (error) {
      console.error('Error updating notifications:', error);
      // Revert the toggle if the API call fails
      setEmailNotifications(!newValue);
      Alert.alert('Error', 'Failed to update notification preferences');
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // Implementation would connect to a theme context
  };
  
  // Delete account
  const handleDeleteAccount = async () => {
    if (deleteConfirmStep === 0) {
      setDeleteConfirmStep(1);
      return;
    }
    
    try {
      // Get token for the request
      const token = await getToken();
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // API call to delete account
      const response = await fetch(`${API_BASE_URL}/auth/delete-account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete account');
      }
      
      // Logout and redirect to login screen
      await logout();
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert('Error', 'Failed to delete account');
    } finally {
      setDeleteConfirmStep(0);
    }
  };
  
  // Cancel delete account
  const cancelDeleteAccount = () => {
    setDeleteConfirmStep(0);
  };
  
  // Navigate back safely to the appropriate dashboard
  const handleBackButton = () => {
    if (user && user.role) {
      switch (user.role) {
        case 'Admin':
          router.replace('/dashboard/admin');
          break;
        case 'Driver':
          router.replace('/dashboard/driver');
          break;
        case 'Viewer':
          router.replace('/dashboard/viewer');
          break;
        default:
          router.replace('/auth/login');
      }
    } else {
      router.replace('/auth/login');
    }
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#000000" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackButton}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Banner */}
        <View style={styles.profileBanner}>
          <View style={styles.profileAvatar}>
            <Text style={styles.avatarText}>{profileData?.name?.charAt(0)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profileData?.name}</Text>
            <Text style={styles.profileRole}>{profileData?.role}</Text>
            <Text style={styles.profileEmail}>{profileData?.email}</Text>
          </View>
        </View>
        
        {/* Settings Options */}
        <View style={styles.settingsContainer}>
          {/* Notification Setting */}
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="notifications-outline" size={22} color="#007AFF" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Email Notifications</Text>
              <Text style={styles.settingDescription}>Receive email alerts and updates</Text>
            </View>
            <Switch
              trackColor={{ false: "#e0e0e0", true: "#000000" }}
              thumbColor={emailNotifications ? "#ffffff" : "#f4f3f4"}
              ios_backgroundColor="#e0e0e0"
              onValueChange={toggleEmailNotifications}
              value={emailNotifications}
            />
          </View>
          
          <View style={styles.divider} />
          
          {/* Dark Mode Setting */}
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="moon-outline" size={22} color="#6C3CE9" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Dark Mode</Text>
              <Text style={styles.settingDescription}>Switch between light and dark theme</Text>
            </View>
            <Switch
              trackColor={{ false: "#e0e0e0", true: "#000000" }}
              thumbColor={darkMode ? "#ffffff" : "#f4f3f4"}
              ios_backgroundColor="#e0e0e0"
              onValueChange={toggleDarkMode}
              value={darkMode}
            />
          </View>
          
          <View style={styles.divider} />
          
          {/* Password Change Option */}
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => Alert.alert('Coming Soon', 'Password changing will be available in a future update.')}
          >
            <View style={styles.settingIcon}>
              <Ionicons name="key-outline" size={22} color="#FF9500" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Change Password</Text>
              <Text style={styles.settingDescription}>Update your account password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          {/* Privacy Policy */}
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => Alert.alert('Privacy Policy', 'Our privacy policy will be available soon.')}
          >
            <View style={styles.settingIcon}>
              <Ionicons name="shield-outline" size={22} color="#34C759" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Privacy Policy</Text>
              <Text style={styles.settingDescription}>Read our privacy policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          {/* About */}
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => Alert.alert('About', 'FleetX v1.0.0\nA comprehensive fleet management solution.')}
          >
            <View style={styles.settingIcon}>
              <Ionicons name="information-circle-outline" size={22} color="#5856D6" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>About</Text>
              <Text style={styles.settingDescription}>App version and information</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          {/* Logout Option */}
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={logout}
          >
            <View style={styles.settingIcon}>
              <Ionicons name="log-out-outline" size={22} color="#007AFF" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Logout</Text>
              <Text style={styles.settingDescription}>Sign out of your account</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          {/* Delete Account Option */}
          {deleteConfirmStep === 0 ? (
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={handleDeleteAccount}
            >
              <View style={styles.settingIcon}>
                <Ionicons name="trash-outline" size={22} color="#FF3B30" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Delete Account</Text>
                <Text style={styles.settingDescription}>Permanently remove your account</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
            </TouchableOpacity>
          ) : (
            <View style={styles.confirmDeleteContainer}>
              <Text style={styles.confirmDeleteText}>
                Are you sure you want to delete your account? This action cannot be undone.
              </Text>
              <View style={styles.confirmButtonsRow}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={cancelDeleteAccount}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.confirmDeleteButton}
                  onPress={handleDeleteAccount}
                >
                  <Text style={styles.confirmDeleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>FleetX © 2023</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#ffffff',
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  content: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  profileBanner: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000000',
  },
  profileRole: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666666',
  },
  settingsContainer: {
    paddingHorizontal: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 3,
    color: '#000000',
  },
  settingDescription: {
    fontSize: 13,
    color: '#8e8e93',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  confirmDeleteContainer: {
    padding: 20,
    backgroundColor: '#fff5f5',
    borderRadius: 8,
    marginVertical: 10,
  },
  confirmDeleteText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 15,
  },
  confirmButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '500',
  },
  confirmDeleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
  },
  confirmDeleteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#8e8e93',
  }
}); 