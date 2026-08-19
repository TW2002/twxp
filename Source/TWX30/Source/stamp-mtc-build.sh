#!/usr/bin/env bash
# stamp-mtc-build.sh - update MTC's generated build number before publishing.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VERSION_FILE="${SCRIPT_DIR}/MTC/MtcVersion.cs"
BUILD_INFO_FILE="${SCRIPT_DIR}/MTC/MtcBuildInfo.cs"

PACKAGE_VERSION="$(
  sed -n 's/.*PackageVersion = "\([^"]*\)".*/\1/p' "${VERSION_FILE}" | head -n 1
)"

if [[ -z "${PACKAGE_VERSION}" ]]; then
  echo "Unable to read MTC PackageVersion from ${VERSION_FILE}" >&2
  exit 1
fi

CURRENT_PACKAGE_VERSION=""
CURRENT_BUILD_NUMBER=""
if [[ -f "${BUILD_INFO_FILE}" ]]; then
  CURRENT_PACKAGE_VERSION="$(
    sed -n 's/.*PackageVersion = "\([^"]*\)".*/\1/p' "${BUILD_INFO_FILE}" | head -n 1
  )"
  CURRENT_BUILD_NUMBER="$(
    sed -n 's/.*BuildNumber = "\([^"]*\)".*/\1/p' "${BUILD_INFO_FILE}" | head -n 1
  )"
fi

if [[ "${CURRENT_PACKAGE_VERSION}" != "${PACKAGE_VERSION}" || ! "${CURRENT_BUILD_NUMBER}" =~ ^[0-9]{4}$ ]]; then
  NEXT_BUILD_NUMBER=100
else
  NEXT_BUILD_NUMBER=$((10#${CURRENT_BUILD_NUMBER} + 1))
fi

if (( NEXT_BUILD_NUMBER > 9999 )); then
  echo "MTC build number overflow for ${PACKAGE_VERSION}" >&2
  exit 1
fi

FORMATTED_BUILD_NUMBER="$(printf '%04d' "${NEXT_BUILD_NUMBER}")"
TMP_FILE="${BUILD_INFO_FILE}.tmp.$$"

cat >"${TMP_FILE}" <<EOF
namespace MTC;

internal static class MtcBuildInfo
{
    public const string PackageVersion = "${PACKAGE_VERSION}";
    public const string BuildNumber = "${FORMATTED_BUILD_NUMBER}";
}
EOF

mv -f "${TMP_FILE}" "${BUILD_INFO_FILE}"
echo "==> MTC build ${FORMATTED_BUILD_NUMBER} (${PACKAGE_VERSION})"
