import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, TextInput, View, Text, TouchableOpacity, Animated } from 'react-native';
import { Colors } from '@/constants/Colors';
import { InputIcon } from './InputIcons';

type InputProps = {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  error?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  icon?: string;
};

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  error,
  keyboardType = 'default',
  icon,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const borderColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#DDDDDD', '#000000']
  });

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FFFFFF', '#FFFFFF']
  });

  const iconColor = isFocused ? '#666666' : '#BBBBBB';

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Animated.View
        style={[
          styles.inputContainer,
          { borderColor, backgroundColor },
          error && styles.errorInput,
        ]}
      >
        {icon && (
          <View style={styles.leftIconContainer}>
            <InputIcon
              name={icon}
              size={24}
              color={iconColor}
            />
          </View>
        )}
        <TextInput
          style={[
            styles.input, 
            icon && styles.inputWithLeftIcon,
            { fontFamily: 'Inter' }
          ]}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          placeholderTextColor="#999"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.iconContainer}
          >
            <InputIcon
              name={isPasswordVisible ? 'eye.slash.fill' : 'eye.fill'}
              size={24}
              color={iconColor}
            />
          </TouchableOpacity>
        )}
      </Animated.View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: '#000000',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    height: 56,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Inter',
  },
  inputWithLeftIcon: {
    paddingLeft: 8,
  },
  focusedInput: {
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  errorInput: {
    borderColor: '#E53935',
  },
  errorText: {
    color: '#E53935',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Inter',
  },
  iconContainer: {
    paddingHorizontal: 16,
    height: '100%',
    justifyContent: 'center',
  },
  leftIconContainer: {
    paddingLeft: 16,
    height: '100%',
    justifyContent: 'center',
  },
}); 