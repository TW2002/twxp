# MTC Update Strategy

## Current choice

MTC uses a small JSON manifest to check for updates by maturity lane and cadence, then opens the correct platform installer download. This keeps the first update path simple, cross-platform, and compatible with the existing SourceForge package release flow.

The manifest can be hosted on SourceForge or GitHub Releases. SourceForge remains the current download location, while GitHub Releases can be added later as a metadata mirror or primary manifest host without changing MTC's client-side updater model.

The easiest user-facing default remains signed/notarized installers per platform. Portable/standalone binaries are useful for interim tester drops, but they should be treated as a secondary asset type because they do not integrate as cleanly with macOS Gatekeeper, Windows installer trust, Linux package managers, or Start Menu/Application registration.

## Why this instead of a full self-updater now

- Sparkle is mature and excellent on macOS, but it is macOS-only and would not cover Windows or Linux.
- NetSparkleUpdater is cross-platform and proven for .NET desktop apps, but adds a larger updater surface than MTC currently needs.
- Velopack is the best candidate if MTC later needs full in-app install/replace behavior across desktop platforms, especially for Windows/macOS package-style releases.
- Package-manager-first Linux updates are still more natural for `.deb` and `.rpm` users than a GUI app replacing itself.

## Operational model

- `Source/mtc-updates.example.json` is the source template for the published manifest.
- `Source/build-sourceforge-bundles.sh` copies it to `bin/mtc-updates.json` during packaging.
- `Source/publish-sourceforge-bundles.sh` uploads the installer packages and `mtc-updates.json`.
- MTC preferences control update checks globally: enabled state, lane, cadence, and manifest URL.
- The About menu exposes a manual `Update MTC...` check.
- Startup checks show a banner only when an update is available.

## GitHub Releases option

GitHub Releases can support the same updater flow by attaching `mtc-updates.json` and the platform packages to a release, then pointing the MTC manifest URL preference at that release asset or a stable raw URL. This is a good future default if release notes, immutable version history, GitHub API automation, and broader discovery become more important than keeping SourceForge as the single release surface.

## Lanes

- `stable`: conservative release channel.
- `beta`: current default for beta testers.
- `dev`: fast-moving test channel when we want to expose interim builds.

## Platform asset keys

- `osx-arm64`: Apple Silicon `.pkg`.
- `osx-x64`: Intel macOS `.pkg`.
- `win-x64`: Windows `.msi`.
- `linux-x64`: Debian/Ubuntu-style `.deb`.
- `linux-rpm-x64`: Fedora/RHEL/SUSE-style `.rpm`.
