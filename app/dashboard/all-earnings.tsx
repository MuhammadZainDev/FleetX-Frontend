import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Modal
} from 'react-native';
import { router, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getAllEarnings, deleteEarning } from '@/services/earning.service';

// Define data types
type EarningType = {
  id: string;
  amount: number;
  note?: string;
  type: 'Online' | 'Cash' | 'Pocket Slipt';
  accountName: 'Personal Account' | 'Limousine Account';
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

export default function AllEarningsScreen() {
  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  
  // States
  const [earnings, setEarnings] = useState<EarningType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  
  // States for delete functionality
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

  // Fetch all earnings
  const fetchEarnings = async (filter: string | null = null) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const filters: any = {
        driverId: user.id,
      };
      
      // Apply type filter if selected
      if (filter) {
        filters.type = filter;
      }
      
      const data = await getAllEarnings(filters);
      setEarnings(data);
    } catch (err) {
      console.error('Error fetching earnings data:', err);
      setError('Failed to load earnings data. Please try again later.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchEarnings(selectedFilter);
  }, [user, selectedFilter]);
  
  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchEarnings(selectedFilter);
  };
  
  // Filter earnings by type
  const applyFilter = (type: string | null) => {
    setSelectedFilter(type);
  };
  
  // Format currency
  const formatCurrency = (amount: number | string) => {
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      }, 300);
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
      setEarnings(prev => prev.filter(e => e.id !== selectedEarning.id));
      
      // Show success toast
      toast.showToast('success', 'Success', 'Earning deleted successfully');
      
      // Close the modal
      setShowDeleteModal(false);
      setSelectedEarning(null);
    } catch (error) {
      console.error('Error deleting earning:', error);
      toast.showToast('error', 'Error', 'Failed to delete earning. Please try again.');
    } finally {
      setIsDeletingEarning(false);
    }
  };
  
  // Render each earning item
  const renderEarningItem = ({ item }: { item: EarningType }) => (
    <TouchableOpacity 
      style={styles.earningItem}
      onPress={() => handleEarningPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.earningIconContainer}>
        <Ionicons 
          name={
            item.type === 'Online' ? 'card-outline' :
            item.type === 'Cash' ? 'cash-outline' : 'wallet-outline'
          } 
          size={24} 
          color="#000" 
        />
      </View>
      <View style={styles.earningInfo}>
        <Text style={styles.earningTitle}>
          {item.type} Payment
        </Text>
        <Text style={styles.earningDate}>{formatDate(item.date)}</Text>
        {item.note && <Text style={styles.earningNote}>{item.note}</Text>}
      </View>
      <Text style={styles.earningAmount}>{formatCurrency(item.amount)}</Text>
    </TouchableOpacity>
  );
  
  // Render filter buttons
  const renderFilterButtons = () => {
    const filterOptions = [null, 'Online', 'Cash', 'Pocket Slipt'];
    
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {filterOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.filterButton,
              selectedFilter === option && styles.selectedFilterButton
            ]}
            onPress={() => applyFilter(option)}
          >
            <Text 
              style={[
                styles.filterText,
                selectedFilter === option && styles.selectedFilterText
              ]}
            >
              {option || 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/dashboard/driver' as any)}
        >
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>All Earnings</Text>
        <View style={styles.rightPlaceholder} />
      </View>
      
      {/* Filter section */}
      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Filter by payment type:</Text>
        {renderFilterButtons()}
      </View>
      
      {/* Earnings list */}
      {isLoading && !refreshing ? (
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
            onPress={() => fetchEarnings(selectedFilter)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={earnings}
          renderItem={renderEarningItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.earningsList}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={["#000"]} 
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="cash-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>
                No earnings found{selectedFilter ? ` for ${selectedFilter} payments` : ''}
              </Text>
            </View>
          )}
        />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  rightPlaceholder: {
    width: 24, // Match back button width for centering
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
  filterSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingBottom: 4,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 8,
  },
  selectedFilterButton: {
    backgroundColor: '#000',
  },
  filterText: {
    fontSize: 14,
    color: '#333',
  },
  selectedFilterText: {
    color: '#fff',
    fontWeight: '500',
  },
  earningsList: {
    paddingVertical: 8,
  },
  earningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  earningIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  earningInfo: {
    flex: 1,
  },
  earningTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  earningDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  earningNote: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  earningAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
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