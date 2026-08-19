#!/usr/bin/env bash
# build-linux-packages.sh — build Linux .deb and .rpm installers for TWX30.
set -euo pipefail
export COPYFILE_DISABLE=1
export COPY_EXTENDED_ATTRIBUTES_DISABLE=1

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BIN_ROOT="${REPO_ROOT}/bin"
MOMBOT_RELEASE_SOURCE="${MOMBOT_RELEASE_SOURCE:-/Users/mosleym/tw2002/mombot/mombot5.0/Release/mombot}"
RID="${RID:-linux-x64}"
VERSION="${VERSION:-$(date +%Y.%m.%d.%H%M)}"
DEB_ARCH="${DEB_ARCH:-amd64}"
RPM_ARCH="${RPM_ARCH:-x86_64}"
OUTPUT_DIR="${BIN_ROOT}"

if [[ "${1:-}" == "--help" ]]; then
  cat <<'EOF'
Usage: ./build-linux-packages.sh

Builds Linux installer packages from TWX30/bin/linux-x64:
  - TWX30/bin/twx30-linux-x64.deb
  - TWX30/bin/twx30-linux-x64.rpm

The twx30 package installs every component:
  - Mayhem Tradewars Client
  - Tradewars Proxy
  - twxc and twxd
  - bundled Mombot scripts copied into <programdir>/scripts/mombot

Set MOMBOT_RELEASE_SOURCE to override the Mombot release tree used for the
scripts payload.
EOF
  exit 0
