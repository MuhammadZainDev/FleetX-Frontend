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
import { router, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { getAllAutoExpenses } from '@/services/autoExpense.service';

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
  const [autoExpenses, setAutoExpenses] = useState<AutoExpenseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AutoExpenseCategory | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  
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
          {/* Category Filter Cards */}
          <View style={styles.categorySection}>
            <Text style={styles.sectionTitle}>Expense Categories</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryContainer}
            >
              <TouchableOpacity
                style={[
                  styles.categoryCard,
                  selectedCategory === null && styles.selectedCategoryCard
                ]}
                onPress={() => filterByCategory(null)}
              >
                <View style={styles.categoryIconContainer}>
                  <Ionicons name="apps-outline" size={22} color={selectedCategory === null ? "#fff" : "#000"} />
                </View>
                <Text style={[
                  styles.categoryTypeText,
                  selectedCategory === null && styles.selectedCategoryText
                ]}>All</Text>
              </TouchableOpacity>
              
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryCard,
                    selectedCategory === category && styles.selectedCategoryCard
                  ]}
                  onPress={() => filterByCategory(category)}
                >
                  <View style={styles.categoryIconContainer}>
                    <Ionicons 
                      name={getCategoryIcon(category)} 
                      size={22} 
                      color={selectedCategory === category ? "#fff" : "#000"} 
                    />
                  </View>
                  <Text style={[
                    styles.categoryTypeText,
                    selectedCategory === category && styles.selectedCategoryText
                  ]}>{category}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          {/* Expenses List */}
          <View style={styles.expensesDetails}>
            <Text style={styles.sectionTitle}>Recent Auto Expenses</Text>
            
            <View style={styles.expensesList}>
              {autoExpenses.map((item) => (
                <View key={item.id || Math.random().toString()} style={styles.expenseItem}>
                  <View style={[
                    styles.expenseIconContainer,
                    item.category === 'Petrol' ? styles.petrolExpense :
                    item.category === 'Car Accident' ? styles.accidentExpense :
                    item.category === 'Maintenance' ? styles.maintenanceExpense :
                    item.category === 'Insurance' ? styles.insuranceExpense : styles.otherExpense
                  ]}>
                    <Ionicons 
                      name={getCategoryIcon(item.category)} 
                      size={22} 
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
                </View>
              ))}
            </View>
          </View>
          
          {/* Add new expense button */}
          <View style={styles.actionSection}>
            <TouchableOpacity 
              style={styles.fullWidthButton}
              onPress={navigateToAddAutoExpense}
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.fullWidthButtonText}>Add New Auto Expense</Text>
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
  categorySection: {
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  categoryContainer: {
    paddingRight: 20,
  },
  categoryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginRight: 12,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    minWidth: 100,
  },
  selectedCategoryCard: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  categoryTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  // Expenses List
  expensesDetails: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  expensesList: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  expenseIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#f0f0f0',
  },
  petrolExpense: {
    backgroundColor: '#E5F6FD',
  },
  accidentExpense: {
    backgroundColor: '#FFE5E5',
  },
  maintenanceExpense: {
    backgroundColor: '#E5E5FF',
  },
  insuranceExpense: {
    backgroundColor: '#E5FFE5',
  },
  otherExpense: {
    backgroundColor: '#F5F5F5',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  expenseDate: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  expenseNote: {
    fontSize: 12,
    color: '#777',
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  // Action Section
  actionSection: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  fullWidthButton: {
    backgroundColor: '#000',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  fullWidthButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 