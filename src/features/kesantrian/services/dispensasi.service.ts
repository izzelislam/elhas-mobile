import {http} from '@/services/api/client';
import type {Dispensasi} from '../types';

/** Respons berupa daftar biasa tanpa meta: halaman berikutnya ada selama halaman penuh. */
export async function getDispensasiList(params: {
  per_page?: number;
  page?: number;
  santri_id?: number;
}) {
  const {data} = await http.get<{success: boolean; data: Dispensasi[]}>(
    '/kesantrian/dispensasi',
    {params},
  );
  return data.data;
}
