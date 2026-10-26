import {http} from '@/services/api/client';

export type AbsensiAsatidzah = {
  id: number;
  user_id: number;
  lokasi_id: number;
  tanggal: string;
  jam_masuk: string | null;
  jam_pulang: string | null;
  status: {value: string; label: string};
  foto_masuk_url: string | null;
  foto_pulang_url: string | null;
  lat_masuk: number | null;
  lng_masuk: number | null;
  lat_pulang: number | null;
  lng_pulang: number | null;
  keterangan: string | null;
  user: {id: number; name: string; nip: string | null; jabatan: string | null} | null;
  lokasi: {id: number; nama: string; radius_meter: number} | null;
};

export type LokasiAbsensi = {
  id: number;
  nama: string;
  kode: string;
  alamat: string | null;
  latitude: number;
  longitude: number;
  radius_meter: number;
  is_active: boolean;
};

export type FotoFile = {uri: string; name: string; type: string};

/** Backend membatasi hasil ke pengguna login; user_id hanya berlaku untuk admin/kepala/superadmin. */
export async function getAbsensiAsatidzahList(params: {
  user_id?: number;
  tanggal?: string; // YYYY-MM-DD
  bulan?: string; // YYYY-MM
  lokasi_id?: number;
}) {
  const {data} = await http.get<{data: AbsensiAsatidzah[]}>('/absensi-asatidzah', {params});
  return data.data;
}

export async function getAbsensiAsatidzahDetail(id: number) {
  const {data} = await http.get<{data: AbsensiAsatidzah}>(`/absensi-asatidzah/${id}`);
  return data.data;
}

export async function getAbsensiHariIni() {
  const {data} = await http.get<{data: {absensi: AbsensiAsatidzah | null; tanggal: string}}>(
    '/absensi-asatidzah/hari-ini',
  );
  return data.data;
}

export async function getLokasiAbsensi() {
  const {data} = await http.get<{data: LokasiAbsensi[]}>('/absensi-asatidzah/lokasi');
  return data.data.filter(l => l.is_active);
}

/** Penugasan tanpa lokasi: kosongkan `lokasi_id` (backend menolak bila diisi). */
type AbsenPayload = {
  lokasi_id?: number;
  latitude?: number;
  longitude?: number;
  foto: FotoFile;
  keterangan?: string;
};

async function absen(jenis: 'check-in' | 'check-out', p: AbsenPayload) {
  const form = new FormData();
  if (p.lokasi_id !== undefined) {
    form.append('lokasi_id', String(p.lokasi_id));
  }
  if (p.latitude !== undefined && p.longitude !== undefined) {
    form.append('latitude', String(p.latitude));
    form.append('longitude', String(p.longitude));
  }
  form.append('foto_bukti', p.foto as unknown as Blob);
  if (p.keterangan) {
    form.append('keterangan', p.keterangan);
  }
  const {data} = await http.post<{success: boolean; message: string}>(
    `/absensi-asatidzah/${jenis}`,
    form,
    {headers: {'Content-Type': 'multipart/form-data'}},
  );
  return data;
}

export const absenMasuk = (p: AbsenPayload) => absen('check-in', p);
export const absenPulang = (p: AbsenPayload) => absen('check-out', p);
