import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '../types';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      isAuthenticated: !!session?.user,
    }),

  setProfile: (profile) =>
    set({
      profile,
      isAdmin: profile?.is_admin ?? false,
    }),

  setIsLoading: (isLoading) => set({ isLoading }),

  reset: () =>
    set({
      user: null,
      session: null,
      profile: null,
      isLoading: false,
      isAuthenticated: false,
      isAdmin: false,
    }),
}));
