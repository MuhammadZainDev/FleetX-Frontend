import React from 'react';
import { StyleSheet, View, Image, StatusBar, SafeAreaView, Text } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';

export default function WelcomeScreen() {
  const handleLogin = () => {
    router.push('/auth/login');
  };

  const handleSignup = () => {
    router.push('/auth/signup');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Top left corner image */}
      <Image 
        source={require('@/assets/img/welcome.png')} 
        style={styles.cornerImage}
        resizeMode="cover"
      />
      
      <View style={styles.content}>
        <View style={styles.innerContent}>
          <View style={styles.logoWrapper}>
            <Image 
              source={require('@/assets/logo/darkLogo.png')} 
              style={styles.logo} 
              resizeMode="contain"
            />
          </View>
          
          <Text style={styles.welcomeText}>
            Welcome to FleetX
          </Text>
          
          <Text style={styles.subtitleText}>
            Start your journey to efficient fleet management
          </Text>
        </View>
      </View>

      <View style={styles.buttonsContainer}>
        <Button 
          title="Login" 
          onPress={handleLogin} 
          fullWidth 
          type="primary" 
        />
        <Button 
          title="Create Account" 
          onPress={handleSignup} 
          fullWidth 
          type="outline" 
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingLeft: 0,
    paddingRight: 0,
  },
  cornerImage: {
    position: 'absolute',
    top: 0,
    left: 0, 
    width: 230,
    height: 230,
    zIndex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoWrapper: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: -15, // Negative margin to pull text closer to logo
  },
  logo: {
    width: 160,
    height: 160,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    fontFamily: 'Inter',
    marginTop: 0,
  },
  subtitleText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 5,
    textAlign: 'center',
    paddingHorizontal: 20,
    fontFamily: 'Inter',
  },
  buttonsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 16,
  },
}); 