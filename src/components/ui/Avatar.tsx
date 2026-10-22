import React from 'react';
import {Image, Text, View} from 'react-native';

type Props = {uri?: string; size?: number; name?: string};

const initials = (name?: string) =>
  (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]!.toUpperCase())
    .join('');

export function Avatar({uri, size = 80, name}: Props) {
  return (
    <View
      style={{width: size, height: size}}
      className="overflow-hidden rounded-icon border-2 border-brand-foreground/60 bg-brand-light">
      {uri ? (
        <Image source={{uri}} className="h-full w-full" />
      ) : name ? (
        <View className="h-full w-full items-center justify-center">
          <Text style={{fontSize: size * 0.36}} className="font-semibold text-brand">
            {initials(name)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
