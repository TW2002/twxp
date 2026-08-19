#!/usr/bin/env bash
# build-mtc-win64.sh — clean publish MTC for win-x64
# Run this after any code change to get a fresh standalone Windows build in TWX30/bin/win-x64.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BIN_ROOT="${REPO_ROOT}/bin"

cd "${SCRIPT_DIR}"

"${SCRIPT_DIR}/stamp-mtc-build.sh"

echo "==> Cleaning..."
rm -rf bin obj MTC/bin MTC/obj

echo "==> Publishing..."
AVALONIA_TELEMETRY_OPTOUT=1 dotnet publish MTC/MTC.csproj \
    -c Release \
    -r win-x64 \
    2>&1 | grep -v "^$"

BIN="MTC/bin/Release/net10.0/win-x64/publish/MTC.exe"

# Also copy to the tracked standalone path
DEST_DIR="${BIN_ROOT}/win-x64"
DEST="$DEST_DIR/MTC.exe"
mkdir -p "$DEST_DIR"
cp "$BIN" "$DEST"

echo ""
echo "==> Done: $(ls -lh "$DEST" | awk '{print $5, $6, $7, $8, $9}')"
echo "==> Copied to: $DEST"
