import React from 'react';
import {Linking, Pressable, ScrollView, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, Code2, Mail} from 'lucide-react-native';
import {Card} from '@/components/ui/Card';
import {Logo} from '@/components/ui/Logo';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';
import {APP_VERSION} from '@/lib/version';

const DEVELOPER_EMAIL = 'bangfkr002@gmail.com';

export default function TentangAplikasiScreen({onBack}: {onBack: () => void}) {
  const insets = useSafeAreaInsets();

  const sendEmail = () =>
    Linking.openURL(`mailto:${DEVELOPER_EMAIL}?subject=elhamobile`).catch(() =>
      toast.error('Tidak ada aplikasi email di perangkat ini'),
    );

  return (
    <View className="flex-1 bg-canvas">
      <View style={{paddingTop: insets.top + 24}} className="bg-brand px-5 pb-5">
        <View className="flex-row items-center">
          <Pressable onPress={onBack} hitSlop={10}>
            <ArrowLeft size={22} color={colors.brand.foreground} />
          </Pressable>
          <Text className="ml-3 text-title text-brand-foreground">Tentang Aplikasi</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{padding: 20, paddingBottom: insets.bottom + 24}}
        showsVerticalScrollIndicator={false}>
        <View className="items-center py-6">
          <Logo size={96} />
          <Text className="mt-4 text-heading text-ink">elhamobile</Text>
          <Text className="mt-1 text-label text-ink-muted">Versi {APP_VERSION}</Text>
          <Text className="mt-4 px-6 text-center text-body text-ink-muted">
            Aplikasi untuk wali santri, asatidzah, dan pengurus Pondok Pesantren Tahfidzul
            Qur'an Lukman Al-Hakim.
          </Text>
        </View>

        <Text className="mb-2 ml-1 text-caption font-medium tracking-wide text-ink-muted">
          CREDIT
        </Text>
        <Card className="overflow-hidden p-0">
          <View className="flex-row items-center px-4 py-3">
            <View className="h-10 w-10 items-center justify-center rounded-icon bg-brand-light">
              <Code2 size={20} color={colors.brand.DEFAULT} strokeWidth={1.8} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-body text-ink">Dikembangkan oleh</Text>
              <Text className="text-caption text-ink-muted">{DEVELOPER_EMAIL}</Text>
            </View>
          </View>
          <View className="ml-16 h-px bg-line" />
          <Pressable onPress={sendEmail} className="flex-row items-center px-4 py-3 active:bg-canvas">
            <View className="h-10 w-10 items-center justify-center rounded-icon bg-brand-light">
              <Mail size={20} color={colors.brand.DEFAULT} strokeWidth={1.8} />
            </View>
            <Text className="ml-3 flex-1 text-body text-ink">Hubungi pengembang</Text>
          </Pressable>
        </Card>

        <Text className="mt-6 text-center text-caption text-ink-muted">
          © {new Date().getFullYear()} elhamobile
        </Text>
      </ScrollView>
    </View>
  );
}
