import {http} from '@/services/api/client';
import type {PelanggaranListResponse} from '../types';

export async function getPelanggaranList(params: {
  per_page?: number;
  page?: number;
  santri_id?: number;
  jenis_pelanggaran_id?: number;
  tanggal?: string;
}) {
  const {data} = await http.get<PelanggaranListResponse>('/pelanggaran', {params});
  return data.data;
}

export type JenisPelanggaran = {
  id: number;
  nama: string;
  kategori: {value: string; label: string};
  poin: number;
};

/** Master jenis pelanggaran beserta kategori dan poinnya. */
export async function getJenisPelanggaran(): Promise<JenisPelanggaran[]> {
  const {data} = await http.get<{data: JenisPelanggaran[]}>('/pelanggaran/jenis');
  return data.data;
}

export type CreatePelanggaranPayload = {
  santri_id: number;
  jenis_pelanggaran_id: number;
  tanggal: string; // YYYY-MM-DD
  catatan?: string;
};

export async function createPelanggaran(payload: CreatePelanggaranPayload) {
  const {data} = await http.post<{success: boolean; message: string}>('/pelanggaran', payload);
  return data;
}
