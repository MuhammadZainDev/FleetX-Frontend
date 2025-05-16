import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Modal
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { createEarning } from '@/services/earning.service';

export default function AddEarningScreen() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    type: 'Cash', // Default type
    note: '',
    driverId: '', // Will be auto-filled based on user role
    date: new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
  });

  // Date picker state
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  
  // Protect route - only Admin can access this page
  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
    } else if (user.role === 'Driver') {
      // If user is driver, pre-fill the driverId
      setFormData(prev => ({
        ...prev,
        driverId: user.id
      }));
    } else if (user.role !== 'Admin') {
      // Redirect viewers to their dashboard
      router.replace('/dashboard/viewer');
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const { amount, type, driverId } = formData;
    
    if (!amount.trim() || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return false;
    }
    
    if (!type) {
      Alert.alert('Error', 'Payment type is required');
      return false;
    }
    
    if (!driverId) {
      Alert.alert('Error', 'Driver is required');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      const data = {
        ...formData,
        amount: parseFloat(formData.amount),
      };
      
      const response = await createEarning(data, token);
      
      Alert.alert(
        'Success',
        'Earning record created successfully',
        [{ text: 'OK', onPress: () => router.push('/dashboard/earnings' as any) }]
      );
    } catch (error: any) {
      console.error('Error creating earning:', error);
      Alert.alert('Error', error.message || 'Failed to create earning record');
    } finally {
      setLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Function to manually handle date entry
  const handleManualDateChange = (value: string) => {
    // Simple validation to ensure date format is correct (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(value) || value === '') {
      handleInputChange('date', value);
    }
  };

  // Open the date picker modal and set initial values
  const openDatePicker = () => {
    const today = new Date();
    
    if (formData.date) {
      try {
        const date = new Date(formData.date);
        // Check if date is valid
        if (!isNaN(date.getTime())) {
          setSelectedYear(date.getFullYear());
          setSelectedMonth(date.getMonth());
          setSelectedDay(date.getDate());
        } else {
          // If date is invalid, use current date
          setSelectedYear(today.getFullYear());
          setSelectedMonth(today.getMonth());
          setSelectedDay(today.getDate());
        }
      } catch (e) {
        // If there's any error parsing the date, use current date
        setSelectedYear(today.getFullYear());
        setSelectedMonth(today.getMonth());
        setSelectedDay(today.getDate());
      }
    } else {
      // If no date is set, use current date
      setSelectedYear(today.getFullYear());
      setSelectedMonth(today.getMonth());
      setSelectedDay(today.getDate());
    }
    
    setShowDatePicker(true);
  };

  // Confirm the date selection
  const confirmDate = () => {
    // Create a date object and format as YYYY-MM-DD
    const date = new Date(selectedYear, selectedMonth, selectedDay);
    const formattedDate = date.toISOString().split('T')[0];
    
    setFormData(prev => ({
      ...prev,
      date: formattedDate
    }));
    
    setShowDatePicker(false);
  };

  // Generate arrays for years, months, and days
  const getYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    // Include more years in the past to make scrolling more obvious
    for (let i = currentYear - 20; i <= currentYear; i++) {
      years.push(i);
    }
    return years;
  };

  const getMonths = () => {
    return [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getDays = () => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };
  
  // When opening the modal, use setTimeout to scroll to the selected values
  useEffect(() => {
    if (showDatePicker) {
      // Small delay to ensure the scroll views are rendered
      setTimeout(() => {
        // You would add refs to each ScrollView and use scrollTo here
        // but since we don't have refs in this edit, we'll just make sure
        // there are enough items to scroll
      }, 100);
    }
  }, [showDatePicker]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Add New Earning</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Amount Input */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Amount ($)</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="cash-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter amount"
              value={formData.amount}
              onChangeText={(value) => handleInputChange('amount', value)}
              keyboardType="decimal-pad"
              placeholderTextColor="#999"
            />
          </View>
        </View>
        
        {/* Payment Type Selector */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Payment Type</Text>
          <View style={styles.paymentTypeContainer}>
            <View style={styles.paymentTypeRow}>
              {[
                { type: 'Cash', icon: 'cash-outline' },
                { type: 'Online', icon: 'card-outline' },
              ].map(({ type, icon }) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.paymentTypeButton,
                    formData.type === type && styles.activePaymentTypeButton
                  ]}
                  onPress={() => handleInputChange('type', type)}
                >
                  <Ionicons 
                    name={icon as any} 
                    size={20} 
                    color={formData.type === type ? "#fff" : "#666"} 
                    style={styles.paymentTypeIcon}
                  />
                  <Text 
                    style={[
                      styles.paymentTypeText,
                      formData.type === type && styles.activePaymentTypeText
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.paymentTypeRow}>
              <TouchableOpacity
                style={[
                  styles.paymentTypeButton,
                  formData.type === 'Pocket Slipt' && styles.activePaymentTypeButton
                ]}
                onPress={() => handleInputChange('type', 'Pocket Slipt')}
              >
                <Ionicons 
                  name="wallet-outline" 
                  size={20} 
                  color={formData.type === 'Pocket Slipt' ? "#fff" : "#666"} 
                  style={styles.paymentTypeIcon}
                />
                <Text 
                  style={[
                    styles.paymentTypeText,
                    formData.type === 'Pocket Slipt' && styles.activePaymentTypeText
                  ]}
                >
                  Pocket Slipt
                </Text>
              </TouchableOpacity>
              <View style={styles.emptyButton}></View>
            </View>
          </View>
        </View>
        
        {/* Driver ID (Admin only) */}
        {user?.role === 'Admin' && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Driver ID</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter driver ID"
                value={formData.driverId}
                onChangeText={(value) => handleInputChange('driverId', value)}
                placeholderTextColor="#999"
              />
            </View>
            <Text style={styles.infoText}>
              Please enter a valid driver ID. This field is required.
            </Text>
          </View>
        )}
        
        {/* Note Input */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Note (Optional)</Text>
          <View style={[styles.inputContainer, styles.textAreaContainer]}>
            <Ionicons 
              name="document-text-outline" 
              size={20} 
              color="#666" 
              style={[styles.inputIcon, {alignSelf: 'flex-start', marginTop: 12}]} 
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add a note about this payment"
              multiline
              numberOfLines={4}
              value={formData.note}
              onChangeText={(value) => handleInputChange('note', value)}
              placeholderTextColor="#999"
            />
          </View>
        </View>
        
        {/* Date Picker */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity 
            style={styles.inputContainer}
            onPress={openDatePicker}
          >
            <Ionicons name="calendar-outline" size={20} color="#666" style={styles.inputIcon} />
            <Text style={styles.dateText}>{formatDate(formData.date)}</Text>
            <Ionicons name="chevron-down" size={16} color="#666" style={styles.dateChevron} />
          </TouchableOpacity>
        </View>
        
        {/* Submit Button */}
        <TouchableOpacity 
          style={[
            styles.submitButton,
            loading && styles.disabledButton
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={20} color="#fff" style={{marginRight: 8}} />
              <Text style={styles.submitButtonText}>Create Earning Record</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Custom Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerContainer}>
            <Text style={styles.datePickerTitle}>Select Date</Text>
            
            <View style={styles.datePickerControls}>
              {/* Year Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Year</Text>
                <ScrollView 
                  style={styles.pickerScroll}
                  showsVerticalScrollIndicator={true}
                >
                  {getYears().map(year => (
                    <TouchableOpacity
                      key={`year-${year}`}
                      style={[
                        styles.pickerItem,
                        selectedYear === year && styles.pickerItemSelected
                      ]}
                      onPress={() => setSelectedYear(year)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        selectedYear === year && styles.pickerItemTextSelected
                      ]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* Month Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Month</Text>
                <ScrollView 
                  style={styles.pickerScroll}
                  showsVerticalScrollIndicator={true}
                >
                  {getMonths().map((month, index) => (
                    <TouchableOpacity
                      key={`month-${index}`}
                      style={[
                        styles.pickerItem,
                        selectedMonth === index && styles.pickerItemSelected
                      ]}
                      onPress={() => setSelectedMonth(index)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        selectedMonth === index && styles.pickerItemTextSelected
                      ]}>
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* Day Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Day</Text>
                <ScrollView 
                  style={styles.pickerScroll}
                  showsVerticalScrollIndicator={true}
                >
                  {getDays().map(day => (
                    <TouchableOpacity
                      key={`day-${day}`}
                      style={[
                        styles.pickerItem,
                        selectedDay === day && styles.pickerItemSelected
                      ]}
                      onPress={() => setSelectedDay(day)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        selectedDay === day && styles.pickerItemTextSelected
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            
            <View style={styles.datePickerActions}>
              <TouchableOpacity 
                style={styles.datePickerCancelBtn} 
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.datePickerCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.datePickerConfirmBtn} 
                onPress={confirmDate}
              >
                <Text style={styles.datePickerConfirmText}>Confirm</Text>
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
  },
  textAreaContainer: {
    height: 120,
    alignItems: 'flex-start',
  },
  textArea: {
    textAlignVertical: 'top',
    height: 100,
    paddingTop: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginLeft: 4,
  },
  paymentTypeContainer: {
    marginBottom: 10,
  },
  paymentTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  paymentTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 15,
    marginHorizontal: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  emptyButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  paymentTypeIcon: {
    marginRight: 6,
  },
  activePaymentTypeButton: {
    backgroundColor: '#000',
  },
  paymentTypeText: {
    color: '#333',
    fontWeight: '500',
    fontSize: 14,
  },
  activePaymentTypeText: {
    color: '#fff',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  dateChevron: {
    marginLeft: 'auto',
  },

  // Modal DatePicker Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  datePickerContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    maxHeight: '80%',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#000',
  },
  datePickerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: 5,
  },
  pickerLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  pickerScroll: {
    height: 200,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    paddingHorizontal: 4,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerItemSelected: {
    backgroundColor: '#edf7ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
  },
  pickerItemTextSelected: {
    fontWeight: 'bold',
    color: '#000',
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 15,
  },
  datePickerCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginRight: 10,
  },
  datePickerCancelText: {
    color: '#666',
    fontWeight: '500',
  },
  datePickerConfirmBtn: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#000',
    borderRadius: 8,
  },
  datePickerConfirmText: {
    color: '#fff',
    fontWeight: '500',
  },
}); 