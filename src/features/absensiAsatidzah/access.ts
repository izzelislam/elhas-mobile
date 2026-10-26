import {useAuthStore} from '@/store/auth.store';

/** Admin, kepala pesantren, dan superadmin melihat semua pegawai; peran lain hanya miliknya. */
export function useAbsensiAsatidzahAccess() {
  const roles = useAuthStore(s => s.user?.roles);
  return {canViewAll: roles?.some(r => /super|admin|kepala/i.test(r)) ?? false};
}
