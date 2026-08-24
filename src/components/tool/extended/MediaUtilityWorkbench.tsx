"use client";

/* eslint-disable @next/next/no-img-element -- Generated blob URLs are local processing previews. */

import { useEffect, useRef, useState } from "react";
import AudioPreview from "@/components/tool/AudioPreview";
import FileDropzone from "@/components/tool/FileDropzone";
import { PrivacyNotice, ProcessingProgress, WorkbenchError } from "@/components/tool/WorkbenchStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBytes } from "@/lib/image-conversion";

type MediaUtilityWorkbenchProps = { slug: string };
type MediaResult = { url: string; name: string; size: number; type: string };
type MediaDetails = {
  duration: number;
  width: number;
  height: number;
  size: number;
  format: string;
  fileCount: number;
};

function extension(fileName: string) {
  return (
    fileName
      .split(".")
      .pop()
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, "") || "bin"
  );
}
function mediaOutputName(
  slug: string,
  fileName: string,
  outputExtension: string,
  speed: number,
) {
  const base = fileName.replace(/\.[^.]+$/, "");
  const suffix: Record<string, string> = {
    "video-compressor": "compressed",
    "audio-extractor": "audio",
    "video-format-transpiler": "transpiled",
    "thumbnail-grabber": "thumbnail",
    "video-clipper": "clip",
    "video-muter": "muted",
    "subtitles-burner": "captioned",
    "audio-format-switcher": "converted",
  };
  const operation =
    slug === "video-speed-adjuster"
      ? `${Number(speed.toFixed(2))}x`
      : suffix[slug] ?? "processed";
  return `${base}-${operation}.${outputExtension}`;
}
function download(result: MediaResult) {
  const anchor = document.createElement("a");
  anchor.href = result.url;
  anchor.download = result.name;
  anchor.click();
}

function audioMime(format: string) {
  if (format === "wav") return "audio/wav";
  if (format === "ogg") return "audio/ogg";
  if (format === "flac") return "audio/flac";
  if (format === "m4a") return "audio/mp4";
  if (format === "aac") return "audio/aac";
  if (format === "webm") return "audio/webm";
  return "audio/mpeg";
}

function audioEncodingArgs(
  format: string,
  bitrate: number,
  sampleRate: number,
  channels: number,
) {
  const layout = ["-ar", String(sampleRate), "-ac", String(channels)];
  if (format === "wav") return ["-c:a", "pcm_s16le", ...layout];
  if (format === "flac") return ["-c:a", "flac", ...layout];
  if (format === "ogg") return ["-c:a", "libvorbis", "-b:a", `${bitrate}k`, ...layout];
  if (format === "webm") return ["-c:a", "libopus", "-b:a", `${bitrate}k`, ...layout];
  if (format === "m4a" || format === "aac") return ["-c:a", "aac", "-b:a", `${bitrate}k`, ...layout];
  return ["-c:a", "libmp3lame", "-b:a", `${bitrate}k`, ...layout];
}

function estimatedAudioSize(
  duration: number,
  format: string,
  bitrate: number,
  sampleRate: number,
  channels: number,
) {
  if (!duration) return 0;
  if (format === "wav") return duration * sampleRate * channels * 2 + 44;
  if (format === "flac") return duration * sampleRate * channels * 2 * 0.58;
  return (duration * bitrate * 1000) / 8;
}

function sizeChangeLabel(original: number, output: number) {
  if (!original || !output) return "";
  const change = ((original - output) / original) * 100;
  return change >= 0
    ? `${change.toFixed(1)}% smaller`
    : `${Math.abs(change).toFixed(1)}% larger`;
}

function encodeWav(channelData: Float32Array[], sampleRate: number) {
  const channels = channelData.length,
    length = channelData[0].length,
    buffer = new ArrayBuffer(44 + length * channels * 2),
    view = new DataView(buffer);
  const write = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1)
      view.setUint8(offset + index, value.charCodeAt(index));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + length * channels * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, length * channels * 2, true);
  let offset = 44;
  for (let index = 0; index < length; index += 1)
    for (let channel = 0; channel < channels; channel += 1) {
      const sample = Math.max(-1, Math.min(1, channelData[channel][index]));
      view.setInt16(
        offset,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true,
      );
      offset += 2;
    }
  return new Uint8Array(buffer);
}

type BpmAnalysis = {
  bpm: number;
  detectedPeaks: number;
  alternatives: number[];
};

async function analyzeBpm(file: File): Promise<BpmAnalysis> {
  const context = new AudioContext();
  try {
    const audio = await context.decodeAudioData(await file.arrayBuffer());
    const data = audio.getChannelData(0),
      windowSize = 1024,
      energies: number[] = [];
    for (let offset = 0; offset < data.length; offset += windowSize) {
      let energy = 0;
      for (
        let index = offset;
        index < Math.min(data.length, offset + windowSize);
        index += 1
      )
        energy += data[index] * data[index];
      energies.push(energy / windowSize);
    }
    const mean =
      energies.reduce((sum, value) => sum + value, 0) / energies.length;
    const peaks: number[] = [];
    for (let index = 1; index < energies.length - 1; index += 1)
      if (
        energies[index] > mean * 1.7 &&
        energies[index] > energies[index - 1] &&
        energies[index] >= energies[index + 1] &&
        (!peaks.length || index - (peaks.at(-1) ?? 0) > 4)
      )
        peaks.push(index);
    const histogram = new Map<number, number>();
    for (let index = 0; index < peaks.length; index += 1)
      for (
        let next = index + 1;
        next < Math.min(peaks.length, index + 12);
        next += 1
      ) {
        const seconds =
          ((peaks[next] - peaks[index]) * windowSize) / audio.sampleRate;
        if (seconds <= 0) continue;
        let bpm = 60 / seconds;
        while (bpm < 70) bpm *= 2;
        while (bpm > 190) bpm /= 2;
        const rounded = Math.round(bpm);
        histogram.set(rounded, (histogram.get(rounded) ?? 0) + 1);
      }
    const ranked = [...histogram].sort((a, b) => b[1] - a[1]);
    const best = ranked[0]?.[0];
    if (!best) throw new Error("Not enough rhythmic peaks were found.");
    return {
      bpm: best,
      detectedPeaks: peaks.length,
      alternatives: ranked
        .slice(1)
        .map(([value]) => value)
        .filter((value) => Math.abs(value - best) > 2)
        .slice(0, 3),
    };
  } finally {
    void context.close();
  }
}

