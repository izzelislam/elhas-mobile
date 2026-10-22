import {http} from '@/services/api/client';
import type {KalenderResponse, TahunAjaran} from '../types';

export async function getKalender(params: {per_page?: number; tahun_ajaran_id?: number} = {}) {
  const {data} = await http.get<KalenderResponse>('/akademik/kalender', {params});
  return data.data;
}

export async function getTahunAjaran(): Promise<TahunAjaran[]> {
  const {data} = await http.get('/akademik/tahun-ajaran', {params: {per_page: 100}});
  // bentuk respons belum terkonfirmasi: array langsung atau terbungkus paginasi
  const list = Array.isArray(data?.data) ? data.data : data?.data?.data;
  return Array.isArray(list) ? list : [];
}
