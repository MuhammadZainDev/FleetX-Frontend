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
import { getAllAutoExpenses } from '@/services/autoExpense.service';
import { generateAutoExpensesPDF } from '@/services/pdf.service';

export default function AddAutoExpenseScreen() {
  const { token, user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isAmountValid, setIsAmountValid] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
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
  
  // Handle PDF download
  const handleDownloadStatement = async () => {
    try {
      setIsDownloading(true);
      
      if (!user) {
        toast.showToast('error', 'Error', 'User data is not available');
        return;
      }
      
      // Fetch all auto expenses for the current user
      const fetchAllData = async () => {
        try {
          const filters = { driverId: user.id };
          const allAutoExpenses = await getAllAutoExpenses(filters, token as any);
          return allAutoExpenses;
        } catch (error) {
          console.error('Error fetching all auto expenses:', error);
          throw error;
        }
      };
      
      const autoExpensesData = await fetchAllData();
      
      await generateAutoExpensesPDF(autoExpensesData, user, 'fleetx-auto-expenses-statement.pdf');
      
      toast.showToast('success', 'Success', 'Auto expenses statement has been generated and is ready to share.');
    } catch (error) {
      console.error('Error downloading statement:', error);
      toast.showToast('error', 'Error', 'Failed to generate auto expenses statement. Please try again.');
    } finally {
      setIsDownloading(false);
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
  
  // Open the date picker modal and set initial values
  const openDatePicker = () => {
    const today = new Date();
    
    if (formData.date) {
      try {
        // Parse the date string properly for Asia/Karachi timezone
        const dateStr = formData.date;
        const [year, month, day] = dateStr.split('-').map(Number);
        
        // Create date object with proper local date components
        const date = new Date(year, month - 1, day);
        
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
  
  // Confirm date picker selection
  const confirmDate = () => {
    // Create proper date string to avoid timezone issues
    const year = selectedYear;
    const month = String(selectedMonth + 1).padStart(2, '0');
    const day = String(selectedDay).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    console.log('Selected date in picker:', { year, month: selectedMonth + 1, day: selectedDay });
    console.log('Formatted date from picker:', formattedDate);
    
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
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Amount Field */}
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
          {formData.amount.length > 0 && !isAmountValid && (
            <Text style={styles.errorText}>
              Please enter a valid amount (up to 5 digits)
            </Text>
          )}
        </View>
        
        {/* Category Selector */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryContainer}>
            <View style={styles.categoryRow}>
              {[
                { type: 'Petrol', icon: 'car-outline' },
                { type: 'Car Accident', icon: 'alert-circle-outline' },
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
                { type: 'Maintenance', icon: 'construct-outline' },
                { type: 'Insurance', icon: 'shield-outline' },
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
                  name="wallet-outline" 
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
        
        {/* Date Field */}
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
        
        {/* Note Field */}
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
              placeholder="Add a note about this auto expense"
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
            (!isAmountValid || loading) && styles.disabledButton
          ]}
          onPress={handleSubmit}
          disabled={!isAmountValid || loading}
        >
          {loading ? (
            <>
              <ActivityIndicator color="#fff" size="small" style={{marginRight: 8}} />
              <Text style={styles.submitButtonText}>Please wait...</Text>
            </>
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={20} color="#fff" style={{marginRight: 8}} />
              <Text style={styles.submitButtonText}>Create Auto Expense Record</Text>
            </>
          )}
        </TouchableOpacity>
        
        {/* Download Statement Button */}
        <TouchableOpacity 
          style={[
            styles.downloadButton,
            isDownloading && styles.disabledDownloadButton
          ]}
          onPress={handleDownloadStatement}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <>
              <ActivityIndicator color="#000" size="small" style={{marginRight: 8}} />
              <Text style={styles.downloadButtonText}>Please wait...</Text>
            </>
          ) : (
            <>
              <Ionicons name="download-outline" size={20} color="#000" />
              <Text style={styles.downloadButtonText}>Download Auto Expenses Statement</Text>
            </>
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
  contentContainer: {
    paddingBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
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
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 4,
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
  },
  activeCategoryButton: {
    backgroundColor: '#000',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeCategoryText: {
    color: '#fff',
  },
  categoryIcon: {
    marginRight: 8,
  },
  emptyButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginLeft: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    paddingVertical: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  pickerContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  picker: {
    flex: 1,
    height: 200,
    marginHorizontal: 5,
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
  pickerText: {
    fontSize: 16,
    color: '#333',
  },
  selectedPickerText: {
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
  downloadButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  disabledDownloadButton: {
    opacity: 0.7,
  },
  downloadButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 