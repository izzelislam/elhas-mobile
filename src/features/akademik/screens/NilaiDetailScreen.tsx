import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, BookOpen, ListChecks, User} from 'lucide-react-native';
import type {LucideIcon} from 'lucide-react-native';
import {Avatar} from '@/components/ui/Avatar';
import {Card} from '@/components/ui/Card';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';
import {JENIS, jenisLabel} from '../components/NilaiFilterSheet';
import {
  Nilai,
  NilaiDetail,
  getNilaiDetail,
  getNilaiList,
} from '../services/nilai.service';

const scoreColor = (n: number) =>
  n >= 80 ? '#059669' : n >= 70 ? '#2563EB' : n >= 60 ? '#D97706' : '#DC2626';

const predikat = (n: number) =>
  n >= 80
    ? 'Sangat Baik'
    : n >= 70
    ? 'Baik'
    : n >= 60
    ? 'Cukup'
    : 'Perlu Ditingkatkan';

const cap = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);

const dateId = (v: string) =>
  new Date(v).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

function Row({label, value}: {label: string; value?: string | null}) {
  return (
    <View className="flex-row items-start justify-between py-2">
      <Text className="text-label text-ink-muted">{label}</Text>
      <Text className="ml-4 flex-1 text-right text-label font-medium text-ink">
        {value || '-'}
      </Text>
    </View>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="mt-3 border-0 p-4">
      <View className="mb-1 flex-row items-center">
        <Icon size={18} color={colors.brand.DEFAULT} />
        <Text className="ml-2 text-body font-semibold text-ink">{title}</Text>
      </View>
      {children}
    </Card>
  );
}