export default function MediaUtilityWorkbench({
  slug,
}: MediaUtilityWorkbenchProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [subtitle, setSubtitle] = useState<File | null>(null);
  const [result, setResult] = useState<MediaResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [format, setFormat] = useState(slug.includes("audio") ? "mp3" : "mp4");
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(10);
  const [timestamp, setTimestamp] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [targetSize, setTargetSize] = useState(25);
  const [analysis, setAnalysis] = useState("");
  const [bpmAnalysis, setBpmAnalysis] = useState<BpmAnalysis | null>(null);
  const [mediaInfo, setMediaInfo] = useState("");
  const [mediaDetails, setMediaDetails] = useState<MediaDetails | null>(null);
  const [sourceUrls, setSourceUrls] = useState<string[]>([]);
  const [bitrate, setBitrate] = useState(192);
  const [sampleRate, setSampleRate] = useState(44100);
  const [channels, setChannels] = useState(2);
  const [targetPeakDb, setTargetPeakDb] = useState(-1);
  const [combineMode, setCombineMode] = useState<"sequence" | "mix">("sequence");
  const [trackDurations, setTrackDurations] = useState<number[]>([]);
  const ffmpegRef = useRef<import("@ffmpeg/ffmpeg").FFmpeg | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef(0);
  const recordingAccumulatedRef = useRef(0);
  const recordingPausedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const levelFrameRef = useRef<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordingPaused, setRecordingPaused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingName, setRecordingName] = useState("voice-recording");
  const [inputLevel, setInputLevel] = useState(0);
  const canceledRef = useRef(false);
  useEffect(() => {
    return () => {
      ffmpegRef.current?.terminate();
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
      if (levelFrameRef.current !== null)
        cancelAnimationFrame(levelFrameRef.current);
      void audioContextRef.current?.close();
    };
  }, []);
  useEffect(() => {
    return () => {
      if (result?.url) URL.revokeObjectURL(result.url);
    };
  }, [result]);
  useEffect(() => {
    return () => sourceUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [sourceUrls]);
  function setBlob(blob: Blob, name: string) {
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult({
      url: URL.createObjectURL(blob),
      name,
      size: blob.size,
      type: blob.type,
    });
  }
  function clearResult() {
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
  }
  async function selectFiles(next: File[]) {
    clearResult();
    setFiles(next);
    const nextUrls = next.map((file) => URL.createObjectURL(file));
    setSourceUrls(nextUrls);
    setAnalysis("");
    setBpmAnalysis(null);
    setProgress(0);
    if (!next.length) {
      setMediaInfo("");
      setMediaDetails(null);
      setTrackDurations([]);
      return;
    }
    try {
      const items = await Promise.all(next.map(async (file, index) => {
        const element = document.createElement(file.type.startsWith("audio/") ? "audio" : "video");
        element.preload = "metadata";
        element.src = nextUrls[index];
        await new Promise<void>((resolve, reject) => {
          element.onloadedmetadata = () => resolve();
          element.onerror = () => reject(new Error(`Metadata could not be read for ${file.name}.`));
        });
        return {
          duration: Number.isFinite(element.duration) ? element.duration : 0,
          width: "videoWidth" in element ? element.videoWidth : 0,
          height: "videoHeight" in element ? element.videoHeight : 0,
        };
      }));
      const first = items[0];
      const duration = multiple
        ? combineMode === "mix"
          ? Math.max(...items.map((item) => item.duration), 0)
          : items.reduce((sum, item) => sum + item.duration, 0)
        : first.duration;
      setTrackDurations(items.map((item) => item.duration));
      if (first.duration > 0) setEnd(Number(first.duration.toFixed(2)));
      const size = next.reduce((sum, file) => sum + file.size, 0);
      const details = {
        duration,
        width: first.width,
        height: first.height,
        size,
        format: extension(next[0].name),
        fileCount: next.length,
      };
      setMediaDetails(details);
      const dimensions = first.width ? ` · ${first.width}×${first.height}` : "";
      const count = multiple ? `${next.length} tracks · ` : "";
      setMediaInfo(`${count}${duration ? `${duration.toFixed(2)} seconds` : "Duration unavailable"}${dimensions} · ${formatBytes(size)}`);
    } catch (caught) {
      const size = next.reduce((sum, file) => sum + file.size, 0);
      setMediaDetails({ duration: 0, width: 0, height: 0, size, format: extension(next[0].name), fileCount: next.length });
      setMediaInfo(formatBytes(size));
      setError(caught instanceof Error ? caught.message : "Media metadata could not be read.");
    }
  }
  /** Returns null whenever the browser cannot handle the file, so callers fall back to ffmpeg. */
async function captureFrameWithBrowser(file: File, timestamp: number) {
  const url = URL.createObjectURL(file);

  try {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.src = url;

    const ready = await new Promise<boolean>((resolve) => {
      // A container the browser cannot demux may never fire either event, so cap the
      // wait rather than leaving the user on a spinner forever.
      const timer = window.setTimeout(() => resolve(false), 8000);
      video.onloadeddata = () => {
        window.clearTimeout(timer);
        resolve(true);
      };
      video.onerror = () => {
        window.clearTimeout(timer);
        resolve(false);
      };
    });

    if (!ready || !video.videoWidth || !video.videoHeight) {
      return null;
    }

    video.currentTime = Math.min(timestamp, Math.max(0, video.duration - 0.01));

    const seeked = await new Promise<boolean>((resolve) => {
      const timer = window.setTimeout(() => resolve(false), 8000);
      video.onseeked = () => {
        window.clearTimeout(timer);
        resolve(true);
      };
      video.onerror = () => {
        window.clearTimeout(timer);
        resolve(false);
      };
    });

    if (!seeked) {
      return null;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");

    if (!context) {
      return null;
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(video, 0, 0);

    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.94),
    );
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function getFfmpeg() {
    if (ffmpegRef.current?.loaded) return ffmpegRef.current;
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const ffmpeg = new FFmpeg();
    ffmpeg.on("progress", ({ progress: value }) =>
      setProgress(Math.max(0, Math.min(1, value))),
    );
    await ffmpeg.load({
      coreURL: "/ffmpeg/ffmpeg-core.js",
      wasmURL: "/ffmpeg/ffmpeg-core.wasm",
    });
    ffmpegRef.current = ffmpeg;
    return ffmpeg;
  }
  async function processMedia() {
    const virtualFiles: string[] = [];
    let cleanupEngine: import("@ffmpeg/ffmpeg").FFmpeg | null = null;
    canceledRef.current = false;
    setBusy(true);
    setError("");
    setAnalysis("");
    setBpmAnalysis(null);
    setProgress(0);
    try {
      if (!files.length) throw new Error("Choose a media file first.");
      if (slug === "video-clipper" && (start < 0 || end <= start)) {
        throw new Error("The end time must be later than the start time.");
      }
      if (slug === "bpm-detector") {
        const bpm = await analyzeBpm(files[0]);
        if (canceledRef.current) throw new Error("Processing canceled.");
        setBpmAnalysis(bpm);
        setAnalysis(
          `Estimated tempo: ${bpm.bpm} BPM\nDetected rhythmic peaks: ${bpm.detectedPeaks}${bpm.alternatives.length ? `\nAlternative candidates: ${bpm.alternatives.join(", ")} BPM` : ""}\n\nThis is an energy-peak estimate. Tracks with syncopation, long intros, or changing tempo may need manual verification.`,
        );
        return;
      }
      if (slug === "volume-normalizer") {
        const context = new AudioContext();
        try {
          const audio = await context.decodeAudioData(
            await files[0].arrayBuffer(),
          );
          let peak = 0;
          const channels = Array.from(
            { length: audio.numberOfChannels },
            (_, channel) => audio.getChannelData(channel),
          );
          channels.forEach((data) =>
            data.forEach((sample) => {
              peak = Math.max(peak, Math.abs(sample));
            }),
          );
          if (!peak) throw new Error("This audio file appears to be silent.");
          const targetPeak = 10 ** (targetPeakDb / 20);
          const gain = targetPeak / peak;
          const normalized = channels.map((data) =>
            Float32Array.from(data, (sample) => sample * gain),
          );
          setBlob(
            new Blob([encodeWav(normalized, audio.sampleRate)], {
              type: "audio/wav",
            }),
            `${files[0].name.replace(/\.[^.]+$/, "")}-normalized.wav`,
          );
          setAnalysis(
            `Applied gain: ${gain.toFixed(3)}×\nOriginal peak: ${(20 * Math.log10(peak)).toFixed(1)} dBFS\nOutput peak: ${targetPeakDb.toFixed(1)} dBFS`,
          );
        } finally {
          void context.close();
        }
        return;
      }
      if (slug === "thumbnail-grabber") {
        // Try the browser decoder first because it is near-instant, but it only handles
        // what the browser can play. MKV, AVI and many HEVC MOV files fail here even
        // though the dropzone accepts them, so those fall through to ffmpeg below.
        const file = files[0];
        const blob = await captureFrameWithBrowser(file, timestamp);

        if (blob) {
          setBlob(
            blob,
            `${file.name.replace(/\.[^.]+$/, "")}-frame-${timestamp}s.jpg`,
          );
          return;
        }
      }
      const ffmpeg = await getFfmpeg();
      cleanupEngine = ffmpeg;
      if (canceledRef.current) throw new Error("Processing canceled.");
      const { fetchFile } = await import("@ffmpeg/util");
      const inputNames: string[] = [];
      for (let index = 0; index < files.length; index += 1) {
        if (canceledRef.current) throw new Error("Processing canceled.");
        const name = `input-${index}.${extension(files[index].name)}`;
        inputNames.push(name);
        virtualFiles.push(name);
        await ffmpeg.writeFile(name, await fetchFile(files[index]));
      }
      let args: string[] = [],
        outputName = "output.mp4",
        mime = "video/mp4";
      if (slug === "thumbnail-grabber") {
        // Seeking before -i uses the keyframe index, which is what makes this fast
        // enough to be usable in single-threaded WASM.
        args = [
          "-ss",
          String(timestamp),
          "-i",
          inputNames[0],
          "-frames:v",
          "1",
          "-q:v",
          "2",
          "output.jpg",
        ];
        outputName = "output.jpg";
        mime = "image/jpeg";
      } else if (slug === "video-compressor") {
        const duration = end > 0 ? end : 60;
        const bitrate = Math.max(
          180,
          Math.floor((targetSize * 8192) / duration - 128),
        );
        args = [
          "-i",
          inputNames[0],
          "-vf",
          "scale='min(1280,iw)':-2",
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-b:v",
          `${bitrate}k`,
          "-maxrate",
          `${Math.round(bitrate * 1.25)}k`,
          "-bufsize",
          `${bitrate * 2}k`,
          "-c:a",
          "aac",
          "-b:a",
          "128k",
          outputName,
        ];
      } else if (slug === "audio-extractor") {
        outputName = `audio.${format}`;
        mime = audioMime(format);
        args = [
          "-i",
          inputNames[0],
          "-vn",
          ...audioEncodingArgs(format, bitrate, sampleRate, channels),
          outputName,
        ];
      } else if (slug === "video-format-transpiler") {
        args = [
          "-i",
          inputNames[0],
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-crf",
          "24",
          "-c:a",
          "aac",
          "-movflags",
          "+faststart",
          outputName,
        ];
      } else if (slug === "video-clipper") {
        args = [
          "-ss",
          String(start),
          "-to",
          String(end),
          "-i",
          inputNames[0],
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-crf",
          "23",
          "-c:a",
          "aac",
          outputName,
        ];
      } else if (slug === "video-muter") {
        // Dropping the audio track needs no video work at all. Copying the stream is
        // lossless and dramatically faster than the re-encode this used to do.
        args = [
          "-i",
          inputNames[0],
          "-c:v",
          "copy",
          "-an",
          "-movflags",
          "+faststart",
          outputName,
        ];
      } else if (slug === "video-speed-adjuster") {
        const audioFilters =
          speed < 0.5
            ? `atempo=0.5,atempo=${speed / 0.5}`
            : speed > 2
              ? `atempo=2,atempo=${speed / 2}`
              : `atempo=${speed}`;
        args = [
          "-i",
          inputNames[0],
          "-filter_complex",
          `[0:v]setpts=${1 / speed}*PTS[v];[0:a]${audioFilters}[a]`,
          "-map",
          "[v]",
          "-map",
          "[a]",
          "-c:v",
          "libx264",
          "-c:a",
          "aac",
          outputName,
        ];
      } else if (slug === "subtitles-burner") {
        if (!subtitle) throw new Error("Choose an SRT subtitle file.");
        await ffmpeg.writeFile("captions.srt", await fetchFile(subtitle));
        virtualFiles.push("captions.srt");
        args = [
          "-i",
          inputNames[0],
          "-vf",
          "subtitles=captions.srt",
          "-c:v",
          "libx264",
          "-c:a",
          "aac",
          outputName,
        ];
      } else if (slug === "audio-format-switcher") {
        outputName = `output.${format}`;
        mime = audioMime(format);
        args = [
          "-i",
          inputNames[0],
          ...audioEncodingArgs(format, bitrate, sampleRate, channels),
          outputName,
        ];
      } else if (slug === "audio-joiner") {
        outputName = `${combineMode === "mix" ? "mixed" : "joined"}.${format}`;
        mime = audioMime(format);
        const inputs = inputNames.flatMap((name) => ["-i", name]);
        const channelLayout = channels === 1 ? "mono" : "stereo";
        const normalizedStreams = inputNames
          .map(
            (_, index) =>
              `[${index}:a]aresample=${sampleRate},aformat=sample_fmts=fltp:channel_layouts=${channelLayout}[a${index}]`,
          )
          .join(";");
        const streams = inputNames.map((_, index) => `[a${index}]`).join("");
        const combination =
          combineMode === "mix"
            ? `${streams}amix=inputs=${inputNames.length}:duration=longest:dropout_transition=2:normalize=1[a]`
            : `${streams}concat=n=${inputNames.length}:v=0:a=1[a]`;
        args = [
          ...inputs,
          "-filter_complex",
          `${normalizedStreams};${combination}`,
          "-map",
          "[a]",
          ...audioEncodingArgs(format, bitrate, sampleRate, channels),
          outputName,
        ];
      }
      virtualFiles.push(outputName);
      let code = await ffmpeg.exec(args, 10 * 60 * 1000);
      if (code !== 0 && slug === "video-speed-adjuster") {
        try {
          await ffmpeg.deleteFile(outputName);
        } catch {}
        code = await ffmpeg.exec([
          "-i",
          inputNames[0],
          "-filter:v",
          `setpts=${1 / speed}*PTS`,
          "-an",
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          outputName,
        ], 10 * 60 * 1000);
      }
      if (code !== 0)
        throw new Error(`The media engine stopped with code ${code}.`);
      const data = await ffmpeg.readFile(outputName);
      if (typeof data === "string")
        throw new Error("The media engine returned invalid output.");
      setBlob(
        new Blob([new Uint8Array(data).buffer], { type: mime }),
        slug === "audio-joiner"
          ? `${combineMode === "mix" ? "mixed" : "joined"}-${files.length}-tracks.${format}`
          : mediaOutputName(
              slug,
              files[0].name,
              outputName.split(".").pop() ?? "bin",
              speed,
            ),
      );
    } catch (caught) {
      setError(
        canceledRef.current
          ? "Processing canceled. You can adjust the settings and try again."
          : caught instanceof Error
            ? caught.message
            : "Media processing failed.",
      );
    } finally {
      if (cleanupEngine?.loaded) {
        for (const name of new Set(virtualFiles)) {
          try {
            await cleanupEngine.deleteFile(name);
          } catch {}
        }
      }
      setBusy(false);
    }
  }
  function cancelProcessing() {
    canceledRef.current = true;
    ffmpegRef.current?.terminate();
    ffmpegRef.current = null;
    setBusy(false);
    setProgress(0);
    setError("Processing canceled. You can adjust the settings and try again.");
  }
  function resetWorkbench() {
    if (busy) cancelProcessing();
    clearResult();
    setFiles([]);
    setSourceUrls([]);
    setSubtitle(null);
    setAnalysis("");
    setBpmAnalysis(null);
    setMediaInfo("");
    setMediaDetails(null);
    setTrackDurations([]);
    setError("");
    setProgress(0);
    setRecordingSeconds(0);
    setRecordingPaused(false);
    recordingPausedRef.current = false;
  }
  function stopLevelMeter() {
    if (levelFrameRef.current !== null) {
      cancelAnimationFrame(levelFrameRef.current);
      levelFrameRef.current = null;
    }
    setInputLevel(0);
  }
  function updateRecordingClock() {
    const active = recordingStartedAtRef.current
      ? performance.now() - recordingStartedAtRef.current
      : 0;
    setRecordingSeconds((recordingAccumulatedRef.current + active) / 1000);
  }
  async function toggleRecording() {
    if (recording) {
      if (!recordingPaused) {
        recordingAccumulatedRef.current +=
          performance.now() - recordingStartedAtRef.current;
      }
      recorderRef.current?.stop();
      setRecording(false);
      setRecordingPaused(false);
      recordingPausedRef.current = false;
      setRecordingSeconds(recordingAccumulatedRef.current / 1000);
      stopLevelMeter();
      return;
    }
    try {
      clearResult();
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMime = [
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(
        stream,
        preferredMime ? { mimeType: preferredMime } : undefined,
      );
      chunksRef.current = [];
      recordingAccumulatedRef.current = 0;
      recordingStartedAtRef.current = performance.now();
      setRecordingSeconds(0);
      recordingPausedRef.current = false;
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const fileExtension = recorder.mimeType.includes("mp4")
          ? "m4a"
          : recorder.mimeType.includes("ogg")
            ? "ogg"
            : "webm";
        const safeName =
          recordingName.trim().replace(/[^a-z0-9_-]+/gi, "-") ||
          "voice-recording";
        setBlob(blob, `${safeName}.${fileExtension}`);
        stream.getTracks().forEach((track) => track.stop());
        stopLevelMeter();
        void audioContextRef.current?.close();
        audioContextRef.current = null;
      };
      recorderRef.current = recorder;
      const context = new AudioContext();
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      context.createMediaStreamSource(stream).connect(analyser);
      audioContextRef.current = context;
      const samples = new Uint8Array(analyser.fftSize);
      let previousUpdate = 0;
      const measureLevel = (time: number) => {
        analyser.getByteTimeDomainData(samples);
        let energy = 0;
        for (const sample of samples) {
          const centered = (sample - 128) / 128;
          energy += centered * centered;
        }
        if (time - previousUpdate > 80) {
          if (recordingPausedRef.current) {
            setInputLevel(0);
          } else {
            setInputLevel(Math.min(1, Math.sqrt(energy / samples.length) * 3.5));
            updateRecordingClock();
          }
          previousUpdate = time;
        }
        levelFrameRef.current = requestAnimationFrame(measureLevel);
      };
      levelFrameRef.current = requestAnimationFrame(measureLevel);
      recorder.start(500);
      setRecording(true);
      setRecordingPaused(false);
      recordingPausedRef.current = false;
    } catch {
      setError("Microphone permission was not granted.");
    }
  }
  function toggleRecordingPause() {
    const recorder = recorderRef.current;
    if (!recorder || !recording) return;
    if (recordingPaused) {
      recorder.resume();
      recordingStartedAtRef.current = performance.now();
      setRecordingPaused(false);
      recordingPausedRef.current = false;
    } else {
      recorder.pause();
      recordingAccumulatedRef.current +=
        performance.now() - recordingStartedAtRef.current;
      setRecordingSeconds(recordingAccumulatedRef.current / 1000);
      setRecordingPaused(true);
      recordingPausedRef.current = true;
      setInputLevel(0);
    }
  }
  function moveTrack(index: number, offset: number) {
    const target = index + offset;
    if (target < 0 || target >= files.length) return;
    const next = [...files];
    [next[index], next[target]] = [next[target], next[index]];
    void selectFiles(next);
  }
  const sourceIsAudio =
    slug !== "audio-extractor" &&
    (slug.startsWith("audio-") ||
      slug === "bpm-detector" ||
      slug === "volume-normalizer");
  const multiple = slug === "audio-joiner";
  const configurableAudio = ["audio-extractor", "audio-format-switcher", "audio-joiner"].includes(slug);
  const estimatedSize = mediaDetails
    ? estimatedAudioSize(mediaDetails.duration, format, bitrate, sampleRate, channels)
    : 0;
  const processLabel =
    slug === "bpm-detector"
      ? "Detect BPM"
      : slug === "volume-normalizer"
        ? "Normalize audio"
      : slug === "audio-joiner"
          ? combineMode === "mix"
            ? "Mix tracks together"
            : "Join tracks in order"
          : slug === "audio-format-switcher"
            ? "Convert audio"
            : slug === "audio-extractor"
              ? "Extract audio"
              : "Process media";
  if (slug === "voice-recorder")
    return (
      <section className="mx-auto max-w-3xl overflow-hidden rounded-[var(--radius-xl)] border border-[var(--outline-soft)] bg-[var(--surface-card)] shadow-[var(--shadow-soft)]">
        <div className="bg-[linear-gradient(145deg,var(--surface-cta),var(--accent-700))] p-6 text-center text-white sm:p-8">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em]">
            <span className={`h-2 w-2 rounded-full ${recording && !recordingPaused ? "motion-pulse-ring bg-red-400" : "bg-white/60"}`} />
            {recording ? (recordingPaused ? "Paused" : "Recording locally") : result ? "Take complete" : "Microphone studio"}
          </div>
          <p className="mt-6 font-mono text-5xl font-semibold tabular-nums tracking-tight sm:text-6xl">
            {Math.floor(recordingSeconds / 60).toString().padStart(2, "0")}:
            {Math.floor(recordingSeconds % 60).toString().padStart(2, "0")}
          </p>
          <div
            className="mx-auto mt-7 flex h-20 max-w-xl items-end justify-center gap-1 rounded-2xl border border-white/15 bg-black/10 px-4 py-3"
            aria-label={`Microphone input level ${Math.round(inputLevel * 100)} percent`}
          >
            {Array.from({ length: 28 }, (_, index) => {
              const centerDistance = Math.abs(index - 13.5) / 13.5;
              const shape = 0.35 + (1 - centerDistance) * 0.65;
              const activeHeight = recordingPaused
                ? 10
                : Math.max(10, inputLevel * shape * 100);
              return (
                <span
                  key={index}
                  className="w-1.5 rounded-full bg-white/80 transition-[height] duration-75"
                  style={{ height: `${activeHeight}%` }}
                />
              );
            })}
          </div>
          <p className="mt-3 text-xs text-white/70">
            {recording
              ? recordingPaused
                ? "Resume when you are ready to continue this take."
                : "Speak naturally and keep the level moving below its maximum."
              : "Your microphone stream and recording stay in this browser session."}
          </p>
        </div>
        <div className="p-5 sm:p-6">
          <label className="block text-left text-sm font-medium text-[var(--ink-900)]">
            Recording name
            <Input
              className="mt-2"
              value={recordingName}
              maxLength={80}
              disabled={recording}
              onChange={(event) => setRecordingName(event.target.value)}
            />
          </label>
          <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
            <Button onClick={() => void toggleRecording()}>
              {recording ? "Stop and save" : result ? "Record a new take" : "Start recording"}
            </Button>
            {recording ? (
              <Button variant="secondary" onClick={toggleRecordingPause}>
                {recordingPaused ? "Resume recording" : "Pause recording"}
              </Button>
            ) : null}
          </div>
        {result ? (
          <div className="mx-auto mt-5 max-w-xl text-left">
            <AudioPreview
              src={result.url}
              title={result.name}
              tone="result"
              metadata={{
                size: result.size,
                format: extension(result.name),
                duration: recordingSeconds,
              }}
            />
          </div>
        ) : null}
        {result ? (
          <div className="mt-3 flex flex-col justify-center gap-2 sm:flex-row">
            <Button onClick={() => download(result)}>Download recording</Button>
            <Button variant="ghost" onClick={resetWorkbench}>Reset</Button>
          </div>
        ) : null}
        <PrivacyNotice />
        <WorkbenchError message={error} />
        </div>
      </section>
    );
  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[var(--radius-xl)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <h2 className="text-lg font-semibold text-[var(--ink-900)]">
          Media source
        </h2>
        <FileDropzone
          accept={sourceIsAudio ? "audio/*,.flac,.m4a,.aac,.ogg,.wav,.mp3" : "video/*,.mkv,.mov,.webm,.mp4,.m4v,.avi"}
          files={files}
          multiple={multiple}
          maxFiles={multiple ? 20 : 1}
          maxFileSize={1024 * 1024 * 1024}
          maxTotalSize={1.5 * 1024 * 1024 * 1024}
          disabled={busy}
          label={multiple ? "Choose audio tracks" : `Choose ${sourceIsAudio ? "audio" : "video"}`}
          hint={sourceIsAudio ? "MP3, WAV, AAC, M4A, OGG, FLAC, or WebM audio" : "MP4, WebM, MOV, MKV, M4V, or AVI"}
          onError={setError}
          onFiles={(next) => void selectFiles(next)}
        />
        {mediaInfo ? <p className="mt-2 text-xs text-[var(--muted-foreground)]">{mediaInfo}</p> : null}
        {sourceIsAudio && files.length && sourceUrls[0] ? (
          <div className="mt-4">
            <AudioPreview
              src={sourceUrls[0]}
              title={multiple ? `First track · ${files[0].name}` : files[0].name}
              metadata={{
                size: files[0].size,
                format: extension(files[0].name),
                duration: multiple ? undefined : mediaDetails?.duration,
                bitrateKbps:
                  !multiple && mediaDetails?.duration
                    ? Math.round((files[0].size * 8) / mediaDetails.duration / 1000)
                    : undefined,
              }}
            />
          </div>
        ) : null}
        {multiple && files.length ? (
          <div className="mt-4 rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-panel)] p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">Join order</p>
              <span className="text-xs text-[var(--muted-foreground)]">{files.length} tracks</span>
            </div>
            <ol className="space-y-2">
              {files.map((file, index) => (
                <li key={`${file.name}-${file.lastModified}-${index}`} className="flex min-h-11 items-center gap-2 rounded-xl bg-[var(--surface-raised)] px-3 py-2">
                  <span className="w-5 shrink-0 text-xs font-bold tabular-nums text-[var(--accent-700)]">{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-[var(--ink-900)]">{file.name}</span>
                  <button type="button" className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--outline-soft)] disabled:opacity-30" disabled={index === 0 || busy} onClick={() => moveTrack(index, -1)} aria-label={`Move ${file.name} earlier`}>↑</button>
                  <button type="button" className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--outline-soft)] disabled:opacity-30" disabled={index === files.length - 1 || busy} onClick={() => moveTrack(index, 1)} aria-label={`Move ${file.name} later`}>↓</button>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
        {slug === "audio-joiner" ? (
          <fieldset className="mt-4">
            <legend className="text-sm font-medium text-[var(--ink-900)]">
              Combine mode
            </legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {(
                [
                  {
                    value: "sequence",
                    title: "Join in sequence",
                    detail: "Track 2 starts after track 1 ends.",
                  },
                  {
                    value: "mix",
                    title: "Mix simultaneously",
                    detail: "All tracks start together and are balanced.",
                  },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  disabled={busy}
                  className={`rounded-xl border p-3 text-left transition ${
                    combineMode === mode.value
                      ? "border-[var(--accent-400)] bg-[var(--accent-50)] ring-1 ring-[var(--accent-300)]"
                      : "border-[var(--outline-soft)] bg-[var(--surface-raised)] hover:border-[var(--accent-300)]"
                  }`}
                  onClick={() => {
                    setCombineMode(mode.value);
                    if (mediaDetails && trackDurations.length) {
                      const duration =
                        mode.value === "mix"
                          ? Math.max(...trackDurations)
                          : trackDurations.reduce((sum, value) => sum + value, 0);
                      setMediaDetails({ ...mediaDetails, duration });
                      setMediaInfo(
                        `${files.length} tracks · ${duration.toFixed(2)} seconds · ${formatBytes(mediaDetails.size)}`,
                      );
                    }
                  }}
                >
                  <span className="block text-xs font-bold text-[var(--ink-900)]">
                    {mode.title}
                  </span>
                  <span className="mt-1 block text-[11px] leading-5 text-[var(--muted-foreground)]">
                    {mode.detail}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}
        {configurableAudio ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Output format
              <select
                className="mt-2 h-12 w-full rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] px-4"
                value={format}
                onChange={(event) => setFormat(event.target.value)}
              >
                {["mp3", "m4a", "aac", "ogg", "webm", "wav", "flac"].map((value) => (
                  <option key={value} value={value}>{value.toUpperCase()}</option>
                ))}
              </select>
            </label>
            {!['wav', 'flac'].includes(format) ? (
              <label className="text-sm font-medium">
                Audio bitrate
                <select className="mt-2 h-12 w-full rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] px-4" value={bitrate} onChange={(event) => setBitrate(Number(event.target.value))}>
                  {[96, 128, 192, 256, 320].map((value) => <option key={value} value={value}>{value} kbps</option>)}
                </select>
              </label>
            ) : null}
            <label className="text-sm font-medium">
              Sample rate
              <select className="mt-2 h-12 w-full rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] px-4" value={sampleRate} onChange={(event) => setSampleRate(Number(event.target.value))}>
                <option value={32000}>32 kHz</option>
                <option value={44100}>44.1 kHz</option>
                <option value={48000}>48 kHz</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              Channels
              <select className="mt-2 h-12 w-full rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] px-4" value={channels} onChange={(event) => setChannels(Number(event.target.value))}>
                <option value={1}>Mono</option>
                <option value={2}>Stereo</option>
              </select>
            </label>
            {estimatedSize ? (
              <div className="rounded-2xl border border-[var(--accent-200)] bg-[var(--accent-50)] p-3 text-sm sm:col-span-2">
                <p className="font-semibold text-[var(--accent-700)]">Estimated output · {formatBytes(estimatedSize)}</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">Final size can vary with source complexity and encoder overhead.</p>
              </div>
            ) : null}
          </div>
        ) : null}
        {slug === "volume-normalizer" ? (
          <label className="mt-4 block text-sm font-medium">
            Target peak: {targetPeakDb.toFixed(1)} dBFS
            <input className="mt-3 w-full accent-[var(--accent-500)]" type="range" min="-6" max="-0.1" step="0.1" value={targetPeakDb} onChange={(event) => setTargetPeakDb(Number(event.target.value))} />
            <span className="mt-1 block text-xs font-normal text-[var(--muted-foreground)]">Keeps the loudest sample below clipping; −1 dBFS is a safe general target.</span>
          </label>
        ) : null}
        {slug === "video-compressor" ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Target size (MB)
              <Input
                className="mt-2"
                type="number"
                min="1"
                max="2000"
                value={targetSize}
                onChange={(event) => setTargetSize(Number(event.target.value))}
              />
            </label>
            <label className="text-sm font-medium">
              Duration (seconds)
              <Input
                className="mt-2"
                type="number"
                min="1"
                value={end}
                onChange={(event) => setEnd(Number(event.target.value))}
              />
            </label>
          </div>
        ) : null}
        {slug === "thumbnail-grabber" ? (
          <label className="mt-4 block text-sm font-medium">
            Timestamp (seconds)
            <Input
              className="mt-2"
              type="number"
              min="0"
              step="0.1"
              value={timestamp}
              onChange={(event) => setTimestamp(Number(event.target.value))}
            />
          </label>
        ) : null}
        {slug === "video-clipper" ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="text-sm font-medium">
              Start seconds
              <Input
                className="mt-2"
                type="number"
                min="0"
                step="0.1"
                value={start}
                onChange={(event) => setStart(Number(event.target.value))}
              />
            </label>
            <label className="text-sm font-medium">
              End seconds
              <Input
                className="mt-2"
                type="number"
                min="0.1"
                step="0.1"
                value={end}
                onChange={(event) => setEnd(Number(event.target.value))}
              />
            </label>
          </div>
        ) : null}
        {slug === "video-speed-adjuster" ? (
          <label className="mt-4 block text-sm font-medium">
            Playback speed: {speed}×
            <input
              className="mt-3 w-full accent-[var(--accent-500)]"
              type="range"
              min="0.25"
              max="4"
              step="0.25"
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
            />
          </label>
        ) : null}
        {slug === "subtitles-burner" ? (
          <label className="mt-4 block text-sm font-medium">
            SRT captions
            <Input
              className="mt-2"
              type="file"
              accept=".srt,application/x-subrip,text/plain"
              onChange={(event) => setSubtitle(event.target.files?.[0] ?? null)}
            />
          </label>
        ) : null}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button className="w-full sm:flex-1" disabled={busy || !files.length} onClick={() => void processMedia()}>{processLabel}</Button>
          {files.length || result || analysis ? <Button type="button" variant="secondary" onClick={resetWorkbench}>Reset</Button> : null}
        </div>
        <ProcessingProgress
          active={busy}
          progress={["bpm-detector", "volume-normalizer", "thumbnail-grabber"].includes(slug) ? undefined : progress}
          label="Processing locally"
          onCancel={["bpm-detector", "volume-normalizer", "thumbnail-grabber"].includes(slug) ? undefined : cancelProcessing}
        />
        <p className="mt-3 text-xs leading-5 text-[var(--muted-foreground)]">
          The first FFmpeg operation loads a 31 MB local WebAssembly engine.
          Large files require enough device memory to hold input and output.
        </p>
        <PrivacyNotice />
        <WorkbenchError message={error} />
      </section>
      <section className="rounded-[var(--radius-xl)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--ink-900)]">
            Result
          </h2>
          {result ? (
            <Button size="sm" onClick={() => download(result)}>
              Download
            </Button>
          ) : null}
        </div>
        {analysis ? (
          slug === "bpm-detector" && bpmAnalysis ? (
            <div className="mt-4 space-y-4">
              <div className="overflow-hidden rounded-xl border border-[var(--outline-soft)] bg-[linear-gradient(145deg,var(--surface-cta),var(--accent-700))] p-6 text-center text-white">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                  Estimated tempo
                </p>
                <p className="mt-3 text-6xl font-semibold tabular-nums tracking-tight">
                  {bpmAnalysis.bpm}
                </p>
                <p className="mt-1 text-sm font-bold uppercase tracking-[0.18em] text-white/80">
                  BPM
                </p>
                <div className="relative mx-auto mt-6 h-2 max-w-sm rounded-full bg-white/20">
                  <span
                    className="absolute top-1/2 h-5 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow"
                    style={{
                      left: `${Math.max(0, Math.min(100, ((bpmAnalysis.bpm - 70) / 120) * 100))}%`,
                    }}
                  />
                </div>
                <div className="mx-auto mt-2 flex max-w-sm justify-between text-[10px] font-semibold text-white/60">
                  <span>70</span>
                  <span>130</span>
                  <span>190</span>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-3">
                  <dt className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted-foreground)]">Tempo feel</dt>
                  <dd className="mt-1 font-semibold text-[var(--ink-900)]">
                    {bpmAnalysis.bpm < 90 ? "Slow" : bpmAnalysis.bpm < 120 ? "Moderate" : bpmAnalysis.bpm < 150 ? "Upbeat" : "Fast"}
                  </dd>
                </div>
                <div className="rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-3">
                  <dt className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted-foreground)]">Rhythmic peaks</dt>
                  <dd className="mt-1 font-semibold tabular-nums text-[var(--ink-900)]">{bpmAnalysis.detectedPeaks}</dd>
                </div>
              </dl>
              {bpmAnalysis.alternatives.length ? (
                <div className="rounded-xl border border-[var(--accent-200)] bg-[var(--accent-50)] p-4 text-sm text-[var(--accent-700)]">
                  <p className="font-semibold">Alternative tempo candidates</p>
                  <p className="mt-1 font-mono">{bpmAnalysis.alternatives.join(" · ")} BPM</p>
                </div>
              ) : null}
              <p className="text-xs leading-5 text-[var(--muted-foreground)]">
                Energy-peak estimates can vary with syncopation, long intros, or changing tempo. Verify by ear before beat-critical editing.
              </p>
            </div>
          ) : (
            <pre className="tool-output-scroll mt-4 whitespace-pre-wrap rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-5 text-sm leading-7">
              {analysis}
            </pre>
          )
        ) : result ? (
          <div className="mt-5">
            <video
              controls={result.type.startsWith("video/")}
              className={`w-full rounded-xl bg-black ${result.type.startsWith("video/") ? "" : "hidden"}`}
              src={result.url}
            />
            {result.type.startsWith("image/") ? (
              <img src={result.url} alt={`Preview of ${result.name}`} className="max-h-96 w-full rounded-xl bg-white object-contain" />
            ) : null}
            {result.type.startsWith("audio/") ? (
              <AudioPreview
                src={result.url}
                title={result.name}
                tone="result"
                metadata={{
                  size: result.size,
                  format: extension(result.name),
                  duration: mediaDetails?.duration,
                  bitrateKbps: ["wav", "flac"].includes(extension(result.name)) ? undefined : bitrate,
                  sampleRate: slug === "volume-normalizer" ? undefined : sampleRate,
                  channels: slug === "volume-normalizer" ? undefined : channels,
                }}
              />
            ) : null}
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-200">
              <p className="font-semibold">{result.name}</p>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
                {mediaDetails ? (
                  <div>
                    <dt className="text-xs opacity-70">Original size</dt>
                    <dd className="mt-0.5 font-semibold tabular-nums">{formatBytes(mediaDetails.size)}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-xs opacity-70">Output size</dt>
                  <dd className="mt-0.5 font-semibold tabular-nums">{formatBytes(result.size)}</dd>
                </div>
                {mediaDetails ? (
                  <div>
                    <dt className="text-xs opacity-70">Size change</dt>
                    <dd className="mt-0.5 font-semibold tabular-nums">{sizeChangeLabel(mediaDetails.size, result.size)}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-xs opacity-70">Output format</dt>
                  <dd className="mt-0.5 font-semibold uppercase">{extension(result.name)}</dd>
                </div>
                {result.type.startsWith("video/") && mediaDetails?.duration ? (
                  <div>
                    <dt className="text-xs opacity-70">Output duration</dt>
                    <dd className="mt-0.5 font-semibold tabular-nums">
                      {(slug === "video-clipper"
                        ? end - start
                        : slug === "video-speed-adjuster"
                          ? mediaDetails.duration / speed
                          : mediaDetails.duration
                      ).toFixed(2)} seconds
                    </dd>
                  </div>
                ) : null}
                {result.type.startsWith("video/") && mediaDetails?.width ? (
                  <div>
                    <dt className="text-xs opacity-70">Dimensions</dt>
                    <dd className="mt-0.5 font-semibold tabular-nums">
                      {slug === "video-compressor" && mediaDetails.width > 1280
                        ? `${1280}×${Math.round(mediaDetails.height * (1280 / mediaDetails.width))}`
                        : `${mediaDetails.width}×${mediaDetails.height}`}
                    </dd>
                  </div>
                ) : null}
                {result.type.startsWith("video/") ? (
                  <div>
                    <dt className="text-xs opacity-70">Output codec</dt>
                    <dd className="mt-0.5 font-semibold">H.264{slug === "video-muter" ? " · no audio" : " · AAC"}</dd>
                  </div>
                ) : null}
              </dl>
              {mediaDetails && result.size > mediaDetails.size ? (
                <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                  The output is larger than the source. Try a lower bitrate, smaller dimensions, or a more efficient format if file size is your goal.
                </p>
              ) : null}
            </div>
            <Button variant="secondary" className="mt-3 w-full" onClick={resetWorkbench}>Process another file</Button>
          </div>
        ) : (
          <div className="mt-4 flex min-h-72 items-center justify-center rounded-xl border border-dashed border-[var(--outline-strong)] px-6 text-center text-sm text-[var(--muted-foreground)]">
            Your processed media and analysis will appear here.
          </div>
        )}
      </section>
    </div>
  );
}
