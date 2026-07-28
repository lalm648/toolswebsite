# Webutilia 2.0 Search Intent Map

Date: July 28, 2026  
Source: Google Search Console exports supplied for `webutilia.com`

## Product direction

Webutilia 2.0 treats every tool as a focused four-stage workspace:

1. Input: make the accepted source obvious.
2. Refine: expose the controls that materially affect the result.
3. Review: show a visual, measurable, or structured result before saving.
4. Finish: provide an explicit copy, download, or batch-export action.

All 67 registered tools now have a unique workflow definition and capability set. The registry audit fails if a future tool is added without one.

## Search-led priorities

| Query intent | Current route | Page signal | 2.0 response |
| --- | --- | ---: | --- |
| Free SEO meta tag generator | `/tools/seo/meta-tag-generator` | 90 impressions | Retains the full title, description, canonical, robots, Open Graph, Twitter, image, and JSON-LD workflow with Google and social previews; the shared workflow now makes that depth visible before input. |
| Extract audio or sound from video | `/tools/video/audio-extractor` | 74 impressions | Clearly scoped to a local video file; supports MP3, M4A, AAC, OGG, WebM audio, WAV, and FLAC plus bitrate, sample rate, channels, source playback, output playback, size estimates, and download. |
| Join, merge, combine, or mix audio | `/tools/audio/audio-joiner` | 45 impressions | Added two genuine modes: sequential joining and simultaneous normalized mixing. Users can reorder up to 20 tracks, configure output encoding, estimate size, listen to the result, and download one file. |
| Website ping, latency, or availability | `/tools/network/ping-monitor` | 28 impressions | Replaced raw JSON-first output with five-sample bars, availability, average, fastest, and slowest response metrics; raw data remains available. |
| Smart crop or smart image cropping | `/tools/image/smart-image-cropper` | 25 impressions | Makes the feature-aware edge/contrast crop, ratio presets, transparency-safe preview, and local export explicit; corrected old copy that described the result as merely centered. |
| Online voice or sound recorder | `/tools/audio/voice-recorder` | 17 impressions | Added an elapsed timer, live input-level visualization, pause, resume, recording names, playback metadata, local download, and clearer microphone privacy state. |
| Hash calculator or online checksum | `/tools/security/hash-calculator` | 13 impressions | Added expected-checksum verification with explicit match and mismatch states while retaining SHA-1, SHA-256, SHA-384, SHA-512, text input, and files up to 250 MB. |
| BPM, tempo detector, or tempo calculator | `/tools/audio/bpm-detector` | 13 impressions | Added a visual BPM scale, tempo category, detected peak count, and alternative tempo candidates with a precision warning for changing or syncopated music. |
| SQL schema visualizer | `/tools/developer/sql-schema-visualizer` | 6 impressions and 2 clicks | Added visual table cards, column types, primary/foreign-key badges, relationship paths, table/column/relation totals, and collapsible Mermaid ER source. |
| Remove empty lines | `/tools/text/remove-empty-lines` | 6 page impressions; query position 15 | Existing instant transformation, live counts, copy, download, and local processing are now described in a tool-specific workflow. |
| Video muter | `/tools/video/video-muter` | Query position 16 | Existing local audio removal is surfaced as a verify-by-playback workflow with a silent H.264 MP4 result and output metadata. |
| PDF text extraction | `/tools/document/pdf-text-extractor` | 7 impressions | Added geometry-aware reading order, a layout-preserving mode, hyphen joining, optional page separators, extraction statistics, copy/download, and an explicit image-only/OCR boundary. |

Page signal is taken from `Pages.csv`; query positions are used where they communicate the more useful signal.

## Collection-wide coverage

| Collection | Tools | 2.0 review surface |
| --- | ---: | --- |
| Image | 20 | Before/after images, dimensions, file sizes, crop/fit state, transparency, palettes, animation, or batch ZIP state |
| Video | 8 | Source metadata, timestamps, encoding choices, estimated/final size, playback, dimensions, duration, and codec state |
| Audio | 5 | Source/output playback, track order, join/mix mode, encoding estimates, recording meter, BPM visualization, or peak report |
| Document | 7 | File/page order, page counts, thumbnails, rendered document preview, extracted text, or output PDF |
| Text | 6 | Live input/output counts, transformed copy, copy/download, and reversible “use output” workflows |
| Developer | 7 | Validated structured output, SQL table diagram, regex positions/groups, color-coded diff, reduction stats, or downloadable result |
| Security | 6 | Strength/entropy, visual QR/barcode, checksum verification, generated batches, or local link registry |
| Network | 7 | Purpose-specific charts, summaries, groups, tables, timelines, controlled limits, and optional raw data |
| SEO | 1 | Search-result and social-card previews, field warnings, generated tags, and JSON-LD |

## Precision boundaries

Search intent should be fulfilled honestly, not by changing page copy to imply unsupported behavior.

- Queries about ripping music or audio from a website are not treated as permission to download third-party media. Audio Extractor processes a local video the user is entitled to use.
- Ping Monitor measures controlled HTTP response latency, not ICMP ping. The interface and FAQ say this directly.
- Port Scanner checks a fixed common-port list only after authorization; it is not a router port-forwarding test.
- Volume Normalizer processes decoded audio, not MIDI event data.
- URL Shortener is a local browser registry, not a public persistent shortening service.
- PDF Text Extractor reads embedded PDF text and does not claim OCR for image-only scans.
- EPUB to PDF is a text-focused chapter reflow, not a pixel-faithful reproduction of an e-book’s CSS, images, or interactive layout.

These boundaries protect result accuracy, user trust, hosting safety, and search quality.

## Next evidence threshold

The supplied chart contains only ten reported days. Keep URLs, canonicals, and primary intent stable while Google continues discovery. Review complete 28-day and 3-month comparisons before creating additional routes. The first new route justified by the current low-volume data would be a website screenshot/thumbnail tool, but one impression is not yet enough evidence to prioritize it above strengthening the discovered pages above.
