import React, {useMemo, useState} from 'react';
import {Pressable, ScrollView, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft} from 'lucide-react-native';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {getMe} from '@/features/auth/services/auth.service';
import {useAuthStore} from '@/store/auth.store';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';

/** Khusus debug: peran dan permission akun yang sedang login, dikelompokkan per modul (awalan sebelum titik). */
export default function DebugAksesScreen({onBack}: {onBack: () => void}) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore(s => s.user);
  const setUser = useAuthStore(s => s.setUser);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const map = new Map<string, string[]>();
    (user?.permissions ?? [])
      .filter(p => p.toLowerCase().includes(q))
      .forEach(p => {
        const [modul, ...aksi] = p.split('.');
        map.set(modul, [...(map.get(modul) ?? []), aksi.join('.') || '-']);
      });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [user, query]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      setUser(await getMe());
      toast.success('Hak akses diperbarui dari server');
    } catch {
      toast.error('Gagal memuat hak akses');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View className="flex-1 bg-canvas">
      <View style={{paddingTop: insets.top + 24}} className="bg-brand px-5 pb-5">
        <Pressable onPress={onBack} hitSlop={10} className="self-start">
          <ArrowLeft size={22} color={colors.brand.foreground} />
        </Pressable>
        <Text className="mt-3 text-heading text-brand-foreground">Debug Hak Akses</Text>
        <Text className="text-label text-brand-foreground opacity-80">
          {user?.permissions.length ?? 0} permission
        </Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{padding: 20, paddingBottom: insets.bottom + 24}}
        showsVerticalScrollIndicator={false}>
        <Card className="mb-3 border-0 p-4">
          <Text className="text-label font-semibold text-ink">{user?.name ?? '-'}</Text>
          <Text className="text-caption text-ink-muted">
            id {user?.id} · pesantren {user?.pesantren_id} · {user?.email}
          </Text>
          <Text className="mb-1.5 mt-3 text-caption text-ink-muted">Peran</Text>
          <View className="flex-row flex-wrap gap-2">
            {(user?.roles ?? []).map(r => (
              <View key={r} className="rounded-full bg-brand-light px-3 py-1">
                <Text className="text-caption font-semibold text-brand">{r}</Text>
              </View>
            ))}
          </View>
        </Card>

        <View className="mb-3 flex-row gap-3">
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Cari permission"
            placeholderTextColor={colors.text.muted}
            autoCapitalize="none"
            className="h-12 flex-1 rounded-field bg-surface px-4 text-body text-ink"
          />
          <View className="w-32">
            <Button title="Segarkan" variant="outline" loading={refreshing} onPress={refresh} />
          </View>
        </View>

        {groups.map(([modul, aksi]) => (
          <Card key={modul} className="mb-3 border-0 p-4">
            <Text className="mb-2 text-label font-semibold text-ink">{modul}</Text>
            <View className="flex-row flex-wrap gap-2">
              {aksi.map(a => (
                <View key={a} className="rounded-full bg-field px-3 py-1">
                  <Text className="text-caption text-ink-muted">{a}</Text>
                </View>
              ))}
            </View>
          </Card>
        ))}
        {groups.length === 0 ? (
          <Text className="mt-6 text-center text-body text-ink-muted">Tidak ada permission</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}
