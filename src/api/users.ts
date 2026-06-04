import { api } from './https';

export type User = { id: number; username: string; email?: string | null };

export const listUsers = () => api.get<User[]>('/users');
export const getUser = (id: number) => api.get<User>(`/users/${id}`);
export const createUser = (payload: { username: string; email?: string }) => api.post<User>('/users', payload);
export const updateUser = (id: number, payload: Partial<{ username: string; email?: string }>) => api.put<User>(`/users/${id}`, payload);
export const deleteUser = (id: number) => api.delete(`/users/${id}`);