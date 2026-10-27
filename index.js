/**
 * @format
 */

import { AppRegistry } from 'react-native';
import notifee from '@notifee/react-native';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

// Wajib terdaftar di luar komponen agar push saat aplikasi di latar belakang diproses.
try {
  setBackgroundMessageHandler(getMessaging(), async () => {});
} catch {
  // Firebase belum dikonfigurasi (google-services.json belum ada).
}

// Wajib terdaftar agar ketukan notifikasi notifee di latar belakang tidak memunculkan peringatan.
notifee.onBackgroundEvent(async () => {});

AppRegistry.registerComponent(appName, () => App);
