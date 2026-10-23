import {http} from '@/services/api/client';
import type {Konseling} from '../types';

/** Respons berupa daftar biasa tanpa meta: halaman berikutnya ada selama halaman penuh. */
export async function getKonselingList(params: {
  per_page?: number;
  page?: number;
  santri_id?: number;
}) {
  const {data} = await http.get<{success: boolean; data: Konseling[]}>('/kesantrian/konseling', {
    params,
  });
  return data.data;
}
