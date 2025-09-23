"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type UserComponent = 'component' | 'component2' | 'component3' | 'component4';

interface UserContextType {
  activeComponent: UserComponent;
  setActiveComponent: (component: UserComponent) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeComponent, setActiveComponent] = useState<UserComponent>('component');

  // Load saved component from localStorage on mount
  useEffect(() => {
    const savedComponent = localStorage.getItem('userActiveComponent');
    if (savedComponent && ['component', 'component2', 'component3', 'component4'].includes(savedComponent)) {
      setActiveComponent(savedComponent as UserComponent);
    } else {
      // Default to checkins if nothing is saved
      setActiveComponent('component');
    }
  }, []);

  // Save component to localStorage when it changes
  const handleSetActiveComponent = (component: UserComponent) => {
    setActiveComponent(component);
    localStorage.setItem('userActiveComponent', component);
  };

  return (
    <UserContext.Provider value={{ activeComponent, setActiveComponent: handleSetActiveComponent }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within an UserProvider');
  }
  return context;
};
