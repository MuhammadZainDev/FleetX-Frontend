import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ComponentProps } from 'react';

type InputIconProps = {
  name: string;
  size?: number;
  color?: string;
};

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

export function InputIcon({ name, size = 24, color = '#999' }: InputIconProps) {
  return (
    <View style={[styles.iconContainer, { opacity: 0.8 }]}>
      <MaterialIcons name={getIconName(name)} size={size} color={color} />
    </View>
  );
}

function getIconName(name: string): MaterialIconName {
  switch (name) {
    case 'envelope.fill':
      return 'mail-outline';
    case 'lock.fill':
      return 'lock-outline';
    case 'eye.fill':
      return 'visibility';
    case 'eye.slash.fill':
      return 'visibility-off';
    case 'person-outline':
      return 'person-outline';
    case 'phone-enabled':
      return 'phone-iphone';
    default:
      return 'help-outline';
  }
}

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 