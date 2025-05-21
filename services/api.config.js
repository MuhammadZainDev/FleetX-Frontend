// API configuration
// For React Native, we need different base URLs depending on the environment:
// - 10.0.2.2 for Android emulators (points to host machine's localhost)
// - localhost for iOS simulators
// - Your actual machine's IP for physical devices
const getBaseUrl = () => {
  // Production Railway URL
  const PRODUCTION_URL = 'https://fleetx-backend-production.up.railway.app/api';
  
  // For local development, uncomment and set your IP
  // const LOCAL_IP = '10.0.91.123'; // Change this to your computer's IP address
  // const PORT = '5000';
  // return `http://${LOCAL_IP}:${PORT}/api`;
  
  return PRODUCTION_URL;
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
  },
  EARNING: {
    GET_ALL: '/earnings',
    GET_ONE: '/earnings/:id',
    GET_SUMMARY: '/earnings/driver/:driverId/summary',
    CREATE: '/earnings',
    UPDATE: '/earnings/:id',
    DELETE: '/earnings/:id',
  },
  EXPENSE: {
    GET_ALL: '/expenses',
    GET_ONE: '/expenses/:id',
    GET_SUMMARY: '/expenses/driver/:driverId/summary',
    CREATE: '/expenses',
    UPDATE: '/expenses/:id',
    DELETE: '/expenses/:id',
  },
  AUTO_EXPENSE: {
    GET_ALL: '/auto-expenses',
    GET_ONE: '/auto-expenses/:id',
    GET_SUMMARY: '/auto-expenses/driver/:driverId/summary',
    CREATE: '/auto-expenses',
    UPDATE: '/auto-expenses/:id',
    DELETE: '/auto-expenses/:id',
  },
  VEHICLE: {
    GET_ALL: '/vehicles',
    GET_ONE: '/vehicles/:id',
    CREATE: '/vehicles',
    UPDATE: '/vehicles/:id',
    DELETE: '/vehicles/:id',
    GET_AVAILABLE_DRIVERS: '/vehicles/drivers/available'
  }
};

// Request headers
export const getHeaders = (token = null, isMultipart = false) => {
  const headers = {};
  
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
    headers['Accept'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}; 