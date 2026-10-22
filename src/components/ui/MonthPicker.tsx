import React, {useState} from 'react';
import {Pressable, Text, View} from 'react-native';
import {ChevronLeft, ChevronRight} from 'lucide-react-native';
import {colors} from '@/theme';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

type Props = {
  /** Format YYYY-MM */
  value: string | null;
  onChange: (value: string) => void;
};

export function MonthPicker({value, onChange}: Props) {
  const [year, setYear] = useState(value ? parseInt(value.slice(0, 4), 10) : new Date().getFullYear());
  const now = new Date();
  const nowKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  return (
    <View>
      <View className="mb-3 flex-row items-center justify-between">
        <Pressable onPress={() => setYear(y => y - 1)} hitSlop={10} className="p-1">
          <ChevronLeft size={22} color={colors.text.muted} />
        </Pressable>
        <Text className="text-body font-semibold text-ink">{year}</Text>
        <Pressable onPress={() => setYear(y => y + 1)} hitSlop={10} className="p-1">
          <ChevronRight size={22} color={colors.text.muted} />
        </Pressable>
      </View>
      <View className="flex-row flex-wrap">
        {MONTHS.map((m, i) => {
          const key = `${year}-${String(i + 1).padStart(2, '0')}`;
          const active = key === value;
          return (
            <Pressable
              key={m}
              onPress={() => onChange(key)}
              style={{width: '25%'}}
              className="items-center py-1.5">
              <View
                className={`h-10 w-[88%] items-center justify-center rounded-card ${
                  active ? 'bg-brand' : key === nowKey ? 'bg-brand-light' : ''
                }`}>
                <Text
                  className={`text-label ${
                    active ? 'font-semibold text-brand-foreground' : 'text-ink'
                  }`}>
                  {m}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
