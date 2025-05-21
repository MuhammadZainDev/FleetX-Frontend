import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardLayout() {
  const { isAuthenticated, loading } = useAuth();

  // Protected route - redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, loading]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="admin" />
      <Stack.Screen name="driver" />
      <Stack.Screen name="viewer" />
      <Stack.Screen name="drivers" />
      <Stack.Screen name="add-driver" />
      <Stack.Screen name="edit-driver" />
      <Stack.Screen name="auto-expense" />
    </Stack>
  );
} 