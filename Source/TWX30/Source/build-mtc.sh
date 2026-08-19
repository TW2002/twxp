#!/usr/bin/env bash
# build-mtc.sh — clean publish standalone MTC binaries.
# Final release binaries are written to TWX30/bin/<rid>.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BIN_ROOT="${REPO_ROOT}/bin"

cd "${SCRIPT_DIR}"

"${SCRIPT_DIR}/stamp-mtc-build.sh"

install_release_artifact() {
  local src="$1"
  local dest="$2"
  local rid="$3"
  local dest_dir
  local tmp

  dest_dir="$(dirname "$dest")"
  tmp="${dest}.tmp.$$"

  mkdir -p "$dest_dir"
  rm -f "$tmp"
  cp "$src" "$tmp"
  chmod 755 "$tmp" 2>/dev/null || true

  if [[ "$rid" == osx-* ]]; then
    xattr -d com.apple.quarantine "$tmp" 2>/dev/null || true
    codesign --force --deep --sign - "$tmp"
  fi

  mv -f "$tmp" "$dest"
}

if [[ "${1:-}" == "--help" ]]; then
  cat <<'EOF'
Usage: ./build-mtc.sh

  Publishes standalone MTC release binaries into:
    - TWX30/bin/<rid>/MTC
EOF
  exit 0
elif [[ $# -gt 0 ]]; then
  echo "Unknown option: $1" >&2
  exit 1
fi

if [[ -n "${RID_LIST:-}" ]]; then
  IFS=' ' read -r -a RIDS <<< "${RID_LIST}"
else
  RIDS=(
    osx-arm64
    osx-x64
    win-x64
    linux-x64
  )
fi

echo "==> Cleaning..."
rm -rf obj MTC/bin MTC/obj

for RID in "${RIDS[@]}"; do
  echo "==> Publishing ${RID}..."
  AVALONIA_TELEMETRY_OPTOUT=1 dotnet publish MTC/MTC.csproj \
      -c Release \
      -r "${RID}" \
      2>&1 | grep -v "^$"

  if [[ "${RID}" == win-* ]]; then
    BIN_NAME="MTC.exe"
  else
    BIN_NAME="MTC"
  fi

  BIN_DIR="MTC/bin/Release/net10.0/${RID}/publish"
  BIN="${BIN_DIR}/${BIN_NAME}"
  DEST_DIR="${BIN_ROOT}/${RID}"
  DEST="${DEST_DIR}/${BIN_NAME}"

  if [[ "${RID}" == osx-* ]]; then
    xattr -d com.apple.quarantine "${BIN}" 2>/dev/null || true
    echo "==> Signing ${RID}..."
    codesign --force --deep --sign - "${BIN}"
  fi

  install_release_artifact "${BIN}" "${DEST}" "${RID}"

  echo "==> Done ${RID}: $(ls -lh "${DEST}" | awk '{print $5, $6, $7, $8, $9}')"
done
