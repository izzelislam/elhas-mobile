import React, {useEffect, useMemo, useState} from 'react';
import {View} from 'react-native';
import {BottomSheet} from '@/components/ui/BottomSheet';
import {Button} from '@/components/ui/Button';
import {Select} from '@/components/ui/Select';

export type NotifikasiFilter = {
  category: string | null;
  read: boolean | null;
};

export const defaultNotifikasiFilter = (): NotifikasiFilter => ({category: null, read: null});

export const categoryLabel = (v: string) => v.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());

type Props = {
  visible: boolean;
  value: NotifikasiFilter;
  categories: string[];
  onClose: () => void;
  onApply: (value: NotifikasiFilter) => void;
};

export function NotifikasiFilterSheet({visible, value, categories, onClose, onApply}: Props) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (visible) {
      setDraft(value);
    }
  }, [visible, value]);

  const categoryOptions = useMemo(
    () =>
      [{value: null as string | null, label: 'Semua kategori'}].concat(
        categories.map(c => ({value: c, label: categoryLabel(c)})),
      ),
    [categories],
  );
  const readOptions: {value: boolean | null; label: string}[] = [
    {value: null, label: 'Semua'},
    {value: false, label: 'Belum dibaca'},
    {value: true, label: 'Sudah dibaca'},
  ];
  // Select hanya menerima string | number | null, jadi boolean dipetakan ke string.
  const readKey = draft.read === null ? null : draft.read ? 'true' : 'false';

  return (
    <BottomSheet visible={visible} title="Filter" onClose={onClose}>
      <View className="gap-4 pb-1">
        <Select<string | null>
          label="Kategori"
          placeholder="Semua kategori"
          value={draft.category}
          onChange={category => setDraft(d => ({...d, category}))}
          options={categoryOptions}
        />
        <Select<string | null>
          label="Status"
          placeholder="Semua"
          value={readKey}
          onChange={k => setDraft(d => ({...d, read: k === null ? null : k === 'true'}))}
          options={readOptions.map(o => ({
            value: o.value === null ? null : String(o.value),
            label: o.label,
          }))}
        />
      </View>
      <View className="mt-5 flex-row gap-3">
        <View className="flex-1">
          <Button
            title="Reset"
            variant="outline"
            onPress={() => {
              onApply(defaultNotifikasiFilter());
              onClose();
            }}
          />
        </View>
        <View className="flex-1">
          <Button
            title="Terapkan"
            onPress={() => {
              onApply(draft);
              onClose();
            }}
          />
        </View>
      </View>
    </BottomSheet>
  );
}
