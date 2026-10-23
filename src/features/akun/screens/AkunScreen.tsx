import React, {useState} from 'react';
import {ScrollView, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  Bell,
  Info,
  KeyRound,
  LogOut,
  Palette,
  School,
} from 'lucide-react-native';
import {Card} from '@/components/ui/Card';
import {Avatar} from '@/components/ui/Avatar';
import {dialog} from '@/store/dialog.store';
import {useAuthStore} from '@/store/auth.store';
import {ListRow} from '../components/ListRow';
import PengaturanScopeScreen from './PengaturanScopeScreen';
import TemaWarnaScreen from './TemaWarnaScreen';
import UbahPasswordScreen from './UbahPasswordScreen';

export default function AkunScreen() {
  const insets = useSafeAreaInsets();
  const logout = useAuthStore(s => s.logout);
  const authUser = useAuthStore(s => s.user);
  const USER = {
    name: authUser?.name ?? '-',
    subtitle:
      authUser?.jabatan ??
      authUser?.roles[0]?.replace(/_/g, ' ') ??
      authUser?.email ??
      '',
    avatar: authUser?.foto ?? undefined,
  };
  const [page, setPage] = useState<'main' | 'password' | 'scope' | 'tema'>(
    'main',
  );

  if (page === 'password') {
    return <UbahPasswordScreen onBack={() => setPage('main')} />;
  }

  if (page === 'tema') {
    return <TemaWarnaScreen onBack={() => setPage('main')} />;
  }

  if (page === 'scope') {
    return <PengaturanScopeScreen onBack={() => setPage('main')} />;
  }

  const confirmLogout = () =>
    dialog.confirm({
      title: 'Keluar dari aplikasi?',
      message: 'Anda harus masuk kembali untuk mengakses akun ini.',
      variant: 'destructive',
      confirmText: 'Keluar',
      onConfirm: logout,
    });

  return (
    <ScrollView
      className="flex-1 bg-canvas"
      showsVerticalScrollIndicator={false}
    >
      <View
        style={{paddingTop: insets.top + 24}}
        className="items-center rounded-b-[32px] bg-brand pb-8"
      >
        <Avatar uri={USER.avatar} size={88} />
        <Text className="mt-3 text-heading text-brand-foreground">
          {USER.name}
        </Text>
        <Text className="text-label text-brand-foreground opacity-80">
          {USER.subtitle}
        </Text>
      </View>

      <View className="px-5 pb-6 pt-5">
        <Text className="mb-2 ml-1 text-caption font-medium tracking-wide text-ink-muted">
          PENGATURAN
        </Text>
        <Card className="overflow-hidden p-0">
          <ListRow
            label="Ubah Password"
            icon={KeyRound}
            tint="blue"
            onPress={() => setPage('password')}
          />
          <View className="ml-16 h-px bg-line" />
          <ListRow
            label="Unit & Kelas"
            icon={School}
            tint="green"
            onPress={() => setPage('scope')}
          />
          <View className="ml-16 h-px bg-line" />
          <ListRow
            label="Tema Warna"
            icon={Palette}
            tint="purple"
            onPress={() => setPage('tema')}
          />
          <View className="ml-16 h-px bg-line" />
          <ListRow label="Notifikasi" icon={Bell} tint="orange" />
          <View className="ml-16 h-px bg-line" />
          <ListRow label="Tentang Aplikasi" icon={Info} tint="gray" />
        </Card>
        <Card className="mt-4 overflow-hidden p-0">
          <ListRow
            label="Keluar"
            icon={LogOut}
            danger
            onPress={confirmLogout}
          />
        </Card>
        <Text className="mt-5 text-center text-caption text-ink-muted">
          Elhas Mobile v0.0.1
        </Text>
      </View>
    </ScrollView>
  );
}
