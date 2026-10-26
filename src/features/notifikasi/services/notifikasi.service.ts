import {http} from '@/services/api/client';

export type Notifikasi = {
  id: number;
  category: string;
  title: string;
  body: string;
  data: {type?: string; route?: string} | null;
  scope: string;
  topic: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

export async function getNotifikasiList(params: {
  page?: number;
  per_page?: number;
  category?: string;
  read?: boolean;
}) {
  const {data} = await http.get<{
    data: {data: Notifikasi[]; current_page: number; last_page: number; total: number};
  }>('/notifications', {params});
  return data.data;
}

export async function getUnreadCount() {
  const {data} = await http.get<{data: {unread_count: number}}>('/notifications/unread-count');
  return data.data.unread_count;
}

export async function markAllRead() {
  const {data} = await http.patch<{data: {updated_count: number}}>('/notifications/read-all');
  return data.data.updated_count;
}

export async function markRead(id: number) {
  await http.patch(`/notifications/${id}/read`);
}
