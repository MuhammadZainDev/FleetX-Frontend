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
import { router, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getAllAutoExpenses, deleteAutoExpense } from '@/services/autoExpense.service';

// Define the category type
type AutoExpenseCategory = 'Petrol' | 'Car Accident' | 'Maintenance' | 'Insurance' | 'Other';

// Define data types
type AutoExpenseType = {
  id: string;
  amount: number | string | null;
  note: string;
  category: AutoExpenseCategory;
  date: string;
  driver?: {
    id: string;
    name: string;
    email: string;
  };
};

export default function AutoExpenseScreen() {
  const { user, token } = useAuth();
  const toast = useToast();
  const [autoExpenses, setAutoExpenses] = useState<AutoExpenseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AutoExpenseCategory | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<AutoExpenseType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  // Double click detection
  const lastTapRef = useRef<{ id: string; time: number } | null>(null);
  
  // Fetch auto expenses data on component mount
  useEffect(() => {
    fetchAutoExpenses();
  }, []);
  
  const fetchAutoExpenses = async () => {
    try {
      setLoading(true);
      const filters: Record<string, any> = {};
      
      // If user is a driver, only fetch their auto expenses
      if (user?.role === 'Driver') {
        filters.driverId = user.id;
      }
      
      // Apply category filter if selected
      if (selectedCategory) {
        filters.category = selectedCategory;
      }
      
      const data = await getAllAutoExpenses(filters, token as any);
      console.log('Auto expenses data:', JSON.stringify(data));
      
      // Ensure proper data structure
      const validatedData = Array.isArray(data) ? data.map(item => ({
        ...item,
        // Ensure amount is not undefined
        amount: item.amount || 0
      })) : [];
      
      setAutoExpenses(validatedData);
    } catch (error) {
      console.error('Error fetching auto expenses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle refresh action
  const onRefresh = () => {
    setRefreshing(true);
    fetchAutoExpenses();
  };
  
  // Filter by category
  const filterByCategory = (category: AutoExpenseCategory | null) => {
    setSelectedCategory(category);
    setLoading(true);
    
    // Apply filter
    setTimeout(() => {
      fetchAutoExpenses();
    }, 100);
  };
  
  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      return 'No date';
    }
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
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
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Error';
    }
  };
  
  // Format amount with AED currency
  const formatAmount = (amount: number | string | null | undefined) => {
    if (amount === undefined || amount === null) {
      return 'AED 0.00';
    }
    // Convert string to number if needed
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Check if conversion was successful
    if (isNaN(numAmount as number)) {
      return 'AED 0.00';
    }
    
    return `AED ${(numAmount as number).toFixed(2)}`;
  };
  
  // Get category icon
  const getCategoryIcon = (category: string): any => {
    switch (category) {
      case 'Petrol':
        return 'car';
      case 'Car Accident':
        return 'alert-circle';
      case 'Maintenance':
        return 'construct';
      case 'Insurance':
        return 'shield-checkmark';
      default:
        return 'wallet';
    }
  };
  
  // Navigate to add auto expense screen
  const navigateToAddAutoExpense = () => {
    router.push('/dashboard/add-auto-expense');
  };
  
  // Handle auto expense item press for double-click detection
  const handleExpensePress = (expense: AutoExpenseType) => {
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
  
  // Handle auto expense deletion
  const handleDeleteExpense = async () => {
    if (!selectedExpense) return;
    
    setIsDeleting(true);
    
    try {
      await deleteAutoExpense(selectedExpense.id, token as any);
      
      // Update the local state to remove the deleted expense
      setAutoExpenses(prevExpenses => 
        prevExpenses.filter(expense => expense.id !== selectedExpense.id)
      );
      
      // Show success toast message
      toast.showToast('success', 'Success', 'Auto expense deleted successfully');
    } catch (error) {
      console.error('Error deleting auto expense:', error);
      
      // Extract the error message more carefully
      let errorMessage = 'An unknown error occurred';
      if (error.message) {
        errorMessage = error.message;
      }
      
      // Show error toast message
      toast.showToast('error', 'Error', `Failed to delete auto expense: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setSelectedExpense(null);
    }
  };
  
  const categories: AutoExpenseCategory[] = ['Petrol', 'Car Accident', 'Maintenance', 'Insurance', 'Other'];
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/dashboard/driver' as any)}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Auto Expenses</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={navigateToAddAutoExpense}
        >
          <Ionicons name="add-circle-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading auto expenses data...</Text>
        </View>
      ) : autoExpenses.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="car-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateTitle}>No auto expenses found</Text>
          <Text style={styles.emptyStateText}>
            {selectedCategory 
              ? `Try selecting a different category or add a new ${selectedCategory} expense`
              : 'Add your first auto expense to track vehicle-related costs'}
          </Text>
          <TouchableOpacity 
            style={styles.addNewButton}
            onPress={navigateToAddAutoExpense}
          >
            <Text style={styles.addNewButtonText}>Add new auto expense</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#000']}
              tintColor="#000"
            />
          }
        >
          {/* Category Filter Section */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Filter by auto expense category:</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterContainer}
            >
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  selectedCategory === null && styles.selectedFilterButton
                ]}
                onPress={() => filterByCategory(null)}
              >
                <Text style={[
                  styles.filterText,
                  selectedCategory === null && styles.selectedFilterText
                ]}>
                  All
                </Text>
              </TouchableOpacity>
              
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.filterButton,
                    selectedCategory === category && styles.selectedFilterButton
                  ]}
                  onPress={() => filterByCategory(category)}
                >
                  <Text style={[
                    styles.filterText,
                    selectedCategory === category && styles.selectedFilterText
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          {/* Expenses List */}
          <View style={styles.expensesDetails}>
            <View style={styles.expensesList}>
              {autoExpenses.map((item) => (
                <TouchableOpacity 
                  key={item.id || Math.random().toString()} 
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
                      {item.category || 'Unknown'} Expense
                    </Text>
                    <Text style={styles.expenseDate}>{formatDate(item.date)}</Text>
                    <Text style={styles.expenseNote} numberOfLines={1} ellipsizeMode="tail">
                      {item.note || 'No description'}
                    </Text>
                  </View>
                  <Text style={styles.expenseAmount}>{formatAmount(item.amount)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Add new expense button */}
          <View style={styles.actionSection}>
            <TouchableOpacity 
              style={styles.addExpenseButton}
              onPress={navigateToAddAutoExpense}
            >
              <Text style={styles.addExpenseButtonText}>Add New Auto Expense</Text>
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
                Are you sure you want to delete this auto expense?
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
  },
  addButton: {
    padding: 5,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#333',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    maxWidth: 300,
  },
  addNewButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addNewButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  // Category Filter Section
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
  // Expenses List
  expensesDetails: {
    paddingVertical: 8,
  },
  expensesList: {
    backgroundColor: '#fff',
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#f0f0f0',
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
  // Action Section
  actionSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  addExpenseButton: {
    backgroundColor: '#000',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  addExpenseButtonText: {
    color: '#fff',
    fontWeight: '600',
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