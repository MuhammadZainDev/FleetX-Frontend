import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  FlatList,
  Dimensions
} from 'react-native';
import { router, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { getAllEarnings } from '@/services/earning.service';

const { width } = Dimensions.get('window');
const cardWidth = width * 0.85;

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

type AccountEarnings = {
  accountName: 'Personal Account' | 'Limousine Account';
  totalAmount: number;
  earnings: EarningType[];
  iconName: string;
  cardColor: string;
  textColor: string;
};

export default function AccountEarningsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  
  // States
  const [earnings, setEarnings] = useState<EarningType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountEarnings, setAccountEarnings] = useState<AccountEarnings[]>([]);
  
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
  const fetchEarnings = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const filters = {
        driverId: user.id,
      };
      
      const data = await getAllEarnings(filters);
      
      // Filter out zero or invalid amounts
      const validData = data.filter((item: EarningType) => {
        const amount = parseFloat(String(item.amount));
        return !isNaN(amount) && amount > 0;
      });
      
      setEarnings(validData);
      
      // Process the data for each account type
      const personalAccountData = validData.filter((item: EarningType) => item.accountName === 'Personal Account');
      const limousineAccountData = validData.filter((item: EarningType) => item.accountName === 'Limousine Account');
      
      const personalTotal = personalAccountData.reduce((sum: number, item: EarningType) => sum + parseFloat(String(item.amount)), 0);
      const limousineTotal = limousineAccountData.reduce((sum: number, item: EarningType) => sum + parseFloat(String(item.amount)), 0);
      
      console.log('Personal Account entries:', personalAccountData.length, 'Total:', personalTotal);
      console.log('Limousine Account entries:', limousineAccountData.length, 'Total:', limousineTotal);
      
      const accountsData: AccountEarnings[] = [
        {
          accountName: 'Personal Account',
          totalAmount: personalTotal,
          earnings: personalAccountData,
          iconName: 'wallet-outline',
          cardColor: '#2C3E50', // Dark blue-gray
          textColor: '#ffffff'  // White
        },
        {
          accountName: 'Limousine Account',
          totalAmount: limousineTotal,
          earnings: limousineAccountData,
          iconName: 'car-outline',
          cardColor: '#34495E', // Slightly lighter blue-gray
          textColor: '#ffffff'  // White
        }
      ];
      
      setAccountEarnings(accountsData);
      
    } catch (err) {
      console.error('Error fetching earnings data:', err);
      setError('Failed to load account earnings. Please try again later.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchEarnings();
  }, [user]);
  
  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchEarnings();
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
  
  // Render each earning item
  const renderEarningItem = ({ item }: { item: EarningType }) => (
    <View style={styles.earningItem}>
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
    </View>
  );
  
  // Render an account card
  const renderAccountCard = (account: AccountEarnings, index: number) => (
    <TouchableOpacity 
      key={account.accountName}
      style={[
        styles.accountCard, 
        { backgroundColor: account.cardColor }
      ]}
      onPress={() => router.push({
        pathname: '/dashboard/account-detail',
        params: { 
          accountName: account.accountName,
          totalAmount: account.totalAmount.toString()
        }
      } as any)}
    >
      <View style={styles.cardHeader}>
        <Ionicons name={account.iconName as any} size={36} color={account.textColor} />
        <View style={styles.cardTitleContainer}>
          <Text style={[styles.cardTitle, { color: account.textColor }]}>{account.accountName}</Text>
          <Text style={[styles.cardSubtitle, { color: account.textColor }]}>
            {account.earnings.length} {account.earnings.length === 1 ? 'Payment' : 'Payments'}
          </Text>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <Text style={[styles.cardAmount, { color: account.textColor }]}>
          {formatCurrency(account.totalAmount)}
        </Text>
        <Text style={[styles.cardLabel, { color: account.textColor }]}>Total Earnings</Text>
      </View>
      
      <View style={styles.cardFooter}>
        <Text style={[styles.viewDetailsText, { color: account.textColor }]}>
          View Transactions
        </Text>
        <Ionicons 
          name="chevron-forward" 
          size={16} 
          color={account.textColor} 
        />
      </View>
    </TouchableOpacity>
  );

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
        <Text style={styles.title}>Account Earnings</Text>
        <View style={styles.rightPlaceholder} />
      </View>
      
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading account data...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => fetchEarnings()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={["#000"]} 
            />
          }
        >
          {/* Account Cards */}
          <View style={styles.accountCardsContainer}>
            <Text style={styles.sectionTitle}>Your Accounts</Text>
            {accountEarnings.map(renderAccountCard)}
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
  scrollContent: {
    padding: 16,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    marginLeft: 4,
  },
  accountCardsContainer: {
    marginBottom: 24,
  },
  accountCard: {
    width: cardWidth,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitleContainer: {
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.8,
  },
  cardBody: {
    marginBottom: 20,
  },
  cardAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#444',
    paddingTop: 12,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  earningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  earningIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#ddd',
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
}); 