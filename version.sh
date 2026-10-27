#!/usr/bin/env bash
# Kelola versi elhamobile (semver). Sumber tunggal: "version" di package.json.
#
#   ./version.sh                  tampilkan versi saat ini
#   ./version.sh patch            0.0.1 -> 0.0.2   (perbaikan bug)
#   ./version.sh minor            0.0.2 -> 0.1.0   (fitur baru)
#   ./version.sh major            0.1.0 -> 1.0.0   (perubahan besar)
#   ./version.sh set 1.4.2        set versi langsung
#   ./version.sh patch --tag      naikkan, lalu commit + buat git tag v0.0.2
#
# Yang ikut berubah: package.json + package-lock.json, versi dan build number iOS.
# Android (versionName/versionCode) dan teks versi di app membaca package.json otomatis.
# versionCode = major*10000 + minor*100 + patch (0.0.1 -> 1, 1.2.3 -> 10203).
set -euo pipefail

cd "$(dirname "$0")"

PBXPROJ=ios/elhas_mobile.xcodeproj/project.pbxproj

current() { node -p "require('./package.json').version"; }

code_of() {
  local core=${1%%-*}
  IFS=. read -r ma mi pa <<<"$core"
  echo $((ma * 10000 + mi * 100 + pa))
}

show() {
  local v
  v=$(current)
  echo "versi        : $v"
  echo "versionCode  : $(code_of "$v")  (Android) / build number (iOS)"
}

usage() {
  sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
  exit "${1:-0}"
}

CMD=${1:-show}
TAG=0
TARGET=""

case "$CMD" in
  show | -h | --help)
    [[ "$CMD" == show ]] && {
      show
      exit 0
    }
    usage 0
    ;;
  patch | minor | major) ;;
  set)
    TARGET=${2:-}
    [[ -n "$TARGET" ]] || {
      echo "Pakai: ./version.sh set X.Y.Z" >&2
      exit 1
    }
    ;;
  *)
    echo "Perintah tidak dikenal: $CMD" >&2
    usage 1
    ;;
esac
[[ " $* " == *" --tag "* ]] && TAG=1

OLD=$(current)

if [[ "$CMD" == set ]]; then
  [[ "$TARGET" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.]+)?$ ]] || {
    echo "Format versi tidak valid: $TARGET (contoh: 1.4.2)" >&2
    exit 1
  }
  NEW=$TARGET
else
  IFS=. read -r MA MI PA <<<"${OLD%%-*}"
  case "$CMD" in
    major) NEW="$((MA + 1)).0.0" ;;
    minor) NEW="$MA.$((MI + 1)).0" ;;
    patch) NEW="$MA.$MI.$((PA + 1))" ;;
  esac
fi

if [[ "$NEW" == "$OLD" ]]; then
  echo "Versi sudah $OLD, tidak ada yang diubah."
  exit 0
fi

if [[ "$TAG" == 1 ]] && git rev-parse -q --verify "refs/tags/v$NEW" >/dev/null; then
  echo "Tag v$NEW sudah ada." >&2
  exit 1
fi

npm version "$NEW" --no-git-tag-version --allow-same-version >/dev/null
CODE=$(code_of "$NEW")

# iOS: MARKETING_VERSION = versi tampil, CURRENT_PROJECT_VERSION = build number.
perl -pi -e "s/MARKETING_VERSION = [^;]+;/MARKETING_VERSION = ${NEW%%-*};/; s/CURRENT_PROJECT_VERSION = [^;]+;/CURRENT_PROJECT_VERSION = $CODE;/" "$PBXPROJ"

echo "versi        : $OLD -> $NEW"
echo "versionCode  : $CODE"

if [[ "$TAG" == 1 ]]; then
  git add package.json package-lock.json "$PBXPROJ"
  git commit -m "chore: versi $NEW" -- package.json package-lock.json "$PBXPROJ" >/dev/null
  git tag -a "v$NEW" -m "elhamobile $NEW"
  echo "commit + tag : v$NEW (belum di-push: git push --follow-tags)"
else
  echo "Belum di-commit. Tambahkan --tag untuk commit + tag otomatis."
fi
