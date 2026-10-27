import {http} from '@/services/api/client';
import type {SantriDetailResponse, SantriListParams, SantriListResponse} from '../types';

type SantriList = SantriListResponse['data'];

/** Wali menerima array anak langsung tanpa meta paginasi; bentuknya disamakan dengan respons petugas. */
export async function getSantriList(params: SantriListParams): Promise<SantriList> {
  const {data} = await http.get<{data: SantriList | SantriList['data']}>('/santri', {params});
  if (Array.isArray(data.data)) {
    const total = data.data.length;
    return {
      data: data.data,
      meta: {current_page: 1, last_page: 1, per_page: total, total},
    };
  }
  return data.data;
}

export async function getSantriDetail(id: number) {
  const {data} = await http.get<SantriDetailResponse>(`/santri/${id}`);
  return data.data;
}
