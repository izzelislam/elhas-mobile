import {http} from '@/services/api/client';
import type {IzinListResponse} from '../types';

export async function getIzinList(params: {
  per_page?: number;
  page?: number;
  santri_id?: number;
  status?: string;
  tanggal?: string;
}) {
  const {data} = await http.get<IzinListResponse>('/izin', {params});
  return data.data;
}

export type CreateIzinPayload = {
  santri_id: number;
  tanggal_keluar: string; // YYYY-MM-DD
  tanggal_kembali_rencana: string; // YYYY-MM-DD
  keperluan: string;
  nama_penjemput?: string;
};

export async function createIzin(payload: CreateIzinPayload) {
  const {data} = await http.post<{success: boolean; message: string}>('/izin', payload);
  return data;
}

export async function approveIzin(id: number) {
  const {data} = await http.post<{success: boolean; message: string}>(`/izin/${id}/approve`);
  return data;
}

/** Nama field alasan (`alasan_penolakan`) mengikuti data izin; belum terkonfirmasi di endpoint reject. */
export async function rejectIzin(id: number, alasan?: string) {
  const {data} = await http.post<{success: boolean; message: string}>(
    `/izin/${id}/reject`,
    alasan ? {alasan_penolakan: alasan} : undefined,
  );
  return data;
}

/** Menandai santri sudah kembali; hanya untuk izin yang sudah disetujui. */
export async function kembaliIzin(id: number) {
  const {data} = await http.post<{success: boolean; message: string}>(`/izin/${id}/kembali`);
  return data;
}
