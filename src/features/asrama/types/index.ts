export type Gedung = {
  id: number;
  nama: string;
  kode: string;
  kapasitas: number;
  keterangan: string | null;
  kamar_asrama_count?: number;
};

export type Kamar = {
  id: number;
  gedung_asrama_id: number;
  nomor_kamar: string;
  nama_kamar: string;
  kapasitas: number;
  jenis_kelamin: 'L' | 'P';
  lantai: number;
  keterangan: string | null;
  penghuni_asrama_count?: number;
  gedung_asrama?: Gedung;
};

export type SantriRingkas = {
  id: number;
  nis: string;
  nama_lengkap: string;
  jenis_kelamin?: 'L' | 'P';
};

export type Penghuni = {
  id: number;
  santri_id: number;
  kamar_asrama_id: number;
  tanggal_masuk: string;
  tanggal_keluar: string | null;
  status: 'aktif' | 'keluar';
  catatan: string | null;
  santri?: SantriRingkas;
  kamar_asrama?: Kamar;
  tahun_ajaran?: {id: number; nama: string};
};

export type KamarDetail = Kamar & {penghuni_asrama: Penghuni[]};

export type Paginated<T> = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  data: T[];
};

export type Envelope<T> = {success: boolean; message: string; data: T};
