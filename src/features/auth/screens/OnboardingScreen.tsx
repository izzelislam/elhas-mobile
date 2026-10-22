import React, {useRef, useState} from 'react';
import {FlatList, Text, useWindowDimensions, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Banknote, BookOpenCheck, LucideIcon, Users} from 'lucide-react-native';
import {Button} from '@/components/ui/Button';
import {colors, TintName} from '@/theme';

type Slide = {key: string; icon: LucideIcon; tint: TintName; title: string; desc: string};

const SLIDES: Slide[] = [
  {
    key: 'santri',
    icon: Users,
    tint: 'sky',
    title: 'Pantau Perkembangan Santri',
    desc: 'Lihat absensi, nilai, jadwal, dan catatan kesantrian dalam satu aplikasi.',
  },
  {
    key: 'tahfidz',
    icon: BookOpenCheck,
    tint: 'purple',
    title: 'Tahfidz & Mutabaah Harian',
    desc: 'Ikuti setoran hafalan dan ibadah harian secara rapi dan terukur.',
  },
  {
    key: 'keuangan',
    icon: Banknote,
    tint: 'pink',
    title: 'Keuangan & Informasi',
    desc: 'Cek tabungan, tagihan SPP, dan informasi terbaru dari pondok kapan saja.',
  },
];

export default function OnboardingScreen({onFinish}: {onFinish: () => void}) {
  const insets = useSafeAreaInsets();
  const {width} = useWindowDimensions();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const last = index === SLIDES.length - 1;

  const next = () => {
    if (last) {
      return onFinish();
    }
    listRef.current?.scrollToIndex({index: index + 1, animated: true});
  };

  return (
    <View
      style={{paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24}}
      className="flex-1 bg-surface">
      <View className="h-8 flex-row justify-end px-6">
        {last ? null : (
          <Text onPress={onFinish} className="text-body font-medium text-ink-muted">
            Lewati
          </Text>
        )}
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={s => s.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e =>
          setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
        }
        renderItem={({item}) => {
          const {bg, fg} = colors.tint[item.tint];
          const Icon = item.icon;
          return (
            <View style={{width}} className="flex-1 items-center justify-center px-8">
              <View
                style={{backgroundColor: bg + '66'}}
                className="h-64 w-64 items-center justify-center rounded-icon">
                <View
                  style={{backgroundColor: bg}}
                  className="h-44 w-44 items-center justify-center rounded-icon">
                  <Icon size={72} color={fg} strokeWidth={1.5} />
                </View>
              </View>
              <Text className="mt-12 text-center text-heading text-ink">{item.title}</Text>
              <Text className="mt-3 text-center text-body text-ink-muted">{item.desc}</Text>
            </View>
          );
        }}
      />

      <View className="mb-8 flex-row items-center justify-center gap-2">
        {SLIDES.map((s, i) => (
          <View
            key={s.key}
            className={`h-2 rounded-icon ${i === index ? 'w-6 bg-brand' : 'w-2 bg-line'}`}
          />
        ))}
      </View>

      <View className="px-6">
        <Button title={last ? 'Mulai' : 'Lanjut'} onPress={next} />
      </View>
    </View>
  );
}
