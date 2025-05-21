import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  FlatList
} from 'react-native';
import { router, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { getAllUsers } from '@/services/user.service';

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

export default function UsersScreen() {
  const { authToken, user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Role-based protection
  useEffect(() => {
    if (user && user.role !== 'Admin') {
      // Redirect non-admin users to their respective dashboards
      if (user.role === 'Driver') {
        router.replace('/dashboard/driver');
      } else if (user.role === 'Viewer') {
        router.replace('/dashboard/viewer');
      }
    }
  }, [user]);

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, [authToken]);

  // Apply filters when filter changes or users change
  useEffect(() => {
    if (users.length > 0) {
      applyFilter(activeFilter);
    }
  }, [activeFilter, users]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!authToken) {
        setError('Authentication required');
        return;
      }

      const response = await getAllUsers(authToken);
      if (response && response.data) {
        // Filter out admin users
        const nonAdminUsers = response.data.filter(
          (u: User) => u.role !== 'Admin'
        );
        setUsers(nonAdminUsers);
        setFilteredUsers(nonAdminUsers);
      } else {
        setUsers([]);
        setFilteredUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilter = (filter: 'all' | 'active' | 'inactive') => {
    setActiveFilter(filter);
    
    if (filter === 'all') {
      setFilteredUsers(users);
    } else if (filter === 'active') {
      setFilteredUsers(users.filter(u => u.isActive));
    } else {
      setFilteredUsers(users.filter(u => !u.isActive));
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Render user item
  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => router.push({
        pathname: '/dashboard/user-detail',
        params: { id: item.id }
      })}
    >
      <View style={styles.userAvatar}>
        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <Text style={styles.userRole}>{item.role}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  const FilterButton = ({ 
    title, 
    active, 
    onPress 
  }: { 
    title: string, 
    active: boolean, 
    onPress: () => void 
  }) => (
    <TouchableOpacity
      style={[styles.filterButton, active && styles.activeFilterButton]}
      onPress={onPress}
    >
      <Text style={[styles.filterButtonText, active && styles.activeFilterButtonText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.replace('/dashboard/admin')}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Management</Text>
        <View style={styles.headerRight} />
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <FilterButton 
            title="All Users" 
            active={activeFilter === 'all'} 
            onPress={() => applyFilter('all')} 
          />
          <FilterButton 
            title="Active" 
            active={activeFilter === 'active'} 
            onPress={() => applyFilter('active')} 
          />
          <FilterButton 
            title="Inactive" 
            active={activeFilter === 'inactive'} 
            onPress={() => applyFilter('inactive')} 
          />
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={fetchUsers}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#999" />
            <Text style={styles.emptyText}>
              {activeFilter === 'all' 
                ? 'No users found' 
                : activeFilter === 'active' 
                  ? 'No active users found' 
                  : 'No inactive users found'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.usersList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
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
    padding: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
  },
  activeFilterButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#333',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  usersList: {
    paddingBottom: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 13,
    color: '#888',
  },
}); 