const STATUS_COLOR: Record<string, string> = {
  lunas: '#059669',
  belum_bayar: '#DC2626',
  sebagian: '#D97706',
  menunggu_konfirmasi: '#2563EB',
};

export const statusColor = (v: string) => STATUS_COLOR[v] ?? '#6B7280';
export const statusLabel = (v: string) => v.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
