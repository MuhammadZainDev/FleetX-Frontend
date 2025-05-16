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
  Easing 
} from 'react-native';
import { router, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

const screenWidth = Dimensions.get('window').width - 40;
const SIDEBAR_WIDTH = 270;

export default function DriverDashboard() {
  const { logout, user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('Daily');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

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
      console.error('Logout error:', error);
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
  ];

  // Add function to navigate to routes
  const navigateToRoute = (route: string) => {
    router.replace(route as any); // Using type assertion since we're sure these are valid routes
    setSidebarOpen(false);
  };

  // Dashboard quick action buttons
  const quickActions = [
    { 
      icon: 'cash-outline' as React.ComponentProps<typeof Ionicons>['name'], 
      label: 'View Earnings', 
      onPress: () => router.push('/dashboard/earnings' as any),
      color: '#4CAF50'
    },
    {
      icon: 'wallet-outline' as React.ComponentProps<typeof Ionicons>['name'],
      label: 'Account Earnings',
      onPress: () => router.push('/dashboard/account-earnings' as any),
      color: '#2196F3'
    },
    { 
      icon: 'add-circle-outline' as React.ComponentProps<typeof Ionicons>['name'], 
      label: 'Add Earning', 
      onPress: () => router.push('/dashboard/add-earning' as any),
      color: '#FF9800'
    }
  ];

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
                (item.route === '/dashboard/earnings' && pathname === '/dashboard/earnings') ? 
                  styles.activeMenuItem : {}
              ]}
              onPress={() => navigateToRoute(item.route)}
            >
              <Ionicons 
                name={item.icon} 
                size={22} 
                color={
                  (item.route === '/dashboard/driver' && pathname === '/dashboard/driver') || 
                  (item.route === '/dashboard/earnings' && pathname === '/dashboard/earnings') ? 
                    "#000" : "#666"
                } 
              />
              <Text 
                style={[
                  styles.sidebarMenuItemText,
                  (item.route === '/dashboard/driver' && pathname === '/dashboard/driver') || 
                  (item.route === '/dashboard/earnings' && pathname === '/dashboard/earnings') ? 
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
          <Text style={styles.title}>Driver Dashboard</Text>
        </View>
        <TouchableOpacity style={styles.notificationIcon}>
          <Ionicons name="notifications" size={24} color="black" />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Current Status</Text>
            <View style={styles.activeIndicator}>
              <View style={styles.activeStatusDot} />
              <Text style={styles.activeStatusText}>On Duty</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.dutyToggleButton}>
            <Text style={styles.dutyToggleButtonText}>Go Off Duty</Text>
          </TouchableOpacity>
        </View>

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
          <Text style={styles.sectionTitle}>My Vehicle</Text>
          
          <View style={styles.vehicleCard}>
            <View style={styles.vehicleImageContainer}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80' }} 
                style={styles.vehicleImage} 
                resizeMode="cover"
              />
            </View>
            
            <View style={styles.vehicleDetails}>
              <Text style={styles.vehicleName}>Toyota Camry Hybrid</Text>
              <Text style={styles.vehiclePlate}>License: XYZ-1234</Text>
              
              <View style={styles.vehicleStats}>
                <View style={styles.vehicleStat}>
                  <Ionicons name="speedometer-outline" size={18} color="#666" />
                  <Text style={styles.vehicleStatText}>45,230 mi</Text>
                </View>
                
                <View style={styles.vehicleStat}>
                  <Ionicons name="water-outline" size={18} color="#666" />
                  <Text style={styles.vehicleStatText}>Full Tank</Text>
                </View>
                
                <View style={styles.vehicleStat}>
                  <Ionicons name="options-outline" size={18} color="#38b000" />
                  <Text style={styles.vehicleStatText}>Good Condition</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
        
        {/* Upcoming schedules */}
        <View style={styles.scheduleSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={14} color="#000000" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.scheduleList}>
            <View style={styles.scheduleItem}>
              <View style={styles.scheduleTime}>
                <Text style={styles.scheduleTimeText}>09:00 AM</Text>
                <View style={styles.scheduleStatusIndicator} />
              </View>
              
              <View style={styles.scheduleContent}>
                <Text style={styles.scheduleTitle}>Pickup at Downtown Station</Text>
                <View style={styles.scheduleLocation}>
                  <Ionicons name="location-outline" size={14} color="#666" />
                  <Text style={styles.scheduleLocationText}>123 Main Street</Text>
                </View>
                <View style={styles.scheduleActions}>
                  <TouchableOpacity style={styles.scheduleButton}>
                    <Text style={styles.scheduleButtonText}>Start</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.scheduleButton, styles.scheduleButtonOutline]}>
                    <Text style={[styles.scheduleButtonText, styles.scheduleButtonTextOutline]}>Navigate</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <View style={styles.scheduleItem}>
              <View style={styles.scheduleTime}>
                <Text style={styles.scheduleTimeText}>11:30 AM</Text>
                <View style={[styles.scheduleStatusIndicator, styles.schedulePending]} />
              </View>
              
              <View style={styles.scheduleContent}>
                <Text style={styles.scheduleTitle}>Airport Transfer</Text>
                <View style={styles.scheduleLocation}>
                  <Ionicons name="location-outline" size={14} color="#666" />
                  <Text style={styles.scheduleLocationText}>International Terminal</Text>
                </View>
                <View style={styles.scheduleActions}>
                  <TouchableOpacity style={[styles.scheduleButton, styles.scheduleButtonDisabled]}>
                    <Text style={[styles.scheduleButtonText, styles.scheduleButtonTextDisabled]}>Start</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.scheduleButton, styles.scheduleButtonOutline]}>
                    <Text style={[styles.scheduleButtonText, styles.scheduleButtonTextOutline]}>Navigate</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
        
        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity 
                key={index}
                style={[styles.quickActionButton, { backgroundColor: action.color }]}
                onPress={action.onPress}
              >
                <Ionicons name={action.icon} size={24} color="white" />
                <Text style={styles.quickActionText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
      </View>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#000000',
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
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  vehicleCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    overflow: 'hidden',
  },
  vehicleImageContainer: {
    width: '100%',
    height: 150,
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
  },
  vehicleDetails: {
    padding: 15,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  vehiclePlate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  vehicleStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  vehicleStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleStatText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  scheduleSection: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  scheduleList: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingVertical: 10,
  },
  scheduleItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  scheduleTime: {
    width: 70,
    alignItems: 'center',
  },
  scheduleTimeText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  scheduleStatusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#38b000',
  },
  schedulePending: {
    backgroundColor: '#ffd60a',
  },
  scheduleContent: {
    flex: 1,
    paddingLeft: 10,
  },
  scheduleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  scheduleLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  scheduleLocationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  scheduleActions: {
    flexDirection: 'row',
  },
  scheduleButton: {
    backgroundColor: '#000000',
    borderRadius: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  scheduleButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#000000',
  },
  scheduleButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  scheduleButtonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  scheduleButtonTextOutline: {
    color: '#000000',
  },
  scheduleButtonTextDisabled: {
    color: '#666',
  },
  quickActionsSection: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    width: '48%',
    marginBottom: 10,
    flexDirection: 'row',
  },
  quickActionText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
}); 