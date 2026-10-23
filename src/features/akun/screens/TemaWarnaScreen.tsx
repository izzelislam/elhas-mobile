import React, {useState} from 'react';
import {Pressable, ScrollView, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, Check} from 'lucide-react-native';
import {Button} from '@/components/ui/Button';
import {toast} from '@/store/toast.store';
import {useAppStore} from '@/store/app.store';
import {Theme, themes} from '@/theme';

/** Pratinjau mini aplikasi dengan palet tema: header, tombol, dan chip. */
function Preview({theme}: {theme: Theme}) {
  const {brand} = theme;
  return (
    <View className="overflow-hidden rounded-field border border-line bg-canvas">
      <View
        style={{backgroundColor: brand.DEFAULT}}
        className="h-9 justify-center px-3"
      >
        <View
          style={{backgroundColor: brand.foreground}}
          className="h-1.5 w-16 rounded-full opacity-90"
        />
      </View>
      <View className="flex-row items-center gap-2 p-3">
        <View
          style={{backgroundColor: brand.DEFAULT}}
          className="h-6 flex-1 rounded-full"
        />
        <View
          style={{backgroundColor: brand.light}}
          className="h-6 w-10 rounded-full"
        />
        <View
          style={{backgroundColor: brand.dark}}
          className="h-6 w-6 rounded-full"
        />
      </View>
    </View>
  );
}

export default function TemaWarnaScreen({onBack}: {onBack: () => void}) {
  const insets = useSafeAreaInsets();
  const themeId = useAppStore(s => s.themeId);
  const setTheme = useAppStore(s => s.setTheme);
  const [picked, setPicked] = useState(themeId);
  const changed = picked !== themeId;

  const apply = () => {
    setTheme(picked);
    toast.success('Tema warna diterapkan');
  };

  return (
    <View className="flex-1 bg-canvas">
      <View
        style={{paddingTop: insets.top + 24}}
        className="bg-brand px-5 pb-5"
      >
        <View className="flex-row items-center">
          <Pressable onPress={onBack} hitSlop={10}>
            <ArrowLeft size={22} color="#FFFFFF" />
          </Pressable>
          <Text className="ml-3 text-title text-brand-foreground">
            Tema Warna
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{padding: 20, paddingBottom: 24}}
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-3 text-label text-ink-muted">
          Pilih warna utama aplikasi, lalu tekan Terapkan.
        </Text>
        <View className="flex-row flex-wrap justify-between">
          {themes.map(t => {
            const active = picked === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => setPicked(t.id)}
                style={active ? {borderColor: t.brand.DEFAULT} : undefined}
                className={`mb-3 rounded-card border-2 bg-surface p-3 active:opacity-80 ${
                  active ? '' : 'border-transparent'
                }`}
              >
                <View style={{width: 140}}>
                  <Preview theme={t} />
                  <View className="mt-3 flex-row items-center">
                    <Text
                      className="flex-1 text-label font-semibold text-ink"
                      numberOfLines={1}
                    >
                      {t.name}
                    </Text>
                    {active ? (
                      <View
                        style={{backgroundColor: t.brand.DEFAULT}}
                        className="h-5 w-5 items-center justify-center rounded-full"
                      >
                        <Check
                          size={12}
                          color={t.brand.foreground}
                          strokeWidth={3}
                        />
                      </View>
                    ) : null}
                  </View>
                  {t.id === themeId ? (
                    <Text className="text-caption text-ink-muted">
                      Sedang dipakai
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View
        style={{paddingBottom: insets.bottom + 16}}
        className="bg-surface px-5 pt-3"
      >
        <Button title="Terapkan" disabled={!changed} onPress={apply} />
      </View>
    </View>
  );
}
