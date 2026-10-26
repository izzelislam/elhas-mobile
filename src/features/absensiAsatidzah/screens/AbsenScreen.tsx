import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Pressable, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft} from 'lucide-react-native';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';
import {statusColor, tanggalId} from '../format';
import {
  AbsensiAsatidzah,
  LokasiAbsensi,
  getAbsensiHariIni,
  getLokasiAbsensi,
} from '../services/absensiAsatidzah.service';

// Modul kamera native: dimuat saat dibuka agar layar lain tidak ikut gagal bila app belum di-build ulang.
const KameraScreen = () => require('./AbsenKameraScreen').default as typeof import('./AbsenKameraScreen').default;

/** Status absen hari ini; tombol membuka kamera untuk absen masuk, lalu pulang. */
export default function AbsenScreen({
  onBack,
  onSent,
}: {
  onBack: () => void;
  /** Dipanggil setelah absen berhasil terkirim. */
  onSent?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [hariIni, setHariIni] = useState<AbsensiAsatidzah | null>(null);
  const [tanggal, setTanggal] = useState('');
  const [lokasi, setLokasi] = useState<LokasiAbsensi[]>([]);
  const [kamera, setKamera] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([getAbsensiHariIni(), getLokasiAbsensi()])
      .then(([h, l]) => {
        setHariIni(h.absensi);
        setTanggal(h.tanggal);
        setLokasi(l);
        setFailed(false);
      })
      .catch(() => {
        setFailed(true);
        toast.error('Gagal memuat status absensi');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  // Absen masuk sekali, pulang sekali; absensi hari ini tanpa jam masuk (izin/sakit/alpha) tidak bisa diabsen.
  const selesai = !!hariIni && (!hariIni.jam_masuk || !!hariIni.jam_pulang);
  const jenis = hariIni?.jam_masuk ? 'pulang' : 'masuk';

  const buka = async () => {
    // Cek ulang ke server: status di layar bisa usang (absen dari perangkat lain, atau ketukan ganda).
    try {
      const terkini = (await getAbsensiHariIni()).absensi;
      if (terkini && (!terkini.jam_masuk || terkini.jam_pulang || jenis === 'masuk')) {
        setHariIni(terkini);
        toast.error(
          terkini.jam_pulang
            ? 'Anda sudah absen masuk dan pulang hari ini'
            : terkini.jam_masuk
            ? 'Anda sudah absen masuk hari ini'
            : `Absensi hari ini tercatat ${terkini.status.label}`,
        );
        return;
      }
    } catch {
      toast.error('Gagal memeriksa status absensi');
      return;
    }
    setKamera(true);
  };

  if (kamera) {
    const Kamera = KameraScreen();
    return (
      <Kamera
        jenis={jenis}
        lokasi={lokasi}
        onBack={() => setKamera(false)}
        onDone={() => {
          setKamera(false);
          if (onSent) {
            onSent();
          } else {
            load();
          }
        }}
      />
    );
  }

  return (
    <View className="flex-1 bg-canvas">
      <View style={{paddingTop: insets.top + 24}} className="bg-brand px-5 pb-5">
        <Pressable onPress={onBack} hitSlop={10} className="self-start">
          <ArrowLeft size={22} color={colors.brand.foreground} />
        </Pressable>
        <Text className="mt-3 text-heading text-brand-foreground">Absen</Text>
        {tanggal ? (
          <Text className="text-label text-brand-foreground opacity-80">{tanggalId(tanggal)}</Text>
        ) : null}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand.DEFAULT} />
        </View>
      ) : failed ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-4 text-center text-body text-ink-muted">Status absensi tidak dapat dimuat</Text>
          <Button title="Coba lagi" onPress={load} />
        </View>
      ) : (
        <View className="p-5">
          <Card className="mb-4 border-0 p-4">
            <View className="flex-row">
              <View className="flex-1">
                <Text className="text-caption text-ink-muted">Masuk</Text>
                <Text className="text-heading text-ink">{hariIni?.jam_masuk ?? '--:--'}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-caption text-ink-muted">Pulang</Text>
                <Text className="text-heading text-ink">{hariIni?.jam_pulang ?? '--:--'}</Text>
              </View>
            </View>
            {hariIni ? (
              <Text
                style={{color: statusColor(hariIni.status.value)}}
                className="mt-2 text-label font-semibold">
                {hariIni.status.label}
              </Text>
            ) : null}
          </Card>

          {selesai ? (
            <Text className="mt-4 text-center text-body text-ink-muted">
              {hariIni?.jam_masuk
                ? 'Absensi hari ini sudah lengkap.'
                : `Absensi hari ini tercatat ${hariIni?.status.label}, tidak perlu absen lagi.`}
            </Text>
          ) : (
            <Button title={jenis === 'masuk' ? 'Absen Masuk' : 'Absen Pulang'} onPress={buka} />
          )}
        </View>
      )}
    </View>
  );
}
