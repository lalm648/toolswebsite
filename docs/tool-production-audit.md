# Webutilia production tool audit

Audit date: 2026-07-21

## Scope and verification

The central registry contains 67 tools across nine categories: 19 dedicated tool pages and 48 statically generated extended-tool pages. Every registry entry has a unique canonical category URL, maps to a dedicated component or an extended processor, is included by sitemap generation, and receives unique tool metadata through the shared metadata builder.

Verification completed in this change:

- ESLint and strict TypeScript checks
- Optimized Next.js production build and static generation of 92 pages
- Registry/route/processor audit (`npm run audit:tools`)
- Node route-inventory tests (`npm test`)
- Rendered HTML smoke test for the homepage
- HTTP 200 smoke tests for representative audio, PDF, and network routes
- Source audit for file validation, object URL cleanup, processing state, downloads, reset paths, privacy claims, and server boundaries
- Rendered production smoke tests for the homepage, compact category template, an audio route, the web manifest, the transparent app icon, and the generated 1200×630 social card

Shared results now expose type-specific evidence instead of only a generic success state: decoded audio waveform/metadata, measured media size deltas, image before/after previews and dimensions, PDF page thumbnails/counts, text counts, and warnings when an output grows instead of shrinks.

“Ready” below means the implementation and route are complete for the stated browser workflow. It does not imply that every browser can encode every codec or process arbitrarily large files. “Bounded” identifies an intentional format, memory, heuristic, or external-service limit.

## Complete inventory

### Image tools (20)

| Tool | Route | Assessment |
| --- | --- | --- |
| JPG to PNG | `/tools/image/jpg-to-png` | Ready; local canvas conversion, preview, download, reset, validation, and URL cleanup. |
| PNG to JPG | `/tools/image/png-to-jpg` | Ready; local conversion with the expected loss of transparency in JPEG. |
| JPG to WebP | `/tools/image/jpg-to-webp` | Ready; browser WebP encoding with unsupported-browser feedback. |
| JPG to AVIF | `/tools/image/jpg-to-avif` | Ready, bounded; AVIF uses the lazy `@jsquash/avif` worker and device memory. |
| PNG to WebP | `/tools/image/png-to-webp` | Ready; local conversion and preview. |
| PNG to AVIF | `/tools/image/png-to-avif` | Ready, bounded; AVIF worker/browser memory constraints apply. |
| Image Compressor | `/tools/image/image-compressor` | Ready; quality control, validation, preview, size comparison, download, and reset. |
| Image Resizer | `/tools/image/image-resizer` | Ready; dimension validation, aspect handling, preview, download, and reset. |
| Rotate Image | `/tools/image/rotate-image` | Ready; local rotation with output-format controls and reset. |
| Crop Image | `/tools/image/crop-image` | Ready; keyboard-accessible controls, aspect presets, preview, export, and reset. |
| Bulk Image Resizer | `/tools/image/bulk-image-resizer` | Ready, bounded to 50 JPEG/PNG/WebP inputs, 40 MB each, and downscaling to a maximum width. |
| Image Format Converter | `/tools/image/format-converter` | Ready, bounded to JPEG/PNG/WebP input and JPEG/PNG/WebP/AVIF output. HEIC and SVG are not advertised or silently accepted. |
| Background Remover | `/tools/image/background-remover` | Heuristic; production-ready for consistent edge-connected backgrounds, not a semantic/AI subject mask. |
| Image Watermarker | `/tools/image/watermarker` | Ready, bounded; text or PNG marks use a consistent lower-right placement. |
| Metadata Stripper | `/tools/image/metadata-stripper` | Ready; re-encoding removes EXIF metadata, with the normal generational loss for JPEG. |
| Smart Image Cropper | `/tools/image/smart-image-cropper` | Heuristic; feature-energy crop, not face/object detection. Output is a 1200 px JPEG. |
| Color Palette Extractor | `/tools/image/color-palette-extractor` | Ready, bounded; quantized dominant-color estimate with copy actions. |
| GIF Maker | `/tools/image/gif-maker` | Ready, bounded; ordered frames, up to 800 px wide, per-frame palette, browser memory dependent. |
| Meme Generator | `/tools/image/meme-generator` | Ready; wrapped high-contrast captions and JPEG output. |
| Favicon Generator | `/tools/image/favicon-generator` | Ready; PNG size set plus a valid ICO inside a ZIP package. Non-image ZIP results are no longer rendered as broken image previews. |

