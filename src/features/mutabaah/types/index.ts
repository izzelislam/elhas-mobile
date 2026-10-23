export type RekapSantri = {
  id: number;
  nama: string;
  nomor_induk: string | null;
  dikerjakan: number;
  tidak_dikerjakan: number;
  total: number;
  persentase: number;
};

export type RekapResponse = {
  success: boolean;
  message: string;
  data: {
    periode: {tanggal_mulai: string; tanggal_selesai: string};
    rekap: RekapSantri[];
  };
};

export type Indikator = {
  id: number;
  nama: string;
  deskripsi: string | null;
  urutan: number;
};

export type IndikatorResponse = {
  success: boolean;
  message: string;
  data: Indikator[];
};

export type KegiatanMutabaah = {
  id: number;
  tanggal: string;
  indikator: {id: number; nama: string; deskripsi: string | null};
  dikerjakan: boolean;
  catatan: string | null;
};

export type DetailSantri = {
  subjek: {id: number; nama: string; nomor_induk: string | null};
  periode: {tanggal_mulai: string; tanggal_selesai: string};
  ringkasan: {dikerjakan: number; tidak_dikerjakan: number; total: number; persentase: number};
  kegiatan: KegiatanMutabaah[];
};

export type DetailSantriResponse = {
  success: boolean;
  message: string;
  data: DetailSantri;
};
