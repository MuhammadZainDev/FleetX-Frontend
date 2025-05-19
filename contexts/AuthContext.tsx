import React, { createContext, useState, useContext, useEffect } from 'react';
import { router } from 'expo-router';
import { login, signup, logout, getCurrentUser, isLoggedIn, getProfile } from '@/services/auth.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants
const TOKEN_KEY = 'fleetx_auth_token';
const USER_KEY = 'fleetx_user';

// Types
type User = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
};

type SignupData = {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  role?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  token: string | null
  authToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  navigateByRole: () => void;
  refreshUser: () => Promise<void>;
};

// Default context
const defaultContext: AuthContextType = {
  user: null,
  loading: true,
  isAuthenticated: false,
  token: null,
  authToken: null,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  navigateByRole: () => {},
  refreshUser: async () => {},
};

// Create context
const AuthContext = createContext<AuthContextType>(defaultContext);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // Navigate to appropriate dashboard based on user role
  const navigateByRole = () => {
    if (!user) return;

    // First navigate to tabs, then to specific dashboard
    router.replace('/(tabs)');
    
    // Role-specific functionality will be handled in each dashboard component
  };

  // Function to refresh user data from backend
  const refreshUser = async () => {
    try {
      // Get the latest token
      const currentToken = await AsyncStorage.getItem(TOKEN_KEY);
      if (!currentToken) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }
      
      // Fetch fresh user data from the backend
      const profileData = await getProfile();
      
      if (profileData && profileData.user) {
        // Update local storage
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(profileData.user));
        
        // Update state
        setUser(profileData.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  // Load user and token on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const authStatus = await isLoggedIn();
        
        if (authStatus) {
          const userData = await getCurrentUser();
          const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
          
          // Check if the user is active before authenticating
          if (userData && userData.isActive === false) {
            // Log out inactive users
            await logout();
            setUser(null);
            setToken(null);
            setIsAuthenticated(false);
          } else {
            setUser(userData);
            setToken(storedToken);
            setIsAuthenticated(true);
            
            // Refresh user data from backend to ensure it's up to date
            await refreshUser();
          }
        } else {
          setUser(null);
          setToken(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login handler
  const handleLogin = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Make the login request but don't do anything with the response yet
      const response = await login(email, password);
      
      // Check if user is active before proceeding with any state changes
      if (!response.user || response.user.isActive === false) {
        // Make sure we clear any existing auth state
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
        
        // Throw error for the login page to display
        throw new Error('Your account is deactivated. Please contact admin for activation.');
      }
      
      // Only set auth state if user is active
      setUser(response.user);
      setToken(response.token);
      setIsAuthenticated(true);
      
      // Only navigate if auth was successful
      router.replace('/(tabs)');
    } catch (error) {
      // Clear any partial auth state
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Signup handler
  const handleSignup = async (data: SignupData) => {
    try {
      setLoading(true);
      const response = await signup(data);
      
      // Do not set user or authenticate - user needs to log in
      // This prevents auto-login for newly registered users
      
      // Return the response so we can redirect from signup page
      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      router.replace('/auth/login');
    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    token,
    authToken: token,
    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout,
    navigateByRole,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);

export default AuthContext; 