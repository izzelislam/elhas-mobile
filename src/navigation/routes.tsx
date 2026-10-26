import React, {ComponentType} from 'react';
import {AbsensiScreen, JadwalScreen, KalenderScreen, NilaiScreen, RaporScreen} from '@/features/akademik/screens';
import {
  AbsenScreen,
  AbsensiAsatidzahRekapScreen,
  AbsensiAsatidzahScreen,
} from '@/features/absensiAsatidzah/screens';
import {AduanScreen} from '@/features/aduan/screens';
import {AsramaKamarScreen, AsramaPenghuniScreen} from '@/features/asrama/screens';
import {InformasiScreen} from '@/features/informasi/screens';
import {CatatanScreen, DispensasiScreen, KonselingScreen} from '@/features/kesantrian/screens';
import {TabunganScreen, TagihanScreen, TarikTabunganScreen} from '@/features/keuangan/screens';
import {NotifikasiScreen} from '@/features/notifikasi/screens';
import {
  AsramaGedungFlow,
  HalaqahFlow,
  IzinFlow,
  MutabaahFlow,
  PelanggaranFlow,
  PrestasiFlow,
  RingkasanFlow,
  SantriFlow,
  SetoranFlow,
} from './flows';
import type {RouteProps} from './types';

/**
 * Daftar route aplikasi. Key = `route` di menu.config.ts (dan nilai `navigate`).
 * Route yang tidak ada di sini jatuh ke dashboard.
 */
export const ROUTES: Record<string, ComponentType<RouteProps>> = {
  // Santri
  SantriList: SantriFlow,

  // Akademik
  Absensi: ({onBack}) => <AbsensiScreen onBack={onBack} />,
  Jadwal: ({onBack}) => <JadwalScreen onBack={onBack} />,
  Nilai: ({onBack}) => <NilaiScreen onBack={onBack} />,
  Rapor: ({onBack}) => <RaporScreen onBack={onBack} />,
  KalenderPendidikan: ({onBack}) => <KalenderScreen onBack={onBack} />,

  // Absensi Asatidzah
  AbsensiAsatidzahAbsen: ({onBack, navigate}) => (
    <AbsenScreen onBack={onBack} onSent={() => navigate('AbsensiAsatidzahRekap')} />
  ),
  AbsensiAsatidzahList: ({onBack}) => <AbsensiAsatidzahScreen onBack={onBack} />,
  AbsensiAsatidzahRekap: ({onBack}) => <AbsensiAsatidzahRekapScreen onBack={onBack} />,

  // Kesantrian
  Prestasi: PrestasiFlow,
  Pelanggaran: PelanggaranFlow,
  Izin: IzinFlow,
  Catatan: ({onBack}) => <CatatanScreen onBack={onBack} />,
  Konseling: ({onBack}) => <KonselingScreen onBack={onBack} />,
  Dispensasi: ({onBack}) => <DispensasiScreen onBack={onBack} />,

  // Asrama
  AsramaGedung: AsramaGedungFlow,
  AsramaKamar: ({onBack}) => <AsramaKamarScreen initialGedungId={null} onBack={onBack} />,
  AsramaPenghuni: ({onBack}) => <AsramaPenghuniScreen onBack={onBack} />,

  // Tahfidz
  Halaqoh: HalaqahFlow,
  Setoran: SetoranFlow,
  Ringkasan: RingkasanFlow,

  // Mutabaah
  MutabaahSantri: p => <MutabaahFlow {...p} variant="santri" />,
  MutabaahAsatidzah: p => <MutabaahFlow {...p} variant="asatidzah" />,

  // Keuangan
  Tabungan: ({onBack}) => <TabunganScreen onBack={onBack} />,
  TarikTabungan: ({onBack}) => <TarikTabunganScreen onBack={onBack} />,
  Tagihan: ({onBack}) => <TagihanScreen onBack={onBack} />,

  // Lainnya
  Aduan: ({onBack}) => <AduanScreen onBack={onBack} />,
  Informasi: ({onBack}) => <InformasiScreen onBack={onBack} />,
  Notifikasi: ({onBack, navigate}) => (
    <NotifikasiScreen
      onBack={onBack}
      onOpenRoute={path => {
        const target = NOTIF_ROUTES[path];
        if (target) {
          navigate(target);
        }
      }}
    />
  ),
};

/** `data.route` dari notifikasi (path backend) -> key di `ROUTES`. */
const NOTIF_ROUTES: Record<string, string> = {
  '/informasi': 'Informasi',
  '/aduan': 'Aduan',
  '/tagihan': 'Tagihan',
};
