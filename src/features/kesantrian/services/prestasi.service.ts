import {http} from '@/services/api/client';
import type {Prestasi, PrestasiListResponse} from '../types';

export async function getPrestasiList(params: {per_page?: number; page?: number}) {
  const {data} = await http.get<PrestasiListResponse>('/prestasi', {params});
  return data.data;
}

export async function getPrestasiDetail(id: number): Promise<Prestasi> {
  const {data} = await http.get<{data: Prestasi}>(`/prestasi/${id}`);
  return data.data;
}
