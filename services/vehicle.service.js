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

// Create Form Data for multipart requests (for image uploads)
const createFormData = (vehicleData, imageUri) => {
  const formData = new FormData();
  
  // Add vehicle data fields to form data
  Object.keys(vehicleData).forEach(key => {
    if (key === 'driverIds' && Array.isArray(vehicleData[key])) {
      // Handle array of driver IDs
      vehicleData[key].forEach(driverId => {
        formData.append('driverIds[]', driverId);
      });
    } else {
      formData.append(key, vehicleData[key]);
    }
  });
  
  // Add image if provided
  if (imageUri) {
    // Extract filename and type from URI
    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    
    formData.append('image', {
      uri: imageUri,
      name: `photo.${fileType}`,
      type: `image/${fileType}`
    });
  }
  
  return formData;
};

// Get all vehicles
export const getAllVehicles = async (token, filters = {}) => {
  try {
    if (!token) {
      throw new Error('Authentication required');
    }
    
    // Build query parameters if filters are provided
    let queryParams = '';
    if (Object.keys(filters).length > 0) {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
      queryParams = `?${params.toString()}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.VEHICLE.GET_ALL}${queryParams}`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    
    if (!response.ok) {
      const error = await safeJsonParse(response);
      throw new Error(error.message || 'Failed to fetch vehicles');
    }

    return await safeJsonParse(response);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    throw error;
  }
};

// Get a specific vehicle
export const getVehicleById = async (id, token) => {
  try {
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const url = replaceParams(ENDPOINTS.VEHICLE.GET_ONE, { id });
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
      headers: getHeaders(token)
    });

    if (!response.ok) {
      const error = await safeJsonParse(response);
      throw new Error(error.message || 'Failed to fetch vehicle');
    }

    return await safeJsonParse(response);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    throw error;
  }
};

// Create a new vehicle with optional image upload
export const createVehicle = async (vehicleData, imageUri, token) => {
  try {
    if (!token) {
      throw new Error('Authentication required');
    }
    
    // Create form data with vehicle data and image if provided
    const formData = createFormData(vehicleData, imageUri);
    
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.VEHICLE.CREATE}`, {
      method: 'POST',
      headers: getHeaders(token, true), // Set true for multipart/form-data
      body: formData
    });

    if (!response.ok) {
      const error = await safeJsonParse(response);
      throw new Error(error.message || 'Failed to create vehicle');
    }

    return await safeJsonParse(response);
  } catch (error) {
    console.error('Error creating vehicle:', error);
    throw error;
  }
};

// Update a vehicle with optional image upload
export const updateVehicle = async (vehicleData, imageUri, token) => {
  try {
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const { id } = vehicleData;
    if (!id) {
      throw new Error('Vehicle ID is required');
    }
    
    const url = replaceParams(ENDPOINTS.VEHICLE.UPDATE, { id });
    
    // Create form data with vehicle data and image if provided
    const formData = createFormData(vehicleData, imageUri);
    
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers: getHeaders(token, true), // Set true for multipart/form-data
      body: formData
    });

    if (!response.ok) {
      const error = await safeJsonParse(response);
      throw new Error(error.message || 'Failed to update vehicle');
    }

    return await safeJsonParse(response);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    throw error;
  }
};

// Delete a vehicle
export const deleteVehicle = async (id, token) => {
  try {
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const url = replaceParams(ENDPOINTS.VEHICLE.DELETE, { id });
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'DELETE',
      headers: getHeaders(token)
    });

    if (!response.ok) {
      const error = await safeJsonParse(response);
      throw new Error(error.message || 'Failed to delete vehicle');
    }

    return await safeJsonParse(response);
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    throw error;
  }
};

// Get available drivers for assignment
export const getAvailableDrivers = async (token) => {
  try {
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.VEHICLE.GET_AVAILABLE_DRIVERS}`, {
      method: 'GET',
      headers: getHeaders(token)
    });

    if (!response.ok) {
      const error = await safeJsonParse(response);
      throw new Error(error.message || 'Failed to fetch available drivers');
    }

    return await safeJsonParse(response);
  } catch (error) {
    console.error('Error fetching available drivers:', error);
    throw error;
  }
};

// Get vehicles assigned to a specific driver
export const getDriverVehicles = async (driverId, token) => {
  try {
    if (!token) {
      throw new Error('Authentication required');
    }
    
    if (!driverId) {
      throw new Error('Driver ID is required');
    }
    
    // Query vehicles where this driver is assigned
    const queryParams = `?driverId=${driverId}`;
    
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.VEHICLE.GET_ALL}${queryParams}`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    
    if (!response.ok) {
      const error = await safeJsonParse(response);
      throw new Error(error.message || 'Failed to fetch driver vehicles');
    }

    return await safeJsonParse(response);
  } catch (error) {
    console.error('Error fetching driver vehicles:', error);
    throw error;
  }
}; 