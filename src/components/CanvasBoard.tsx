// src/components/CanvasBoard.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Undo2, Eraser, Pencil, Save } from "lucide-react";

interface CanvasBoardProps {
  onSave?: (dataUrl: string) => void;
  // Backward-compatible alias used by some screens.
  onExport?: (dataUrl: string) => void;
  onCancel: () => void;
  width?: number;
  height?: number;
  initialDataUrl?: string;
}

type Tool = "pen" | "eraser";

export const CanvasBoard: React.FC<CanvasBoardProps> = ({
  onSave,
  onExport,
  onCancel,
  width = 720,
  height = 420,
  initialDataUrl,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const [tool, setTool] = useState<Tool>("pen");
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [history, setHistory] = useState<ImageData[]>([]);

  const dpr = useMemo(() => window.devicePixelRatio || 1, []);

  const getCtx = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d", { willReadFrequently: true });
  };

  const pushHistory = () => {
    const ctx = getCtx();
    if (!ctx) return;
    const img = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    setHistory((h) => [...h.slice(-30), img]); // cap history
  };

  const undo = () => {
    const ctx = getCtx();
    if (!ctx) return;
    setHistory((h) => {
      if (h.length <= 1) return h;
      const next = h.slice(0, -1);
      ctx.putImageData(next[next.length - 1], 0, 0);
      return next;
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;

    // HiDPI
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    // background
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, width, height);

    // If we have an initial drawing, render it.
    if (initialDataUrl) {
      const img = new Image();
      img.onload = () => {
        try {
          ctx.drawImage(img, 0, 0, width, height);
          pushHistory();
        } catch {
          // ignore
        }
      };
      img.src = initialDataUrl;
    }

    // initial history snapshot
    pushHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, dpr]);

  const toLocalPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left),
      y: (e.clientY - rect.top),
    };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = getCtx();
    if (!ctx) return;

    drawing.current = true;
    lastPoint.current = toLocalPoint(e);

    // snapshot BEFORE stroke so undo works cleanly
    pushHistory();
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = getCtx();
    if (!ctx) return;

    const p = toLocalPoint(e);
    const last = lastPoint.current;
    if (!last) {
      lastPoint.current = p;
      return;
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = tool === "pen" ? "#e5e7eb" : "#0b1220";

    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();

    lastPoint.current = p;
  };

  const end = () => {
    drawing.current = false;
    lastPoint.current = null;
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // convert to standard-res output (uses current canvas pixels; good enough for MVP)
    const dataUrl = canvas.toDataURL("image/png");
    onSave?.(dataUrl);
    onExport?.(dataUrl);
  };

  const content = (
    <div className="absolute inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-slate-950 border border-slate-800 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="text-slate-100 font-semibold">Sketch</div>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-slate-900 text-slate-200"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setTool("pen")}
              className={[
                "px-3 py-2 rounded-lg border flex items-center gap-2",
                tool === "pen"
                  ? "border-slate-500 bg-slate-900/60 text-slate-100"
                  : "border-slate-800 text-slate-200 hover:bg-slate-900/40",
              ].join(" ")}
            >
              <Pencil className="w-4 h-4" />
              Pen
            </button>

            <button
              onClick={() => setTool("eraser")}
              className={[
                "px-3 py-2 rounded-lg border flex items-center gap-2",
                tool === "eraser"
                  ? "border-slate-500 bg-slate-900/60 text-slate-100"
                  : "border-slate-800 text-slate-200 hover:bg-slate-900/40",
              ].join(" ")}
            >
              <Eraser className="w-4 h-4" />
              Eraser
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <label className="text-slate-400 text-sm">Width</label>
              <input
                type="range"
                min={2}
                max={16}
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
              />
            </div>

            <button
              onClick={undo}
              className="px-3 py-2 rounded-lg border border-slate-800 text-slate-200 hover:bg-slate-900/40 flex items-center gap-2"
            >
              <Undo2 className="w-4 h-4" />
              Undo
            </button>

            <button
              onClick={save}
              className="px-3 py-2 rounded-lg bg-slate-100 text-slate-950 font-semibold hover:bg-white flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 overflow-auto">
            <canvas
              ref={canvasRef}
              className="rounded-lg border border-slate-800 touch-none"
              onPointerDown={start}
              onPointerMove={move}
              onPointerUp={end}
              onPointerCancel={end}
              onPointerLeave={end}
            />
          </div>

          <div className="text-slate-500 text-xs">
            Tip: Draw quickly. Save will attach a PNG data URL to the current reflection.
          </div>
        </div>
      </div>
    </div>
  );

  // Render at phone level using portal to escape overflow constraints
  const phone = document.querySelector('.phone');
  if (!phone) return content; // Fallback to normal rendering

  return createPortal(content, phone);
};

export default CanvasBoard;
