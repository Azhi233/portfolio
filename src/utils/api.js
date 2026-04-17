import axios from 'axios';

const fallbackBaseURL = import.meta.env.PROD
  ? 'http://47.114.95.49/api'
  : 'http://localhost:8787/api';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || fallbackBaseURL).replace(/\/+$/, '');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function createProject(project) {
  const response = await apiClient.post('/projects', project);
  return response.data?.data;
}
