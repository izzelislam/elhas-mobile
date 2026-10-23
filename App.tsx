import './global.css';
import {useCallback, useEffect, useState} from 'react';
import {StatusBar, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {PortalHost} from '@rn-primitives/portal';
import {CircleUser, CircleHelp, Home, Receipt} from 'lucide-react-native';
import {DashboardScreen} from '@/features/dashboard/screens';
import {SantriDetailScreen, SantriListScreen} from '@/features/santri/screens';
import {
  AbsensiScreen,
  JadwalScreen,
  KalenderScreen,
  NilaiScreen,
  RaporScreen,
} from '@/features/akademik/screens';
import {
  CatatanScreen,
  IzinFormScreen,
  DispensasiScreen,
  IzinScreen,
  KonselingScreen,
  PelanggaranDetailScreen,
  PelanggaranFormScreen,
  PelanggaranScreen,
  PrestasiDetailScreen,
  PrestasiScreen,
} from '@/features/kesantrian/screens';
import {
  HalaqahDetailScreen,
  HalaqahScreen,
  RingkasanDetailScreen,
  RingkasanScreen,
  SetoranDetailScreen,
  SetoranFormScreen,
  SetoranScreen,
} from '@/features/tahfidz/screens';
import {
  MutabaahSantriDetailScreen,
  MutabaahSantriFormScreen,
  MutabaahSantriScreen,
} from '@/features/mutabaah/screens';
import {
  TagihanScreen,
  TarikTabunganScreen,
  TabunganScreen,
} from '@/features/keuangan/screens';
import {AduanScreen} from '@/features/aduan/screens';
import {InformasiScreen} from '@/features/informasi/screens';
import {AkunScreen} from '@/features/akun/screens';
import {
  LoginScreen,
  OnboardingScreen,
  SplashScreen,
} from '@/features/auth/screens';
import {getMe} from '@/features/auth/services/auth.service';
import type {RekapSantri} from '@/features/mutabaah/types';
import type {RekapParams} from '@/features/mutabaah/services/mutabaah.service';
import type {Halaqah, RingkasanSantri} from '@/features/tahfidz/types';
import type {Pelanggaran, Prestasi} from '@/features/kesantrian/types';
import {
  AsramaGedungScreen,
  AsramaKamarScreen,
  AsramaPenghuniScreen,
} from '@/features/asrama/screens';
import {useSetoranDetail} from '@/features/tahfidz/store';
import {useAuthStore} from '@/store/auth.store';
import {useAppStore} from '@/store/app.store';
import {themeVars} from '@/theme';

function useHydrated() {
  const [done, setDone] = useState(
    useAuthStore.persist.hasHydrated() && useAppStore.persist.hasHydrated(),
  );
  useEffect(() => {
    const check = () =>
      setDone(
        useAuthStore.persist.hasHydrated() && useAppStore.persist.hasHydrated(),
      );
    const offs = [
      useAuthStore.persist.onFinishHydration(check),
      useAppStore.persist.onFinishHydration(check),
    ];
    check();
    return () => offs.forEach(off => off());
  }, []);
  return done;
}
import {ToastHost} from '@/components/ui/ToastHost';
import {DialogHost} from '@/components/ui/DialogHost';
import {BottomNav, NavItem} from '@/components/navigation/BottomNav';

const NAV: NavItem[] = [
  {key: 'home', label: 'Beranda', icon: Home},
  {key: 'transaksi', label: 'Transaksi', icon: Receipt},
  {key: 'bantuan', label: 'Bantuan', icon: CircleHelp},
  {key: 'akun', label: 'Akun', icon: CircleUser},
];

function MainApp() {
  const [tab, setTab] = useState('home');
  const setoranDetail = useSetoranDetail(s => s.selected);
  const closeSetoranDetail = useSetoranDetail(s => s.close);
  const [route, setRoute] = useState<string | null>(null);
  const [prestasi, setPrestasi] = useState<Prestasi | null>(null);
  const [pelanggaran, setPelanggaran] = useState<Pelanggaran | null>(null);
  const [pelanggaranForm, setPelanggaranForm] = useState(false);
  const [izinForm, setIzinForm] = useState(false);
  const [halaqah, setHalaqah] = useState<Halaqah | null>(null);
  const [setoranForm, setSetoranForm] = useState(false);
  const [ringkasanSantri, setRingkasanSantri] =
    useState<RingkasanSantri | null>(null);
  const [asramaGedungId, setAsramaGedungId] = useState<number | null>(null); // gedung terpilih dari menu Gedung
  const [mutabaahForm, setMutabaahForm] = useState(false);
  const [mutabaahDetail, setMutabaahDetail] = useState<{
    santri: RekapSantri;
    params: Omit<RekapParams, 'santri_id'>;
  } | null>(null);
  const mutabaahVariant =
    route === 'MutabaahAsatidzah' ? 'asatidzah' : 'santri';
  const [santriId, setSantriId] = useState<number | null>(null);
  const setUser = useAuthStore(s => s.setUser);
  const themeId = useAppStore(s => s.themeId);
  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => {}); // 401 ditangani interceptor (logout)
  }, [setUser]);
  return (
    // key = tema: tombol/ikon yang membaca warna lewat JS ikut tergambar ulang saat tema berganti
    <View key={themeId} className="flex-1 bg-surface">
      <View className="flex-1">
        {tab === 'home' ? (
          setoranDetail ? (
            <SetoranDetailScreen
              item={setoranDetail}
              onBack={closeSetoranDetail}
            />
          ) : route === 'SantriList' && santriId !== null ? (
            <SantriDetailScreen
              id={santriId}
              onBack={() => setSantriId(null)}
            />
          ) : (route === 'MutabaahSantri' || route === 'MutabaahAsatidzah') &&
            mutabaahForm ? (
            <MutabaahSantriFormScreen
              variant={mutabaahVariant}
              onBack={() => setMutabaahForm(false)}
              onSaved={() => setMutabaahForm(false)}
            />
          ) : (route === 'MutabaahSantri' || route === 'MutabaahAsatidzah') &&
            mutabaahDetail ? (
            <MutabaahSantriDetailScreen
              variant={mutabaahVariant}
              santri={mutabaahDetail.santri}
              params={mutabaahDetail.params}
              onBack={() => setMutabaahDetail(null)}
            />
          ) : route === 'MutabaahSantri' || route === 'MutabaahAsatidzah' ? (
            <MutabaahSantriScreen
              variant={mutabaahVariant}
              onBack={() => setRoute(null)}
              onCreate={() => setMutabaahForm(true)}
              onSelect={(santri, params) => setMutabaahDetail({santri, params})}
            />
          ) : route === 'Ringkasan' && ringkasanSantri ? (
            <RingkasanDetailScreen
              ringkasan={ringkasanSantri}
              onBack={() => setRingkasanSantri(null)}
            />
          ) : route === 'Ringkasan' ? (
            <RingkasanScreen
              onBack={() => setRoute(null)}
              onSelect={setRingkasanSantri}
            />
          ) : route === 'Setoran' && setoranForm ? (
            <SetoranFormScreen
              onBack={() => setSetoranForm(false)}
              onSaved={() => setSetoranForm(false)}
            />
          ) : route === 'Setoran' ? (
            <SetoranScreen
              onBack={() => setRoute(null)}
              onCreate={() => setSetoranForm(true)}
            />
          ) : route === 'Halaqoh' && halaqah ? (
            <HalaqahDetailScreen
              halaqah={halaqah}
              onBack={() => setHalaqah(null)}
            />
          ) : route === 'Halaqoh' ? (
            <HalaqahScreen
              onBack={() => setRoute(null)}
              onSelect={setHalaqah}
            />
          ) : route === 'AsramaGedung' ? (
            <AsramaGedungScreen
              onBack={() => setRoute(null)}
              onSelect={id => {
                setAsramaGedungId(id);
                setRoute('AsramaKamar');
              }}
            />
          ) : route === 'AsramaKamar' ? (
            <AsramaKamarScreen
              initialGedungId={asramaGedungId}
              onBack={() => {
                setAsramaGedungId(null);
                setRoute(null);
              }}
            />
          ) : route === 'AsramaPenghuni' ? (
            <AsramaPenghuniScreen onBack={() => setRoute(null)} />
          ) : route === 'Aduan' ? (
            <AduanScreen onBack={() => setRoute(null)} />
          ) : route === 'Rapor' ? (
            <RaporScreen onBack={() => setRoute(null)} />
          ) : route === 'Nilai' ? (
            <NilaiScreen onBack={() => setRoute(null)} />
          ) : route === 'Jadwal' ? (
            <JadwalScreen onBack={() => setRoute(null)} />
          ) : route === 'Absensi' ? (
            <AbsensiScreen onBack={() => setRoute(null)} />
          ) : route === 'Informasi' ? (
            <InformasiScreen onBack={() => setRoute(null)} />
          ) : route === 'Tagihan' ? (
            <TagihanScreen onBack={() => setRoute(null)} />
          ) : route === 'TarikTabungan' ? (
            <TarikTabunganScreen onBack={() => setRoute(null)} />
          ) : route === 'Tabungan' ? (
            <TabunganScreen onBack={() => setRoute(null)} />
          ) : route === 'Dispensasi' ? (
            <DispensasiScreen onBack={() => setRoute(null)} />
          ) : route === 'Konseling' ? (
            <KonselingScreen onBack={() => setRoute(null)} />
          ) : route === 'Catatan' ? (
            <CatatanScreen onBack={() => setRoute(null)} />
          ) : route === 'Izin' && izinForm ? (
            <IzinFormScreen
              onBack={() => setIzinForm(false)}
              onSaved={() => setIzinForm(false)}
            />
          ) : route === 'Izin' ? (
            <IzinScreen
              onBack={() => setRoute(null)}
              onCreate={() => setIzinForm(true)}
            />
          ) : route === 'Prestasi' && prestasi ? (
            <PrestasiDetailScreen
              initial={prestasi}
              onBack={() => setPrestasi(null)}
            />
          ) : route === 'Prestasi' ? (
            <PrestasiScreen
              onBack={() => setRoute(null)}
              onSelect={setPrestasi}
            />
          ) : route === 'Pelanggaran' && pelanggaranForm ? (
            <PelanggaranFormScreen
              onBack={() => setPelanggaranForm(false)}
              onSaved={() => setPelanggaranForm(false)}
            />
          ) : route === 'Pelanggaran' && pelanggaran ? (
            <PelanggaranDetailScreen
              item={pelanggaran}
              onBack={() => setPelanggaran(null)}
            />
          ) : route === 'Pelanggaran' ? (
            <PelanggaranScreen
              onBack={() => setRoute(null)}
              onSelect={setPelanggaran}
              onCreate={() => setPelanggaranForm(true)}
            />
          ) : route === 'KalenderPendidikan' ? (
            <KalenderScreen onBack={() => setRoute(null)} />
          ) : route === 'SantriList' ? (
            <SantriListScreen
              onBack={() => setRoute(null)}
              onSelect={setSantriId}
            />
          ) : (
            <DashboardScreen onNavigate={setRoute} />
          )
        ) : null}
        {tab === 'akun' ? <AkunScreen /> : null}
      </View>
      <BottomNav items={NAV} active={tab} onChange={setTab} />
    </View>
  );
}

function App() {
  const token = useAuthStore(s => s.token);
  const {onboardingDone, finishOnboarding} = useAppStore();
  const hydrated = useHydrated();
  const [splashDone, setSplashDone] = useState(false);
  const ready = splashDone && hydrated;
  const themeId = useAppStore(s => s.themeId);
  const onSplashFinish = useCallback(() => setSplashDone(true), []);

  return (
    <SafeAreaProvider>
      <View style={[{flex: 1}, themeVars(themeId)]}>
        <StatusBar barStyle="light-content" />
        {!ready ? (
          <SplashScreen onFinish={onSplashFinish} />
        ) : token ? (
          <MainApp />
        ) : onboardingDone ? (
          <LoginScreen />
        ) : (
          <OnboardingScreen onFinish={finishOnboarding} />
        )}
        <DialogHost />
        <ToastHost />
        <PortalHost />
      </View>
    </SafeAreaProvider>
  );
}

export default App;
