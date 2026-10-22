import {http} from '@/services/api/client';
import type {SantriDetailResponse, SantriListParams, SantriListResponse} from '../types';

export async function getSantriList(params: SantriListParams) {
  const {data} = await http.get<SantriListResponse>('/santri', {params});
  return data.data;
}

export async function getSantriDetail(id: number) {
  const {data} = await http.get<SantriDetailResponse>(`/santri/${id}`);
  return data.data;
}
