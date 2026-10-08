import axios from 'axios';

// ============================================
// Environment-aware API URL
// - Local dev: https://valeenvista-backend.onrender.com/api
// - Production (Netlify): https://valeenvista-backend.onrender.com/api
// ============================================
const API_URL =
  process.env.REACT_APP_API_URL || 'https://valeenvista-backend.onrender.com/api';

// ============================================
// Axios instance
// ============================================
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// ============================================
// Request interceptor — attach access token
// ============================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================
// Response interceptor — auto-refresh on expiry
// ============================================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = response.data.token;
        localStorage.setItem('token', newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ============================================
// AUTH
// ============================================
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  logoutAll: () => api.post('/auth/logout-all'),
  googleLoginUrl: () => `${API_URL}/auth/google`,   // ✅ uses API_URL now
};

// ============================================
// USERS
// ============================================
export const userAPI = {
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.role) queryParams.append('role', params.role);
    const queryString = queryParams.toString();
    return api.get(`/users${queryString ? '?' + queryString : ''}`);
  },
  getById: (id) => api.get(`/users/${id}`),
  getByRole: (role) => api.get(`/users?role=${role}`),
  create: (userData) => api.post('/users', userData),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  changeRole: (id, data) => api.patch(`/users/${id}/role`, data),
  uploadAvatar: (id, formData) => {
    return api.post(`/users/${id}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  searchChatUsers: (q) =>
    api.get(`/users/search-chat?q=${encodeURIComponent(q)}`),
};

// ============================================
// PROPERTIES
// ============================================
export const propertyAPI = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.location) params.append('location', filters.location);
    if (filters.type) params.append('type', filters.type);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.bedrooms) params.append('bedrooms', filters.bedrooms);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.status) params.append('status', filters.status);
    const queryString = params.toString();
    return api.get(`/properties${queryString ? '?' + queryString : ''}`);
  },
  getById: (id) => api.get(`/properties/${id}`),
  search: (term, page = 1) => api.get(`/properties/search?q=${term}&page=${page}`),
  create: (data) => api.post('/properties', data),
  createWithImages: (formData) => {
    return api.post('/properties', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  update: (id, data) => api.put(`/properties/${id}`, data),
  delete: (id) => api.delete(`/properties/${id}`),
  getByBroker: () => api.get('/properties/broker'),
  getByAgent: (agentId) => api.get(`/properties/agent/${agentId}`),
  getMyProperties: () => api.get('/properties/my-properties'),
};

// ============================================
// DASHBOARD
// ============================================
export const dashboardAPI = {
  getAdminStats: () => api.get('/dashboard/admin'),
  getBrokerStats: () => api.get('/dashboard/broker'),
  getAgentStats: () => api.get('/dashboard/agent'),
  getUserActivity: (days = 30) => api.get(`/dashboard/user-activity?days=${days}`),
  getPropertyStats: () => api.get('/dashboard/property-stats'),
  getReservationStats: () => api.get('/dashboard/reservation-stats'),
  getTopAgents: () => api.get('/dashboard/top-agents'),
};

// ============================================
// RESERVATIONS
// ============================================
export const reservationAPI = {
  create: (data) => api.post('/reservations', data),
  getMyReservations: () => api.get('/reservations/my'),
  cancelReservation: (id) => api.patch(`/reservations/${id}/cancel`),
  getAgentReservations: () => api.get('/reservations/agent/my'),
  getMyCommissions: () => api.get('/reservations/commissions'),
  updateStatus: (id, data) => api.patch(`/reservations/${id}/status`, data),
  getVideoRoom: (id) => api.get(`/reservations/${id}/video-room`),

  getAll: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    const queryString = queryParams.toString();
    return api.get(`/reservations${queryString ? '?' + queryString : ''}`);
  },

  recordPayment: (id, data) => api.post(`/reservations/${id}/payments`, data),
  getPayments: (id) => api.get(`/reservations/${id}/payments`),

  uploadAttachments: (id, formData) => {
    return api.post(`/reservations/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getAttachments: (id) => api.get(`/reservations/${id}/attachments`),
  deleteAttachment: (id) => api.delete(`/reservations/attachments/${id}`),
};

// ============================================
// COMMISSIONS
// ============================================
export const commissionAPI = {
  getAll: () => api.get('/commissions'),
  markAsPaid: (id) => api.patch(`/commissions/${id}/paid`),
  getByAgent: (agentId) => api.get(`/commissions/agent/${agentId}`),
  getMyReleases: () => api.get('/commissions/my-releases'),
  getPendingReleases: (brokerId) =>
    api.get(`/commissions/pending${brokerId ? `?brokerId=${brokerId}` : ''}`),

  getApprovedUnpaidReleases: () => api.get('/commissions/approved-unpaid'),

  getBrokerReleases: (status) =>
    api.get(`/commissions/broker-releases${status ? `?status=${status}` : ''}`),

  getCommissionReleases: (commissionId) =>
    api.get(`/commissions/commission/${commissionId}`),

  approveRelease: (releaseId, data) =>
    api.patch(`/commissions/releases/${releaseId}/approve`, data),
  markReleaseAsPaid: (releaseId, data = {}) =>
    api.patch(`/commissions/releases/${releaseId}/paid`, data),
};

// ============================================
// CHAT
// ============================================
export const chatAPI = {
  getConversations: () => api.get('/chat/conversations'),
  getOrCreateConversation: (data) => api.post('/chat/conversations', data),
  getMessages: (conversationId, page = 1) =>
    api.get(`/chat/conversations/${conversationId}/messages?page=${page}`),
  sendMessage: (conversationId, data) =>
    api.post(`/chat/conversations/${conversationId}/messages`, data),
  getUnreadCount: () => api.get('/chat/unread'),
};

// ============================================
// MILESTONES
// ============================================
export const milestoneAPI = {
  getAll: (includeInactive = false) =>
    api.get(`/milestones/config${includeInactive ? '?includeInactive=true' : ''}`),
  getById: (id) => api.get(`/milestones/config/${id}`),
  create: (data) => api.post('/milestones/config', data),
  update: (id, data) => api.put(`/milestones/config/${id}`, data),
  delete: (id) => api.delete(`/milestones/config/${id}`),
};

// ============================================
// SETTINGS
// ============================================
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};

// ============================================
// NOTIFICATIONS
// ============================================
export const notificationAPI = {
  getAll: (params = {}) => {
    const q = new URLSearchParams();
    if (params.limit) q.append('limit', params.limit);
    if (params.offset) q.append('offset', params.offset);
    if (params.unread) q.append('unread', 'true');
    const qs = q.toString();
    return api.get(`/notifications${qs ? '?' + qs : ''}`);
  },
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  deleteOne: (id) => api.delete(`/notifications/${id}`),
  clearAll: () => api.delete('/notifications/clear-all'),
};

// ============================================
// REPORTS
// ============================================
export const reportAPI = {
  downloadUsers: (format, range) =>
    api.get(`/reports/users/${format}?range=${range}`, { responseType: 'blob' }),
  downloadProperties: (format, range) =>
    api.get(`/reports/properties/${format}?range=${range}`, { responseType: 'blob' }),
  downloadReservations: (format, range, status) =>
    api.get(
      `/reports/reservations/${format}?range=${range}${status ? '&status=' + status : ''}`,
      { responseType: 'blob' }
    ),
  downloadCommissions: (format, range) =>
    api.get(`/reports/commissions/${format}?range=${range}`, { responseType: 'blob' }),
};

export default api;