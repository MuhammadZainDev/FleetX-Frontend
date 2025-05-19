import React, { createContext, useContext } from 'react';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import { StyleSheet } from 'react-native';

// Types
type ToastType = 'success' | 'error' | 'info';

type ToastContextType = {
  showToast: (type: ToastType, text1: string, text2?: string) => void;
};

// Custom toast config
const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#2ecc71', backgroundColor: '#fff' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: 'bold'
      }}
      text2Style={{
        fontSize: 14
      }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: '#e74c3c', backgroundColor: '#fff' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: 'bold'
      }}
      text2Style={{
        fontSize: 14
      }}
    />
  ),
  info: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#3498db', backgroundColor: '#fff' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: 'bold'
      }}
      text2Style={{
        fontSize: 14
      }}
    />
  ),
};

// Create the context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Provider component
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Show toast notification
  const showToast = (type: ToastType, text1: string, text2?: string) => {
    Toast.show({
      type,
      text1,
      text2,
      position: 'top',
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 50,
    });
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast config={toastConfig} />
    </ToastContext.Provider>
  );
};

// Hook to use the toast context
export const useToast = () => {
  const context = useContext(ToastContext);
  
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
}; 