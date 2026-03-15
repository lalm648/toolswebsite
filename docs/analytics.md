# Analytics Reference

This project uses a lightweight client-side analytics layer in [src/lib/analytics.ts](/Users/lalmuhammad/Documents/toolswebsite/src/lib/analytics.ts).

It currently fans out to:
- `window.dataLayer`
- `window.gtag`
- `window.plausible`
- a custom browser event: `toolswebsite:analytics`

All tracking is consent-aware through [src/lib/consent.ts](/Users/lalmuhammad/Documents/toolswebsite/src/lib/consent.ts).

## Event Model

These are the highest-value events currently emitted by the app.

### Page and navigation events

| Event | Trigger | Important payload |
| --- | --- | --- |
| `page_view` | Route view | `path` |
| `search` | Homepage/category search | `query`, `source` |
| `category_open` | Category card click | `category_slug` |
| `tool_open` | Tool card click | `tool_slug`, `category` |
| `cta_click` | CTA or outbound click | `label`, `href`, `location` |

### Tool action events

| Event | Tool | Trigger | Important payload |
| --- | --- | --- | --- |
| `encode_base64` | Base64 Encoder | Successful encode | `tool_slug`, `input_length`, `output_length` |
| `decode_base64` | Base64 Encoder | Successful decode | `tool_slug`, `input_length`, `output_length` |
| `format_json` | JSON Formatter | Successful format | `tool_slug`, `input_length`, `output_length` |
| `minify_json` | JSON Formatter | Successful minify | `tool_slug`, `input_length`, `output_length` |
| `copy_output` | Meta Tag Generator | Copy meta tags / JSON-LD | `tool_slug`, `output_kind`, `output_length`, `preset_mode` |
| `convert_image` | Image converters | Successful conversion | `tool_slug`, `input_type`, `output_format`, `input_size`, `output_size` |
| `compress_image` | Image Compressor | Successful compression | `tool_slug`, `input_type`, `output_format`, `input_size`, `output_size`, `quality_percent`, `max_width`, `max_height` |
| `resize_image` | Image Resizer | Successful resize | `tool_slug`, `input_type`, `output_format`, `input_size`, `output_size`, `width`, `height` |
| `rotate_image` | Rotate Image | Successful rotation | `tool_slug`, `input_type`, `output_format`, `input_size`, `output_size`, `rotation` |
| `crop_image` | Crop Image | Successful crop | `tool_slug`, `input_type`, `output_format`, `input_size`, `output_size`, `crop_width`, `crop_height`, `crop_x`, `crop_y`, `aspect_preset` |
| `download_result` | Image tools | Download click | `tool_slug`, `output_format`, `file_name` |
| `tool_action_failed` | Core tools | Failed validation, processing, export, or clipboard action | `tool_slug`, `action`, `reason`, plus context like sizes, type, dimensions, preset mode, or rotation |

## Recommended Dashboard Views

If you connect GA4, Plausible, or a data warehouse later, start with these views:

### 1. Traffic to usage funnel

Track:
- `page_view`
- `tool_open`
- tool action event
- `download_result`

Useful questions:
- Which tool pages get traffic but low actual usage?
- Which tools have high action rates after open?
- Which image tools have strong download completion rates?

### 2. Search intent

Track:
- `search`
- `tool_open`

Useful questions:
- Which search terms appear most often?
- Which queries do not lead to tool opens?
- Which tools should be promoted on the homepage?

### 3. Monetization readiness

Track:
- `tool_open`
- tool action event
- `download_result`
- `cta_click`

Useful questions:
- Which tools deserve sponsor placements first?
- Which tools are used frequently enough for ads or premium upsells?
- Which category has the best commercial intent?

### 4. Failure monitoring

Track:
- `tool_action_failed`
- matching success event for the same tool/action

Useful questions:
- Which tools fail most often before completion?
- Are failures caused by invalid input, browser export issues, or clipboard limitations?
- Which failures deserve UX fixes first because they block high-intent tools?

## Suggested KPIs

Start with these simple KPIs:

- Tool open rate: `tool_open / page_view`
- Tool action rate: `tool action / tool_open`
- Download completion rate: `download_result / tool action`
- Failure rate: `tool_action_failed / attempted action`
- Search-to-open rate: `tool_open after search / search`
- Most used tools by action volume
- Highest intent tools by download rate

## Naming Rules

To keep analytics clean as the project grows:

- Use snake_case event names
- Keep `tool_slug` stable once shipped
- Prefer numeric payloads for sizes, lengths, dimensions, and rotation
- Only emit success events after the action actually completes
- Use `download_result` consistently across tools instead of per-tool download event names

## Next Good Additions

These are not implemented yet, but they are the best next analytics upgrades:

- copy tracking for text tools and developer tools
- scroll-depth or section-view events on high-traffic pages
- lead capture submission success events
- monetization impression/click events for ad and sponsored modules
