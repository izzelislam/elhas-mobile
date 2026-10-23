import {http} from '@/services/api/client';

export type Rapor = {
  id: number;
  santri_id: number;
  tahun_ajaran_id: number;
  kelas_id: number;
  semester: string;
  catatan_wali_kelas: string | null;
  status: string;
  generated_at: string | null;
  published_at: string | null;
  santri: {
    id: number;
    nama_lengkap: string;
    nis: string;
    nisn: string | null;
    foto: string | null;
  } | null;
  tahun_ajaran: {id: number; nama: string} | null;
  kelas: {id: number; nama: string} | null;
};

export type RaporNilai = {
  id: number;
  mata_pelajaran_id: number;
  jenis: string;
  nilai: number;
  catatan: string | null;
  mata_pelajaran: {id: number; nama: string; kode: string | null} | null;
};

export type RaporDetail = {
  rapor: Rapor;
  nilai: RaporNilai[];
  rata_rata: number | null;
};

export async function getRaporList(params: {
  page?: number;
  per_page?: number;
  santri_id?: number;
  tahun_ajaran_id?: number;
  kelas_id?: number;
}) {
  const {data} = await http.get<{
    data: {
      data: Rapor[];
      current_page: number;
      last_page: number;
      total: number;
    };
  }>('/akademik/rapor', {params});
  return data.data;
}

export async function getRaporDetail(id: number) {
  const {data} = await http.get<{data: RaporDetail}>(`/akademik/rapor/${id}`);
  return data.data;
}

const STATUS: Record<string, {label: string; color: string}> = {
  draft: {label: 'Draft', color: '#6B7280'},
  generated: {label: 'Disusun', color: '#2563EB'},
  published: {label: 'Dipublikasi', color: '#059669'},
};
export const raporStatus = (v: string) =>
  STATUS[v] ?? {
    label: v.charAt(0).toUpperCase() + v.slice(1),
    color: '#6B7280',
  };
