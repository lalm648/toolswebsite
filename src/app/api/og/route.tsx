import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

// ImageResponse pulls in more than Vercel's 1 MB Edge Function allowance on
// the current plan. The Node.js runtime supports the same route while using
// the standard serverless-function bundle limit.
export const runtime = "nodejs";

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1).trim()}…` : value;
}

export async function GET(request: NextRequest) {
  const title = truncate(request.nextUrl.searchParams.get("title") || "Free Online Tools", 72);
  const category = truncate(request.nextUrl.searchParams.get("category") || "Private browser tools", 42);

  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "linear-gradient(135deg, #eef4ff 0%, #f8fafc 52%, #fdf2f8 100%)",
        color: "#0f172a",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        padding: "56px",
        width: "100%",
      }}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.94)",
          border: "2px solid #dbe6ff",
          borderRadius: "38px",
          boxShadow: "0 32px 90px rgba(30,64,175,0.15)",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: "54px 62px",
          width: "100%",
        }}
      >
        <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
          <div style={{ alignItems: "center", display: "flex", fontSize: 30, fontWeight: 800, gap: 15 }}>
            <div style={{ alignItems: "center", background: "#2563eb", borderRadius: 16, color: "white", display: "flex", height: 56, justifyContent: "center", width: 56 }}>T</div>
            ToolsWebsite
          </div>
          <div style={{ background: "#eff4ff", border: "1px solid #bfd3ff", borderRadius: 999, color: "#1e40af", display: "flex", fontSize: 18, fontWeight: 700, padding: "10px 18px" }}>{category}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: title.length > 54 ? 54 : 64, fontWeight: 850, letterSpacing: "-2.5px", lineHeight: 1.08 }}>{title}</div>
          <div style={{ color: "#64748b", display: "flex", fontSize: 25, lineHeight: 1.4, marginTop: 22 }}>Fast, focused tools that work from your browser.</div>
        </div>

        <div style={{ color: "#1d4ed8", display: "flex", fontSize: 20, fontWeight: 750, gap: 30 }}>
          <span>Free to use</span><span>•</span><span>No sign-up</span><span>•</span><span>Privacy-first</span>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    },
  );
}
