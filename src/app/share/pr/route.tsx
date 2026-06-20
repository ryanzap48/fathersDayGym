import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

/**
 * A shareable PR card image. Driven entirely by query params, so it's public
 * and crawlable: /share/pr?exercise=Bench&label=Est.%201RM&value=230%20lb
 */
export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const exercise = searchParams.get("exercise") ?? "Personal Record";
  const label = searchParams.get("label") ?? "New PR";
  const value = searchParams.get("value") ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#fcfcfb",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "#e2502c" }} />
          <span style={{ fontSize: 28, letterSpacing: 6, color: "#e2502c", fontWeight: 600 }}>
            LIFT
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 34, color: "#71717a" }}>🏆 {label}</span>
          <span style={{ fontSize: 72, fontWeight: 700, color: "#18181b", marginTop: 8 }}>
            {exercise}
          </span>
          <span style={{ fontSize: 120, fontWeight: 700, color: "#e2502c", marginTop: 8 }}>
            {value}
          </span>
        </div>

        <span style={{ fontSize: 26, color: "#a1a1aa" }}>Tracked with Lift</span>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
