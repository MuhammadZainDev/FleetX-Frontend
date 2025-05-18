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

// Get all expenses with optional filters
export const getAllExpenses = async (filters = {}, token = null) => {
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
      `${API_BASE_URL}${ENDPOINTS.EXPENSE.GET_ALL}${queryString}`,
      {
        method: 'GET',
        headers: getHeaders(token),
      }
    );

    if (!response.ok) {
      throw new Error(`Error fetching expenses: ${response.status}`);
    }

    return await safeJsonParse(response);
  } catch (error) {
    console.error('Error in getAllExpenses:', error);
    throw error;
  }
};

// Get expense by ID
export const getExpenseById = async (id, token = null) => {
  try {
    // Get token if not provided
    if (!token) {
      token = await AsyncStorage.getItem('fleetx_auth_token');
    }

    const endpoint = replaceParams(ENDPOINTS.EXPENSE.GET_ONE, { id });
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Error fetching expense: ${response.status}`);
    }

    return await safeJsonParse(response);
  } catch (error) {
    console.error('Error in getExpenseById:', error);
    throw error;
  }
};

// Get expense summary for a driver
export const getExpensesSummary = async (driverId, period = 'monthly', token = null) => {
  try {
    // Get token if not provided
    if (!token) {
      token = await AsyncStorage.getItem('fleetx_auth_token');
    }

    const endpoint = replaceParams(ENDPOINTS.EXPENSE.GET_SUMMARY, { driverId });
    
    const response = await fetch(`${API_BASE_URL}${endpoint}?period=${period}`, {
      method: 'GET',
      headers: getHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Error fetching expense summary: ${response.status}`);
    }

    return await safeJsonParse(response);
  } catch (error) {
    console.error('Error in getExpensesSummary:', error);
    throw error;
  }
};

// Create a new expense
export const createExpense = async (expenseData, token = null) => {
  try {
    // Get token if not provided
    if (!token) {
      token = await AsyncStorage.getItem('fleetx_auth_token');
    }

    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.EXPENSE.CREATE}`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(expenseData),
    });

    if (!response.ok) {
      throw new Error(`Error creating expense: ${response.status}`);
    }

    return await safeJsonParse(response);
  } catch (error) {
    console.error('Error in createExpense:', error);
    throw error;
  }
};

// Update an existing expense
export const updateExpense = async (id, expenseData, token = null) => {
  try {
    // Get token if not provided
    if (!token) {
      token = await AsyncStorage.getItem('fleetx_auth_token');
    }

    const endpoint = replaceParams(ENDPOINTS.EXPENSE.UPDATE, { id });
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(expenseData),
    });

    if (!response.ok) {
      throw new Error(`Error updating expense: ${response.status}`);
    }

    return await safeJsonParse(response);
  } catch (error) {
    console.error('Error in updateExpense:', error);
    throw error;
  }
};

// Delete an expense
export const deleteExpense = async (id, token = null) => {
  try {
    // Get token if not provided
    if (!token) {
      token = await AsyncStorage.getItem('fleetx_auth_token');
    }

    const endpoint = replaceParams(ENDPOINTS.EXPENSE.DELETE, { id });
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Error deleting expense: ${response.status}`);
    }

    return await safeJsonParse(response);
  } catch (error) {
    console.error('Error in deleteExpense:', error);
    throw error;
  }
}; 