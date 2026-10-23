import {http} from '@/services/api/client';

export type Absensi = {
  id: number;
  santri: {id: number; nama_lengkap: string; nis: string} | null;
  kelas: {id: number; nama: string} | null;
  jadwal_pelajaran: unknown | null;
  tanggal: string;
  jenis: string;
  status: {value: string; label: string};
  keterangan: string | null;
  pencatat: {id: number; name: string} | null;
};

export async function getAbsensiList(params: {
  page?: number;
  per_page?: number;
  santri_id?: number;
  kelas_id?: number;
  tanggal?: string; // YYYY-MM-DD
  bulan?: string; // YYYY-MM
}) {
  const {data} = await http.get<{
    data: {
      data: Absensi[];
      meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
      };
    };
  }>('/absensi', {params});
  return data.data;
}

export type AbsensiStatus = 'hadir' | 'sakit' | 'izin' | 'alpha';

export type CreateAbsensiPayload = {
  kelas_id: number;
  tanggal: string; // YYYY-MM-DD
  /** Kosong = absen harian (universal), bukan untuk pelajaran tertentu. */
  jadwal_pelajaran_id?: number | null;
  records: {
    santri_id: number;
    status: AbsensiStatus;
    keterangan: string | null;
  }[];
};

export async function createAbsensi(payload: CreateAbsensiPayload) {
  const {data} = await http.post<{success: boolean; message: string}>(
    '/absensi',
    payload,
  );
  return data;
}

export type RekapAbsensi = {
  total: number;
  status: Partial<Record<AbsensiStatus, number>>;
  per_kelas: {
    kelas_id: number;
    total: number;
    hadir: string | number;
    kelas: {id: number; nama: string} | null;
  }[];
};

export async function getRekapAbsensi(params: {
  kelas_id?: number;
  tanggal_mulai?: string; // YYYY-MM-DD
  tanggal_selesai?: string;
  per_page?: number;
}) {
  const {data} = await http.get<{data: RekapAbsensi}>(
    '/absensi/rekap/ringkasan',
    {params},
  );
  return data.data;
}
