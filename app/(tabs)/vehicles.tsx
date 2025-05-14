import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView, TouchableOpacity, TextInput } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';

// Mock data for vehicles
const VEHICLE_DATA = [
  {
    id: '1',
    name: 'Toyota Camry',
    plate: 'ABC-1234',
    status: 'active',
    type: 'sedan',
    driver: 'John Doe',
    location: 'Downtown',
    lastUpdated: '10 min ago',
    fuelLevel: 75,
  },
  {
    id: '2',
    name: 'Honda Civic',
    plate: 'XYZ-5678',
    status: 'active',
    type: 'sedan',
    driver: 'Jane Smith',
    location: 'North Side',
    lastUpdated: '5 min ago',
    fuelLevel: 25,
  },
  {
    id: '3',
    name: 'Ford F-150',
    plate: 'DEF-9012',
    status: 'maintenance',
    type: 'truck',
    driver: 'Mike Johnson',
    location: 'Service Center',
    lastUpdated: '2 hours ago',
    fuelLevel: 50,
  },
  {
    id: '4',
    name: 'Chevrolet Suburban',
    plate: 'GHI-3456',
    status: 'inactive',
    type: 'suv',
    driver: 'Unassigned',
    location: 'Headquarters',
    lastUpdated: '1 day ago',
    fuelLevel: 90,
  },
  {
    id: '5',
    name: 'Tesla Model 3',
    plate: 'JKL-7890',
    status: 'active',
    type: 'sedan',
    driver: 'Alex Brown',
    location: 'East Side',
    lastUpdated: '15 min ago',
    fuelLevel: 80,
  },
];

export default function VehiclesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'maintenance', 'inactive'

  const filteredVehicles = VEHICLE_DATA.filter(vehicle => {
    const matchesQuery = vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         vehicle.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         vehicle.driver.toLowerCase().includes(searchQuery.toLowerCase());
                         
    const matchesFilter = filter === 'all' || vehicle.status === filter;
    
    return matchesQuery && matchesFilter;
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title">Vehicles</ThemedText>
          <TouchableOpacity style={styles.addButton}>
            <IconSymbol name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <IconSymbol name="magnifyingglass" size={18} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search vehicles or drivers..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <IconSymbol name="xmark.circle.fill" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.filterContainer}>
          <FilterButton 
            title="All" 
            active={filter === 'all'} 
            onPress={() => setFilter('all')} 
          />
          <FilterButton 
            title="Active" 
            active={filter === 'active'} 
            onPress={() => setFilter('active')} 
          />
          <FilterButton 
            title="Maintenance" 
            active={filter === 'maintenance'} 
            onPress={() => setFilter('maintenance')} 
          />
          <FilterButton 
            title="Inactive" 
            active={filter === 'inactive'} 
            onPress={() => setFilter('inactive')} 
          />
        </View>

        <ThemedText style={styles.resultCount}>
          {filteredVehicles.length} {filteredVehicles.length === 1 ? 'vehicle' : 'vehicles'} found
        </ThemedText>

        {filteredVehicles.map(vehicle => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function FilterButton({ title, active, onPress }) {
  return (
    <TouchableOpacity 
      style={[styles.filterButton, active && styles.activeFilterButton]}
      onPress={onPress}
    >
      <ThemedText style={[styles.filterText, active && styles.activeFilterText]}>
        {title}
      </ThemedText>
    </TouchableOpacity>
  );
}

function VehicleCard({ vehicle }) {
  const getStatusColor = () => {
    switch(vehicle.status) {
      case 'active': return Colors.light.success;
      case 'maintenance': return Colors.light.secondary;
      case 'inactive': return Colors.light.error;
      default: return Colors.light.icon;
    }
  };

  const getVehicleIcon = () => {
    switch(vehicle.type) {
      case 'sedan': return 'car.fill';
      case 'truck': return 'box.truck.fill';
      case 'suv': return 'car.fill';
      default: return 'car.fill';
    }
  };

  return (
    <Card style={styles.vehicleCard}>
      <View style={styles.vehicleHeader}>
        <View style={styles.vehicleNameContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
          <ThemedText type="defaultSemiBold" style={styles.vehicleName}>
            {vehicle.name}
          </ThemedText>
        </View>
        <ThemedText style={styles.plateNumber}>{vehicle.plate}</ThemedText>
      </View>
      
      <View style={styles.vehicleDetails}>
        <View style={styles.detailItem}>
          <IconSymbol name={getVehicleIcon()} size={14} color={Colors.light.icon} />
          <ThemedText style={styles.detailText}>{vehicle.type}</ThemedText>
        </View>
        <View style={styles.detailItem}>
          <IconSymbol name="person.fill" size={14} color={Colors.light.icon} />
          <ThemedText style={styles.detailText}>{vehicle.driver}</ThemedText>
        </View>
        <View style={styles.detailItem}>
          <IconSymbol name="location.fill" size={14} color={Colors.light.icon} />
          <ThemedText style={styles.detailText}>{vehicle.location}</ThemedText>
        </View>
        <View style={styles.detailItem}>
          <IconSymbol name="clock.fill" size={14} color={Colors.light.icon} />
          <ThemedText style={styles.detailText}>{vehicle.lastUpdated}</ThemedText>
        </View>
      </View>

      <View style={styles.fuelBar}>
        <View style={[styles.fuelLevel, { width: `${vehicle.fuelLevel}%`, backgroundColor: getFuelColor(vehicle.fuelLevel) }]} />
      </View>
      <ThemedText style={styles.fuelText}>Fuel: {vehicle.fuelLevel}%</ThemedText>

      <TouchableOpacity style={styles.viewDetailsButton}>
        <ThemedText style={styles.viewDetailsText}>View Details</ThemedText>
        <IconSymbol name="chevron.right" size={14} color={Colors.light.primary} />
      </TouchableOpacity>
    </Card>
  );
}

function getFuelColor(level) {
  if (level > 60) return Colors.light.success;
  if (level > 30) return Colors.light.secondary;
  return Colors.light.error;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: Colors.light.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: Colors.light.text,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  activeFilterButton: {
    backgroundColor: Colors.light.primary,
  },
  filterText: {
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
  },
  resultCount: {
    marginBottom: 16,
    color: '#666',
  },
  vehicleCard: {
    marginBottom: 16,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  vehicleName: {
    fontSize: 16,
  },
  plateNumber: {
    fontSize: 14,
    backgroundColor: '#f0f0f0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  vehicleDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 6,
    fontSize: 14,
  },
  fuelBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  fuelLevel: {
    height: '100%',
    borderRadius: 3,
  },
  fuelText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  viewDetailsText: {
    color: Colors.light.primary,
    marginRight: 4,
  },
}); 