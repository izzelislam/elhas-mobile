import type {Permission} from '@/lib/permissions';

export type MenuItem = {
  key: string;
  label: string;
  /** Nama route; kosong jika item hanya membuka bottom sheet */
  route?: string;
  /** Jika ada, tap pada item membuka bottom sheet berisi sub menu */
  children?: MenuItem[];
  /** Permission yang dibutuhkan (salah satu). Kosong = semua pengguna. Induk tampil bila ada anak yang boleh. */
  permission?: Permission;
  /** Disembunyikan (dan route-nya ditolak) untuk akun wali santri, walau izinnya terpenuhi. */
  hideForWali?: boolean;
};
