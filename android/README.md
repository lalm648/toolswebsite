# Brahui Dictionary on Android

The app is a Trusted Web Activity: a thin Android wrapper around the web app
already at `public/brahui/`. There is no second codebase. What ships to Play is
the same document, worker and icons this repo builds, and a fix deployed to the
web is live in the installed app without a Play release.

This file is the whole route, in order. Steps 1 and 2 need no Android tooling at
all.

---

## 1. Test it on your phone today — no build

Fastest way to hold it in your hand, and worth doing before anything Android.

1. Deploy this branch, so `https://www.webutilia.com/brahui/manifest.webmanifest`
   returns 200. Until then nothing below works — Bubblewrap reads that URL.
2. On the phone, open `https://www.webutilia.com/brahui/index.html` in Chrome.
3. Menu → **Add to Home screen** → **Install**.

It installs with the ب icon, opens with no address bar, and works in aeroplane
mode. That is the same app Play will carry — the wrapper adds a Play listing,
not features.

Verify the deploy first:

```bash
curl -sI https://www.webutilia.com/brahui/manifest.webmanifest | head -1
```

---

## 2. Understand the signing choice before you make it

This is the one decision that is awkward to undo, so it is worth a minute.

Every Android app is signed with a key. Android will not install an update
signed with a different key than the version already on the device — that is how
it knows the update is from you. **Lose the key and you cannot update your own
app; you have to publish a new listing and leave your users behind.**

There are two arrangements:

- **Play App Signing** — Google holds the release key. You sign with an *upload*
  key, Google verifies it, strips it, and re-signs with the real one. If you lose
  your upload key, support resets it and your app survives. This is the default
  for new apps and the right choice for a first app.
- **Self-managed** — you hold the release key. No safety net.

Take Play App Signing. The consequence is the one thing people trip on:

> The fingerprint that goes in `assetlinks.json` is **Google's**, not the one on
> your machine. You can only read it after creating the app in Play Console and
> uploading a first bundle.

Until then Chrome cannot verify the link and shows its address bar across the top
of the app. That is not a bug — it means the app is not yet proven to belong to
the domain. To keep testing smooth, we list **both** fingerprints, so
sideloaded test builds verify too.

---

## 3. Make your upload key

**Run this yourself** — it asks for a password, and that password is yours. Do not
paste it into a chat, this file, or any script.

```bash
keytool -genkeypair -v -keystore android/android-upload.keystore -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

`keytool` ships with the JDK. Bubblewrap downloads a JDK into `~/.bubblewrap`, so
if the command is not found use the one there.

Back the `.keystore` file up somewhere that is not this repo — it is
**git-ignored on purpose**. Losing it is the failure mode described above.

Then read its fingerprint. The fingerprint is *not* a secret; it is published in
`assetlinks.json` by design:

```bash
keytool -list -v -keystore android/android-upload.keystore -alias upload | grep SHA256
```

---

## 4. Build

`twa-manifest.json` here is already filled in — package id, host, start URL,
colours, icons, shortcuts. Bubblewrap reads it, so `init` has nothing to ask.

```bash
cd android
bubblewrap build          # produces app-release-bundle.aab and app-release-signed.apk
```

To put it on the phone over USB, with developer options and USB debugging on:

```bash
adb install -r app-release-signed.apk
```

Bump `appVersionCode` (an integer, +1 every upload) and `appVersionName` in
`twa-manifest.json` for each new Play upload. Play rejects a repeated version
code.

---

## 5. Write and verify assetlinks

Once you have the fingerprints:

```bash
node scripts/make-assetlinks.mjs com.webutilia.brahuidictionary <UPLOAD_SHA256> <PLAY_SHA256>
```

Deploy, then check it the way Android reads it — no redirects, `application/json`,
exact fingerprint match:

```bash
node scripts/check-assetlinks.mjs com.webutilia.brahuidictionary
```

The address bar disappears once this passes and the app is reinstalled. Chrome
caches the verdict, so uninstall and reinstall rather than waiting.

---

## Notes

- **Host is `www.webutilia.com`.** The apex 308-redirects to www, and Android
  follows no redirects for assetlinks, so the file must be served from www.
- **Audio is not bundled.** 6,646 recordings, 113 MB, cached on play and trimmed
  past 600 files. A first launch with no network has the full dictionary but no
  audio. If you later want them offline from the start, that is a decision about
  APK size, not a bug.
- **Updating the web app updates the installed app.** Bump `VERSION` in
  `public/brahui/sw.js` when the shell changes, or installed copies keep serving
  the old cache.
