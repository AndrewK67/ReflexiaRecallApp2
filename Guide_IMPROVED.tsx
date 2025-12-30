import React, { useMemo } from "react";

type GuideState = "idle" | "listening" | "thinking" | "speaking";

export type GuideProps = {
  stageId?: string | null;
  state?: GuideState;
  className?: string;
  customColor?: string;
};

/**
 * Guide - Improved transparent, glowing orb design
 * CRITICAL: pointer-events disabled so it never blocks clicks
 */
export default function Guide({ stageId = null, state = "idle", className = "", customColor }: GuideProps) {
  const { fill, glowOpacity, ringOpacity, pulse } = useMemo(() => {
    const id = (stageId ?? "").toLowerCase();

    const byStage = () => {
      if (id.includes("feel")) return "#f87171";
      if (id.includes("desc") || id.includes("situation")) return "#4ade80";
      if (id.includes("eval") || id.includes("background")) return "#60a5fa";
      if (id.includes("anal") || id.includes("assessment")) return "#c084fc";
      if (id.includes("concl") || id.includes("action") || id.includes("recommend")) return "#fb923c";
      if (id.includes("plan")) return "#facc15";
      if (id.includes("morning")) return "#06b6d4";
      if (id.includes("evening")) return "#9333ea";
      if (id.includes("free")) return "#94a3b8";
      return "#67e8f9";
    };

    const base = typeof customColor === "string" && customColor.trim() ? customColor : byStage();

    const styleByState: Record<GuideState, { glowOpacity: number; ringOpacity: number; pulse: boolean }> = {
      idle: { glowOpacity: 0.6, ringOpacity: 0.2, pulse: false },
      listening: { glowOpacity: 0.75, ringOpacity: 0.35, pulse: true },
      thinking: { glowOpacity: 0.85, ringOpacity: 0.4, pulse: true },
      speaking: { glowOpacity: 0.7, ringOpacity: 0.3, pulse: false },
    };

    return { fill: base, ...styleByState[state] };
  }, [stageId, state, customColor]);

  return (
    <div
      className={`guide-root ${className}`}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <svg
        width="220"
        height="220"
        viewBox="0 0 200 200"
        style={{ pointerEvents: "none" }}
      >
        <defs>
          {/* Enhanced glow filter for more ethereal effect */}
          <filter id="guide-glow-enhanced" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="8" result="blur1" />
            <feGaussianBlur stdDeviation="4" result="blur2" />
            <feGaussianBlur stdDeviation="12" result="blur3" />
            <feMerge>
              <feMergeNode in="blur3" />
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Radial gradient for depth */}
          <radialGradient id="guide-gradient" cx="40%" cy="40%">
            <stop offset="0%" stopColor="white" stopOpacity="0.9" />
            <stop offset="50%" stopColor={fill} stopOpacity="0.7" />
            <stop offset="100%" stopColor={fill} stopOpacity="0.3" />
          </radialGradient>
        </defs>

        {/* Outer glow rings */}
        <circle
          cx="100"
          cy="100"
          r="88"
          fill="none"
          stroke={fill}
          strokeOpacity={ringOpacity * 0.3}
          strokeWidth="1"
        />
        <circle
          cx="100"
          cy="100"
          r="82"
          fill="none"
          stroke={fill}
          strokeOpacity={ringOpacity * 0.5}
          strokeWidth="2"
        />

        {/* Large outer glow */}
        <circle
          cx="100"
          cy="100"
          r="72"
          fill={fill}
          opacity={glowOpacity * 0.2}
          filter="url(#guide-glow-enhanced)"
          className={pulse ? "guide-pulse-slow" : ""}
        />

        {/* Medium glow layer */}
        <circle
          cx="100"
          cy="100"
          r="60"
          fill={fill}
          opacity={glowOpacity * 0.4}
          filter="url(#guide-glow-enhanced)"
        />

        {/* Inner glow with gradient */}
        <circle
          cx="100"
          cy="100"
          r="50"
          fill="url(#guide-gradient)"
          opacity={glowOpacity}
          filter="url(#guide-glow-enhanced)"
          className={pulse ? "guide-pulse" : ""}
        />

        {/* Core orb - mostly transparent */}
        <circle
          cx="100"
          cy="100"
          r="42"
          fill={fill}
          opacity="0.6"
          className={pulse ? "guide-pulse-fast" : ""}
        />

        {/* Bright center highlight */}
        <circle
          cx="95"
          cy="95"
          r="18"
          fill="white"
          opacity="0.5"
        />

        {/* Tiny shimmer point */}
        <circle
          cx="92"
          cy="92"
          r="6"
          fill="white"
          opacity="0.8"
        />

        {/* Activity dots - smaller and more subtle */}
        <circle cx="100" cy="22" r="2" fill="white" opacity="0.4" className={pulse ? "guide-dot-pulse" : ""} />
        <circle cx="178" cy="100" r="2" fill="white" opacity="0.4" className={pulse ? "guide-dot-pulse-2" : ""} />
        <circle cx="100" cy="178" r="2" fill="white" opacity="0.4" className={pulse ? "guide-dot-pulse-3" : ""} />
        <circle cx="22" cy="100" r="2" fill="white" opacity="0.4" className={pulse ? "guide-dot-pulse-4" : ""} />
      </svg>
    </div>
  );
}
