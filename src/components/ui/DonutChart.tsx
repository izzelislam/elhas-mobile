import React from 'react';
import {Text, View} from 'react-native';
import Svg, {Circle, G} from 'react-native-svg';

export type DonutSlice = {
  key: string;
  label: string;
  value: number;
  color: string;
};

type Props = {
  data: DonutSlice[];
  selected: string | null;
  onSelect: (key: string | null) => void;
  /** Teks di tengah saat tidak ada irisan terpilih. */
  centerValue: string;
  centerLabel: string;
  size?: number;
};

const STROKE = 26;
const GAP = 2; // celah antar irisan

/** Donut chart; ketuk irisan untuk menyorot dan menampilkan nilainya di tengah. */
export function DonutChart({
  data,
  selected,
  onSelect,
  centerValue,
  centerLabel,
  size = 220,
}: Props) {
  const total = data.reduce((a, d) => a + d.value, 0);
  const r = (size - STROKE * 2) / 2;
  const c = 2 * Math.PI * r;
  const active = data.find(d => d.key === selected);
  let offset = 0;

  return (
    <View
      style={{width: size, height: size}}
      className="items-center justify-center self-center"
    >
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="#E5E7EB"
            strokeWidth={STROKE}
            fill="none"
            onPress={() => onSelect(null)}
          />
          {data
            .filter(d => d.value > 0)
            .map(d => {
              const len = (d.value / total) * c;
              const dash = Math.max(len - GAP, 0.5);
              const el = (
                <Circle
                  key={d.key}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  stroke={d.color}
                  strokeWidth={selected === d.key ? STROKE + 8 : STROKE}
                  strokeDasharray={`${dash} ${c - dash}`}
                  strokeDashoffset={-offset}
                  opacity={selected && selected !== d.key ? 0.3 : 1}
                  fill="none"
                  onPress={() => onSelect(selected === d.key ? null : d.key)}
                />
              );
              offset += len;
              return el;
            })}
        </G>
      </Svg>
      <View pointerEvents="none" className="absolute items-center">
        <Text
          style={active ? {color: active.color} : undefined}
          className="text-[34px] font-bold text-ink"
        >
          {active
            ? `${total > 0 ? Math.round((active.value / total) * 100) : 0}%`
            : centerValue}
        </Text>
        <Text className="text-label text-ink-muted">
          {active ? `${active.label} · ${active.value}` : centerLabel}
        </Text>
      </View>
    </View>
  );
}
