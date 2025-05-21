import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Switch,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { getUserById, updateUserStatus } from '@/services/user.service';

// Define user type
type User = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
  createdAt?: string;
};

export default function UserDetailScreen() {
  const { authToken, user: currentUser } = useAuth();
  const params = useLocalSearchParams();
  const userId = params.id as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Role-based protection
  useEffect(() => {
    if (currentUser && currentUser.role !== 'Admin') {
      // Redirect non-admin users
      router.replace('/dashboard/admin');
    }
  }, [currentUser]);

  // Fetch user data
  useEffect(() => {
    fetchUserData();
  }, [userId, authToken]);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!userId || !authToken) {
        setError('Missing user ID or authentication');
        return;
      }

      const response = await getUserById(userId, authToken);
      if (response && response.data) {
        setUser(response.data);
      } else {
        setError('User not found');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setError('Failed to load user data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle user active status
  const toggleUserStatus = async () => {
    if (!user || isUpdating) return;

    try {
      setIsUpdating(true);
      
      // Confirm before deactivating
      if (user.isActive) {
        if (Platform.OS === 'web') {
          if (!confirm('Are you sure you want to deactivate this user? They will not be able to log in.')) {
            setIsUpdating(false);
            return;
          }
        } else {
          Alert.alert(
            'Deactivate User',
            'Are you sure you want to deactivate this user? They will not be able to log in.',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => setIsUpdating(false) },
              { 
                text: 'Deactivate',
                style: 'destructive',
                onPress: () => updateStatus(!user.isActive)
              }
            ]
          );
          return;
        }
      }
      
      updateStatus(!user.isActive);
    } catch (error) {
      console.error('Error toggling user status:', error);
      setError('Failed to update user status. Please try again.');
      setIsUpdating(false);
    }
  };
  
  const updateStatus = async (newStatus: boolean) => {
    try {
      const response = await updateUserStatus(userId, newStatus, authToken);
      if (response && response.data) {
        setUser({
          ...user!,
          isActive: newStatus
        });
        Alert.alert(
          'Success',
          `User ${newStatus ? 'activated' : 'deactivated'} successfully.`
        );
      } else {
        throw new Error('Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update user status');
    } finally {
      setIsUpdating(false);
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Details</Text>
        <View style={styles.headerRight} />
      </View>
      
      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Loading user data...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchUserData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : user ? (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* User Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.nameContainer}>
                <Text style={styles.userName}>{user.name}</Text>
                <View style={[
                  styles.statusBadge,
                  user.isActive ? styles.activeBadge : styles.inactiveBadge
                ]}>
                  <Text style={[
                    styles.statusText,
                    user.isActive ? styles.activeText : styles.inactiveText
                  ]}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            </View>
            
            {/* User Info */}
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Role</Text>
                <Text style={styles.infoValue}>{user.role}</Text>
              </View>
              <View style={styles.divider} />
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user.email}</Text>
              </View>
              <View style={styles.divider} />
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{user.phoneNumber}</Text>
              </View>
              <View style={styles.divider} />
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Created</Text>
                <Text style={styles.infoValue}>{formatDate(user.createdAt)}</Text>
              </View>
            </View>
          </View>
          
          {/* Actions Card */}
          <View style={styles.actionsCard}>
            <Text style={styles.actionsTitle}>Account Status</Text>
            <View style={styles.actionRow}>
              <View>
                <Text style={styles.actionLabel}>
                  {user.isActive ? 'Deactivate Account' : 'Activate Account'}
                </Text>
                <Text style={styles.actionDescription}>
                  {user.isActive 
                    ? 'User will not be able to log in when deactivated.' 
                    : 'Activate to allow user to log in again.'}
                </Text>
              </View>
              <Switch
                value={user.isActive}
                onValueChange={toggleUserStatus}
                disabled={isUpdating}
                trackColor={{ false: '#d0d0d0', true: '#d0d0d0' }}
                thumbColor={user.isActive ? '#4CAF50' : '#FF5252'}
              />
            </View>
            {isUpdating && (
              <View style={styles.updatingContainer}>
                <ActivityIndicator size="small" color="#000" />
                <Text style={styles.updatingText}>Updating status...</Text>
              </View>
            )}
          </View>
          
          {/* Danger Zone */}
          <View style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>Danger Zone</Text>
            <TouchableOpacity 
              style={styles.deleteButton}
              // This is a placeholder - actual delete functionality would need to be implemented
              onPress={() => Alert.alert(
                'Not Implemented',
                'Delete user functionality is not implemented in this version.'
              )}
            >
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={styles.deleteButtonText}>Delete User</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  headerRight: {
    width: 24, // To balance the header
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    marginBottom: 20,
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  nameContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  activeBadge: {
    backgroundColor: '#E8F5E9',
  },
  inactiveBadge: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeText: {
    color: '#4CAF50',
  },
  inactiveText: {
    color: '#FF5252',
  },
  infoSection: {
    marginTop: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 15,
    color: '#888',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    padding: 20,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  actionDescription: {
    fontSize: 14,
    color: '#888',
    maxWidth: '80%',
  },
  updatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  updatingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  dangerCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffcdd2',
    padding: 20,
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#FF5252',
  },
  deleteButton: {
    backgroundColor: '#FF5252',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
}); 