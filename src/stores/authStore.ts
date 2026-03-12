import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  nome: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  initialize: () => void;
}

const AUTH_KEY = 'dashboard-auth-user';

type AuthStoreSetter = (state: Partial<AuthState>) => void;

export const useAuthStore = create<AuthState>((set: AuthStoreSetter) => ({
  user: null,
  loading: true,
  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.rpc('admin_login', {
        p_email: email,
        p_senha: password,
      });
      if (error) throw error;

      if (data?.success && data.user) {
        const user = data.user as User;
        localStorage.setItem(AUTH_KEY, JSON.stringify(user));
        set({ user, loading: false });
        return { success: true };
      }

      return { success: false, error: data?.error || 'Erro ao fazer login' };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer login';
      return { success: false, error: message };
    }
  },
  signOut: () => {
    localStorage.removeItem(AUTH_KEY);
    set({ user: null, loading: false });
  },
  initialize: () => {
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) {
      try {
        const user = JSON.parse(stored) as User;
        set({ user, loading: false });
      } catch {
        localStorage.removeItem(AUTH_KEY);
        set({ user: null, loading: false });
      }
    } else {
      set({ user: null, loading: false });
    }
  },
}));
