#!/usr/bin/env bash
# build-release-bundles.sh — build TWX30 standalone tools and installer packages.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BIN_ROOT="${REPO_ROOT}/bin"

cd "${SCRIPT_DIR}"

if [[ "${1:-}" == "--help" ]]; then
  cat <<'EOF'
Usage: ./build-release-bundles.sh

Builds:
  - MTC
  - TWXP
  - TWXC
  - TWXD

Targets:
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
TWXC_INSTALL_AFTER_BUILD=0 ./build-twxc.sh
./build-twxd.sh

for RID in "${RIDS[@]}"; do
  echo "==> Packaging ${RID}..."

  if [[ "${RID}" == linux-* ]]; then
    RID_LIST="${RID}" ./build-linux-packages.sh
    continue
  fi

  if [[ "${RID}" == osx-* ]]; then
    RID_LIST="${RID}" ./build-macos-pkgs.sh
    continue
  fi

  if [[ "${RID}" == win-* ]]; then
    MSI_PATH="${BIN_ROOT}/twx30-${RID}.msi"
    if [[ ! -f "${MSI_PATH}" ]]; then
      echo "Missing externally built Windows MSI: ${MSI_PATH}" >&2
      exit 1
    fi
    echo "==> Using externally built Windows MSI ${RID}: $(ls -lh "${MSI_PATH}" | awk '{print $5, $6, $7, $8, $9}')"
    continue
  fi

  echo "Unsupported package RID: ${RID}" >&2
  exit 1
done
