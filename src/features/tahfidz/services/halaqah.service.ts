import {http} from '@/services/api/client';
import type {HalaqahListResponse} from '../types';

export async function getHalaqahList() {
  const {data} = await http.get<HalaqahListResponse>('/hafalan/halaqah');
  return data.data;
}
