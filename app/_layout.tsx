import React, { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Inter: require('../assets/fonts/inter.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <AuthProvider>
        <ToastProvider>
          <RootLayoutNav />
          <StatusBar style="dark" />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const { user, isAuthenticated, loading } = useAuth();
  const pathname = usePathname();

  // Redirect users based on their role
  useEffect(() => {
    // Do not redirect if we're on an auth page
    if (pathname.includes('/auth/')) {
      return;
    }
    
    // Do not redirect if already on a dashboard page
    if (pathname.includes('/dashboard/')) {
      return;
    }
    
    // Do not redirect if on settings page
    if (pathname === '/settings') {
      return;
    }
    
    // Do not redirect if on vehicles pages
    if (pathname.includes('/vehicles')) {
      return;
    }
    
    // Only redirect when not loading
    if (!loading) {
      if (!isAuthenticated) {
        router.replace('/auth/login');
      } else if (user) {
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
        }
      }
    }
  }, [isAuthenticated, user, loading, pathname]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#ffffff' } }}>
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="auth/login" options={{ headerShown: false }} />
      <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="vehicles" options={{ headerShown: false }} />
      <Stack.Screen name="vehicles/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
      <Stack.Screen name="dashboard" />
    </Stack>
  );
}
