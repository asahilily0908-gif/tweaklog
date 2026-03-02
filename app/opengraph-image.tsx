import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Tweaklog — Log the tweak. See the lift.";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 50%, #1e1b4b 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow effects */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -80,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            zIndex: 1,
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  color: "white",
                  fontSize: 28,
                  fontWeight: 700,
                }}
              >
                T
              </div>
            </div>
            <div
              style={{
                color: "white",
                fontSize: 42,
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              Tweaklog
            </div>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 52,
              fontWeight: 700,
              color: "white",
              textAlign: "center",
              lineHeight: 1.3,
              maxWidth: 900,
              letterSpacing: "-0.02em",
            }}
          >
            Log the tweak. See the lift.
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 22,
              color: "rgba(148, 163, 184, 1)",
              textAlign: "center",
              maxWidth: 700,
              lineHeight: 1.5,
            }}
          >
            Ad change logs × Impact analysis × AI insights
          </div>

          {/* Feature pills */}
          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 8,
            }}
          >
            {["Change Log", "Impact Card", "AI Chat"].map((label) => (
              <div
                key={label}
                style={{
                  padding: "8px 20px",
                  borderRadius: 100,
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                  background: "rgba(59, 130, 246, 0.1)",
                  color: "#93c5fd",
                  fontSize: 18,
                  fontWeight: 500,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background:
              "linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6)",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
