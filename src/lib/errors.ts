import {isAxiosError} from 'axios';

/** Ringkasan penyebab error API untuk ditampilkan di toast, mis. "403: Tidak punya akses". */
export function describeError(err: unknown): string {
  if (isAxiosError(err)) {
    return err.response
      ? `${err.response.status}: ${err.response.data?.message ?? 'kesalahan server'}`
      : 'tidak dapat terhubung ke server';
  }
  return err instanceof Error ? err.message : '';
}
