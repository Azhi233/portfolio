import {
  createProject as insertProject,
  deleteProjectById as deleteProjectRow,
  editProject as updateProject,
  findProjectById,
  readProjects,
} from '../db/projects.repository.js';

export async function listProjects() {
  return readProjects();
}

export async function getProjectById(id) {
  return findProjectById(id);
}

export async function createProject(payload) {
  return insertProject(payload);
}

export async function editProject(id, payload) {
  return updateProject(id, payload);
}

export async function removeProject(id) {
  return deleteProjectRow(id);
}
