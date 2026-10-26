import {useAuthStore} from '@/store/auth.store';
import type {AuthUser} from '@/features/auth/types';

/** Satu permission, atau daftar (cukup salah satu terpenuhi). Kosong = tanpa pembatasan. */
export type Permission = string | string[];

export const isSuperadmin = (user: AuthUser | null) =>
  user?.roles.some(r => /super/i.test(r)) ?? false;

export const isWali = (user: AuthUser | null) =>
  user?.roles.some(r => /wali/i.test(r)) ?? false;

/** Superadmin melewati semua pengecekan. */
export function hasPermission(user: AuthUser | null, permission?: Permission) {
  if (!permission || (Array.isArray(permission) && permission.length === 0)) {
    return true;
  }
  if (!user) {
    return false;
  }
  if (isSuperadmin(user)) {
    return true;
  }
  const needed = Array.isArray(permission) ? permission : [permission];
  return needed.some(p => user.permissions.includes(p));
}

/** Hook: apakah pengguna login memiliki permission ini. */
export function useCan(permission?: Permission) {
  return useAuthStore(s => hasPermission(s.user, permission));
}

/** Hook: pengguna login adalah wali (data terbatas pada santri miliknya). */
export function useIsWali() {
  return useAuthStore(s => isWali(s.user));
}
