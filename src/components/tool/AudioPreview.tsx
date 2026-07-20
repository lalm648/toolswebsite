"use client";

import { useEffect, useRef, useState } from "react";
import { formatBytes } from "@/lib/image-conversion";

export type AudioMetadata = {
  size?: number;
  duration?: number;
  format?: string;
  bitrateKbps?: number;
  sampleRate?: number;
  channels?: number;
};

type AudioPreviewProps = {
  src: string;
  title: string;
  metadata?: AudioMetadata;
  tone?: "source" | "result";
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function channelLabel(channels?: number) {
  if (!channels) return undefined;
  if (channels === 1) return "Mono";
  if (channels === 2) return "Stereo";
  return `${channels} channels`;
}

export default function AudioPreview({
  src,
  title,
  metadata,
  tone = "source",
}: AudioPreviewProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(metadata?.duration ?? 0);
  const [decoded, setDecoded] = useState<AudioMetadata>({});
  const [peaks, setPeaks] = useState<number[]>(() => Array(88).fill(0.16));

  useEffect(() => {
    let active = true;
    const context = new AudioContext();

    async function decode() {
      try {
        const response = await fetch(src);
        if (!response.ok) throw new Error("Audio preview could not be loaded.");
        const data = await response.arrayBuffer();
        const audio = await context.decodeAudioData(data.slice(0));
        const barCount = 88;
        const nextPeaks = Array.from({ length: barCount }, (_, bar) => {
          const start = Math.floor((bar / barCount) * audio.length);
          const finish = Math.max(start + 1, Math.floor(((bar + 1) / barCount) * audio.length));
          const stride = Math.max(1, Math.floor((finish - start) / 160));
          let peak = 0;
          for (let channel = 0; channel < audio.numberOfChannels; channel += 1) {
            const samples = audio.getChannelData(channel);
            for (let index = start; index < finish; index += stride) {
              peak = Math.max(peak, Math.abs(samples[index] ?? 0));
            }
          }
          return Math.max(0.08, Math.min(1, peak));
        });
        const seconds = audio.duration || metadata?.duration || 0;
        if (active) {
          setPeaks(nextPeaks);
          setDuration(seconds);
          setDecoded({
            duration: seconds,
            sampleRate: audio.sampleRate,
            channels: audio.numberOfChannels,
            bitrateKbps:
              metadata?.bitrateKbps ??
              (metadata?.size && seconds
                ? Math.round((metadata.size * 8) / seconds / 1000)
                : undefined),
          });
        }
      } catch {
        // Native audio controls remain useful when Web Audio cannot decode a codec.
      } finally {
        void context.close();
      }
    }

    void decode();
    return () => {
      active = false;
      void context.close();
    };
  }, [src, metadata?.bitrateKbps, metadata?.duration, metadata?.size]);

  const resolved = { ...metadata, ...decoded };
  const progress = duration ? Math.min(1, currentTime / duration) : 0;
  const facts = [
    resolved.format?.toUpperCase(),
    resolved.size ? formatBytes(resolved.size) : undefined,
    resolved.bitrateKbps ? `≈ ${resolved.bitrateKbps} kbps` : undefined,
    resolved.sampleRate ? `${(resolved.sampleRate / 1000).toFixed(resolved.sampleRate % 1000 ? 1 : 0)} kHz` : undefined,
    channelLabel(resolved.channels),
  ].filter(Boolean);

  function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play();
    else audio.pause();
  }

  function seek(event: React.MouseEvent<HTMLButtonElement>) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    audio.currentTime = Math.max(0, Math.min(duration, ((event.clientX - bounds.left) / bounds.width) * duration));
  }

  return (
    <div className={`rounded-2xl border p-4 ${tone === "result" ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/20" : "border-[var(--outline-soft)] bg-[var(--surface-panel)]"}`}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || duration)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlayback}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--ink-900)] text-white transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)]"
          aria-label={playing ? `Pause ${title}` : `Play ${title}`}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zm6 0h4v14h-4z" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5" fill="currentColor" aria-hidden="true"><path d="m8 5 11 7-11 7z" /></svg>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--ink-900)]">{title}</p>
          <button
            type="button"
            onClick={seek}
            className="mt-2 block h-12 w-full rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)]"
            aria-label={`Seek in ${title}`}
          >
            <svg viewBox="0 0 352 48" preserveAspectRatio="none" className="h-full w-full" aria-hidden="true">
              {peaks.map((peak, index) => {
                const height = Math.max(4, peak * 42);
                return (
                  <rect
                    key={index}
                    x={index * 4}
                    y={(48 - height) / 2}
                    width="2.4"
                    height={height}
                    rx="1.2"
                    fill={index / peaks.length <= progress ? "var(--accent-500)" : "var(--outline-strong)"}
                  />
                );
              })}
            </svg>
          </button>
          <div className="mt-1 flex justify-between text-[11px] tabular-nums text-[var(--muted-foreground)]">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
      {facts.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {facts.map((fact) => (
            <span key={fact} className="rounded-full border border-[var(--outline-soft)] bg-[var(--surface-raised)] px-2.5 py-1 text-[11px] font-medium text-[var(--muted-foreground)]">
              {fact}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
