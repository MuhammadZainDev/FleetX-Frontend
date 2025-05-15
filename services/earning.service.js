import { API_BASE_URL, getHeaders, ENDPOINTS } from './api.config';
import { getToken } from './auth.service';

// Helper function to replace URL parameters
const replaceParams = (url, params) => {
  let finalUrl = url;
  Object.keys(params).forEach(key => {
    finalUrl = finalUrl.replace(`:${key}`, params[key]);
  });
  return finalUrl;
};

// Helper for safe JSON parsing
const safeJsonParse = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    console.error('Error parsing JSON response:', error);
    return { error: 'Failed to parse response' };
  }
};

// Get all earnings with optional filters
export const getAllEarnings = async (filters = {}, token = null) => {
  try {
    if (!token) {
      token = await getToken();
    }

    const queryParams = new URLSearchParams();
    
    // Add filters to query parameters
    if (filters.driverId) queryParams.append('driverId', filters.driverId);
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.EARNING.GET_ALL}${queryString}`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    
    const data = await safeJsonParse(response);
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch earnings');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching earnings:', error);
    throw error;
  }
};

// Get an earning by ID
export const getEarningById = async (id, token = null) => {
  try {
    if (!token) {
      token = await getToken();
    }
    
    const url = replaceParams(ENDPOINTS.EARNING.GET_ONE, { id });
    
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    
    const data = await safeJsonParse(response);
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch earning details');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching earning details:', error);
    throw error;
  }
};

// Get earnings summary for a driver
export const getEarningsSummary = async (driverId, period = 'monthly', token = null) => {
  try {
    if (!token) {
      token = await getToken();
    }
    
    const url = replaceParams(ENDPOINTS.EARNING.GET_SUMMARY, { driverId });
    
    const response = await fetch(`${API_BASE_URL}${url}?period=${period}`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    
    const data = await safeJsonParse(response);
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch earnings summary');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching earnings summary:', error);
    throw error;
  }
};

// Create a new earning record
export const createEarning = async (earningData, token = null) => {
  try {
    if (!token) {
      token = await getToken();
    }
    
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.EARNING.CREATE}`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(earningData)
    });
    
    const data = await safeJsonParse(response);
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create earning record');
    }
    
    return data;
  } catch (error) {
    console.error('Error creating earning record:', error);
    throw error;
  }
};

// Update an existing earning record
export const updateEarning = async (id, earningData, token = null) => {
  try {
    if (!token) {
      token = await getToken();
    }
    
    const url = replaceParams(ENDPOINTS.EARNING.UPDATE, { id });
    
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(earningData)
    });
    
    const data = await safeJsonParse(response);
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update earning record');
    }
    
    return data;
  } catch (error) {
    console.error('Error updating earning record:', error);
    throw error;
  }
};

// Delete an earning record
export const deleteEarning = async (id, token = null) => {
  try {
    if (!token) {
      token = await getToken();
    }
    
    const url = replaceParams(ENDPOINTS.EARNING.DELETE, { id });
    
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'DELETE',
      headers: getHeaders(token)
    });
    
    const data = await safeJsonParse(response);
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete earning record');
    }
    
    return data;
  } catch (error) {
    console.error('Error deleting earning record:', error);
    throw error;
  }
}; 