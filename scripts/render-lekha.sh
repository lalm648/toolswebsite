#!/usr/bin/env bash
#
# Re-render Brahui clips with Lekha, the macOS Hindi voice.
#
# macOS only. Lekha ships with macOS and there is no equivalent on Windows or
# Linux, which is why this is a shell script beside the Node tooling rather than
# part of it. Everything else in the pipeline is cross-platform; this one step
# is not.
#
#   1.  node scripts/audio-rerender-manifest.mjs     (any machine)
#   2.  bash scripts/render-lekha.sh                 (a Mac)
#   3.  commit the new .m4a files and the bumped AUDIOREV
#
# Reads audio-rerender.json and renders each entry's `deva` string — Lekha reads
# Devanagari, not Latin and not Urdu. Files are written under the key the app
# computes, so a rendered clip lands exactly where speak() looks for it.
#
# Install the voice first if `say -v Lekha` fails:
#   System Settings -> Accessibility -> Spoken Content -> System Voice ->
#   Manage Voices -> Hindi -> Lekha
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MANIFEST="$ROOT/audio-rerender.json"
AUDIO="$ROOT/public/brahui/audio"
HTML="$ROOT/public/brahui/index.html"

# Matches the existing library. "calm" in AUDIOREV is this rate: the clips are
# pronunciation models, so they are read slower than conversational speed.
RATE="${LEKHA_RATE:-150}"

[ -f "$MANIFEST" ] || { echo "no $MANIFEST — run node scripts/audio-rerender-manifest.mjs first" >&2; exit 1; }
command -v say >/dev/null || { echo "no 'say' — this script is macOS only" >&2; exit 1; }
say -v Lekha -o /dev/null "परीक्षा" 2>/dev/null || { echo "the Lekha voice is not installed — see the header" >&2; exit 1; }

mkdir -p "$AUDIO"
count=0

# -r is a raw read of each line so Devanagari and quotes survive untouched.
while IFS=$'\t' read -r key deva; do
  [ -n "$key" ] || continue
  out="$AUDIO/$key.m4a"
  # say picks the container from the extension; m4a gives AAC, which is what the
  # existing 6,646 clips are.
  say -v Lekha -r "$RATE" -o "$out" "$deva"
  count=$((count + 1))
  printf '  %-18s %s\n' "$key" "$deva"
done < <(node -e '
  const m = require("'"$MANIFEST"'");
  for (const e of m.entries) process.stdout.write(e.key + "\t" + e.deva + "\n");
')

echo
echo "rendered $count clips into public/brahui/audio"

# A replaced clip keeps its key, so a browser holding the old pronunciation in
# cache would go on playing it. AUDIOREV is the cache buster; bump it or the
# fix does not reach anyone who has already used the app.
STAMP="$(date +%Y%m%d)-lekha-r1"
if grep -q "const AUDIOREV='" "$HTML"; then
  sed -i '' "s/const AUDIOREV='[^']*';/const AUDIOREV='$STAMP';/" "$HTML"
  echo "AUDIOREV bumped to $STAMP"
else
  echo "WARNING: could not find AUDIOREV in index.html — bump it by hand" >&2
fi

echo
echo "Listen to a few before committing. The five replacements are the ones that"
echo "said \"doctor\"; dá should now be dental दा."
