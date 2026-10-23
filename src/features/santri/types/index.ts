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
  tabungan: {
    id: number;
    no_rekening: string;
    saldo: string;
    transaksi_terakhir: {
      id: number;
      tanggal_transaksi: string;
      tipe: 'masuk' | 'keluar';
      nominal: string;
      keterangan: string | null;
      status: string;
      bendahara: {id: number; name: string} | null;
    }[];
  } | null;
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
    nik: string | null;
    pekerjaan: string | null;
    email: string | null;
    is_utama: boolean;
  }[];
  kelas_santri: {
    id: number;
    status: string;
    tahun_ajaran: {id: number; nama: string};
    kelas: {
      id: number;
      nama: string;
      tingkat: string;
      wali_kelas: {id: number; name: string} | null;
    };
  }[];
  tagihan: {
    id: number;
    nama: string;
    nominal: string;
    nominal_terbayar: string;
    tanggal_jatuh_tempo: string;
    status: string;
  }[];
  hafalan_setoran: {
    id: number;
    tanggal: string;
    jenis: string;
    surah_mulai: number;
    ayat_mulai: number;
    surah_selesai: number;
    ayat_selesai: number;
    halaman_mulai: number | null;
    halaman_selesai: number | null;
    kualitas: string;
    ustadz: {id: number; name: string} | null;
    catatan: string | null;
  }[];
  absensi: {
    id: number;
    tanggal: string;
    jenis: string;
    status: string;
    pencatat: {id: number; name: string} | null;
    keterangan: string | null;
  }[];
  poin_santri: {id: number; tahun_ajaran_id: number; poin_awal: number; poin_sisa: number}[];
  pelanggaran: {
    id: number;
    tanggal: string;
    jenis_pelanggaran: {id: number; nama: string; kategori: string};
    poin: number;
    pencatat: {id: number; name: string} | null;
    catatan: string | null;
    status: string;
  }[];
};

export type SantriDetailResponse = {
  success: boolean;
  message: string;
  data: SantriDetail;
};
