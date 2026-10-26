import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {Camera, CameraType} from 'react-native-camera-kit';
import type {CameraApi} from 'react-native-camera-kit/src/types';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, MapPin} from 'lucide-react-native';
import {isAxiosError} from 'axios';
import {ToastHost} from '@/components/ui/ToastHost';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';
import {jarakMeter} from '../format';
import {
  FotoFile,
  LokasiAbsensi,
  absenMasuk,
  absenPulang,
  getLokasiAbsensi,
} from '../services/absensiAsatidzah.service';

type Coord = {latitude: number; longitude: number};

type Izin = 'ok' | 'ditolak' | 'diblokir';

/** Android: minta izin saat runtime. iOS: izin diminta sistem saat kamera/lokasi dipakai pertama kali. */
async function mintaIzin(
  izin: 'CAMERA' | 'ACCESS_FINE_LOCATION',
): Promise<Izin> {
  if (Platform.OS !== 'android') {
    return 'ok';
  }
  const r = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS[izin],
  );
  return r === PermissionsAndroid.RESULTS.GRANTED
    ? 'ok'
    : r === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
    ? 'diblokir'
    : 'ditolak';
}

class LokasiError extends Error {
  constructor(message: string, public diblokir = false) {
    super(message);
  }
}

async function ambilLokasi(): Promise<Coord> {
  const izin = await mintaIzin('ACCESS_FINE_LOCATION');
  if (izin !== 'ok') {
    throw new LokasiError('Izin lokasi ditolak', izin === 'diblokir');
  }
  // Dimuat saat dipakai: modul native-nya melempar error saat di-import bila app belum di-build ulang.
  let Geolocation: typeof import('@react-native-community/geolocation').default;
  try {
    Geolocation = require('@react-native-community/geolocation').default;
  } catch {
    throw new LokasiError('Modul lokasi belum terpasang, build ulang aplikasi');
  }
  Geolocation.setRNConfiguration({
    authorizationLevel: 'whenInUse',
    skipPermissionRequests: false,
  });
  const posisi = (highAccuracy: boolean) =>
    new Promise<Coord>((resolve, reject) =>
      Geolocation.getCurrentPosition(
        p =>
          resolve({
            latitude: p.coords.latitude,
            longitude: p.coords.longitude,
          }),
        e => reject(e),
        // maximumAge 0: selalu posisi aktual, bukan cache lama
        {enableHighAccuracy: highAccuracy, timeout: 15000, maximumAge: 0},
      ),
    );
  try {
    return await posisi(true);
  } catch {
    try {
      return await posisi(false); // GPS sulit dapat fix (di dalam ruangan/emulator): coba jaringan
    } catch {
      throw new LokasiError(
        'Tidak dapat mengambil lokasi. Pastikan GPS aktif.',
      );
    }
  }
}

/** Pesan dari backend apa adanya (mis. "Anda berada di luar radius..."), tanpa awalan kode status. */
const pesanServer = (err: unknown) =>
  isAxiosError(err)
    ? err.response?.data?.message ?? 'Tidak dapat terhubung ke server'
    : err instanceof Error
    ? err.message
    : '';

const SESUAI = '#059669';
const TIDAK_SESUAI = '#DC2626';

