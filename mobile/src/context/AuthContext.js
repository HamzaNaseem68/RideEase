import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('rideease_token');
      if (storedToken) {
        setToken(storedToken);
        const res = await api.auth.getProfile();
        if (res.success) {
          setUser(res.user);
        } else {
          // Token expired or invalid
          await SecureStore.deleteItemAsync('rideease_token');
          setToken(null);
        }
      }
    } catch (err) {
      console.warn("Failed to bootstrap auth session:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login(email, password);
      if (res.success) {
        await SecureStore.setItemAsync('rideease_token', res.token);
        setToken(res.token);
        setUser(res.user);
        return { success: true };
      }
      return { success: false, message: res.message };
    } catch (err) {
      return { success: false, message: 'Could not establish connection to auth service' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name, email, phone, password) => {
    setIsLoading(true);
    try {
      const res = await api.auth.register(name, email, phone, password);
      if (res.success) {
        await SecureStore.setItemAsync('rideease_token', res.token);
        setToken(res.token);
        setUser(res.user);
        return { success: true };
      }
      return { success: false, message: res.message };
    } catch (err) {
      return { success: false, message: 'Could not establish connection to registration service' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await SecureStore.deleteItemAsync('rideease_token');
      setToken(null);
      setUser(null);
    } catch (err) {
      console.warn("Error signing out:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync profile details (wallet balance, verified documents, etc.)
  const syncProfile = async () => {
    try {
      const res = await api.auth.getProfile();
      if (res.success) {
        setUser(res.user);
        return res.user;
      }
    } catch (err) {
      console.warn("Failed syncing user profile:", err);
    }
    return null;
  };

  const submitIdentityDocs = async (cnicImage, licenseImage) => {
    try {
      const res = await api.auth.uploadDocs(cnicImage, licenseImage);
      if (res.success) {
        setUser(res.user);
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message };
    } catch (err) {
      return { success: false, message: 'Failed to verify uploaded documents' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      login,
      register,
      logout,
      syncProfile,
      submitIdentityDocs,
      isAuthenticated: !!token
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
