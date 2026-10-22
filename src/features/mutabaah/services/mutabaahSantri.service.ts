import {http} from '@/services/api/client';
import type {DetailSantriResponse, IndikatorResponse, RekapResponse} from '../types';

export type RekapParams = {
  santri_id?: number;
  bulan?: string; // YYYY-MM
  tanggal_mulai?: string; // YYYY-MM-DD
  tanggal_selesai?: string; // YYYY-MM-DD
};

export async function getRekapSantri(params: RekapParams = {}) {
  const {data} = await http.get<RekapResponse>('/mutabaah/santri/rekap', {params});
  return data.data;
}

/** Indikator penilaian mutabaah santri; dipakai oleh form input. */
export async function getIndikatorSantri() {
  const {data} = await http.get<IndikatorResponse>('/mutabaah/santri/indikator');
  return data.data;
}

export type CreateMutabaahPayload = {
  tanggal: string; // YYYY-MM-DD
  subjek_id: number; // id santri
  items: {indikator_id: number; dikerjakan: boolean; catatan: string | null}[];
};

export async function createMutabaahSantri(payload: CreateMutabaahPayload) {
  const {data} = await http.post<{success: boolean; message: string}>('/mutabaah/santri', payload);
  return data;
}

export async function getDetailSantri(id: number, params: Omit<RekapParams, 'santri_id'> = {}) {
  const {data} = await http.get<DetailSantriResponse>(`/mutabaah/santri/subjek/${id}`, {params});
  return data.data;
}
