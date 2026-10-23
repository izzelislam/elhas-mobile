import {http} from '@/services/api/client';
import type {RiwayatTransaksi, TabunganDetail, TabunganListResponse} from '../types';

export async function getTabunganList(params: {
  per_page?: number;
  page?: number;
  santri_id?: number;
  no_rekening?: string;
}) {
  const {data} = await http.get<TabunganListResponse>('/tabungan', {params});
  return data.data;
}

export async function getRiwayatTabungan(params: {
  per_page?: number;
  page?: number;
  santri_id?: number;
  tanggal_mulai?: string;
  tanggal_selesai?: string;
}) {
  const {data} = await http.get<{
    data: {data: RiwayatTransaksi[]; current_page: number; last_page: number};
  }>('/tabungan/riwayat', {params});
  return data.data;
}

export async function getTabunganDetail(id: number) {
  const {data} = await http.get<{success: boolean; data: TabunganDetail}>(`/tabungan/${id}`);
  return data.data;
}

export type CreateTransaksiPayload = {
  tabungan_id: number;
  tipe: 'masuk' | 'keluar';
  nominal: number;
  keterangan: string;
};

export async function createTransaksi(payload: CreateTransaksiPayload) {
  const {data} = await http.post<{success: boolean; message: string}>('/tabungan/transaksi', payload);
  return data;
}