Extended image results now include fit/1:1 before-and-after views, source/output dimensions, format, sampled transparency status, exact size change, batch downloads, and a warning when processing increases file size. Watermarks retain the source format instead of silently defaulting every output to WebP.

### Video tools (8)

| Tool | Route | Assessment |
| --- | --- | --- |
| Video Compressor | `/tools/video/video-compressor` | Ready, bounded; H.264/AAC MP4, automatic duration reading, target-size bitrate estimate, 1280 px cap. Final size is an estimate, not guaranteed. |
| Audio Extractor | `/tools/video/audio-extractor` | Ready, bounded; MP3, WAV, or M4A output through local FFmpeg WASM. |
| Video Format Transpiler | `/tools/video/video-format-transpiler` | Ready, bounded; supported inputs are transcoded to H.264/AAC MP4. Codec support depends on the bundled FFmpeg core. |
| Video Thumbnail Grabber | `/tools/video/thumbnail-grabber` | Ready; native video seek, JPEG frame export, and an actual result image preview. |
| Video Clipper | `/tools/video/video-clipper` | Ready, bounded; validates start/end time and re-encodes to MP4. |
| Video Muter | `/tools/video/video-muter` | Ready, bounded; re-encodes to H.264 MP4 for container compatibility instead of unsafe stream-copy output. |
| Video Speed Adjuster | `/tools/video/video-speed-adjuster` | Ready with limitation; supports 0.25×–4× and synchronized audio where an audio stream exists. Silent-source handling remains codec-dependent. |
| Subtitles Burner | `/tools/video/subtitles-burner` | Ready with limitation; SRT burn-in depends on subtitle-filter support in the bundled FFmpeg build and available fonts. |

All FFmpeg tools lazy-load a 31 MB local WASM engine, execute inside the FFmpeg worker, expose progress/cancellation, enforce per-file and combined memory-oriented limits, clean their virtual files after successful processing, and terminate the engine on unmount or cancellation.

Video results now add measured original/output sizes, exact size delta, duration, dimensions, codec summary, ready-to-download status, and a larger-output warning. The speed workflow retries without an audio stream when the source video is silent.

### Audio tools (5)

| Tool | Route | Assessment |
| --- | --- | --- |
| Audio Format Switcher | `/tools/audio/audio-format-switcher` | Ready, bounded; decoded waveform/player, source metadata, bitrate/sample-rate/channel controls, size estimate, and MP3/M4A/AAC/OGG/WebM/WAV/FLAC output. |
| Audio Joiner | `/tools/audio/audio-joiner` | Ready, bounded; up to 20 reorderable tracks, configurable mono/stereo and 32/44.1/48 kHz normalization, seven output formats, progress/cancel, and output playback/comparison. |
| Voice Recorder & Saver | `/tools/audio/voice-recorder` | Ready with browser limit; microphone permission is required and the MediaRecorder codec is browser-selected, normally WebM. Results include decoded waveform playback, metadata, download, and reset. |
| BPM / Tempo Detector | `/tools/audio/bpm-detector` | Heuristic; source waveform/metadata plus an energy-peak estimate with an accuracy disclaimer. It is not a studio beat-grid analyzer. |
| Volume Normalizer | `/tools/audio/volume-normalizer` | Ready for configurable peak normalization from −6 to −0.1 dBFS; produces 16-bit WAV with original/result playback and measured size comparison. It is not LUFS normalization. |

Audio result cards report original/output size, exact percentage saved or increased, output format, decoded duration, estimated bitrate, sample rate, and channels where available. Browser memory and bundled codec support remain the practical limits.

