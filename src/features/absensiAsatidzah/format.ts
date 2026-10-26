const COLOR: Record<string, string> = {
  hadir: '#059669',
  terlambat: '#D97706',
  izin: '#2563EB',
  sakit: '#7C3AED',
  alpha: '#DC2626',
};

export const statusColor = (v: string) => COLOR[v] ?? '#6B7280';

export const bulanKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export const tanggalId = (v: string) =>
  new Date(v + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export const bulanId = (v: string) =>
  new Date(v + '-01T00:00:00').toLocaleDateString('id-ID', {month: 'long', year: 'numeric'});

/** Jarak dua titik koordinat dalam meter (haversine). */
export function jarakMeter(lat1: number, lng1: number, lat2: number, lng2: number) {
  const rad = (x: number) => (x * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(a));
}
