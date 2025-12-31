// src/components/CanvasBoard.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  X, Undo2, Redo2, Eraser, Pencil, Save, Trash2,
  Paintbrush, Highlighter, Sparkles, Square, Circle,
  ArrowRight, Minus, PaintBucket, Type, ChevronDown,
  Hand, ZoomIn, ZoomOut, Droplet
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
  | "text"
  | "hand";

export const CanvasBoard: React.FC<CanvasBoardProps> = ({
  onSave,
  onExport,
  onCancel,
  width = 400,
  height = 780,
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
  const [showToolMenu, setShowToolMenu] = useState(false);
  const [zoom, setZoom] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Tool definitions with icons and labels
  const toolDefs = useMemo(() => ({
    pen: { label: "Pen", icon: Pencil, category: "brush" },
    marker: { label: "Marker", icon: Paintbrush, category: "brush" },
    highlighter: { label: "Highlighter", icon: Highlighter, category: "brush" },
    spray: { label: "Spray", icon: Sparkles, category: "brush" },
    eraser: { label: "Eraser", icon: Eraser, category: "brush" },
    rectangle: { label: "Rectangle", icon: Square, category: "shape" },
    circle: { label: "Circle", icon: Circle, category: "shape" },
    line: { label: "Line", icon: Minus, category: "shape" },
    arrow: { label: "Arrow", icon: ArrowRight, category: "shape" },
    fill: { label: "Fill", icon: PaintBucket, category: "other" },
    text: { label: "Text", icon: Type, category: "other" },
    hand: { label: "Pan", icon: Hand, category: "other" },
  }), []);

  const currentToolDef = toolDefs[tool];

  // Quick color presets including black and greys
  const quickColors = [
    "#000000", // Black
    "#333333", // Dark grey
    "#666666", // Medium grey
    "#999999", // Light grey
    "#ffffff", // White
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
    // Account for zoom and pan
    const x = ((e.clientX - rect.left) - panOffset.x) / zoom;
    const y = ((e.clientY - rect.top) - panOffset.y) / zoom;
    return { x, y };
  };

  const handleZoom = (delta: number, centerX?: number, centerY?: number) => {
    const newZoom = Math.max(0.5, Math.min(4, zoom + delta));

    // If center point provided, adjust pan to zoom towards that point
    if (centerX !== undefined && centerY !== undefined) {
      const zoomRatio = newZoom / zoom;
      setPanOffset({
        x: centerX - (centerX - panOffset.x) * zoomRatio,
        y: centerY - (centerY - panOffset.y) * zoomRatio,
      });
    }

    setZoom(newZoom);
  };

  const resetView = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = getCtx();
    if (!ctx) return;

    // Handle pan/hand tool
    if (tool === "hand") {
      drawing.current = true;
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      lastPoint.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      return;
    }

    const point = toLocalPoint(e);

    // Handle fill tool
    if (tool === "fill") {
      pushHistory();
      // Account for DPR and zoom when flood filling
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

    // Handle panning with hand tool
    if (tool === "hand") {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      const last = lastPoint.current;
      if (!last) {
        lastPoint.current = current;
        return;
      }

      setPanOffset({
        x: panOffset.x + (current.x - last.x),
        y: panOffset.y + (current.y - last.y),
      });
      lastPoint.current = current;
      return;
    }

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
    <div className="absolute inset-0 z-[100] bg-slate-950 flex flex-col">
      <div className="w-full h-full flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/80 flex-shrink-0">
          <div className="text-slate-100 font-semibold">Canvas</div>
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold flex items-center gap-1.5 transition-colors"
            aria-label="Close and exit canvas"
          >
            <X className="w-4 h-4" />
            Exit
          </button>
        </div>

        <div className="flex-1 flex flex-col p-2 space-y-2 overflow-hidden">
          {/* Compact Controls Row */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Tool Selector */}
            <div className="relative flex-1">
              <button
                onClick={() => setShowToolMenu(!showToolMenu)}
                className="w-full px-2 py-1.5 rounded border border-slate-800 text-slate-200 hover:bg-slate-900/40 flex items-center justify-between gap-1.5 text-xs"
                title="Select tool"
              >
                <div className="flex items-center gap-1.5">
                  {React.createElement(currentToolDef.icon, { className: "w-3.5 h-3.5" })}
                  <span className="text-xs">{currentToolDef.label}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {/* Dropdown Menu */}
              {showToolMenu && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-10 max-h-80 overflow-y-auto">
                  {/* Brush Tools */}
                  <div className="p-2 border-b border-slate-800">
                    <div className="text-xs text-slate-500 font-bold px-2 py-1">Brushes</div>
                    {(Object.keys(toolDefs) as Tool[])
                      .filter((t) => toolDefs[t].category === "brush")
                      .map((t) => {
                        const Icon = toolDefs[t].icon;
                        return (
                          <button
                            key={t}
                            onClick={() => {
                              setTool(t);
                              setShowToolMenu(false);
                            }}
                            className={[
                              "w-full px-3 py-2 rounded-lg flex items-center gap-2 text-sm",
                              t === tool
                                ? "bg-slate-800 text-slate-100"
                                : "text-slate-300 hover:bg-slate-800/50",
                            ].join(" ")}
                          >
                            <Icon className="w-4 h-4" />
                            {toolDefs[t].label}
                          </button>
                        );
                      })}
                  </div>

                  {/* Shape Tools */}
                  <div className="p-2 border-b border-slate-800">
                    <div className="text-xs text-slate-500 font-bold px-2 py-1">Shapes</div>
                    {(Object.keys(toolDefs) as Tool[])
                      .filter((t) => toolDefs[t].category === "shape")
                      .map((t) => {
                        const Icon = toolDefs[t].icon;
                        return (
                          <button
                            key={t}
                            onClick={() => {
                              setTool(t);
                              setShowToolMenu(false);
                            }}
                            className={[
                              "w-full px-3 py-2 rounded-lg flex items-center gap-2 text-sm",
                              t === tool
                                ? "bg-slate-800 text-slate-100"
                                : "text-slate-300 hover:bg-slate-800/50",
                            ].join(" ")}
                          >
                            <Icon className="w-4 h-4" />
                            {toolDefs[t].label}
                          </button>
                        );
                      })}
                  </div>

                  {/* Other Tools */}
                  <div className="p-2">
                    <div className="text-xs text-slate-500 font-bold px-2 py-1">Other</div>
                    {(Object.keys(toolDefs) as Tool[])
                      .filter((t) => toolDefs[t].category === "other")
                      .map((t) => {
                        const Icon = toolDefs[t].icon;
                        return (
                          <button
                            key={t}
                            onClick={() => {
                              setTool(t);
                              setShowToolMenu(false);
                            }}
                            className={[
                              "w-full px-3 py-2 rounded-lg flex items-center gap-2 text-sm",
                              t === tool
                                ? "bg-slate-800 text-slate-100"
                                : "text-slate-300 hover:bg-slate-800/50",
                            ].join(" ")}
                          >
                            <Icon className="w-4 h-4" />
                            {toolDefs[t].label}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Color Picker Button */}
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="px-1.5 py-1.5 rounded border border-slate-800 text-slate-200 hover:bg-slate-900/40"
              title="Color"
            >
              <div
                className="w-4 h-4 rounded border border-slate-600"
                style={{ backgroundColor: color }}
              />
            </button>

            {/* Width Control */}
            <div className="flex items-center gap-1">
              <input
                type="range"
                min={1}
                max={24}
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="w-16"
                title={`Stroke width: ${strokeWidth}px`}
              />
              <span className="text-slate-400 text-xs w-5">{strokeWidth}</span>
            </div>
          </div>

          {/* Color Picker */}
          {showColorPicker && (
            <div className="p-2 bg-slate-900/60 rounded border border-slate-800 space-y-2 flex-shrink-0">
              {/* Color Wheel */}
              <div className="flex items-center gap-2">
                <Droplet className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full h-7 rounded border border-slate-700 bg-slate-950 cursor-pointer"
                  title="Pick any color"
                />
              </div>

              {/* Quick Colors */}
              <div className="flex gap-1.5">
                {quickColors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={[
                      "w-6 h-6 rounded border hover:scale-110 transition-transform",
                      c === color ? "border-slate-100 border-2" : "border-slate-700",
                    ].join(" ")}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Zoom Controls */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900/40 rounded border border-slate-800 flex-shrink-0">
            <button
              onClick={() => handleZoom(-0.25)}
              disabled={zoom <= 0.5}
              className="p-1 rounded border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-slate-400 text-[10px] min-w-[2.5rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => handleZoom(0.25)}
              disabled={zoom >= 4}
              className="p-1 rounded border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetView}
              className="px-1.5 py-1 rounded border border-slate-700 text-slate-300 hover:bg-slate-800 text-[10px]"
              title="Reset zoom and pan"
            >
              Reset
            </button>
          </div>

          {/* Bottom row - Actions */}
          <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0">
            <button
              onClick={undo}
              disabled={historyStep <= 0}
              className="px-2 py-1 rounded border border-slate-800 text-slate-200 hover:bg-slate-900/40 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed text-xs"
              title="Undo"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Undo
            </button>

            <button
              onClick={redo}
              disabled={historyStep >= history.length - 1}
              className="px-2 py-1 rounded border border-slate-800 text-slate-200 hover:bg-slate-900/40 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed text-xs"
              title="Redo"
            >
              <Redo2 className="w-3.5 h-3.5" />
              Redo
            </button>

            <button
              onClick={clear}
              className="px-2 py-1 rounded border border-slate-800 text-slate-200 hover:bg-slate-900/40 flex items-center gap-1 text-xs"
              title="Clear canvas"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>

            <button
              onClick={save}
              className="px-2 py-1 rounded bg-slate-100 text-slate-950 font-semibold hover:bg-white flex items-center gap-1 ml-auto text-xs"
              title="Save drawing"
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </button>
          </div>

          <div className="flex-1 rounded-lg border border-slate-800 bg-slate-950 p-1 overflow-hidden relative">
            <div
              style={{
                transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
                transformOrigin: "0 0",
                cursor: tool === "hand" ? "grab" : "crosshair",
              }}
            >
              <canvas
                ref={canvasRef}
                className="rounded border border-slate-800 touch-none"
                onPointerDown={start}
                onPointerMove={move}
                onPointerUp={end}
                onPointerCancel={end}
                onPointerLeave={end}
              />
            </div>
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
