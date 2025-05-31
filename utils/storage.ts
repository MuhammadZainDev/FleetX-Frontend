import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const KEYS = {
  HAS_SEEN_WELCOME: 'hasSeenWelcome',
};

// Check if user has seen welcome screen
export const checkHasSeenWelcome = async (): Promise<boolean> => {
  try {
    console.log('AsyncStorage: Checking if user has seen welcome screen...');
    const value = await AsyncStorage.getItem(KEYS.HAS_SEEN_WELCOME);
    console.log('AsyncStorage: Retrieved value:', value);
    const hasSeenWelcome = value === 'true';
    console.log('AsyncStorage: Has seen welcome:', hasSeenWelcome);
    return hasSeenWelcome;
  } catch (error) {
    console.error('AsyncStorage: Error checking welcome screen status:', error);
    return false;
  }
};

// Mark welcome screen as seen
export const setWelcomeScreenAsSeen = async (): Promise<void> => {
  try {
    console.log('AsyncStorage: Setting welcome screen as seen...');
    await AsyncStorage.setItem(KEYS.HAS_SEEN_WELCOME, 'true');
    console.log('AsyncStorage: Welcome screen status saved successfully');
  } catch (error) {
    console.error('AsyncStorage: Error saving welcome screen status:', error);
    throw error; // Re-throw to handle in calling function
  }
};

// Reset welcome screen status (useful for testing)
export const resetWelcomeScreenStatus = async (): Promise<void> => {
  try {
    console.log('AsyncStorage: Resetting welcome screen status...');
    await AsyncStorage.removeItem(KEYS.HAS_SEEN_WELCOME);
    console.log('AsyncStorage: Welcome screen status reset successfully');
  } catch (error) {
    console.error('AsyncStorage: Error resetting welcome screen status:', error);
    throw error;
  }
};

// Force show welcome screen on next app launch (for testing)
export const forceShowWelcomeScreen = async (): Promise<void> => {
  try {
    console.log('AsyncStorage: Forcing welcome screen to show on next launch...');
    await AsyncStorage.removeItem(KEYS.HAS_SEEN_WELCOME);
    console.log('AsyncStorage: Welcome screen will show on next app launch');
  } catch (error) {
    console.error('AsyncStorage: Error forcing welcome screen:', error);
    throw error;
  }
}; 