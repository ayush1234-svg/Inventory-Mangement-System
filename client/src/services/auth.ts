import { User } from '../types/index.js';
import { apiRequest } from './api.js';

export async function login(email: string, password: string): Promise<{ user: User; token?: string }> {
  const res = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (res.token) {
    sessionStorage.setItem('wtl_token', res.token);
  }

  return res;
}

export async function logout(): Promise<void> {
  sessionStorage.removeItem('wtl_token');
  await apiRequest('/auth/logout', { method: 'POST' });
}

export async function getMe(): Promise<{ user: User }> {
  return apiRequest('/auth/me');
}
