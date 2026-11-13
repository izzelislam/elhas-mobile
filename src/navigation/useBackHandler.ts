import {useEffect, useRef} from 'react';
import {BackHandler} from 'react-native';

/**
 * Tombol back device. Navigasi app ini berbasis state (bukan React Navigation),
 * jadi tanpa ini back langsung menutup app. Listener dipanggil dari yang
 * terakhir terdaftar: layar turunan (aktif belakangan) menang atas induknya.
 * Handler mengembalikan `false` untuk meneruskan ke default (keluar app).
 */
export function useBackHandler(handler: () => boolean | void, enabled = true) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => ref.current() !== false);
    return () => sub.remove();
  }, [enabled]);
}
