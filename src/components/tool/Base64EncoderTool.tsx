"use client";

import { useState } from "react";
import ToolResult from "@/components/tool/ToolResult";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trackEvent, trackToolFailure } from "@/lib/analytics";

function encodeBase64(value: string) {
  return btoa(unescape(encodeURIComponent(value)));
}

function decodeBase64(value: string) {
  return decodeURIComponent(escape(atob(value)));
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
    } catch {
      setOutput("");
      setError("This Base64 value could not be decoded.");
      trackToolFailure("base64-encoder", "decode", "decoding_failed", {
        input_length: input.length,
      });
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <div className="rounded-[1.35rem] border border-(--outline-soft) bg-(--surface-card) p-6 shadow-(--shadow-soft)">
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
        {error ? <p className="mt-4 text-sm text-(--brand-600)">{error}</p> : null}
      </div>

      <ToolResult title="Output">
        <Textarea readOnly value={output} placeholder="Encoded or decoded output will appear here..." className="min-h-90" />
      </ToolResult>
    </div>
  );
}
