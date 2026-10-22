import {http} from '@/services/api/client';
import type {SetoranListResponse} from '../types';

export async function getSetoranList(params: {
  per_page?: number;
  page?: number;
  halaqah_id?: number;
  santri_id?: number;
  tanggal?: string;
}) {
  const {data} = await http.get<SetoranListResponse>('/hafalan/setoran', {params});
  return data.data;
}

export type CreateSetoranPayload = {
  santri_id: number;
  jenis: string;
  surah_mulai: number;
  ayat_mulai: number;
  surah_selesai: number;
  ayat_selesai: number;
  kualitas: string;
  tanggal: string; // YYYY-MM-DD
  catatan: string | null;
};

export async function createSetoran(payload: CreateSetoranPayload) {
  const {data} = await http.post<{success: boolean; message: string}>(
    '/hafalan/setoran',
    payload,
  );
  return data;
}
