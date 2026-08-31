"use client";

/*
  A real compressor in the hero, not a picture of one.

  The home page's job is to get someone into a task. Making the first thing they
  see a working drop zone removes a whole navigation step, and the before/after
  it produces is genuine output — every figure shown is measured from the actual
  blob, because a fabricated saving would be a false claim about the product.

  It reuses the same helpers the full Image Compressor route uses, so there is
  one compression path rather than two that can drift apart. The full tool keeps
  the controls this deliberately omits: format choice, target size, dimensions.
*/

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import FileDropzone from "@/components/tool/FileDropzone";
import BeforeAfter from "@/components/visual/BeforeAfter";
import { compressionSummary, heroTargetDimensions } from "@/lib/tools/hero-compress";
import {
  exportCanvasAtQuality,
  formatBytes,
  getDrawingContext,
  loadImageFromUrl,
} from "@/lib/image-conversion";

type HeroResult = {
  originalBytes: number;
  compressedBytes: number;
  ratio: number;
  savedPercent: number;
  previewUrl: string;
  downloadName: string;
};

export default function HeroCompressor() {
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<HeroResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Object URLs outlive the render that made them, so they are tracked in a ref
  // and revoked on replacement and on unmount. Without this the hero leaks a
  // blob for every image a visitor tries.
  const previewUrlRef = useRef<string>("");

  const releasePreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
  }, []);

  // A compression can still be in flight when this component unmounts. Without this
  // guard, the async handler below would assign a preview URL into the ref after the
  // cleanup effect already ran, and nothing would ever revoke it.
  const unmountedRef = useRef(false);

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      releasePreview();
    };
  }, [releasePreview]);

  const handleFiles = useCallback(
    async (incoming: File[]) => {
      const file = incoming[0];
      if (!file) return;

      setFiles(incoming);
      setError("");
      setBusy(true);
      releasePreview();
      setResult(null);

      const sourceUrl = URL.createObjectURL(file);

      try {
        const image = await loadImageFromUrl(sourceUrl);
        const target = heroTargetDimensions(image.naturalWidth, image.naturalHeight);

        const canvas = document.createElement("canvas");
        canvas.width = target.width;
        canvas.height = target.height;

        const context = getDrawingContext(canvas);
        if (!context) {
          throw new Error("This browser did not provide a drawing context.");
        }

        context.drawImage(image, 0, 0, target.width, target.height);

        // exportCanvasAtQuality returns { blob, appliedQuality } and yields null
        // when the browser silently fell back to a different format, which is
        // exactly the case that would otherwise ship a mislabeled file.
        const encoded = await exportCanvasAtQuality(canvas, "image/webp", 0.72);
        if (!encoded) {
          throw new Error("This browser could not encode the image as WebP.");
        }

        const { blob } = encoded;
        const summary = compressionSummary(file.size, blob.size);
        const previewUrl = URL.createObjectURL(blob);

        if (unmountedRef.current) {
          // The component is gone; nobody will ever revoke this through the ref,
          // so close it immediately instead of leaking it.
          URL.revokeObjectURL(previewUrl);
          return;
        }

        previewUrlRef.current = previewUrl;

        setResult({
          originalBytes: file.size,
          compressedBytes: blob.size,
          ratio: summary.ratio,
          savedPercent: summary.savedPercent,
          previewUrl,
          downloadName: `${file.name.replace(/\.[^.]+$/, "")}-compressed.webp`,
        });
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "That image could not be compressed in this browser.",
        );
      } finally {
        URL.revokeObjectURL(sourceUrl);
        setBusy(false);
      }
    },
    [releasePreview],
  );

  return (
    <div className="min-h-[26rem] rounded-[var(--radius-xl)] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-lift)] sm:p-5">
      {/*
        min-h reserves space for the result state up front so it never grows the
        card in place (CLS). Budget with the card's own p-4/p-5 padding (32-40px)
        added on top:
          - dropzone: icon 40 + label/hint text ~36 + p-4 padding 32 + border  ~110px
          - mt-4 gap before result                                             16px
          - before/after row (p-3 cells, label+value+ratio meter)             ~90px
          - mt-3 gap + action row (min-h-11 buttons)                          ~56px
          total content ~272px, +40px card padding ~312px, rounded up with a
          safety margin for font/zoom variance to 26rem (416px).
      */}
      <FileDropzone
        accept="image/jpeg,image/png,image/webp"
        files={files}
        onFiles={handleFiles}
        onError={setError}
        maxFileSize={25 * 1024 * 1024}
        label="Drop an image to compress"
        hint="JPG, PNG or WebP, up to 25 MB — it never leaves your device"
        disabled={busy}
      />

      <p aria-live="polite" className="sr-only">
        {busy
          ? "Compressing image"
          : result
            ? result.savedPercent > 0
              ? `Compressed to ${formatBytes(result.compressedBytes)}, ${result.savedPercent}% smaller`
              : `Compressed to ${formatBytes(result.compressedBytes)}`
            : ""}
      </p>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-[var(--error-foreground)]">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="mt-4">
          <BeforeAfter
            beforeLabel="Original"
            afterLabel="Compressed"
            beforeValue={formatBytes(result.originalBytes)}
            afterValue={formatBytes(result.compressedBytes)}
            ratio={result.ratio}
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <a
              href={result.previewUrl}
              download={result.downloadName}
              className="inline-flex min-h-11 items-center rounded-[var(--radius-sm)] bg-[var(--action-bg)] px-4 text-sm font-bold text-[var(--action-fg)] hover:bg-[var(--action-bg-hover)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)]"
            >
              {result.savedPercent > 0 ? `Download ${result.savedPercent}% smaller` : "Download result"}
            </a>
            <Link
              href="/tools/image/image-compressor"
              className="text-sm font-semibold text-[var(--accent-700)] underline underline-offset-4"
            >
              More options
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
