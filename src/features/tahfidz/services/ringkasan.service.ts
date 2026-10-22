import {http} from '@/services/api/client';
import type {RingkasanResponse} from '../types';

export async function getRingkasan(
  params: {halaqah_id?: number; tanggal_mulai?: string; tanggal_selesai?: string} = {},
) {
  const {data} = await http.get<RingkasanResponse>('/hafalan/rekap/ringkasan', {params});
  return data.data;
}
