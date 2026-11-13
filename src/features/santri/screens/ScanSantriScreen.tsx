import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {Camera, CameraType} from 'react-native-camera-kit';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  ArrowLeft,
  BookOpen,
  CalendarCheck,
  ClipboardCheck,
  PiggyBank,
  ShieldAlert,
  User,
  type LucideIcon,
} from 'lucide-react-native';
import {isAxiosError} from 'axios';
import {Button} from '@/components/ui/Button';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';
import {useBackHandler} from '@/navigation/useBackHandler';
import {SetoranFormScreen} from '@/features/tahfidz/screens';
import {MutabaahSantriFormScreen} from '@/features/mutabaah/screens';
import {PelanggaranFormScreen} from '@/features/kesantrian/screens';
import AbsensiFormScreen from '@/features/akademik/screens/AbsensiFormScreen';
import TabunganTransaksiFormScreen from '@/features/keuangan/screens/TabunganTransaksiFormScreen';
import {getTabunganDetail, getTabunganList} from '@/features/keuangan/services/tabungan.service';
import type {TabunganDetail} from '@/features/keuangan/types';
import {SantriRingkas, searchSantriByNis} from '../services/santri.service';

type Shortcut = 'setoran' | 'tabungan' | 'mutabaah' | 'pelanggaran' | 'absensi';

const SHORTCUTS: {key: Shortcut; label: string; icon: LucideIcon}[] = [
  {key: 'setoran', label: 'Catat Hafalan', icon: BookOpen},
  {key: 'tabungan', label: 'Tabungan', icon: PiggyBank},
  {key: 'mutabaah', label: "Mutaba'ah", icon: ClipboardCheck},
  {key: 'pelanggaran', label: 'Pelanggaran', icon: ShieldAlert},
  {key: 'absensi', label: 'Absensi', icon: CalendarCheck},
];

async function mintaIzinKamera(): Promise<'ok' | 'ditolak' | 'diblokir'> {
  if (Platform.OS !== 'android') {
    return 'ok';
  }
  const r = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
  return r === PermissionsAndroid.RESULTS.GRANTED
    ? 'ok'
    : r === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
    ? 'diblokir'
    : 'ditolak';
}

