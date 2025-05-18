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
  ImageBackground,
  Platform,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { router, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { getEarningsSummary } from '@/services/earning.service';
import { getExpensesSummary, getAllExpenses } from '@/services/expense.service';
import { getProfile } from '@/services/auth.service';
import { getDriverVehicles } from '@/services/vehicle.service';
import { getAllEarnings } from '@/services/earning.service';

const screenWidth = Dimensions.get('window').width - 40;
const screenHeight = Dimensions.get('window').height;
const SIDEBAR_WIDTH = 270;
const { width } = Dimensions.get('window');

// Define Vehicle type
type Vehicle = {
  id: string;
  name: string;
  plate: string;
  status: string;
  type: string;
  color: string;
  location: string;
  model: string;
  ownership: string;
  image: string;
};

// Define VehicleResponse type
type VehicleResponse = {
  message: string;
  count: number;
  vehicles: Vehicle[];
};

// Define Earning type
type Earning = {
  id: string;
  amount: number;
  description: string;
  date: string;
  driverId: string;
  vehicleId?: string;
  type?: string;
  category?: string;
};

// Define Expense type
type Expense = {
  id: string;
  amount: number;
  description: string;
  date: string;
  driverId: string;
  vehicleId?: string;
  category?: string;
};

export default function DriverDashboard() {
  const { logout, user, refreshUser, authToken } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('Daily');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState('All');
  const [showTransactionFilterDropdown, setShowTransactionFilterDropdown] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(user);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [todayEarnings, setTodayEarnings] = useState<Earning[]>([]);
  const [todayExpenses, setTodayExpenses] = useState<Expense[]>([]);
  const [todayTransactionsLoading, setTodayTransactionsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(Date.now());

  // Refresh user data when component loads
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Only refresh if we have an authenticated user
        if (user && user.id) {
          await refreshUser();
          console.log("User data refreshed:", user?.name);
          
          // Also try to get profile data directly
          try {
            const profileData = await getProfile();
            if (profileData && profileData.user) {
              setUserData(profileData.user);
              console.log("Profile data loaded:", profileData.user.name);
            }
          } catch (profileError) {
            console.error("Error fetching profile:", profileError);
          }
        } else {
          console.log("No user found to refresh");
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    };
    
    loadUserData();
  }, [user?.id]);

  // Role-based protection - only Driver can access this dashboard
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

  // Fetch driver's earnings and expenses
  useEffect(() => {
    const fetchDriverData = async () => {
      try {
        setIsLoading(true);
        const [earningSummary, expenseSummary] = await Promise.all([
          getEarningsSummary(user?.id, selectedPeriod),
          getExpensesSummary(user?.id, selectedPeriod)
        ]);
        
        setTotalEarnings(earningSummary.totalEarnings || 0);
        setTotalExpenses(expenseSummary.totalExpenses || 0);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchDriverData();
    }
  }, [user, selectedPeriod]);

  // Fetch driver's vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setVehiclesLoading(true);
        if (!user?.id || !authToken) return;
        
        const response = await getDriverVehicles(user.id, authToken);
        if (response && response.vehicles) {
          setVehicles(response.vehicles);
        }
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      } finally {
        setVehiclesLoading(false);
      }
    };

    fetchVehicles();
  }, [user?.id, authToken]);

  // Function to refresh today's transactions data
  const refreshTodayTransactions = () => {
    setLastRefreshed(Date.now());
  };

  // Make refreshTodayTransactions globally available for other components
  useEffect(() => {
    if (global) {
      (global as any).refreshDriverDashboard = refreshTodayTransactions;
    }
    return () => {
      if (global) {
        (global as any).refreshDriverDashboard = undefined;
      }
    };
  }, []);

  // Fetch today's transactions (earnings and expenses)
  useEffect(() => {
    const fetchTodayTransactions = async () => {
      try {
        setTodayTransactionsLoading(true);
        if (!user?.id || !authToken) return;
        
        // Get today's date in YYYY-MM-DD format
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of today
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Format with timezone adjustment to avoid off-by-one errors
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        
        const todayDate = `${year}-${month}-${day}`;
        const tomorrowDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
        
        console.log('Today date for filtering:', todayDate, 'Today timestamp:', today.getTime());
        console.log('Tomorrow date for filtering:', tomorrowDate);
        
        // Fetch earnings and expenses for today - we'll try with and without date filters
        console.log('Fetching earnings without date filters to check returned format');
        const allEarningsResponse = await getAllEarnings({ driverId: user.id });
        console.log('All earnings response:', allEarningsResponse);
        
        // Now fetch with date filters
        console.log('Fetching earnings with date filters');
        const [earningsResponse, expensesResponse] = await Promise.all([
          getAllEarnings({ 
            driverId: user.id,
            startDate: todayDate,
            endDate: tomorrowDate
          }),
          getAllExpenses({
            driverId: user.id,
            startDate: todayDate,
            endDate: tomorrowDate
          })
        ]);
        
        console.log('Earnings response structure:', earningsResponse);
        
        // Handle earnings - check if it's an array or has an 'earnings' property
        let allEarnings = Array.isArray(earningsResponse) 
          ? earningsResponse 
          : (earningsResponse && earningsResponse.earnings 
              ? earningsResponse.earnings 
              : []);
        
        console.log('All earnings for processing:', allEarnings.length);
        
        // Filter earnings for today's date - more flexible date checking
        const todaysEarnings = allEarnings.filter((earning: Earning) => {
          if (!earning.date) return false;
          
          // Check if date matches today (accounting for different date formats)
          const earningDate = new Date(earning.date);
          
          // For better date comparison, use the date string parts to avoid timezone issues
          const earningYear = earningDate.getFullYear();
          const earningMonth = earningDate.getMonth() + 1;
          const earningDay = earningDate.getDate();
          
          // Compare date components directly
          const isSameDay = 
            earningYear === year && 
            earningMonth === parseInt(month) && 
            earningDay === parseInt(day);
          
          console.log('Earning date check:', earning.id, earning.date, 
                      'Year:', earningYear, 'Month:', earningMonth, 'Day:', earningDay,
                      'Is today:', isSameDay);
          
          return isSameDay;
        });
        
        console.log('Today\'s earnings:', todaysEarnings.length);
        setTodayEarnings(todaysEarnings);
        
        console.log('Expenses response structure:', expensesResponse);
        
        // Handle expenses - check if it's an array or has an 'expenses' property
        let allExpenses = Array.isArray(expensesResponse) 
          ? expensesResponse 
          : (expensesResponse && expensesResponse.expenses 
              ? expensesResponse.expenses 
              : []);
        
        console.log('All expenses for processing:', allExpenses.length);
        
        // Filter expenses for today's date - more flexible date checking
        const todaysExpenses = allExpenses.filter((expense: Expense) => {
          if (!expense.date) return false;
          
          // Check if date matches today (accounting for different date formats)
          const expenseDate = new Date(expense.date);
          
          // For better date comparison, use the date string parts to avoid timezone issues
          const expenseYear = expenseDate.getFullYear();
          const expenseMonth = expenseDate.getMonth() + 1;
          const expenseDay = expenseDate.getDate();
          
          // Compare date components directly
          const isSameDay = 
            expenseYear === year && 
            expenseMonth === parseInt(month) && 
            expenseDay === parseInt(day);
          
          console.log('Expense date check:', expense.id, expense.date, 
                     'Year:', expenseYear, 'Month:', expenseMonth, 'Day:', expenseDay,
                     'Is today:', isSameDay);
          
          return isSameDay;
        });
        
        console.log('Today\'s expenses:', todaysExpenses.length);
        setTodayExpenses(todaysExpenses);
      } catch (error) {
        console.error('Error fetching today\'s transactions:', error);
      } finally {
        setTodayTransactionsLoading(false);
      }
    };

    fetchTodayTransactions();
  }, [user?.id, authToken, lastRefreshed]);

  // Animation value for sidebar
  const sidebarAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  
  // Trip data points
  const data = [3, 5, 2, 4, 3, 6, 4];
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
      console.error('Error logging out:', error);
    }
  };

  // Sidebar menu items for Driver - simplified
  type MenuItemType = {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    route: string;
  };

  const menuItems: MenuItemType[] = [
    { icon: 'home-outline', label: 'Dashboard', route: '/dashboard/driver' },
    { icon: 'cash-outline', label: 'Earnings', route: '/dashboard/earnings' },
    { icon: 'list-outline', label: 'All Earnings', route: '/dashboard/all-earnings' },
    { icon: 'wallet-outline', label: 'Account Earnings', route: '/dashboard/account-earnings' },
    { icon: 'receipt-outline', label: 'Expenses', route: '/dashboard/all-expenses' },
    { icon: 'add-circle-outline', label: 'Add Expense', route: '/dashboard/add-expense' },
  ];

  // Add function to navigate to routes
  const navigateToRoute = (route: string) => {
    router.replace(route as any); // Using type assertion since we're sure these are valid routes
    setSidebarOpen(false);
  };

  // Format transaction date more naturally
  const formatTransactionDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Set both dates to midnight for proper comparison
    const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const compareToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const compareYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    
    // Format time
    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Check if date is today
    if (compareDate.getTime() === compareToday.getTime()) {
      return `Today, ${timeString}`;
    }
    
    // Check if date is yesterday
    if (compareDate.getTime() === compareYesterday.getTime()) {
      return `Yesterday, ${timeString}`;
    }
    
    // Check if date is in current year
    if (date.getFullYear() === today.getFullYear()) {
      return `${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date)}, ${timeString}`;
    }
    
    // Return full date for older dates
    return `${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)}, ${timeString}`;
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
                <Text style={styles.avatarText}>{userData?.name?.charAt(0)}</Text>
              </View>
              <View style={styles.sidebarUserDetails}>
                <Text style={styles.sidebarUserName}>{userData?.name}</Text>
                <Text style={styles.sidebarUserRole}>{userData?.role}</Text>
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
                  pathname === item.route ? styles.activeMenuItem : {}
                ]}
                onPress={() => navigateToRoute(item.route)}
              >
                <Ionicons 
                  name={item.icon} 
                  size={22} 
                  color={pathname === item.route ? "#000" : "#666"} 
                />
                <Text 
                  style={[
                    styles.sidebarMenuItemText,
                    pathname === item.route ? styles.activeMenuItemText : {}
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
          <Text style={styles.title}>Driver Dashboard</Text>
        </View>
        <TouchableOpacity 
          style={styles.notificationIcon}
          onPress={() => {
            console.log('Navigating to settings page');
            router.replace('/settings');
          }}
        >
          <Ionicons name="settings-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Background Gradient */}
        <LinearGradient
          colors={['#f8f9fa', '#e9ecef']}
          style={styles.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Horizontal Cards */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsContainer}
        >
          {/* Earnings Card */}
          <View style={styles.cardContainer}>
            <LinearGradient
              colors={['#1a1a1a', '#000000']}
              style={styles.cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Image 
                source={require('@/assets/logo/lightLogo.png')}
                style={styles.cardLogo}
                resizeMode="contain"
              />
              
              <View style={styles.cardContent}>
                <Text style={styles.amountLabel}>Total Earnings</Text>
                {isLoading ? (
                  <Text style={styles.amount}>Loading...</Text>
                ) : (
                  <Text style={styles.amount}>AED {totalEarnings.toFixed(2)}</Text>
                )}
              </View>

              <Text style={styles.driverName}>{userData?.name || user?.name || 'Loading...'}</Text>
            </LinearGradient>
          </View>

          {/* Expenses Card */}
          <View style={styles.cardContainer}>
            <LinearGradient
              colors={['#1a1a1a', '#000000']}
              style={styles.cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Image 
                source={require('@/assets/logo/lightLogo.png')}
                style={styles.cardLogo}
                resizeMode="contain"
              />
              
              <View style={styles.cardContent}>
                <Text style={styles.amountLabel}>Total Expenses</Text>
                {isLoading ? (
                  <Text style={styles.amount}>Loading...</Text>
                ) : (
                  <Text style={styles.amount}>AED {totalExpenses.toFixed(2)}</Text>
                )}
              </View>

              <Text style={styles.driverName}>{userData?.name || user?.name || 'Loading...'}</Text>
            </LinearGradient>
          </View>
        </ScrollView>

        <View style={styles.statsRow}>
          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>Today's Earnings</Text>
            <Text style={styles.statsValue}>$185.50</Text>
            <Text style={styles.percentChange}>+8.2% from yesterday</Text>
          </View>

          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>Trips Today</Text>
            <Text style={styles.statsValue}>8</Text>
            <Text style={styles.percentChange}>+2 from yesterday</Text>
          </View>
        </View>
        
        <View style={styles.graphSection}>
          <Text style={styles.sectionTitle}>Trip Performance</Text>
          
          <View style={styles.periodToggle}>
            <TouchableOpacity 
              style={[styles.periodButton, selectedPeriod === 'Daily' && styles.activePeriodButton]}
              onPress={() => setSelectedPeriod('Daily')}
            >
              <Text style={[styles.periodButtonText, selectedPeriod === 'Daily' && styles.activePeriodButtonText]}>Daily</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.periodButton, selectedPeriod === 'Weekly' && styles.activePeriodButton]}
              onPress={() => setSelectedPeriod('Weekly')}
            >
              <Text style={[styles.periodButtonText, selectedPeriod === 'Weekly' && styles.activePeriodButtonText]}>Weekly</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.periodButton, selectedPeriod === 'Monthly' && styles.activePeriodButton]}
              onPress={() => setSelectedPeriod('Monthly')}
            >
              <Text style={[styles.periodButtonText, selectedPeriod === 'Monthly' && styles.activePeriodButtonText]}>Monthly</Text>
            </TouchableOpacity>
          </View>
          
          {/* Custom chart implementation */}
          <View style={styles.chartContainer}>
            <View style={styles.chart}>
              {data.map((value, index) => {
                const height = (value / maxValue) * 180;
                return (
                  <View key={index} style={styles.barContainer}>
                    <View style={[styles.bar, { height }]} />
                    <Text style={styles.barLabel}>{days[index]}</Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.yAxis}>
              <Text style={styles.yAxisLabel}>10</Text>
              <Text style={styles.yAxisLabel}>8</Text>
              <Text style={styles.yAxisLabel}>6</Text>
              <Text style={styles.yAxisLabel}>4</Text>
              <Text style={styles.yAxisLabel}>2</Text>
              <Text style={styles.yAxisLabel}>0</Text>
            </View>
          </View>
        </View>

        {/* Vehicle information */}
        <View style={styles.vehicleSection}>
          <Text style={styles.sectionTitle}>My Vehicles</Text>
          
          {vehiclesLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#000" />
              <Text style={styles.loadingText}>Loading vehicles...</Text>
            </View>
          ) : vehicles && vehicles.length > 0 ? (
            vehicles.map((vehicle) => (
              <View key={vehicle.id} style={styles.vehicleCard}>
                <View style={styles.vehicleImageContainer}>
                  <Image 
                    source={{ uri: vehicle.image || 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1470&q=80' }} 
                    style={styles.vehicleImage} 
                    resizeMode="cover"
                  />
                </View>
                
                <View style={styles.vehicleDetails}>
                  <Text style={styles.vehicleName}>{vehicle.name}</Text>
                  <Text style={styles.vehiclePlate}>License: {vehicle.plate}</Text>
                  
                  <View style={styles.vehicleStats}>
                    <View style={styles.vehicleStat}>
                      <Ionicons name="car-outline" size={18} color="#000" />
                      <Text style={styles.vehicleStatText}>{vehicle.type || 'N/A'}</Text>
                    </View>
                    
                    <View style={styles.vehicleStat}>
                      <Ionicons name="color-palette-outline" size={18} color="#000" />
                      <Text style={styles.vehicleStatText}>{vehicle.color || 'N/A'}</Text>
                    </View>
                    
                    <View style={styles.vehicleStat}>
                      <Ionicons name={
                        vehicle.status === 'active' ? "checkmark-circle-outline" :
                        vehicle.status === 'maintenance' ? "construct-outline" : "alert-circle-outline"
                      } size={18} color={
                        vehicle.status === 'active' ? "#4CAF50" :
                        vehicle.status === 'maintenance' ? "#FF9800" : "#F44336"
                      } />
                      <Text style={[styles.vehicleStatText, {
                        color: vehicle.status === 'active' ? "#4CAF50" :
                               vehicle.status === 'maintenance' ? "#FF9800" : "#F44336"
                      }]}>
                        {vehicle.status === 'active' ? 'Active' :
                         vehicle.status === 'maintenance' ? 'Maintenance' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                  
                  {vehicle.location && (
                    <View style={styles.vehicleDetailRow}>
                      <Ionicons name="location-outline" size={18} color="#000" />
                      <Text style={styles.vehicleDetailText}>Location: {vehicle.location}</Text>
                    </View>
                  )}
                  
                  {vehicle.model && (
                    <View style={styles.vehicleDetailRow}>
                      <Ionicons name="calendar-outline" size={18} color="#000" />
                      <Text style={styles.vehicleDetailText}>Model: {vehicle.model}</Text>
                    </View>
                  )}
                  
                  {vehicle.ownership && (
                    <View style={styles.vehicleDetailRow}>
                      <Ionicons name="business-outline" size={18} color="#000" />
                      <Text style={styles.vehicleDetailText}>Ownership: {vehicle.ownership}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noVehiclesContainer}>
              <Ionicons name="car-outline" size={60} color="#ccc" />
              <Text style={styles.noVehiclesText}>No vehicles assigned</Text>
            </View>
          )}
        </View>
        
        {/* Today's Transactions */}
        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Transactions</Text>
            <View style={styles.transactionFilterContainer}>
              <TouchableOpacity 
                style={styles.filterButton}
                onPress={() => setShowTransactionFilterDropdown(!showTransactionFilterDropdown)}
              >
                <Text style={styles.filterText}>{transactionFilter}</Text>
                <Ionicons name="chevron-down" size={14} color="#000" />
              </TouchableOpacity>
              
              {/* Filter Dropdown */}
              {showTransactionFilterDropdown && (
                <View style={styles.filterDropdown}>
                  <TouchableOpacity 
                    style={styles.filterOption}
                    onPress={() => {
                      setTransactionFilter('All');
                      setShowTransactionFilterDropdown(false);
                    }}
                  >
                    <Text style={[styles.filterOptionText, transactionFilter === 'All' && styles.activeFilterText]}>
                      All
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.filterOption}
                    onPress={() => {
                      setTransactionFilter('Earnings');
                      setShowTransactionFilterDropdown(false);
                    }}
                  >
                    <Text style={[styles.filterOptionText, transactionFilter === 'Earnings' && styles.activeFilterText]}>
                      Earnings
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.filterOption}
                    onPress={() => {
                      setTransactionFilter('Expenses');
                      setShowTransactionFilterDropdown(false);
                    }}
                  >
                    <Text style={[styles.filterOptionText, transactionFilter === 'Expenses' && styles.activeFilterText]}>
                      Expenses
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
          
          {todayTransactionsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#000" />
              <Text style={styles.loadingText}>Loading transactions...</Text>
            </View>
          ) : (
            <View style={styles.transactionsContainer}>
              {/* Combined Transactions */}
              <View style={styles.transactionSection}>
                {todayEarnings.length > 0 || todayExpenses.length > 0 ? (
                  <>
                    {/* Earnings */}
                    {(transactionFilter === 'All' || transactionFilter === 'Earnings') && 
                      todayEarnings.map((earning, index) => (
                        <React.Fragment key={`earning-${earning.id || index}`}>
                          <View style={styles.transactionItem}>
                            <View style={styles.transactionLeft}>
                              <View style={styles.transactionIconContainer}>
                                <Ionicons name="card-outline" size={20} color="#333" />
                              </View>
                              <View style={styles.transactionDetails}>
                                <Text style={styles.transactionTitle}>
                                  {earning.type === 'Online' ? 'Online Payment' : 
                                   earning.type === 'Cash' ? 'Cash Payment' : 
                                   earning.type === 'Pocket Slipt' ? 'Pocket Slipt' : 'Earning'}
                                </Text>
                                <Text style={styles.transactionSubtitle}>
                                  {formatTransactionDate(earning.date)}
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.transactionAmount}>
                              AED {typeof earning.amount === 'string' ? parseFloat(earning.amount).toFixed(2) : Number(earning.amount).toFixed(2)}
                            </Text>
                          </View>
                          {/* Add divider if not the last item */}
                          {(index < todayEarnings.length - 1 || 
                             (transactionFilter === 'All' && todayExpenses.length > 0)) && 
                              <View style={styles.divider} />}
                        </React.Fragment>
                    ))}
                  
                    {/* Expenses */}
                    {(transactionFilter === 'All' || transactionFilter === 'Expenses') && 
                      todayExpenses.map((expense, index) => (
                        <React.Fragment key={`expense-${expense.id || index}`}>
                          <View style={styles.transactionItem}>
                            <View style={styles.transactionLeft}>
                              <View style={[styles.transactionIconContainer, styles.expenseIconContainer]}>
                                <Ionicons name="receipt-outline" size={20} color="#333" />
                              </View>
                              <View style={styles.transactionDetails}>
                                <Text style={styles.transactionTitle}>
                                  {expense.category || 'Expense'}
                                </Text>
                                <Text style={styles.transactionSubtitle}>
                                  {formatTransactionDate(expense.date)}
                                </Text>
                              </View>
                            </View>
                            <Text style={[styles.transactionAmount, styles.expenseAmount]}>
                              -AED {typeof expense.amount === 'string' ? parseFloat(expense.amount).toFixed(2) : Number(expense.amount).toFixed(2)}
                            </Text>
                          </View>
                          {/* Add divider if not the last item */}
                          {index < todayExpenses.length - 1 && <View style={styles.divider} />}
                        </React.Fragment>
                    ))}
                  </>
                ) : (
                  <Text style={styles.noTransactionsText}>No transactions today</Text>
                )}
              </View>
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
    height: screenHeight,
    backgroundColor: '#fff',
    zIndex: 2,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
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
    paddingBottom: 20,
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
  statusCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#38b000',
    marginRight: 6,
  },
  activeStatusText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
  dutyToggleButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dutyToggleButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  statsCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    width: '48%',
  },
  statsLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  percentChange: {
    fontSize: 12,
    color: 'green',
    marginTop: 5,
  },
  graphSection: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#3498db',
    marginRight: 4,
  },
  periodToggle: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  periodButton: {
    paddingVertical: 5,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  activePeriodButton: {
    backgroundColor: '#000000',
    borderRadius: 15,
  },
  periodButtonText: {
    fontSize: 12,
    color: '#666',
  },
  activePeriodButtonText: {
    color: '#fff',
  },
  chartContainer: {
    flexDirection: 'row',
    height: 220,
    marginVertical: 10,
    paddingRight: 10,
  },
  yAxis: {
    width: 35,
    height: '100%',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: 10,
  },
  yAxisLabel: {
    fontSize: 10,
    color: '#666',
  },
  chart: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingLeft: 5,
    height: '100%',
  },
  barContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: (screenWidth - 35) / 7 - 5,
  },
  bar: {
    width: 8,
    backgroundColor: '#000000',
    borderRadius: 5,
  },
  barLabel: {
    fontSize: 10,
    marginTop: 5,
    color: '#666',
  },
  vehicleSection: {
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  vehicleCard: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingBottom: 12,
  },
  vehicleImageContainer: {
    width: '100%',
    height: 160,
    overflow: 'hidden',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
  },
  vehicleDetails: {
    padding: 16,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  vehiclePlate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  vehicleStats: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  vehicleStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginRight: 16,
  },
  vehicleStatText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 5,
  },
  vehicleDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  vehicleDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  transactionsSection: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  transactionsContainer: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  transactionSection: {
    padding: 12,
    marginBottom: 5,
    backgroundColor: 'transparent',
  },
  transactionSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e6e6e6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseIconContainer: {
    backgroundColor: '#ffe6e6',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  transactionSubtitle: {
    fontSize: 13,
    color: '#777',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  expenseAmount: {
    color: '#F44336',
  },
  noTransactionsText: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    paddingVertical: 10,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundGradient: {
    display: 'none', // Hide the gradient background
  },
  cardsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  cardContainer: {
    width: width - 80, // Reduced width to show next card
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 16, // Space between cards
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  cardGradient: {
    flex: 1,
    padding: 24,
  },
  cardLogo: {
    width: 60,
    height: 40,
    tintColor: '#ffffff',
    opacity: 0.8,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
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
  driverName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  loadingContainer: {
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  noVehiclesContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  noVehiclesText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  transactionFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  filterText: {
    fontSize: 14,
    color: '#000',
    marginRight: 4,
  },
  filterDropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    zIndex: 3,
  },
  filterOption: {
    padding: 8,
    marginBottom: 5,
  },
  filterOptionText: {
    fontSize: 14,
    color: '#000',
  },
  activeFilterText: {
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
}); 