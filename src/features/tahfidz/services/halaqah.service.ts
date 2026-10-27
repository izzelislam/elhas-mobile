import {http} from '@/services/api/client';
import type {HalaqahDetail, HalaqahListResponse} from '../types';

export async function getHalaqahList() {
  const {data} = await http.get<HalaqahListResponse>('/hafalan/halaqah');
  return data.data;
}

/** Detail halaqah beserta seluruh anggotanya, termasuk santri yang belum pernah setoran. */
export async function getHalaqahDetail(id: number) {
  const {data} = await http.get<{data: HalaqahDetail}>(`/hafalan/halaqah/${id}`);
  return data.data;
}
