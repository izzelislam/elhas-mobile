import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft} from 'lucide-react-native';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';
import {JENIS} from '../components/NilaiFilterSheet';
import {predikat, scoreColor} from '../nilaiUtil';
import {
  Rapor,
  RaporDetail,
  getRaporDetail,
  raporStatus,
} from '../services/rapor.service';

const cap = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);

const dateId = (v: string) =>
  new Date(v).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

type Mapel = {
  id: number;
  nama: string;
  nilai: Partial<Record<string, number>>;
  rata: number;
};

export default function RaporDetailScreen({
  rapor,
  onBack,
}: {
  rapor: Rapor;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [detail, setDetail] = useState<RaporDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = () => {
    setLoading(true);
    getRaporDetail(rapor.id)
      .then(d => {
        setDetail(d);
        setFailed(false);
      })
      .catch(() => {
        setFailed(true);
        toast.error('Gagal memuat detail rapor');
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [rapor.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Nilai per mata pelajaran, lengkap dengan rata-rata dari semua jenis yang tercatat.
  const mapel = useMemo<Mapel[]>(() => {
    const map = new Map<number, Mapel>();
    (detail?.nilai ?? []).forEach(n => {
      const m = map.get(n.mata_pelajaran_id) ?? {
        id: n.mata_pelajaran_id,
        nama: n.mata_pelajaran?.nama ?? '-',
        nilai: {},
        rata: 0,
      };
      m.nilai[n.jenis] = n.nilai;
      map.set(n.mata_pelajaran_id, m);
    });
    return [...map.values()]
      .map(m => {
        const v = Object.values(m.nilai) as number[];
        return {...m, rata: v.reduce((a, b) => a + b, 0) / v.length};
      })
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }, [detail]);

  const r = detail?.rapor ?? rapor;
  const st = raporStatus(r.status);
  const rata = detail?.rata_rata ?? null;
  const rataColor = rata !== null ? scoreColor(rata) : colors.text.muted;

  const identitas: [string, string][] = [
    ['Nama Santri', r.santri?.nama_lengkap ?? '-'],
    ['NIS / NISN', `${r.santri?.nis ?? '-'} / ${r.santri?.nisn ?? '-'}`],
    ['Kelas', r.kelas?.nama ?? '-'],
    ['Semester', cap(r.semester)],
    ['Tahun Ajaran', r.tahun_ajaran?.nama ?? '-'],
  ];

  return (
    <View className="flex-1 bg-canvas">
      <View
        style={{paddingTop: insets.top + 24}}
        className="bg-brand px-5 pb-5"
      >
        <View className="flex-row items-center">
          <Pressable onPress={onBack} hitSlop={10}>
            <ArrowLeft size={22} color={colors.brand.foreground} />
          </Pressable>
          <Text className="ml-3 flex-1 text-title text-brand-foreground">
            Rapor
          </Text>
          <View
            style={{backgroundColor: '#FFFFFF33'}}
            className="rounded-full px-3 py-1"
          >
            <Text className="text-caption font-semibold text-brand-foreground">
              {st.label}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{padding: 16, paddingBottom: insets.bottom + 24}}
        showsVerticalScrollIndicator={false}
      >
        <View className="rounded-card bg-surface p-4">
          <View className="items-center border-b-2 border-ink pb-3">
            <Text className="text-caption tracking-widest text-ink-muted">
              PONDOK PESANTREN ELHAS
            </Text>
            <Text className="mt-1 text-title text-ink">
              LAPORAN HASIL BELAJAR
            </Text>
          </View>

          <View className="mt-3">
            {identitas.map(([label, value]) => (
              <View key={label} className="flex-row py-1">
                <Text className="w-28 text-label text-ink-muted">{label}</Text>
                <Text className="text-label text-ink-muted">: </Text>
                <Text className="flex-1 text-label font-semibold text-ink">
                  {value}
                </Text>
              </View>
            ))}
          </View>

          <Text className="mb-2 mt-4 text-label font-bold text-ink">
            A. NILAI MATA PELAJARAN
          </Text>

          {loading ? (
            <ActivityIndicator className="my-8" color={colors.brand.DEFAULT} />
          ) : failed ? (
            <View className="items-center py-4">
              <Text className="mb-3 text-body text-ink-muted">
                Nilai rapor tidak dapat dimuat
              </Text>
              <Button title="Coba lagi" onPress={load} />
            </View>
          ) : mapel.length === 0 ? (
            <Text className="py-6 text-center text-body text-ink-muted">
              Belum ada nilai pada rapor ini
            </Text>
          ) : (
            <View className="overflow-hidden rounded-field border border-line">
              <View className="flex-row bg-brand px-2 py-2">
                <Text className="w-5 text-caption font-bold text-brand-foreground">
                  No
                </Text>
                <Text className="flex-1 text-caption font-bold text-brand-foreground">
                  Mata Pelajaran
                </Text>
                {JENIS.map(j => (
                  <Text
                    key={j.value}
                    className="w-8 text-center text-caption font-bold text-brand-foreground"
                  >
                    {j.label === 'Harian'
                      ? 'Hr'
                      : j.label === 'Tugas'
                      ? 'Tg'
                      : j.label}
                  </Text>
                ))}
                <Text className="w-11 text-center text-caption font-bold text-brand-foreground">
                  Rata
                </Text>
              </View>
              {mapel.map((m, i) => (
                <View
                  key={m.id}
                  className={`flex-row items-center border-t border-line px-2 py-2.5 ${
                    i % 2 ? 'bg-field' : 'bg-surface'
                  }`}
                >
                  <Text className="w-5 text-caption text-ink-muted">
                    {i + 1}
                  </Text>
                  <Text className="flex-1 pr-1 text-label text-ink">
                    {m.nama}
                  </Text>
                  {JENIS.map(j => {
                    const v = m.nilai[j.value];
                    return (
                      <Text
                        key={j.value}
                        style={
                          v !== undefined ? {color: scoreColor(v)} : undefined
                        }
                        className="w-8 text-center text-label text-ink-muted"
                      >
                        {v ?? '-'}
                      </Text>
                    );
                  })}
                  <Text
                    style={{color: scoreColor(m.rata)}}
                    className="w-11 text-center text-label font-bold"
                  >
                    {m.rata.toFixed(1)}
                  </Text>
                </View>
              ))}
              <View className="flex-row items-center border-t-2 border-ink bg-brand-light px-2 py-3">
                <Text className="flex-1 text-label font-bold text-ink">
                  RATA-RATA KESELURUHAN
                </Text>
                <Text
                  style={{color: rataColor}}
                  className="text-body font-bold"
                >
                  {rata !== null ? rata.toFixed(1) : '-'}
                </Text>
              </View>
            </View>
          )}
          <Text className="mt-1 text-caption text-ink-muted">
            Hr: Harian · Tg: Tugas · UTS: Ujian Tengah Semester · UAS: Ujian
            Akhir Semester
          </Text>

          {rata !== null ? (
            <>
              <Text className="mb-2 mt-4 text-label font-bold text-ink">
                B. PREDIKAT
              </Text>
              <View
                style={{
                  backgroundColor: rataColor + '1A',
                  borderColor: rataColor,
                }}
                className="flex-row items-center justify-between rounded-field border px-4 py-3"
              >
                <Text
                  style={{color: rataColor}}
                  className="text-body font-bold"
                >
                  {predikat(rata)}
                </Text>
                <Text
                  style={{color: rataColor}}
                  className="text-label font-semibold"
                >
                  Nilai rata-rata {rata.toFixed(1)}
                </Text>
              </View>
            </>
          ) : null}

          <Text className="mb-2 mt-4 text-label font-bold text-ink">
            C. CATATAN WALI KELAS
          </Text>
          <View className="min-h-[56px] rounded-field border border-line bg-field px-3 py-3">
            <Text className="text-label italic text-ink">
              {r.catatan_wali_kelas
                ? `"${r.catatan_wali_kelas}"`
                : 'Tidak ada catatan.'}
            </Text>
          </View>

          <View className="mt-5 flex-row items-center justify-between border-t border-line pt-3">
            <Text className="text-caption text-ink-muted">Status rapor</Text>
            <View
              style={{backgroundColor: st.color + '1A'}}
              className="rounded-full px-3 py-1"
            >
              <Text
                style={{color: st.color}}
                className="text-caption font-semibold"
              >
                {st.label}
                {r.published_at ? ` · ${dateId(r.published_at)}` : ''}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
