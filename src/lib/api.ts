import { useAuth } from './auth';
const BASE = process.env.EXPO_PUBLIC_API_URL || '';
async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...useAuth.getState().getAuthHeader() },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}
export const api = {
  get:    <T>(path: string) => req<T>('GET', path),
  post:   <T>(path: string, body: unknown) => req<T>('POST', path, body),
  put:    <T>(path: string, body: unknown) => req<T>('PUT', path, body),
  delete: <T>(path: string) => req<T>('DELETE', path),
};