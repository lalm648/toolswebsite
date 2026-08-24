"use client";

import { useState } from "react";
import CopyButton from "@/components/tool/CopyButton";
import ToolResult from "@/components/tool/ToolResult";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trackEvent, trackToolFailure } from "@/lib/analytics";

function encodeBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  // Chunked so multi-megabyte input does not build one giant string byte by byte.
  const chunkSize = 0x8000;
  let binary = "";

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }

  return btoa(binary);
}

function decodeBase64(value: string) {
  // Accept URL-safe Base64, stray whitespace/newlines, and missing padding.
  let normalized = value.trim().replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");

  // Reject anything outside the alphabet up front. atob is lenient enough that plain
  // prose could slip through and come back as mojibake presented as a real decode.
  if (!normalized.length || !/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) {
    throw new Error("not-base64");
  }

  const remainder = normalized.length % 4;
  if (remainder === 1) {
    throw new Error("not-base64");
  }
  if (remainder) {
    normalized += "=".repeat(4 - remainder);
  }

  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  // fatal:true so invalid UTF-8 raises instead of yielding replacement characters.
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export default function Base64EncoderTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  function handleEncode() {
    try {
      const nextOutput = encodeBase64(input);
      setOutput(nextOutput);
      setError("");
      trackEvent("encode_base64", {
        tool_slug: "base64-encoder",
        input_length: input.length,
        output_length: nextOutput.length,
      });
    } catch {
      setOutput("");
      setError("This text could not be encoded.");
      trackToolFailure("base64-encoder", "encode", "encoding_failed", {
        input_length: input.length,
      });
    }
  }

  function handleDecode() {
    try {
      const nextOutput = decodeBase64(input);
      setOutput(nextOutput);
      setError("");
      trackEvent("decode_base64", {
        tool_slug: "base64-encoder",
        input_length: input.length,
        output_length: nextOutput.length,
      });
    } catch (caught) {
      setOutput("");
      setError(
        caught instanceof Error && caught.message === "not-base64"
          ? "That is not valid Base64. Check for missing characters, or use Encode instead."
          : "This decoded to data that is not valid UTF-8 text, so it is probably a binary file rather than text."
      );
      trackToolFailure("base64-encoder", "decode", "decoding_failed", {
        input_length: input.length,
      });
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <div className="rounded-[var(--radius-xl)] border border-(--outline-soft) bg-(--surface-card) p-6 shadow-(--shadow-soft)">
        <h2 className="text-xl font-semibold text-(--ink-900)">Input</h2>
        <p className="mt-2 text-sm text-(--muted-foreground)">
          Encode plain text to Base64 or decode Base64 back to readable text.
        </p>
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Paste text or Base64 here..."
          className="mt-5 min-h-90"
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={handleEncode}>Encode</Button>
          <Button variant="secondary" onClick={handleDecode}>
            Decode
          </Button>
        </div>
        {error ? <p className="mt-4 text-sm text-[var(--error-foreground)]">{error}</p> : null}
      </div>

      <ToolResult title="Output">
        <Textarea readOnly value={output} placeholder="Encoded or decoded output will appear here..." className="tool-output-scroll" />
        <div className="mt-4 flex flex-wrap gap-3">
          <CopyButton value={output} label="Copy output" disabled={!output} />
        </div>
      </ToolResult>
    </div>
  );
}
