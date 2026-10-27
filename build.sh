#!/usr/bin/env bash
# Build Android elhamobile (debug atau rilis).
#
#   ./build.sh                       APK debug
#   ./build.sh release               APK rilis
#   ./build.sh release aab           AAB rilis (untuk Play Store)
#   ./build.sh debug --install       build lalu pasang ke perangkat/emulator lewat adb
#   ./build.sh release --clean       bersihkan build sebelumnya dulu
#
# Hasil disalin ke folder build/ dengan nama elhamobile-<versi>-<varian>.<apk|aab>.
# Rilis ditandatangani dengan android/keystore.properties; tanpa file itu memakai
# kunci debug (hanya untuk uji coba).
set -euo pipefail

cd "$(dirname "$0")"

VARIANT=debug
FORMAT=apk
INSTALL=0
CLEAN=0

usage() {
  sed -n '2,11p' "$0" | sed 's/^# \{0,1\}//'
  exit "${1:-0}"
}

for arg in "$@"; do
  case "$arg" in
    debug | release) VARIANT=$arg ;;
    apk | aab) FORMAT=$arg ;;
    --install) INSTALL=1 ;;
    --clean) CLEAN=1 ;;
    -h | --help) usage 0 ;;
    *)
      echo "Argumen tidak dikenal: $arg" >&2
      usage 1
      ;;
  esac
done

if [[ "$FORMAT" == aab && "$VARIANT" == debug ]]; then
  echo "AAB hanya untuk release. Pakai: ./build.sh release aab" >&2
  exit 1
fi
if [[ "$FORMAT" == aab && "$INSTALL" == 1 ]]; then
  echo "AAB tidak bisa dipasang langsung dengan --install; pakai APK." >&2
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "==> node_modules belum ada, menjalankan npm install"
  npm install
fi

if [[ ! -f android/app/google-services.json ]]; then
  echo "PERINGATAN: android/app/google-services.json tidak ada; push notification tidak akan aktif." >&2
fi

if [[ "$VARIANT" == release && ! -f android/keystore.properties ]]; then
  echo "PERINGATAN: android/keystore.properties tidak ada; rilis ditandatangani dengan kunci debug (jangan diunggah ke Play Store)." >&2
fi

VERSION=$(node -p "require('./package.json').version")
Cap=$(printf '%s' "${VARIANT:0:1}" | tr '[:lower:]' '[:upper:]')${VARIANT:1}

if [[ "$FORMAT" == aab ]]; then
  TASK="bundle$Cap"
  SRC="android/app/build/outputs/bundle/$VARIANT/app-$VARIANT.aab"
else
  TASK="assemble$Cap"
  SRC="android/app/build/outputs/apk/$VARIANT/app-$VARIANT.apk"
fi

cd android
if [[ "$CLEAN" == 1 ]]; then
  echo "==> clean"
  ./gradlew clean
fi
echo "==> ./gradlew :app:$TASK"
./gradlew ":app:$TASK"
cd ..

mkdir -p build
OUT="build/elhamobile-$VERSION-$VARIANT.$FORMAT"
cp "$SRC" "$OUT"
echo "==> selesai: $OUT ($(du -h "$OUT" | cut -f1))"

if [[ "$INSTALL" == 1 ]]; then
  echo "==> adb install"
  adb install -r "$OUT"
fi