elif [[ $# -gt 0 ]]; then
  echo "Unknown option: $1" >&2
  exit 1
fi

require_file() {
  local path="$1"
  if [[ ! -f "$path" ]]; then
    echo "Missing file: $path" >&2
    exit 1
  fi
}

require_dir() {
  local path="$1"
  if [[ ! -d "$path" ]]; then
    echo "Missing directory: $path" >&2
    exit 1
  fi
}

require_executable() {
  local path="$1"
  if [[ ! -x "$path" ]]; then
    echo "Missing executable: $path" >&2
    echo "Build Linux standalone binaries first, for example:" >&2
    echo "  RID_LIST=linux-x64 ./build-sourceforge-bundles.sh" >&2
    exit 1
  fi
}

copy_tree_clean() {
  local src="$1"
  local dest="$2"

  mkdir -p "$dest"
  (
    cd "$src"
    tar --exclude='.DS_Store' --exclude='._*' --exclude='.git' -cf - .
  ) | (
    cd "$dest"
    tar -xf -
  )
}

copy_png_icon() {
  local source_image="$1"
  local output_image="$2"

  mkdir -p "$(dirname "$output_image")"
  if command -v sips >/dev/null 2>&1; then
    sips -z 256 256 "$source_image" --out "$output_image" >/dev/null
  else
    cp "$source_image" "$output_image"
  fi
}

stage_mtc() {
  local root_dir="$1"

  mkdir -p \
    "${root_dir}/opt/twx30" \
    "${root_dir}/usr/bin" \
    "${root_dir}/usr/share/applications" \
    "${root_dir}/usr/share/icons/hicolor/256x256/apps"

  install -m 755 "${BIN_ROOT}/${RID}/MTC" "${root_dir}/opt/twx30/MTC"
  ln -s /opt/twx30/MTC "${root_dir}/usr/bin/mtc"
  copy_png_icon "${SCRIPT_DIR}/MTC/mtc2.png" "${root_dir}/usr/share/icons/hicolor/256x256/apps/mtc.png"

  cat >"${root_dir}/usr/share/applications/mtc.desktop" <<'EOF'
[Desktop Entry]
Type=Application
Name=Mayhem Tradewars Client
Comment=TradeWars 2002 client with embedded TWX proxy support
Exec=/opt/twx30/MTC
Icon=mtc
Terminal=false
Categories=Game;Network;
StartupNotify=true
EOF
}

stage_twxp() {
  local root_dir="$1"

  mkdir -p \
    "${root_dir}/opt/twx30" \
    "${root_dir}/usr/bin" \
    "${root_dir}/usr/share/applications" \
    "${root_dir}/usr/share/icons/hicolor/scalable/apps"

  install -m 755 "${BIN_ROOT}/${RID}/twxp" "${root_dir}/opt/twx30/twxp"
  ln -s /opt/twx30/twxp "${root_dir}/usr/bin/twxp"
  cp "${SCRIPT_DIR}/TWXP/Resources/AppIcon/appicon.svg" \
    "${root_dir}/usr/share/icons/hicolor/scalable/apps/twxp.svg"

  cat >"${root_dir}/usr/share/applications/twxp.desktop" <<'EOF'
[Desktop Entry]
Type=Application
Name=Tradewars Proxy
Comment=Standalone TWX proxy for TradeWars 2002
Exec=/opt/twx30/twxp
Icon=twxp
Terminal=false
Categories=Game;Network;
StartupNotify=true
EOF
}

stage_tools() {
  local root_dir="$1"

  mkdir -p "${root_dir}/opt/twx30" "${root_dir}/usr/bin"
  install -m 755 "${BIN_ROOT}/${RID}/twxc" "${root_dir}/opt/twx30/twxc"
  install -m 755 "${BIN_ROOT}/${RID}/twxd" "${root_dir}/opt/twx30/twxd"
  ln -s /opt/twx30/twxc "${root_dir}/usr/bin/twxc"
  ln -s /opt/twx30/twxd "${root_dir}/usr/bin/twxd"
}

stage_scripts() {
  local root_dir="$1"

  copy_tree_clean "$MOMBOT_RELEASE_SOURCE" "${root_dir}/opt/twx30/scripts/mombot"
}

stage_doc() {
  local root_dir="$1"
  local package_name="$2"
  local summary="$3"

  mkdir -p "${root_dir}/usr/share/doc/${package_name}"
  cat >"${root_dir}/usr/share/doc/${package_name}/README" <<EOF
TWX30 ${VERSION}

${summary}

Default user program directory:
  ~/twxproxy

Bundled Mombot scripts, when this package includes them, are staged in:
  /opt/twx30/scripts/mombot

During package installation, scripts are also copied into:
  <programdir>/scripts/mombot

The installer resolves <programdir> from TWX30_PROGRAMDIR, then the invoking
sudo user, then the current login user. If no user home can be resolved, the
staged /opt/twx30/scripts copy remains available.
EOF
}

stage_payload() {
  local root_dir="$1"
  local variant="$2"
  local package_name="$3"
  local summary="$4"

  case "$variant" in
    all)
      stage_mtc "$root_dir"
      stage_twxp "$root_dir"
      stage_tools "$root_dir"
      stage_scripts "$root_dir"
      ;;
    mtc)
      stage_mtc "$root_dir"
      ;;
    twxp)
      stage_twxp "$root_dir"
      ;;
    tools)
      stage_tools "$root_dir"
      ;;
    scripts)
      stage_scripts "$root_dir"
      ;;
    *)
      echo "Unknown Linux package variant: $variant" >&2
      exit 1
      ;;
  esac

  stage_doc "$root_dir" "$package_name" "$summary"
  find "$root_dir" -name '._*' -delete
  xattr -cr "$root_dir" 2>/dev/null || true
}

package_depends_deb() {
  case "$1" in
    all) printf '%s' "libc6 (>= 2.17), libx11-6, libxrandr2, libxinerama1, libxcursor1, libxi6, libfontconfig1, libice6, libsm6, zlib1g" ;;
    mtc|twxp) printf '%s' "libc6 (>= 2.17), libx11-6, libxrandr2, libxinerama1, libxcursor1, libxi6, libfontconfig1, libice6, libsm6, zlib1g" ;;
    tools) printf '%s' "libc6 (>= 2.17), zlib1g" ;;
    scripts) printf '%s' "" ;;
  esac
}

