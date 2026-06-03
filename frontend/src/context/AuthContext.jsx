import React, { createContext, useState, useEffect } from 'react';
import axios from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get('/users/profile');
          setUser(response.data);
        } catch (error) {
          console.error('Error fetching user profile', error);
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const login = async (email, password) => {
    const response = await axios.post('/auth/login', { email, password });
    // Dev note: authController me response accessToken naam se aa raha tha; token store karne se auth header empty ho raha tha.
    localStorage.setItem('token', response.data.accessToken);
    setUser(response.data);
  };

  const register = async (username, email, password) => {
    const response = await axios.post('/auth/register', { username, email, password });
    // Dev note: register ke baad bhi same accessToken store karna zaroori hai, warna protected dashboard call fail hoti hai.
    localStorage.setItem('token', response.data.accessToken);
    setUser(response.data);
  };

  const logout = async () => {
    try {
      await axios.post('/auth/logout');
    } catch (e) {
      console.error('Logout error', e);
    }
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
