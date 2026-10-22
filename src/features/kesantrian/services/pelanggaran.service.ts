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

/** Endpoint daftar jenis belum terkonfirmasi; pemanggil harus siap menerima error. */
export async function getJenisPelanggaran(): Promise<{id: number; nama: string}[]> {
  const {data} = await http.get('/pelanggaran/jenis', {params: {per_page: 100}});
  const list = Array.isArray(data?.data) ? data.data : data?.data?.data;
  return Array.isArray(list)
    ? list.filter((j: {id?: number; nama?: string}) => j?.id && j?.nama)
    : [];
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
