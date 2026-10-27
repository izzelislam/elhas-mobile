import {AuthUser} from '@/features/auth/types';
import {hasPermission, isWali} from '@/lib/permissions';
import {MENU} from './menu.config';
import {MenuItem} from './menu.types';

/** Menu yang boleh dilihat pengguna: item tanpa izin disaring, induk tanpa anak tersisa dibuang. */
export function filterMenu(items: MenuItem[], user: AuthUser | null): MenuItem[] {
  return items.flatMap(item => {
    if (!item.children) {
      return hasPermission(user, item.permission) && !(item.hideForWali && isWali(user))
        ? [item]
        : [];
    }
    const children = filterMenu(item.children, user);
    return children.length ? [{...item, children}] : [];
  });
}

const routePermission = new Map<string, MenuItem['permission']>();
const waliBlocked = new Set<string>();
(function collect(items: MenuItem[]) {
  items.forEach(i => {
    if (i.route) {
      routePermission.set(i.route, i.permission);
      if (i.hideForWali) {
        waliBlocked.add(i.route);
      }
    }
    if (i.children) {
      collect(i.children);
    }
  });
})(MENU);

/** Route di luar menu (Aduan, Informasi, Notifikasi, ...) tidak dibatasi permission. */
export const canOpenRoute = (route: string, user: AuthUser | null) =>
  !(waliBlocked.has(route) && isWali(user)) &&
  hasPermission(user, routePermission.get(route));
