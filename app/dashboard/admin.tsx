import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Dimensions,
  Animated,
  Easing,
  ActivityIndicator
} from 'react-native';
import { router, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { getAllDrivers } from '@/services/driver.service';
import { getEarningsSummary } from '@/services/earning.service';

const screenWidth = Dimensions.get('window').width - 40;
const screenHeight = Dimensions.get('window').height;
const SIDEBAR_WIDTH = 270;

// Define driver and earnings types
type Driver = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
};

type EarningsSummary = {
  totalEarnings: number;
  weeklyEarnings?: number;
  monthlyEarnings?: number;
};

export default function AdminDashboard() {
  const { logout, user, authToken } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('Daily');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  
  // New state variables for active drivers and their earnings
  const [activeDrivers, setActiveDrivers] = useState<Driver[]>([]);
  const [driverEarnings, setDriverEarnings] = useState<{[key: string]: EarningsSummary}>({});
  const [isLoading, setIsLoading] = useState(true);

  // Role-based protection - only Admin can access this dashboard
  useEffect(() => {
    if (user && user.role !== 'Admin') {
      // Redirect non-admin users to their respective dashboards
      if (user.role === 'Driver') {
        router.replace('/dashboard/driver');
      } else if (user.role === 'Viewer') {
        router.replace('/dashboard/viewer');
      }
    }
  }, [user, router]);

  // Animation value for sidebar
  const sidebarAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  
  // Chart data points
  const data = [2500, 4000, 2800, 4800, 3900, 6500, 5000];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Find max value for scaling
  const maxValue = Math.max(...data);
  
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
      console.error('Logout error:', error);
    }
  };

  const navigate = (route: string) => {
    setSidebarOpen(false);
    
    console.log(`Admin dashboard: Navigating to ${route}`);
    
    // Handle navigation based on route path
    switch (route) {
      case '/vehicles':
        // Use replace for more consistent navigation
        console.log('Admin dashboard: Navigating to vehicles page');
        try {
          router.replace('/vehicles');
          console.log('Navigation completed');
        } catch (error) {
          console.error('Navigation error:', error);
        }
        break;
      case '/dashboard/admin':
        router.replace('/dashboard/admin');
        break;
      case '/dashboard/users':
        router.replace('/dashboard/users');
        break;
      default:
        // For other routes, just log for now
        console.log(`Navigate to: ${route}`);
        break;
    }
  };

  // Sidebar menu items - only vehicles as requested
  const menuItems = [
    { icon: 'home-outline' as any, label: 'Dashboard', route: '/dashboard/admin' },
    { icon: 'car-outline' as any, label: 'Vehicles', route: '/vehicles' },
    { icon: 'people-outline' as any, label: 'Users', route: '/dashboard/users' },
  ];

  // Fetch drivers
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        if (!authToken) return;
        
        setIsLoading(true);
        console.log('Fetching drivers with token...');
        
        const response = await getAllDrivers(authToken);
        console.log('Driver API response:', response);
        
        if (response && response.data) {
          const allDrivers = response.data;
          console.log('All users found:', allDrivers.length);
          
          // Set all drivers without filtering
          setActiveDrivers(allDrivers);
          
          // Fetch earnings for each driver
          if (allDrivers.length > 0) {
            const earningsData: {[key: string]: EarningsSummary} = {};
            
            await Promise.all(
              allDrivers.map(async (driver: Driver) => {
                try {
                  const summary = await getEarningsSummary(driver.id, 'monthly', null);
                  earningsData[driver.id] = summary;
                } catch (error) {
                  console.error(`Error fetching earnings for driver ${driver.id}:`, error);
                  earningsData[driver.id] = { totalEarnings: 0 };
                }
              })
            );
            
            setDriverEarnings(earningsData);
          }
        } else {
          console.log('No drivers found in response');
          setActiveDrivers([]);
        }
      } catch (error) {
        console.error('Error fetching drivers:', error);
        setActiveDrivers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDrivers();
  }, [authToken]);

  // Use a constant black gradient for all cards
  const getCardGradient = () => {
    // Return the black gradient used in driver dashboard
    return ['#1a1a1a', '#000000'] as const;
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
        <View style={{height: screenHeight, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
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

          <ScrollView style={styles.sidebarContent}>
            {menuItems.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.sidebarMenuItem,
                  index === 0 && styles.activeMenuItem
                ]}
                onPress={() => navigate(item.route)}
              >
                <Ionicons 
                  name={item.icon as any} 
                  size={22} 
                  color={index === 0 ? "#000" : "#666"} 
                />
                <Text 
                  style={[
                    styles.sidebarMenuItemText,
                    index === 0 && styles.activeMenuItemText
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
      </Animated.View>
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={toggleSidebar}
          >
            <Ionicons name="menu-outline" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.title}>Dashboard</Text>
        </View>
        <TouchableOpacity style={styles.notificationIcon}>
          <Ionicons name="notifications" size={24} color="black" />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Background Gradient */}
        <LinearGradient
          colors={['#FFFFFF', '#FFFFFF']}
          style={styles.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Driver Cards Section */}
        <View style={styles.driverCardsSection}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#000" />
              <Text style={styles.loadingText}>Loading driver data...</Text>
            </View>
          ) : activeDrivers.length === 0 ? (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No active drivers found</Text>
            </View>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardsContainer}
            >
              {activeDrivers.map((driver) => (
                <TouchableOpacity 
                  key={driver.id} 
                  style={styles.cardContainer}
                  onPress={() => router.push({
                    pathname: '/dashboard/driver-statistics',
                    params: { id: driver.id, name: driver.name }
                  })}
                >
                  <LinearGradient
                    colors={getCardGradient()}
                    style={styles.cardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={[styles.cardContent, { justifyContent: 'flex-start', marginTop: 8 }]}>
                                            <Text style={styles.amountLabel}>Total Earnings</Text>
                      <Text style={styles.amount}>
                        AED {(driverEarnings[driver.id]?.totalEarnings || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
          </View>
                    <Text style={styles.driverName}>{driver.name}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Drivers List Section */}
        <View style={styles.driversListSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Drivers</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="filter-outline" size={18} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="search-outline" size={18} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#000" />
              <Text style={styles.loadingText}>Loading drivers...</Text>
                  </View>
          ) : activeDrivers.length === 0 ? (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No drivers found</Text>
            </View>
          ) : (
            <View style={styles.driversList}>
              {activeDrivers.slice(0, 5).map((driver) => (
                <TouchableOpacity 
                  key={driver.id}
                  style={styles.driverItem}
                  onPress={() => router.push({
                    pathname: '/dashboard/driver-statistics',
                    params: { id: driver.id, name: driver.name }
                  })}
                >
                  <View style={styles.driverAvatar}>
                    <Text style={styles.avatarText}>{driver.name.charAt(0).toUpperCase()}</Text>
                  </View>
              <View style={styles.driverInfo}>
                    <Text style={styles.listDriverName}>{driver.name}</Text>
                    <Text style={styles.driverEmail}>{driver.email}</Text>
                    <TouchableOpacity 
                      style={styles.accountsLink}
                      onPress={(e) => {
                        e.stopPropagation();
                        router.push({
                          pathname: '/dashboard/driver-accounts',
                          params: { id: driver.id, name: driver.name }
                        });
                      }}
                    >
                      <Text style={styles.accountsLinkText}>Accounts</Text>
                      <Ionicons name="wallet-outline" size={12} color="#000" />
                    </TouchableOpacity>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#888" />
                </TouchableOpacity>
              ))}
              
              {activeDrivers.length > 5 && (
                <TouchableOpacity 
                  style={styles.viewAllButton}
                  onPress={() => router.push('/dashboard/users')}
                >
                  <Text style={styles.viewAllText}>View All Drivers</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  viewAccountsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  viewAccountsButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
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
    marginRight: 15,
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
  // Sidebar styles
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 1,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SIDEBAR_WIDTH,
    height: '100%',
    backgroundColor: '#fff',
    zIndex: 2,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    bottom: 0,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sidebarUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sidebarAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sidebarUserDetails: {
    justifyContent: 'center',
  },
  sidebarUserName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sidebarUserRole: {
    fontSize: 12,
    color: '#666',
  },
  closeSidebar: {
    padding: 5,
  },
  sidebarContent: {
    flex: 1,
    paddingTop: 10,
  },
  sidebarMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 5,
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
    color: '#000',
    fontWeight: '500',
  },
  sidebarFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 'auto',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  logoutButtonText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  cardContainer: {
    width: Dimensions.get('window').width - 80,
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardGradient: {
    flex: 1,
    padding: 24,
  },
  cardContent: {
    flex: 1,
  },
  amountLabel: {
    color: '#ffffff80',
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  amount: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  adminLabel: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.7,
    marginTop: 5,
  },
  driverCardsSection: {
    marginBottom: 20,
    paddingHorizontal: 0,
  },
  loadingContainer: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  noDataContainer: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
  },
  driverName: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  driversListSection: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 10,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  driversList: {
  },
  driverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 15,
    marginBottom: 10,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  driverAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverInfo: {
    flex: 1,
  },
  listDriverName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  driverEmail: {
    color: '#666',
    fontSize: 12,
    marginBottom: 4,
  },
  accountsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  accountsLinkText: {
    fontSize: 10,
    color: '#000',
    marginRight: 4,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#000',
    borderRadius: 12,
    marginTop: 10,
  },
  viewAllText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginRight: 5,
  },
}); 