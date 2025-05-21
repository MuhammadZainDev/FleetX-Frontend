import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList
} from 'react-native';
import { router, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { getAllExpenses } from '@/services/expense.service';

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

export default function AutoExpensesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  
  // States
  const [expenses, setExpenses] = useState<ExpenseType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  
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

  // Fetch auto expenses
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
      } else {
        // For "All" filter, only include auto expense categories
        filters.categories = ['Fuel', 'Maintenance', 'Insurance', 'Parking'];
      }
      
      const data = await getAllExpenses(filters);
      
      // Filter only auto expenses if the API doesn't support filtering by multiple categories
      let autoExpenses = data;
      if (!filter && !filters.categories) {
        autoExpenses = data.filter((expense: ExpenseType) => 
          ['Fuel', 'Maintenance', 'Insurance', 'Parking'].includes(expense.category)
        );
      }
      
      setExpenses(autoExpenses);
    } catch (err) {
      console.error('Error fetching auto expenses data:', err);
      setError('Failed to load auto expenses data. Please try again later.');
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
  
  // Render each expense item
  const renderExpenseItem = ({ item }: { item: ExpenseType }) => (
    <View style={styles.expenseItem}>
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
    </View>
  );
  
  // Render filter buttons
  const renderFilterButtons = () => {
    // Only include auto-related expense categories
    const filterOptions = [null, 'Fuel', 'Maintenance', 'Insurance', 'Parking'];
    
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
        <Text style={styles.title}>Auto Expenses</Text>
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
          <Text style={styles.loadingText}>Loading auto expenses data...</Text>
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
          contentContainerStyle={styles.expensesContainer}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={["#000"]} 
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="car-outline" size={48} color="#cccccc" />
              <Text style={styles.emptyText}>No auto expenses found</Text>
              <TouchableOpacity 
                style={styles.addNewButton}
                onPress={() => router.push('/dashboard/add-expense' as any)}
              >
                <Text style={styles.addNewButtonText}>Add new expense</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 8,
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 5,
    backgroundColor: '#ffffff',
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
    color: '#333',
  },
  filterContainer: {
    paddingBottom: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedFilterButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  filterText: {
    fontSize: 14,
    color: '#333',
  },
  selectedFilterText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  expensesContainer: {
    padding: 16,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  expenseIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  expenseDate: {
    fontSize: 13,
    color: '#666',
  },
  expenseNote: {
    fontSize: 14,
    color: '#444',
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 10,
    marginBottom: 20,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  addNewButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addNewButtonText: {
    color: 'white',
    fontWeight: '600',
  },
}); 