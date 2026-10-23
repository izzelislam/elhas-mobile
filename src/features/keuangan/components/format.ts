export const rupiah = (v: string | number) =>
  'Rp ' + Math.round(Number(v)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
