"use client";

import { useState } from "react";
import ToolResult from "@/components/tool/ToolResult";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
      setOutput(encodeBase64(input));
      setError("");
    } catch {
      setOutput("");
      setError("This text could not be encoded.");
    }
  }

  function handleDecode() {
    try {
      setOutput(decodeBase64(input));
      setError("");
    } catch {
      setOutput("");
      setError("This Base64 value could not be decoded.");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <div className="rounded-[1.35rem] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-xl font-semibold text-[var(--ink-900)]">Input</h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Encode plain text to Base64 or decode Base64 back to readable text.
        </p>
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Paste text or Base64 here..."
          className="mt-5 min-h-[360px]"
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={handleEncode}>Encode</Button>
          <Button variant="secondary" onClick={handleDecode}>
            Decode
          </Button>
        </div>
        {error ? <p className="mt-4 text-sm text-[var(--brand-600)]">{error}</p> : null}
      </div>

      <ToolResult title="Output">
        <Textarea readOnly value={output} placeholder="Encoded or decoded output will appear here..." className="min-h-[360px]" />
      </ToolResult>
    </div>
  );
}
