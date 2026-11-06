import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activeOrganization, setActiveOrganization] = useState(null);
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/me');
      if (res.success && res.data) {
        setUser(res.data.user);
        setActiveOrganization(res.data.activeOrganization);
        setRole(res.data.activeRole);
        setPermissions(res.data.permissions || []);
        setMemberships(res.data.memberships || []);

        if (res.data.activeOrganization?._id) {
          localStorage.setItem('stockpilot_active_org_id', res.data.activeOrganization._id);
        }
      }
    } catch (err) {
      setUser(null);
      setActiveOrganization(null);
      setRole(null);
      setPermissions([]);
      setMemberships([]);
      localStorage.removeItem('stockpilot_active_org_id');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.success) {
      setUser(res.data.user);
      setActiveOrganization(res.data.organization);
      setRole(res.data.membership?.role);
      setPermissions(res.data.membership?.permissions || []);
      if (res.data.organization?._id) {
        localStorage.setItem('stockpilot_active_org_id', res.data.organization._id);
      }
      await fetchCurrentUser();
      return res.data;
    }
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    if (res.success) {
      setUser(res.data.user);
      setActiveOrganization(res.data.organization);
      setRole(res.data.membership?.role);
      setPermissions(res.data.membership?.permissions || []);
      if (res.data.organization?._id) {
        localStorage.setItem('stockpilot_active_org_id', res.data.organization._id);
      }
      await fetchCurrentUser();
      return res.data;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
      setActiveOrganization(null);
      setRole(null);
      setPermissions([]);
      setMemberships([]);
      localStorage.removeItem('stockpilot_active_org_id');
    }
  };

  const switchOrganization = (orgId) => {
    localStorage.setItem('stockpilot_active_org_id', orgId);
    fetchCurrentUser();
  };

  const hasPermission = (permissionKey) => {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    if (role === 'Super Admin' || role === 'Organization Admin') return true;
    return permissions.includes(permissionKey);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeOrganization,
        role,
        permissions,
        memberships,
        loading,
        login,
        register,
        logout,
        switchOrganization,
        hasPermission,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

