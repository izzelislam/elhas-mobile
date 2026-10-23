import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Pressable, ScrollView, Text, View} from 'react-native';
import {BottomSheet} from '@/components/ui/BottomSheet';
import {Button} from '@/components/ui/Button';
import {colors} from '@/theme';
import {getTagihanList} from '../services/tagihan.service';
import type {Tagihan} from '../types';
import {rupiah} from './format';
import type {TagihanFilter} from './TagihanFilterSheet';
import {statusColor, statusLabel} from './tagihanStatus';

const UNPAID = ['belum_bayar', 'sebagian'];

/** Daftar tagihan yang masih harus dibayar (mengikuti filter layar Tagihan); dipilih lalu ke form bayar. */
export function PilihTagihanSheet({
  visible,
  filter,
  onClose,
  onPick,
}: {
  visible: boolean;
  filter: TagihanFilter;
  onClose: () => void;
  onPick: (t: Tagihan) => void;
}) {
  const [items, setItems] = useState<Tagihan[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = () => {
    setLoading(true);
    // filter status 'lunas' tidak punya tagihan yang perlu dibayar
    const statuses = filter.status ? UNPAID.filter(s => s === filter.status) : UNPAID;
    Promise.all(
      statuses.map(status =>
        getTagihanList({
          status,
          per_page: 50,
          santri_id: filter.santri?.id,
          tahun_ajaran_id: filter.tahunAjaranId ?? undefined,
        }),
      ),
    )
      .then(res => {
        setItems(
          res
            .flatMap(r => r.data)
            .sort((a, b) => (a.tanggal_jatuh_tempo ?? '').localeCompare(b.tanggal_jatuh_tempo ?? '')),
        );
        setFailed(false);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (visible) {
      load();
    }
  }, [visible, filter]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <BottomSheet visible={visible} title="Pilih Tagihan" onClose={onClose}>
      <View style={{maxHeight: 420}}>
        {loading ? (
          <ActivityIndicator className="my-10" color={colors.brand.DEFAULT} />
        ) : failed ? (
          <View className="items-center py-8">
            <Text className="mb-3 text-label text-ink-muted">Tagihan tidak dapat dimuat</Text>
            <Button title="Coba lagi" onPress={load} />
          </View>
        ) : items.length === 0 ? (
          <Text className="py-10 text-center text-label text-ink-muted">
            Tidak ada tagihan yang belum terbayar
          </Text>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {items.map(t => {
              const c = statusColor(t.status);
              return (
                <Pressable
                  key={t.id}
                  onPress={() => onPick(t)}
                  className="border-b border-line py-3 active:opacity-70">
                  <View className="flex-row items-center">
                    <View className="flex-1 pr-3">
                      <Text className="text-label font-medium text-ink" numberOfLines={1}>
                        {t.nama}
                      </Text>
                      <Text className="text-caption text-ink-muted" numberOfLines={1}>
                        {t.santri?.nama_lengkap}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-label font-semibold text-ink">
                        {rupiah(t.sisa_tagihan)}
                      </Text>
                      <Text style={{color: c}} className="text-caption">
                        {statusLabel(t.status)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>
    </BottomSheet>
  );
}
