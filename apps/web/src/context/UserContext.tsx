"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { loginUser, createUser, getUserById } from '../services/UserServices';
import { useRouter } from 'next/navigation';


interface User {
  id: string;
  name: string;
  email: string;
  // Add other user properties as needed
  admin: boolean;
}

interface UserContextType {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  activeComponent: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<void>;
  setActiveComponent: (component: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Helper function to decode JWT token
const decodeToken = (token: string) => {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeComponent, setActiveComponent] = useState<string | null>(null);
  const router = useRouter();

  // Load token from localStorage on mount and fetch user
  useEffect(() => {
    const savedToken = localStorage.getItem('userToken');
    if (savedToken) {
      setToken(savedToken);
      setIsLoggedIn(true);
      const decoded = decodeToken(savedToken);
      if (decoded && decoded.id) {
        getUserById(decoded.id, savedToken)
          .then(userData => setUser(userData))
          .catch(error => console.error('Failed to fetch user:', error));
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await loginUser({ email, password });
      setUser(data.user);
      setToken(data.token);
      setIsLoggedIn(true);
      localStorage.setItem('userToken', data.token);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsLoggedIn(false);
    localStorage.removeItem('userToken');
    //mandar para login
    router.push('/Login');
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const data = await createUser({ name, email, password });
      setToken(data.token);
      setIsLoggedIn(true);
      if (data.user) {
        setUser(data.user);
      }
      localStorage.setItem('userToken', data.token);
    } catch (error) {
      throw error;
    }
  };

  return (
    <UserContext.Provider value={{ user, token, isLoggedIn, activeComponent, login, logout, register, setActiveComponent }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};
