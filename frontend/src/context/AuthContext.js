import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cabgo_user')) || null; }
    catch { return null; }
  });

  const login = useCallback((userData) => {
    // userData must include a `role` field: 'customer' | 'driver'
    setUser(userData);
    localStorage.setItem('cabgo_user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('cabgo_user');
  }, []);

  const isCustomer = user?.role === 'customer';
  const isDriver   = user?.role === 'driver';

  return (
    <AuthContext.Provider value={{ user, login, logout, isCustomer, isDriver }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
