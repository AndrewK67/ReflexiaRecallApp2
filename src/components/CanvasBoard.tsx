// src/components/CanvasBoard.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Undo2, Redo2, Eraser, Pencil, Save, Trash2, Palette } from "lucide-react";

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
  width = 360,
  height = 520,
  initialDataUrl,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const [tool, setTool] = useState<Tool>("pen");
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [color, setColor] = useState<string>("#e5e7eb");
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState<number>(0);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const presetColors = [
    "#e5e7eb", // Light gray (default)
    "#ffffff", // White
    "#ef4444", // Red
    "#f97316", // Orange
    "#eab308", // Yellow
    "#22c55e", // Green
    "#06b6d4", // Cyan
    "#3b82f6", // Blue
    "#8b5cf6", // Purple
    "#ec4899", // Pink
  ];

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
    setHistory((h) => {
      const newHistory = [...h.slice(0, historyStep + 1), img].slice(-30);
      setHistoryStep(newHistory.length - 1);
      return newHistory;
    });
  };

  const undo = () => {
    const ctx = getCtx();
    if (!ctx || historyStep <= 0) return;
    const newStep = historyStep - 1;
    setHistoryStep(newStep);
    ctx.putImageData(history[newStep], 0, 0);
  };

  const redo = () => {
    const ctx = getCtx();
    if (!ctx || historyStep >= history.length - 1) return;
    const newStep = historyStep + 1;
    setHistoryStep(newStep);
    ctx.putImageData(history[newStep], 0, 0);
  };

  const clear = () => {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, width, height);
    pushHistory();
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
    ctx.strokeStyle = tool === "pen" ? color : "#0b1220";

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
          {/* Top row - Tools and Color */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setTool("pen")}
              className={[
                "px-3 py-2 rounded-lg border flex items-center gap-2",
                tool === "pen"
                  ? "border-slate-500 bg-slate-900/60 text-slate-100"
                  : "border-slate-800 text-slate-200 hover:bg-slate-900/40",
              ].join(" ")}
              title="Pen tool"
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
              title="Eraser tool"
            >
              <Eraser className="w-4 h-4" />
              Eraser
            </button>

            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="px-3 py-2 rounded-lg border border-slate-800 text-slate-200 hover:bg-slate-900/40 flex items-center gap-2"
              title="Choose color"
            >
              <Palette className="w-4 h-4" />
              <div
                className="w-5 h-5 rounded border border-slate-600"
                style={{ backgroundColor: color }}
              />
            </button>

            <div className="flex items-center gap-2">
              <label className="text-slate-400 text-sm">Width</label>
              <input
                type="range"
                min={1}
                max={24}
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="w-20"
                title={`Stroke width: ${strokeWidth}px`}
              />
              <span className="text-slate-400 text-xs w-6">{strokeWidth}</span>
            </div>
          </div>

          {/* Color Picker */}
          {showColorPicker && (
            <div className="flex flex-wrap gap-2 p-3 bg-slate-900/60 rounded-lg border border-slate-800">
              {presetColors.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setColor(c);
                    setShowColorPicker(false);
                  }}
                  className={[
                    "w-8 h-8 rounded-lg border-2 hover:scale-110 transition-transform",
                    c === color ? "border-slate-100" : "border-slate-700",
                  ].join(" ")}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          )}

          {/* Bottom row - Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={undo}
              disabled={historyStep <= 0}
              className="px-3 py-2 rounded-lg border border-slate-800 text-slate-200 hover:bg-slate-900/40 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
              Undo
            </button>

            <button
              onClick={redo}
              disabled={historyStep >= history.length - 1}
              className="px-3 py-2 rounded-lg border border-slate-800 text-slate-200 hover:bg-slate-900/40 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
              Redo
            </button>

            <button
              onClick={clear}
              className="px-3 py-2 rounded-lg border border-slate-800 text-slate-200 hover:bg-slate-900/40 flex items-center gap-2"
              title="Clear canvas"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>

            <button
              onClick={save}
              className="px-3 py-2 rounded-lg bg-slate-100 text-slate-950 font-semibold hover:bg-white flex items-center gap-2 ml-auto"
              title="Save drawing"
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
            Tip: Choose colors, adjust brush size (1-24px), use undo/redo, or clear to start fresh. Save attaches your sketch to the reflection.
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
