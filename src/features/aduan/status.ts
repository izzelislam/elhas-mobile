const COLOR: Record<string, string> = {
  menunggu: '#D97706',
  diproses: '#2563EB',
  selesai: '#059669',
};

export const aduanColor = (v: string) => COLOR[v] ?? '#6B7280';
export const aduanLabel = (v: string) => v.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
