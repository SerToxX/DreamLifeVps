import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

interface User {
  id: number;
  correo: string;
  nombre?: string;
  rol: string;
  type: 'usuario' | 'cliente';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  login: (correo: string, contrasena: string, isAdmin?: boolean) => Promise<void>;
  register: (data: { nombre: string; apellido?: string; dni?: string; correo: string; contrasena: string; telefono?: string; direccion?: string }) => Promise<void>;
  logout: () => Promise<void>;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      hydrated: false,

      login: async (correo, contrasena, isAdmin = false) => {
        const { data } = await api.post(isAdmin ? '/auth/login/admin' : '/auth/login', { correo, contrasena });
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', data.accessToken);
          localStorage.setItem('refresh_token', data.refreshToken);
        }
        const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
        set({ accessToken: data.accessToken, user: { id: payload.sub, correo: payload.correo, rol: payload.rol, type: payload.type }, isAuthenticated: true });
      },

      register: async (data) => {
        await api.post('/auth/register', data);
        await get().login(data.correo, data.contrasena, false);
      },

      logout: async () => {
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
        if (refreshToken) {
          try { await api.post('/auth/logout', { refreshToken }); } catch {}
        }
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
        set({ user: null, accessToken: null, isAuthenticated: false });
      },

      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'dreamlife-auth',
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken, isAuthenticated: s.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        if (typeof window !== 'undefined' && state?.accessToken) {
          localStorage.setItem('access_token', state.accessToken);
        }
        state?.setHydrated();
      },
    }
  )
);
