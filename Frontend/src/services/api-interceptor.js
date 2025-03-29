// src/services/api-interceptor.js
import axios from 'axios';
import AuthService from './auth.service';

export const setupInterceptors = () => {
  axios.interceptors.request.use(
    (config) => {
      const user = AuthService.getCurrentUser();
      if (user && user.token) {
        config.headers['Authorization'] = `Bearer ${user.token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        // Token expired or invalid
        AuthService.logout();
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
};

export default setupInterceptors;