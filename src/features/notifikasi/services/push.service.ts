import {PermissionsAndroid, Platform} from 'react-native';
import notifee, {AndroidImportance, EventType} from '@notifee/react-native';
import {
  AuthorizationStatus,
  deleteToken,
  getInitialNotification,
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  requestPermission,
  subscribeToTopic,
  unsubscribeFromTopic,
  type RemoteMessage,
} from '@react-native-firebase/messaging';
import {http} from '@/services/api/client';
import {toast} from '@/store/toast.store';
import {version as APP_VERSION} from '../../../../package.json';

/** Endpoint backend penyimpan token perangkat (FCM). */
const DEVICE_TOKEN_PATH = '/notifications/device';

/** Android: "Samsung SM-A546E"; iOS tidak menyediakan model lewat API bawaan RN. */
function deviceName() {
  const c = Platform.constants as {Brand?: string; Model?: string};
  return [c.Brand, c.Model].filter(Boolean).join(' ') || Platform.OS;
}

/** Rute tujuan dari payload `data.route` pada push. */
export const routeOf = (m: RemoteMessage | null) =>
  typeof m?.data?.route === 'string' ? m.data.route : null;

async function askPermission() {
  if (Platform.OS === 'android') {
    if (Platform.Version >= 33) {
      const res = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      return res === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  }
  const status = await requestPermission(getMessaging());
  return (
    status === AuthorizationStatus.AUTHORIZED ||
    status === AuthorizationStatus.PROVISIONAL
  );
}

/** Topic yang sedang di-subscribe perangkat ini, untuk dilepas saat logout. */
let topics: string[] = [];

/**
 * Server mengembalikan topic role/kelas akun; perangkat ikut subscribe sendiri karena
 * langganan dari server terbukti tidak menjangkau token (push per-token sampai, per-topic tidak).
 */
async function syncTopics(next: string[]) {
  const fm = getMessaging();
  await Promise.all([
    ...topics.filter(t => !next.includes(t)).map(t => unsubscribeFromTopic(fm, t)),
    ...next.map(t => subscribeToTopic(fm, t)),
  ]);
  topics = next;
}

async function sendToken(token: string) {
  try {
    const res = await postToken(token);
    const list = res?.data?.topics;
    if (Array.isArray(list)) {
      await syncTopics(list.filter((t: unknown): t is string => typeof t === 'string'));
    }
    if (__DEV__) {
      console.log('[push] token terdaftar', token);
      console.log('[push] respons server', JSON.stringify(res, null, 2));
      console.log('[push] subscribe topic', topics);
    }
  } catch (e) {
    // Dicoba lagi saat aplikasi dibuka berikutnya; listener push tetap harus terpasang.
    if (__DEV__) {
      const err = e as {response?: {status?: number; data?: unknown}; message?: string};
      console.log('[push] daftar token gagal', err.response?.status, err.response?.data ?? err.message);
    }
  }
}

async function postToken(token: string) {
  const {data} = await http.post(DEVICE_TOKEN_PATH, {
    token,
    platform: Platform.OS,
    device_name: deviceName(),
    app_version: APP_VERSION,
  });
  return data;
}

const CHANNEL_ID = 'default';

/** Notifikasi sistem untuk push yang masuk saat app terbuka (FCM tidak menampilkannya sendiri). */
async function showForeground(title: string | undefined, body: string | undefined, data: RemoteMessage['data']) {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Notifikasi',
    importance: AndroidImportance.HIGH,
  });
  const strData: Record<string, string> = {};
  Object.entries(data ?? {}).forEach(([k, v]) => {
    if (typeof v === 'string') {
      strData[k] = v;
    }
  });
  await notifee.displayNotification({
    title,
    body,
    data: strData,
    android: {channelId: CHANNEL_ID, pressAction: {id: 'default'}},
  });
}

/**
 * Minta izin, daftarkan token FCM ke backend, dan pasang listener.
 * Aman dipanggil tanpa konfigurasi Firebase (google-services.json): kegagalan hanya dicatat.
 * Mengembalikan fungsi pembersih listener.
 */
export async function setupPush(onOpenRoute: (route: string) => void) {
  const offs: Array<() => void> = [];
  const log = (...a: unknown[]) => __DEV__ && console.log('[push]', ...a);
  try {
    log('setup dimulai');
    if (!(await askPermission())) {
      log('izin notifikasi ditolak, push tidak diaktifkan');
      return () => {};
    }
    log('izin notifikasi diberikan');
    const fm = getMessaging();
    const token = await getToken(fm);
    log('token FCM didapat');
    await sendToken(token);
    offs.push(onTokenRefresh(fm, sendToken));
    // Aplikasi terbuka: push tidak tampil otomatis, jadi tampilkan lewat notifee (toast bila gagal).
    offs.push(
      onMessage(fm, async m => {
        log('pesan masuk (app terbuka)', JSON.stringify({notification: m.notification, data: m.data}));
        // Pesan data-only tidak punya blok notification: pakai title/body dari data bila ada.
        const str = (v: unknown) => (typeof v === 'string' ? v : undefined);
        const title = m.notification?.title ?? str(m.data?.title);
        const body = m.notification?.body ?? str(m.data?.body) ?? str(m.data?.message);
        if (!title && !body) {
          return;
        }
        try {
          await showForeground(title, body, m.data);
        } catch {
          toast.success([title, body].filter(Boolean).join(': '));
        }
      }),
    );
    // Notifikasi diketuk saat aplikasi di latar belakang atau sudah ditutup.
    offs.push(
      onNotificationOpenedApp(fm, m => {
        const r = routeOf(m);
        if (r) {
          onOpenRoute(r);
        }
      }),
    );
    // Ketukan pada notifikasi yang ditampilkan notifee saat app terbuka.
    offs.push(
      notifee.onForegroundEvent(({type, detail}) => {
        const r = detail.notification?.data?.route;
        if (type === EventType.PRESS && typeof r === 'string') {
          onOpenRoute(r);
        }
      }),
    );
    const tapped = (await notifee.getInitialNotification())?.notification?.data?.route;
    const initial =
      routeOf(await getInitialNotification(fm)) ?? (typeof tapped === 'string' ? tapped : null);
    if (initial) {
      onOpenRoute(initial);
    }
  } catch (e) {
    if (__DEV__) {
      console.log('[push] setup gagal', e);
    }
  }
  return () => offs.forEach(off => off());
}

/** Daftarkan ulang token ke backend agar topic role/kelas mengikuti data akun terbaru. */
export async function refreshDevice() {
  try {
    await sendToken(await getToken(getMessaging()));
  } catch {}
}

/** Dipanggil sebelum logout (token auth masih berlaku) agar perangkat tidak menerima push akun lama. */
export async function teardownPush() {
  const log = (...a: unknown[]) => __DEV__ && console.log('[push]', ...a);
  try {
    const fm = getMessaging();
    const token = await getToken(fm);
    try {
      await http.delete(DEVICE_TOKEN_PATH, {data: {token}});
      log('device dihapus dari server');
    } catch (e) {
      const err = e as {response?: {status?: number; data?: unknown}; message?: string};
      log('hapus device gagal', err.response?.status, err.response?.data ?? err.message);
    }
    await Promise.all(topics.map(t => unsubscribeFromTopic(fm, t).catch(() => {})));
    topics = [];
    await deleteToken(fm);
  } catch (e) {
    log('teardown gagal', e);
  }
}
