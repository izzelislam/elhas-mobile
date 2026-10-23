export type Prestasi = {
  id: number;
  santri_id: number;
  judul: string;
  deskripsi: string | null;
  kategori: string;
  tingkat: string;
  peringkat: string;
  tanggal: string;
  bukti_foto: string | null;
  santri: {
    id: number;
    nis: string;
    nama_lengkap: string;
    nama_panggilan: string | null;
    foto: string | null;
  } | null;
  pencatat: {id: number; name: string} | null;
};

export type PrestasiListResponse = {
  success: boolean;
  message: string;
  data: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    data: Prestasi[];
  };
};

export type Pelanggaran = {
  id: number;
  santri: {id: number; nama_lengkap: string; nis: string} | null;
  jenis_pelanggaran: {
    id: number;
    nama: string;
    kategori: {value: string; label: string};
    poin: number;
  } | null;
  tanggal: string;
  catatan: string | null;
  poin: number;
  pencatat: {id: number; name: string} | null;
  status: string;
};

export type PelanggaranListResponse = {
  success: boolean;
  message: string;
  data: {
    data: Pelanggaran[];
    meta: {current_page: number; last_page: number; per_page: number; total: number};
  };
};

export type Izin = {
  id: number;
  santri: {id: number; nama_lengkap: string; nis: string} | null;
  pengaju: {id: number; name: string; jabatan: string | null} | null;
  tanggal_keluar: string;
  tanggal_kembali_rencana: string;
  tanggal_kembali_aktual: string | null;
  keperluan: string;
  nama_penjemput: string | null;
  status: {value: string; label: string};
  alasan_penolakan: string | null;
  disetujui_oleh: {id: number; name: string} | null;
  tanggal_persetujuan: string | null;
};

export type IzinListResponse = {
  success: boolean;
  message: string;
  data: {
    data: Izin[];
    meta: {current_page: number; last_page: number; per_page: number; total: number};
  };
};

export type Catatan = {
  id: number;
  santri: {id: number; nama_lengkap: string; nis: string} | null;
  pencatat: {id: number; name: string} | null;
  tanggal: string;
  jenis: string;
  poin_nilai: number;
  deskripsi: string;
};

export type CatatanListResponse = {
  success: boolean;
  message: string;
  data: {
    data: Catatan[];
    meta: {current_page: number; last_page: number; per_page: number; total: number};
  };
};

export type Konseling = {
  id: number;
  santri: {id: number; nama_lengkap: string; nis: string} | null;
  konselor: {id: number; name: string} | null;
  tanggal: string;
  topik: string;
  catatan: string | null;
  tindak_lanjut: string | null;
  status: string;
};

export type Dispensasi = {
  id: number;
  santri: {id: number; nama_lengkap: string; nis: string} | null;
  pengaju: {id: number; name: string} | null;
  jenis: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  keterangan: string | null;
  status: string;
  disetujui_oleh: {id: number; name: string} | null;
};
