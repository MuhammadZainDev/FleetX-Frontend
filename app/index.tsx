import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { checkHasSeenWelcome } from '@/utils/storage';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);

  useEffect(() => {
    const checkWelcomeStatus = async () => {
      const seen = await checkHasSeenWelcome();
      setHasSeenWelcome(seen);
      setLoading(false);
    };
    
    checkWelcomeStatus();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // If user has not seen welcome screen, show it
  if (!hasSeenWelcome) {
    return <Redirect href="/welcome" />;
  }

  // If user is already logged in, redirect to appropriate dashboard
  if (user) {
    if (user.role === 'Driver') {
      return <Redirect href="/dashboard/driver" />;
    } else if (user.role === 'Admin') {
      return <Redirect href="/dashboard/admin" />;
    } else if (user.role === 'Viewer') {
      return <Redirect href="/dashboard/viewer" />;
    }
  }
  
  // Otherwise redirect to login
  return <Redirect href="/auth/login" />;
} 