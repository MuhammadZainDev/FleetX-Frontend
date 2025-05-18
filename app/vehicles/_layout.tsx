import React, { useEffect } from 'react';
import { router, Slot } from 'expo-router';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function VehiclesLayout() {
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    // Check authentication status after loading
    if (!loading) {
      if (!isAuthenticated) {
        // Redirect to login if not authenticated
        router.replace('/auth/login');
      } else if (user && user.role !== 'Admin') {
        // Redirect non-admin users to their appropriate dashboard
        switch (user.role) {
          case 'Driver':
            router.replace('/dashboard/driver');
            break;
          case 'Viewer':
            router.replace('/dashboard/viewer');
            break;
          default:
            router.replace('/auth/login');
        }
      }
    }
  }, [loading, isAuthenticated, user]);

  // Show loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Show nothing while redirecting unauthorized users
  if (!isAuthenticated || (user && user.role !== 'Admin')) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Redirecting...</Text>
      </View>
    );
  }

  // Render the nested routes for authenticated admin users
  return <Slot />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#000',
  },
}); 