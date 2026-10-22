import {http} from '@/services/api/client';
import type {CatatanListResponse} from '../types';

export async function getCatatanList(params: {
  per_page?: number;
  page?: number;
  santri_id?: number;
  jenis?: string;
  tanggal?: string;
}) {
  const {data} = await http.get<CatatanListResponse>('/kesantrian/catatan', {params});
  return data.data;
}
