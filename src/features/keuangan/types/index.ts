export type Transaksi = {
  id: number;
  tabungan_id: number;
  tipe: 'masuk' | 'keluar';
  nominal: string;
  keterangan: string | null;
  tanggal_transaksi: string;
  status: string;
  persetujuan_wali: boolean;
  bendahara: {id: number; name: string} | null;
};

export type RiwayatTransaksi = Transaksi & {
  tabungan: {
    id: number;
    no_rekening: string;
    santri: {id: number; nis: string; nama_lengkap: string} | null;
  } | null;
};

export type Tabungan = {
  id: number;
  santri_id: number;
  no_rekening: string;
  saldo: string;
  santri: {id: number; nis: string; nama_lengkap: string; foto: string | null} | null;
};

export type SantriTabungan = {
  id: number;
  nis: string;
  nisn: string | null;
  nama_lengkap: string;
  nama_panggilan: string | null;
  jenis_kelamin: string | null;
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  status: string;
  kategori_spp: string | null;
};

export type TabunganDetail = Omit<Tabungan, 'santri'> & {
  santri: SantriTabungan | null;
  created_at: string;
  updated_at: string;
  can_transact: boolean;
  transaksi: Transaksi[];
};

export type TabunganListResponse = {
  success: boolean;
  message: string;
  data: {
    data: Tabungan[];
    current_page: number;
    last_page: number;
    total: number;
  };
};

export type Tagihan = {
  id: number;
  kode: string | null;
  nama: string;
  tipe: string;
  nominal: string;
  nominal_terbayar: string;
  sisa_tagihan: number;
  catatan: string | null;
  bulan: number | null;
  tanggal_jatuh_tempo: string | null;
  status: string;
  santri: {id: number; nama_lengkap: string; nis: string} | null;
  komponen_biaya: {id: number; nama: string} | null;
};

export type Pembayaran = {
  id: number;
  tagihan_id: number;
  nominal_bayar: string;
  tanggal_bayar: string;
  metode_pembayaran: string;
  status: string;
  reference_number: string | null;
  bukti_pembayaran_url: string | null;
  alasan_penolakan: string | null;
  bendahara: {id: number; name: string} | null;
};

export type TagihanDetail = Tagihan & {
  riwayat_pembayaran: Pembayaran[];
};
