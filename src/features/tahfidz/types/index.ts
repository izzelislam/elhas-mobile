export type Halaqah = {
  id: number;
  nama: string;
  musyrif: {id: number; name: string} | null;
  jumlah_santri: number;
};

export type HalaqahListResponse = {
  success: boolean;
  message: string;
  data: Halaqah[];
};

type Labeled = {value: string; label: string};

export type Setoran = {
  id: number;
  santri: {id: number; nama_lengkap: string; nis: string} | null;
  ustadz: {id: number; name: string} | null;
  jenis: Labeled;
  surah_mulai: number;
  ayat_mulai: number;
  surah_selesai: number;
  ayat_selesai: number;
  halaman_mulai: number | null;
  halaman_selesai: number | null;
  kualitas: Labeled;
  catatan: string | null;
  tanggal: string;
};

export type SetoranListResponse = {
  success: boolean;
  message: string;
  data: {
    data: Setoran[];
    meta: {current_page: number; last_page: number; per_page: number; total: number};
  };
};

export type RingkasanSantri = {
  santri_id: number;
  jumlah_setoran: number;
  terakhir_setoran: string | null;
  santri: {id: number; nama_lengkap: string; nis: string} | null;
};

export type Ringkasan = {
  total_setoran: number;
  santri_aktif_setoran: number;
  per_santri: RingkasanSantri[];
};

export type RingkasanResponse = {
  success: boolean;
  message: string;
  data: Ringkasan;
};
