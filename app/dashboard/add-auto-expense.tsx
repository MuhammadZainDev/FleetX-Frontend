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
import { useToast } from '@/contexts/ToastContext';
import { createAutoExpense } from '@/services/autoExpense.service';

export default function AddAutoExpenseScreen() {
  const { token, user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isAmountValid, setIsAmountValid] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Other', // Default category
    note: '',
    driverId: '', // Will be auto-filled based on user role
    date: new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
  });

  // Date picker state
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  
  // Protect route - only Driver or Admin can access this page
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
  
  // Validate amount whenever it changes
  useEffect(() => {
    const amount = formData.amount;
    const amountValue = parseFloat(amount);
    setIsAmountValid(
      amount.length > 0 && 
      !isNaN(amountValue) && 
      amountValue > 0 && 
      amount.replace(/\..*/g, '').length <= 5
    );
  }, [formData.amount]);

  const handleInputChange = (field: string, value: string) => {
    // For amount field, restrict to maximum 5 digits
    if (field === 'amount' && value.length > 0) {
      // Remove non-numeric characters except decimal point
      const numericValue = value.replace(/[^\d.]/g, '');
      
      // Ensure we have at most one decimal point
      const parts = numericValue.split('.');
      let formattedValue = parts[0];
      
      // Limit to 5 digits before decimal point
      if (formattedValue.length > 5) {
        formattedValue = formattedValue.slice(0, 5);
      }
      
      // Add decimal part if it exists
      if (parts.length > 1) {
        formattedValue += '.' + parts[1];
      }
      
      // Check if amount is valid
      const amountValue = parseFloat(formattedValue);
      setIsAmountValid(
        formattedValue.length > 0 && 
        !isNaN(amountValue) && 
        amountValue > 0 && 
        formattedValue.replace(/\..*/g, '').length <= 5
      );
      
      setFormData(prev => ({
        ...prev,
        [field]: formattedValue
      }));
    } else {
      // If amount was changed to empty, update validity
      if (field === 'amount') {
        setIsAmountValid(false);
      }
      
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const validateForm = () => {
    const { amount, note, driverId } = formData;
    
    if (!amount.trim() || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast.showToast('error', 'Invalid Amount', 'Please enter a valid amount');
      return false;
    }
    
    // Check if amount exceeds 5 digits
    if (amount.replace(/\..*/g, '').length > 5) {
      toast.showToast('error', 'Invalid Amount', 'Amount cannot exceed 5 digits');
      return false;
    }
    
    if (!note.trim()) {
      toast.showToast('error', 'Missing Note', 'Note is required');
      return false;
    }
    
    if (!driverId) {
      toast.showToast('error', 'Missing Driver', 'Driver ID is required');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      // Ensure date is in correct format (YYYY-MM-DD)
      const dateObj = new Date(formData.date);
      console.log('Original date from form:', formData.date);
      console.log('Date converted to Date object:', dateObj);
      
      // Format with timezone adjustment to avoid off-by-one errors
      // Get year, month, and day components
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      
      // Create proper date string
      const formattedDate = `${year}-${month}-${day}`;
      console.log('Manually formatted date:', formattedDate);
      
      const data = {
        ...formData,
        amount: parseFloat(formData.amount),
        date: formattedDate
      };
      
      console.log('Submitting auto expense with data:', data);
      
      // Cast token to any to avoid TypeScript errors
      const response = await createAutoExpense(data, token as any);
      console.log('Auto expense created response:', response);
      
      // Try to refresh the driver dashboard if function is available
      if (global && (global as any).refreshDriverDashboard) {
        console.log('Refreshing driver dashboard after adding auto expense');
        (global as any).refreshDriverDashboard();
      }
      
      toast.showToast('success', 'Success', 'Auto expense record created successfully');
      
      // Navigate back after a short delay to let the toast appear
      setTimeout(() => {
        router.push('/dashboard/auto-expense' as any);
      }, 1000);
    } catch (error: any) {
      console.error('Error creating auto expense:', error);
      toast.showToast('error', 'Error', error.message || 'Failed to create auto expense record');
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
  
  // Handle back button
  const handleBackButton = () => {
    router.back();
  };
  
  // Handle manual date input
  const handleManualDateChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      date: value
    }));
  };
  
  // Show date picker modal
  const openDatePicker = () => {
    // Initialize picker with current date values
    const currentDate = new Date(formData.date);
    setSelectedYear(currentDate.getFullYear());
    setSelectedMonth(currentDate.getMonth());
    setSelectedDay(currentDate.getDate());
    setShowDatePicker(true);
  };
  
  // Confirm date picker selection
  const confirmDate = () => {
    // Create new date from picker values
    const newDate = new Date(selectedYear, selectedMonth, selectedDay);
    
    // Format date for form data (YYYY-MM-DD)
    const formattedDate = newDate.toISOString().split('T')[0];
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      date: formattedDate
    }));
    
    // Close picker
    setShowDatePicker(false);
  };
  
  // Helper functions for date picker
  const getYears = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
  };
  
  const getMonths = () => {
    return Array.from({ length: 12 }, (_, i) => i);
  };
  
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getDays = () => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackButton}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Add Auto Expense</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Amount Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Amount (AED)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Enter amount"
            value={formData.amount}
            onChangeText={value => handleInputChange('amount', value)}
          />
          {formData.amount.length > 0 && !isAmountValid && (
            <Text style={styles.errorText}>
              Please enter a valid amount (up to 5 digits)
            </Text>
          )}
        </View>
        
        {/* Category Selector */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryContainer}>
            {['Petrol', 'Car Accident', 'Maintenance', 'Insurance', 'Other'].map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  formData.category === category && styles.selectedCategoryButton
                ]}
                onPress={() => handleInputChange('category', category)}
              >
                <Text style={[
                  styles.categoryText,
                  formData.category === category && styles.selectedCategoryText
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Date Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity 
            style={styles.dateSelector}
            onPress={openDatePicker}
          >
            <Text style={styles.dateText}>{formatDate(formData.date)}</Text>
            <Ionicons name="calendar-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        
        {/* Note Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Note</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Enter note or description"
            value={formData.note}
            onChangeText={value => handleInputChange('note', value)}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
        
        {/* Submit Button */}
        <TouchableOpacity 
          style={[
            styles.submitButton,
            (!isAmountValid || loading) && styles.disabledButton
          ]}
          onPress={handleSubmit}
          disabled={!isAmountValid || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      
      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.pickerContainer}>
              {/* Year Picker */}
              <ScrollView 
                style={styles.picker}
                showsVerticalScrollIndicator={false}
              >
                {getYears().map(year => (
                  <TouchableOpacity
                    key={`year-${year}`}
                    style={[
                      styles.pickerItem,
                      selectedYear === year && styles.selectedPickerItem
                    ]}
                    onPress={() => setSelectedYear(year)}
                  >
                    <Text style={[
                      styles.pickerText,
                      selectedYear === year && styles.selectedPickerText
                    ]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              {/* Month Picker */}
              <ScrollView 
                style={styles.picker}
                showsVerticalScrollIndicator={false}
              >
                {getMonths().map(monthIndex => (
                  <TouchableOpacity
                    key={`month-${monthIndex}`}
                    style={[
                      styles.pickerItem,
                      selectedMonth === monthIndex && styles.selectedPickerItem
                    ]}
                    onPress={() => {
                      setSelectedMonth(monthIndex);
                      // Adjust day if it exceeds days in the selected month
                      const daysInNewMonth = getDaysInMonth(selectedYear, monthIndex);
                      if (selectedDay > daysInNewMonth) {
                        setSelectedDay(daysInNewMonth);
                      }
                    }}
                  >
                    <Text style={[
                      styles.pickerText,
                      selectedMonth === monthIndex && styles.selectedPickerText
                    ]}>
                      {new Date(2000, monthIndex, 1).toLocaleString('default', { month: 'long' })}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              {/* Day Picker */}
              <ScrollView 
                style={styles.picker}
                showsVerticalScrollIndicator={false}
              >
                {getDays().map(day => (
                  <TouchableOpacity
                    key={`day-${day}`}
                    style={[
                      styles.pickerItem,
                      selectedDay === day && styles.selectedPickerItem
                    ]}
                    onPress={() => setSelectedDay(day)}
                  >
                    <Text style={[
                      styles.pickerText,
                      selectedDay === day && styles.selectedPickerText
                    ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={confirmDate}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 4,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedCategoryButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
  },
  selectedCategoryText: {
    color: '#fff',
    fontWeight: '500',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  disabledButton: {
    backgroundColor: '#999',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  picker: {
    flex: 1,
    height: 200,
    marginHorizontal: 5,
  },
  pickerItem: {
    padding: 10,
    alignItems: 'center',
  },
  selectedPickerItem: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  pickerText: {
    fontSize: 16,
  },
  selectedPickerText: {
    fontWeight: 'bold',
    color: '#000',
  },
  confirmButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 