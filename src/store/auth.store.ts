import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {AuthUser} from '@/features/auth/types';
import {useDashboardStore} from './dashboard.store';
import {useScopeStore} from './scope.store';

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  setUser: (user: AuthUser | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      token: null,
      user: null,
      setSession: (token, user) => set({token, user}),
      setUser: user => set({user}),
      setToken: token => set({token}),
      logout: () => {
        // Token, user (termasuk role & hak akses) dan scope unit/kelas milik sesi sebelumnya tidak boleh terbawa ke user berikutnya.
        useScopeStore.getState().reset();
        useDashboardStore.getState().reset();
        set({token: null, user: null});
      },
    }),
    {
      name: 'auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: s => ({token: s.token, user: s.user}),
    },
  ),
);

// Debug hak akses: tampilkan peran dan permission akun aktif di console setiap kali user berubah.
if (__DEV__) {
  useAuthStore.subscribe((state, prev) => {
    if (state.user && state.user !== prev.user) {
      const {name, email, roles, permissions} = state.user;
      console.log('[hak-akses]', {name, email, roles, permissions});
    }
  });
}
