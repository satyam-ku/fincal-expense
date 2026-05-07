import axios from 'axios';

// In production (Vercel): uses REACT_APP_API_URL from .env
// In development (local): falls back to '/api' which is proxied to localhost:5000 via package.json proxy
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api'
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('fincal_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;
