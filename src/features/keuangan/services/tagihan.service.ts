import {API_BASE_URL, http} from '@/services/api/client';
import {useAuthStore} from '@/store/auth.store';
import type {Tagihan, TagihanDetail} from '../types';

export async function getTagihanList(params: {
  per_page?: number;
  page?: number;
  santri_id?: number;
  tahun_ajaran_id?: number;
  status?: string;
}) {
  const {data} = await http.get<{
    data: {data: Tagihan[]; meta: {current_page: number; last_page: number; total: number}};
  }>('/keuangan/tagihan', {params});
  return data.data;
}

export async function getTagihanDetail(id: number) {
  const {data} = await http.get<{data: TagihanDetail}>(`/keuangan/tagihan/${id}`);
  return data.data;
}

export type TahunAjaran = {id: number; nama: string; is_aktif: boolean};

export async function getTahunAjaranList() {
  const {data} = await http.get<{data: TahunAjaran[]}>('/akademik/tahun-ajaran', {
    params: {per_page: 100},
  });
  return data.data;
}

export type BuktiFile = {uri: string; name: string; type: string};

export type BayarPayload = {
  tagihan_id: number;
  nominal_bayar: number;
  metode_pembayaran: string;
};

/**
 * Petugas mencatat pembayaran sukses (bukti opsional); wali mengajukan dengan bukti wajib,
 * lalu pembayaran berstatus pending dan tagihan menunggu konfirmasi.
 */
export async function bayarTagihan(payload: BayarPayload, bukti?: BuktiFile | null) {
  if (bukti) {
    const form = new FormData();
    form.append('tagihan_id', String(payload.tagihan_id));
    form.append('nominal_bayar', String(payload.nominal_bayar));
    form.append('metode_pembayaran', payload.metode_pembayaran);
    form.append('bukti_pembayaran', bukti as unknown as Blob);
    const {data} = await http.post<{success: boolean; message: string}>(
      '/keuangan/pembayaran',
      form,
      {headers: {'Content-Type': 'multipart/form-data'}},
    );
    return data;
  }
  const {data} = await http.post<{success: boolean; message: string}>(
    '/keuangan/pembayaran',
    payload,
  );
  return data;
}


/** Petugas memutuskan pembayaran wali yang masih pending; penolakan wajib beralasan. */
export async function verifikasiPembayaran(
  id: number,
  payload: {status: 'accept'} | {status: 'reject'; note: string},
) {
  const {data} = await http.patch<{success: boolean; message: string}>(
    `/keuangan/pembayaran/${id}/verifikasi`,
    payload,
  );
  return data;
}

/**
 * Unduh kwitansi PDF ke folder Download lewat DownloadManager Android (ada notifikasi).
 * Endpoint butuh token, jadi tidak bisa dibuka langsung lewat Linking.
 */
export async function downloadKwitansi(tagihanId: number) {
  const ReactNativeBlobUtil = require('react-native-blob-util').default;
  const {token} = useAuthStore.getState();
  const name = `kwitansi-${tagihanId}.pdf`;
  const path = `${ReactNativeBlobUtil.fs.dirs.DownloadDir}/${name}`;
  await ReactNativeBlobUtil.config({
    fileCache: true,
    addAndroidDownloads: {
      useDownloadManager: true,
      notification: true,
      title: name,
      description: 'Kwitansi tagihan',
      mime: 'application/pdf',
      mediaScannable: true,
      path,
    },
  }).fetch('GET', `${API_BASE_URL}/keuangan/tagihan/${tagihanId}/kwitansi`, {
    Authorization: `Bearer ${token}`,
    Accept: 'application/pdf',
  });
  return name;
}
