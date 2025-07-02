// frontend/src/services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Token management
let accessToken = localStorage.getItem('accessToken');
let refreshToken = localStorage.getItem('refreshToken');

// Request interceptor
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && refreshToken) {
      originalRequest._retry = true;

      try {
        const response = await api.post('/auth/refresh', { refreshToken });
        const { token, refreshToken: newRefreshToken } = response.data;
        
        accessToken = token;
        refreshToken = newRefreshToken;
        localStorage.setItem('accessToken', token);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Update tokens
export const setTokens = (access, refresh) => {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
};

// Clear tokens
export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// API methods
const apiService = {
  // Auth
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    logout: () => api.post('/auth/logout'),
    getMe: () => api.get('/auth/me'),
    refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken })
  },

  // Users
  users: {
    getAll: (params) => api.get('/users', { params }),
    getById: (id) => api.get(`/users/${id}`),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
    updatePassword: (id, data) => api.put(`/users/${id}/password`, data)
  },

  // Equipment
  equipment: {
    getAll: (params) => api.get('/equipment', { params }),
    getHierarchy: () => api.get('/equipment/hierarchy'),
    getById: (id) => api.get(`/equipment/${id}`),
    create: (data) => api.post('/equipment', data),
    update: (id, data) => api.put(`/equipment/${id}`, data),
    delete: (id) => api.delete(`/equipment/${id}`),
    import: (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/equipment/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    export: (params) => api.get('/equipment/export', { 
      params, 
      responseType: 'blob' 
    })
  },

  // Inspections
  inspections: {
    getAll: (params) => api.get('/inspections', { params }),
    getById: (id) => api.get(`/inspections/${id}`),
    create: (data) => api.post('/inspections', data),
    updateJourney: (id, data) => api.put(`/inspections/${id}/journey`, data),
    complete: (id, data) => api.post(`/inspections/${id}/complete`, data),
    getTemplates: (params) => api.get('/inspections/templates', { params }),
    createTemplate: (data) => api.post('/inspections/templates', data),
    updateTemplate: (id, data) => api.put(`/inspections/templates/${id}`, data)
  },

  // Backlogs
  backlogs: {
    getAll: (params) => api.get('/backlogs', { params }),
    create: (data) => api.post('/backlogs', data),
    update: (id, data) => api.put(`/backlogs/${id}`, data),
    bulkAssign: (data) => api.post('/backlogs/bulk-assign', data),
    generateWorkOrders: (backlogIds) => api.post('/backlogs/generate-workorders', { backlogIds })
  },

  // Work Orders
  workOrders: {
    getAll: (params) => api.get('/workorders', { params }),
    getById: (id) => api.get(`/workorders/${id}`),
    create: (data) => api.post('/workorders', data),
    update: (id, data) => api.put(`/workorders/${id}`, data),
    delete: (id) => api.delete(`/workorders/${id}`),
    autoGenerate: () => api.post('/workorders/auto-generate'),
    getRules: () => api.get('/workorders/rules'),
    createRule: (data) => api.post('/workorders/rules', data),
    updateRule: (id, data) => api.put(`/workorders/rules/${id}`, data)
  },

  // Preventive Maintenance
  preventiveMaintenance: {
    getAll: (params) => api.get('/preventive-maintenance', { params }),
    getById: (id) => api.get(`/preventive-maintenance/${id}`),
    create: (data) => api.post('/preventive-maintenance', data),
    update: (id, data) => api.put(`/preventive-maintenance/${id}`, data),
    complete: (id, data) => api.post(`/preventive-maintenance/${id}/complete`, data),
    autoGenerate: () => api.post('/preventive-maintenance/auto-generate')
  },

  // Analytics
  analytics: {
    getDashboard: () => api.get('/analytics/dashboard'),
    getEquipmentHealth: () => api.get('/analytics/equipment-health'),
    getMaintenanceTrends: (params) => api.get('/analytics/maintenance-trends', { params }),
    getCostAnalysis: () => api.get('/analytics/cost-analysis'),
    getPerformance: () => api.get('/analytics/performance'),
    getReliability: () => api.get('/analytics/reliability'),
    export: (params) => api.get('/analytics/export', { 
      params, 
      responseType: 'blob' 
    })
  }
};

export default apiService;
