import {useEffect} from 'react';
import {Platform} from 'react-native';
import SpInAppUpdates, {IAUUpdateKind} from 'sp-react-native-in-app-updates';

// Cek versi baru di Play Store saat app dibuka; jika ada, tampilkan popup update.
// Hanya bekerja pada build yang terpasang dari Play Store (termasuk internal testing).
export function useInAppUpdate() {
  useEffect(() => {
    if (Platform.OS !== 'android' || __DEV__) {
      return;
    }
    const updater = new SpInAppUpdates(false);
    updater
      .checkNeedsUpdate()
      .then(res => {
        if (res.shouldUpdate) {
          updater.startUpdate({updateType: IAUUpdateKind.IMMEDIATE});
        }
      })
      .catch(() => {});
  }, []);
}
