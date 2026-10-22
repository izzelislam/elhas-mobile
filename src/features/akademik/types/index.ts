export type TahunAjaran = {
  id: number;
  nama: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  is_aktif: boolean;
};

export type KalenderEvent = {
  id: number;
  tahun_ajaran_id: number;
  nama_kegiatan: string;
  deskripsi: string | null;
  tanggal_mulai: string;
  tanggal_selesai: string;
  tipe: string;
  warna: string;
  tahun_ajaran: TahunAjaran | null;
};

export type KalenderResponse = {
  success: boolean;
  message: string;
  data: KalenderEvent[];
};
