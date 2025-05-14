import { API_BASE_URL, ENDPOINTS, getHeaders } from './api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const TOKEN_KEY = 'fleetx_auth_token';
const USER_KEY = 'fleetx_user';

// Login user
export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.AUTH.LOGIN}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    
    // Check for inactive accounts before storing anything
    if (data.user && data.user.isActive === false) {
      throw new Error('Your account is deactivated. Please contact admin for activation.');
    }

    // Only save auth data if user is active
    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));

    return data;
  } catch (error) {
    throw error;
  }
};

// Register user
export const signup = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.AUTH.SIGNUP}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    // We no longer store token and user data for new registrations
    // User will need to login after registration
    
    return data;
  } catch (error) {
    throw error;
  }
};

// Get user profile
export const getProfile = async () => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.AUTH.PROFILE}`, {
      method: 'GET',
      headers: getHeaders(token),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get profile');
    }

    return data;
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
};

// Logout user
export const logout = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

// Check if user is logged in
export const isLoggedIn = async () => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return !!token;
  } catch (error) {
    return false;
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const userJson = await AsyncStorage.getItem(USER_KEY);
    const user = userJson ? JSON.parse(userJson) : null;
    return user;
  } catch (error) {
    return null;
  }
};

// Get auth token
export const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return token;
  } catch (error) {
    return null;
  }
}; 