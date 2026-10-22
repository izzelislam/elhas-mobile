import {http} from '@/services/api/client';

export type Unit = {id: number; nama: string; singkatan: string | null};

export type Kelas = {
  id: number;
  nama: string;
  tingkat: {id: number; nama: string} | null;
  jumlah_santri: number;
};

export async function getUnitList(): Promise<Unit[]> {
  const {data} = await http.get<{data: Unit[]}>('/unit');
  return data.data;
}

export async function getKelasList(): Promise<Kelas[]> {
  const {data} = await http.get<{data: Kelas[]}>('/kelas');
  return data.data;
}

/**
 * Respons /kelas tidak memuat unit, jadi kelas dicocokkan ke unit lewat singkatan unit
 * pada nama kelas (mis. "Kelas 1 MTs Putra" → unit "MTs").
 */
export function kelasInUnit(kelas: Kelas, unit: Unit | undefined) {
  if (!unit?.singkatan) {
    return false;
  }
  const abbr = unit.singkatan.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${abbr}\\b`, 'i').test(`${kelas.nama} ${kelas.tingkat?.nama ?? ''}`);
}

let cache: {units: Unit[]; kelas: Kelas[]} | null = null;

export const getCachedReferensi = () => cache;

/** Unit dan kelas jarang berubah: dimuat sekali lalu dipakai ulang selama aplikasi berjalan. */
export async function loadReferensi() {
  if (!cache) {
    const [units, kelas] = await Promise.all([getUnitList(), getKelasList()]);
    cache = {units, kelas};
  }
  return cache;
}
