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
import { router, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { getEarningsSummary, getAllEarnings } from '@/services/earning.service';

const screenWidth = Dimensions.get('window').width - 40;
const SIDEBAR_WIDTH = 270;

// Define data types
type EarningType = {
  id: string;
  amount: number;
  note?: string;
  type: 'Online' | 'Cash' | 'PocketSlipt';
  driverId: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  driver?: {
    id: string;
    name: string;
    email: string;
  };
};

type EarningsSummary = {
  totalEarnings: number;
  percentChange: number;
  breakdown: {
    type: 'Online' | 'Cash' | 'PocketSlipt';
    totalAmount: number;
    count: number;
  }[];
  period: string;
  startDate: string;
  endDate: string;
};

export default function EarningsScreen() {
  const { logout, user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAllEarnings, setShowAllEarnings] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  // API data states
  const [isLoading, setIsLoading] = useState(true);
  const [earningsSummary, setEarningsSummary] = useState<EarningsSummary | null>(null);
  const [recentEarnings, setRecentEarnings] = useState<EarningType[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Role-based protection - only Driver can access this screen
  useEffect(() => {
    if (user && user.role !== 'Driver') {
      // Redirect non-driver users to their respective dashboards
      if (user.role === 'Admin') {
        router.replace('/dashboard/admin');
      } else if (user.role === 'Viewer') {
        router.replace('/dashboard/viewer');
      }
    }
  }, [user, router]);

  // Fetch earnings data
  useEffect(() => {
    const fetchEarningsData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch earnings summary based on selected period
        const summary = await getEarningsSummary(user.id, selectedPeriod);
        setEarningsSummary(summary);
        
        // Fetch actual earnings data for both Admin and Driver roles
        const filters = {
          driverId: user.id,
        };
        const earnings = await getAllEarnings(filters);
        setRecentEarnings(earnings);
      } catch (err) {
        console.error('Error fetching earnings data:', err);
        setError('Failed to load earnings data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEarningsData();
  }, [user, selectedPeriod]);

  // Animation value for sidebar
  const sidebarAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  
  // Prepare earnings data for chart
  const getChartData = () => {
    if (!earningsSummary) {
      // Default data if no earnings summary is available
      return {
        data: [0, 0, 0, 0, 0, 0, 0],
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      };
    }
    
    // For weekly data, we'll use the breakdown from the API
    if (selectedPeriod === 'weekly') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dayMap = new Map();
      
      // Initialize with zeros for all days
      days.forEach((day, index) => {
        dayMap.set(day, 0);
      });
      
      // TODO: This is placeholder as the API doesn't currently return day-by-day data
      // In a real implementation, we would map actual data from the API
      
      return {
        data: Array.from(dayMap.values()),
        labels: days
      };
    }
    
    // For now, return the breakdown by payment type instead
    const data = earningsSummary.breakdown.map(item => parseFloat(item.totalAmount as any));
    const labels = earningsSummary.breakdown.map(item => item.type);
    
    return { data, labels };
  };
  
  // Get chart data
  const { data, labels } = getChartData();
  const maxValue = Math.max(...data, 1); // Ensure at least 1 to avoid division by zero
  
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

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period.toLowerCase());
  };

  // Simplified sidebar menu items
  type MenuItemType = {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    route: string;
  };

  const menuItems: MenuItemType[] = [
    { icon: 'home-outline', label: 'Dashboard', route: '/dashboard/driver' },
    { icon: 'cash-outline', label: 'Earnings', route: '/dashboard/earnings' },
    { icon: 'list-outline', label: 'All Earnings', route: '/dashboard/all-earnings' },
  ];

  const navigateToRoute = (route: string) => {
    router.replace(route as any); // Using type assertion since we're sure these are valid routes
    setSidebarOpen(false);
  };

  // Format currency
  const formatCurrency = (amount: number | string) => {
    return `$${parseFloat(amount.toString()).toFixed(2)}`;
  };
  
  // Format date 
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if date is today
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    }
    
    // Check if date is yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    }
    
    // Otherwise return formatted date
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        <View style={styles.sidebarHeader}>
          <View style={styles.sidebarUserInfo}>
            <View style={styles.sidebarAvatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'D'}</Text>
            </View>
            <View style={styles.sidebarUserDetails}>
              <Text style={styles.sidebarUserName}>{user?.name || 'Driver Name'}</Text>
              <Text style={styles.sidebarUserRole}>{user?.role || 'Driver'}</Text>
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
                (item.route === '/dashboard/driver' && pathname === '/dashboard/driver') || 
                (item.route === '/dashboard/earnings' && pathname === '/dashboard/earnings') ||
                (item.route === '/dashboard/all-earnings' && pathname === '/dashboard/all-earnings') ? 
                  styles.activeMenuItem : {}
              ]}
              onPress={() => navigateToRoute(item.route)}
            >
              <Ionicons 
                name={item.icon} 
                size={22} 
                color={
                  (item.route === '/dashboard/driver' && pathname === '/dashboard/driver') || 
                  (item.route === '/dashboard/earnings' && pathname === '/dashboard/earnings') ||
                  (item.route === '/dashboard/all-earnings' && pathname === '/dashboard/all-earnings') ? 
                    "#000" : "#666"
                } 
              />
              <Text 
                style={[
                  styles.sidebarMenuItemText,
                  (item.route === '/dashboard/driver' && pathname === '/dashboard/driver') || 
                  (item.route === '/dashboard/earnings' && pathname === '/dashboard/earnings') ||
                  (item.route === '/dashboard/all-earnings' && pathname === '/dashboard/all-earnings') ? 
                    styles.activeMenuItemText : {}
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
      </Animated.View>
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={toggleSidebar}
          >
            <Ionicons name="menu-outline" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.title}>Earnings</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/dashboard/add-earning' as any)}
          >
            <Ionicons name="add-circle-outline" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationIcon}>
            <Ionicons name="notifications" size={24} color="black" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading earnings data...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => setSelectedPeriod(selectedPeriod)} // Trigger re-fetch
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Horizontally scrollable payment method cards */}
          <View style={styles.paymentMethodsSection}>
            <Text style={styles.sectionTitle}>Payment Methods</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.paymentMethodsContainer}
            >
              {earningsSummary && earningsSummary.breakdown.length > 0 ? (
                earningsSummary.breakdown.map((item, index) => (
                  <View key={index} style={styles.paymentMethodCard}>
                    <View style={styles.paymentMethodHeader}>
                      <Ionicons 
                        name={
                          item.type === 'Online' ? 'card-outline' :
                          item.type === 'Cash' ? 'cash-outline' : 'wallet-outline'
                        } 
                        size={22} 
                        color="#000" 
                      />
                      <Text style={styles.paymentMethodTypeText}>{item.type}</Text>
                    </View>
                    <Text style={styles.paymentMethodCount}>
                      {item.count} {item.count === 1 ? 'Trip' : 'Trips'}
                    </Text>
                    <Text style={styles.paymentMethodAmount}>
                      {formatCurrency(item.totalAmount)}
                    </Text>
                  </View>
                ))
              ) : (
                ['Online', 'Cash', 'PocketSlipt'].map((type, index) => (
                  <View key={index} style={styles.paymentMethodCard}>
                    <View style={styles.paymentMethodHeader}>
                      <Ionicons 
                        name={
                          type === 'Online' ? 'card-outline' :
                          type === 'Cash' ? 'cash-outline' : 'wallet-outline'
                        } 
                        size={22} 
                        color="#000" 
                      />
                      <Text style={styles.paymentMethodTypeText}>{type}</Text>
                    </View>
                    <Text style={styles.paymentMethodCount}>0 Trips</Text>
                    <Text style={styles.paymentMethodAmount}>$0.00</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
          
          {/* Earnings details */}
          <View style={styles.earningsDetails}>
            <Text style={styles.sectionTitle}>Recent Payments</Text>
            
            {recentEarnings.length > 0 ? (
              <View style={styles.paymentsList}>
                {recentEarnings.slice(0, 5).map((earning, index) => (
                  <View key={earning.id} style={styles.paymentItem}>
                    <View style={styles.paymentIconContainer}>
                      <Ionicons 
                        name={
                          earning.type === 'Online' ? 'card-outline' :
                          earning.type === 'Cash' ? 'cash-outline' : 'wallet-outline'
                        } 
                        size={22} 
                        color="#000" 
                      />
                    </View>
                    <View style={styles.paymentInfo}>
                      <Text style={styles.paymentTitle}>
                        {earning.type} Payment
                      </Text>
                      <Text style={styles.paymentDate}>{formatDate(earning.date)}</Text>
                    </View>
                    <Text style={styles.paymentAmount}>{formatCurrency(earning.amount)}</Text>
                  </View>
                ))}
                
                <TouchableOpacity 
                  style={styles.showMoreButton}
                  onPress={() => router.push('/dashboard/all-earnings' as any)}
                >
                  <Text style={styles.showMoreButtonText}>View All Earnings</Text>
                  <Ionicons name="chevron-forward" size={16} color="#000" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="cash-outline" size={48} color="#ccc" />
                <Text style={styles.emptyStateText}>No recent payments</Text>
                <TouchableOpacity 
                  style={[styles.showMoreButton, {marginTop: 15}]}
                  onPress={() => router.push('/dashboard/all-earnings' as any)}
                >
                  <Text style={styles.showMoreButtonText}>View All Earnings</Text>
                  <Ionicons name="chevron-forward" size={16} color="#000" />
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {/* Download options - moved to bottom */}
          <View style={styles.downloadSection}>
            <Text style={styles.sectionTitle}>Statements</Text>
            
            <TouchableOpacity style={styles.downloadButton}>
              <Ionicons name="download-outline" size={20} color="#fff" />
              <Text style={styles.downloadButtonText}>Download Monthly Statement</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.downloadButton, styles.secondaryButton]}
              onPress={() => router.push('/dashboard/add-earning' as any)}
            >
              <Ionicons name="add-circle-outline" size={20} color="#000" />
              <Text style={[styles.downloadButtonText, styles.secondaryButtonText]}>Add New Earning</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#000',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
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
  headerRight: {
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
  addButton: {
    marginRight: 15,
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
    backgroundColor: '#000000',
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
  paymentMethodsSection: {
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  paymentMethodsContainer: {
    paddingRight: 20,
  },
  paymentMethodCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    width: 180,
    marginRight: 12,
    flexDirection: 'column',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentMethodTypeText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
    color: '#333',
  },
  paymentMethodCount: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  paymentMethodAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  paymentIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 11,
    color: '#666',
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  emptyStateContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  downloadSection: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  downloadButton: {
    backgroundColor: '#000',
    borderRadius: 10,
    paddingVertical: 15,
    marginBottom: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#000',
  },
  earningsDetails: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  paymentsList: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0,
    borderBottomColor: '#eee',
  },
  onlinePayment: {
    // Remove background
  },
  cashPayment: {
    // Remove background
  },
  pocketPayment: {
    // Remove background
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    margin: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
  },
  showMoreButtonText: {
    color: '#000',
    fontWeight: '500',
    marginRight: 5,
    fontSize: 14,
  },
}); 