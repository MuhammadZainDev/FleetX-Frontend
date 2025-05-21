import { API_BASE_URL, ENDPOINTS, getHeaders } from './api.config';
import { getToken as getAuthToken } from './auth.service';

// Get all users (non-admin users for admin dashboard)
export const getAllUsers = async (token = null) => {
  try {
    // Get token if not provided
    const authToken = token || await getAuthToken();
    
    if (!authToken) {
      throw new Error('Authentication required');
    }

    // We'll use the driver endpoint since it already provides user data
    // but we'll filter out admin users on the frontend
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.DRIVER.GET_ALL}`, {
      method: 'GET',
      headers: getHeaders(authToken),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get users');
    }

    // For this endpoint, the data is nested in data
    return data;
  } catch (error) {
    console.error('Get all users error:', error);
    throw error;
  }
};

// Get a single user by ID
export const getUserById = async (userId, token = null) => {
  try {
    // Get token if not provided
    const authToken = token || await getAuthToken();
    
    if (!authToken) {
      throw new Error('Authentication required');
    }

    // We can use the driver endpoint for this as well
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.DRIVER.GET_ONE.replace(':id', userId)}`, {
      method: 'GET',
      headers: getHeaders(authToken),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get user');
    }

    return data;
  } catch (error) {
    console.error(`Get user ${userId} error:`, error);
    throw error;
  }
};

// Update user active status
export const updateUserStatus = async (userId, isActive, token = null) => {
  try {
    // Get token if not provided
    const authToken = token || await getAuthToken();
    
    if (!authToken) {
      throw new Error('Authentication required');
    }

    // Use the driver update endpoint
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.DRIVER.UPDATE.replace(':id', userId)}`, {
      method: 'PUT',
      headers: getHeaders(authToken),
      body: JSON.stringify({ isActive }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update user status');
    }

    return data;
  } catch (error) {
    console.error(`Update user ${userId} status error:`, error);
    throw error;
  }
}; 