package_depends_rpm() {
  case "$1" in
    all) printf '%s\n' glibc libX11 libXrandr libXinerama libXcursor libXi fontconfig libICE libSM zlib ;;
    mtc|twxp) printf '%s\n' glibc libX11 libXrandr libXinerama libXcursor libXi fontconfig libICE libSM zlib ;;
    tools) printf '%s\n' glibc zlib ;;
    scripts) ;;
  esac
}

write_package_scripts() {
  local scripts_dir="$1"

  cat >"${scripts_dir}/postinst" <<'EOF'
#!/bin/sh
set -e

find_user_home() {
  if [ -n "${SUDO_USER:-}" ] && [ "${SUDO_USER:-}" != "root" ]; then
    getent passwd "$SUDO_USER" 2>/dev/null | cut -d: -f6
    return
  fi

  login_user="$(logname 2>/dev/null || true)"
  if [ -n "$login_user" ] && [ "$login_user" != "root" ]; then
    getent passwd "$login_user" 2>/dev/null | cut -d: -f6
    return
  fi

  printf '%s\n' ""
}

find_user_name() {
  if [ -n "${SUDO_USER:-}" ] && [ "${SUDO_USER:-}" != "root" ]; then
    printf '%s\n' "$SUDO_USER"
    return
  fi

  login_user="$(logname 2>/dev/null || true)"
  if [ -n "$login_user" ] && [ "$login_user" != "root" ]; then
    printf '%s\n' "$login_user"
    return
  fi

  printf '%s\n' ""
}

home_dir="$(find_user_home)"
user_name="$(find_user_name)"
program_dir="${TWX30_PROGRAMDIR:-}"

if [ -z "$program_dir" ] && [ -n "$home_dir" ]; then
  locator_dir="${home_dir}/.local/share/twxproxy"
  locator_file="${locator_dir}/programdir.txt"
  if [ -f "$locator_file" ]; then
    program_dir="$(head -n 1 "$locator_file" | sed 's/[[:space:]]*$//')"
  fi

  if [ -z "$program_dir" ]; then
    program_dir="${home_dir}/twxproxy"
  fi
fi

if [ -n "$program_dir" ]; then
  scripts_dir="${program_dir%/}/scripts"
  games_dir="${program_dir%/}/games"
  logs_dir="${program_dir%/}/logs"
  modules_dir="${program_dir%/}/modules"
  bin_dir="${program_dir%/}/bin"
  mkdir -p "$scripts_dir" "$games_dir" "$logs_dir" "$modules_dir" "$bin_dir"

  if [ -d /opt/twx30/scripts ]; then
    cp -R /opt/twx30/scripts/. "$scripts_dir"/
  fi

  config_file="${program_dir%/}/config.twx"
  if [ ! -f "$config_file" ]; then
    cat >"$config_file" <<CONFIG
<?xml version="1.0" encoding="utf-8"?>
<TwxProxyConfig>
  <SharedPaths>
    <ProgramDirectory>${program_dir%/}</ProgramDirectory>
    <ScriptsDirectory>${scripts_dir}</ScriptsDirectory>
  </SharedPaths>
</TwxProxyConfig>
CONFIG
  fi

  if [ -n "$home_dir" ]; then
    locator_dir="${home_dir}/.local/share/twxproxy"
    locator_file="${locator_dir}/programdir.txt"
    mkdir -p "$locator_dir"
    if [ ! -f "$locator_file" ]; then
      printf '%s\n' "${program_dir%/}" >"$locator_file"
    fi
  fi

  if [ -n "$user_name" ]; then
    chown -R "$user_name" "${program_dir%/}" 2>/dev/null || true
    if [ -n "$home_dir" ]; then
      chown -R "$user_name" "${home_dir}/.local/share/twxproxy" 2>/dev/null || true
    fi
  fi
fi

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database /usr/share/applications >/dev/null 2>&1 || true
fi
if command -v gtk-update-icon-cache >/dev/null 2>&1; then
  gtk-update-icon-cache -q /usr/share/icons/hicolor >/dev/null 2>&1 || true
fi
exit 0
EOF

  cat >"${scripts_dir}/postrm" <<'EOF'
#!/bin/sh
set -e
if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database /usr/share/applications >/dev/null 2>&1 || true
fi
if command -v gtk-update-icon-cache >/dev/null 2>&1; then
  gtk-update-icon-cache -q /usr/share/icons/hicolor >/dev/null 2>&1 || true
fi
exit 0
EOF

  chmod 755 "${scripts_dir}/postinst" "${scripts_dir}/postrm"
}