export default function NilaiDetailScreen({
  nilai,
  onBack,
}: {
  nilai: Nilai;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [d, setD] = useState<NilaiDetail | null>(null);
  const [related, setRelated] = useState<Nilai[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNilaiDetail(nilai.id)
      .then(setD)
      .catch(() => toast.error('Gagal memuat detail nilai'))
      .finally(() => setLoading(false));
    // Seluruh jenis nilai santri pada mata pelajaran dan tahun ajaran yang sama.
    getNilaiList({
      per_page: 50,
      santri_id: nilai.santri_id,
      mata_pelajaran_id: nilai.mata_pelajaran_id,
      tahun_ajaran_id: nilai.tahun_ajaran_id,
    })
      .then(res =>
        setRelated(res.data.filter(n => n.semester === nilai.semester)),
      )
      .catch(() => {}); // ringkasan jenis lain bersifat tambahan
  }, [nilai]);

  const santri = d?.santri ?? nilai.santri;
  const mapel = d?.mata_pelajaran ?? nilai.mata_pelajaran;
  const tahun = d?.tahun_ajaran ?? nilai.tahun_ajaran;
  const c = scoreColor(nilai.nilai);
  const rata = related.length
    ? related.reduce((a, n) => a + n.nilai, 0) / related.length
    : null;

  return (
    <View className="flex-1 bg-canvas">
      <View
        style={{paddingTop: insets.top + 24}}
        className="bg-brand px-5 pb-16"
      >
        <View className="flex-row items-center">
          <Pressable onPress={onBack} hitSlop={10}>
            <ArrowLeft size={22} color={colors.brand.foreground} />
          </Pressable>
          <Text className="ml-3 text-title text-brand-foreground">
            Detail Nilai
          </Text>
        </View>
        <Text className="mt-4 text-heading text-brand-foreground">
          {mapel?.nama ?? '-'}
        </Text>
        <Text className="mt-1 text-label text-brand-foreground opacity-80">
          {tahun?.nama ?? '-'} · Semester {cap(nilai.semester)}
        </Text>
      </View>

      <ScrollView
        className="-mt-12"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Card className="items-center border-0 p-5 shadow-sm">
          <View className="rounded-full bg-field px-3 py-1">
            <Text className="text-caption font-semibold text-ink-muted">
              Nilai {jenisLabel(nilai.jenis)}
            </Text>
          </View>
          <Text
            style={{color: c}}
            className="mt-2 text-[64px] font-bold leading-[72px]"
          >
            {nilai.nilai}
          </Text>
          <View
            style={{backgroundColor: c + '1A'}}
            className="rounded-full px-4 py-1.5"
          >
            <Text style={{color: c}} className="text-label font-semibold">
              {predikat(nilai.nilai)}
            </Text>
          </View>
          <View className="mt-4 h-2 w-full overflow-hidden rounded-full bg-field">
            <View
              style={{
                width: `${Math.min(nilai.nilai, 100)}%`,
                backgroundColor: c,
              }}
              className="h-2 rounded-full"
            />
          </View>
        </Card>

        {loading ? (
          <ActivityIndicator className="mt-3" color={colors.brand.DEFAULT} />
        ) : null}

        {related.length > 1 ? (
          <Section icon={ListChecks} title="Nilai pada pelajaran ini">
            {JENIS.map(j => {
              const n = related.find(r => r.jenis === j.value);
              const current = j.value === nilai.jenis;
              return (
                <View
                  key={j.value}
                  className={`mt-1 rounded-card px-3 py-2 ${
                    current ? 'bg-brand-light' : ''
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <Text
                      className={`text-label ${
                        current ? 'font-semibold text-brand' : 'text-ink'
                      }`}
                    >
                      {j.label}
                    </Text>
                    <Text
                      style={n ? {color: scoreColor(n.nilai)} : undefined}
                      className="text-label font-bold text-ink-muted"
                    >
                      {n ? n.nilai : '-'}
                    </Text>
                  </View>
                  <View className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-field">
                    {n ? (
                      <View
                        style={{
                          width: `${Math.min(n.nilai, 100)}%`,
                          backgroundColor: scoreColor(n.nilai),
                        }}
                        className="h-1.5 rounded-full"
                      />
                    ) : null}
                  </View>
                </View>
              );
            })}
            {rata !== null ? (
              <View className="mt-3 flex-row items-center justify-between rounded-card bg-field px-3 py-3">
                <Text className="text-label font-semibold text-ink">
                  Rata-rata
                </Text>
                <Text
                  style={{color: scoreColor(rata)}}
                  className="text-body font-bold"
                >
                  {rata.toFixed(1)} · {predikat(rata)}
                </Text>
              </View>
            ) : null}
          </Section>
        ) : null}

        <Section icon={User} title="Santri">
          <View className="flex-row items-center py-2">
            <Avatar
              name={santri?.nama_lengkap}
              uri={d?.santri?.foto ?? undefined}
              size={44}
            />
            <View className="ml-3 flex-1">
              <Text className="text-body font-semibold text-ink">
                {santri?.nama_lengkap ?? '-'}
              </Text>
              <Text className="text-caption text-ink-muted">
                NIS {santri?.nis ?? '-'}
                {d?.santri?.nisn ? ` · NISN ${d.santri.nisn}` : ''}
              </Text>
            </View>
          </View>
        </Section>

        {nilai.catatan ? (
          <Card className="mt-3 border-0 p-4">
            <Text className="mb-1 text-body font-semibold text-ink">
              Catatan
            </Text>
            <Text className="text-label text-ink-muted">{nilai.catatan}</Text>
          </Card>
        ) : null}

        <Section icon={BookOpen} title="Informasi">
          <Row label="Kode pelajaran" value={mapel?.kode} />
          <Row
            label="Kategori"
            value={
              d?.mata_pelajaran?.kategori
                ? cap(d.mata_pelajaran.kategori)
                : null
            }
          />
          {d ? (
            <Row label="Terakhir diubah" value={dateId(d.updated_at)} />
          ) : null}
        </Section>
      </ScrollView>
    </View>
  );
}
