import {http} from '@/services/api/client';
import type {SantriDetailResponse, SantriListParams, SantriListResponse} from '../types';

type SantriList = SantriListResponse['data'];

/** Wali menerima array anak langsung tanpa meta paginasi; bentuknya disamakan dengan respons petugas. */
export async function getSantriList(params: SantriListParams): Promise<SantriList> {
  const {data} = await http.get<{data: SantriList | SantriList['data']}>('/santri', {params});
  if (Array.isArray(data.data)) {
    const total = data.data.length;
    return {
      data: data.data,
      meta: {current_page: 1, last_page: 1, per_page: total, total},
    };
  }
  return data.data;
}

export async function getSantriDetail(id: number) {
  const {data} = await http.get<SantriDetailResponse>(`/santri/${id}`);
  return data.data;
}

export type SantriRingkas = {
  id: number;
  nis: string;
  nisn: string | null;
  nama_lengkap: string;
  foto_url: string | null;
  status: {value: string; label: string} | null;
  kelas_aktif: {id: number; nama: string} | null;
};

/** Cari satu santri dari NIS (isi QR kartu santri). Melempar error 404 bila tidak ada. */
export async function searchSantriByNis(nis: string) {
  const {data} = await http.get<{data: SantriRingkas}>('/santri/search', {params: {nis}});
  return data.data;
}
