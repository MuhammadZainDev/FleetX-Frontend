import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, Dimensions, Alert, Modal } from 'react-native';
import { router, Link, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const { height, width } = Dimensions.get('window');
const topHeight = height * 0.3;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  
  const { login, loading } = useAuth();
  const params = useLocalSearchParams();

  // Check for notification message from signup page
  useEffect(() => {
    if (params.notification && !showNotification) {
      setNotificationMessage(params.notification as string);
      setShowNotification(true);
    }
  }, [params.notification]);

  const handleLogin = async () => {
    setError('');

    // Simple validation
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      // No need to manually handle loading state here as it's managed by the auth context
      // The loading state in the auth context will automatically be set to true during login
      await login(email, password);
      // If we get here, the login was successful and navigation happens in the auth context
    } catch (err: any) {
      // Show error message without any navigation
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Registration Success Notification Popup */}
      <Modal
        visible={showNotification}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNotification(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.notificationContainer}>
            <View style={styles.notificationHeader}>
              <ThemedText style={styles.notificationTitle}>Registration Successful</ThemedText>
            </View>
            
            <ThemedText style={styles.notificationMessage}>
              {notificationMessage}
            </ThemedText>
            
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => setShowNotification(false)}
            >
              <ThemedText style={styles.notificationButtonText}>Got it</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Black Background Top Section */}
      <View style={styles.topSection}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/logo/lightLogo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </View>
      
      {/* Form Section */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.formSection}
      >
        <View style={styles.formContainer}>
          <ThemedText style={styles.title}>Welcome back</ThemedText>
          <ThemedText style={styles.subtitle}>Log in to your account</ThemedText>
          
          {error ? (
            <View style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </View>
          ) : null}
          
          <Input
            icon="envelope.fill"
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <Input
            icon="lock.fill"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.forgotPassword}>
            <ThemedText style={styles.forgotPasswordText}>Forgot password?</ThemedText>
          </TouchableOpacity>

          <Button
            title="Login"
            onPress={handleLogin}
            loading={loading}
            fullWidth
            outlined
          />

          <View style={styles.signupContainer}>
            <ThemedText style={styles.signupText}>Don't have an account? </ThemedText>
            <Link href="/auth/signup" asChild>
              <TouchableOpacity>
                <ThemedText style={styles.signupLink}>Sign up</ThemedText>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topSection: {
    height: topHeight,
    backgroundColor: '#000000',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
  },
  formSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  formContainer: {
    padding: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    fontFamily: 'Inter',
  },
  errorContainer: {
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#E53935',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: 8,
  },
  forgotPasswordText: {
    color: '#000000',
    fontFamily: 'Inter',
    fontSize: 14,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signupText: {
    fontFamily: 'Inter',
    color: '#666',
  },
  signupLink: {
    color: '#000000',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notificationContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: width * 0.85,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  notificationHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  notificationTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 10,
    textAlign: 'center',
  },
  notificationMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  notificationButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  notificationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 