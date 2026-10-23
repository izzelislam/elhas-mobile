import {http} from '@/services/api/client';

export type KategoriInformasi = {
  id: number;
  nama_kategori: string;
  slug: string;
  deskripsi: string | null;
  is_active: number;
};

export type Informasi = {
  id: number;
  kategori_informasi_id: number;
  judul: string;
  slug: string;
  isi: string;
  ringkasan: string | null;
  thumbnail: string | null;
  gambar: string | null;
  status: 'published' | 'draft' | 'archived';
  views: number;
  tanggal_publish: string | null;
  is_publish: boolean;
  created_at: string;
  kategori: {id: number; nama_kategori: string; slug: string} | null;
};

export async function getKategoriInformasi() {
  const {data} = await http.get<{data: KategoriInformasi[]}>(
    '/informasi/kategori',
  );
  return data.data;
}

export async function getInformasiList(params: {
  page?: number;
  per_page?: number;
  kategori_informasi_id?: number;
}) {
  const {data} = await http.get<{
    data: {
      data: Informasi[];
      current_page: number;
      last_page: number;
      total: number;
    };
  }>('/informasi', {params});
  return data.data;
}

export async function getInformasiDetail(id: number) {
  const {data} = await http.get<{data: Informasi}>(`/informasi/${id}`);
  return data.data;
}
