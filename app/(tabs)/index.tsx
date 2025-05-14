import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function IndexScreen() {
  const { user, isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (isAuthenticated && user) {
      switch (user.role) {
        case 'Admin':
          router.replace('/dashboard/admin');
          break;
        case 'Driver':
          router.replace('/dashboard/driver');
          break;
        case 'Viewer':
          router.replace('/dashboard/viewer');
          break;
        default:
          router.replace('/auth/login');
      }
    } else {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, user]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Redirecting to your dashboard...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    color: '#666',
  },
});
