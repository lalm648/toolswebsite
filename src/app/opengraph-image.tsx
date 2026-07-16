import { ImageResponse } from "next/og";

export const alt = "ToolsWebsite — private browser tools for everyday work";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#f5f7fb",
          color: "#0f172a",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          padding: "72px",
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "flex-start",
            background: "white",
            border: "2px solid #e6e9ef",
            borderRadius: "42px",
            boxShadow: "0 28px 80px rgba(15, 23, 42, 0.12)",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            justifyContent: "space-between",
            padding: "62px 68px",
            width: "100%",
          }}
        >
          <div style={{ alignItems: "center", display: "flex", fontSize: 34, fontWeight: 700, gap: 18 }}>
            <div
              style={{
                alignItems: "center",
                background: "#2563eb",
                borderRadius: 18,
                color: "white",
                display: "flex",
                height: 62,
                justifyContent: "center",
                width: 62,
              }}
            >
              T
            </div>
            ToolsWebsite
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 68, fontWeight: 800, letterSpacing: "-3px", lineHeight: 1.05 }}>
              Useful tools. Private by default.
            </div>
            <div style={{ color: "#64748b", fontSize: 28, lineHeight: 1.4, marginTop: 24 }}>
              Convert images, clean text, format data, and build metadata — directly in your browser.
            </div>
          </div>

          <div style={{ color: "#1d4ed8", display: "flex", fontSize: 22, fontWeight: 700, gap: 28 }}>
            <span>Free to use</span>
            <span>No sign-up</span>
            <span>No server uploads</span>
          </div>
        </div>
      </div>
    ),
    size
  );
}
