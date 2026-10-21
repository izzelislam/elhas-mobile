import {MenuItem} from './menu.types';

export const MENU: MenuItem[] = [
  {key: 'dashboard', label: 'Dashboard', route: 'Dashboard'},
  {key: 'santri', label: 'Santri', route: 'SantriList'},
  {
    key: 'akademik',
    label: 'Akademik',
    children: [
      {key: 'absensi', label: 'Absensi', route: 'Absensi'},
      {key: 'jadwal', label: 'Jadwal', route: 'Jadwal'},
      {key: 'nilai', label: 'Nilai', route: 'Nilai'},
      {key: 'rapor', label: 'Rapor', route: 'Rapor'},
      {key: 'kalender', label: 'Kalender Pendidikan', route: 'KalenderPendidikan'},
    ],
  },
  {
    key: 'kesantrian',
    label: 'Kesantrian',
    children: [
      {key: 'prestasi', label: 'Prestasi', route: 'Prestasi'},
      {key: 'pelanggaran', label: 'Pelanggaran', route: 'Pelanggaran'},
      {key: 'izin', label: 'Izin', route: 'Izin'},
      {key: 'catatan', label: 'Catatan', route: 'Catatan'},
    ],
  },
  {key: 'asrama', label: 'Asrama', route: 'Asrama'},
  {
    key: 'tahfidz',
    label: 'Tahfidz',
    children: [
      {key: 'halaqoh', label: 'Halaqoh', route: 'Halaqoh'},
      {key: 'setoran', label: 'Setoran', route: 'Setoran'},
      {key: 'ringkasan', label: 'Ringkasan', route: 'Ringkasan'},
    ],
  },
  {
    key: 'mutabaah',
    label: 'Mutabaah',
    children: [
      {key: 'mutabaah-santri', label: 'Mutabaah Santri', route: 'MutabaahSantri'},
      {key: 'mutabaah-asatidzah', label: 'Mutabaah Asatidzah', route: 'MutabaahAsatidzah'},
    ],
  },
  {
    key: 'keuangan',
    label: 'Keuangan',
    children: [
      {key: 'tabungan', label: 'Tabungan', route: 'Tabungan'},
      {key: 'spp', label: 'SPP', route: 'Spp'},
    ],
  },
  {key: 'informasi', label: 'Informasi', route: 'Informasi'},
];
