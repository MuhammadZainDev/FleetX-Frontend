import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { Animated, Easing } from 'react-native';
import * as driverService from '@/services/driver.service';

const SIDEBAR_WIDTH = 270;

// Add driver type
type Driver = {
  id: string;
  name: string;
  status: string;
  avatar?: string;
  phoneNumber: string;
  email: string;
  isActive: boolean;
  createdAt: string;
};

export default function DriversListScreen() {
  const { logout, user, token } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [expandedDriverIds, setExpandedDriverIds] = useState<Record<string, boolean>>({});
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Animation value for sidebar
  const sidebarAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  // Fetch drivers from API
  const fetchDrivers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await driverService.getAllDrivers(token);
      
      if (response && response.success) {
        // Transform the API data to match our Driver type
        const transformedDrivers = response.data.map((driver: any) => {
          return {
            id: driver.id,
            name: driver.name,
            status: driver.isActive ? 'active' : 'inactive',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(driver.name)}&background=random`,
            phoneNumber: driver.phoneNumber || 'Not provided',
            email: driver.email,
            isActive: driver.isActive,
            createdAt: new Date(driver.createdAt).toLocaleDateString()
          };
        });
        setDrivers(transformedDrivers);
      } else {
        setError('Failed to load drivers: ' + (response?.message || 'Unknown error'));
      }
    } catch (error) {
      setError('Failed to load drivers. Please try again later. ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  // Load drivers when component mounts
  useEffect(() => {
    if (user && token) {
      fetchDrivers();
    }
  }, [user, token]);

  // Handle actions on driver
  const handleDriverAction = async (driverId: string) => {
    // Navigate to edit driver page
    router.push({
      pathname: '/dashboard/edit-driver',
      params: { id: driverId }
    });
  };

  // Filter and search functionality
  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.name.toLowerCase().includes(searchText.toLowerCase()) || 
                         driver.email.toLowerCase().includes(searchText.toLowerCase());
    const matchesFilter = selectedFilter === 'All' || 
                         (selectedFilter === 'Active' && driver.isActive) ||
                         (selectedFilter === 'Inactive' && !driver.isActive);
    return matchesSearch && matchesFilter;
  });

  // Protect route - check if user is authenticated and admin
  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
    } else if (user.role !== 'Admin') {
      // If user is not admin, redirect to their role-specific dashboard
      if (user.role === 'Driver') {
        router.replace('/dashboard/driver');
      } else if (user.role === 'Viewer') {
        router.replace('/dashboard/viewer');
      }
    }
  }, [user]);
  
  // Animate sidebar when sidebarOpen changes
  useEffect(() => {
    if (sidebarOpen) {
      Animated.parallel([
        Animated.timing(sidebarAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        }),
        Animated.timing(overlayAnim, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(sidebarAnim, {
          toValue: -SIDEBAR_WIDTH,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [sidebarOpen]);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/auth/login');
    } catch (error) {
      // Error handling without console log
    }
  };

  const navigate = (route: string) => {
    setSidebarOpen(false);
    if (route === '/dashboard/admin') {
      router.replace(route);
    } else if (route === '/dashboard/drivers') {
      // Already on this page
    } else {
      // Navigate to the route
    }
  };

  // Sidebar menu items
  const menuItems = [
    { icon: 'home-outline' as any, label: 'Dashboard', route: '/dashboard/admin' },
    { icon: 'people-outline' as any, label: 'Drivers', route: '/dashboard/drivers' },
    { icon: 'car-outline' as any, label: 'Vehicles', route: '/vehicles' },
    { icon: 'location-outline' as any, label: 'Tracking', route: '/tracking' },
    { icon: 'document-text-outline' as any, label: 'Reports', route: '/reports' },
    { icon: 'settings-outline' as any, label: 'Settings', route: '/settings' },
  ];

  // Update renderDriverItem to only show eye icon that leads to edit page
  const renderDriverItem = ({ item }: { item: Driver }) => {
    return (
      <View style={styles.driverCard}>
        <View style={styles.driverHeader}>
          <Image source={{ uri: item.avatar }} style={styles.driverAvatar} />
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{item.name}</Text>
            <View style={[
              styles.statusBadge, 
              item.status === 'active' ? styles.activeStatus : styles.inactiveStatus
            ]}>
              <Text style={[
                styles.statusText, 
                item.status === 'active' ? styles.activeStatusText : styles.inactiveStatusText
              ]}>
                {item.status}
              </Text>
            </View>
          </View>
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleDriverAction(item.id)}
            >
              <Ionicons name="eye-outline" size={22} color="#333" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <Animated.View 
          style={[
            styles.overlay, 
            { opacity: overlayAnim }
          ]}
          onTouchStart={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <Animated.View 
        style={[
          styles.sidebar, 
          { transform: [{ translateX: sidebarAnim }] }
        ]}
      >
        <View style={styles.sidebarContainer}>
          <View style={styles.sidebarInner}>
            <View style={styles.sidebarHeader}>
              <View style={styles.sidebarUserInfo}>
                <View style={styles.sidebarAvatar}>
                  <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'A'}</Text>
                </View>
                <View style={styles.sidebarUserDetails}>
                  <Text style={styles.sidebarUserName}>{user?.name || 'Admin User'}</Text>
                  <Text style={styles.sidebarUserRole}>{user?.role || 'Admin'}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.closeSidebar}
                onPress={() => setSidebarOpen(false)}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.sidebarContent} showsVerticalScrollIndicator={false}>
              {menuItems.map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[
                    styles.sidebarMenuItem,
                    index === 1 && styles.activeMenuItem
                  ]}
                  onPress={() => navigate(item.route)}
                >
                  <Ionicons 
                    name={item.icon} 
                    size={22} 
                    color={index === 1 ? "#000" : "#666"} 
                  />
                  <Text 
                    style={[
                      styles.sidebarMenuItemText,
                      index === 1 && styles.activeMenuItemText
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.sidebarFooter}>
              <TouchableOpacity 
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={toggleSidebar}
          >
            <Ionicons name="menu-outline" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.title}>Drivers</Text>
        </View>
        <TouchableOpacity style={styles.notificationIcon}>
          <Ionicons name="notifications" size={24} color="black" />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search drivers..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor="#999"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => {
              // Add driver functionality
              router.push({
                pathname: '/dashboard/add-driver'
              });
            }}
          >
            <Ionicons name="add" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.filterTabs}>
          {['All', 'Active', 'Inactive'].map(filter => (
            <TouchableOpacity 
              key={filter}
              style={[
                styles.filterTab,
                selectedFilter === filter && styles.activeFilter
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text 
                style={[
                  styles.filterText,
                  selectedFilter === filter && styles.activeFilterText
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Loading indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.loadingText}>Loading drivers...</Text>
          </View>
        )}
        
        {/* Error message */}
        {!loading && error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={fetchDrivers}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Empty state */}
        {!loading && !error && filteredDrivers.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="people" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No drivers found</Text>
            <Text style={styles.emptySubtext}>
              {searchText ? 'Try a different search term' : 'Add your first driver to get started'}
            </Text>
          </View>
        )}
        
        {/* Drivers list */}
        {!loading && !error && filteredDrivers.length > 0 && (
          <FlatList
            data={filteredDrivers}
            renderItem={renderDriverItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.driversList}
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  notificationIcon: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'red',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 45,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    width: 45,
    height: 45,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterTabs: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
  },
  activeFilter: {
    backgroundColor: '#000',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: '500',
  },
  driversList: {
    paddingBottom: 80,
  },
  driverCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeStatus: {
    backgroundColor: 'rgba(40, 167, 69, 0.15)',
  },
  inactiveStatus: {
    backgroundColor: '#ffeeee',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  activeStatusText: {
    color: '#28a745',
  },
  inactiveStatusText: {
    color: '#dc3545',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
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
    paddingVertical: 30,
  },
  errorText: {
    marginTop: 10,
    marginBottom: 15,
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#000',
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  emptySubtext: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
    zIndex: 2,
  },
  sidebar: {
    position: 'absolute',
    width: SIDEBAR_WIDTH,
    backgroundColor: 'white',
    top: 0,
    left: 0,
    bottom: 0,
    height: Dimensions.get('window').height + 100,
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  sidebarContainer: {
    flex: 1,
  },
  sidebarInner: {
    flex: 1,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sidebarUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sidebarAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
  },
  sidebarUserDetails: {},
  sidebarUserName: {
    fontSize: 16,
    fontWeight: '600',
  },
  sidebarUserRole: {
    fontSize: 13,
    color: '#666',
  },
  closeSidebar: {
    padding: 5,
  },
  sidebarContent: {
    flex: 1,
    paddingTop: 15,
  },
  sidebarMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  activeMenuItem: {
    backgroundColor: '#f0f0f0',
  },
  sidebarMenuItemText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#666',
  },
  activeMenuItemText: {
    fontWeight: '600',
    color: '#000',
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButtonText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#FF3B30',
  },
}); 