write_md5sums() {
  local root_dir="$1"
  local output_path="$2"

  (
    cd "$root_dir"
    find . -type f -print | sort | while IFS= read -r file_path; do
      if command -v md5sum >/dev/null 2>&1; then
        hash="$(md5sum "$file_path" | awk '{print $1}')"
      else
        hash="$(md5 -q "$file_path")"
      fi
      clean_path="${file_path#./}"
      printf '%s  %s\n' "$hash" "$clean_path"
    done >"$output_path"
  )
}

build_deb_package() {
  local work_dir="$1"
  local variant="$2"
  local package_name="$3"
  local output_stem="$4"
  local summary="$5"
  local root_dir="${work_dir}/${package_name}-deb-root"
  local debian_dir="${work_dir}/${package_name}-debian"
  local output_path="${OUTPUT_DIR}/${output_stem}.deb"

  mkdir -p "$root_dir" "$debian_dir"
  stage_payload "$root_dir" "$variant" "$package_name" "$summary"

  local installed_size
  installed_size="$(du -sk "$root_dir" | awk '{print $1}')"

  local depends
  depends="$(package_depends_deb "$variant")"

  cat >"${debian_dir}/control" <<EOF
Package: ${package_name}
Version: ${VERSION}
Section: games
Priority: optional
Architecture: ${DEB_ARCH}
Maintainer: TWX30 <noreply@twx30.local>
Installed-Size: ${installed_size}
Homepage: https://sourceforge.net/projects/twx30/
Description: ${summary}
EOF

  if [[ -n "$depends" ]]; then
    awk -v depends="$depends" '
      /^Installed-Size:/ && !done { print "Depends: " depends; done = 1 }
      { print }
    ' "${debian_dir}/control" >"${debian_dir}/control.tmp"
    mv "${debian_dir}/control.tmp" "${debian_dir}/control"
  fi

  write_package_scripts "$debian_dir"
  write_md5sums "$root_dir" "${debian_dir}/md5sums"

  local package_work_dir="${work_dir}/${package_name}-deb-build"
  rm -rf "$package_work_dir"
  mkdir -p "$package_work_dir"
  rm -f "$output_path"
  printf '2.0\n' >"${package_work_dir}/debian-binary"
  (
    cd "$debian_dir"
    /usr/bin/tar --format gnutar --uid 0 --gid 0 --uname root --gname root \
      -czf "${package_work_dir}/control.tar.gz" .
  )
  (
    cd "$root_dir"
    /usr/bin/tar --format gnutar --uid 0 --gid 0 --uname root --gname root \
      -czf "${package_work_dir}/data.tar.gz" .
  )
  (
    cd "$package_work_dir"
    /usr/bin/ar -q "$output_path" debian-binary control.tar.gz data.tar.gz >/dev/null
  )

  echo "==> Done DEB ${package_name}: $(ls -lh "$output_path" | awk '{print $5, $6, $7, $8, $9}')"
}

