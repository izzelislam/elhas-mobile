import {MenuItem} from './menu.types';

export const MENU: MenuItem[] = [
  {key: 'dashboard', label: 'Dashboard', route: 'Dashboard'},
  {key: 'santri', label: 'Santri', route: 'SantriList', permission: 'santri.view'},
  {
    key: 'akademik',
    label: 'Akademik',
    children: [
      {key: 'absensi', label: 'Absensi', route: 'Absensi', permission: 'absensi.view'},
      {key: 'jadwal', label: 'Jadwal', route: 'Jadwal', permission: 'kelas.view'},
      {key: 'nilai', label: 'Nilai', route: 'Nilai', permission: 'nilai.view'},
      {key: 'rapor', label: 'Rapor', route: 'Rapor', permission: 'rapor.view'},
      {key: 'kalender', label: 'Kalender Pendidikan', route: 'KalenderPendidikan', permission: 'kalender.view'},
    ],
  },
  {
    key: 'kesantrian',
    label: 'Kesantrian',
    children: [
      {key: 'prestasi', label: 'Prestasi', route: 'Prestasi', permission: 'prestasi.view'},
      {key: 'pelanggaran', label: 'Pelanggaran', route: 'Pelanggaran', permission: 'pelanggaran.view'},
      {key: 'izin', label: 'Izin', route: 'Izin', permission: 'izin.view'},
      {key: 'catatan', label: 'Catatan', route: 'Catatan', permission: 'catatan_perilaku.view'},
      {key: 'konseling', label: 'Konseling', route: 'Konseling', permission: 'konseling.view'},
      {key: 'dispensasi', label: 'Dispensasi', route: 'Dispensasi', permission: 'dispensasi.view'},
    ],
  },
  {
    key: 'absensi-asatidzah',
    label: 'Absensi Asatidzah',
    children: [
      {key: 'absen', label: 'Absen', route: 'AbsensiAsatidzahAbsen', permission: 'absensi_asatidzah.create'},
      {key: 'absensi-asatidzah-list', label: 'Daftar Absensi', route: 'AbsensiAsatidzahList', permission: 'absensi_asatidzah.view'},
      {key: 'absensi-asatidzah-rekap', label: 'Rekap', route: 'AbsensiAsatidzahRekap', permission: 'absensi_asatidzah.view'},
    ],
  },
  {
    key: 'asrama',
    label: 'Asrama',
    children: [
      {key: 'asrama-gedung', label: 'Gedung', route: 'AsramaGedung', permission: 'asrama.view'},
      {key: 'asrama-kamar', label: 'Kamar', route: 'AsramaKamar', permission: 'asrama.view'},
      {key: 'asrama-penghuni', label: 'Penghuni', route: 'AsramaPenghuni', permission: 'asrama.view'},
    ],
  },
  {
    key: 'tahfidz',
    label: 'Tahfidz',
    children: [
      {key: 'halaqoh', label: 'Halaqoh', route: 'Halaqoh', permission: 'hafalan.view'},
      {key: 'setoran', label: 'Setoran', route: 'Setoran', permission: 'hafalan.view'},
      {key: 'ringkasan', label: 'Ringkasan', route: 'Ringkasan', permission: 'hafalan.view'},
    ],
  },
  {
    key: 'mutabaah',
    label: 'Mutabaah',
    children: [
      {key: 'mutabaah-santri', label: 'Mutabaah Santri', route: 'MutabaahSantri', permission: 'mutabaah_santri.view'},
      {key: 'mutabaah-asatidzah', label: 'Mutabaah Asatidzah', route: 'MutabaahAsatidzah', permission: 'mutabaah_asatidzah.view'},
    ],
  },
  {
    key: 'keuangan',
    label: 'Keuangan',
    children: [
      {key: 'tabungan', label: 'Tabungan', route: 'Tabungan', permission: 'tabungan.view'},
      {key: 'tarik-tabungan', label: 'Setor / Tarik', route: 'TarikTabungan', permission: 'tabungan.create'},
      {key: 'tagihan', label: 'Tagihan', route: 'Tagihan', permission: 'tagihan.view'},
    ],
  },
  {key: 'aduan', label: 'Aduan', route: 'Aduan'},
  {key: 'informasi', label: 'Informasi', route: 'Informasi'},
];
