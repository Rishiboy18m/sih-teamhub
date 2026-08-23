import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('sih_token') || null);
  const [loading, setLoading] = useState(true);

  // Load session user if token exists
  useEffect(() => {
    async function checkAuth() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await apiFetch('/auth/me');
        setUser(data.user);
        setTeam(data.team);
      } catch (err) {
        console.error('Session check failed:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [token]);

  const login = async (loginId, password) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ loginId, password })
    });
    localStorage.setItem('sih_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setTeam(data.team);
    return data;
  };

  const registerLeader = async (formData) => {
    const data = await apiFetch('/auth/register-leader', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    localStorage.setItem('sih_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setTeam(data.team);
    return data;
  };

  const registerMember = async (formData) => {
    const data = await apiFetch('/auth/register-member', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    localStorage.setItem('sih_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setTeam(data.team);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('sih_token');
    setToken(null);
    setUser(null);
    setTeam(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        team,
        token,
        loading,
        login,
        registerLeader,
        registerMember,
        logout,
        setUser,
        setTeam
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
