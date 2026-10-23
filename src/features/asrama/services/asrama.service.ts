import {http} from '@/services/api/client';
import type {
  Envelope,
  Gedung,
  Kamar,
  KamarDetail,
  Paginated,
  Penghuni,
  SantriRingkas,
} from '../types';

export async function getGedung() {
  const {data} = await http.get<Envelope<Gedung[]>>('/asrama/gedung');
  return data.data;
}

export async function getKamar(params: {gedung_asrama_id?: number} = {}) {
  const {data} = await http.get<Envelope<Kamar[]>>('/asrama/kamar', {params});
  return data.data;
}

export async function getKamarDetail(id: number) {
  const {data} = await http.get<Envelope<KamarDetail>>(`/asrama/kamar/${id}`);
  return data.data;
}

export async function getPenghuni(params: {
  page?: number;
  per_page?: number;
  santri_id?: number;
  gedung_asrama_id?: number;
  kamar_asrama_id?: number;
  status?: 'aktif' | 'keluar';
}) {
  const {data} = await http.get<Envelope<Paginated<Penghuni>>>('/asrama/penghuni', {params});
  return data.data;
}

export async function getSantriBelumBerkamar(params: {
  page?: number;
  per_page?: number;
  search?: string;
}) {
  const {data} = await http.get<Envelope<Paginated<SantriRingkas>>>(
    '/asrama/santri-belum-berkamar',
    {params},
  );
  return data.data;
}

export type MasukkanSantriPayload = {
  santri_ids: number[];
  kamar_asrama_id: number;
  tanggal_masuk: string; // YYYY-MM-DD
};

export async function masukkanSantri(payload: MasukkanSantriPayload) {
  const {data} = await http.post<{success: boolean; message: string}>('/asrama/penghuni', payload);
  return data;
}

export async function pindahPenghuni(
  id: number,
  payload: {kamar_asrama_id: number; tanggal_pindah: string; catatan: string | null},
) {
  const {data} = await http.patch<{success: boolean; message: string}>(
    `/asrama/penghuni/${id}/pindah`,
    payload,
  );
  return data;
}

export async function keluarkanPenghuni(
  id: number,
  payload: {tanggal_keluar: string; catatan: string | null},
) {
  const {data} = await http.patch<{success: boolean; message: string}>(
    `/asrama/penghuni/${id}/keluar`,
    payload,
  );
  return data;
}
