---
version: alpha
name: "Webutilia"
description: "A fast, privacy-forward utility workbench with calm surfaces and category color as wayfinding."
colors:
  background: "#f5f7fb"
  foreground: "#475569"
  ink: "#0f172a"
  primary: "#047857"
  primary-hover: "#036249"
  primary-foreground: "#ffffff"
  panel: "#f1f4f9"
  card: "#ffffff"
  outline: "#dde3ec"
  outline-strong: "#c2cbd8"
  danger: "#b91c1c"
  warning: "#92590c"
  success: "#15803d"
typography:
  sans:
    fontFamily: "Plus Jakarta Sans, Segoe UI, system-ui, sans-serif"
  mono:
    fontFamily: "JetBrains Mono, Cascadia Mono, Consolas, monospace"
rounded:
  sm: "10px"
  md: "14px"
  lg: "18px"
  xl: "22px"
  2xl: "28px"
  DEFAULT: "14px"
spacing:
  section: "2.5rem"
  section-lg: "3.5rem"
components:
  button: {}
  card: {}
  search: {}
  tool-workbench: {}
  upload-zone: {}
---

# Webutilia Design System

## Overview

### Creative North Star

Webutilia should feel like a soft instrument console: every utility sits in a tactile, clearly grouped tray; category color behaves like an illuminated control channel; and input, processing, and output read as one connected workspace. The interface stays calm and lightweight until a person interacts with it.

### Product context and register

- **Audience and primary job:** Global desktop and mobile users completing a small file, text, developer, security, SEO, dictionary, or public-network task quickly.
- **Target markets and evidence:** Global English-speaking search traffic; the product audit records early US, UK, and Qatar discovery. The Brahui dictionary is a distinct language surface, not evidence that the whole product targets one market.
- **Locale and language policy:** English product chrome. Preserve native Brahui and Urdu-script content in the dictionary and provide correct language attributes where applicable.
- **Usage scene:** Short, intent-led visits, often from search, on both mobile and desktop. The tool must appear before supporting content on individual tool pages.
- **Register:** Hybrid. Home and category routes are discovery/content surfaces; every individual tool route is a product workbench.
- **Memorable signature:** A three-stage input → process → output rail above a softly dimensional, category-tinted workbench.
- **Restraint:** Workbench controls, results, errors, privacy explanations, and long-form copy remain quiet and highly legible.
- **Anti-references:** Avoid a wall of identical white cards, harsh neumorphism, neon dashboard chrome, excessive glass, decorative looping motion, and generic gradients that hide category meaning.
- **Token ownership/runtime mapping:** Model B. [globals.css](src/app/globals.css) is the runtime source of truth; this document mirrors accepted values. Tailwind v4 maps the CSS variables through `@theme inline`, and shared components consume semantic variables rather than hardcoded brand values.

## Colors

Emerald is the brand/action color, while slate ink and cool gray surfaces keep dense tools calm. The category spectrum is expressive wayfinding, not semantic status. Success, warning, and danger retain their separate meanings. Dark mode remaps semantic variables in `:root[data-theme="dark"]` without changing hierarchy. Forced-colors mode yields scrollbar contrast to the platform.

## Typography

Plus Jakarta Sans carries headings, navigation, controls, and prose. JetBrains Mono is reserved for JSON, hashes, DNS records, code, and exact technical output. Titles use tight tracking and decisive weight; body copy uses comfortable line height and a readable measure. Utility labels may use small uppercase text only as eyebrows, never for instructions or long copy.

## Layout

Pages follow a clear hierarchy: intent and search, grouped choices, active workbench, supporting guidance, then related next steps. Section headings may place a short explanation beside the title at wider widths and stack it below on narrow screens. Cards use minimum heights only where a row must align; long content remains in natural document flow. Scrollable surfaces keep visible scrollbars and stable geometry.

## Elevation & Depth

Tonal surface steps, directional inset highlights, and broad low-alpha shadows provide hierarchy. Tool and category cards use Soft-3D elevation that suggests a lightweight physical instrument without sacrificing contrast. Hover lifts are spring-based and restrained; input surfaces sit slightly inward, while output surfaces rise slightly forward. Generated text keeps actions and summaries in normal flow, while long payloads are capped to the visual viewport and scroll inside the output surface.

## Shapes

Controls and compact cards use the 10–14px radii. Grouped panels use 18px, major content panels use 22px, and category heroes may use 28px. Pills are reserved for status, filters, and compact metadata—not every button or container. Icons use rounded containers and consistent 1.8–2px strokes.

## Components

### Foundational visual states

Every enabled action has hover, focus-visible, active, and disabled/busy treatment. Focus uses the emerald ring and never depends on color alone. Loading keeps final geometry stable. Errors stay next to the input that needs correction, while status regions announce completion.

### Buttons and actions

Solid emerald is the primary action; outline and ghost treatments are secondary. Danger is reserved for irreversible actions. Buttons retain dimensions while busy and use action-specific labels such as “Download,” “Copy,” or “Compress.”

### Navigation and data display

Home discovery uses categories, recommended tools, and explicit connected workflows. Category pages use a spotlight plus named workflow groups. Tool cards share one card recipe, with category hue expressed through their icon and hover edge. Breadcrumbs and related links use normal anchors and descriptive labels.

### Forms and overlays

Fields have real labels, visible focus, text errors, and stable help space. Search always offers an explicit clear action when non-empty. Upload zones support click and drag, explain accepted formats and limits, and preserve keyboard access. Product UI does not use browser alert, confirm, or prompt dialogs.

### Iconography

Use the maintained inline outline icon set. Icons inherit category or semantic color, remain optically centered, and accompany text for any action whose meaning is not universal.

### Motion

Motion communicates hover, workspace arrival, progress, or state change. Shared cards and result surfaces use the `motion` React package with short, well-damped springs; translation remains subtle and never loops for decoration. `useReducedMotion` and `prefers-reduced-motion` remove transforms and collapse durations to effectively immediate feedback.

### Content and data visualization

Use direct, task-first language. Describe what the person supplies, what processing happens, and what they receive. Keyword phrases must fit real capabilities and visible explanations; never add keyword lists or fabricated ratings. Technical results use structured summaries before raw output when possible.

## Do's and Don'ts

- **Do:** Keep the active tool above supporting SEO content on every tool page.
- **Do:** Reuse shared tokens, cards, search, workbench states, and category hue consistently.
- **Do:** Link the next genuinely useful step with descriptive anchor text.
- **Don't:** Promise server privacy, output quality, or format support that the implementation cannot prove.
- **Don't:** add heavy animation, autoplay decoration, or a second motion system beside the shared `motion` primitives.
- **Don't:** use category colors as error, warning, or success signals.
