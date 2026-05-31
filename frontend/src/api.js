import axios from 'axios';

// In production (Vercel), VITE_API_URL points to the Render backend.
// In development, requests go to the Vite proxy → localhost:5001
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({ baseURL: BASE, timeout: 15000 });

// Inject JWT automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('iq_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');
export const getOfficers = () => api.get('/auth/officers');
export const createOfficer = (data) => api.post('/auth/officers', data);
export const deleteOfficer = (id) => api.delete(`/auth/officers/${id}`);

// Cars
export const getCars = () => api.get('/cars');
export const getAllCars = () => api.get('/cars/all');
export const createCar = (data) => api.post('/cars', data);
export const updateCar = (id, data) => api.put(`/cars/${id}`, data);
export const deleteCar = (id) => api.delete(`/cars/${id}`);

// Slabs
export const getActiveSlab = () => api.get('/slabs');
export const saveSlab = (data) => api.post('/slabs', data);

// Sales
export const getMySales = (month, year) => api.get(`/sales/my?month=${month}&year=${year}`);
export const saveMySales = (data) => api.put('/sales/my', data);
export const submitSales = (data) => api.post('/sales/my/submit', data);
export const getSalesHistory = () => api.get('/sales/history');
export const getAdminAllSales = (month, year) => api.get(`/sales/admin/all?month=${month}&year=${year}`);
export const getLeaderboard = () => api.get('/sales/admin/leaderboard');

export default api;
