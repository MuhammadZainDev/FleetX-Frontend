import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const KEYS = {
  HAS_SEEN_WELCOME: 'hasSeenWelcome',
};

// Check if user has seen welcome screen
export const checkHasSeenWelcome = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(KEYS.HAS_SEEN_WELCOME);
    return value === 'true';
  } catch (error) {
    console.error('Error checking welcome screen status:', error);
    return false;
  }
};

// Mark welcome screen as seen
export const setWelcomeScreenAsSeen = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.HAS_SEEN_WELCOME, 'true');
  } catch (error) {
    console.error('Error saving welcome screen status:', error);
  }
};

// Reset welcome screen status (useful for testing)
export const resetWelcomeScreenStatus = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(KEYS.HAS_SEEN_WELCOME);
  } catch (error) {
    console.error('Error resetting welcome screen status:', error);
  }
}; 