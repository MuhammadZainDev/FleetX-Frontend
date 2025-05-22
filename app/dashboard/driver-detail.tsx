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
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { getAllEarnings } from '@/services/earning.service';
import { getAllExpenses } from '@/services/expense.service';
import { getAllAutoExpenses } from '@/services/autoExpense.service';

// Define data types
type EarningType = {
  id: string;
  amount: number;
  description?: string;
  note?: string;
  type?: string;
  driverId: string;
  date: string;
  createdAt: string;
  updatedAt: string;
};

type ExpenseType = {
  id: string;
  amount: number;
  description?: string;
  category?: string;
  driverId: string;
  date: string;
  createdAt: string;
  updatedAt: string;
};

type AutoExpenseType = {
  id: string;
  amount: number;
  note?: string;
  category?: string;
  driverId: string;
  date: string;
  createdAt: string;
  updatedAt: string;
};

type TransactionType = {
  id: string;
  amount: number;
  description?: string;
  date: string;
  type: string; // 'earning', 'expense', or 'autoExpense'
  category?: string;
  transactionType?: string;
};

export default function DriverDetailScreen() {
  const { authToken } = useAuth();
  const params = useLocalSearchParams();
  const driverId = params.id as string;
  const driverName = params.name as string;
  
  // States
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [earnings, setEarnings] = useState<EarningType[]>([]);
  const [expenses, setExpenses] = useState<ExpenseType[]>([]);
  const [autoExpenses, setAutoExpenses] = useState<AutoExpenseType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize activeTab based on filter parameter from URL
  const getInitialTab = () => {
    // Convert filter parameter to activeTab format
    if (params.filter) {
      const filterValue = params.filter as string;
      if (filterValue === 'earnings') return 'earnings';
      if (filterValue === 'expenses') return 'expenses';
      if (filterValue === 'autoExpenses') return 'autoExpenses';
      if (filterValue === 'all') return 'all';
    }
    return 'all'; // default
  };
  
  const [activeTab, setActiveTab] = useState<'all' | 'earnings' | 'expenses' | 'autoExpenses'>(getInitialTab());
  
  // Fetch data
  const fetchData = async () => {
    if (!driverId || !authToken) {
      setError('Missing driver ID or authentication');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching data for driver:', driverId);
      
      // Fetch earnings
      const earningsData = await getAllEarnings({ driverId });
      const earningsArray = Array.isArray(earningsData) 
        ? earningsData 
        : earningsData?.data || earningsData?.earnings || [];
      setEarnings(earningsArray);
      console.log(`Fetched ${earningsArray.length} earnings`);
      
      // Fetch expenses
      const expensesData = await getAllExpenses({ driverId });
      const expensesArray = Array.isArray(expensesData) 
        ? expensesData 
        : expensesData?.data || expensesData?.expenses || [];
      setExpenses(expensesArray);
      console.log(`Fetched ${expensesArray.length} expenses`);
      
      // Fetch auto expenses
      const autoExpensesData = await getAllAutoExpenses({ driverId });
      const autoExpensesArray = Array.isArray(autoExpensesData) 
        ? autoExpensesData 
        : autoExpensesData?.data || autoExpensesData?.autoExpenses || [];
      setAutoExpenses(autoExpensesArray);
      console.log(`Fetched ${autoExpensesArray.length} auto expenses`);
      
      // Combine and sort transactions
      const allTransactions = [
        ...earningsArray.map(e => ({
          id: e.id,
          amount: e.amount,
          description: e.description || e.note || 'Earning',
          date: e.date,
          type: 'earning',
          transactionType: e.type || 'Payment'
        })),
        ...expensesArray.map(e => ({
          id: e.id,
          amount: e.amount,
          description: e.description || 'Expense',
          date: e.date,
          type: 'expense',
          category: e.category
        })),
        ...autoExpensesArray.map(e => ({
          id: e.id,
          amount: e.amount,
          description: e.note || 'Auto Expense',
          date: e.date,
          type: 'autoExpense',
          category: e.category
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setTransactions(allTransactions);
      
    } catch (err) {
      console.error('Error fetching driver data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [driverId, authToken]);
  
  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return `AED ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
  
  // Render transaction item
  const renderTransactionItem = ({ item }: { item: TransactionType }) => (
    <View style={styles.transactionItem}>
      <View style={[
        styles.transactionIconContainer,
        item.type === 'expense' && styles.expenseIconContainer,
        item.type === 'autoExpense' && styles.autoExpenseIconContainer
      ]}>
        <Ionicons 
          name={
            item.type === 'earning' ? 'cash-outline' : 
            item.type === 'expense' ? 'receipt-outline' : 'car-outline'
          } 
          size={24} 
          color={
            item.type === 'earning' ? '#4CAF50' : 
            item.type === 'expense' ? '#FF5252' : '#FF9800'
          } 
        />
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionTitle}>
          {item.description}
        </Text>
        <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
        {item.category && <Text style={styles.transactionCategory}>{item.category}</Text>}
        {item.transactionType && <Text style={styles.transactionType}>{item.transactionType}</Text>}
      </View>
      <Text style={[
        styles.transactionAmount,
        item.type === 'expense' && styles.expenseAmount,
        item.type === 'autoExpense' && styles.autoExpenseAmount
      ]}>
        {item.type !== 'earning' ? '-' : '+'}{formatCurrency(item.amount)}
      </Text>
    </View>
  );

  // Get the filtered transactions based on the active tab
  const getFilteredTransactions = () => {
    if (activeTab === 'all') return transactions;
    if (activeTab === 'earnings') return transactions.filter(t => t.type === 'earning');
    if (activeTab === 'expenses') return transactions.filter(t => t.type === 'expense');
    return transactions.filter(t => t.type === 'autoExpense');
  };

  // Filter options for rendering
  const filterOptions = ['all', 'earnings', 'expenses', 'autoExpenses'];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction</Text>
        <View style={styles.headerRight} />
      </View>
      
      {/* Filter Section */}
      <View style={styles.filterSection}>
        <Text style={styles.sectionTitle}>Filter by type:</Text>
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
                activeTab === option && styles.selectedFilterButton
              ]}
              onPress={() => setActiveTab(option as any)}
            >
              <Text 
                style={[
                  styles.filterText,
                  activeTab === option && styles.selectedFilterText
                ]}
              >
                {option === 'autoExpenses' ? 'Auto Expenses' : option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Transaction list */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => fetchData()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={getFilteredTransactions()}
          renderItem={renderTransactionItem}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          contentContainerStyle={styles.transactionList}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={["#000"]} 
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyStateContainer}>
              <Ionicons 
                name={
                  activeTab === 'earnings' ? 'cash-outline' : 
                  activeTab === 'expenses' ? 'receipt-outline' : 
                  activeTab === 'autoExpenses' ? 'car-outline' : 'wallet-outline'
                } 
                size={48} 
                color="#ccc" 
              />
              <Text style={styles.emptyStateText}>
                No {activeTab === 'all' ? 'transactions' : activeTab === 'autoExpenses' ? 'auto expenses' : activeTab} found for this driver
              </Text>
            </View>
          )}
        />
      )}
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
    flex: 1,
  },
  headerRight: {
    width: 24, // To balance the header
  },
  filterSection: {
    marginBottom: 10,
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  filterContainer: {
    paddingRight: 5,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
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
    color: '#FFFFFF',
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
  transactionList: {
    padding: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  expenseIconContainer: {
    backgroundColor: '#FFEBEE',
  },
  autoExpenseIconContainer: {
    backgroundColor: '#FFF3E0',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 13,
    color: '#666',
  },
  transactionCategory: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  transactionType: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  expenseAmount: {
    color: '#FF5252',
  },
  autoExpenseAmount: {
    color: '#FF9800',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginTop: 20,
  },
  emptyStateText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
}); 