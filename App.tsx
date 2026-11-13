import './global.css';
import {useCallback, useEffect, useState} from 'react';
import {StatusBar, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {PortalHost} from '@rn-primitives/portal';
import {CircleUser, CircleHelp, Home, Receipt, ScanLine} from 'lucide-react-native';
import {DashboardScreen} from '@/features/dashboard/screens';
import {SetoranDetailScreen} from '@/features/tahfidz/screens';
import {AkunScreen} from '@/features/akun/screens';
import {TransaksiScreen} from '@/features/keuangan/screens';
import {AduanScreen} from '@/features/aduan/screens';
import {SantriDetailScreen, ScanSantriScreen} from '@/features/santri/screens';
import {isWali} from '@/lib/permissions';
import {
  LoginScreen,
  OnboardingScreen,
  SplashScreen,
} from '@/features/auth/screens';
import {getMe} from '@/features/auth/services/auth.service';
import {ROUTES} from '@/navigation/routes';
import {canOpenRoute} from '@/navigation/menu.access';
import {useBackHandler} from '@/navigation/useBackHandler';
import {useSetoranDetail} from '@/features/tahfidz/store';
import {setupPush} from '@/features/notifikasi/services/push.service';
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
  const [santriId, setSantriId] = useState<number | null>(null);
  const [scan, setScan] = useState(false);
  const setUser = useAuthStore(s => s.setUser);
  const themeId = useAppStore(s => s.themeId);
  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => {}); // 401 ditangani interceptor (logout)
  }, [setUser]);
  useEffect(() => {
    const ready = setupPush(r => {
      setTab('home');
      setRoute(r);
    });
    return () => {
      ready.then(off => off());
    };
  }, []);
  const authUser = useAuthStore(s => s.user);
  // Back device: tutup layar paling dalam dulu; di beranda polos baru keluar app.
  useBackHandler(() => {
    if (scan) {
      setScan(false);
    } else if (setoranDetail) {
      closeSetoranDetail();
    } else if (santriId !== null) {
      setSantriId(null);
    } else if (route) {
      setRoute(null);
    } else if (tab !== 'home') {
      setTab('home');
    } else {
      return false;
    }
  });
  // Route tanpa izin jatuh ke dashboard (menu sudah disaring; ini pengaman untuk navigasi lain, mis. dari notifikasi).
  const Screen =
    route && canOpenRoute(route, authUser) ? ROUTES[route] : undefined;
  // Non-wali mendapat tombol scan kartu santri di tengah bottom nav.
  const nav = isWali(authUser)
    ? NAV
    : [...NAV.slice(0, 2), {key: 'scan', label: 'Scan', icon: ScanLine, action: true}, ...NAV.slice(2)];
  return (
    // key = tema: tombol/ikon yang membaca warna lewat JS ikut tergambar ulang saat tema berganti
    <View key={themeId} className="flex-1 bg-surface">
      <View className="flex-1">
        {scan ? <ScanSantriScreen onClose={() => setScan(false)} /> : null}
        {!scan && tab === 'home' ? (
          setoranDetail ? (
            <SetoranDetailScreen
              item={setoranDetail}
              onBack={closeSetoranDetail}
            />
          ) : santriId !== null ? (
            <SantriDetailScreen id={santriId} onBack={() => setSantriId(null)} />
          ) : Screen ? (
            <Screen onBack={() => setRoute(null)} navigate={setRoute} />
          ) : (
            <DashboardScreen onNavigate={setRoute} onOpenSantri={setSantriId} />
          )
        ) : null}
        {!scan && tab === 'transaksi' ? <TransaksiScreen /> : null}
        {!scan && tab === 'bantuan' ? (
          <AduanScreen onBack={() => setTab('home')} />
        ) : null}
        {!scan && tab === 'akun' ? <AkunScreen /> : null}
      </View>
      <BottomNav
        items={nav}
        active={scan ? 'scan' : tab}
        onChange={k => (k === 'scan' ? setScan(true) : (setScan(false), setTab(k)))}
      />
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


// Email: wali.debug@elhas.test
// Password: secret123