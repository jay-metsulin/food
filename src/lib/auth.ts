import { create } from 'zustand';
interface AuthState {
  accessToken: string | null;
  userId: string | null;
  user: { name: string; email: string } | null;
  setAuth: (token: string, userId: string, user: any) => void;
  clearAuth: () => void;
  getAuthHeader: () => Record<string, string>;
}
export const useAuth = create<AuthState>((set, get) => ({
  accessToken: null, userId: null, user: null,
  setAuth: (accessToken, userId, user) => set({ accessToken, userId, user }),
  clearAuth: () => set({ accessToken: null, userId: null, user: null }),
  getAuthHeader: () => {
    const t = get().accessToken;
    return t ? { Authorization: `Bearer ${t}` } : {};
  },
}));