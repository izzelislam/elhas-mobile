import axios, {AxiosError} from 'axios';
import {useAuthStore} from '@/store/auth.store';

export const API_BASE_URL = 'https://elhas.otakatikin.com/api/v1';

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {Accept: 'application/json'},
});

http.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  res => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);
