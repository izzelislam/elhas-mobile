import React, {useRef, useState} from 'react';
import {Modal, Pressable, ScrollView, Text, useWindowDimensions, View} from 'react-native';
import {Check, ChevronDown, ChevronUp} from 'lucide-react-native';
import {colors} from '@/theme';

export type SelectOption<T> = {value: T; label: string};

type Props<T> = {
  label?: string;
  placeholder?: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
};

const ROW = 46;
const MAX_LIST = 230;

type Anchor = {x: number; y: number; w: number; h: number};

/** Dropdown melayang (popover) di atas konten, tidak mendorong layout di bawahnya. */
export function Select<T extends string | number | null>({
  label,
  placeholder = 'Pilih',
  value,
  options,
  onChange,
}: Props<T>) {
  const ref = useRef<React.ComponentRef<typeof Pressable>>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const {height: screenH} = useWindowDimensions();
  const selected = options.find(o => o.value === value);
  const open = anchor !== null;
  const Chevron = open ? ChevronUp : ChevronDown;

  const show = () =>
    ref.current?.measureInWindow((x, y, w, h) => setAnchor({x, y, w, h}));

  const listH = Math.min(options.length * ROW, MAX_LIST);
  const below = anchor ? screenH - (anchor.y + anchor.h) - 16 >= listH : true;

  return (
    <View>
      {label ? <Text className="mb-1.5 text-label font-medium text-ink">{label}</Text> : null}
      <Pressable
        ref={ref}
        collapsable={false}
        onPress={show}
        className={`h-12 flex-row items-center rounded-card border bg-field px-4 ${
          open ? 'border-brand' : 'border-line'
        }`}>
        <Text
          numberOfLines={1}
          className={`flex-1 text-body ${selected ? 'text-ink' : 'text-ink-muted'}`}>
          {selected?.label ?? placeholder}
        </Text>
        <Chevron size={18} color={colors.text.muted} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setAnchor(null)}>
        <Pressable className="flex-1" onPress={() => setAnchor(null)}>
          {anchor ? (
            <View
              style={{
                position: 'absolute',
                left: anchor.x,
                width: anchor.w,
                maxHeight: MAX_LIST,
                ...(below
                  ? {top: anchor.y + anchor.h + 4}
                  : {top: anchor.y - 4 - listH}),
                elevation: 8,
                shadowColor: '#000',
                shadowOpacity: 0.15,
                shadowRadius: 12,
                shadowOffset: {width: 0, height: 4},
              }}
              className="overflow-hidden rounded-card border border-line bg-surface">
              <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                {options.map((o, i) => {
                  const active = o.value === value;
                  return (
                    <Pressable
                      key={String(o.value)}
                      onPress={() => {
                        onChange(o.value);
                        setAnchor(null);
                      }}
                      style={{height: ROW}}
                      className={`flex-row items-center px-4 active:bg-brand-light ${
                        i > 0 ? 'border-t border-line' : ''
                      } ${active ? 'bg-brand-light/60' : ''}`}>
                      <Text className="flex-1 text-body text-ink">{o.label}</Text>
                      {active ? <Check size={16} color={colors.brand.DEFAULT} /> : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}
        </Pressable>
      </Modal>
    </View>
  );
}
