/*
  The Brahui dictionary is one self-contained 2.3 MB HTML document — its own CSS,
  its own engine, 3,473 pre-rendered word rows and a JSON block of senses and
  examples, with no external dependency of any kind. It is served whole from
  public/brahui/index.html and framed here rather than rewritten as React, so the
  transliterator, the speech ranking and the spaced-repetition scheduler stay the
  exact code its own test suites cover. Its palette was remapped onto the site's
  design tokens, so what appears below is Webutilia-coloured, not a foreign panel.

  Why a frame rather than inlining it into the route: the app is built around a
  bottom navigation bar that is `position: fixed` and modal sheets sized in `vh`.
  Given a viewport of its own — which is what a frame is — both behave exactly as
  designed. Inlined into a scrolling site page they would anchor to the window and
  detach from the app.

  Deliberately not a client component, and with no loading state. Two reasons:

  1. Gating on the frame's `load` event is wrong for this app. `load` waits for the
     last of 2.3 MB, while the app's own UI is first in its document and paints in
     about 0.03s — its word list is usable at 0.6s on a 2 Mbps link, well before
     the tail arrives. An overlay held until `load` would hide a working app for
     seconds on a slow connection.
  2. A React `onLoad` on a server-rendered frame is also unreliable: the browser
     starts fetching the `src` immediately and can finish before hydration attaches
     the handler, so the event is missed and the overlay never clears.

  So the placeholder below sits *behind* the frame in the same grid cell and needs
  no JavaScript at all. The app's own body background is opaque, so the moment it
  paints it covers the message. Nothing can get stuck.
*/

const APP_SRC = "/brahui/index.html";

export default function BrahuiDictionaryTool() {
  return (
    <div className="space-y-2">
      <div className="grid overflow-hidden rounded-[var(--radius-lg)] border border-[var(--outline-soft)] bg-[var(--surface-card)] shadow-[var(--shadow-soft)]">
        <p className="col-start-1 row-start-1 self-center justify-self-center px-6 text-center text-sm text-[var(--muted-foreground)]">
          Loading 3,473 Brahui entries…
        </p>

        <iframe
          src={APP_SRC}
          title="Brahui dictionary and learning app"
          /*
            The height is the app's viewport. svh, not vh, so a mobile browser's
            collapsing toolbar cannot resize it mid-scroll.

            It is measured down from the viewport rather than as a share of it.
            84svh came to 682px on a 812px phone, and with the breadcrumb and the
            heading pushing the frame to y=140 its bottom landed at 822 — past the
            viewport, with the app's own fixed navigation bar clipped in half. The
            11rem subtracted here is that chrome above plus a margin below, so the
            nav bar stays whole. The floor keeps the pane workable in a short
            desktop window and the ceiling stops it stretching on a large display.
          */
          className="col-start-1 row-start-1 block h-[clamp(32rem,calc(100svh-11rem),58rem)] w-full border-0 bg-transparent"
          /*
            Deliberately not sandboxed. The document is first-party, same-origin and
            loads nothing from anywhere else, and `allow-scripts allow-same-origin`
            together — which sharing the theme and the saved-words storage requires
            — is the documented way out of a sandbox, so it would buy no boundary.
            What it would cost is real: the app calls confirm() before a reset and
            exports saved words through an object URL, and both are refused unless
            allow-modals and allow-downloads are also listed. X-Frame-Options is
            SAMEORIGIN, so no other site can frame it.
          */
        />
      </div>

      <p className="px-2 text-center text-[11px] leading-5 text-[var(--muted-foreground)] sm:text-xs">
        Entries extracted from Ali &amp; Kobayashi (2024), <em>Brahui Texts</em>,
        ILCAA Asian and African Lexicon 66, published under CC BY 4.0.{" "}
        <a
          href={APP_SRC}
          target="_blank"
          rel="noopener"
          className="font-semibold text-[var(--accent-700)] underline decoration-[var(--accent-300)] underline-offset-2 hover:decoration-[var(--accent-700)]"
        >
          Open the dictionary in its own tab
        </a>
        .
      </p>
    </div>
  );
}
