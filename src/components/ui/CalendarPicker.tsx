import React, {useState} from 'react';
import {Pressable, Text, View} from 'react-native';
import {ChevronLeft, ChevronRight} from 'lucide-react-native';
import {colors} from '@/theme';

const WEEK = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const pad = (n: number) => String(n).padStart(2, '0');
const toKey = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

type Props = {
  /** Format YYYY-MM-DD */
  value: string | null;
  onChange: (value: string) => void;
};

export function CalendarPicker({value, onChange}: Props) {
  const initial = value ? new Date(value + 'T00:00:00') : new Date();
  const [year, setYear] = useState(initial.getFullYear());
  const [month, setMonth] = useState(initial.getMonth());

  const shift = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const offset = (new Date(year, month, 1).getDay() + 6) % 7; // minggu mulai Senin
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({length: days}, (_, i) => i + 1),
  ];
  while (cells.length % 7) {
    cells.push(null);
  }
  const rows = Array.from({length: cells.length / 7}, (_, i) => cells.slice(i * 7, i * 7 + 7));
  const today = new Date();
  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());
  const title = new Date(year, month, 1).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <View>
      <View className="mb-2 flex-row items-center justify-between">
        <Pressable onPress={() => shift(-1)} hitSlop={10} className="p-1">
          <ChevronLeft size={22} color={colors.text.muted} />
        </Pressable>
        <Text className="text-body font-semibold text-ink">{title}</Text>
        <Pressable onPress={() => shift(1)} hitSlop={10} className="p-1">
          <ChevronRight size={22} color={colors.text.muted} />
        </Pressable>
      </View>
      <View className="flex-row">
        {WEEK.map(w => (
          <Text key={w} className="flex-1 py-1 text-center text-caption text-ink-muted">
            {w}
          </Text>
        ))}
      </View>
      {rows.map((row, i) => (
        <View key={i} className="flex-row">
          {row.map((d, j) => {
            if (d === null) {
              return <View key={j} className="h-10 flex-1" />;
            }
            const key = toKey(year, month, d);
            const active = key === value;
            return (
              <Pressable
                key={j}
                onPress={() => onChange(key)}
                className="h-10 flex-1 items-center justify-center">
                <View
                  className={`h-9 w-9 items-center justify-center rounded-full ${
                    active ? 'bg-brand' : key === todayKey ? 'bg-brand-light' : ''
                  }`}>
                  <Text
                    className={`text-label ${
                      active ? 'font-semibold text-brand-foreground' : 'text-ink'
                    }`}>
                    {d}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
