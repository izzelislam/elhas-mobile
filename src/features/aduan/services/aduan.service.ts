import {http} from '@/services/api/client';

export type Aduan = {
  id: number;
  santri_id: number;
  judul: string;
  isi: string;
  status: string;
  tanggapan: string | null;
  ditanggapi_oleh: number | null;
  ditanggapi_pada: string | null;
  created_at: string;
  santri: {id: number; nama_lengkap: string; nis: string} | null;
  wali: {id: number; name: string} | null;
  penanggap: {id: number; name: string} | null;
};

export async function getAduanList(params: {page?: number; per_page?: number; status?: string}) {
  const {data} = await http.get<{
    data: {data: Aduan[]; current_page: number; last_page: number; total: number};
  }>('/aduan-wali', {params});
  return data.data;
}

export async function getAduanDetail(id: number) {
  const {data} = await http.get<{data: Aduan}>(`/aduan-wali/${id}`);
  return data.data;
}

export async function createAduan(payload: {santri_id: number; judul: string; isi: string}) {
  const {data} = await http.post<{success: boolean; message: string}>('/aduan-wali', payload);
  return data;
}

/** Petugas mengubah status aduan (diproses/selesai) beserta tanggapan. */
export async function updateAduan(
  id: number,
  payload: {status: 'diproses' | 'selesai'; tanggapan?: string},
) {
  const {data} = await http.patch<{success: boolean; message: string}>(`/aduan-wali/${id}`, payload);
  return data;
}

/** Wali mengubah judul dan isi aduan miliknya. */
export async function editAduan(id: number, payload: {judul: string; isi: string}) {
  const {data} = await http.put<{success: boolean; message: string}>(`/aduan-wali/${id}`, payload);
  return data;
}

export async function deleteAduan(id: number) {
  const {data} = await http.delete<{success: boolean; message: string}>(`/aduan-wali/${id}`);
  return data;
}
