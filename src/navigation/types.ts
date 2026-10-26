export type RouteProps = {
  /** Kembali ke dashboard. */
  onBack: () => void;
  /** Pindah ke route lain berdasarkan key di `ROUTES`. */
  navigate: (route: string) => void;
};
