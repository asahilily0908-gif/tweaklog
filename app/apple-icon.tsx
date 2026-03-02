import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 36,
          background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: 120,
            fontWeight: 700,
          }}
        >
          T
        </div>
      </div>
    ),
    { ...size }
  );
}