### Document tools (7)

| Tool | Route | Assessment |
| --- | --- | --- |
| PDF Merger | `/tools/document/pdf-merger` | Ready; ordered multi-file merge, progress, PDF preview, download, reset, and local processing. |
| PDF Splitter | `/tools/document/pdf-splitter` | Ready; all pages or validated selections such as `1,3-5,8`, exported as an ordered ZIP. |
| Image to PDF Builder | `/tools/document/image-to-pdf` | Ready, bounded to JPEG/PNG; preserves image aspect and page orientation. |
| PDF Text Extractor | `/tools/document/pdf-text-extractor` | Ready for PDFs with a text layer; scanned/image-only documents require OCR, which is not advertised. |
| File Word Counter | `/tools/document/file-word-counter` | Ready for text and Markdown files up to 10 MB. |
| Markdown to HTML Renderer | `/tools/document/markdown-to-html` | Ready; output is sanitized and previewed in a sandboxed iframe. |
| EPUB to PDF Converter | `/tools/document/epub-to-pdf` | Bounded conversion; preserves readable spine text but not full EPUB typography, images, CSS, links, or interactive content. |

Password-protected PDFs are not advertised. `pdf-lib`/PDF.js errors are surfaced instead of making false success claims.

PDF workflows now read page counts before processing, render bounded thumbnails for merge/split review, show split-page selection state, allow document-order changes, validate generated PDFs by reopening their bytes, and report original/output sizes and validated page counts.

### Developer and data tools (7)

| Tool | Route | Assessment |
| --- | --- | --- |
| JSON Formatter | `/tools/developer/json-formatter` | Ready; parsing, validation, formatting/minification, copy, and feedback. |
| Base64 Encoder | `/tools/developer/base64-encoder` | Ready for text encode/decode with invalid-input errors. |
| CSV to JSON Migrator | `/tools/developer/csv-to-json` | Ready for comma-delimited RFC-style quoted fields; detects unclosed quotes and over-wide rows. Other delimiters are not advertised. |
| SQL Schema Visualizer | `/tools/developer/sql-schema-visualizer` | Bounded parser; emits Mermaid ER diagram source for common terminated `CREATE TABLE` statements. It is not a full SQL-dialect parser or rendered diagram editor. |
| Code Minifier | `/tools/developer/code-minifier` | Bounded; separate CSS and JavaScript paths. Suitable for straightforward source, not a replacement for AST-based production bundlers such as Terser. |
| Regex Tester Engine | `/tools/developer/regex-tester` | Ready with safety bounds; executes in a disposable worker with pattern/input limits, match cap, and a one-second timeout. |
| Diff Checker | `/tools/developer/diff-checker` | Ready; line-level diff, copy, download, and reset. |

### Security and generators (6)

| Tool | Route | Assessment |
| --- | --- | --- |
| Password Generator | `/tools/security/password-generator` | Ready; rejection-sampled Web Crypto randomness, required character groups, secure shuffle, and entropy estimate. |
| QR Code Blueprint Maker | `/tools/security/qr-code-generator` | Ready; bounded content length, PNG preview/download, and local generation. |
| Barcode Generator | `/tools/security/barcode-generator` | Ready; CODE128 validation, SVG preview/download, and bounded content length. |
| UUID/GUID Provisioner | `/tools/security/uuid-generator` | Ready; Web Crypto UUID v4 batches up to 100. |
| URL Shortener Registry | `/tools/security/url-shortener` | Intentionally local-only; secure random codes and redirects work only in the same browser storage. It is not presented as a public hosted shortener. |
| Hash Calculator | `/tools/security/hash-calculator` | Ready; text/files, SHA-1/256/384/512, 250 MB file limit. SHA-1 is visibly labeled legacy-only. |

### Network tools (7)

