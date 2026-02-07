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

  // Guide character intentionally removed to keep UI minimal.
  // Return nothing — keep component present so imports don't break.
  return null;
}
