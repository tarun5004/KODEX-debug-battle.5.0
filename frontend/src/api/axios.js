import axios from 'axios';

// Bug fix: use the configured API URL when present, otherwise fall back to local Express.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const instance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Required to send cookies
});

// Add a request interceptor
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for refresh token logic
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh token
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        
        // Save new access token
        localStorage.setItem('token', res.data.accessToken);
        
        // Update header and retry original request
        originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
        return instance(originalRequest);
      } catch (refreshError) {
        // Refresh token failed or expired
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
