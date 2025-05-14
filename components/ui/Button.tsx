import React from 'react';
import { StyleSheet, TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { ArrowIcon } from './ArrowIcon';

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

  return (
    <TouchableOpacity 
      style={buttonStyle} 
      onPress={onPress} 
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={outlined || type === 'outline' ? '#000000' : '#ffffff'} />
      ) : (
        <View style={styles.buttonContent}>
          <Text style={textStyle}>{title}</Text>
          {icon && <ArrowIcon size={28} color={iconColor} />}
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
  },
}); 