import React, {useState} from 'react';
import {FlatList, Image, Text, View, useWindowDimensions} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';
import {BookOpen, User} from 'lucide-react-native';
import type {SantriDetail} from '../types';

const GREEN = '#1E7B50';
const GREEN_DARK = '#0F2F25';
const RATIO = 1.5;
const GAP = 12;

/** Latar gradien horizontal untuk header kartu. */
function Band({from, to, children}: {from: string; to: string; children: React.ReactNode}) {
  const id = `g${from.replace('#', '')}`;
  return (
    <View className="h-[24%] justify-center overflow-hidden px-4">
      <Svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </LinearGradient>
        </Defs>
        <Rect width="100" height="100" fill={`url(#${id})`} />
      </Svg>
      {children}
    </View>
  );
}

function Label({children}: {children: string}) {
  return (
    <Text className="text-[8px] font-medium uppercase tracking-wider text-ink-muted">
      {children}
    </Text>
  );
}

function Front({s}: {s: SantriDetail}) {
  return (
    <>
      <Band from="#2F8F5F" to={GREEN}>
        <View className="flex-row items-center">
          <View className="h-8 w-8 items-center justify-center rounded-lg bg-white/20">
            <BookOpen size={18} color="#FFFFFF" />
          </View>
          <View className="ml-2.5">
            <Text className="text-[9px] font-medium uppercase tracking-wider text-white/90">
              Pesantren Modern
            </Text>
            <Text className="text-[13px] font-bold uppercase text-white">El-Has Indonesia</Text>
          </View>
        </View>
      </Band>
      <View className="flex-1 flex-row items-center px-4">
        <View className="h-[78%] aspect-[3/4] items-center justify-center overflow-hidden rounded-lg border border-line bg-field">
          {s.foto ? (
            <Image source={{uri: s.foto}} className="h-full w-full" />
          ) : (
            <>
              <User size={26} color="#9CA3AF" />
              <Text className="mt-0.5 text-[7px] font-medium text-ink-muted">NO PHOTO</Text>
            </>
          )}
        </View>
        <View className="ml-3.5 flex-1 justify-center">
          <Label>Nama Lengkap</Label>
          <Text className="text-[13px] font-bold text-ink" numberOfLines={2}>
            {s.nama_lengkap}
          </Text>
          <View className="mt-1.5 flex-row">
            <View className="flex-1">
              <Label>NIS</Label>
              <Text className="text-[11px] font-semibold text-ink">{s.nis}</Text>
            </View>
            <View className="flex-1">
              <Label>Rombel</Label>
              <Text className="text-[11px] font-semibold text-ink" numberOfLines={1}>
                {s.kelas_aktif?.nama ?? '-'}
              </Text>
            </View>
          </View>
          <View className="mt-1.5">
            <Label>Jenis Kelamin</Label>
            <Text className="text-[11px] font-semibold text-ink">{s.jenis_kelamin.label}</Text>
          </View>
        </View>
      </View>
      <View className="flex-row items-center justify-between border-t border-line bg-field px-4 py-1.5">
        <Text className="text-[8px] font-semibold tracking-wider text-ink-muted">
          KARTU ANGGOTA RESMI
        </Text>
        <Text className="text-[8px] font-semibold tracking-wider" style={{color: GREEN}}>
          ESIMS INTEGRATED
        </Text>
      </View>
    </>
  );
}

const KETENTUAN = [
  'Kartu ini adalah kartu identitas resmi Santri El-Has.',
  'Digunakan untuk absensi, tabungan, & pinjaman buku.',
  'Harap dijaga agar tidak kotor, patah, atau hilang.',
  'Bila menemukan kartu ini, harap kembalikan ke sekretariat pesantren.',
];

function Back({s}: {s: SantriDetail}) {
  return (
    <>
      <Band from={GREEN} to={GREEN_DARK}>
        <Text className="text-center text-[13px] font-bold uppercase tracking-widest text-white">
          Kartu Anggota Santri
        </Text>
      </Band>
      <View className="flex-1 flex-row items-center px-4">
        <View className="rounded-xl border border-line bg-white p-2">
          <QRCode value={s.nis} size={84} />
        </View>
        <View className="ml-3.5 flex-1">
          <Text className="mb-1 text-[10px] font-bold uppercase tracking-wider" style={{color: GREEN}}>
            Ketentuan Kartu
          </Text>
          {KETENTUAN.map((t, i) => (
            <Text key={t} className="text-[8.5px] leading-[12px] text-ink">
              {i + 1}. {t}
            </Text>
          ))}
        </View>
      </View>
      <View className="items-center border-t border-line bg-field py-1.5">
        <Text className="text-[8px] font-medium text-ink-muted">
          Hubungi Sekretariat Pesantren El-Has © {new Date().getFullYear()}
        </Text>
      </View>
    </>
  );
}

/** Kartu anggota santri: geser ke samping untuk sisi depan dan belakang. */
export function KartuSantri({santri}: {santri: SantriDetail}) {
  const {width} = useWindowDimensions();
  const cardW = width - 40; // sejajar dengan padding horizontal layar (px-5)
  const [index, setIndex] = useState(0);

  return (
    <View className="mt-4">
      <FlatList
        data={['depan', 'belakang'] as const}
        keyExtractor={k => k}
        horizontal
        pagingEnabled={false}
        snapToInterval={cardW + GAP}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{width: GAP}} />}
        onMomentumScrollEnd={e =>
          setIndex(Math.round(e.nativeEvent.contentOffset.x / (cardW + GAP)))
        }
        renderItem={({item}) => (
          <View
            style={{width: cardW, aspectRatio: RATIO}}
            className="overflow-hidden rounded-2xl border border-line bg-surface">
            {item === 'depan' ? <Front s={santri} /> : <Back s={santri} />}
          </View>
        )}
      />
      <View className="mt-2.5 flex-row items-center justify-center gap-1.5">
        {[0, 1].map(i => (
          <View
            key={i}
            className={`h-1.5 rounded-full ${i === index ? 'w-4 bg-brand' : 'w-1.5 bg-line'}`}
          />
        ))}
        <Text className="ml-2 text-caption text-ink-muted">
          {index === 0 ? 'Depan' : 'Belakang'}
        </Text>
      </View>
    </View>
  );
}
