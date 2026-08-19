#!/usr/bin/env bash
# build-twxd.sh — clean publish standalone twxd binaries.
# Final release binaries are written to TWX30/bin/<rid>.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BIN_ROOT="${REPO_ROOT}/bin"

cd "${SCRIPT_DIR}"

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

# NativeAOT produces much smaller console tools, but must be built on a
# compatible host/toolchain for the target RID. "auto" enables it when the
# current host can build the requested RID.
NATIVE_AOT="${TWX_SCRIPT_TOOLS_NATIVE_AOT:-auto}"

native_aot_enabled_for_rid() {
  local rid="$1"
  local host_os
  host_os="$(uname -s)"

  case "${NATIVE_AOT}" in
    1|true|TRUE|yes|YES)
      return 0
      ;;
    0|false|FALSE|no|NO)
      return 1
      ;;
    auto|AUTO|"")
      case "${host_os}" in
        Darwin)
          [[ "${rid}" == osx-* ]]
          return
          ;;
        Linux)
          [[ "${rid}" == linux-* ]]
          return
          ;;
        MINGW*|MSYS*|CYGWIN*|Windows_NT)
          [[ "${rid}" == win-* ]]
          return
          ;;
      esac
      return 1
      ;;
    *)
      echo "Unknown TWX_SCRIPT_TOOLS_NATIVE_AOT value: ${NATIVE_AOT}" >&2
      exit 1
      ;;
  esac
}

HOST_ARCH="$(uname -m)"
HOST_RID=""
case "${HOST_ARCH}" in
  arm64)
    HOST_RID="osx-arm64"
    ;;
  x86_64)
    HOST_RID="osx-x64"
    ;;
esac

INSTALL_DIR="/usr/local/bin"
INSTALL_PATH="${INSTALL_DIR}/twxd"
INSTALL_AFTER_BUILD="${TWXD_INSTALL_AFTER_BUILD:-1}"

run_install_cmd() {
  if [[ -w "${INSTALL_DIR}" ]] || [[ ! -e "${INSTALL_PATH}" && -w "${INSTALL_DIR}" ]]; then
    "$@"
    return
  fi

  if sudo -n true 2>/dev/null; then
    sudo -n "$@"
    return
  fi

  echo "==> Warning: published standalone succeeded, but install to ${INSTALL_PATH} requires sudo." >&2
  return 1
}

install_local_artifact() {
  local src="$1"
  local tmp="${INSTALL_PATH}.tmp.$$"

  run_install_cmd mkdir -p "${INSTALL_DIR}"
  run_install_cmd rm -f "${tmp}"
  run_install_cmd cp "${src}" "${tmp}"
  run_install_cmd chmod 755 "${tmp}"
  run_install_cmd xattr -d com.apple.quarantine "${tmp}" 2>/dev/null || true
  if [[ "${HOST_RID}" == osx-* ]]; then
    run_install_cmd codesign --force --deep --sign - "${tmp}"
  fi
  run_install_cmd mv -f "${tmp}" "${INSTALL_PATH}"
}

echo "==> Cleaning..."
rm -rf obj TWXD/bin TWXD/obj

for RID in "${RIDS[@]}"; do
  echo "==> Publishing ${RID}..."
  PUBLISH_ARGS=(
      -c Release
      -r "${RID}"
      -p:SuppressTrimAnalysisWarnings=true
  )

  if native_aot_enabled_for_rid "${RID}"; then
    echo "==> NativeAOT enabled for ${RID}..."
    PUBLISH_ARGS+=(
      -p:PublishAot=true
      -p:StripSymbols=true
      -p:SuppressAotAnalysisWarnings=true
    )
  else
    echo "==> NativeAOT disabled for ${RID}; using trimmed self-contained publish..."
  fi

  DOTNET_CLI_TELEMETRY_OPTOUT=1 dotnet publish TWXD/TWXD.csproj \
      "${PUBLISH_ARGS[@]}" \
      2>&1 | grep -v "^$"

  if [[ "${RID}" == win-* ]]; then
    BIN_NAME="twxd.exe"
  else
    BIN_NAME="twxd"
  fi

  BIN_DIR="TWXD/bin/Release/net10.0/${RID}/publish"
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

if [[ -n "${HOST_RID}" && "${INSTALL_AFTER_BUILD}" != "0" ]]; then
  HOST_DEST="${BIN_ROOT}/${HOST_RID}/twxd"
  if [[ -f "${HOST_DEST}" ]]; then
    echo "==> Installing ${HOST_RID} standalone to ${INSTALL_PATH}..."
    install_local_artifact "${HOST_DEST}"
    ls -lh "${INSTALL_PATH}" | awk '{print "==> Installed: " $5, $6, $7, $8, $9}'
  fi
fi