/** Layar penuh: preview kamera depan, kartu lokasi di bawah, tombol shutter yang langsung mengirim absen. */
export default function AbsenKameraScreen({
  jenis,
  lokasi: lokasiAwal,
  onBack,
  onDone,
}: {
  jenis: 'masuk' | 'pulang';
  lokasi: LokasiAbsensi[];
  onBack: () => void;
  onDone: () => void;
}) {
  const insets = useSafeAreaInsets();
  const kamera = useRef<CameraApi>(null);
  const [izinKamera, setIzinKamera] = useState<Izin | null>(null);
  const [posisi, setPosisi] = useState<Coord | null>(null);
  const [lokasiError, setLokasiError] = useState<LokasiError | null>(null);
  const [mencari, setMencari] = useState(true);
  const [saving, setSaving] = useState(false);
  const [foto, setFoto] = useState<FotoFile | null>(null);
  const [lokasi, setLokasi] = useState(lokasiAwal);
  // Daftar lokasi kosong setelah dimuat = penugasan tanpa lokasi: absen tanpa lokasi_id dan tanpa cek radius.
  const [lokasiSiap, setLokasiSiap] = useState(lokasiAwal.length > 0);
  const tanpaLokasi = lokasiSiap && lokasi.length === 0;
  const kameraOk = izinKamera === 'ok';

  const mulai = useCallback(() => {
    setIzinKamera(null);
    setLokasiError(null);
    setMencari(true);
    if (!lokasi.length) {
      getLokasiAbsensi()
        .then(l => {
          setLokasi(l);
          setLokasiSiap(true);
        })
        .catch(() => {});
    }
    mintaIzin('CAMERA')
      .then(setIzinKamera)
      .catch(() => setIzinKamera('ditolak'));
    ambilLokasi()
      .then(setPosisi)
      .catch(err =>
        setLokasiError(
          err instanceof LokasiError
            ? err
            : new LokasiError('Gagal mengambil lokasi'),
        ),
      )
      .finally(() => setMencari(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(mulai, [mulai]);
  const perluPengaturan = izinKamera === 'diblokir' || !!lokasiError?.diblokir;

  // Lokasi terdekat dari posisi saat ini; sesuai bila berada dalam radiusnya.
  const terdekat = posisi
    ? lokasi
        .map(l => ({
          l,
          jarak: jarakMeter(
            posisi.latitude,
            posisi.longitude,
            l.latitude,
            l.longitude,
          ),
        }))
        .sort((a, b) => a.jarak - b.jarak)[0] ?? null
    : null;
  const sesuai = !!terdekat && terdekat.jarak <= terdekat.l.radius_meter;
  // Alasan kartu lokasi kosong, supaya tidak hanya "Lokasi tidak tersedia".
  const alasan = tanpaLokasi
    ? 'Penugasan Anda tidak terikat lokasi'
    : mencari
    ? ' '
    : !lokasi.length
    ? 'Tidak ada lokasi absensi aktif dari server'
    : !posisi
    ? 'Posisi perangkat belum didapat. Aktifkan GPS lalu coba lagi'
    : ' ';
  const judul = jenis === 'masuk' ? 'Presensi Masuk' : 'Presensi Keluar';

  const ambil = async () => {
    if (!kamera.current) {
      toast.error('Kamera belum siap');
      return;
    }
    setSaving(true);
    try {
      const f = await kamera.current.capture();
      const uri = /^[a-z]+:\/\//i.test(f.uri) ? f.uri : `file://${f.uri}`;
      setFoto({uri, name: f.name ?? 'absen.jpg', type: 'image/jpeg'});
    } catch {
      toast.error('Gagal mengambil foto');
    } finally {
      setSaving(false);
    }
  };

  const kirim = async () => {
    if (!foto) {
      return;
    }
    if (!tanpaLokasi && (!posisi || !terdekat)) {
      toast.error(
        lokasiError?.message ?? 'Lokasi belum tersedia, tunggu sebentar',
      );
      return;
    }
    setSaving(true);
    try {
      const kirimAbsen = jenis === 'masuk' ? absenMasuk : absenPulang;
      const payload = {
        latitude: posisi?.latitude,
        longitude: posisi?.longitude,
        foto,
      };
      const res = await kirimAbsen({
        ...payload,
        lokasi_id: tanpaLokasi ? undefined : terdekat?.l.id,
      }).catch(err => {
        // Penugasan tanpa lokasi tapi daftar lokasi terisi: ulangi tanpa lokasi_id.
        if (/tanpa lokasi/i.test(pesanServer(err))) {
          return kirimAbsen(payload);
        }
        throw err;
      });
      toast.success(res.message || `Absen ${jenis} berhasil`);
      onDone();
    } catch (err) {
      toast.error(pesanServer(err) || `Gagal absen ${jenis}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onBack}
    >
      <View className="flex-1 bg-black">
        {foto ? (
          <Image
            source={{uri: foto.uri}}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : kameraOk ? (
          <Camera
            ref={kamera}
            style={StyleSheet.absoluteFill}
            cameraType={CameraType.Front}
          />
        ) : (
          <View className="flex-1 items-center justify-center px-8">
            {izinKamera === null ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text className="text-center text-body text-white">
                  Izin kamera diperlukan untuk absen
                </Text>
                <Pressable
                  onPress={mulai}
                  className="mt-4 rounded-field bg-white px-5 py-3 active:opacity-80"
                >
                  <Text className="text-label font-semibold text-ink">
                    Coba lagi
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        )}

        <View
          style={{paddingTop: insets.top + 12}}
          className="absolute inset-x-0 top-0 flex-row items-center bg-black/40 px-5 pb-3"
        >
          <Pressable
            onPress={foto ? () => setFoto(null) : onBack}
            hitSlop={10}
            className="h-10 w-10 items-center justify-center rounded-full bg-black/40"
          >
            <ArrowLeft size={22} color="#fff" />
          </Pressable>
          <Text className="flex-1 text-center text-body font-semibold text-white">
            {judul}
          </Text>
          <View className="w-10" />
        </View>

        <View
          style={{paddingBottom: insets.bottom + 20}}
          className="absolute inset-x-0 bottom-0 items-center px-4"
        >
          <View className="w-full rounded-card bg-surface p-4">
            <View className="flex-row items-center">
              <MapPin size={22} color={colors.brand.DEFAULT} />
              <Text
                className="ml-3 flex-1 text-body font-semibold text-ink"
                numberOfLines={1}
              >
                {tanpaLokasi
                  ? 'Tanpa lokasi'
                  : terdekat?.l.nama ??
                    (mencari ? 'Mencari lokasi…' : 'Lokasi tidak tersedia')}
              </Text>
              {terdekat ? (
                <Text
                  style={{color: sesuai ? SESUAI : TIDAK_SESUAI}}
                  className="text-caption font-semibold italic"
                >
                  {sesuai
                    ? 'lokasi sesuai'
                    : `lokasi belum sesuai (${Math.round(terdekat.jarak)} m)`}
                </Text>
              ) : null}
            </View>
            <Text
              className="mt-1 text-caption text-ink-muted"
              numberOfLines={2}
            >
              {tanpaLokasi
                ? alasan
                : lokasiError?.message ?? terdekat?.l.alamat ?? alasan}
            </Text>
            {foto && posisi ? (
              <Text className="mt-2 text-caption text-ink-muted">
                Koordinat: {posisi.latitude.toFixed(5)},{' '}
                {posisi.longitude.toFixed(5)}
              </Text>
            ) : null}
            {foto && terdekat && !sesuai ? (
              <Text className="mt-1 text-caption font-medium text-destructive">
                Anda berada di luar radius {terdekat.l.radius_meter} m. Absen
                tetap dapat dikirim.
              </Text>
            ) : null}
            {!tanpaLokasi &&
            (lokasiError || perluPengaturan || (!mencari && !terdekat)) ? (
              <View className="mt-3 flex-row gap-4">
                <Pressable onPress={mulai} hitSlop={8}>
                  <Text className="text-label font-semibold text-brand">
                    Coba lagi
                  </Text>
                </Pressable>
                {perluPengaturan ? (
                  <Pressable onPress={() => Linking.openSettings()} hitSlop={8}>
                    <Text className="text-label font-semibold text-brand">
                      Buka pengaturan
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>

          {foto ? (
            <View className="mt-4 w-full flex-row gap-3">
              <Pressable
                onPress={() => setFoto(null)}
                disabled={saving}
                className="h-12 flex-1 items-center justify-center rounded-field bg-white active:opacity-80"
              >
                <Text className="text-label font-semibold text-ink">
                  Ulangi foto
                </Text>
              </Pressable>
              <Pressable
                onPress={kirim}
                disabled={saving}
                className={`h-12 flex-1 items-center justify-center rounded-field bg-brand active:bg-brand-dark ${
                  saving ? 'opacity-60' : ''
                }`}
              >
                {saving ? (
                  <ActivityIndicator color={colors.brand.foreground} />
                ) : (
                  <Text className="text-label font-semibold text-brand-foreground">
                    Kirim absen {jenis}
                  </Text>
                )}
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={ambil}
              disabled={saving || !kameraOk}
              className={`mt-4 h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-white/60 bg-white ${
                !kameraOk ? 'opacity-60' : 'active:opacity-80'
              }`}
            >
              {saving ? (
                <ActivityIndicator color={colors.brand.DEFAULT} />
              ) : null}
            </Pressable>
          )}
        </View>
        <ToastHost />
      </View>
    </Modal>
  );
}
