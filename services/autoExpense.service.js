import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, ENDPOINTS, getHeaders } from './api.config';

// Helper function to replace URL parameters
const replaceParams = (url, params) => {
  let result = url;
  Object.keys(params).forEach(key => {
    result = result.replace(`:${key}`, params[key]);
  });
  return result;
};

// Helper function to safely parse JSON response
const safeJsonParse = async (response) => {
  try {
    const text = await response.text();
    return text.length ? JSON.parse(text) : {};
  } catch (error) {
    console.error('Error parsing JSON:', error);
    throw new Error('Invalid response format');
  }
};

// Get all auto expenses with optional filters
export const getAllAutoExpenses = async (filters = {}, token = null) => {
  try {
    // Get token if not provided
    if (!token) {
      token = await AsyncStorage.getItem('fleetx_auth_token');
    }

    // Build query string from filters
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined) {
        queryParams.append(key, filters[key]);
      }
    });

    // Append query string to URL if we have filters
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    
    // Make API call
    const response = await fetch(
      `${API_BASE_URL}${ENDPOINTS.AUTO_EXPENSE.GET_ALL}${queryString}`,
      {
        method: 'GET',
        headers: getHeaders(token),
      }
    );

    if (!response.ok) {
      throw new Error(`Error fetching auto expenses: ${response.status}`);
    }

    return await safeJsonParse(response);
  } catch (error) {
    console.error('Error in getAllAutoExpenses:', error);
    throw error;
  }
};

// Get auto expense by ID
export const getAutoExpenseById = async (id, token = null) => {
  try {
    // Get token if not provided
    if (!token) {
      token = await AsyncStorage.getItem('fleetx_auth_token');
    }

    const endpoint = replaceParams(ENDPOINTS.AUTO_EXPENSE.GET_ONE, { id });
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Error fetching auto expense: ${response.status}`);
    }

    return await safeJsonParse(response);
  } catch (error) {
    console.error('Error in getAutoExpenseById:', error);
    throw error;
  }
};

// Get auto expense summary for a driver
export const getAutoExpensesSummary = async (driverId, period = 'monthly', token = null) => {
  try {
    // Get token if not provided
    if (!token) {
      token = await AsyncStorage.getItem('fleetx_auth_token');
    }

    const endpoint = replaceParams(ENDPOINTS.AUTO_EXPENSE.GET_SUMMARY, { driverId });
    
    const response = await fetch(`${API_BASE_URL}${endpoint}?period=${period}`, {
      method: 'GET',
      headers: getHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Error fetching auto expense summary: ${response.status}`);
    }

    return await safeJsonParse(response);
  } catch (error) {
    console.error('Error in getAutoExpensesSummary:', error);
    throw error;
  }
};

// Create a new auto expense
export const createAutoExpense = async (autoExpenseData, token = null) => {
  try {
    // Get token if not provided
    if (!token) {
      token = await AsyncStorage.getItem('fleetx_auth_token');
    }

    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.AUTO_EXPENSE.CREATE}`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(autoExpenseData),
    });

    if (!response.ok) {
      const errorData = await safeJsonParse(response);
      throw new Error(errorData.message || `Error creating auto expense: ${response.status}`);
    }

    return await safeJsonParse(response);
  } catch (error) {
    console.error('Error in createAutoExpense:', error);
    throw error;
  }
};

// Update an existing auto expense
export const updateAutoExpense = async (id, autoExpenseData, token = null) => {
  try {
    // Get token if not provided
    if (!token) {
      token = await AsyncStorage.getItem('fleetx_auth_token');
    }

    const endpoint = replaceParams(ENDPOINTS.AUTO_EXPENSE.UPDATE, { id });
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(autoExpenseData),
    });

    if (!response.ok) {
      const errorData = await safeJsonParse(response);
      throw new Error(errorData.message || `Error updating auto expense: ${response.status}`);
    }

    return await safeJsonParse(response);
  } catch (error) {
    console.error('Error in updateAutoExpense:', error);
    throw error;
  }
};

// Delete an auto expense
export const deleteAutoExpense = async (id, token = null) => {
  try {
    // Get token if not provided
    if (!token) {
      token = await AsyncStorage.getItem('fleetx_auth_token');
    }

    const endpoint = replaceParams(ENDPOINTS.AUTO_EXPENSE.DELETE, { id });
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Error deleting auto expense: ${response.status}`);
    }

    return await safeJsonParse(response);
  } catch (error) {
    console.error('Error in deleteAutoExpense:', error);
    throw error;
  }
}; 