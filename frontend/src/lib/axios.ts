import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Dynamically import to avoid circular deps with SSR
      if (typeof window !== 'undefined') {
        import('@/stores/authStore').then(({ useAuthStore }) => {
          useAuthStore.getState().logout();
        });
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
