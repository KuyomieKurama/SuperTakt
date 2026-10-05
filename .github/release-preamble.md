SuperTakt manages todos, tracks time and produces export files for billing.
All data stays on the computer it runs on.

## Which file for which system

| File | System | Notes |
|---|---|---|
| `SuperTakt_<version>_x64-setup.exe` | Windows 10/11, 64-bit | Installs into the user profile, no administrator account needed |
| `SuperTakt_<version>_aarch64.dmg` | macOS on Apple Silicon (M1 and newer) | **Not** for Macs with an Intel processor |
| `SuperTakt_<version>_amd64.deb` | Debian, Ubuntu and relatives, 64-bit | Built on Ubuntu 24.04, requires glibc 2.39 or newer |
| `SuperTakt_<version>_amd64.AppImage` | Linux without a package manager, 64-bit | Make it executable and run it, no installation; same glibc requirement |

There is **no** file for Macs with an Intel processor in this release. This is
not an oversight but an open gap: it has never been built or tested.

## These files are not signed

This is the most important sentence of this description, which is why it is
near the top.

A signing certificate costs money and requires an application. Until that is
decided, the files are released unsigned. Both operating systems therefore stop
them on first launch, not because anything is wrong with them, but because they
carry **no** proof of origin that the system could check.

**Windows.** Launching the `.exe` shows "Windows protected your PC". Choose
"More info", then "Run anyway". Without that click the installer does not start.

**macOS.** On first launch the system says the application is from an
unverified developer and offers only "Move to Trash". Go to
*System Settings → Privacy & Security*; after the failed attempt there is an
"Open Anyway" button. Right-clicking the app icon is no longer enough since
macOS 15.

If you prefer the command line:

```
xattr -dr com.apple.quarantine /Applications/SuperTakt.app
```

**Linux.** No warning. The `.AppImage` has to be made executable:

```
chmod +x SuperTakt_<version>_amd64.AppImage
```

## Verify the downloaded file

The SHA-256 checksums of all files are further down in this description.
They were produced during the build, not entered by hand afterwards.

```
# Linux and macOS
sha256sum SuperTakt_<version>_amd64.deb
shasum -a 256 SuperTakt_<version>_aarch64.dmg

# Windows (PowerShell)
Get-FileHash .\SuperTakt_<version>_x64-setup.exe -Algorithm SHA256
```

If a value differs, the file was downloaded incompletely or has been modified.
In both cases: do not run it.

## Licenses

SuperTakt itself is released under the MIT License.

Every package contains `THIRD-PARTY-LICENSES.txt`, the license texts of all
bundled third-party components, including the embedded Node runtime, the window
layer under Apache-2.0 and one component under MPL-2.0 with the corresponding
notice about source code availability. The same file is also attached to this
release, one per platform: the dependency tree differs between Windows, macOS
and Linux, and so does the list.

## What is still open

- **No signature**, see above.
- **No Intel Mac.**
- **No Linux with an older glibc.** The Linux files are built on Ubuntu 24.04
  and require glibc 2.39. They do not start on Ubuntu 22.04 or Debian 12.
- **The Outlook add-in** is shipped with the app but has not been tested on a
  real Windows machine with Outlook.
- **Automatic updates** do not exist. A new version is downloaded and installed
  by hand.
