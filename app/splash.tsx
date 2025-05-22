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

  // Check if user has seen welcome screen
  useEffect(() => {
    const checkWelcomeStatus = async () => {
      const seen = await checkHasSeenWelcome();
      setHasSeenWelcome(seen);
    };
    
    checkWelcomeStatus();
  }, []);

  // Handle navigation based on welcome screen status and auth
  useEffect(() => {
    // Wait until both loading is complete and welcome status is checked
    if (!loading && hasSeenWelcome !== null) {
      // If user hasn't seen welcome screen, show it first
      if (!hasSeenWelcome) {
        router.replace('/welcome');
        return;
      }
      
      // Otherwise, proceed with normal auth flow
      if (!isAuthenticated) {
        router.replace('/auth/login');
      } else if (user) {
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
            router.replace('/auth/login');
        }
      }
    }
  }, [isAuthenticated, user, loading, hasSeenWelcome]);

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