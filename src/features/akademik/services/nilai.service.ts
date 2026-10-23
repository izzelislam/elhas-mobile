import {http} from '@/services/api/client';

export type Nilai = {
  id: number;
  santri_id: number;
  mata_pelajaran_id: number;
  tahun_ajaran_id: number;
  semester: string;
  jenis: string;
  nilai: number;
  catatan: string | null;
  santri: {id: number; nama_lengkap: string; nis: string} | null;
  mata_pelajaran: {id: number; nama: string; kode: string | null} | null;
  tahun_ajaran: {id: number; nama: string} | null;
};

export async function getNilaiList(params: {
  page?: number;
  per_page?: number;
  santri_id?: number;
  unit_id?: number;
  kelas_id?: number;
  tahun_ajaran_id?: number;
  mata_pelajaran_id?: number;
  jenis?: string;
}) {
  const {data} = await http.get<{
    data: {
      data: Nilai[];
      current_page: number;
      last_page: number;
      total: number;
    };
  }>('/akademik/nilai', {params});
  return data.data;
}

export type NilaiDetail = Omit<
  Nilai,
  'santri' | 'mata_pelajaran' | 'tahun_ajaran'
> & {
  updated_at: string;
  santri: {
    id: number;
    nama_lengkap: string;
    nis: string;
    nisn: string | null;
    foto: string | null;
  } | null;
  mata_pelajaran: {
    id: number;
    nama: string;
    kode: string | null;
    kategori: string | null;
  } | null;
  tahun_ajaran: {id: number; nama: string; is_aktif: boolean} | null;
};

export async function getNilaiDetail(id: number) {
  const {data} = await http.get<{data: NilaiDetail}>(`/akademik/nilai/${id}`);
  return data.data;
}

export type CreateNilaiPayload = {
  kelas_id: number;
  mata_pelajaran_id: number;
  tahun_ajaran_id: number;
  semester: string;
  jenis: string;
  records: {santri_id: number; nilai: number; catatan: string | null}[];
};

export async function createNilai(payload: CreateNilaiPayload) {
  const {data} = await http.post<{success: boolean; message: string}>(
    '/akademik/nilai',
    payload,
  );
  return data;
}
