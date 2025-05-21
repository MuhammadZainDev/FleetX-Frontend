import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { getDriverById } from '@/services/driver.service';
import { getEarningsSummary } from '@/services/earning.service';
import { getExpensesSummary } from '@/services/expense.service';
import { getDriverVehicles } from '@/services/vehicle.service';

const { width } = Dimensions.get('window');

// Define the types
type Driver = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
};

type Vehicle = {
  id: string;
  name: string;
  plate: string;
  status: string;
  type: string;
  color: string;
  model: string;
};

export default function DriverStatistics() {
  const { authToken } = useAuth();
  const params = useLocalSearchParams();
  const driverId = params.id as string;
  const driverName = params.name as string;
  
  const [driver, setDriver] = useState<Driver | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Debug helper for better console logging
  const logDriverData = (data: any) => {
    if (!data) {
      console.warn('Driver data is null or undefined');
      return;
    }
    
    // Check if data is nested inside a data property
    const driverData = data.data || data;
    
    console.log('Driver data details:', {
      id: driverData.id || 'missing',
      name: driverData.name || 'missing',
      email: driverData.email || 'missing',
      phoneNumber: driverData.phoneNumber || 'missing',
      isActive: driverData.isActive !== undefined ? driverData.isActive : 'missing',
      role: driverData.role || 'missing'
    });
  };

  useEffect(() => {
    const fetchDriverData = async () => {
      if (!driverId || !authToken) {
        console.error('Missing required data:', { driverId, hasToken: !!authToken });
        setError('Missing driver ID or authentication token');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log('Starting to fetch driver data for ID:', driverId);
        
        // Fetch driver details
        try {
          console.log('Fetching driver details with token:', authToken.substring(0, 10) + '...');
          const driverResponse = await getDriverById(driverId, authToken);
          console.log('Driver API raw response:', driverResponse);
          logDriverData(driverResponse);
          
          // Check if the data is nested in a data property
          const driverData = driverResponse?.data || driverResponse;
          
          if (driverData) {
            setDriver(driverData);
          } else {
            console.warn('Driver response is empty or undefined');
            // Create a default driver with the name we have from params
            if (driverName) {
              const defaultDriver: Driver = {
                id: driverId,
                name: driverName,
                email: '',
                phoneNumber: '',
                role: 'Driver',
                isActive: true
              };
              setDriver(defaultDriver);
            }
          }
        } catch (driverErr) {
          console.error('Error fetching driver details:', driverErr);
          // Even if there's an error, we should set a default driver with the name we have
          if (driverName) {
            const defaultDriver: Driver = {
              id: driverId,
              name: driverName,
              email: '',
              phoneNumber: '',
              role: 'Driver',
              isActive: true
            };
            setDriver(defaultDriver);
          }
        }
        
        // Fetch driver's vehicles
        try {
          const vehiclesResponse = await getDriverVehicles(driverId, authToken);
          console.log('Vehicles response:', vehiclesResponse);
          
          // Handle potential nested structure in the response
          if (vehiclesResponse && vehiclesResponse.vehicles) {
            setVehicles(vehiclesResponse.vehicles);
            console.log('Vehicles data set, count:', vehiclesResponse.vehicles.length);
            if (vehiclesResponse.vehicles.length > 0) {
              console.log('First vehicle details:', vehiclesResponse.vehicles[0]);
            }
          } else if (vehiclesResponse && Array.isArray(vehiclesResponse)) {
            // In case the API returns the vehicles array directly
            setVehicles(vehiclesResponse);
            console.log('Vehicles array directly set, count:', vehiclesResponse.length);
          } else {
            console.warn('No vehicles found in the response');
            setVehicles([]);
          }
        } catch (vehicleErr) {
          console.error('Error fetching vehicles:', vehicleErr);
          setVehicles([]);
        }
        
        // Fetch earnings and expenses summaries
        console.log('Fetching earnings and expenses for driver ID:', driverId);
        
        try {
          const earningsSummary = await getEarningsSummary(driverId, 'monthly');
          console.log('Earnings summary:', earningsSummary);
          
          // Check different possible response structures and extract total earnings
          if (earningsSummary) {
            let earnings = 0;
            if (typeof earningsSummary.totalEarnings === 'number') {
              earnings = earningsSummary.totalEarnings;
            } else if (earningsSummary.data && typeof earningsSummary.data.totalEarnings === 'number') {
              earnings = earningsSummary.data.totalEarnings;
            }
            console.log('Setting total earnings to:', earnings);
            setTotalEarnings(earnings);
          } else {
            console.warn('Earnings summary is null or undefined');
            setTotalEarnings(0);
          }
        } catch (earnErr) {
          console.error('Error fetching earnings:', earnErr);
          setTotalEarnings(0);
        }
        
        try {
          const expensesSummary = await getExpensesSummary(driverId, 'monthly');
          console.log('Expenses summary:', expensesSummary);
          
          // Check different possible response structures and extract total expenses
          if (expensesSummary) {
            let expenses = 0;
            if (typeof expensesSummary.totalExpenses === 'number') {
              expenses = expensesSummary.totalExpenses;
            } else if (expensesSummary.data && typeof expensesSummary.data.totalExpenses === 'number') {
              expenses = expensesSummary.data.totalExpenses;
            }
            console.log('Setting total expenses to:', expenses);
            setTotalExpenses(expenses);
          } else {
            console.warn('Expenses summary is null or undefined');
            setTotalExpenses(0);
          }
        } catch (expErr) {
          console.error('Error fetching expenses:', expErr);
          setTotalExpenses(0);
        }
        
      } catch (err) {
        console.error('Error fetching driver data:', err);
        setError('Failed to load driver information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDriverData();
  }, [driverId, authToken]);

  const goBack = () => {
    router.back();
  };

  // Calculate net income (earnings - expenses)
  const netIncome = totalEarnings - totalExpenses;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Driver Statistics</Text>
        <View style={styles.headerPlaceholder} />
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Loading driver data...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={40} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Driver Info Card */}
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Driver Information</Text>
              <Text style={styles.driverName}>{driver?.name || driverName || 'Driver'}</Text>
              
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={16} color="#666" />
                <Text style={styles.infoText}>{driver?.email || 'No email available'}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={16} color="#666" />
                <Text style={styles.infoText}>{driver?.phoneNumber || 'No phone number available'}</Text>
              </View>
              
              <View style={styles.statusIndicator}>
                <View style={[styles.statusDot, { 
                  backgroundColor: driver && driver.isActive !== undefined 
                    ? (driver.isActive ? '#4CAF50' : '#FF3B30') 
                    : '#999'
                }]} />
                <Text style={[styles.statusText, {
                  color: driver && driver.isActive !== undefined 
                    ? (driver.isActive ? '#4CAF50' : '#FF3B30') 
                    : '#999'
                }]}>
                  {driver && driver.isActive !== undefined 
                    ? (driver.isActive ? 'Active' : 'Inactive') 
                    : 'Status unknown'}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Earnings Card */}
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Financial Summary</Text>
              
              <View style={styles.financialRow}>
                <Text style={styles.financialLabel}>Total Earnings:</Text>
                <Text style={styles.financialValue}>AED {totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              </View>
              
              <View style={styles.financialRow}>
                <Text style={styles.financialLabel}>Total Expenses:</Text>
                <Text style={styles.financialValue}>AED {totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.financialRow}>
                <Text style={styles.financialLabel}>Net Income:</Text>
                <Text style={[styles.financialValue, { color: netIncome >= 0 ? '#4CAF50' : '#FF3B30' }]}>
                  AED {netIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.viewDetailButton}
                onPress={() => router.push({
                  pathname: '/dashboard/driver-detail',
                  params: { id: driverId, name: driver?.name || driverName || 'Driver' }
                })}
              >
                <View style={styles.viewDetailButtonContent}>
                  <Text style={styles.viewDetailButtonText}>View Detail</Text>
                  <Ionicons name="arrow-forward" size={18} color="black" />
                </View>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Vehicles Card */}
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Assigned Vehicles</Text>
              
              {vehicles.length === 0 ? (
                <Text style={styles.noVehiclesText}>No vehicles assigned</Text>
              ) : (
                vehicles.map((vehicle, index) => (
                  <View key={vehicle.id} style={styles.vehicleItem}>
                    {index > 0 && <View style={styles.vehicleDivider} />}
                    
                    <Text style={styles.vehicleName}>{vehicle.name}</Text>
                    
                    <View style={styles.vehicleDetails}>
                      <View style={styles.vehicleDetail}>
                        <Ionicons name="car-outline" size={14} color="#666" />
                        <Text style={styles.vehicleDetailText}>{vehicle.type || 'Unknown'}</Text>
                      </View>
                      
                      <View style={styles.vehicleDetail}>
                        <Ionicons name="id-card-outline" size={14} color="#666" />
                        <Text style={styles.vehicleDetailText}>{vehicle.plate || 'No plate'}</Text>
                      </View>
                      
                      <View style={styles.vehicleDetail}>
                        <Ionicons name="color-palette-outline" size={14} color="#666" />
                        <Text style={styles.vehicleDetailText}>{vehicle.color || 'Unknown'}</Text>
                      </View>
                      
                      <View style={styles.vehicleDetail}>
                        <Ionicons name={
                          vehicle.status === 'active' ? "checkmark-circle-outline" :
                          vehicle.status === 'maintenance' ? "construct-outline" : "alert-circle-outline"
                        } size={14} color={
                          vehicle.status === 'active' ? "#4CAF50" :
                          vehicle.status === 'maintenance' ? "#FF9800" : "#FF3B30"
                        } />
                        <Text style={[styles.vehicleDetailText, {
                          color: vehicle.status === 'active' ? "#4CAF50" :
                                vehicle.status === 'maintenance' ? "#FF9800" : "#FF3B30"
                        }]}>
                          {vehicle.status === 'active' ? 'Active' :
                           vehicle.status === 'maintenance' ? 'Maintenance' : 'Inactive'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  backButton: {
    marginRight: 15,
    width: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 24,
  },
  content: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
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
  card: {
    width: '100%',
    height: 'auto',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  cardContent: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  driverName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    color: '#444',
    fontSize: 15,
    marginLeft: 8,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    color: '#444',
    fontSize: 15,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  financialLabel: {
    color: '#444',
    fontSize: 15,
  },
  financialValue: {
    color: '#222',
    fontSize: 15,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  noVehiclesText: {
    color: '#666',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 20,
  },
  vehicleItem: {
    marginBottom: 8,
  },
  vehicleDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  vehicleName: {
    color: '#222',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  vehicleDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  vehicleDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  vehicleDetailText: {
    color: '#444',
    fontSize: 14,
    marginLeft: 6,
  },
  viewDetailButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  viewDetailButtonText: {
    color: 'black',
    fontWeight: '600',
    fontSize: 16,
    marginRight: 8,
  },
  viewDetailButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 