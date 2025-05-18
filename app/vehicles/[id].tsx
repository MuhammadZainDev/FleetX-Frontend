import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { useLocalSearchParams, router, Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { getVehicleById } from '@/services/vehicle.service';

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
  admin: {
    id: string;
    name: string;
    email: string;
  };
};

export default function VehicleDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { authToken, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    const fetchVehicleDetails = async () => {
      try {
        setIsLoading(true);
        
        if (!authToken) {
          throw new Error('Authentication required');
        }
        
        if (!id) {
          throw new Error('Vehicle ID is required');
        }
        
        const response = await getVehicleById(id as string, authToken);
        
        if (response && response.vehicle) {
          setVehicle(response.vehicle);
        } else {
          throw new Error('Failed to load vehicle details');
        }
      } catch (error) {
        console.error('Error fetching vehicle details:', error);
        Alert.alert('Error', 'Failed to load vehicle details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehicleDetails();
  }, [id, authToken]);

  const handleBackNavigation = () => {
    router.back();
  };

  const handleEditVehicle = () => {
    router.push({
      pathname: '/vehicles/edit-vehicle',
      params: { id: vehicle?.id }
    });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return '#4CAF50';
      case 'maintenance': return '#FF9800';
      case 'inactive': return '#F44336';
      default: return '#757575';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'active': return 'Active';
      case 'maintenance': return 'Maintenance';
      case 'inactive': return 'Inactive';
      default: return 'Unknown';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.headerSimple}>
        <TouchableOpacity onPress={handleBackNavigation}>
          <Ionicons name="arrow-back-outline" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vehicle Details</Text>
        {user?.role === 'Admin' && (
          <TouchableOpacity onPress={handleEditVehicle}>
            <Ionicons name="create-outline" size={24} color="black" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.loadingText}>Loading vehicle details...</Text>
          </View>
        ) : vehicle ? (
          <View style={styles.detailsContainer}>
            <Image
              source={{ uri: vehicle.image || 'https://via.placeholder.com/300x150?text=No+Image' }}
              style={styles.vehicleImage}
              resizeMode="cover"
            />
            
            <View style={styles.headerInfo}>
              <Text style={styles.vehicleName}>{vehicle.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(vehicle.status) }]}>
                <Text style={styles.statusText}>{getStatusText(vehicle.status)}</Text>
              </View>
            </View>

            <Text style={styles.plateNumber}>{vehicle.plate}</Text>
            
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Vehicle Information</Text>
              <View style={styles.detailItem}>
                <Ionicons name="car-outline" size={20} color="#757575" />
                <Text style={styles.detailLabel}>Type:</Text>
                <Text style={styles.detailText}>{vehicle.type || 'N/A'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="color-palette-outline" size={20} color="#757575" />
                <Text style={styles.detailLabel}>Color:</Text>
                <Text style={styles.detailText}>{vehicle.color || 'N/A'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={20} color="#757575" />
                <Text style={styles.detailLabel}>Model:</Text>
                <Text style={styles.detailText}>{vehicle.model || 'N/A'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="business-outline" size={20} color="#757575" />
                <Text style={styles.detailLabel}>Ownership:</Text>
                <Text style={styles.detailText}>{vehicle.ownership || 'N/A'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="locate-outline" size={20} color="#757575" />
                <Text style={styles.detailLabel}>Location:</Text>
                <Text style={styles.detailText}>{vehicle.location || 'N/A'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={20} color="#757575" />
                <Text style={styles.detailLabel}>Last Updated:</Text>
                <Text style={styles.detailText}>
                  {new Date(vehicle.lastUpdated).toLocaleString() || 'N/A'}
                </Text>
              </View>
            </View>

            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Assigned Drivers</Text>
              {vehicle.drivers && vehicle.drivers.length > 0 ? (
                vehicle.drivers.map((driver) => (
                  <View key={driver.id} style={styles.driverItem}>
                    <View style={styles.driverAvatar}>
                      <Text style={styles.driverInitial}>{driver.name.charAt(0)}</Text>
                    </View>
                    <View style={styles.driverInfo}>
                      <Text style={styles.driverName}>{driver.name}</Text>
                      <Text style={styles.driverContact}>{driver.phoneNumber}</Text>
                      <Text style={styles.driverEmail}>{driver.email}</Text>
                    </View>
                    {driver.assignment.isPrimary && (
                      <View style={styles.primaryBadge}>
                        <Text style={styles.primaryText}>Primary</Text>
                      </View>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.noDrivers}>No drivers assigned</Text>
              )}
            </View>

            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Added By</Text>
              <View style={styles.adminItem}>
                <Ionicons name="person-outline" size={20} color="#757575" />
                <Text style={styles.adminName}>{vehicle.admin?.name || 'Unknown'}</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.editButton}
              onPress={handleEditVehicle}
            >
              <Text style={styles.editButtonText}>Edit Details</Text>
              <Ionicons name="create-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={60} color="#F44336" />
            <Text style={styles.errorText}>Vehicle not found</Text>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackNavigation}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  detailsContainer: {
    padding: 16,
  },
  vehicleImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vehicleName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  plateNumber: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  sectionContainer: {
    marginBottom: 24,
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 8,
    width: 100,
  },
  detailText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  driverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  driverAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverInitial: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  driverContact: {
    fontSize: 14,
    color: '#666',
  },
  driverEmail: {
    fontSize: 13,
    color: '#999',
  },
  primaryBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  primaryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  noDrivers: {
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 10,
  },
  adminItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
  },
  adminName: {
    fontSize: 16,
    marginLeft: 8,
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: '#000',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 24,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
}); 