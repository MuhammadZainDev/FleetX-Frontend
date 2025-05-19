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
import { createExpense } from '@/services/expense.service';

export default function AddExpenseScreen() {
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
      
      console.log('Submitting expense with data:', data);
      
      const response = await createExpense(data, token);
      console.log('Expense created response:', response);
      
      // Try to refresh the driver dashboard if function is available
      if (global && (global as any).refreshDriverDashboard) {
        console.log('Refreshing driver dashboard after adding expense');
        (global as any).refreshDriverDashboard();
      }
      
      toast.showToast('success', 'Success', 'Expense record created successfully');
      
      // Navigate back after a short delay to let the toast appear
      setTimeout(() => {
        router.push('/dashboard/driver' as any);
      }, 1000);
    } catch (error: any) {
      console.error('Error creating expense:', error);
      toast.showToast('error', 'Error', error.message || 'Failed to create expense record');
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

  // Function to handle back button
  const handleBackButton = () => {
    // Navigate to the expenses list instead of using router.back()
    router.push('/dashboard/all-expenses' as any);
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
    console.log('Selected date in picker:', date);
    
    // Manually format the date to avoid timezone issues
    const year = selectedYear;
    const month = String(selectedMonth + 1).padStart(2, '0');
    const day = String(selectedDay).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    console.log('Formatted date from picker:', formattedDate);
    
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/dashboard/all-expenses' as any)}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Expense</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Amount Input */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Amount (AED)</Text>
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

        {/* Category Selector */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryContainer}>
            <View style={styles.categoryRow}>
              {[
                { type: 'Fuel', icon: 'flame-outline' },
                { type: 'Maintenance', icon: 'construct-outline' },
              ].map(({ type, icon }) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.categoryButton,
                    formData.category === type && styles.activeCategoryButton
                  ]}
                  onPress={() => handleInputChange('category', type)}
                >
                  <Ionicons 
                    name={icon as any} 
                    size={20} 
                    color={formData.category === type ? "#fff" : "#666"} 
                    style={styles.categoryIcon}
                  />
                  <Text 
                    style={[
                      styles.categoryText,
                      formData.category === type && styles.activeCategoryText
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.categoryRow}>
              {[
                { type: 'Insurance', icon: 'shield-outline' },
                { type: 'Parking', icon: 'car-outline' },
              ].map(({ type, icon }) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.categoryButton,
                    formData.category === type && styles.activeCategoryButton
                  ]}
                  onPress={() => handleInputChange('category', type)}
                >
                  <Ionicons 
                    name={icon as any} 
                    size={20} 
                    color={formData.category === type ? "#fff" : "#666"} 
                    style={styles.categoryIcon}
                  />
                  <Text 
                    style={[
                      styles.categoryText,
                      formData.category === type && styles.activeCategoryText
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.categoryRow}>
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  formData.category === 'Other' && styles.activeCategoryButton
                ]}
                onPress={() => handleInputChange('category', 'Other')}
              >
                <Ionicons 
                  name="cart-outline" 
                  size={20} 
                  color={formData.category === 'Other' ? "#fff" : "#666"} 
                  style={styles.categoryIcon}
                />
                <Text 
                  style={[
                    styles.categoryText,
                    formData.category === 'Other' && styles.activeCategoryText
                  ]}
                >
                  Other
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
        
        {/* Date Input */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity 
            style={styles.inputContainer}
            onPress={openDatePicker}
          >
            <Ionicons name="calendar-outline" size={20} color="#666" style={styles.inputIcon} />
            <Text style={[styles.input, !formData.date && styles.placeholderText]}>
              {formData.date ? formatDate(formData.date) : 'Select date'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#666" style={styles.dateChevron} />
          </TouchableOpacity>
        </View>
        
        {/* Note Input */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Note</Text>
          <View style={[styles.inputContainer, styles.textAreaContainer]}>
            <Ionicons 
              name="document-text-outline" 
              size={20} 
              color="#666" 
              style={[styles.inputIcon, {alignSelf: 'flex-start', marginTop: 12}]} 
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add a note about this expense"
              multiline
              numberOfLines={4}
              value={formData.note}
              onChangeText={(value) => handleInputChange('note', value)}
              placeholderTextColor="#999"
            />
          </View>
        </View>
        
        {/* Submit Button */}
        <TouchableOpacity 
          style={[
            styles.submitButton,
            (loading || !isAmountValid) && styles.disabledButton
          ]}
          onPress={handleSubmit}
          disabled={loading || !isAmountValid}
        >
          {loading ? (
            <>
              <ActivityIndicator color="#fff" size="small" style={{marginRight: 8}} />
              <Text style={styles.submitButtonText}>Please wait...</Text>
            </>
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={20} color="#fff" style={{marginRight: 8}} />
              <Text style={styles.submitButtonText}>Create Expense Record</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
      
      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>Select Date</Text>
              <TouchableOpacity 
                onPress={() => setShowDatePicker(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.datePickerContent}>
              {/* Year Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Year</Text>
                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  style={styles.pickerScroll}
                  contentContainerStyle={styles.pickerScrollContent}
                >
                  {getYears().map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.pickerItem,
                        selectedYear === year && styles.selectedPickerItem
                      ]}
                      onPress={() => setSelectedYear(year)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        selectedYear === year && styles.selectedPickerItemText
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
                  showsVerticalScrollIndicator={false}
                  style={styles.pickerScroll}
                  contentContainerStyle={styles.pickerScrollContent}
                >
                  {getMonths().map((month, index) => (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.pickerItem,
                        selectedMonth === index && styles.selectedPickerItem
                      ]}
                      onPress={() => setSelectedMonth(index)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        selectedMonth === index && styles.selectedPickerItemText
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
                  showsVerticalScrollIndicator={false}
                  style={styles.pickerScroll}
                  contentContainerStyle={styles.pickerScrollContent}
                >
                  {getDays().map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.pickerItem,
                        selectedDay === day && styles.selectedPickerItem
                      ]}
                      onPress={() => setSelectedDay(day)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        selectedDay === day && styles.selectedPickerItemText
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
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
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 24,
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
  categoryContainer: {
    marginBottom: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryButton: {
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
  activeCategoryButton: {
    backgroundColor: '#000',
  },
  categoryIcon: {
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeCategoryText: {
    color: '#fff',
  },
  emptyButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  dateChevron: {
    marginLeft: 8,
  },
  placeholderText: {
    color: '#999',
  },
  submitButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Modal DatePicker Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  datePickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    padding: 5,
  },
  datePickerContent: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: 5,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  pickerScroll: {
    height: 200,
  },
  pickerScrollContent: {
    paddingVertical: 10,
  },
  pickerItem: {
    paddingVertical: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginVertical: 2,
  },
  selectedPickerItem: {
    backgroundColor: '#000',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedPickerItemText: {
    color: '#FFF',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#000',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 