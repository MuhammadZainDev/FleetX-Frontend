import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { checkHasSeenWelcome } from '@/utils/storage';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Check if user has seen welcome screen
  useEffect(() => {
    const checkWelcomeStatus = async () => {
      try {
        console.log('Checking welcome screen status...');
        const seen = await checkHasSeenWelcome();
        console.log('Has seen welcome:', seen);
        setHasSeenWelcome(seen);
      } catch (error) {
        console.error('Error checking welcome status:', error);
        // If error, assume first launch
        setHasSeenWelcome(false);
      }
    };
    
    checkWelcomeStatus();
  }, []);

  // Set ready after minimum splash duration
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 2000); // Show splash for at least 2 seconds
    
    return () => clearTimeout(timer);
  }, []);

  // Handle navigation based on welcome screen status and auth
  useEffect(() => {
    // Wait until auth loading is complete, welcome status is checked, and minimum splash time has passed
    if (!loading && hasSeenWelcome !== null && isReady) {
      console.log('Navigation conditions met:', {
        loading,
        hasSeenWelcome,
        isReady,
        isAuthenticated,
        userRole: user?.role
      });
      
      // If user hasn't seen welcome screen (first launch), show it
      if (!hasSeenWelcome) {
        console.log('First launch detected, showing welcome screen');
        router.replace('/welcome');
        return;
      }
      
      // User has seen welcome screen, proceed with normal auth flow
      if (!isAuthenticated) {
        console.log('User not authenticated, redirecting to login');
        router.replace('/auth/login');
      } else if (user) {
        console.log('User authenticated, redirecting to dashboard:', user.role);
        // Route based on user role
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
            console.log('Unknown role, redirecting to login');
            router.replace('/auth/login');
        }
      } else {
        console.log('User object empty, redirecting to login');
        router.replace('/auth/login');
      }
    }
  }, [isAuthenticated, user, loading, hasSeenWelcome, isReady, router]);

  return (
    <View style={styles.container}>
      <Image 
        source={require('@/assets/logo/darkLogo.png')} 
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: width * 0.5,
    height: height * 0.2,
  },
}); 