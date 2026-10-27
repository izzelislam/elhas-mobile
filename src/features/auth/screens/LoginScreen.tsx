import React, {useState} from 'react';
import {KeyboardAvoidingView, ScrollView, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Lock, Mail} from 'lucide-react-native';
import {Card} from '@/components/ui/Card';
import {Button} from '@/components/ui/Button';
import {Logo} from '@/components/ui/Logo';
import {TextField} from '@/components/ui/TextField';
import {useAuthStore} from '@/store/auth.store';
import {toast} from '@/store/toast.store';
import {login} from '../services/auth.service';
import {isAxiosError} from 'axios';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const setSession = useAuthStore(s => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!email.trim()) {
      e.email = 'Email wajib diisi';
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      e.email = 'Format email tidak valid';
    }
    if (!password) {
      e.password = 'Password wajib diisi';
    }
    setErrors(e);
    if (Object.keys(e).length) {
      return;
    }
    setLoading(true);
    try {
      const {token, user, message} = await login({email: email.trim(), password});
      toast.success(message || 'Login berhasil');
      setSession(token, user);
    } catch (err) {
      const message = isAxiosError(err)
        ? err.response?.data?.message ??
          (err.response ? 'Email atau password salah' : 'Tidak dapat terhubung ke server')
        : 'Terjadi kesalahan, coba lagi';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-canvas"
      behavior="padding">
      <ScrollView
        contentContainerClassName="flex-grow"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View
          style={{paddingTop: insets.top + 64}}
          className="items-center overflow-hidden bg-brand pb-28">
          <View className="absolute -right-16 -top-10 h-56 w-56 rounded-icon bg-white/10" />
          <View className="absolute -left-20 top-24 h-44 w-44 rounded-icon bg-white/10" />
          <Logo size={88} />
          <Text className="mt-4 text-heading text-brand-foreground">elhamobile</Text>
          <Text className="mt-1 text-body text-brand-foreground opacity-80">
            Pondok Pesantren Elhas
          </Text>
        </View>

        <Card className="-mt-16 mx-5 p-6">
          <Text className="text-heading text-ink">Selamat datang</Text>
          <Text className="mb-6 mt-1 text-body text-ink-muted">
            Masuk untuk melanjutkan ke akun Anda
          </Text>

          <View className="gap-5">
            <TextField
              label="Email"
              icon={Mail}
              placeholder="Masukkan email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={v => {
                setEmail(v);
                setErrors(e => ({...e, email: ''}));
              }}
              error={errors.email}
            />
            <TextField
              label="Password"
              icon={Lock}
              password
              placeholder="Masukkan password"
              value={password}
              onChangeText={v => {
                setPassword(v);
                setErrors(e => ({...e, password: ''}));
              }}
              error={errors.password}
              onSubmitEditing={submit}
            />
          </View>

          <Text className="mt-3 self-end text-label font-medium text-brand">
            Lupa password?
          </Text>

          <Button title="Masuk" className="mt-6" loading={loading} onPress={submit} />
        </Card>

        <View style={{paddingBottom: insets.bottom + 20}} className="mt-auto items-center pt-8">
          <Text className="text-caption text-ink-muted">
            Butuh bantuan? Hubungi admin sekolah
          </Text>
          <Text className="mt-1 text-caption text-ink-muted">elhamobile v0.0.1</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
