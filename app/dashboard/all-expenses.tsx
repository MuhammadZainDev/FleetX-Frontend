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
import { getAllExpenses, deleteExpense } from '@/services/expense.service';

// Define data types
type ExpenseType = {
  id: string;
  amount: number;
  note: string;
  category: 'Fuel' | 'Maintenance' | 'Insurance' | 'Parking' | 'Other';
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

export default function AllExpensesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  
  // States
  const [expenses, setExpenses] = useState<ExpenseType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Double click detection
  const lastTapRef = useRef<{ id: string; time: number } | null>(null);
  
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

  // Fetch all expenses
  const fetchExpenses = async (filter: string | null = null) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const filters: any = {
        driverId: user.id,
      };
      
      // Apply category filter if selected
      if (filter) {
        filters.category = filter;
      }
      
      const data = await getAllExpenses(filters);
      setExpenses(data);
    } catch (err) {
      console.error('Error fetching expenses data:', err);
      setError('Failed to load expenses data. Please try again later.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchExpenses(selectedFilter);
  }, [user, selectedFilter]);
  
  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchExpenses(selectedFilter);
  };
  
  // Filter expenses by category
  const applyFilter = (category: string | null) => {
    setSelectedFilter(category);
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
  
  // Get icon for expense category
  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'Fuel':
        return 'flame-outline';
      case 'Maintenance':
        return 'construct-outline';
      case 'Insurance':
        return 'shield-outline';
      case 'Parking':
        return 'car-outline';
      case 'Other':
      default:
        return 'cart-outline';
    }
  };
  
  // Handle back button
  const handleBackButton = () => {
    // Navigate to driver dashboard instead of using router.back()
    router.push('/dashboard/driver' as any);
  };
  
  // Handle expense item press for double-click detection
  const handleExpensePress = (expense: ExpenseType) => {
    const now = Date.now();
    
    // Check if this is a double tap (within 300ms of the last tap on the same item)
    if (
      lastTapRef.current && 
      lastTapRef.current.id === expense.id && 
      now - lastTapRef.current.time < 300
    ) {
      // Double-tap detected - show delete confirmation
      setSelectedExpense(expense);
      setShowDeleteModal(true);
      lastTapRef.current = null;
    } else {
      // First tap - record it
      lastTapRef.current = { id: expense.id, time: now };
    }
  };
  
  // Handle expense deletion
  const handleDeleteExpense = async () => {
    if (!selectedExpense) return;
    
    setIsDeleting(true);
    
    try {
      await deleteExpense(selectedExpense.id);
      
      // Update the local state to remove the deleted expense
      setExpenses(prevExpenses => 
        prevExpenses.filter(expense => expense.id !== selectedExpense.id)
      );
      
      // Show success toast message
      toast.showToast('success', 'Success', 'Expense deleted successfully');
    } catch (error) {
      console.error('Error deleting expense:', error);
      
      // Extract the error message more carefully
      let errorMessage = 'An unknown error occurred';
      if (error.message) {
        errorMessage = error.message;
      }
      
      // Show error toast message
      toast.showToast('error', 'Error', `Failed to delete expense: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setSelectedExpense(null);
    }
  };
  
  // Render each expense item
  const renderExpenseItem = ({ item }: { item: ExpenseType }) => (
    <TouchableOpacity 
      style={styles.expenseItem}
      onPress={() => handleExpensePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.expenseIconContainer}>
        <Ionicons 
          name={getCategoryIcon(item.category)} 
          size={24} 
          color="#000" 
        />
      </View>
      <View style={styles.expenseInfo}>
        <Text style={styles.expenseTitle}>
          {item.category} Expense
        </Text>
        <Text style={styles.expenseDate}>{formatDate(item.date)}</Text>
        <Text style={styles.expenseNote}>{item.note}</Text>
      </View>
      <Text style={styles.expenseAmount}>{formatCurrency(item.amount)}</Text>
    </TouchableOpacity>
  );
  
  // Render filter buttons
  const renderFilterButtons = () => {
    const filterOptions = [null, 'Fuel', 'Maintenance', 'Insurance', 'Parking', 'Other'];
    
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
          onPress={handleBackButton}
        >
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>My Expenses</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/dashboard/add-expense' as any)}
        >
          <Ionicons name="add-circle-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      
      {/* Filter section */}
      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Filter by expense category:</Text>
        {renderFilterButtons()}
      </View>
      
      {/* Content */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading expenses data...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => fetchExpenses(selectedFilter)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={expenses}
          renderItem={renderExpenseItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.expensesList}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={["#000"]} 
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="receipt-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>
                No expenses found{selectedFilter ? ` for ${selectedFilter} category` : ''}
              </Text>
              <TouchableOpacity 
                style={styles.addExpenseButton}
                onPress={() => router.push('/dashboard/add-expense' as any)}
              >
                <Text style={styles.addExpenseButtonText}>Add New Expense</Text>
              </TouchableOpacity>
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
                Are you sure you want to delete this expense?
              </Text>
            </View>
            
            <View style={styles.simpleModalActions}>
              <TouchableOpacity 
                style={styles.simpleModalCancel}
                onPress={() => {
                  setShowDeleteModal(false);
                  setSelectedExpense(null);
                }}
                disabled={isDeleting}
              >
                <Text style={styles.simpleModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.simpleModalDelete}
                onPress={handleDeleteExpense}
                disabled={isDeleting}
              >
                {isDeleting ? (
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
  addButton: {
    padding: 4,
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
  expensesList: {
    paddingVertical: 8,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  expenseIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  expenseDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  expenseNote: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyStateText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  addExpenseButton: {
    backgroundColor: '#000',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addExpenseButtonText: {
    color: '#fff',
    fontWeight: '600',
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
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  simpleModalCancelText: {
    fontSize: 16,
    color: '#333',
  },
  simpleModalDelete: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  simpleModalDeleteText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
}); 