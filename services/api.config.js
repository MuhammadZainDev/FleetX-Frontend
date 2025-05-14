// API configuration
// For React Native, we need different base URLs depending on the environment:
// - 10.0.2.2 for Android emulators (points to host machine's localhost)
// - localhost for iOS simulators
// - Your actual machine's IP for physical devices
const getBaseUrl = () => {
  // You must use the IP address where your backend is running
  return 'http://192.168.0.101:5000/api'; // Using IP address instead of localhost
};

export const API_BASE_URL = getBaseUrl();

// Endpoints
export const ENDPOINTS = {
  AUTH: {
    SIGNUP: '/auth/signup',
    LOGIN: '/auth/login',
    PROFILE: '/auth/profile',
  },
  DRIVER: {
    GET_ALL: '/drivers',
    GET_ONE: '/drivers/:id',
    CREATE: '/drivers',
    UPDATE: '/drivers/:id',
    DELETE: '/drivers/:id',
  }
};

// Request headers
export const getHeaders = (token = null) => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}; 