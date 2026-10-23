import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Pressable, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft} from 'lucide-react-native';
import {SantriPicker} from '@/features/santri/components/SantriPicker';
import {describeError} from '@/lib/errors';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';
import {getTabunganDetail, getTabunganList} from '../services/tabungan.service';
import type {TabunganDetail} from '../types';
import TabunganTransaksiFormScreen from './TabunganTransaksiFormScreen';

/** Pilih santri, lalu isi form setoran atau penarikan pada rekeningnya. */
export default function TarikTabunganScreen({onBack}: {onBack: () => void}) {
  const insets = useSafeAreaInsets();
  const [santriId, setSantriId] = useState<number | null>(null);
  const [tabungan, setTabungan] = useState<TabunganDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (santriId === null) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    getTabunganList({santri_id: santriId, per_page: 1})
      .then(async res => {
        if (!res.data.length) {
          throw new Error('Santri ini belum memiliki rekening tabungan');
        }
        return getTabunganDetail(res.data[0].id);
      })
      .then(detail => {
        if (cancelled) {
          return;
        }
        if (!detail.can_transact) {
          toast.error('Anda tidak memiliki izin transaksi pada rekening ini');
          setSantriId(null);
          return;
        }
        setTabungan(detail);
      })
      .catch(err => {
        if (!cancelled) {
          toast.error(describeError(err) || (err as Error).message || 'Gagal memuat rekening');
          setSantriId(null);
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [santriId]);

  if (tabungan) {
    return (
      <TabunganTransaksiFormScreen
        tabungan={tabungan}
        onBack={() => {
          setTabungan(null);
          setSantriId(null);
        }}
        onSaved={() => {
          setTabungan(null);
          setSantriId(null);
        }}
      />
    );
  }

  return (
    <View className="flex-1 bg-canvas">
      <View style={{paddingTop: insets.top + 24}} className="bg-brand px-5 pb-5">
        <View className="flex-row items-center">
          <Pressable onPress={onBack} hitSlop={10}>
            <ArrowLeft size={22} color={colors.brand.foreground} />
          </Pressable>
          <Text className="ml-3 text-title text-brand-foreground">Transaksi Tabungan</Text>
        </View>
        <Text className="ml-9 mt-1 text-label text-brand-foreground opacity-80">
          Pilih santri untuk menabung atau menarik tabungan
        </Text>
      </View>
      <View className="flex-1 px-5 pt-4">
        {loading ? (
          <ActivityIndicator className="mt-10" color={colors.brand.DEFAULT} />
        ) : (
          <SantriPicker onPick={s => setSantriId(s.id)} />
        )}
      </View>
    </View>
  );
}
