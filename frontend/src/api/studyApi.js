import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message);
    
    // Handle specific error cases
    if (error.response?.status === 404) {
      throw new Error('Resource not found');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error('Cannot connect to server. Please check if the backend is running.');
    }
    
    throw error;
  }
);

// API functions
export const studyApi = {
  // User management
  createUser: async (userData) => {
    const response = await api.post('/study/user', userData);
    return response.data;
  },

  // Study sessions
  logStudySession: async (sessionData) => {
    const response = await api.post('/study/log-session', sessionData);
    return response.data;
  },

  getStudySessions: async (userId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.subject) params.append('subject', filters.subject);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/study/sessions/${userId}?${params}`);
    return response.data;
  },

  // Performance analytics
  getPerformanceSummary: async (userId) => {
    const response = await api.get(`/study/performance/${userId}`);
    return response.data;
  },

  // AI features
  chatWithAI: async (userId, query, intent = null) => {
    const response = await api.post('/study/chat', {
      userId,
      query,
      intent
    });
    return response.data;
  },

  generateStudyPlan: async (userId, preferences = {}) => {
    const response = await api.post('/study/generate-plan', {
      userId,
      preferences
    });
    return response.data;
  },

  analyzePerformance: async (userId) => {
    const response = await api.get(`/study/analyze/${userId}`);
    return response.data;
  },

  // Health check
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  }
};

export default studyApi;