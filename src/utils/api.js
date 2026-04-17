import axios from 'axios';

const fallbackBaseURL = import.meta.env.PROD
  ? 'http://47.114.95.49/api'
  : 'http://localhost:8787/api';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || fallbackBaseURL).replace(/\/+$/, '');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

function toFormData(project) {
  const formData = new FormData();
  Object.entries(project || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (key === 'coverFile') {
      formData.append('cover', value);
      return;
    }
    if (Array.isArray(value) || typeof value === 'object') {
      formData.append(key, JSON.stringify(value));
      return;
    }
    formData.append(key, value);
  });
  return formData;
}

export async function createProject(project) {
  const payload = project?.coverFile instanceof File ? toFormData(project) : project;
  const response = await apiClient.post('/projects', payload);
  return response.data?.data;
}

export async function updateProject(projectId, project) {
  const payload = project?.coverFile instanceof File ? toFormData(project) : project;
  const response = await apiClient.put(`/projects/${projectId}`, payload);
  return response.data?.data;
}
