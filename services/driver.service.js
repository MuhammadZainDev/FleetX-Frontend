import { API_BASE_URL, ENDPOINTS, getHeaders } from './api.config';

// Helper function to replace params in URLs
const replaceParams = (url, params) => {
  let result = url;
  Object.keys(params).forEach(key => {
    result = result.replace(`:${key}`, params[key]);
  });
  return result;
};

// Helper function to safely parse JSON
const safeJsonParse = async (response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error('Invalid response from server. Please check if the backend is running.');
  }
};

// Get all drivers
export const getAllDrivers = async (token) => {
  try {
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.DRIVER.GET_ALL}`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    
    if (!response.ok) {
      const error = await safeJsonParse(response);
      throw new Error(error.message || 'Failed to fetch drivers');
    }

    const result = await safeJsonParse(response);
    return result;
  } catch (error) {
    throw error;
  }
};

// Get a specific driver
export const getDriverById = async (id, token) => {
  try {
    const url = replaceParams(ENDPOINTS.DRIVER.GET_ONE, { id });
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
      headers: getHeaders(token)
    });

    if (!response.ok) {
      const error = await safeJsonParse(response);
      throw new Error(error.message || 'Failed to fetch driver');
    }

    return await safeJsonParse(response);
  } catch (error) {
    throw error;
  }
};

// Create a new driver
export const createDriver = async (driverData, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.DRIVER.CREATE}`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(driverData)
    });

    if (!response.ok) {
      const error = await safeJsonParse(response);
      throw new Error(error.message || 'Failed to create driver');
    }

    return await safeJsonParse(response);
  } catch (error) {
    throw error;
  }
};

// Update a driver
export const updateDriver = async (id, driverData, token) => {
  try {
    const url = replaceParams(ENDPOINTS.DRIVER.UPDATE, { id });
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(driverData)
    });

    if (!response.ok) {
      const error = await safeJsonParse(response);
      throw new Error(error.message || 'Failed to update driver');
    }

    return await safeJsonParse(response);
  } catch (error) {
    throw error;
  }
};

// Delete a driver
export const deleteDriver = async (id, token) => {
  try {
    const url = replaceParams(ENDPOINTS.DRIVER.DELETE, { id });
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'DELETE',
      headers: getHeaders(token)
    });

    if (!response.ok) {
      const error = await safeJsonParse(response);
      throw new Error(error.message || 'Failed to delete driver');
    }

    return await safeJsonParse(response);
  } catch (error) {
    throw error;
  }
}; 