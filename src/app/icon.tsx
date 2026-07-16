import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#2563eb",
          color: "white",
          display: "flex",
          fontSize: 300,
          fontWeight: 800,
          height: "100%",
          justifyContent: "center",
          letterSpacing: "-20px",
          width: "100%",
        }}
      >
        T
      </div>
    ),
    size
  );
}
