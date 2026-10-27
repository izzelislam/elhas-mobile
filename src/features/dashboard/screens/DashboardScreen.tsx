import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Bell} from 'lucide-react-native';
import {MENU} from '@/navigation/menu.config';
import {filterMenu} from '@/navigation/menu.access';
import {useAuthStore} from '@/store/auth.store';
import {
  DASHBOARD_STALE_MS,
  useDashboardStore,
} from '@/store/dashboard.store';
import {getMe} from '@/features/auth/services/auth.service';
import {useIsWali} from '@/lib/permissions';
import {getSantriList} from '@/features/santri/services/santri.service';
import {Avatar} from '@/components/ui/Avatar';
import {MenuTile} from '@/components/ui/MenuTile';
import {colors} from '@/theme';
import {MENU_VISUAL} from '../menuVisual';
import {SubMenuSheet} from '../components/SubMenuSheet';
import {getInformasiList} from '@/features/informasi/services/informasi.service';
import {InformasiImage} from '@/features/informasi/components/InformasiImage';
import {refreshDevice} from '@/features/notifikasi/services/push.service';
import {getUnreadCount} from '@/features/notifikasi/services/notifikasi.service';
import type {MenuItem} from '@/navigation/menu.types';

const INSTITUTION = 'Pondok Pesantren Elhas';

export default function DashboardScreen({
  onNavigate,
  onOpenSantri,
}: {
  onNavigate?: (route: string) => void;
  /** Dipanggil saat header santri (khusus wali) diketuk. */
  onOpenSantri?: (id: number) => void;
}) {
  const insets = useSafeAreaInsets();
  const authUser = useAuthStore(s => s.user);
  const isWali = useIsWali();
  const anak = useDashboardStore(s => s.anak);
  // Wali melihat santrinya di header; data akun wali cukup di halaman Akun.
  const santri = isWali ? anak[0] : undefined;
  const USER = santri
    ? {
        institution: INSTITUTION,
        name: santri.nama_lengkap,
        subtitle: [
          santri.kelas_aktif?.nama,
          anak.length > 1 ? `+${anak.length - 1} santri lainnya` : null,
        ]
          .filter(Boolean)
          .join(' · '),
        avatar: santri.foto ?? undefined,
      }
    : {
        institution: INSTITUTION,
        name: authUser?.name ?? '-',
        subtitle:
          authUser?.jabatan ?? authUser?.roles[0]?.replace(/_/g, ' ') ?? '',
        avatar: authUser?.foto ?? undefined,
      };
  const [sheetMenu, setSheetMenu] = useState<MenuItem | null>(null);
  const informasi = useDashboardStore(s => s.informasi);
  const notifCount = useDashboardStore(s => s.notifCount);
  const informasiLoading = useDashboardStore(s => !s.loaded);

  const setUser = useAuthStore(s => s.setUser);
  const [refreshing, setRefreshing] = useState(false);

  // Badge notifikasi selalu disegarkan diam-diam; data lain hanya dimuat bila belum ada, sudah usang, atau `force`.
  const load = useCallback(
    async (force = false) => {
      const store = useDashboardStore.getState();
      const fresh =
        store.fetchedAt !== null &&
        Date.now() - store.fetchedAt < DASHBOARD_STALE_MS;
      let ok = true;
      const fail = () => {
        ok = false;
      };
      await Promise.all([
        getUnreadCount()
          .then(n => store.set({notifCount: n}))
          .catch(() => {}),
        !force && fresh
          ? null
          : isWali
          ? getSantriList({status: 'aktif'})
              .then(res => store.set({anak: res.data}))
              .catch(fail)
          : null,
        !force && fresh
          ? null
          : getInformasiList({per_page: 5})
              .then(res =>
                store.set({
                  informasi: res.data.filter(i => i.status === 'published'),
                }),
              )
              .catch(fail),
      ]);
      if (!(!force && fresh)) {
        store.set({loaded: true, fetchedAt: ok ? Date.now() : null});
      }
    },
    [isWali],
  );

  useEffect(() => {
    load();
  }, [load]);

  // Tarik layar: muat ulang data beranda dan perbarui peran/hak akses dan topic push dari server.
  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([
      load(true),
      getMe()
        .then(setUser)
        .catch(() => {}),
      refreshDevice(),
    ]);
    setRefreshing(false);
  };

  const open = (item: MenuItem) => {
    if (item.children?.length) {
      setSheetMenu(item);
    } else if (item.route) {
      onNavigate?.(item.route);
    }
  };
  const items = filterMenu(MENU, authUser).filter(m => MENU_VISUAL[m.key]);

  return (
    <ScrollView
      className="flex-1 bg-surface"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} />
      }
    >
      <View
        style={{paddingTop: insets.top + 12}}
        className="bg-brand px-5 pb-6"
      >
        <View className="flex-row justify-end">
          <Pressable
            onPress={() => onNavigate?.('Notifikasi')}
            hitSlop={10}
            className="active:opacity-70">
            <Bell size={22} color={colors.brand.foreground} />
            {notifCount > 0 ? (
              <View className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-icon border border-brand bg-destructive" />
            ) : null}
          </Pressable>
        </View>
        <Pressable
          disabled={!santri}
          onPress={() => santri && onOpenSantri?.(santri.id)}
          className="mt-4 flex-row items-center justify-between active:opacity-80">
          <View className="flex-1 pr-4">
            <Text className="text-body text-brand-foreground opacity-90">
              {USER.institution}
            </Text>
            <Text className="mt-3 text-heading text-brand-foreground">
              {USER.name}
            </Text>
            <Text className="text-label text-brand-foreground opacity-80">
              {USER.subtitle}
            </Text>
          </View>
          <Avatar uri={USER.avatar} />
        </Pressable>
      </View>
      <Svg
        width="100%"
        height={36}
        viewBox="0 0 100 20"
        preserveAspectRatio="none"
      >
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
        {informasi.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="-mx-5 mt-3"
            contentContainerStyle={{paddingHorizontal: 20, gap: 12}}
          >
            {informasi.map(i => (
              <Pressable
                key={i.id}
                onPress={() => onNavigate?.('Informasi')}
                className="w-64 overflow-hidden rounded-card bg-brand-light active:opacity-80"
              >
                <InformasiImage
                  uri={i.gambar ?? i.thumbnail}
                  className="h-28 w-full"
                />
                <View className="p-4">
                  <Text className="text-caption font-semibold text-brand">
                    {i.kategori?.nama_kategori ?? '-'}
                  </Text>
                  <Text
                    className="mt-1 text-body font-semibold text-ink"
                    numberOfLines={2}
                  >
                    {i.judul}
                  </Text>
                  <Text
                    className="mt-1 text-label text-ink-muted"
                    numberOfLines={2}
                  >
                    {i.ringkasan ?? i.isi}
                  </Text>
                  <Text className="mt-2 text-caption text-ink-muted">
                    {new Date(
                      i.tanggal_publish ?? i.created_at,
                    ).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <View className="mt-3 h-40 items-center justify-center rounded-card bg-brand-light">
            {informasiLoading ? (
              <ActivityIndicator color={colors.brand.DEFAULT} />
            ) : (
              <Text className="text-body text-ink-muted">
                Belum ada informasi
              </Text>
            )}
          </View>
        )}
        <Pressable onPress={() => onNavigate?.('Informasi')} hitSlop={8}>
          <Text className="mt-3 text-center text-body text-ink">
            Lihat Semua
          </Text>
        </Pressable>
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
