// src/components/CanvasBoard.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  X, Undo2, Redo2, Eraser, Pencil, Save, Trash2, Palette,
  Paintbrush, Highlighter, Sparkles, Square, Circle,
  ArrowRight, Minus, PaintBucket, Type
} from "lucide-react";

interface CanvasBoardProps {
  onSave?: (dataUrl: string) => void;
  // Backward-compatible alias used by some screens.
  onExport?: (dataUrl: string) => void;
  onCancel: () => void;
  width?: number;
  height?: number;
  initialDataUrl?: string;
}

type Tool =
  | "pen"
  | "marker"
  | "highlighter"
  | "spray"
  | "eraser"
  | "rectangle"
  | "circle"
  | "line"
  | "arrow"
  | "fill"
  | "text";

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
  const shapeStart = useRef<{ x: number; y: number } | null>(null);
  const tempCanvas = useRef<HTMLCanvasElement | null>(null);

  const [tool, setTool] = useState<Tool>("pen");
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [color, setColor] = useState<string>("#e5e7eb");
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState<number>(0);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputPos, setTextInputPos] = useState<{ x: number; y: number } | null>(null);
  const [textValue, setTextValue] = useState("");

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

  // Flood fill algorithm for bucket tool
  const floodFill = (startX: number, startY: number, fillColor: string) => {
    const ctx = getCtx();
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const pixels = imageData.data;

    const startPos = (Math.floor(startY) * imageData.width + Math.floor(startX)) * 4;
    const startR = pixels[startPos];
    const startG = pixels[startPos + 1];
    const startB = pixels[startPos + 2];
    const startA = pixels[startPos + 3];

    // Convert fill color to RGB
    const tempCtx = document.createElement("canvas").getContext("2d")!;
    tempCtx.fillStyle = fillColor;
    tempCtx.fillRect(0, 0, 1, 1);
    const fillData = tempCtx.getImageData(0, 0, 1, 1).data;
    const fillR = fillData[0];
    const fillG = fillData[1];
    const fillB = fillData[2];
    const fillA = 255;

    // Don't fill if clicking on the same color
    if (startR === fillR && startG === fillG && startB === fillB && startA === fillA) {
      return;
    }

    const stack: Array<[number, number]> = [[Math.floor(startX), Math.floor(startY)]];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const key = `${x},${y}`;

      if (visited.has(key)) continue;
      if (x < 0 || x >= imageData.width || y < 0 || y >= imageData.height) continue;

      const pos = (y * imageData.width + x) * 4;
      const r = pixels[pos];
      const g = pixels[pos + 1];
      const b = pixels[pos + 2];
      const a = pixels[pos + 3];

      if (r !== startR || g !== startG || b !== startB || a !== startA) continue;

      visited.add(key);
      pixels[pos] = fillR;
      pixels[pos + 1] = fillG;
      pixels[pos + 2] = fillB;
      pixels[pos + 3] = fillA;

      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    ctx.putImageData(imageData, 0, 0);
  };

  // Draw shapes
  const drawShape = (ctx: CanvasRenderingContext2D, start: { x: number; y: number }, end: { x: number; y: number }) => {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (tool === "rectangle") {
      const w = end.x - start.x;
      const h = end.y - start.y;
      ctx.strokeRect(start.x, start.y, w, h);
    } else if (tool === "circle") {
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const radius = Math.sqrt(dx * dx + dy * dy);
      ctx.beginPath();
      ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (tool === "line") {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    } else if (tool === "arrow") {
      // Draw line
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      // Draw arrowhead
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const headLength = 15;
      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(
        end.x - headLength * Math.cos(angle - Math.PI / 6),
        end.y - headLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(
        end.x - headLength * Math.cos(angle + Math.PI / 6),
        end.y - headLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
    }
  };

  // Draw with different brush types
  const drawBrush = (ctx: CanvasRenderingContext2D, from: { x: number; y: number }, to: { x: number; y: number }) => {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (tool === "pen") {
      ctx.lineWidth = strokeWidth;
      ctx.strokeStyle = color;
      ctx.globalAlpha = 1.0;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    } else if (tool === "marker") {
      ctx.lineWidth = strokeWidth * 2;
      ctx.strokeStyle = color;
      ctx.globalAlpha = 1.0;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    } else if (tool === "highlighter") {
      ctx.lineWidth = strokeWidth * 3;
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    } else if (tool === "spray") {
      // Spray paint effect
      const density = 20;
      const radius = strokeWidth * 2;
      for (let i = 0; i < density; i++) {
        const offsetX = (Math.random() - 0.5) * radius;
        const offsetY = (Math.random() - 0.5) * radius;
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.6;
        ctx.fillRect(to.x + offsetX, to.y + offsetY, 1, 1);
      }
      ctx.globalAlpha = 1.0;
    } else if (tool === "eraser") {
      ctx.lineWidth = strokeWidth;
      ctx.strokeStyle = "#0b1220";
      ctx.globalAlpha = 1.0;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }
  };

  const addText = () => {
    if (!textInputPos || !textValue.trim()) return;
    const ctx = getCtx();
    if (!ctx) return;

    const fontSize = Math.max(16, strokeWidth * 3);
    ctx.font = `${fontSize}px sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(textValue, textInputPos.x, textInputPos.y);

    setShowTextInput(false);
    setTextValue("");
    setTextInputPos(null);
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

    const point = toLocalPoint(e);

    // Handle fill tool
    if (tool === "fill") {
      pushHistory();
      // Account for DPR when flood filling
      floodFill(point.x * dpr, point.y * dpr, color);
      return;
    }

    // Handle text tool
    if (tool === "text") {
      setTextInputPos(point);
      setShowTextInput(true);
      return;
    }

    // Handle shape tools
    const isShapeTool = ["rectangle", "circle", "line", "arrow"].includes(tool);
    if (isShapeTool) {
      drawing.current = true;
      shapeStart.current = point;
      pushHistory();
      return;
    }

    // Handle brush tools
    drawing.current = true;
    lastPoint.current = point;
    pushHistory();
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = getCtx();
    if (!ctx) return;

    const p = toLocalPoint(e);

    // Handle shape drawing with preview
    const isShapeTool = ["rectangle", "circle", "line", "arrow"].includes(tool);
    if (isShapeTool && shapeStart.current) {
      // Restore to last history state for preview
      if (history[historyStep]) {
        ctx.putImageData(history[historyStep], 0, 0);
      }
      drawShape(ctx, shapeStart.current, p);
      return;
    }

    // Handle brush tools
    const last = lastPoint.current;
    if (!last) {
      lastPoint.current = p;
      return;
    }

    drawBrush(ctx, last, p);
    lastPoint.current = p;
  };

  const end = () => {
    const ctx = getCtx();

    // Finalize shape drawing
    const isShapeTool = ["rectangle", "circle", "line", "arrow"].includes(tool);
    if (isShapeTool && shapeStart.current && drawing.current && ctx) {
      // Shape is already drawn from move event, just push history
      pushHistory();
      shapeStart.current = null;
    }

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
          {/* Tools Grid */}
          <div className="grid grid-cols-6 gap-1.5">
            {/* Brush tools */}
            <button
              onClick={() => setTool("pen")}
              className={[
                "p-2 rounded-lg border flex flex-col items-center gap-0.5",
                tool === "pen"
                  ? "border-slate-500 bg-slate-900/60 text-slate-100"
                  : "border-slate-800 text-slate-200 hover:bg-slate-900/40",
              ].join(" ")}
              title="Pen"
            >
              <Pencil className="w-4 h-4" />
              <span className="text-[9px]">Pen</span>
            </button>
            <button
              onClick={() => setTool("marker")}
              className={[
                "p-2 rounded-lg border flex flex-col items-center gap-0.5",
                tool === "marker"
                  ? "border-slate-500 bg-slate-900/60 text-slate-100"
                  : "border-slate-800 text-slate-200 hover:bg-slate-900/40",
              ].join(" ")}
              title="Marker"
            >
              <Paintbrush className="w-4 h-4" />
              <span className="text-[9px]">Marker</span>
            </button>
            <button
              onClick={() => setTool("highlighter")}
              className={[
                "p-2 rounded-lg border flex flex-col items-center gap-0.5",
                tool === "highlighter"
                  ? "border-slate-500 bg-slate-900/60 text-slate-100"
                  : "border-slate-800 text-slate-200 hover:bg-slate-900/40",
              ].join(" ")}
              title="Highlighter"
            >
              <Highlighter className="w-4 h-4" />
              <span className="text-[9px]">Highlight</span>
            </button>
            <button
              onClick={() => setTool("spray")}
              className={[
                "p-2 rounded-lg border flex flex-col items-center gap-0.5",
                tool === "spray"
                  ? "border-slate-500 bg-slate-900/60 text-slate-100"
                  : "border-slate-800 text-slate-200 hover:bg-slate-900/40",
              ].join(" ")}
              title="Spray"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-[9px]">Spray</span>
            </button>
            <button
              onClick={() => setTool("eraser")}
              className={[
                "p-2 rounded-lg border flex flex-col items-center gap-0.5",
                tool === "eraser"
                  ? "border-slate-500 bg-slate-900/60 text-slate-100"
                  : "border-slate-800 text-slate-200 hover:bg-slate-900/40",
              ].join(" ")}
              title="Eraser"
            >
              <Eraser className="w-4 h-4" />
              <span className="text-[9px]">Eraser</span>
            </button>
            <button
              onClick={() => setTool("fill")}
              className={[
                "p-2 rounded-lg border flex flex-col items-center gap-0.5",
                tool === "fill"
                  ? "border-slate-500 bg-slate-900/60 text-slate-100"
                  : "border-slate-800 text-slate-200 hover:bg-slate-900/40",
              ].join(" ")}
              title="Fill"
            >
              <PaintBucket className="w-4 h-4" />
              <span className="text-[9px]">Fill</span>
            </button>

            {/* Shape tools */}
            <button
              onClick={() => setTool("rectangle")}
              className={[
                "p-2 rounded-lg border flex flex-col items-center gap-0.5",
                tool === "rectangle"
                  ? "border-slate-500 bg-slate-900/60 text-slate-100"
                  : "border-slate-800 text-slate-200 hover:bg-slate-900/40",
              ].join(" ")}
              title="Rectangle"
            >
              <Square className="w-4 h-4" />
              <span className="text-[9px]">Rect</span>
            </button>
            <button
              onClick={() => setTool("circle")}
              className={[
                "p-2 rounded-lg border flex flex-col items-center gap-0.5",
                tool === "circle"
                  ? "border-slate-500 bg-slate-900/60 text-slate-100"
                  : "border-slate-800 text-slate-200 hover:bg-slate-900/40",
              ].join(" ")}
              title="Circle"
            >
              <Circle className="w-4 h-4" />
              <span className="text-[9px]">Circle</span>
            </button>
            <button
              onClick={() => setTool("line")}
              className={[
                "p-2 rounded-lg border flex flex-col items-center gap-0.5",
                tool === "line"
                  ? "border-slate-500 bg-slate-900/60 text-slate-100"
                  : "border-slate-800 text-slate-200 hover:bg-slate-900/40",
              ].join(" ")}
              title="Line"
            >
              <Minus className="w-4 h-4" />
              <span className="text-[9px]">Line</span>
            </button>
            <button
              onClick={() => setTool("arrow")}
              className={[
                "p-2 rounded-lg border flex flex-col items-center gap-0.5",
                tool === "arrow"
                  ? "border-slate-500 bg-slate-900/60 text-slate-100"
                  : "border-slate-800 text-slate-200 hover:bg-slate-900/40",
              ].join(" ")}
              title="Arrow"
            >
              <ArrowRight className="w-4 h-4" />
              <span className="text-[9px]">Arrow</span>
            </button>
            <button
              onClick={() => setTool("text")}
              className={[
                "p-2 rounded-lg border flex flex-col items-center gap-0.5",
                tool === "text"
                  ? "border-slate-500 bg-slate-900/60 text-slate-100"
                  : "border-slate-800 text-slate-200 hover:bg-slate-900/40",
              ].join(" ")}
              title="Text"
            >
              <Type className="w-4 h-4" />
              <span className="text-[9px]">Text</span>
            </button>
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-2 rounded-lg border border-slate-800 text-slate-200 hover:bg-slate-900/40 flex flex-col items-center gap-0.5"
              title="Color"
            >
              <div
                className="w-4 h-4 rounded border border-slate-600"
                style={{ backgroundColor: color }}
              />
              <span className="text-[9px]">Color</span>
            </button>
          </div>

          {/* Width Control */}
          <div className="flex items-center gap-2 px-2">
            <label className="text-slate-400 text-sm">Width</label>
            <input
              type="range"
              min={1}
              max={24}
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="flex-1"
              title={`Stroke width: ${strokeWidth}px`}
            />
            <span className="text-slate-400 text-xs w-6">{strokeWidth}</span>
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

          {/* Text Input Dialog */}
          {showTextInput && (
            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
              <div className="text-slate-300 text-sm mb-2">Enter text:</div>
              <input
                type="text"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addText();
                  if (e.key === "Escape") {
                    setShowTextInput(false);
                    setTextValue("");
                    setTextInputPos(null);
                  }
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-slate-500"
                placeholder="Type your text..."
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={addText}
                  className="flex-1 px-3 py-1.5 bg-slate-100 text-slate-950 rounded-lg text-sm font-semibold hover:bg-white"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowTextInput(false);
                    setTextValue("");
                    setTextInputPos(null);
                  }}
                  className="flex-1 px-3 py-1.5 border border-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-900/40"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="text-slate-500 text-xs">
            Tip: Use brush tools (pen, marker, highlighter, spray), shapes (rectangle, circle, line, arrow), fill, and text. Adjust size (1-24px) and colors. Undo/redo or clear to start fresh.
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