/** Scan QR kartu santri (isinya NIS) -> info singkat santri -> shortcut input cepat. */
export default function ScanSantriScreen({onClose}: {onClose: () => void}) {
  const insets = useSafeAreaInsets();
  const [izin, setIzin] = useState<'ok' | 'ditolak' | 'diblokir' | null>(null);
  const [santri, setSantri] = useState<SantriRingkas | null>(null);
  const [shortcut, setShortcut] = useState<Shortcut | null>(null);
  const [tabungan, setTabungan] = useState<TabunganDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const busy = useRef(false); // kamera memicu onReadCode berulang selama QR terlihat

  useEffect(() => {
    mintaIzinKamera().then(setIzin);
  }, []);

  useBackHandler(() => {
    if (shortcut) {
      setShortcut(null);
      setTabungan(null);
    } else if (santri) {
      setSantri(null);
    } else {
      onClose();
    }
  });

  const onRead = useCallback(async (nis: string) => {
    if (busy.current) {
      return;
    }
    busy.current = true;
    setLoading(true);
    try {
      setSantri(await searchSantriByNis(nis.trim()));
    } catch (e) {
      toast.error(
        isAxiosError(e) && e.response?.status === 404
          ? 'Santri tidak ditemukan'
          : 'Gagal mencari santri',
      );
      setTimeout(() => {
        busy.current = false; // beri jeda sebelum boleh scan ulang
      }, 1500);
    } finally {
      setLoading(false);
    }
  }, []);

  const buka = async (k: Shortcut) => {
    if (k !== 'tabungan' || !santri) {
      setShortcut(k);
      return;
    }
    setLoading(true);
    try {
      const list = await getTabunganList({santri_id: santri.id, per_page: 1});
      if (!list.data.length) {
        toast.error('Santri ini belum punya rekening tabungan');
        return;
      }
      setTabungan(await getTabunganDetail(list.data[0].id));
      setShortcut('tabungan');
    } catch {
      toast.error('Gagal memuat tabungan');
    } finally {
      setLoading(false);
    }
  };

  const keInfo = () => {
    setShortcut(null);
    setTabungan(null);
  };
  const initialSantri = santri ? {id: santri.id, nama: santri.nama_lengkap} : null;

  if (santri && shortcut) {
    if (shortcut === 'setoran') {
      return <SetoranFormScreen initialSantri={initialSantri} onBack={keInfo} onSaved={keInfo} />;
    }
    if (shortcut === 'mutabaah') {
      return (
        <MutabaahSantriFormScreen
          variant="santri"
          initialSantri={initialSantri}
          onBack={keInfo}
          onSaved={keInfo}
        />
      );
    }
    if (shortcut === 'pelanggaran') {
      return <PelanggaranFormScreen initialSantri={initialSantri} onBack={keInfo} onSaved={keInfo} />;
    }
    if (shortcut === 'absensi') {
      return (
        <AbsensiFormScreen
          initialKelasId={santri.kelas_aktif?.id ?? null}
          onBack={keInfo}
          onSaved={keInfo}
        />
      );
    }
    if (shortcut === 'tabungan' && tabungan) {
      return <TabunganTransaksiFormScreen tabungan={tabungan} onBack={keInfo} onSaved={keInfo} />;
    }
  }

  if (santri) {
    return (
      <View className="flex-1 bg-canvas">
        <View style={{paddingTop: insets.top + 8}} className="bg-brand px-5 pb-4">
          <Pressable onPress={() => setSantri(null)} hitSlop={10} className="self-start">
            <ArrowLeft size={22} color={colors.brand.foreground} />
          </Pressable>
          <Text className="mt-2 text-title text-brand-foreground">Info Santri</Text>
        </View>
        <ScrollView contentContainerClassName="p-5 gap-4">
          <View className="items-center rounded-card bg-surface p-5">
            {santri.foto_url ? (
              <Image source={{uri: santri.foto_url}} className="h-24 w-24 rounded-full bg-canvas" />
            ) : (
              <View className="h-24 w-24 items-center justify-center rounded-full bg-canvas">
                <User size={40} color={colors.brand.DEFAULT} />
              </View>
            )}
            <Text className="mt-3 text-center text-title text-ink">{santri.nama_lengkap}</Text>
            <Text className="mt-1 text-label text-ink-muted">NIS {santri.nis}</Text>
            <Text className="text-label text-ink-muted">
              {santri.kelas_aktif?.nama ?? 'Belum ada kelas'}
              {santri.status ? ` · ${santri.status.label}` : ''}
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-3">
            {SHORTCUTS.map(({key, label, icon: Icon}) => (
              <Pressable
                key={key}
                onPress={() => buka(key)}
                disabled={loading}
                className="w-[31%] flex-grow items-center rounded-card bg-surface py-4 active:bg-canvas">
                <Icon size={24} color={colors.brand.DEFAULT} />
                <Text className="mt-2 text-center text-caption text-ink">{label}</Text>
              </Pressable>
            ))}
          </View>
          <Button title="Scan Santri Lain" variant="outline" onPress={() => setSantri(null)} />
        </ScrollView>
        {loading ? (
          <View className="absolute inset-0 items-center justify-center bg-black/20">
            <ActivityIndicator color={colors.brand.DEFAULT} />
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {izin === 'ok' ? (
        <Camera
          style={StyleSheet.absoluteFill}
          cameraType={CameraType.Back}
          scanBarcode
          showFrame
          frameColor="#ffffff"
          laserColor="#1E7B50"
          onReadCode={e => onRead(e.nativeEvent.codeStringValue)}
        />
      ) : (
        <View className="flex-1 items-center justify-center px-8">
          {izin === null ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text className="mb-4 text-center text-body text-white">
                Izin kamera diperlukan untuk scan kartu santri
              </Text>
              <Button
                title={izin === 'diblokir' ? 'Buka Pengaturan' : 'Izinkan Kamera'}
                onPress={() => (izin === 'diblokir' ? Linking.openSettings() : mintaIzinKamera().then(setIzin))}
              />
            </>
          )}
        </View>
      )}
      <View style={{paddingTop: insets.top + 8}} className="absolute left-0 right-0 top-0 px-5">
        <Pressable onPress={onClose} hitSlop={10} className="self-start rounded-full bg-black/40 p-2">
          <ArrowLeft size={22} color="#fff" />
        </Pressable>
      </View>
      <View style={{paddingBottom: insets.bottom + 24}} className="absolute bottom-0 left-0 right-0 items-center">
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="rounded-full bg-black/50 px-4 py-2 text-label text-white">
            Arahkan kamera ke QR pada kartu santri
          </Text>
        )}
      </View>
    </View>
  );
}
