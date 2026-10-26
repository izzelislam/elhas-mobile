import React, {useState} from 'react';
import {
  AsramaGedungScreen,
  AsramaKamarScreen,
} from '@/features/asrama/screens';
import {
  IzinFormScreen,
  IzinScreen,
  PelanggaranDetailScreen,
  PelanggaranFormScreen,
  PelanggaranScreen,
  PrestasiDetailScreen,
  PrestasiScreen,
} from '@/features/kesantrian/screens';
import {
  MutabaahSantriDetailScreen,
  MutabaahSantriFormScreen,
  MutabaahSantriScreen,
} from '@/features/mutabaah/screens';
import {SantriDetailScreen, SantriListScreen} from '@/features/santri/screens';
import {
  HalaqahDetailScreen,
  HalaqahScreen,
  RingkasanDetailScreen,
  RingkasanScreen,
  SetoranFormScreen,
  SetoranScreen,
} from '@/features/tahfidz/screens';
import type {RekapSantri} from '@/features/mutabaah/types';
import type {RekapParams} from '@/features/mutabaah/services/mutabaah.service';
import type {Halaqah, RingkasanSantri} from '@/features/tahfidz/types';
import type {Pelanggaran, Prestasi} from '@/features/kesantrian/types';
import type {RouteProps} from './types';

/*
 * Route yang punya layar turunan (detail/form). State turunannya dipegang di sini,
 * bukan di App, sehingga otomatis reset saat route ditutup.
 */

export function SantriFlow({onBack}: RouteProps) {
  const [id, setId] = useState<number | null>(null);
  return id !== null ? (
    <SantriDetailScreen id={id} onBack={() => setId(null)} />
  ) : (
    <SantriListScreen onBack={onBack} onSelect={setId} />
  );
}

export function MutabaahFlow({
  onBack,
  variant,
}: RouteProps & {variant: 'santri' | 'asatidzah'}) {
  const [form, setForm] = useState(false);
  const [detail, setDetail] = useState<{
    santri: RekapSantri;
    params: Omit<RekapParams, 'santri_id'>;
  } | null>(null);
  if (form) {
    return (
      <MutabaahSantriFormScreen
        variant={variant}
        onBack={() => setForm(false)}
        onSaved={() => setForm(false)}
      />
    );
  }
  if (detail) {
    return (
      <MutabaahSantriDetailScreen
        variant={variant}
        santri={detail.santri}
        params={detail.params}
        onBack={() => setDetail(null)}
      />
    );
  }
  return (
    <MutabaahSantriScreen
      variant={variant}
      onBack={onBack}
      onCreate={() => setForm(true)}
      onSelect={(santri, params) => setDetail({santri, params})}
    />
  );
}

export function RingkasanFlow({onBack}: RouteProps) {
  const [santri, setSantri] = useState<RingkasanSantri | null>(null);
  return santri ? (
    <RingkasanDetailScreen ringkasan={santri} onBack={() => setSantri(null)} />
  ) : (
    <RingkasanScreen onBack={onBack} onSelect={setSantri} />
  );
}

export function SetoranFlow({onBack}: RouteProps) {
  const [form, setForm] = useState(false);
  return form ? (
    <SetoranFormScreen
      onBack={() => setForm(false)}
      onSaved={() => setForm(false)}
    />
  ) : (
    <SetoranScreen onBack={onBack} onCreate={() => setForm(true)} />
  );
}

export function HalaqahFlow({onBack}: RouteProps) {
  const [halaqah, setHalaqah] = useState<Halaqah | null>(null);
  return halaqah ? (
    <HalaqahDetailScreen halaqah={halaqah} onBack={() => setHalaqah(null)} />
  ) : (
    <HalaqahScreen onBack={onBack} onSelect={setHalaqah} />
  );
}

/** Menu Gedung -> pilih gedung -> daftar kamar gedung tersebut. */
export function AsramaGedungFlow({onBack}: RouteProps) {
  const [gedungId, setGedungId] = useState<number | null>(null);
  return gedungId !== null ? (
    <AsramaKamarScreen initialGedungId={gedungId} onBack={onBack} />
  ) : (
    <AsramaGedungScreen onBack={onBack} onSelect={setGedungId} />
  );
}

export function IzinFlow({onBack}: RouteProps) {
  const [form, setForm] = useState(false);
  return form ? (
    <IzinFormScreen onBack={() => setForm(false)} onSaved={() => setForm(false)} />
  ) : (
    <IzinScreen onBack={onBack} onCreate={() => setForm(true)} />
  );
}

export function PrestasiFlow({onBack}: RouteProps) {
  const [item, setItem] = useState<Prestasi | null>(null);
  return item ? (
    <PrestasiDetailScreen initial={item} onBack={() => setItem(null)} />
  ) : (
    <PrestasiScreen onBack={onBack} onSelect={setItem} />
  );
}

export function PelanggaranFlow({onBack}: RouteProps) {
  const [form, setForm] = useState(false);
  const [item, setItem] = useState<Pelanggaran | null>(null);
  if (form) {
    return (
      <PelanggaranFormScreen
        onBack={() => setForm(false)}
        onSaved={() => setForm(false)}
      />
    );
  }
  if (item) {
    return <PelanggaranDetailScreen item={item} onBack={() => setItem(null)} />;
  }
  return (
    <PelanggaranScreen
      onBack={onBack}
      onSelect={setItem}
      onCreate={() => setForm(true)}
    />
  );
}
