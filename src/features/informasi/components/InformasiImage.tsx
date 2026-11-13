import React, {useEffect, useState} from 'react';
import {Image, View} from 'react-native';
import {ImageIcon} from 'lucide-react-native';
import {colors} from '@/theme';

/** Gambar informasi; tampil placeholder bila belum ada gambar. */
export function InformasiImage({
  uri,
  className,
  iconSize = 32,
}: {
  uri?: string | null;
  className?: string;
  iconSize?: number;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);
  if (uri && !failed) {
    return (
      <Image
        source={{uri}}
        className={className}
        resizeMode="cover"
        onError={e => {
          console.log('[image] gagal dimuat', e.nativeEvent?.error, uri.slice(0, 120));
          setFailed(true);
        }}
      />
    );
  }
  return (
    <View className={`items-center justify-center bg-field ${className ?? ''}`}>
      <ImageIcon size={iconSize} color={colors.text.muted} />
    </View>
  );
}
