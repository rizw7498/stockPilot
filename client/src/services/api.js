import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach organization ID from current active tenant
api.interceptors.request.use((config) => {
  const currentOrgId = localStorage.getItem('stockpilot_active_org_id');
  if (currentOrgId) {
    config.headers['x-organization-id'] = currentOrgId;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export default api;