find_fpm() {
  local fpm_bin="${FPM_BIN:-}"

  if [[ -z "$fpm_bin" ]]; then
    fpm_bin="$(command -v fpm || true)"
  fi
  if [[ -z "$fpm_bin" ]]; then
    for candidate in "$HOME"/.gem/ruby/*/bin/fpm; do
      if [[ -x "$candidate" ]]; then
        fpm_bin="$candidate"
        break
      fi
    done
  fi
  if [[ -z "$fpm_bin" || ! -x "$fpm_bin" ]]; then
    echo "Ruby fpm is required for RPM output on this host." >&2
    echo "Install it with: gem install --user-install fpm --no-document" >&2
    exit 1
  fi

  printf '%s\n' "$fpm_bin"
}

build_rpm_package() {
  local work_dir="$1"
  local variant="$2"
  local package_name="$3"
  local output_stem="$4"
  local summary="$5"
  local fpm_bin="$6"
  local root_dir="${work_dir}/${package_name}-rpm-root"
  local scripts_dir="${work_dir}/${package_name}-rpm-scripts"
  local output_path="${OUTPUT_DIR}/${output_stem}.rpm"

  mkdir -p "$root_dir" "$scripts_dir"
  stage_payload "$root_dir" "$variant" "$package_name" "$summary"
  write_package_scripts "$scripts_dir"

  local depends_args=()
  while IFS= read -r dep; do
    if [[ -n "$dep" ]]; then
      depends_args+=(--depends "$dep")
    fi
  done < <(package_depends_rpm "$variant")

  rm -f "$output_path"
  (
    cd "$root_dir"
    "$fpm_bin" \
      -s dir \
      -t rpm \
      -n "$package_name" \
      -v "$VERSION" \
      --iteration 1 \
      -a "$RPM_ARCH" \
      --rpm-os linux \
      --license "Proprietary" \
      --url "https://sourceforge.net/projects/twx30/" \
      --maintainer "TWX30 <noreply@twx30.local>" \
      --description "$summary" \
      --category "Applications/Games" \
      ${depends_args[@]+"${depends_args[@]}"} \
      --after-install "${scripts_dir}/postinst" \
      --after-remove "${scripts_dir}/postrm" \
      -p "$output_path" \
      . >/dev/null
  )
  echo "==> Done RPM ${package_name}: $(ls -lh "$output_path" | awk '{print $5, $6, $7, $8, $9}')"
}

build_package_pair() {
  local work_dir="$1"
  local variant="$2"
  local package_name="$3"
  local output_stem="$4"
  local summary="$5"
  local fpm_bin="$6"

  build_deb_package "$work_dir" "$variant" "$package_name" "$output_stem" "$summary"
  build_rpm_package "$work_dir" "$variant" "$package_name" "$output_stem" "$summary" "$fpm_bin"
}

require_executable "${BIN_ROOT}/${RID}/MTC"
require_executable "${BIN_ROOT}/${RID}/twxp"
require_executable "${BIN_ROOT}/${RID}/twxc"
require_executable "${BIN_ROOT}/${RID}/twxd"
require_file "${SCRIPT_DIR}/MTC/mtc2.png"
require_file "${SCRIPT_DIR}/TWXP/Resources/AppIcon/appicon.svg"
require_dir "$MOMBOT_RELEASE_SOURCE"

work_dir="$(mktemp -d "/tmp/twx30-linux-packages-XXXXXX")"
trap 'rm -rf "$work_dir"' EXIT
fpm_bin="$(find_fpm)"

echo "==> Building Linux packages for ${RID}..."
rm -f \
  "${OUTPUT_DIR}/twx30-mtc-${RID}.deb" \
  "${OUTPUT_DIR}/twx30-mtc-${RID}.rpm" \
  "${OUTPUT_DIR}/twx30-twxp-${RID}.deb" \
  "${OUTPUT_DIR}/twx30-twxp-${RID}.rpm" \
  "${OUTPUT_DIR}/twx30-tools-${RID}.deb" \
  "${OUTPUT_DIR}/twx30-tools-${RID}.rpm" \
  "${OUTPUT_DIR}/twx30-scripts-${RID}.deb" \
  "${OUTPUT_DIR}/twx30-scripts-${RID}.rpm"
build_package_pair "$work_dir" all twx30 "twx30-${RID}" \
  "TWX30 TradeWars client, proxy, compiler tools, and bundled Mombot scripts." "$fpm_bin"
