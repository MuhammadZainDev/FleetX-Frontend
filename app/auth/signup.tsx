import React, { useState } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, Dimensions, ScrollView } from 'react-native';
import { router, Link } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';

const { height } = Dimensions.get('window');
const topHeight = height * 0.3;

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { signup, loading } = useAuth();

  const handleSignup = async () => {
    setError('');

    // Simple validation
    if (!name || !email || !phone || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      // Prepare user data
      const userData = {
        name,
        email,
        phoneNumber: phone,
        password,
        role: 'Driver', // Changed from Admin to Driver
      };
      
      // Call signup from auth context
      await signup(userData);
      
      // After signup, redirect to login page with a notification parameter
      router.replace({
        pathname: '/auth/login',
        params: { 
          notification: 'Your account has been created successfully! Please wait for admin approval. You will receive an email once your account is activated.'
        }
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
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
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.formContainer}>
            <ThemedText style={styles.title}>Create Account</ThemedText>
            <ThemedText style={styles.subtitle}>Join FleetX today</ThemedText>
            
            {error ? (
              <View style={styles.errorContainer}>
                <ThemedText style={styles.errorText}>{error}</ThemedText>
              </View>
            ) : null}
            
            <Input
              icon="person-outline"
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
            />

            <Input
              icon="envelope.fill"
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />

            <Input
              icon="phone-enabled"
              placeholder="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <Input
              icon="lock.fill"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Button
              title="Create Driver Account"
              onPress={handleSignup}
              loading={loading}
              fullWidth
              icon={true}
              outlined
            />

            <View style={styles.loginContainer}>
              <ThemedText style={styles.loginText}>Already have an account? </ThemedText>
              <Link href="/auth/login" asChild>
                <TouchableOpacity>
                  <ThemedText style={styles.loginLink}>Log in</ThemedText>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
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
  scrollView: {
    flexGrow: 1,
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    fontFamily: 'Inter',
    color: '#666',
  },
  loginLink: {
    color: '#000000',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
}); 