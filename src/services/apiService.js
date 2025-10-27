import axios from 'axios';
import authService from './authService';

const API_URL = process.env.REACT_APP_API_URL;

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = authService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      authService.logout();
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

class ApiService {
  async getDashboard() {
    const response = await apiClient.get('/dashboard/');
    return response.data;
  }
  
  async getTransactions() {
    const response = await apiClient.get('/transactions/');
    return response.data;
  }
  
  async addTransaction(transaction) {
    const response = await apiClient.post('/transactions/', transaction);
    return response.data;
  }
  
  async updateTransaction(id, transaction) {
    const response = await apiClient.put(`/transactions/${id}/`, transaction);
    return response.data;
  }
  
  async deleteTransaction(id) {
    const response = await apiClient.delete(`/transactions/${id}/`);
    return response.data;
  }
  
  async getBanks() {
    const response = await apiClient.get('/banks/');
    return response.data;
  }
  
  async addBank(bank) {
    const response = await apiClient.post('/banks/', bank);
    return response.data;
  }
  
  async deleteBank(bankCode) {
    const response = await apiClient.delete(`/banks/${bankCode}/`);
    return response.data;
  }
  
  async getSettings() {
    const response = await apiClient.get('/settings/');
    return response.data;
  }
  
  async updateSettings(settings) {
    const response = await apiClient.post('/settings/', settings);
    return response.data;
  }
  
  async rolloverMonth() {
    const response = await apiClient.post('/rollover/');
    return response.data;
  }
  
  async exportToCSV() {
    const response = await apiClient.get('/export/');
    return response.data;
  }
}

export default new ApiService();
