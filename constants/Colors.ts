/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const primaryColor = '#3498db';
const secondaryColor = '#f39c12';
const accentColor = '#9b59b6';
const errorColor = '#e74c3c';
const successColor = '#2ecc71';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    primary: primaryColor,
    secondary: secondaryColor,
    accent: accentColor,
    error: errorColor,
    success: successColor,
    buttonBackground: primaryColor,
    buttonText: '#ffffff',
    inputBackground: '#f5f5f5',
    cardBackground: '#ffffff',
    border: '#e0e0e0',
  },
  dark: {
    // Always using light theme, so dark theme values are the same as light
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    primary: primaryColor,
    secondary: secondaryColor,
    accent: accentColor,
    error: errorColor,
    success: successColor,
    buttonBackground: primaryColor,
    buttonText: '#ffffff',
    inputBackground: '#f5f5f5',
    cardBackground: '#ffffff',
    border: '#e0e0e0',
  },
};
