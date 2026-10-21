export type MenuItem = {
  key: string;
  label: string;
  /** Nama route; kosong jika item hanya membuka bottom sheet */
  route?: string;
  /** Jika ada, tap pada item membuka bottom sheet berisi sub menu */
  children?: MenuItem[];
};
