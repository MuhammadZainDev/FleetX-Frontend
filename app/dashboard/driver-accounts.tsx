import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { router, useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { getAllEarnings } from '@/services/earning.service';
import { getDriverById } from '@/services/driver.service';

const { width } = Dimensions.get('window');

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

type Driver = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
};

export default function DriverAccountsScreen() {
  const { user, authToken } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Get driver ID from params
  const driverId = params.id as string;
  
  // States
  const [driver, setDriver] = useState<Driver | null>(null);
  const [personalAccountTotal, setPersonalAccountTotal] = useState(0);
  const [limousineAccountTotal, setLimousineAccountTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Role-based protection - only Admin can access this screen
  useEffect(() => {
    if (user && user.role !== 'Admin') {
      // Redirect non-admin users to their respective dashboards
      if (user.role === 'Driver') {
        router.replace('/dashboard/driver');
      } else if (user.role === 'Viewer') {
        router.replace('/dashboard/viewer');
      }
    }
  }, [user, router]);

  // Fetch driver details
  useEffect(() => {
    const fetchDriverDetails = async () => {
      if (!driverId || !authToken) return;
      
      try {
        const driverData = await getDriverById(driverId, authToken);
        setDriver(driverData.data || driverData);
      } catch (error) {
        console.error('Error fetching driver details:', error);
        setError('Failed to load driver details');
      }
    };
    
    fetchDriverDetails();
  }, [driverId, authToken]);

  // Fetch earnings for both accounts
  useEffect(() => {
    const fetchEarnings = async () => {
      if (!driverId || !authToken) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const filters = {
          driverId: driverId,
        };
        
        // Use null as token parameter since the API expects null (not string)
        const allEarnings = await getAllEarnings(filters, null);
        console.log('All earnings fetched:', allEarnings);
        
        // Filter out entries with zero or invalid amounts
        const validEarnings = allEarnings.filter((earning: EarningType) => {
          const amount = parseFloat(String(earning.amount));
          return !isNaN(amount) && amount > 0;
        });
        
        console.log('Valid earnings after filtering:', validEarnings);
        console.log('Personal Account entries:', validEarnings.filter((e: EarningType) => e.accountName === 'Personal Account').length);
        console.log('Limousine Account entries:', validEarnings.filter((e: EarningType) => e.accountName === 'Limousine Account').length);
        
        // Calculate totals for each account, ensuring parsing of string amounts
        let personalTotal = 0;
        let limousineTotal = 0;
        
        validEarnings.forEach((earning: EarningType) => {
          const amount = parseFloat(String(earning.amount));
          
          if (earning.accountName === 'Personal Account') {
            personalTotal += amount;
          } else if (earning.accountName === 'Limousine Account') {
            limousineTotal += amount;
          }
        });
        
        console.log('Final Personal Account total:', personalTotal);
        console.log('Final Limousine Account total:', limousineTotal);
        
        setPersonalAccountTotal(personalTotal);
        setLimousineAccountTotal(limousineTotal);
      } catch (err) {
        console.error('Error fetching earnings data:', err);
        setError('Failed to load account earnings. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEarnings();
  }, [driverId, authToken]);
  
  // Format currency
  const formatCurrency = (amount: number | string) => {
    return `AED ${parseFloat(amount.toString()).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>{driver?.name}'s Accounts</Text>
        <View style={styles.rightPlaceholder} />
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading accounts...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          {/* Account Cards */}
          <View style={styles.accountCardsContainer}>
            {/* Personal Account Card */}
            <TouchableOpacity 
              style={styles.accountCard}
              onPress={() => router.push({
                pathname: '/dashboard/account-detail',
                params: {
                  accountName: 'Personal Account',
                  totalAmount: personalAccountTotal.toString(),
                  driverId: driverId
                }
              } as any)}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="wallet-outline" size={36} color="#ffffff" />
                <View style={styles.cardTitleContainer}>
                  <Text style={styles.cardTitle}>Personal Account</Text>
                  <Text style={styles.cardSubtitle}>Individual Earnings</Text>
                </View>
              </View>
              
              <View style={styles.cardBody}>
                <Text style={styles.cardAmount}>
                  {formatCurrency(personalAccountTotal)}
                </Text>
                <Text style={styles.cardLabel}>Total Earnings</Text>
              </View>
              
              <View style={styles.cardFooter}>
                <Text style={styles.viewDetailsText}>
                  View Transactions
                </Text>
                <Ionicons 
                  name="chevron-forward" 
                  size={16} 
                  color="#ffffff" 
                />
              </View>
            </TouchableOpacity>
            
            {/* Limousine Account Card */}
            <TouchableOpacity 
              style={[styles.accountCard, styles.limousineCard]}
              onPress={() => router.push({
                pathname: '/dashboard/account-detail',
                params: {
                  accountName: 'Limousine Account',
                  totalAmount: limousineAccountTotal.toString(),
                  driverId: driverId
                }
              } as any)}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="car-outline" size={36} color="#ffffff" />
                <View style={styles.cardTitleContainer}>
                  <Text style={styles.cardTitle}>Limousine Account</Text>
                  <Text style={styles.cardSubtitle}>Vehicle Related Earnings</Text>
                </View>
              </View>
              
              <View style={styles.cardBody}>
                <Text style={styles.cardAmount}>
                  {formatCurrency(limousineAccountTotal)}
                </Text>
                <Text style={styles.cardLabel}>Total Earnings</Text>
              </View>
              
              <View style={styles.cardFooter}>
                <Text style={styles.viewDetailsText}>
                  View Transactions
                </Text>
                <Ionicons 
                  name="chevron-forward" 
                  size={16} 
                  color="#ffffff" 
                />
              </View>
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
    color: 'black',
  },
  rightPlaceholder: {
    width: 24,
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
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  accountCardsContainer: {
    marginBottom: 24,
  },
  accountCard: {
    width: width * 0.95,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    paddingHorizontal: 15,
    alignSelf: 'center',
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#000000',
  },
  limousineCard: {
    backgroundColor: '#000000',
    borderColor: '#000000',
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
    color: '#ffffff',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.8,
    marginTop: 2,
  },
  cardBody: {
    marginBottom: 20,
  },
  cardAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.7,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#444',
    paddingTop: 12,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
}); 