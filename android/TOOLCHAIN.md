# Setting up the build toolchain

Bubblewrap's own installer does not work on Windows, and the failure is quiet
rather than loud. This is what it does, and what to do instead.

## What goes wrong if you let Bubblewrap install the JDK

Answer "yes" to *Do you want Bubblewrap to install the JDK* and it fetches
`OpenJDK17U-jdk_x86-32_windows_hotspot_17.0.11_9.zip` — the **32-bit** build —
and what lands in `~/.bubblewrap/jdk` is the JDK **source tree**: `configure`,
`make`, `src`, `test`, and no `bin/` at all. No `java`, no `keytool`. It then
re-downloads on the next run without noticing, which is why the folder grows to
hundreds of megabytes while never becoming usable.

Delete `~/.bubblewrap/jdk` and install the JDK yourself.

## What works

**1. A real 64-bit JDK 17**

```bash
curl -sSL -o jdk17.zip \
  "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.11%2B9/OpenJDK17U-jdk_x64_windows_hotspot_17.0.11_9.zip"
unzip -q jdk17.zip && mv "jdk-17.0.11+9" jdk17
```

The `+` in the extracted name is worth renaming away before anything else has to
quote it. Check it is a real JDK — `jdk17/bin/keytool.exe` must exist.

**2. Android command-line tools, in two places at once**

```bash
curl -sSL -o cmdline-tools.zip \
  "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
```

`sdkmanager` wants the modern layout, `<sdk>/cmdline-tools/latest/bin`.
Bubblewrap wants the *old* one: `AndroidSdkTools.validatePath` checks only for
`<sdk>/tools` or `<sdk>/bin` and rejects the SDK outright if neither is there —
reporting `androidSdkPath isn't correct` with no hint that the layout is the
issue. So put the tools in both places:

```bash
mkdir -p sdk/cmdline-tools/latest
# unzip into sdk/cmdline-tools/latest, then:
cp -r sdk/cmdline-tools/latest/bin sdk/bin
cp -r sdk/cmdline-tools/latest/lib sdk/lib
```

**3. SDK packages and licences**

```bash
yes | sdk/cmdline-tools/latest/bin/sdkmanager.bat --licenses
yes | sdk/cmdline-tools/latest/bin/sdkmanager.bat platform-tools platforms;android-35 build-tools;34.0.0
```

**4. Point Bubblewrap at both**

`~/.bubblewrap/config.json` is JSON, so Windows paths need **escaped**
backslashes. Writing it with a heredoc produces `"C:\Users\..."`, where `\U` is
an invalid escape, and Bubblewrap dies with `Bad escaped character in JSON at
position 15` — which reads like a bug in Bubblewrap rather than in the file:

```json
{"jdkPath":"C:\\Users\\you\\android-tools\\jdk17","androidSdkPath":"C:\\Users\\you\\android-tools\\sdk"}
```

Confirm with `bubblewrap doctor`; it should say both paths are valid.

## Building without prompts

`bubblewrap init` is interactive, but the project can be generated from the
`twa-manifest.json` already in this folder, which asks nothing:

```bash
bubblewrap update --skipVersionUpgrade
```

Then build, passing the keystore passwords through the environment rather than
answering prompts:

```bash
BUBBLEWRAP_KEYSTORE_PASSWORD=android BUBBLEWRAP_KEY_PASSWORD=android \
  bubblewrap build --skipPwaValidation
```

## About `android-test.keystore`

It is a **throwaway for sideloading only**, with the password `android` — the
same one Android's own debug keystore has used for years. It is not a secret and
it is git-ignored anyway.

Do not publish anything signed with it. A Play release needs its own key, and
under Play App Signing the fingerprint that goes in `assetlinks.json` is
Google's, not this one. See README.md.
