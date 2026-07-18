import React, { createContext, useContext, useState, useCallback } from 'react';
import { authAPI } from '../api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ims_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (username, password) => {
    setLoading(true);
    try {
      const res = await authAPI.login({ username, password });
      const { token, ...u } = res.data.data;
      localStorage.setItem('ims_token', token);
      localStorage.setItem('ims_user', JSON.stringify(u));
      setUser(u);
      return u;
    } catch (err) {
       
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.clear();
    setUser(null);
  }, []);

  return (
    <AuthCtx.Provider value={{
      user,
      loading,
      login,
      logout,
      isAdmin:    user?.roleCode === 'ADMIN',
      isReporter: user?.roleCode === 'REPORTER',
      isResolver: user?.roleCode === 'RESOLVER',
      isManager:  user?.roleCode === 'INC_MANAGER',
    }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => {
  const c = useContext(AuthCtx);
  if (!c) throw new Error('useAuth must be used inside AuthProvider');
  return c;
};
