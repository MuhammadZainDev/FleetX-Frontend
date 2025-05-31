import React from 'react';
import { StyleSheet, TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

type ButtonProps = {
  title: string;
  onPress: () => void;
  type?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: boolean;
  outlined?: boolean;
};

export function Button({
  title,
  onPress,
  type = 'primary',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon = false,
  outlined = false,
}: ButtonProps) {
  const buttonStyle = [
    styles.button,
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    type === 'primary' && styles.primaryButton,
    type === 'secondary' && styles.secondaryButton,
    type === 'outline' && styles.outlineButton,
    outlined && styles.outlinedButton,
  ];

  const textStyle = [
    styles.text,
    type === 'primary' && styles.primaryText,
    type === 'secondary' && styles.secondaryText,
    type === 'outline' && styles.outlineText,
    outlined && styles.outlinedText,
  ];

  const iconColor = outlined || type === 'outline' ? '#ffffff' : '#ffffff';
  
  // Force white text for loading state, regardless of button type
  const loadingTextStyle = type === 'outline' && !outlined ? 
    { color: '#000000', fontWeight: '600' as const, fontSize: 16 } : 
    { color: '#FFFFFF', fontWeight: '600' as const, fontSize: 16 };

  return (
    <TouchableOpacity 
      style={buttonStyle} 
      onPress={onPress} 
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <Text style={loadingTextStyle}>
          Please wait...
        </Text>
      ) : (
        <View style={styles.buttonContent}>
          <Text style={textStyle}>{title}</Text>
          {/* Only show icon if icon prop is true and it's not a login/auth button */}
          {icon && !title.includes('Login') && !title.includes('Create') && (
            <Ionicons name="arrow-forward" size={24} color={iconColor} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 120,
    minHeight: 56, // Ensure consistent height even during loading
  },
  fullWidth: {
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#000000',
  },
  secondaryButton: {
    backgroundColor: '#000000',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#000000',
  },
  outlinedButton: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#000000',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  primaryText: {
    color: '#ffffff',
  },
  secondaryText: {
    color: '#ffffff',
  },
  outlineText: {
    color: '#000000',
  },
  outlinedText: {
    color: '#ffffff',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  }
}); 