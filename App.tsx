import './global.css';
import {useCallback, useEffect, useState} from 'react';
import {StatusBar, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {PortalHost} from '@rn-primitives/portal';
import {CircleUser, CircleHelp, Home, Receipt} from 'lucide-react-native';
import {DashboardScreen} from '@/features/dashboard/screens';
import {SantriDetailScreen, SantriListScreen} from '@/features/santri/screens';
import {KalenderScreen} from '@/features/akademik/screens';
import {CatatanScreen, IzinFormScreen, IzinScreen, PelanggaranDetailScreen, PelanggaranFormScreen, PelanggaranScreen, PrestasiDetailScreen, PrestasiScreen} from '@/features/kesantrian/screens';
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
import {AkunScreen} from '@/features/akun/screens';
import {LoginScreen, OnboardingScreen, SplashScreen} from '@/features/auth/screens';
import {getMe} from '@/features/auth/services/auth.service';
import type {RekapSantri} from '@/features/mutabaah/types';
import type {RekapParams} from '@/features/mutabaah/services/mutabaahSantri.service';
import type {Halaqah, RingkasanSantri} from '@/features/tahfidz/types';
import type {Pelanggaran, Prestasi} from '@/features/kesantrian/types';
import {useSetoranDetail} from '@/features/tahfidz/store';
import {useAuthStore} from '@/store/auth.store';
import {useAppStore} from '@/store/app.store';

function useHydrated() {
  const [done, setDone] = useState(
    useAuthStore.persist.hasHydrated() && useAppStore.persist.hasHydrated(),
  );
  useEffect(() => {
    const check = () =>
      setDone(useAuthStore.persist.hasHydrated() && useAppStore.persist.hasHydrated());
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
  const [jenisForm, setJenisForm] = useState<{id: number; nama: string}[] | null>(null);
  const [izinForm, setIzinForm] = useState(false);
  const [halaqah, setHalaqah] = useState<Halaqah | null>(null);
  const [setoranForm, setSetoranForm] = useState(false);
  const [ringkasanSantri, setRingkasanSantri] = useState<RingkasanSantri | null>(null);
  const [mutabaahForm, setMutabaahForm] = useState(false);
  const [mutabaahDetail, setMutabaahDetail] = useState<{
    santri: RekapSantri;
    params: Omit<RekapParams, 'santri_id'>;
  } | null>(null);
  const [santriId, setSantriId] = useState<number | null>(null);
  const setUser = useAuthStore(s => s.setUser);
  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => {}); // 401 ditangani interceptor (logout)
  }, [setUser]);
  return (
    <View className="flex-1 bg-surface">
      <View className="flex-1">
        {tab === 'home' ? (
          setoranDetail ? (
            <SetoranDetailScreen item={setoranDetail} onBack={closeSetoranDetail} />
          ) : route === 'SantriList' && santriId !== null ? (
            <SantriDetailScreen id={santriId} onBack={() => setSantriId(null)} />
          ) : route === 'MutabaahSantri' && mutabaahForm ? (
            <MutabaahSantriFormScreen
              onBack={() => setMutabaahForm(false)}
              onSaved={() => setMutabaahForm(false)}
            />
          ) : route === 'MutabaahSantri' && mutabaahDetail ? (
            <MutabaahSantriDetailScreen
              santri={mutabaahDetail.santri}
              params={mutabaahDetail.params}
              onBack={() => setMutabaahDetail(null)}
            />
          ) : route === 'MutabaahSantri' ? (
            <MutabaahSantriScreen
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
            <RingkasanScreen onBack={() => setRoute(null)} onSelect={setRingkasanSantri} />
          ) : route === 'Setoran' && setoranForm ? (
            <SetoranFormScreen
              onBack={() => setSetoranForm(false)}
              onSaved={() => setSetoranForm(false)}
            />
          ) : route === 'Setoran' ? (
            <SetoranScreen onBack={() => setRoute(null)} onCreate={() => setSetoranForm(true)} />
          ) : route === 'Halaqoh' && halaqah ? (
            <HalaqahDetailScreen halaqah={halaqah} onBack={() => setHalaqah(null)} />
          ) : route === 'Halaqoh' ? (
            <HalaqahScreen onBack={() => setRoute(null)} onSelect={setHalaqah} />
          ) : route === 'Catatan' ? (
            <CatatanScreen onBack={() => setRoute(null)} />
          ) : route === 'Izin' && izinForm ? (
            <IzinFormScreen onBack={() => setIzinForm(false)} onSaved={() => setIzinForm(false)} />
          ) : route === 'Izin' ? (
            <IzinScreen onBack={() => setRoute(null)} onCreate={() => setIzinForm(true)} />
          ) : route === 'Prestasi' && prestasi ? (
            <PrestasiDetailScreen initial={prestasi} onBack={() => setPrestasi(null)} />
          ) : route === 'Prestasi' ? (
            <PrestasiScreen onBack={() => setRoute(null)} onSelect={setPrestasi} />
          ) : route === 'Pelanggaran' && jenisForm ? (
            <PelanggaranFormScreen
              jenisOptions={jenisForm}
              onBack={() => setJenisForm(null)}
              onSaved={() => setJenisForm(null)}
            />
          ) : route === 'Pelanggaran' && pelanggaran ? (
            <PelanggaranDetailScreen item={pelanggaran} onBack={() => setPelanggaran(null)} />
          ) : route === 'Pelanggaran' ? (
            <PelanggaranScreen
              onBack={() => setRoute(null)}
              onSelect={setPelanggaran}
              onCreate={setJenisForm}
            />
          ) : route === 'KalenderPendidikan' ? (
            <KalenderScreen onBack={() => setRoute(null)} />
          ) : route === 'SantriList' ? (
            <SantriListScreen onBack={() => setRoute(null)} onSelect={setSantriId} />
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
  const onSplashFinish = useCallback(() => setSplashDone(true), []);

  return (
    <SafeAreaProvider>
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
    </SafeAreaProvider>
  );
}

export default App;
