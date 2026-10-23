import {useAuthStore} from '@/store/auth.store';

/**
 * Wali hanya membuat/mengubah aduan miliknya. Peran lain (admin, superadmin, pengurus, ustadz, dll)
 * boleh menanggapi; wali yang punya permission aduan juga boleh.
 */
export function useAduanAccess() {
  const user = useAuthStore(s => s.user);
  const isWali = user?.roles.some(r => /wali/i.test(r)) ?? false;
  const hasAduanPermission = user?.permissions.some(p => /aduan/i.test(p)) ?? false;
  return {isWali, canRespond: !isWali || hasAduanPermission};
}
