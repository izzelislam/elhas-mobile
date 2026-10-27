import './global.css';
import {useCallback, useEffect, useState} from 'react';
import {StatusBar, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {PortalHost} from '@rn-primitives/portal';
import {CircleUser, CircleHelp, Home, Receipt} from 'lucide-react-native';
import {DashboardScreen} from '@/features/dashboard/screens';
import {SetoranDetailScreen} from '@/features/tahfidz/screens';
import {AkunScreen} from '@/features/akun/screens';
import {TransaksiScreen} from '@/features/keuangan/screens';
import {AduanScreen} from '@/features/aduan/screens';
import {SantriDetailScreen} from '@/features/santri/screens';
import {
  LoginScreen,
  OnboardingScreen,
  SplashScreen,
} from '@/features/auth/screens';
import {getMe} from '@/features/auth/services/auth.service';
import {ROUTES} from '@/navigation/routes';
import {canOpenRoute} from '@/navigation/menu.access';
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
  // Route tanpa izin jatuh ke dashboard (menu sudah disaring; ini pengaman untuk navigasi lain, mis. dari notifikasi).
  const Screen =
    route && canOpenRoute(route, authUser) ? ROUTES[route] : undefined;
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
          ) : santriId !== null ? (
            <SantriDetailScreen id={santriId} onBack={() => setSantriId(null)} />
          ) : Screen ? (
            <Screen onBack={() => setRoute(null)} navigate={setRoute} />
          ) : (
            <DashboardScreen onNavigate={setRoute} onOpenSantri={setSantriId} />
          )
        ) : null}
        {tab === 'transaksi' ? <TransaksiScreen /> : null}
        {tab === 'bantuan' ? (
          <AduanScreen onBack={() => setTab('home')} />
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


// Email: wali.debug@elhas.test
// Password: secret123