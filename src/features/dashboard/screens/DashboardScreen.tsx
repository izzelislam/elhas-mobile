import React, {useState} from 'react';
import {ScrollView, Pressable, Text, View} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Bell} from 'lucide-react-native';
import {MENU} from '@/navigation/menu.config';
import {useAuthStore} from '@/store/auth.store';
import {Avatar} from '@/components/ui/Avatar';
import {MenuTile} from '@/components/ui/MenuTile';
import {colors} from '@/theme';
import {MENU_VISUAL} from '../menuVisual';
import {SubMenuSheet} from '../components/SubMenuSheet';
import type {MenuItem} from '@/navigation/menu.types';

// TODO: ganti dengan jumlah notifikasi belum dibaca dari API/store
const NOTIF_COUNT = 3;

const INSTITUTION = 'Pondok Pesantren Elhas';

export default function DashboardScreen({onNavigate}: {onNavigate?: (route: string) => void}) {
  const insets = useSafeAreaInsets();
  const authUser = useAuthStore(s => s.user);
  const USER = {
    institution: INSTITUTION,
    name: authUser?.name ?? '-',
    subtitle: authUser?.jabatan ?? authUser?.roles[0]?.replace(/_/g, ' ') ?? '',
    avatar: authUser?.foto ?? undefined,
  };
  const [sheetMenu, setSheetMenu] = useState<MenuItem | null>(null);

  const open = (item: MenuItem) => {
    if (item.children?.length) {
      setSheetMenu(item);
    } else if (item.route) {
      onNavigate?.(item.route);
    }
  };
  const items = MENU.filter(m => MENU_VISUAL[m.key]);

  return (
    <ScrollView className="flex-1 bg-surface" showsVerticalScrollIndicator={false}>
      <View style={{paddingTop: insets.top + 12}} className="bg-brand px-5 pb-6">
        <View className="flex-row justify-end">
          <Pressable hitSlop={10} className="active:opacity-70">
            <Bell size={22} color={colors.brand.foreground} />
            {NOTIF_COUNT > 0 ? (
              <View className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-icon border border-brand bg-destructive" />
            ) : null}
          </Pressable>
        </View>
        <View className="mt-4 flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-body text-brand-foreground opacity-90">
              {USER.institution}
            </Text>
            <Text className="mt-3 text-heading text-brand-foreground">{USER.name}</Text>
            <Text className="text-label text-brand-foreground opacity-80">
              {USER.subtitle}
            </Text>
          </View>
          <Avatar uri={USER.avatar} />
        </View>
      </View>
      <Svg width="100%" height={36} viewBox="0 0 100 20" preserveAspectRatio="none">
        <Path d="M0 0 H100 V4 Q50 28 0 4 Z" fill={colors.brand.DEFAULT} />
      </Svg>

      <View className="flex-row flex-wrap px-3 pt-2">
        {items.map(m => (
          <MenuTile
            key={m.key}
            label={m.label}
            icon={MENU_VISUAL[m.key].icon}
            tint={MENU_VISUAL[m.key].tint}
            onPress={() => open(m)}
          />
        ))}
      </View>

      <View className="mt-4 px-5 pb-6">
        <Text className="text-title text-ink">Informasi</Text>
        <View className="mt-3 h-40 items-center justify-center rounded-card bg-brand-light">
          <Text className="text-body text-ink-muted">Belum ada informasi</Text>
        </View>
        <Text className="mt-3 text-center text-body text-ink">Lihat Semua</Text>
      </View>
      <SubMenuSheet
        menu={sheetMenu}
        onClose={() => setSheetMenu(null)}
        onSelect={item => {
          setSheetMenu(null);
          if (item.route) {
            onNavigate?.(item.route);
          }
        }}
      />
    </ScrollView>
  );
}
