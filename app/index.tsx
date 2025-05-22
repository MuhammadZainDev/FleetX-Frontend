import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  // Always redirect to the splash screen
  return <Redirect href="/splash" />;
} 