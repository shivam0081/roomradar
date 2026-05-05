import React, { createContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import socket from '../services/socket';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Connect socket and join personal room whenever user is set
  useEffect(() => {
    if (user) {
      const userId = user.id || user._id;
      if (!socket.connected) socket.connect();
      socket.emit('joinUserRoom', { userId });
    } else {
      if (socket.connected) socket.disconnect();
    }
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem('roomradar_token');
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get('/profile')
      .then((res) => {
        const fetched = res.data;
        setUser({ ...fetched, id: fetched.id || fetched._id });
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async ({ token, user: loggedInUser }) => {
    localStorage.setItem('roomradar_token', token);
    setUser({ ...loggedInUser, id: loggedInUser.id || loggedInUser._id });
  };

  const logout = () => {
    localStorage.removeItem('roomradar_token');
    localStorage.removeItem('roomradar_profile_draft');
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, loading, login, logout, isAuthenticated: Boolean(user) }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
