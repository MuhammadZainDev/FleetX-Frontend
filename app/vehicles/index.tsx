import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { getAllVehicles, deleteVehicle } from '@/services/vehicle.service';

// Define the vehicle type
type Vehicle = {
  id: string;
  name: string;
  plate: string;
  status: string;
  type: string;
  drivers: Array<{
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    assignment: {
      isPrimary: boolean;
    }
  }>;
  location: string;
  lastUpdated: string;
  color: string;
  model: string;
  ownership: string;
  image: string;
};

export default function VehicleListScreen() {
  const { user, authToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Log current user info for debugging
  useEffect(() => {
    console.log('Current user in VehicleListScreen:', user);
    console.log('User role:', user?.role);
  }, [user]);

  // Fetch vehicle data from API
  const fetchVehicles = async (showFullLoading = true) => {
    try {
      if (showFullLoading) {
        setIsLoading(true);
      }
      
      if (!authToken) {
        throw new Error('Authentication required');
      }
      
      const response = await getAllVehicles(authToken);
      
      if (response && response.vehicles) {
        setVehicles(response.vehicles);
        console.log('Vehicles loaded successfully:', response.vehicles.length);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      Alert.alert('Error', 'Failed to load vehicles. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchVehicles();
  }, [authToken]);

  // Handle pull-to-refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchVehicles(false);
  };

  const handleAddVehicle = () => {
    console.log('Navigating to add vehicle page');
    router.push('/vehicles/add-vehicle');
  };

  const handleBackNavigation = () => {
    // Always navigate back to admin dashboard
    console.log('Navigating back to admin dashboard');
    router.replace('/dashboard/admin');
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    try {
      if (!authToken) {
        throw new Error('Authentication required');
      }

      // Show confirmation dialog
      Alert.alert(
        'Delete Vehicle',
        'Are you sure you want to delete this vehicle?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: async () => {
              try {
                setIsLoading(true);
                await deleteVehicle(vehicleId, authToken);
                // Remove the vehicle from the list
                setVehicles(prevVehicles => 
                  prevVehicles.filter(v => v.id !== vehicleId)
                );
                Alert.alert('Success', 'Vehicle deleted successfully');
              } catch (error) {
                console.error('Delete error:', error);
                Alert.alert('Error', 'Failed to delete vehicle. Please try again.');
              } finally {
                setIsLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert('Error', 'Failed to delete vehicle');
    }
  };

  const handleViewDetails = (vehicle: Vehicle) => {
    // Use a simplified approach for navigation to avoid type errors
    router.navigate({
      pathname: "/vehicles/[id]",
      params: { id: vehicle.id }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.headerSimple}>
        <TouchableOpacity onPress={handleBackNavigation}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vehicles</Text>
        <TouchableOpacity onPress={handleAddVehicle}>
          <Ionicons name="add" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.loadingText}>Loading vehicles...</Text>
          </View>
        ) : vehicles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No vehicles found</Text>
            {user?.role === 'Admin' && (
              <TouchableOpacity 
                style={styles.emptyButton} 
                onPress={handleAddVehicle}
              >
                <Text style={styles.emptyButtonText}>Add Your First Vehicle</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {vehicles.map(vehicle => (
              <VehicleCard 
                key={vehicle.id} 
                vehicle={vehicle} 
                onDelete={user?.role === 'Admin' ? handleDeleteVehicle : undefined}
                onViewDetails={handleViewDetails}
              />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Update VehicleCard component to accept typed props
type VehicleCardProps = {
  vehicle: Vehicle;
  onDelete?: (id: string) => void;
  onViewDetails: (vehicle: Vehicle) => void;
};

function VehicleCard({ vehicle, onDelete, onViewDetails }: VehicleCardProps) {
  const getStatusColor = () => {
    switch(vehicle.status) {
      case 'active': return '#4CAF50';
      case 'maintenance': return '#FF9800';
      case 'inactive': return '#F44336';
      default: return '#757575';
    }
  };

  const statusText = () => {
    switch(vehicle.status) {
      case 'active': return 'Active';
      case 'maintenance': return 'Maintenance';
      case 'inactive': return 'Inactive';
      default: return 'Unknown';
    }
  };

  // Find primary driver or use the first one
  const primaryDriver = vehicle.drivers?.find(d => d.assignment?.isPrimary) || 
                        (vehicle.drivers?.length > 0 ? vehicle.drivers[0] : null);

  return (
    <View style={styles.vehicleCard}>
      <Image
        source={{ uri: vehicle.image || 'https://via.placeholder.com/300x150?text=No+Image' }}
        style={styles.vehicleImageFull}
        resizeMode="cover"
      />
      
      <View style={styles.vehicleContent}>
        <View style={styles.vehicleHeader}>
          <Text style={styles.vehicleName}>{vehicle.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{statusText()}</Text>
          </View>
        </View>
        
        <Text style={styles.plateText}>{vehicle.plate}</Text>
        
        <View style={styles.detailsList}>
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={16} color="#757575" />
            <Text style={styles.detailText}>
              {primaryDriver ? primaryDriver.name : 'No driver assigned'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="color-palette-outline" size={16} color="#757575" />
            <Text style={styles.detailText}>{vehicle.color || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#757575" />
            <Text style={styles.detailText}>Model: {vehicle.model || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="business-outline" size={16} color="#757575" />
            <Text style={styles.detailText}>{vehicle.ownership || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color="#757575" />
            <Text style={styles.detailText}>
              Updated: {new Date(vehicle.lastUpdated).toLocaleString() || 'N/A'}
            </Text>
          </View>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.viewDetailsButton}
            onPress={() => onViewDetails(vehicle)}
          >
            <Text style={styles.viewDetailsText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color="#000" />
          </TouchableOpacity>
          
          {onDelete && (
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => onDelete(vehicle.id)}
            >
              <Ionicons name="trash-outline" size={20} color="#F44336" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerSimple: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginVertical: 16,
  },
  emptyButton: {
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  vehicleCard: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  vehicleImageFull: {
    width: '100%',
    height: 180,
  },
  vehicleContent: {
    padding: 16,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  plateText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  detailsList: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#555',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    color: '#000',
    marginRight: 4,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
}); 