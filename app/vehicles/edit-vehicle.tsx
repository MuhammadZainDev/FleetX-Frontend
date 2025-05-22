import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TextInput,
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Modal,
  FlatList
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getVehicleById, updateVehicle, getAvailableDrivers } from '@/services/vehicle.service';
import * as ImagePicker from 'expo-image-picker';

// Types
type Driver = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  selected?: boolean;
};

type Vehicle = {
  id: string;
  name: string;
  plate: string;
  status: string;
  type: string;
  location: string;
  color: string;
  model: string;
  ownership: string;
  image: string;
  drivers: Array<{
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
  }>;
};

export default function EditVehicleScreen() {
  const { id } = useLocalSearchParams();
  const { authToken } = useAuth();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [plate, setPlate] = useState('');
  const [status, setStatus] = useState('active');
  const [statusText, setStatusText] = useState('Active');
  const [type, setType] = useState('');
  const [location, setLocation] = useState('');
  const [color, setColor] = useState('');
  const [model, setModel] = useState('');
  const [ownership, setOwnership] = useState('');
  const [selectedDrivers, setSelectedDrivers] = useState<Driver[]>([]);
  const [image, setImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);

  // Load vehicle data and available drivers
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        if (!authToken) {
          throw new Error('Authentication required');
        }
        
        if (!id) {
          throw new Error('Vehicle ID is required');
        }

        // Fetch vehicle details
        const vehicleResponse = await getVehicleById(id as string, authToken);
        if (vehicleResponse && vehicleResponse.vehicle) {
          const vehicle = vehicleResponse.vehicle;
          
          // Set form data
          setName(vehicle.name);
          setPlate(vehicle.plate);
          setStatus(vehicle.status);
          setStatusText(getStatusText(vehicle.status));
          setType(vehicle.type || '');
          setLocation(vehicle.location || '');
          setColor(vehicle.color || '');
          setModel(vehicle.model || '');
          setOwnership(vehicle.ownership || '');
          setImage(vehicle.image || null);
          setOriginalImage(vehicle.image || null);
          
          // Fetch available drivers
          const driversResponse = await getAvailableDrivers(authToken);
          if (driversResponse && driversResponse.drivers) {
            // Map all available drivers and mark those already assigned to this vehicle
            const allDrivers = driversResponse.drivers.map((driver: Driver) => {
              const isAssigned = vehicle.drivers.some(
                (vehicleDriver) => vehicleDriver.id === driver.id
              );
              return {
                ...driver,
                selected: isAssigned
              };
            });
            
            setAvailableDrivers(allDrivers);
            setSelectedDrivers(allDrivers.filter(d => d.selected));
          }
        } else {
          throw new Error('Failed to load vehicle details');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.showToast('error', 'Error', 'Failed to load vehicle data');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, authToken]);

  // Handle image selection
  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        toast.showToast('error', 'Permission Required', 'Please grant camera roll permissions to upload an image');
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      toast.showToast('error', 'Error', 'Failed to select image');
    }
  };

  // Handle status selection
  const selectStatus = (value: string, text: string) => {
    setStatus(value);
    setStatusText(text);
    setShowStatusModal(false);
  };

  // Get status text from status value
  const getStatusText = (status: string) => {
    switch(status) {
      case 'active': return 'Active';
      case 'maintenance': return 'Maintenance';
      case 'inactive': return 'Inactive';
      default: return 'Unknown';
    }
  };

  // Handle driver selection
  const toggleDriverSelection = (driver: Driver) => {
    const updatedDrivers = availableDrivers.map(d => {
      if (d.id === driver.id) {
        return { ...d, selected: !d.selected };
      }
      return d;
    });
    
    setAvailableDrivers(updatedDrivers);
    
    // Update selected drivers list
    const newSelectedDrivers = updatedDrivers.filter(d => d.selected);
    setSelectedDrivers(newSelectedDrivers);
  };

  // Confirm driver selection
  const confirmDriverSelection = () => {
    setShowDriverModal(false);
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Validate form
      if (!name || !plate) {
        toast.showToast('error', 'Error', 'Vehicle name and plate number are required');
        return;
      }
      
      // Start loading
      setIsSubmitting(true);
      
      if (!authToken) {
        throw new Error('Authentication required');
      }
      
      // Get IDs of selected drivers
      const driverIds = selectedDrivers.map(driver => driver.id);
      
      // Prepare vehicle data
      const vehicleData = {
        id: id as string,
        name,
        plate,
        status,
        type,
        location,
        color,
        model,
        ownership,
        driverIds
      };
      
      // Check if image was changed
      const imageToUpload = image !== originalImage ? image : null;
      
      // Submit the form
      const response = await updateVehicle(vehicleData, imageToUpload, authToken);
      
      // Show success message
      toast.showToast('success', 'Success', 'Vehicle updated successfully');
      
      // Navigate back after a short delay to let the toast appear
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (error) {
      console.error('Error updating vehicle:', error);
      toast.showToast('error', 'Error', 'Failed to update vehicle. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackNavigation = () => {
    router.back();
  };

  // Get the selected drivers display text
  const getSelectedDriversText = () => {
    if (selectedDrivers.length === 0) {
      return 'Select driver(s)';
    } else if (selectedDrivers.length === 1) {
      return selectedDrivers[0].name;
    } else {
      return `${selectedDrivers.length} drivers selected`;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.headerSimple}>
        <TouchableOpacity onPress={handleBackNavigation} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Vehicle</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#000" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <View style={styles.formContainer}>
              {/* Image Picker */}
              <TouchableOpacity 
                style={styles.imagePickerContainer} 
                onPress={pickImage}
              >
                {image ? (
                  <Image source={{ uri: image }} style={styles.previewImage} />
                ) : (
                  <View style={styles.placeholderContainer}>
                    <Ionicons name="camera-outline" size={36} color="#aaa" />
                    <Text style={styles.placeholderText}>Change Vehicle Image</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Required Fields Section */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Required Information</Text>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Vehicle Name</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="car-outline" size={20} color="#aaa" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={name}
                      onChangeText={setName}
                      placeholder="Toyota"
                      placeholderTextColor="#aaa"
                    />
                  </View>
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Plate Number</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="pricetag-outline" size={20} color="#aaa" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={plate}
                      onChangeText={setPlate}
                      placeholder="ABC-123"
                      placeholderTextColor="#aaa"
                    />
                  </View>
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Status</Text>
                  <TouchableOpacity 
                    style={styles.inputContainer}
                    onPress={() => setShowStatusModal(true)}
                  >
                    <Ionicons name="ellipsis-horizontal-circle-outline" size={20} color="#aaa" style={styles.inputIcon} />
                    <Text style={[styles.selectorText, { color: status === 'active' ? '#4CAF50' : status === 'maintenance' ? '#FF9800' : '#F44336' }]}>
                      {statusText}
                    </Text>
                    <Ionicons name="chevron-down-outline" size={20} color="#aaa" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Additional Information Section */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Additional Information</Text>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Vehicle Type</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="construct-outline" size={20} color="#aaa" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={type}
                      onChangeText={setType}
                      placeholder="Sedan"
                      placeholderTextColor="#aaa"
                    />
                  </View>
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Color</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="color-palette-outline" size={20} color="#aaa" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={color}
                      onChangeText={setColor}
                      placeholder="Red"
                      placeholderTextColor="#aaa"
                    />
                  </View>
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Model Year</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="calendar-outline" size={20} color="#aaa" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={model}
                      onChangeText={setModel}
                      placeholder="2023"
                      placeholderTextColor="#aaa"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Current Location</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="location-outline" size={20} color="#aaa" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={location}
                      onChangeText={setLocation}
                      placeholder="Karachi"
                      placeholderTextColor="#aaa"
                    />
                  </View>
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Ownership</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="business-outline" size={20} color="#aaa" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={ownership}
                      onChangeText={setOwnership}
                      placeholder="Company"
                      placeholderTextColor="#aaa"
                    />
                  </View>
                </View>
              </View>

              {/* Driver Assignment Section */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Assign Driver(s)</Text>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Select Driver(s)</Text>
                  <TouchableOpacity 
                    style={styles.inputContainer}
                    onPress={() => setShowDriverModal(true)}
                  >
                    <Ionicons name="people-outline" size={20} color="#aaa" style={styles.inputIcon} />
                    <Text style={styles.selectorText}>
                      {getSelectedDriversText()}
                    </Text>
                    <Ionicons name="chevron-down-outline" size={20} color="#aaa" />
                  </TouchableOpacity>
                  
                  {/* Show selected drivers */}
                  {selectedDrivers.length > 0 && (
                    <View style={styles.selectedDriversContainer}>
                      {selectedDrivers.map(driver => (
                        <View key={driver.id} style={styles.selectedDriverChip}>
                          <Text style={styles.selectedDriverText}>{driver.name}</Text>
                          <TouchableOpacity 
                            style={styles.chipRemoveButton}
                            onPress={() => toggleDriverSelection(driver)}
                          >
                            <Ionicons name="close-circle-outline" size={18} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Update Vehicle</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Status Selection Modal */}
      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Status</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <Ionicons name="close-outline" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => selectStatus('active', 'Active')}
            >
              <View style={[styles.statusIndicator, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.modalItemText}>Active</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => selectStatus('maintenance', 'Maintenance')}
            >
              <View style={[styles.statusIndicator, { backgroundColor: '#FF9800' }]} />
              <Text style={styles.modalItemText}>Maintenance</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => selectStatus('inactive', 'Inactive')}
            >
              <View style={[styles.statusIndicator, { backgroundColor: '#F44336' }]} />
              <Text style={styles.modalItemText}>Inactive</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Driver Selection Modal */}
      <Modal
        visible={showDriverModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDriverModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Driver(s)</Text>
              <TouchableOpacity onPress={() => setShowDriverModal(false)}>
                <Ionicons name="close-outline" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            {availableDrivers.length > 0 ? (
              <FlatList
                data={availableDrivers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.driverItem, 
                      item.selected && styles.selectedDriverItem
                    ]}
                    onPress={() => toggleDriverSelection(item)}
                  >
                    <View style={styles.driverAvatar}>
                      <Text style={styles.driverInitial}>{item.name.charAt(0)}</Text>
                    </View>
                    <View style={styles.driverInfo}>
                      <Text style={styles.driverName}>{item.name}</Text>
                      <Text style={styles.driverContact}>{item.phoneNumber}</Text>
                    </View>
                    <View style={styles.checkboxContainer}>
                      <Ionicons 
                        name={item.selected ? "checkbox" : "square-outline"} 
                        size={24} 
                        color={item.selected ? "#000" : "#aaa"} 
                      />
                    </View>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <Text style={styles.noDrivers}>No drivers available</Text>
            )}
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={confirmDriverSelection}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
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
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  formContainer: {
    padding: 16,
  },
  imagePickerContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 24,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    marginTop: 12,
    color: '#aaa',
    fontSize: 16,
  },
  formSection: {
    marginBottom: 24,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: '#555',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    height: 56,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginHorizontal: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#333',
  },
  selectorText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    paddingHorizontal: 8,
  },
  selectedDriversContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  selectedDriverChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    margin: 4,
  },
  selectedDriverText: {
    color: '#fff',
    marginRight: 4,
    fontSize: 14,
  },
  chipRemoveButton: {
    padding: 2,
  },
  submitButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemText: {
    fontSize: 16,
    marginLeft: 10,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  // Driver item styles
  driverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    borderRadius: 8,
  },
  selectedDriverItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
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
  checkboxContainer: {
    paddingHorizontal: 12,
  },
  noDrivers: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  clearButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  clearButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
}); 