"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBytes } from "@/lib/image-conversion";

type MediaUtilityWorkbenchProps = { slug: string };
type MediaResult = { url: string; name: string; size: number; type: string };

function extension(fileName: string) {
  return (
    fileName
      .split(".")
      .pop()
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, "") || "bin"
  );
}
function replaceExtension(fileName: string, next: string) {
  return `${fileName.replace(/\.[^.]+$/, "")}.${next}`;
}
function download(result: MediaResult) {
  const anchor = document.createElement("a");
  anchor.href = result.url;
  anchor.download = result.name;
  anchor.click();
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

async function analyzeBpm(file: File) {
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
    const best = [...histogram].sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!best) throw new Error("Not enough rhythmic peaks were found.");
    return best;
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
  const ffmpegRef = useRef<import("@ffmpeg/ffmpeg").FFmpeg | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  useEffect(() => {
    return () => {
      ffmpegRef.current?.terminate();
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);
  useEffect(() => {
    return () => {
      if (result?.url) URL.revokeObjectURL(result.url);
    };
  }, [result]);
  function setBlob(blob: Blob, name: string) {
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult({
      url: URL.createObjectURL(blob),
      name,
      size: blob.size,
      type: blob.type,
    });
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
    setBusy(true);
    setError("");
    setAnalysis("");
    setProgress(0);
    try {
      if (slug === "bpm-detector") {
        const bpm = await analyzeBpm(files[0]);
        setAnalysis(
          `Estimated tempo: ${bpm} BPM\n\nThis is an energy-peak estimate. Tracks with syncopation, long intros, or changing tempo may need manual verification.`,
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
          const gain = 0.95 / peak;
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
            `Applied gain: ${gain.toFixed(3)}×\nOriginal peak: ${(20 * Math.log10(peak)).toFixed(1)} dBFS\nOutput peak: -0.4 dBFS`,
          );
        } finally {
          void context.close();
        }
        return;
      }
      if (slug === "thumbnail-grabber") {
        const file = files[0],
          url = URL.createObjectURL(file);
        try {
          const video = document.createElement("video");
          video.preload = "metadata";
          video.src = url;
          await new Promise<void>((resolve, reject) => {
            video.onloadedmetadata = () => resolve();
            video.onerror = () =>
              reject(new Error("Video metadata could not be read."));
          });
          video.currentTime = Math.min(
            timestamp,
            Math.max(0, video.duration - 0.01),
          );
          await new Promise<void>((resolve) => {
            video.onseeked = () => resolve();
          });
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext("2d")?.drawImage(video, 0, 0);
          const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, "image/jpeg", 0.94),
          );
          if (!blob) throw new Error("The frame could not be encoded.");
          setBlob(
            blob,
            `${file.name.replace(/\.[^.]+$/, "")}-frame-${timestamp}s.jpg`,
          );
        } finally {
          URL.revokeObjectURL(url);
        }
        return;
      }
      const ffmpeg = await getFfmpeg();
      const { fetchFile } = await import("@ffmpeg/util");
      const inputNames: string[] = [];
      for (let index = 0; index < files.length; index += 1) {
        const name = `input-${index}.${extension(files[index].name)}`;
        inputNames.push(name);
        await ffmpeg.writeFile(name, await fetchFile(files[index]));
      }
      let args: string[] = [],
        outputName = "output.mp4",
        mime = "video/mp4";
      if (slug === "video-compressor") {
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
        mime = format === "wav" ? "audio/wav" : "audio/mpeg";
        args = [
          "-i",
          inputNames[0],
          "-vn",
          ...(format === "wav"
            ? ["-c:a", "pcm_s16le"]
            : ["-c:a", "libmp3lame", "-b:a", "192k"]),
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
        args = ["-i", inputNames[0], "-c:v", "copy", "-an", outputName];
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
        mime =
          format === "wav"
            ? "audio/wav"
            : format === "ogg"
              ? "audio/ogg"
              : "audio/mpeg";
        args = [
          "-i",
          inputNames[0],
          ...(format === "wav"
            ? ["-c:a", "pcm_s16le"]
            : format === "ogg"
              ? ["-c:a", "libvorbis", "-q:a", "5"]
              : ["-c:a", "libmp3lame", "-b:a", "192k"]),
          outputName,
        ];
      } else if (slug === "audio-joiner") {
        outputName = "joined.mp3";
        mime = "audio/mpeg";
        const inputs = inputNames.flatMap((name) => ["-i", name]);
        const streams = inputNames.map((_, index) => `[${index}:a]`).join("");
        args = [
          ...inputs,
          "-filter_complex",
          `${streams}concat=n=${inputNames.length}:v=0:a=1[a]`,
          "-map",
          "[a]",
          "-c:a",
          "libmp3lame",
          "-b:a",
          "192k",
          outputName,
        ];
      }
      const code = await ffmpeg.exec(args, 10 * 60 * 1000);
      if (code !== 0)
        throw new Error(`The media engine stopped with code ${code}.`);
      const data = await ffmpeg.readFile(outputName);
      if (typeof data === "string")
        throw new Error("The media engine returned invalid output.");
      setBlob(
        new Blob([new Uint8Array(data).buffer], { type: mime }),
        replaceExtension(files[0].name, outputName.split(".").pop() ?? "bin"),
      );
      for (const name of [...inputNames, outputName, "captions.srt"])
        try {
          await ffmpeg.deleteFile(name);
        } catch {}
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Media processing failed.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        setBlob(blob, "voice-recording.webm");
        stream.getTracks().forEach((track) => track.stop());
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError("Microphone permission was not granted.");
    }
  }
  const isAudio =
    slug.startsWith("audio-") ||
    slug === "bpm-detector" ||
    slug === "volume-normalizer";
  const multiple = slug === "audio-joiner";
  if (slug === "voice-recorder")
    return (
      <section className="mx-auto max-w-2xl rounded-[1.35rem] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-6 text-center shadow-[var(--shadow-soft)]">
        <div
          className={`mx-auto h-20 w-20 rounded-full ${recording ? "motion-pulse-ring bg-red-500" : "bg-[var(--accent-100)]"}`}
        />
        <h2 className="mt-5 text-2xl font-semibold text-[var(--ink-900)]">
          {recording ? "Recording…" : "Ready to record"}
        </h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Microphone audio stays in this browser session.
        </p>
        <Button className="mt-6" onClick={() => void toggleRecording()}>
          {recording ? "Stop and save" : "Start recording"}
        </Button>
        {result ? (
          <Button
            variant="secondary"
            className="mt-3 sm:ml-3"
            onClick={() => download(result)}
          >
            Download recording
          </Button>
        ) : null}
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </section>
    );
  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[1.35rem] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <h2 className="text-lg font-semibold text-[var(--ink-900)]">
          Media source
        </h2>
        <Input
          className="mt-4"
          type="file"
          accept={isAudio ? "audio/*" : "video/*"}
          multiple={multiple}
          onChange={(event) =>
            setFiles(Array.from(event.target.files ?? []).slice(0, 20))
          }
        />
        {slug === "audio-extractor" || slug === "audio-format-switcher" ? (
          <label className="mt-4 block text-sm font-medium">
            Output format
            <select
              className="mt-2 h-12 w-full rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] px-4"
              value={format}
              onChange={(event) => setFormat(event.target.value)}
            >
              {(slug === "audio-extractor"
                ? ["mp3", "wav"]
                : ["mp3", "ogg", "wav"]
              ).map((value) => (
                <option key={value}>{value.toUpperCase()}</option>
              ))}
            </select>
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
        <Button
          className="mt-5 w-full"
          disabled={busy || !files.length}
          onClick={() => void processMedia()}
        >
          {busy
            ? `Processing locally ${Math.round(progress * 100)}%…`
            : "Process media"}
        </Button>
        <p className="mt-3 text-xs leading-5 text-[var(--muted-foreground)]">
          The first FFmpeg operation loads a 31 MB local WebAssembly engine.
          Large files require enough device memory to hold input and output.
        </p>
        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </section>
      <section className="rounded-[1.35rem] border border-[var(--outline-soft)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
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
          <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-5 text-sm leading-7">
            {analysis}
          </pre>
        ) : result ? (
          <div className="mt-5">
            <video
              controls={result.type.startsWith("video/")}
              className={`w-full rounded-xl bg-black ${result.type.startsWith("video/") ? "" : "hidden"}`}
              src={result.url}
            />
            {result.type.startsWith("audio/") ? (
              <audio controls className="w-full" src={result.url} />
            ) : null}
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <p className="font-semibold">{result.name}</p>
              <p className="mt-1">{formatBytes(result.size)}</p>
            </div>
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
