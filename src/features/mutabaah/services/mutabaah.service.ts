import {http} from '@/services/api/client';
import type {DetailSantriResponse, IndikatorResponse, RekapResponse} from '../types';

/** Santri dan asatidzah memakai bentuk API yang sama, hanya beda prefix endpoint. */
export type MutabaahVariant = 'santri' | 'asatidzah';

export type RekapParams = {
  santri_id?: number;
  bulan?: string; // YYYY-MM
  tanggal_mulai?: string; // YYYY-MM-DD
  tanggal_selesai?: string; // YYYY-MM-DD
};

export async function getRekap(variant: MutabaahVariant, params: RekapParams = {}) {
  const {data} = await http.get<RekapResponse>(`/mutabaah/${variant}/rekap`, {params});
  return data.data;
}

/** Indikator penilaian mutabaah; dipakai oleh form input. */
export async function getIndikator(variant: MutabaahVariant) {
  const {data} = await http.get<IndikatorResponse>(`/mutabaah/${variant}/indikator`);
  return data.data;
}

export type CreateMutabaahPayload = {
  tanggal: string; // YYYY-MM-DD
  subjek_id?: number; // id santri; tidak dikirim untuk asatidzah
  items: {indikator_id: number; dikerjakan: boolean; catatan: string | null}[];
};

export async function createMutabaah(variant: MutabaahVariant, payload: CreateMutabaahPayload) {
  const {data} = await http.post<{success: boolean; message: string}>(
    `/mutabaah/${variant}`,
    payload,
  );
  return data;
}

export async function getDetail(
  variant: MutabaahVariant,
  id: number,
  params: Pick<RekapParams, 'bulan'> = {},
) {
  const {data} = await http.get<DetailSantriResponse>(`/mutabaah/${variant}/subjek/${id}`, {
    params,
  });
  return data.data;
}
