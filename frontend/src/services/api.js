// API Service - centralized API calls
import axios from 'axios';

const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Authentication APIs
export const auth = {
  login: (username, password) => 
    apiClient.post('/auth/login', { username, password }),
  logout: () => 
    apiClient.post('/auth/logout'),
  getCurrentUser: () => 
    apiClient.get('/auth/me')
};

// Student APIs
export const students = {
  getAll: () => 
    apiClient.get('/students'),
  getById: (id) => 
    apiClient.get(`/students/${id}`),
  create: (data) => 
    apiClient.post('/students', data),
  update: (id, data) => 
    apiClient.put(`/students/${id}`, data),
  delete: (id) => 
    apiClient.delete(`/students/${id}`)
};

// Marks APIs
export const marks = {
  getStudentMarks: (studentId) => 
    apiClient.get(`/marks/student/${studentId}`),
  getClassMarks: (departmentId) => 
    apiClient.get(`/marks/class/${departmentId}`),
  add: (data) => 
    apiClient.post('/marks', data),
  update: (id, data) => 
    apiClient.put(`/marks/${id}`, data)
};

// Report APIs
export const reports = {
  getStudentReport: (studentId) => 
    apiClient.get(`/reports/student/${studentId}`),
  getClassReport: (departmentId) => 
    apiClient.get(`/reports/class/${departmentId}`)
};

export default apiClient;