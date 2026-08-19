#!/usr/bin/env bash
# build-sourceforge-bundles.sh — build TWX30 installer packages for SourceForge distribution.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BIN_ROOT="${REPO_ROOT}/bin"

cd "${SCRIPT_DIR}"

if [[ "${1:-}" == "--help" ]]; then
  cat <<'EOF'
Usage: ./build-sourceforge-bundles.sh

Builds standalone binaries for packageable host targets:
  - MTC
  - TWXP
  - TWXC
  - TWXD

Build/package targets:
  - osx-arm64
  - osx-x64
  - linux-x64

Windows MSI installers are built separately on Windows and consumed from:
  - TWX30/bin/twx30-win-x64.msi
  - TWX30/bin/twx30-win-arm64.msi

Outputs:
  - TWX30/bin/<rid>/MTC
  - TWX30/bin/<rid>/twxp
  - TWX30/bin/<rid>/twxc
  - TWX30/bin/<rid>/twxd
  - bundled Mombot scripts in packages that support script payloads
  - TWX30/bin/twx30-osx-<arch>.pkg
  - TWX30/bin/twx30-linux-x64.deb
  - TWX30/bin/twx30-linux-x64.rpm

Set MOMBOT_RELEASE_SOURCE to override the Mombot Release/mombot tree used for
the installer script payload.
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
    linux-x64
  )
fi

./build-mtc.sh
./build-twxp.sh
./build-twxc.sh
./build-twxd.sh

for rid in "${RIDS[@]}"; do
  echo "==> Packaging ${rid}..."

  if [[ "${rid}" == linux-* ]]; then
    RID_LIST="${rid}" ./build-linux-packages.sh
    continue
  fi

  if [[ "${rid}" == osx-* ]]; then
    RID_LIST="${rid}" ./build-macos-pkgs.sh
    continue
  fi

  if [[ "${rid}" == win-* ]]; then
    msi_path="${BIN_ROOT}/twx30-${rid}.msi"
    if [[ ! -f "${msi_path}" ]]; then
      echo "Missing externally built Windows MSI: ${msi_path}" >&2
      exit 1
    fi
    echo "==> Using externally built Windows MSI ${rid}: $(ls -lh "${msi_path}" | awk '{print $5, $6, $7, $8, $9}')"
    continue
  fi

  echo "Unsupported package RID: ${rid}" >&2
  exit 1
done

install -m 0644 "${SCRIPT_DIR}/mtc-updates.example.json" "${BIN_ROOT}/mtc-updates.json"
echo "==> Wrote update manifest: ${BIN_ROOT}/mtc-updates.json"
