import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('cctv_token'));
  const [user,  setUser]  = useState(
    JSON.parse(localStorage.getItem('cctv_user') || 'null')
  );

  const login = (newToken, userData) => {
    localStorage.setItem('cctv_token', newToken);
    localStorage.setItem('cctv_user',  JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('cctv_token');
    localStorage.removeItem('cctv_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);