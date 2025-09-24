import axios from 'axios';

// Simple store mock until Redux is properly set up
const mockStore = {
  getState: () => ({
    auth: {
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken')
    }
  })
};

class ApiClient {
  private client: any; // Changed from AxiosInstance to any
  private refreshTokenPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8080',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - Add JWT token to requests
    this.client.interceptors.request.use(
      (config: any) => {
        const token = mockStore.getState().auth.accessToken;
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: any) => Promise.reject(error)
    );

    // Response interceptor - Handle token refresh
    this.client.interceptors.response.use(
      (response: any) => response,
      async (error: any) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const newToken = await this.handleTokenRefresh();
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private async handleTokenRefresh(): Promise<string> {
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    this.refreshTokenPromise = new Promise(async (resolve, reject) => {
      try {
        const refreshTokenValue = mockStore.getState().auth.refreshToken;
        if (!refreshTokenValue) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post('/api/users/refresh', {
          refreshToken: refreshTokenValue,
        });

        const newAccessToken = (response.data as any).accessToken;
        localStorage.setItem('accessToken', newAccessToken);
        resolve(newAccessToken);
      } catch (error) {
        reject(error);
      } finally {
        this.refreshTokenPromise = null;
      }
    });

    return this.refreshTokenPromise;
  }

  // Generic HTTP methods
  async get<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data as T;
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data as T;
  }

  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.put(url, data, config);
    return response.data as T;
  }

  async delete<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data as T;
  }
}

export const apiClient = new ApiClient();
