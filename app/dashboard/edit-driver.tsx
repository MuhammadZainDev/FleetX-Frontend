import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import * as driverService from '@/services/driver.service';
import { Switch } from 'react-native';

export default function EditDriverScreen() {
  const { token, user } = useAuth();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    isActive: true
  });
  
  // Protect route - only Admin can access this page
  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
    } else if (user.role !== 'Admin') {
      // Redirect non-admin users to their respective dashboards
      if (user.role === 'Driver') {
        router.replace('/dashboard/driver');
      } else if (user.role === 'Viewer') {
        router.replace('/dashboard/viewer');
      }
    }
  }, [user]);

  // Fetch driver data
  useEffect(() => {
    const fetchDriver = async () => {
      if (!id) {
        Alert.alert('Error', 'Driver ID is required');
        router.back();
        return;
      }
      
      try {
        setLoading(true);
        const response = await driverService.getDriverById(id as string, token);
        
        if (response.success) {
          const { name, email, phoneNumber, isActive } = response.data;
          setFormData({
            name,
            email,
            phoneNumber: phoneNumber || '',
            isActive: isActive || false
          });
        } else {
          Alert.alert('Error', 'Failed to load driver data');
          router.back();
        }
      } catch (error) {
        console.error('Error fetching driver:', error);
        Alert.alert('Error', 'Failed to load driver data');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    
    fetchDriver();
  }, [id, token]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    // No validation needed as we're only updating the status
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setSaving(true);
      // Only send the isActive field to update
      const response = await driverService.updateDriver(id as string, { isActive: formData.isActive }, token);
      
      if (response.success) {
        Alert.alert(
          'Success',
          'Driver status updated successfully',
          [{ text: 'OK', onPress: () => router.push('/dashboard/drivers') }]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to update driver status');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update driver status');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading driver data...</Text>
      </SafeAreaView>
    );
  }
  
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
        <Text style={styles.title}>Edit Driver</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            placeholder="Enter driver's full name"
            value={formData.name}
            onChangeText={(value) => handleInputChange('name', value)}
            editable={false}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            placeholder="Enter email address"
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            editable={false}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
            value={formData.phoneNumber}
            onChangeText={(value) => handleInputChange('phoneNumber', value)}
            editable={false}
          />
        </View>
        
        <View style={styles.switchContainer}>
          <Text style={styles.label}>Active Status</Text>
          <View style={styles.switchRow}>
            <Switch
              value={formData.isActive}
              onValueChange={(value) => handleInputChange('isActive', value)}
              trackColor={{ false: '#e0e0e0', true: '#c8e6c9' }}
              thumbColor={formData.isActive ? '#4caf50' : '#f5f5f5'}
            />
          </View>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.submitButton,
            saving && styles.disabledButton
          ]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Update Driver</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  switchContainer: {
    marginBottom: 20,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  submitButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 30,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 