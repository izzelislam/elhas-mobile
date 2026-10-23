export const scoreColor = (n: number) =>
  n >= 80 ? '#059669' : n >= 70 ? '#2563EB' : n >= 60 ? '#D97706' : '#DC2626';

export const predikat = (n: number) =>
  n >= 80
    ? 'Sangat Baik'
    : n >= 70
    ? 'Baik'
    : n >= 60
    ? 'Cukup'
    : 'Perlu Ditingkatkan';
