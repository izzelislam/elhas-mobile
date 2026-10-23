import {http} from '@/services/api/client';

export type JadwalPelajaran = {
  id: number;
  kelas_id: number;
  mata_pelajaran_id: number;
  ustadz_id: number;
  hari: string;
  jam_mulai: string; // HH:mm:ss
  jam_selesai: string;
  semester: string;
  kelas: {id: number; nama: string} | null;
  mata_pelajaran: {
    id: number;
    nama: string;
    kode: string | null;
    kategori: string | null;
  } | null;
  ustadz: {id: number; name: string} | null;
};

export async function getJadwalList(params: {
  kelas_id?: number;
  hari?: string;
  semester?: string;
}) {
  const {data} = await http.get<{data: JadwalPelajaran[]}>('/akademik/jadwal', {
    params,
  });
  return data.data;
}

export type JadwalDetail = Omit<
  JadwalPelajaran,
  'kelas' | 'mata_pelajaran' | 'ustadz'
> & {
  kelas: {
    id: number;
    nama: string;
    jenis_kelamin: string | null;
    kapasitas: number | null;
  } | null;
  mata_pelajaran: {
    id: number;
    nama: string;
    kode: string | null;
    kategori: string | null;
    deskripsi: string | null;
  } | null;
  ustadz: {
    id: number;
    name: string;
    email: string | null;
    no_hp: string | null;
    jabatan: string | null;
    foto: string | null;
  } | null;
};

export async function getJadwalDetail(id: number) {
  const {data} = await http.get<{data: JadwalDetail}>(`/akademik/jadwal/${id}`);
  return data.data;
}

export type MataPelajaran = {id: number; nama: string};

let mapelCache: MataPelajaran[] | null = null;

export const getCachedMataPelajaran = () => mapelCache;

/**
 * Belum ada endpoint daftar mata pelajaran, jadi diturunkan dari seluruh jadwal pelajaran
 * (tanpa filter kelas). Dimuat sekali lalu dipakai ulang selama aplikasi berjalan.
 */
export async function loadMataPelajaran(): Promise<MataPelajaran[]> {
  if (!mapelCache) {
    const jadwal = await getJadwalList({});
    const map = new Map<number, string>();
    jadwal.forEach(
      j =>
        j.mata_pelajaran && map.set(j.mata_pelajaran.id, j.mata_pelajaran.nama),
    );
    mapelCache = [...map]
      .map(([id, nama]) => ({id, nama}))
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }
  return mapelCache;
}
