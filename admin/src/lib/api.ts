import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface User {
  _id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: 'google' | 'github';
  role: 'user' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  telegramChatId?: string;
  location?: { name: string; lat: number; lon: number };
  createdAt: string;
}