| Tool | Route | Assessment |
| --- | --- | --- |
| HTML Content Scraper | `/tools/network/html-content-scraper` | Server-backed; HTML content-type enforcement, SSRF controls, 2 MB response cap, redirect and timeout limits. |
| Broken Link Checker | `/tools/network/broken-link-checker` | Server-backed; bounded link count/concurrency, safe requests, and GET fallback for HTTP 405 HEAD responses. |
| Sitemap Builder | `/tools/network/sitemap-builder` | Server-backed; same-origin crawl limited to 25 pages and a 22-second deadline. XML escaping is applied. |
| DNS Records Inspector | `/tools/network/dns-inspector` | Server-backed; public A/AAAA/MX/TXT/CNAME/NS lookup. |
| Port Scanner | `/tools/network/port-scanner` | Server-backed and constrained; explicit authorization, fixed common-port allowlist, public-address validation, short socket timeout. |
| Ping Monitor | `/tools/network/ping-monitor` | Server-backed; five bounded HTTP HEAD latency/availability samples, not ICMP ping. |
| Whois Lookup Dashboard | `/tools/network/whois-lookup` | Server-backed; external RDAP service with a ten-second timeout. Availability depends on the registry/RDAP service. |

The network API pins validated public DNS results for HTTP requests, blocks credentials, local/private/link-local/reserved destinations and unsupported ports, limits redirects/body size/time, rate-limits by client IP, validates a fixed action allowlist, and caps input length. The client accurately states that these diagnostics require a protected server request.

### Text and SEO tools (7)

| Tool | Route | Assessment |
| --- | --- | --- |
| Word Counter | `/tools/text/word-counter` | Ready; live words, characters, paragraphs, and related counts. |
| Case Converter | `/tools/text/case-converter` | Ready; multiple case transforms, copy, and reset workflow. |
| Remove Extra Spaces | `/tools/text/remove-extra-spaces` | Ready. |
| Remove Empty Lines | `/tools/text/remove-empty-lines` | Ready. |
| Remove Duplicate Lines | `/tools/text/remove-duplicate-lines` | Ready. |
| Remove Line Breaks | `/tools/text/remove-line-breaks` | Ready. |
| Meta Tag Generator | `/tools/seo/meta-tag-generator` | Ready; metadata presets, Open Graph/Twitter fields, structured data, safe local preview, copy, and download-oriented output. |

Shared text transforms now report source and result word/character/line counts and provide copy, download, clear, and use-output actions. Developer diffs use safe per-line addition/removal highlighting; developer results report line/character totals and exact minification reduction where applicable.

## Waitlist administration boundary

`clickproqa@gmail.com` is the default `NEXT_PUBLIC_ADMIN_EMAIL` and receives the manual waitlist approval fallback. Requests explicitly ask the administrator to review the submitted address and grant full early-access benefits when approved. The repository has no authentication, persistent account storage, or premium-entitlement gates, so request routing is implemented but account-level approval cannot be persisted until an identity/data provider is selected. The UI does not claim otherwise.

## Capabilities not currently registered

The repository does not currently advertise routes for dedicated audio compression/trimming/fades, video resize/crop/merge/GIF conversion, PDF compression/reorder/rotation/render-to-image/password workflows, HEIC input, SVG rasterization, OCR, AI background removal, robots.txt generation, schema generation, or timestamp/color/URL parsing. These should be added as separate scoped tools only when their processing and browser/server boundary is implemented; they should not be implied by the existing 67-tool count.

## Remaining production recommendations

1. Add binary fixtures and Playwright browser tests for representative JPEG/AVIF, MP4/WebM, MP3/FLAC, PDF, EPUB, and ZIP outputs. The current environment verified routes/builds but did not run every binary processor in Chromium/WebKit/Firefox.
2. Add screenshot-based responsive checks at 360, 390, 768, 1024, 1280, 1440, and 1920 px plus automated axe checks.
3. Isolate or update the `@jsquash/avif` integration to remove the current webpack critical-dependency and circular-chunk warnings.
4. Add a persistent distributed rate limiter for multi-instance production hosting; the current in-memory limiter is deliberately single-instance.
5. Use server-side media/PDF jobs only if files above safe browser-memory limits become a product requirement. Such a change must update the local-processing privacy copy.
