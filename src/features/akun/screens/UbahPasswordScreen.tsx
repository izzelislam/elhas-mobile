import React, {useState} from 'react';
import {Pressable, ScrollView, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, CheckCheck, KeyRound, Lock, ShieldCheck} from 'lucide-react-native';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {TextField} from '@/components/ui/TextField';
import {colors} from '@/theme';
import {dialog} from '@/store/dialog.store';

export default function UbahPasswordScreen({onBack}: {onBack: () => void}) {
  const insets = useSafeAreaInsets();
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const e: Record<string, string> = {};
    if (!oldPw) {
      e.old = 'Password lama wajib diisi';
    }
    if (newPw.length < 8) {
      e.new = 'Password baru minimal 8 karakter';
    }
    if (confirmPw !== newPw) {
      e.confirm = 'Konfirmasi password tidak sama';
    }
    setErrors(e);
    if (Object.keys(e).length) {
      return;
    }
    // TODO: panggil API ubah password
    dialog.alert({
      title: 'Berhasil',
      message: 'Password berhasil diperbarui',
      variant: 'success',
      onConfirm: onBack,
    });
  };

  return (
    <View className="flex-1 bg-canvas">
      <View
        style={{paddingTop: insets.top + 24}}
        className="flex-row items-center bg-brand px-5 pb-5">
        <Pressable onPress={onBack} hitSlop={10}>
          <ArrowLeft size={22} color={colors.brand.foreground} />
        </Pressable>
        <Text className="ml-3 text-title text-brand-foreground">Ubah Password</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-5"
        keyboardShouldPersistTaps="handled">
        <Card className="gap-5">
          <View className="flex-row items-center">
            <View
              style={{backgroundColor: colors.brand.light}}
              className="h-11 w-11 items-center justify-center rounded-icon">
              <ShieldCheck size={22} color={colors.brand.DEFAULT} strokeWidth={1.8} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-title text-ink">Amankan akun Anda</Text>
              <Text className="text-caption text-ink-muted">
                Gunakan password yang kuat dan jangan dibagikan ke siapa pun.
              </Text>
            </View>
          </View>
          <View className="h-px bg-line" />
          <TextField
            label="Password Lama"
            icon={Lock}
            password
            placeholder="Masukkan password lama"
            value={oldPw}
            onChangeText={setOldPw}
            error={errors.old}
          />
          <TextField
            label="Password Baru"
            icon={KeyRound}
            password
            placeholder="Minimal 8 karakter"
            hint="Kombinasikan huruf dan angka agar lebih aman"
            value={newPw}
            onChangeText={setNewPw}
            error={errors.new}
          />
          <TextField
            label="Konfirmasi Password Baru"
            icon={CheckCheck}
            password
            placeholder="Ulangi password baru"
            value={confirmPw}
            onChangeText={setConfirmPw}
            error={errors.confirm}
          />
        </Card>
        <Button title="Simpan Perubahan" className="mt-5" onPress={submit} />
      </ScrollView>
    </View>
  );
}
