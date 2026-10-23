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

export type TargetHafalan = {
  id: number;
  tahun_ajaran: {id: number; nama: string};
  is_aktif: boolean;
  target_juz: number;
  tercapai_juz: number;
  catatan: string | null;
};

export type DetailHafalanSantri = {
  santri: {id: number; nama_lengkap: string; nis: string};
  periode: {
    tahun: number;
    bulan: number;
    tanggal_mulai: string;
    tanggal_selesai: string;
    sebelumnya: string; // YYYY-MM
    berikutnya: string; // YYYY-MM
  };
  target_aktif: TargetHafalan | null;
  riwayat_target: TargetHafalan[];
  ringkasan_bulan: {jumlah_setoran: number; setoran_baru: number};
  setoran_bulan: Setoran[];
};

export type DetailHafalanSantriResponse = {
  success: boolean;
  message: string;
  data: DetailHafalanSantri;
};
