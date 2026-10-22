export type LabeledValue = {value: string; label: string};

export type Santri = {
  id: number;
  nis: string;
  nisn: string | null;
  nama_lengkap: string;
  nama_panggilan: string | null;
  jenis_kelamin: LabeledValue;
  status: LabeledValue;
  umur: number;
  foto: string | null;
  kelas_aktif: {id: number; nama: string} | null;
  halaqah_aktif: {id: number; nama: string} | null;
  asrama_aktif: {
    kamar_id: number;
    nama_kamar: string;
    nomor_kamar: string;
    gedung: {id: number; nama: string};
  } | null;
  total_prestasi: number;
};

export type SantriListParams = {
  status?: string;
  search?: string;
  kelas_id?: number;
  per_page?: number;
  page?: number;
};

export type SantriListResponse = {
  success: boolean;
  message: string;
  data: {
    data: Santri[];
    meta: {current_page: number; last_page: number; per_page: number; total: number};
  };
};

export type SantriDetail = Omit<Santri, 'asrama_aktif'> & {
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  alamat: string | null;
  kota: string | null;
  provinsi: string | null;
  kode_pos: string | null;
  golongan_darah: string | null;
  anak_ke: number | null;
  jumlah_saudara: number | null;
  asal_sekolah: string | null;
  nomor_ijazah: string | null;
  tanggal_masuk: string | null;
  tanggal_keluar: string | null;
  kategori_spp: LabeledValue | null;
  catatan: string | null;
  tabungan: {no_rekening: string; saldo: string} | null;
  asrama_aktif: {
    kamar_id: number;
    nama_kamar: string;
    nomor_kamar: string;
    gedung: {id: number; nama: string; kode: string};
  } | null;
  prestasi: {
    id: number;
    judul: string;
    kategori: string;
    tingkat: string;
    peringkat: string;
    tanggal: string;
  }[];
  wali_santri: {
    id: number;
    nama_lengkap: string;
    hubungan: LabeledValue;
    no_hp: string | null;
    is_utama: boolean;
  }[];
};

export type SantriDetailResponse = {
  success: boolean;
  message: string;
  data: SantriDetail;
};
