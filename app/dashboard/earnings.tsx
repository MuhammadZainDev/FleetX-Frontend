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
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import { router, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getEarningsSummary, getAllEarnings, deleteEarning } from '@/services/earning.service';
import { generateEarningsPDF } from '@/services/pdf.service';

const { width } = Dimensions.get('window');

// Define data types
type EarningType = {
  id: string;
  amount: number;
  note?: string;
  type: 'Online' | 'Cash' | 'Pocket Slipt';
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
    type: 'Online' | 'Cash' | 'Pocket Slipt';
    totalAmount: number;
    count: number;
  }[];
  period: string;
  startDate: string;
  endDate: string;
};

export default function EarningsScreen() {
  const { logout, user } = useAuth();
  const toast = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');
  const router = useRouter();
  const pathname = usePathname();
  
  // API data states
  const [isLoading, setIsLoading] = useState(true);
  const [earningsSummary, setEarningsSummary] = useState<EarningsSummary | null>(null);
  const [recentEarnings, setRecentEarnings] = useState<EarningType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEarning, setSelectedEarning] = useState<EarningType | null>(null);
  const [isDeletingEarning, setIsDeletingEarning] = useState(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clickCountRef = useRef(0);

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

  // Initial fetch
  useEffect(() => {
    fetchEarningsData();
  }, [user, selectedPeriod]);

  // Format amount to display with currency
  const formatAmount = (amount: number) => {
    return `AED ${parseFloat(amount.toString()).toFixed(2)}`;
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
  
  // Fetch earnings data function
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

  // Handle PDF download
  const handleDownloadStatement = async () => {
    try {
      setIsDownloading(true);
      
      if (!user) {
        toast.showToast('error', 'Error', 'User data is not available');
        return;
      }
      
      // Fetch all earnings if we need more than what's already loaded
      const fetchAllData = async () => {
        try {
          const filters = { driverId: user.id };
          const allEarnings = await getAllEarnings(filters);
          return allEarnings;
        } catch (error) {
          console.error('Error fetching all earnings:', error);
          throw error;
        }
      };
      
      // Use recentEarnings if they exist, otherwise fetch all
      const earningsData = recentEarnings.length > 0 ? 
        recentEarnings : 
        await fetchAllData();
      
      await generateEarningsPDF(earningsData, user, 'fleetx-earnings-statement.pdf');
      
      toast.showToast('success', 'Success', 'Earnings statement has been generated and is ready to share.');
    } catch (error) {
      console.error('Error downloading statement:', error);
      toast.showToast('error', 'Error', 'Failed to generate earnings statement. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle double click on an earning item
  const handleEarningPress = (earning: EarningType) => {
    clickCountRef.current += 1;
    
    if (clickCountRef.current === 1) {
      // First click
      clickTimeoutRef.current = setTimeout(() => {
        // Reset if not double clicked within 300ms
        clickCountRef.current = 0;
        // Handle single click here if needed
      }, 300) as unknown as NodeJS.Timeout;
    } else if (clickCountRef.current === 2) {
      // Double click
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      clickCountRef.current = 0;
      
      // Show delete confirmation modal
      setSelectedEarning(earning);
      setShowDeleteModal(true);
    }
  };

  // Handle delete earning
  const handleDeleteEarning = async () => {
    if (!selectedEarning || !user?.id) return;
    
    try {
      setIsDeletingEarning(true);
      
      // Call the delete API
      await deleteEarning(selectedEarning.id);
      
      // Remove the deleted earning from state
      setRecentEarnings(prev => prev.filter(e => e.id !== selectedEarning.id));
      
      // Show success toast
      toast.showToast('success', 'Success', 'Earning deleted successfully');
      
      // Close the modal
      setShowDeleteModal(false);
      setSelectedEarning(null);
      
      // Re-fetch the earnings summary
      fetchEarningsData();
    } catch (error) {
      console.error('Error deleting earning:', error);
      toast.showToast('error', 'Error', 'Failed to delete earning. Please try again.');
    } finally {
      setIsDeletingEarning(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/dashboard/driver' as any)}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/dashboard/add-earning' as any)}
        >
          <Ionicons name="add-circle-outline" size={24} color="black" />
        </TouchableOpacity>
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
                      {formatAmount(item.totalAmount)}
                    </Text>
                  </View>
                ))
              ) : (
                ['Online', 'Cash', 'Pocket Slipt'].map((type, index) => (
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
                    <Text style={styles.paymentMethodCount}>No transactions yet</Text>
                    <Text style={styles.paymentMethodAmount}>AED 0.00</Text>
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
                  <TouchableOpacity 
                    key={earning.id} 
                    style={styles.paymentItem}
                    onPress={() => handleEarningPress(earning)}
                    activeOpacity={0.7}
                  >
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
                    <Text style={styles.paymentAmount}>{formatAmount(earning.amount)}</Text>
                  </TouchableOpacity>
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
            
            <TouchableOpacity 
              style={[
                styles.downloadButton,
                isDownloading && styles.disabledButton
              ]}
              onPress={handleDownloadStatement}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <ActivityIndicator color="#fff" size="small" style={{marginRight: 8}} />
                  <Text style={styles.downloadButtonText}>Please wait...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="download-outline" size={20} color="#fff" />
                  <Text style={styles.downloadButtonText}>Download Statement</Text>
                </>
              )}
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
      
      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.simpleModalContainer}>
            <View style={styles.simpleModalContent}>
              <Text style={styles.simpleModalText}>
                Are you sure you want to delete this earning?
              </Text>
            </View>
            
            <View style={styles.simpleModalActions}>
              <TouchableOpacity 
                style={styles.simpleModalCancel}
                onPress={() => {
                  setShowDeleteModal(false);
                  setSelectedEarning(null);
                }}
              >
                <Text style={styles.simpleModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.simpleModalDelete}
                onPress={handleDeleteEarning}
                disabled={isDeletingEarning}
              >
                {isDeletingEarning ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.simpleModalDeleteText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  addButton: {
    padding: 5,
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
  disabledButton: {
    backgroundColor: '#ccc',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  simpleModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '85%',
    maxWidth: 320,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  simpleModalContent: {
    padding: 24,
  },
  simpleModalText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  simpleModalActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  simpleModalCancel: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRightWidth: 0.5,
    borderRightColor: '#e0e0e0',
  },
  simpleModalCancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  simpleModalDelete: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#000',
  },
  simpleModalDeleteText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
}); 