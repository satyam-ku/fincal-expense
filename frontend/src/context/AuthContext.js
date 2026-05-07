import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('fincal_token'));

  useEffect(() => {
    const savedUser = localStorage.getItem('fincal_user');
    if (savedUser && token) setUser(JSON.parse(savedUser));
  }, [token]);

  const login = (userData, tok) => {
    setUser(userData);
    setToken(tok);
    localStorage.setItem('fincal_token', tok);
    localStorage.setItem('fincal_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('fincal_token');
    localStorage.removeItem('fincal_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
