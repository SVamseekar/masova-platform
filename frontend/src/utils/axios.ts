import axios from 'axios';
import API_CONFIG from '../config/api.config';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token to requests
axiosInstance.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('auth_accessToken') || sessionStorage.getItem('auth_accessToken');

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Response interceptor - pass through; RTK Query baseQueryWithAuth handles token refresh
axiosInstance.interceptors.response.use(
  (response: any) => response,
  (error: any) => Promise.reject(error)
);

export default axiosInstance;
