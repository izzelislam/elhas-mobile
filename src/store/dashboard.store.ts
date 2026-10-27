import {create} from 'zustand';
import type {Informasi} from '@/features/informasi/services/informasi.service';
import type {Santri} from '@/features/santri/types';

/** Data Beranda dianggap segar selama ini; lewat dari itu dimuat ulang diam-diam saat Beranda dibuka. */
export const DASHBOARD_STALE_MS = 5 * 60 * 1000;

type DashboardState = {
  anak: Santri[];
  informasi: Informasi[];
  notifCount: number;
  /** Selesai memuat sekali (berhasil atau gagal), agar placeholder tidak muncul lagi. */
  loaded: boolean;
  /** Waktu pemuatan terakhir yang berhasil seluruhnya; null bila belum pernah. */
  fetchedAt: number | null;
  set: (patch: Partial<Omit<DashboardState, 'set' | 'reset'>>) => void;
  reset: () => void;
};

const INITIAL = {anak: [], informasi: [], notifCount: 0, loaded: false, fetchedAt: null};

/** Disimpan di memori saja: Beranda tidak perlu memuat ulang tiap kali pindah tab atau kembali dari layar lain. */
export const useDashboardStore = create<DashboardState>(set => ({
  ...INITIAL,
  set: patch => set(patch),
  reset: () => set(INITIAL),
}));
