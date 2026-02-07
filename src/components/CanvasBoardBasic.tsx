import React, { useRef, useState, useEffect, useMemo } from "react";
import { X, Undo, Redo, Droplet, Sparkles, Eraser } from "lucide-react";

interface CanvasBoardBasicProps {
  onSave?: (dataUrl: string) => void;
  onExport?: (dataUrl: string) => void;
  onCancel?: () => void;
  onUpgrade?: (dataUrl: string) => void; // Callback to switch to advanced mode
  initialDataUrl?: string;
  width?: number;
  height?: number;
}

type BasicTool = "pen" | "marker" | "eraser";

export const CanvasBoardBasic: React.FC<CanvasBoardBasicProps> = ({
  onSave,
  onExport,
  onCancel,
  onUpgrade,
  initialDataUrl,
  width = 400,
  height = 780,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const pointBuffer = useRef<Array<{ x: number; y: number }>>([]);

  const [tool, setTool] = useState<BasicTool>("pen");
  const [strokeColor, setStrokeColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(3);
  const [smoothDrawing, setSmoothDrawing] = useState(true);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);

  const dpr = useMemo(() => window.devicePixelRatio || 1, []);

  const quickColors = [
    "#ffffff", "#000000", "#ff0000", "#00ff00", "#0000ff",
    "#ffff00", "#ff00ff", "#00ffff", "#ff8800", "#8800ff"
  ];

  const getCtx = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d", { willReadFrequently: true });
  };

  const pushHistory = () => {
    const ctx = getCtx();
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    setHistory((h) => {
      const newHistory = [...h.slice(0, historyStep + 1), imageData].slice(-30);
      setHistoryStep(newHistory.length - 1);
      return newHistory;
    });
  };

  const undo = () => {
    if (historyStep <= 0 || history.length === 0) return;
    const newStep = historyStep - 1;
    const imageData = history[newStep];
    const ctx = getCtx();
    if (ctx) {
      ctx.putImageData(imageData, 0, 0);
      setHistoryStep(newStep);
    }
  };

  const redo = () => {
    if (historyStep >= history.length - 1) return;
    const newStep = historyStep + 1;
    const imageData = history[newStep];
    const ctx = getCtx();
    if (ctx) {
      ctx.putImageData(imageData, 0, 0);
      setHistoryStep(newStep);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, width, height);

    if (initialDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        pushHistory();
      };
      img.src = initialDataUrl;
    } else {
      pushHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, dpr]);

  const toLocalPoint = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    const y = ((e.clientY - rect.top) / rect.height) * height;
    return { x, y };
  };

  const interpolatePoints = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const points: Array<{ x: number; y: number }> = [];
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.max(Math.ceil(distance / 2), 1);
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      points.push({
        x: from.x + dx * t,
        y: from.y + dy * t
      });
    }
    return points;
  };

  const getSplinePoint = (
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number },
    t: number
  ) => {
    const t2 = t * t;
    const t3 = t2 * t;
    const x = 0.5 * (
      (2 * p1.x) +
      (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
    );
    const y = 0.5 * (
      (2 * p1.y) +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
    );
    return { x, y };
  };

  const getSmoothPoints = (points: Array<{ x: number; y: number }>) => {
    if (points.length < 4) return points;
    const smoothed: Array<{ x: number; y: number }> = [];
    const segments = 8;
    
    for (let i = 0; i < points.length - 3; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const p2 = points[i + 2];
      const p3 = points[i + 3];
      
      for (let j = 0; j < segments; j++) {
        const t = j / segments;
        smoothed.push(getSplinePoint(p0, p1, p2, p3, t));
      }
    }
    return smoothed;
  };

  const drawBrush = (point: { x: number; y: number }) => {
    const ctx = getCtx();
    if (!ctx) return;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,1)";
      ctx.lineWidth = brushSize * 2;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = strokeColor;
      
      if (tool === "marker") {
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = brushSize * 3;
      } else {
        ctx.globalAlpha = 1.0;
        ctx.lineWidth = brushSize;
      }
    }

    if (lastPoint.current) {
      const points = interpolatePoints(lastPoint.current, point);
      
      points.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
      });
    } else {
      ctx.beginPath();
      ctx.arc(point.x, point.y, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = "source-over";
  };

  const start = (e: React.PointerEvent) => {
    e.preventDefault();
    drawing.current = true;
    const point = toLocalPoint(e);
    lastPoint.current = point;
    pointBuffer.current = [point];
    drawBrush(point);
  };

  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    e.preventDefault();
    
    const point = toLocalPoint(e);
    pointBuffer.current.push(point);

    // Always draw immediately for responsive feedback
    drawBrush(point);
    lastPoint.current = point;

    // Keep buffer size manageable
    if (pointBuffer.current.length > 6) {
      pointBuffer.current = pointBuffer.current.slice(-4);
    }
  };

  const end = () => {
    if (drawing.current) {
      drawing.current = false;
      lastPoint.current = null;
      pointBuffer.current = [];
      pushHistory();
    }
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    if (onExport) onExport(dataUrl);
    if (onSave) onSave(dataUrl);
  };

  const handleUpgrade = () => {
    const canvas = canvasRef.current;
    if (!canvas || !onUpgrade) return;
    const dataUrl = canvas.toDataURL("image/png");
    onUpgrade(dataUrl);
  };

  return (
    <div className="absolute inset-0 z-[100] bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/80 flex-shrink-0">
        <div className="text-slate-100 font-semibold text-sm">Quick Draw</div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Controls Bar */}
        <div className="px-3 py-2 bg-slate-900/80 border-b border-slate-800 flex-shrink-0 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={smoothDrawing}
                onChange={(e) => setSmoothDrawing(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-slate-300 text-xs font-medium">Smooth lines</span>
            </label>

            <button
              onClick={handleExport}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-xs transition-colors"
            >
              Save Drawing
            </button>

            {onUpgrade && (
              <button
                onClick={handleUpgrade}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Open in advanced editor with layers, shapes, and more tools"
              >
                <Sparkles className="w-3 h-3" />
                Advanced
              </button>
            )}

            <button
              onClick={onCancel}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <X className="w-4 h-4" />
              Exit
            </button>
          </div>
        </div>

        {/* Canvas Container */}
        <div className="flex-1 flex items-center justify-center bg-slate-900/20 overflow-hidden p-4">
          <canvas
            ref={canvasRef}
            className="rounded border border-slate-700 shadow-2xl"
            style={{ touchAction: 'none' }}
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
            onPointerLeave={end}
          />
        </div>

        {/* Bottom Toolbar */}
        <div className="p-3 bg-slate-900/80 border-t border-slate-800 flex-shrink-0 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {/* Color Swatches */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-xs font-medium">Color:</span>
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-7 h-7 rounded border-2 border-slate-600 shadow-inner"
                style={{ backgroundColor: strokeColor }}
                title="Choose color"
              />
              <div className="flex gap-1">
                {quickColors.slice(0, 4).map((color) => (
                  <button
                    key={color}
                    onClick={() => setStrokeColor(color)}
                    className={`w-6 h-6 rounded border-2 hover:scale-110 transition-transform ${
                      color === strokeColor ? "border-blue-400" : "border-slate-700"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Tool Selection & Undo/Redo */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setTool("pen")}
                className={`p-2 rounded-lg transition-all ${
                  tool === "pen"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
                title="Pen"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>

              <button
                onClick={() => setTool("marker")}
                className={`p-2 rounded-lg transition-all ${
                  tool === "marker"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
                title="Marker"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.5 1.15L17 2.65l3.35 3.35 1.5-1.5c.3-.3.3-.77 0-1.06l-2.29-2.29c-.3-.3-.77-.3-1.06 0zM16 4l-13 13V21h4l13-13-4-4z" opacity="0.5"/>
                </svg>
              </button>

              <button
                onClick={() => setTool("eraser")}
                className={`p-2 rounded-lg transition-all ${
                  tool === "eraser"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
                title="Eraser"
              >
                <Eraser className="w-4 h-4" />
              </button>

              <div className="w-px h-6 bg-slate-700 mx-0.5" />

              <button
                onClick={undo}
                disabled={historyStep <= 0}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Undo"
              >
                <Undo className="w-4 h-4" />
              </button>

              <button
                onClick={redo}
                disabled={historyStep >= history.length - 1}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Redo"
              >
                <Redo className="w-4 h-4" />
              </button>
            </div>

            {/* Size Slider */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-xs font-medium">Size:</span>
              <input
                type="range"
                min={1}
                max={20}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-16"
              />
              <span className="text-slate-300 text-xs w-5">{brushSize}</span>
            </div>
          </div>

          {/* Color Picker Popup */}
          {showColorPicker && (
              <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300 text-xs font-semibold">Pick Color</span>
                  <button
                    onClick={() => setShowColorPicker(false)}
                    className="text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="color"
                  value={strokeColor}
                  onChange={(e) => setStrokeColor(e.target.value)}
                  className="w-full h-10 rounded border border-slate-700 bg-slate-950 cursor-pointer"
                />
                <div className="flex gap-1.5 flex-wrap mt-2">
                  {quickColors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setStrokeColor(c)}
                      className={`w-7 h-7 rounded border-2 hover:scale-110 transition-transform ${
                        c === strokeColor ? "border-blue-400" : "border-slate-700"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default CanvasBoardBasic;
