// src/components/CanvasBoard.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  X, Undo2, Redo2, Eraser, Pencil, Save, Trash2,
  Paintbrush, Highlighter, Sparkles, Square, Circle,
  ArrowRight, Minus, PaintBucket, Type, ChevronDown,
  Hand, ZoomIn, ZoomOut, Droplet, MousePointer2, Copy, Move, Scissors,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight as ArrowRightIcon,
  Layers, Plus, Eye, EyeOff, ChevronUp, ChevronDown as ChevronDownIcon,
  Download, Minimize2, Maximize2, RotateCw, FlipHorizontal, FlipVertical,
  Triangle, Star, Heart, Pentagon, Spline, Info
} from "lucide-react";

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  canvas: HTMLCanvasElement;
}

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
  | "triangle"
  | "star"
  | "heart"
  | "path" // Combined polygon + bezier/curve tool
  | "line"
  | "arrow"
  | "fill"
  | "text"
  | "hand"
  | "select";

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
  const lastTouchDistance = useRef<number>(0);
  const lastTouchMidpoint = useRef<{ x: number; y: number } | null>(null);

  const [tool, setTool] = useState<Tool>("pen");
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [strokeColor, setStrokeColor] = useState<string>("#e5e7eb");
  const [fillColor, setFillColor] = useState<string>("#3b82f6");
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState<number>(0);
  const [showStrokeColorPicker, setShowStrokeColorPicker] = useState(false);
  const [showFillColorPicker, setShowFillColorPicker] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputPos, setTextInputPos] = useState<{ x: number; y: number } | null>(null);
  const [textValue, setTextValue] = useState("");
  const [showToolMenu, setShowToolMenu] = useState(false);
  const [zoom, setZoom] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selection, setSelection] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [selectionImage, setSelectionImage] = useState<ImageData | null>(null);
  const [selectionPreview, setSelectionPreview] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [dragStartPoint, setDragStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [copiedSelection, setCopiedSelection] = useState<ImageData | null>(null);
  const [originalSelectionPos, setOriginalSelectionPos] = useState<{ x: number; y: number } | null>(null);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string>("");
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [uiMinimized, setUiMinimized] = useState(false);
  const lastTapTime = useRef<number>(0);
  const [shapeMode, setShapeMode] = useState<'stroke' | 'fill' | 'both'>('stroke'); // Shape drawing mode
  const [activeHandle, setActiveHandle] = useState<string | null>(null); // Which transform handle is being dragged
  const [transformStart, setTransformStart] = useState<{ x: number; y: number } | null>(null);
  const [isSelectingByClick, setIsSelectingByClick] = useState(false); // Track if we're doing click-to-select vs drag-to-select
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [rotationAngle, setRotationAngle] = useState<number>(0); // Current rotation angle during transform
  const [pathPoints, setPathPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [showTips, setShowTips] = useState(true); // Toggle for showing instructions/tips
  const [opacity, setOpacity] = useState<number>(1.0); // Drawing opacity
  const [selectionHistoryIndex, setSelectionHistoryIndex] = useState<number>(-1);
  const [selectionLayerSnapshot, setSelectionLayerSnapshot] = useState<ImageData | null>(null); // History state when selection was created

  // Tool definitions with icons and labels
  const toolDefs = useMemo(() => ({
    pen: { label: "Pen", icon: Pencil, category: "brush" },
    marker: { label: "Marker", icon: Paintbrush, category: "brush" },
    highlighter: { label: "Highlighter", icon: Highlighter, category: "brush" },
    spray: { label: "Spray", icon: Sparkles, category: "brush" },
    eraser: { label: "Eraser", icon: Eraser, category: "brush" },
    rectangle: { label: "Rectangle", icon: Square, category: "shape" },
    circle: { label: "Circle", icon: Circle, category: "shape" },
    triangle: { label: "Triangle", icon: Triangle, category: "shape" },
    star: { label: "Star", icon: Star, category: "shape" },
    heart: { label: "Heart", icon: Heart, category: "shape" },
    path: { label: "Path", icon: Spline, category: "shape" },
    line: { label: "Line", icon: Minus, category: "shape" },
    arrow: { label: "Arrow", icon: ArrowRight, category: "shape" },
    fill: { label: "Fill", icon: PaintBucket, category: "other" },
    text: { label: "Text", icon: Type, category: "other" },
    hand: { label: "Pan", icon: Hand, category: "other" },
    select: { label: "Select", icon: MousePointer2, category: "other" },
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

  // Create a new layer
  const createLayer = (name: string): Layer => {
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    // Transparent background for layers
    ctx.clearRect(0, 0, width, height);

    return {
      id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      visible: true,
      opacity: 1.0,
      canvas,
    };
  };

  const getCtx = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d", { willReadFrequently: true });
  };

  const getActiveLayerCtx = () => {
    const layer = layers.find((l) => l.id === activeLayerId);
    if (!layer) return null;
    return layer.canvas.getContext("2d", { willReadFrequently: true });
  };

  // Composite all visible layers onto the main canvas
  const compositeAllLayers = () => {
    const ctx = getCtx();
    if (!ctx) return;

    // Clear main canvas
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, width, height);

    // Draw each visible layer
    for (const layer of layers) {
      if (!layer.visible) continue;

      ctx.globalAlpha = layer.opacity;
      ctx.drawImage(layer.canvas, 0, 0, width, height);
    }
    ctx.globalAlpha = 1.0;
  };

  const pushHistory = () => {
    // Save the entire layers state
    const layerSnapshots = layers.map(layer => {
      const ctx = layer.canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return null;
      return {
        id: layer.id,
        imageData: ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height),
        visible: layer.visible,
        opacity: layer.opacity,
        name: layer.name,
      };
    }).filter(Boolean);

    setHistory((h) => {
      const newHistory = [...h.slice(0, historyStep + 1), layerSnapshots as any].slice(-30);
      setHistoryStep(newHistory.length - 1);
      return newHistory;
    });
  };

  const undo = () => {
    if (historyStep <= 0 || history.length === 0) return;
    const newStep = historyStep - 1;
    const layerSnapshots = history[newStep] as any;

    // Restore all layers from snapshot
    const restoredLayers = layers.map(layer => {
      const snapshot = layerSnapshots.find((s: any) => s.id === layer.id);
      if (!snapshot) return layer;

      const ctx = layer.canvas.getContext("2d")!;
      ctx.putImageData(snapshot.imageData, 0, 0);

      return {
        ...layer,
        visible: snapshot.visible,
        opacity: snapshot.opacity,
        name: snapshot.name,
      };
    });

    setLayers(restoredLayers);
    setHistoryStep(newStep);
    compositeAllLayers();
  };

  const redo = () => {
    if (historyStep >= history.length - 1) return;
    const newStep = historyStep + 1;
    const layerSnapshots = history[newStep] as any;

    // Restore all layers from snapshot
    const restoredLayers = layers.map(layer => {
      const snapshot = layerSnapshots.find((s: any) => s.id === layer.id);
      if (!snapshot) return layer;

      const ctx = layer.canvas.getContext("2d")!;
      ctx.putImageData(snapshot.imageData, 0, 0);

      return {
        ...layer,
        visible: snapshot.visible,
        opacity: snapshot.opacity,
        name: snapshot.name,
      };
    });

    setLayers(restoredLayers);
    setHistoryStep(newStep);
    compositeAllLayers();
  };

  const clear = () => {
    const layerCtx = getActiveLayerCtx();
    if (!layerCtx) return;
    pushHistory();
    // Clear active layer to transparent
    layerCtx.clearRect(0, 0, width, height);
    compositeAllLayers();
  };

  // Flood fill algorithm for bucket tool
  const floodFill = (startX: number, startY: number, fillColor: string) => {
    const layerCtx = getActiveLayerCtx();
    if (!layerCtx) return;

    const imageData = layerCtx.getImageData(0, 0, layerCtx.canvas.width, layerCtx.canvas.height);
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

    layerCtx.putImageData(imageData, 0, 0);
    compositeAllLayers();
  };

  // Draw shapes with support for fill, stroke, or both
  const drawShape = (ctx: CanvasRenderingContext2D, start: { x: number; y: number }, end: { x: number; y: number }) => {
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const applyShapeMode = () => {
      if (shapeMode === 'fill') {
        ctx.fill();
      } else if (shapeMode === 'stroke') {
        ctx.stroke();
      } else if (shapeMode === 'both') {
        ctx.fill();
        ctx.stroke();
      }
    };

    if (tool === "rectangle") {
      const w = end.x - start.x;
      const h = end.y - start.y;

      if (shapeMode === 'fill') {
        ctx.fillRect(start.x, start.y, w, h);
      } else if (shapeMode === 'stroke') {
        ctx.strokeRect(start.x, start.y, w, h);
      } else if (shapeMode === 'both') {
        ctx.fillRect(start.x, start.y, w, h);
        ctx.strokeRect(start.x, start.y, w, h);
      }
    } else if (tool === "circle") {
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const radius = Math.sqrt(dx * dx + dy * dy);
      ctx.beginPath();
      ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
      applyShapeMode();
    } else if (tool === "triangle") {
      const w = end.x - start.x;
      const h = end.y - start.y;
      ctx.beginPath();
      ctx.moveTo(start.x + w / 2, start.y); // Top point
      ctx.lineTo(start.x + w, start.y + h); // Bottom right
      ctx.lineTo(start.x, start.y + h); // Bottom left
      ctx.closePath();
      applyShapeMode();
    } else if (tool === "star") {
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const radius = Math.sqrt(dx * dx + dy * dy);
      const innerRadius = radius * 0.4;
      const points = 5;

      ctx.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? radius : innerRadius;
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const x = start.x + r * Math.cos(angle);
        const y = start.y + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      applyShapeMode();
    } else if (tool === "heart") {
      const w = end.x - start.x;
      const h = end.y - start.y;
      const size = Math.max(Math.abs(w), Math.abs(h));

      ctx.beginPath();
      ctx.moveTo(start.x, start.y + size * 0.3);

      // Left curve
      ctx.bezierCurveTo(
        start.x, start.y,
        start.x - size * 0.5, start.y,
        start.x - size * 0.5, start.y + size * 0.3
      );
      ctx.bezierCurveTo(
        start.x - size * 0.5, start.y + size * 0.6,
        start.x, start.y + size * 0.8,
        start.x, start.y + size
      );

      // Right curve
      ctx.bezierCurveTo(
        start.x, start.y + size * 0.8,
        start.x + size * 0.5, start.y + size * 0.6,
        start.x + size * 0.5, start.y + size * 0.3
      );
      ctx.bezierCurveTo(
        start.x + size * 0.5, start.y,
        start.x, start.y,
        start.x, start.y + size * 0.3
      );

      ctx.closePath();
      applyShapeMode();
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
      ctx.strokeStyle = strokeColor;
      ctx.globalAlpha = 1.0;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    } else if (tool === "marker") {
      ctx.lineWidth = strokeWidth * 2;
      ctx.strokeStyle = strokeColor;
      ctx.globalAlpha = 1.0;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    } else if (tool === "highlighter") {
      ctx.lineWidth = strokeWidth * 3;
      ctx.strokeStyle = strokeColor;
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
        ctx.fillStyle = strokeColor;
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
    const layerCtx = getActiveLayerCtx();
    if (!layerCtx) return;

    pushHistory();
    const fontSize = Math.max(16, strokeWidth * 3);
    layerCtx.font = `${fontSize}px sans-serif`;
    layerCtx.fillStyle = fillColor;
    layerCtx.fillText(textValue, textInputPos.x, textInputPos.y);

    setShowTextInput(false);
    setTextValue("");
    setTextInputPos(null);
    compositeAllLayers();
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

    // Initialize first layer if no layers exist
    if (layers.length === 0) {
      const initialLayer = createLayer("Layer 1");

      // If we have an initial drawing, render it on the first layer
      if (initialDataUrl) {
        const img = new Image();
        img.onload = () => {
          try {
            const layerCtx = initialLayer.canvas.getContext("2d")!;
            layerCtx.drawImage(img, 0, 0, width, height);
            setLayers([initialLayer]);
            setActiveLayerId(initialLayer.id);
            pushHistory();
          } catch {
            // ignore
          }
        };
        img.src = initialDataUrl;
      } else {
        setLayers([initialLayer]);
        setActiveLayerId(initialLayer.id);
        pushHistory();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, dpr]);

  // Composite layers whenever they change
  useEffect(() => {
    if (layers.length > 0) {
      compositeAllLayers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Escape: Cancel path or deselect
      if (e.key === "Escape") {
        e.preventDefault();
        if (pathPoints.length > 0) {
          setPathPoints([]);
          const layerCtx = getActiveLayerCtx();
          if (layerCtx && history[historyStep]) {
            const layerSnapshot = (history[historyStep] as any).find((s: any) => s.id === activeLayerId);
            if (layerSnapshot) {
              layerCtx.putImageData(layerSnapshot.imageData, 0, 0);
              compositeAllLayers();
            }
          }
        } else if (selection) {
          commitSelection();
        }
        return;
      }

      // Copy: Ctrl+C or Cmd+C
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && selection) {
        e.preventDefault();
        copySelection();
      }
      // Paste: Ctrl+V or Cmd+V
      else if ((e.ctrlKey || e.metaKey) && e.key === "v" && copiedSelection) {
        e.preventDefault();
        // Paste at center of canvas
        const centerX = width / 2 - (copiedSelection.width / dpr) / 2;
        const centerY = height / 2 - (copiedSelection.height / dpr) / 2;
        pasteSelection({ x: centerX, y: centerY });
      }
      // Cut: Ctrl+X or Cmd+X
      else if ((e.ctrlKey || e.metaKey) && e.key === "x" && selection) {
        e.preventDefault();
        cutSelection();
      }
      // Delete: Delete or Backspace
      else if ((e.key === "Delete" || e.key === "Backspace") && selection) {
        e.preventDefault();
        deleteSelection();
      }
    };

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [selection, copiedSelection, width, height, pathPoints, history, historyStep, activeLayerId]);

  // Handle global pointer events for handle dragging
  useEffect(() => {
    if (!activeHandle || !transformStart) return;

    const handlePointerMove = (e: PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas || !selection || !selectionImage) return;

      const rect = canvas.getBoundingClientRect();
      const point = {
        x: ((e.clientX - rect.left) - panOffset.x) / zoom,
        y: ((e.clientY - rect.top) - panOffset.y) / zoom,
      };

      const layerCtx = getActiveLayerCtx();
      if (layerCtx) {
        // BUGFIX: Restore layer from saved snapshot instead of clearing (preserves other objects)
        if (selectionLayerSnapshot) {
          layerCtx.putImageData(selectionLayerSnapshot, 0, 0);
        }

        if (activeHandle === 'rotate') {
          // Save original dimensions before updating selection
          const origWidth = selection.width;
          const origHeight = selection.height;

          // Calculate rotation angle
          const centerX = selection.x + origWidth / 2;
          const centerY = selection.y + origHeight / 2;

          const startAngle = Math.atan2(transformStart.y - centerY, transformStart.x - centerX);
          const currentAngle = Math.atan2(point.y - centerY, point.x - centerX);
          const angleDelta = currentAngle - startAngle;

          setRotationAngle(angleDelta);

          // Draw rotated preview
          const sourceCanvas = document.createElement('canvas');
          sourceCanvas.width = selectionImage.width;
          sourceCanvas.height = selectionImage.height;
          const sourceCtx = sourceCanvas.getContext('2d')!;
          sourceCtx.putImageData(selectionImage, 0, 0);

          // Calculate rotated dimensions for preview
          const cos = Math.abs(Math.cos(angleDelta));
          const sin = Math.abs(Math.sin(angleDelta));
          const newWidth = origWidth * cos + origHeight * sin;
          const newHeight = origWidth * sin + origHeight * cos;

          // Update selection bounds to match rotated dimensions (visual feedback)
          const newX = centerX - newWidth / 2;
          const newY = centerY - newHeight / 2;
          setSelection({ x: newX, y: newY, width: newWidth, height: newHeight });

          // Draw rotated image centered at selection center
          layerCtx.save();
          layerCtx.translate((centerX) * dpr, (centerY) * dpr);
          layerCtx.rotate(angleDelta);
          layerCtx.drawImage(
            sourceCanvas,
            -(origWidth / 2) * dpr,
            -(origHeight / 2) * dpr,
            origWidth * dpr,
            origHeight * dpr
          );
          layerCtx.restore();
        } else {
          // Handle resize
          transformSelectionWithHandle(activeHandle, point, transformStart);
          setTransformStart(point);

          // Draw scaled preview
          const sourceCanvas = document.createElement('canvas');
          sourceCanvas.width = selectionImage.width;
          sourceCanvas.height = selectionImage.height;
          const sourceCtx = sourceCanvas.getContext('2d')!;
          sourceCtx.putImageData(selectionImage, 0, 0);

          layerCtx.drawImage(
            sourceCanvas,
            selection.x * dpr,
            selection.y * dpr,
            selection.width * dpr,
            selection.height * dpr
          );
        }

        compositeAllLayers();
      }
    };

    const handlePointerUp = () => {
      if (selection && selectionImage) {
        if (activeHandle === 'rotate') {
          applyRotation(rotationAngle);
          setRotationAngle(0);
        } else {
          applySelectionResize();
        }
      }
      setActiveHandle(null);
      setTransformStart(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [activeHandle, transformStart, selection, selectionImage, panOffset, zoom, rotationAngle, selectionLayerSnapshot, dpr]);

  const toLocalPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    // Account for zoom and pan
    const x = ((e.clientX - rect.left) - panOffset.x) / zoom;
    const y = ((e.clientY - rect.top) - panOffset.y) / zoom;
    return { x, y };
  };

  const handleZoom = (delta: number, centerX?: number, centerY?: number) => {
    const newZoom = Math.max(0.1, Math.min(5, zoom + delta));

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

  // Check if a point is inside the selection
  const isPointInSelection = (point: { x: number; y: number }): boolean => {
    if (!selection) return false;
    return (
      point.x >= selection.x &&
      point.x <= selection.x + selection.width &&
      point.y >= selection.y &&
      point.y <= selection.y + selection.height
    );
  };

  // Check if ImageData contains any non-transparent pixels
  const checkImageDataHasContent = (imageData: ImageData): boolean => {
    const pixels = imageData.data;
    // Check alpha channel (every 4th byte starting from index 3)
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] > 0) {
        return true; // Found a non-transparent pixel
      }
    }
    return false; // All pixels are transparent
  };

  // Check if a specific pixel is non-transparent
  const isPixelNonTransparent = (imageData: ImageData, x: number, y: number): boolean => {
    if (x < 0 || x >= imageData.width || y < 0 || y >= imageData.height) return false;
    const index = (y * imageData.width + x) * 4 + 3; // Alpha channel
    return imageData.data[index] > 10; // Small threshold to ignore near-transparent pixels
  };

  // Flood-fill based selection - finds all connected pixels starting from a point
  const selectObjectAtPoint = (clickX: number, clickY: number) => {
    const layerCtx = getActiveLayerCtx();
    if (!layerCtx) return;

    const canvasWidth = layerCtx.canvas.width;
    const canvasHeight = layerCtx.canvas.height;
    const imageData = layerCtx.getImageData(0, 0, canvasWidth, canvasHeight);

    const startX = Math.floor(clickX * dpr);
    const startY = Math.floor(clickY * dpr);

    // Check if we clicked on something
    if (!isPixelNonTransparent(imageData, startX, startY)) {
      return; // Clicked on transparent area
    }

    // Flood-fill to find all connected pixels
    const visited = new Set<string>();
    const selectedPixels = new Set<string>(); // Track which specific pixels are selected
    const stack: Array<[number, number]> = [[startX, startY]];
    let minX = startX, maxX = startX, minY = startY, maxY = startY;

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const key = `${x},${y}`;

      if (visited.has(key)) continue;
      if (!isPixelNonTransparent(imageData, x, y)) continue;

      visited.add(key);
      selectedPixels.add(key); // Remember this pixel was selected

      // Update bounding box
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);

      // Add adjacent pixels
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    // Add padding to bounding box
    const padding = 2;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(canvasWidth - 1, maxX + padding);
    maxY = Math.min(canvasHeight - 1, maxY + padding);

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;

    if (width < 3 || height < 3) return; // Too small

    // Create ImageData for the selection containing ONLY the selected pixels
    const selectedImageData = layerCtx.createImageData(width, height);

    // Copy only the flood-filled pixels into the selection (not the entire bounding box)
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const key = `${x},${y}`;
        if (selectedPixels.has(key)) {
          // Copy this pixel to the selection
          const srcIdx = (y * canvasWidth + x) * 4;
          const destIdx = ((y - minY) * width + (x - minX)) * 4;
          selectedImageData.data[destIdx] = imageData.data[srcIdx];
          selectedImageData.data[destIdx + 1] = imageData.data[srcIdx + 1];
          selectedImageData.data[destIdx + 2] = imageData.data[srcIdx + 2];
          selectedImageData.data[destIdx + 3] = imageData.data[srcIdx + 3];
        }
        // Otherwise leave it transparent (default)
      }
    }

    // Check if selection has content
    if (!checkImageDataHasContent(selectedImageData)) return;

    // CRITICAL: Save a snapshot of the current layer BEFORE making selection
    // We'll need this to restore the layer during transforms
    const layerSnapshot = layerCtx.getImageData(0, 0, canvasWidth, canvasHeight);

    // Clear ONLY the selected pixels from the layer (not the entire bounding box rectangle)
    // This preserves other objects that might be in the same region
    pushHistory();
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const key = `${x},${y}`;
        if (selectedPixels.has(key)) {
          // Clear this specific pixel by setting alpha to 0
          const idx = (y * canvasWidth + x) * 4;
          imageData.data[idx + 3] = 0; // Make transparent
        }
      }
    }

    // Put the modified image data back to the layer
    layerCtx.putImageData(imageData, 0, 0);
    compositeAllLayers();

    // Create selection and save the layer snapshot from BEFORE we cleared pixels
    setSelection({
      x: minX / dpr,
      y: minY / dpr,
      width: width / dpr,
      height: height / dpr,
    });
    setSelectionImage(selectedImageData);
    setSelectionLayerSnapshot(layerSnapshot); // Save actual layer data before selection was lifted
  };

  // Get transform handle positions for current selection
  const getTransformHandles = () => {
    if (!selection) return null;

    const handleSize = 14 / zoom; // Responsive to zoom level, slightly bigger
    const { x, y, width, height } = selection;
    const rotateDistance = 35 / zoom; // Distance above selection for rotate handle

    return {
      // Corner handles
      topLeft: { x: x - handleSize / 2, y: y - handleSize / 2, width: handleSize, height: handleSize },
      topRight: { x: x + width - handleSize / 2, y: y - handleSize / 2, width: handleSize, height: handleSize },
      bottomLeft: { x: x - handleSize / 2, y: y + height - handleSize / 2, width: handleSize, height: handleSize },
      bottomRight: { x: x + width - handleSize / 2, y: y + height - handleSize / 2, width: handleSize, height: handleSize },

      // Edge handles
      topCenter: { x: x + width / 2 - handleSize / 2, y: y - handleSize / 2, width: handleSize, height: handleSize },
      bottomCenter: { x: x + width / 2 - handleSize / 2, y: y + height - handleSize / 2, width: handleSize, height: handleSize },
      leftCenter: { x: x - handleSize / 2, y: y + height / 2 - handleSize / 2, width: handleSize, height: handleSize },
      rightCenter: { x: x + width - handleSize / 2, y: y + height / 2 - handleSize / 2, width: handleSize, height: handleSize },

      // Rotation handle (above top center)
      rotate: { x: x + width / 2 - handleSize / 2, y: y - rotateDistance - handleSize / 2, width: handleSize, height: handleSize },
    };
  };

  // Check which handle (if any) was clicked
  const getClickedHandle = (point: { x: number; y: number }): string | null => {
    const handles = getTransformHandles();
    if (!handles) return null;

    for (const [name, rect] of Object.entries(handles)) {
      if (
        point.x >= rect.x &&
        point.x <= rect.x + rect.width &&
        point.y >= rect.y &&
        point.y <= rect.y + rect.height
      ) {
        return name;
      }
    }

    return null;
  };

  // Resize/transform selection based on handle drag
  const transformSelectionWithHandle = (handle: string, currentPoint: { x: number; y: number }, startPoint: { x: number; y: number }) => {
    if (!selection || !selectionImage) return;

    const dx = currentPoint.x - startPoint.x;
    const dy = currentPoint.y - startPoint.y;

    let newX = selection.x;
    let newY = selection.y;
    let newWidth = selection.width;
    let newHeight = selection.height;

    // Calculate new dimensions based on which handle is being dragged
    switch (handle) {
      case 'topLeft':
        newX += dx;
        newY += dy;
        newWidth -= dx;
        newHeight -= dy;
        break;
      case 'topRight':
        newY += dy;
        newWidth += dx;
        newHeight -= dy;
        break;
      case 'bottomLeft':
        newX += dx;
        newWidth -= dx;
        newHeight += dy;
        break;
      case 'bottomRight':
        newWidth += dx;
        newHeight += dy;
        break;
      case 'topCenter':
        newY += dy;
        newHeight -= dy;
        break;
      case 'bottomCenter':
        newHeight += dy;
        break;
      case 'leftCenter':
        newX += dx;
        newWidth -= dx;
        break;
      case 'rightCenter':
        newWidth += dx;
        break;
    }

    // Prevent negative dimensions
    if (newWidth < 10 || newHeight < 10) return;

    // Update selection bounds
    setSelection({ x: newX, y: newY, width: newWidth, height: newHeight });
  };

  // Apply the resize to the actual ImageData
  const applySelectionResize = () => {
    if (!selection || !selectionImage) return;
    const layerCtx = getActiveLayerCtx();
    if (!layerCtx) return;

    // Create temp canvas with original image
    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = selectionImage.width;
    sourceCanvas.height = selectionImage.height;
    const sourceCtx = sourceCanvas.getContext('2d')!;
    sourceCtx.putImageData(selectionImage, 0, 0);

    // Create destination canvas with new size
    const destCanvas = document.createElement('canvas');
    destCanvas.width = selection.width * dpr;
    destCanvas.height = selection.height * dpr;
    const destCtx = destCanvas.getContext('2d')!;

    // Draw scaled image
    destCtx.drawImage(sourceCanvas, 0, 0, destCanvas.width, destCanvas.height);

    // Get scaled ImageData
    const scaledImageData = destCtx.getImageData(0, 0, destCanvas.width, destCanvas.height);

    // BUGFIX: Restore layer from saved snapshot (preserves other objects)
    if (selectionLayerSnapshot) {
      layerCtx.putImageData(selectionLayerSnapshot, 0, 0);
    }

    // Draw scaled selection at new position
    layerCtx.putImageData(scaledImageData, selection.x * dpr, selection.y * dpr);
    compositeAllLayers();

    // Update selection image to the scaled version
    setSelectionImage(scaledImageData);
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
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

    // Check if clicking a transform handle (only in select mode with active selection)
    if (tool === "select" && selection) {
      const handleClicked = getClickedHandle(point);
      if (handleClicked) {
        e.stopPropagation();
        // Start transform mode for any handle (including rotate)
        setActiveHandle(handleClicked);
        setTransformStart(point);
        return;
      }

      // Check if clicking inside an existing selection to drag it
      if (isPointInSelection(point)) {
        setIsDraggingSelection(true);
        setDragStartPoint(point);
        setOriginalSelectionPos({ x: selection.x, y: selection.y });
        return;
      }
    }

    // Handle fill tool
    if (tool === "fill") {
      pushHistory();
      // Account for DPR and zoom when flood filling
      floodFill(point.x * dpr, point.y * dpr, fillColor);
      return;
    }

    // Handle text tool
    if (tool === "text") {
      setTextInputPos(point);
      setShowTextInput(true);
      return;
    }

    // Handle select tool
    if (tool === "select") {
      // If clicking outside existing selection, commit it
      if (selection && !isPointInSelection(point)) {
        commitSelection();
      }

      // Start tracking for click vs drag detection
      drawing.current = true;
      shapeStart.current = point;
      setIsSelectingByClick(true);
      return;
    }

    // Handle path tool (combined polygon/curve - click to add points, double-click to finish)
    if (tool === "path") {
      const newPoints = [...pathPoints, point];
      setPathPoints(newPoints);

      // Draw preview
      const layerCtx = getActiveLayerCtx();
      if (layerCtx && newPoints.length > 1) {
        // Restore last state
        if (history[historyStep]) {
          const layerSnapshot = (history[historyStep] as any).find((s: any) => s.id === activeLayerId);
          if (layerSnapshot) {
            layerCtx.putImageData(layerSnapshot.imageData, 0, 0);
          }
        }

        // Draw path preview with smooth curves between points
        layerCtx.strokeStyle = strokeColor;
        layerCtx.fillStyle = fillColor;
        layerCtx.lineWidth = strokeWidth;
        layerCtx.globalAlpha = opacity;
        layerCtx.beginPath();
        layerCtx.moveTo(newPoints[0].x, newPoints[0].y);

        // Draw lines connecting points
        for (let i = 1; i < newPoints.length; i++) {
          layerCtx.lineTo(newPoints[i].x, newPoints[i].y);
        }
        layerCtx.stroke();
        layerCtx.globalAlpha = 1.0;
        compositeAllLayers();
      }
      return;
    }

    // Handle shape tools
    const isShapeTool = ["rectangle", "circle", "triangle", "star", "heart", "line", "arrow"].includes(tool);
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
    // Skip if dragging a handle (global listeners handle it)
    if (activeHandle) return;

    const p = toLocalPoint(e);

    // Handle dragging selection
    if (isDraggingSelection && dragStartPoint && selection && selectionImage && originalSelectionPos) {
      const layerCtx = getActiveLayerCtx();
      if (!layerCtx) return;

      const dx = p.x - dragStartPoint.x;
      const dy = p.y - dragStartPoint.y;

      // Calculate new position
      const newX = selection.x + dx;
      const newY = selection.y + dy;

      // Clear layer completely to prevent copies
      layerCtx.clearRect(0, 0, layerCtx.canvas.width, layerCtx.canvas.height);

      // Draw selection at new position
      layerCtx.putImageData(selectionImage, newX * dpr, newY * dpr);
      compositeAllLayers();

      // Update selection position
      setSelection({
        x: newX,
        y: newY,
        width: selection.width,
        height: selection.height,
      });
      setDragStartPoint(p);
      return;
    }

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

    // Handle selection preview (no drawing, just UI update)
    if (tool === "select" && shapeStart.current) {
      // Check if user has moved enough to be considered "dragging" (box selection)
      const dx = Math.abs(p.x - shapeStart.current.x);
      const dy = Math.abs(p.y - shapeStart.current.y);

      if (dx > 5 || dy > 5) {
        // User is dragging - switch to box selection mode
        setIsSelectingByClick(false);

        const x = Math.min(shapeStart.current.x, p.x);
        const y = Math.min(shapeStart.current.y, p.y);
        const width = Math.abs(p.x - shapeStart.current.x);
        const height = Math.abs(p.y - shapeStart.current.y);
        setSelectionPreview({ x, y, width, height });
      }
      return;
    }

    const layerCtx = getActiveLayerCtx();
    if (!layerCtx) return;

    // Handle shape drawing with preview
    const isShapeTool = ["rectangle", "circle", "triangle", "star", "heart", "line", "arrow"].includes(tool);
    if (isShapeTool && shapeStart.current) {
      // Restore to last history state for preview
      if (history[historyStep]) {
        const layerSnapshot = (history[historyStep] as any).find((s: any) => s.id === activeLayerId);
        if (layerSnapshot) {
          layerCtx.putImageData(layerSnapshot.imageData, 0, 0);
        }
      }
      drawShape(layerCtx, shapeStart.current, p);
      compositeAllLayers();
      return;
    }

    // Handle brush tools
    const last = lastPoint.current;
    if (!last) {
      lastPoint.current = p;
      return;
    }

    drawBrush(layerCtx, last, p);
    lastPoint.current = p;
    compositeAllLayers();
  };

  const handleDoubleClick = () => {
    // Finalize path on double-click
    if (tool === "path" && pathPoints.length >= 2) {
      const layerCtx = getActiveLayerCtx();
      if (!layerCtx) return;

      pushHistory();

      // Draw final path
      layerCtx.strokeStyle = strokeColor;
      layerCtx.fillStyle = fillColor;
      layerCtx.lineWidth = strokeWidth;
      layerCtx.globalAlpha = opacity;
      layerCtx.beginPath();
      layerCtx.moveTo(pathPoints[0].x, pathPoints[0].y);
      for (let i = 1; i < pathPoints.length; i++) {
        layerCtx.lineTo(pathPoints[i].x, pathPoints[i].y);
      }
      layerCtx.closePath();

      if (shapeMode === 'fill') {
        layerCtx.fill();
      } else if (shapeMode === 'stroke') {
        layerCtx.stroke();
      } else if (shapeMode === 'both') {
        layerCtx.fill();
        layerCtx.stroke();
      }

      layerCtx.globalAlpha = 1.0;
      compositeAllLayers();
      setPathPoints([]);
      pushHistory();
    }
  };

  const end = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    // Skip if dragging a handle (global listener handles it)
    if (activeHandle) return;

    const ctx = getCtx();
    const layerCtx = getActiveLayerCtx();

    // Finalize dragging selection
    if (isDraggingSelection && selection && selectionImage) {
      pushHistory();
      setIsDraggingSelection(false);
      setDragStartPoint(null);
      setOriginalSelectionPos(null);
      // Selection is already moved and composited, just push history
      return;
    }

    // Finalize selection - capture from ACTIVE LAYER for consistency
    if (tool === "select" && shapeStart.current && drawing.current && e) {
      const point = toLocalPoint(e);

      // Check if this was a click (no drag) - do smart object selection
      if (isSelectingByClick) {
        selectObjectAtPoint(point.x, point.y);
      } else {
        // This was a drag - do box selection
        const x = Math.min(shapeStart.current.x, point.x);
        const y = Math.min(shapeStart.current.y, point.y);
        const width = Math.abs(point.x - shapeStart.current.x);
        const height = Math.abs(point.y - shapeStart.current.y);

        if (width > 5 && height > 5 && layerCtx) {
          // Capture selected area from ACTIVE LAYER (not composite)
          const imageData = layerCtx.getImageData(
            x * dpr,
            y * dpr,
            width * dpr,
            height * dpr
          );

          // Check if selection contains any non-transparent pixels
          const hasContent = checkImageDataHasContent(imageData);

          if (hasContent) {
            pushHistory(); // Push history before clearing

            // Clear the selected area from the layer (cut it out)
            layerCtx.clearRect(x * dpr, y * dpr, width * dpr, height * dpr);
            compositeAllLayers();

            setSelectionImage(imageData);
            setSelection({ x, y, width, height });
          } else {
            // Don't create selection if it's just empty/transparent background
            setSelection(null);
            setSelectionImage(null);
          }
        }
      }

      setSelectionPreview(null);
      shapeStart.current = null;
      setIsSelectingByClick(false);
    }

    // Finalize shape drawing
    const isShapeTool = ["rectangle", "circle", "triangle", "star", "heart", "line", "arrow"].includes(tool);
    if (isShapeTool && shapeStart.current && drawing.current) {
      // Shape is already drawn from move event, just push history
      pushHistory();
      shapeStart.current = null;
    }

    // Finalize brush drawing
    if (["pen", "marker", "highlighter", "spray", "eraser"].includes(tool) && drawing.current) {
      pushHistory();
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

  // Selection operations
  // Commit the selection to the layer and push to history
  const commitSelection = () => {
    if (!selection || !selectionImage) return;
    // The selection is already drawn on the layer
    // Just push to history and clear selection state
    pushHistory();
    setSelection(null);
    setSelectionImage(null);
    setSelectionLayerSnapshot(null);
  };

  const deleteSelection = () => {
    if (!selection) return;
    // Selection was already lifted from layer when it was created
    // Just discard it (leaving the hole in the layer)
    pushHistory();
    setSelection(null);
    setSelectionImage(null);
    setSelectionLayerSnapshot(null);
  };

  const copySelection = () => {
    if (!selectionImage || !selection) return;
    setCopiedSelection(selectionImage);
    // Create a temporary message
    const message = document.createElement("div");
    message.textContent = "Selection copied! Press Ctrl+V to paste";
    message.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:white;padding:12px 24px;border-radius:8px;z-index:1000;font-size:14px;";
    document.body.appendChild(message);
    setTimeout(() => message.remove(), 2000);
  };

  const pasteSelection = (point: { x: number; y: number }) => {
    if (!copiedSelection) return;
    const layerCtx = getActiveLayerCtx();
    if (!layerCtx) return;

    pushHistory();
    layerCtx.putImageData(copiedSelection, point.x * dpr, point.y * dpr);
    compositeAllLayers();

    // Set as new selection
    setSelection({
      x: point.x,
      y: point.y,
      width: copiedSelection.width / dpr,
      height: copiedSelection.height / dpr,
    });
    setSelectionImage(copiedSelection);
  };

  const moveSelection = (dx: number, dy: number) => {
    if (!selection || !selectionImage) return;
    const layerCtx = getActiveLayerCtx();
    if (!layerCtx) return;

    // BUGFIX: Restore layer from saved snapshot (preserves other objects)
    if (selectionLayerSnapshot) {
      layerCtx.putImageData(selectionLayerSnapshot, 0, 0);
    }

    // Draw selection at new position
    const newX = selection.x + dx;
    const newY = selection.y + dy;
    layerCtx.putImageData(selectionImage, newX * dpr, newY * dpr);
    compositeAllLayers();

    setSelection({ x: newX, y: newY, width: selection.width, height: selection.height });
  };

  const cutSelection = () => {
    if (!selection || !selectionImage) return;
    copySelection();
    deleteSelection();
  };

  // Apply smooth rotation at any angle
  const applyRotation = (angle: number) => {
    if (!selection || !selectionImage || angle === 0) return;
    const layerCtx = getActiveLayerCtx();
    if (!layerCtx) return;

    // Create source canvas
    const sourceCanvas = document.createElement("canvas");
    sourceCanvas.width = selectionImage.width;
    sourceCanvas.height = selectionImage.height;
    const sourceCtx = sourceCanvas.getContext("2d")!;
    sourceCtx.putImageData(selectionImage, 0, 0);

    // Calculate new bounding box for rotated image
    const cos = Math.abs(Math.cos(angle));
    const sin = Math.abs(Math.sin(angle));
    const newWidth = Math.ceil(selection.width * cos + selection.height * sin);
    const newHeight = Math.ceil(selection.width * sin + selection.height * cos);

    // Create rotated canvas
    const rotatedCanvas = document.createElement("canvas");
    rotatedCanvas.width = newWidth * dpr;
    rotatedCanvas.height = newHeight * dpr;
    const rotatedCtx = rotatedCanvas.getContext("2d")!;

    // Rotate around center
    rotatedCtx.translate((newWidth / 2) * dpr, (newHeight / 2) * dpr);
    rotatedCtx.rotate(angle);
    rotatedCtx.drawImage(
      sourceCanvas,
      -(selection.width / 2) * dpr,
      -(selection.height / 2) * dpr,
      selection.width * dpr,
      selection.height * dpr
    );

    // Get rotated image data
    const rotatedImageData = rotatedCtx.getImageData(0, 0, rotatedCanvas.width, rotatedCanvas.height);

    // BUGFIX: Restore layer from saved snapshot (preserves other objects)
    if (selectionLayerSnapshot) {
      layerCtx.putImageData(selectionLayerSnapshot, 0, 0);
    }

    // Calculate new position (keep center in same place)
    const centerX = selection.x + selection.width / 2;
    const centerY = selection.y + selection.height / 2;
    const newX = centerX - newWidth / 2;
    const newY = centerY - newHeight / 2;

    // Draw rotated selection
    layerCtx.putImageData(rotatedImageData, newX * dpr, newY * dpr);
    compositeAllLayers();

    // Update selection and selection image with rotated version
    setSelection({
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    });
    setSelectionImage(rotatedImageData);
  };

  const flipSelectionHorizontal = () => {
    if (!selection || !selectionImage) return;
    const layerCtx = getActiveLayerCtx();
    if (!layerCtx) return;

    // Create temp canvas for flipping
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = selectionImage.width;
    tempCanvas.height = selectionImage.height;
    const tempCtx = tempCanvas.getContext("2d")!;

    // Draw the selection ImageData to temp canvas
    const sourceCanvas = document.createElement("canvas");
    sourceCanvas.width = selectionImage.width;
    sourceCanvas.height = selectionImage.height;
    const sourceCtx = sourceCanvas.getContext("2d")!;
    sourceCtx.putImageData(selectionImage, 0, 0);

    // Flip horizontal
    tempCtx.translate(tempCanvas.width, 0);
    tempCtx.scale(-1, 1);
    tempCtx.drawImage(sourceCanvas, 0, 0);

    // Get flipped image data
    const flippedImageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

    // BUGFIX: Restore layer from saved snapshot (preserves other objects)
    if (selectionLayerSnapshot) {
      layerCtx.putImageData(selectionLayerSnapshot, 0, 0);
    }

    // Draw flipped selection
    layerCtx.putImageData(flippedImageData, selection.x * dpr, selection.y * dpr);
    compositeAllLayers();

    setSelectionImage(flippedImageData);
  };

  const flipSelectionVertical = () => {
    if (!selection || !selectionImage) return;
    const layerCtx = getActiveLayerCtx();
    if (!layerCtx) return;

    // Create temp canvas for flipping
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = selectionImage.width;
    tempCanvas.height = selectionImage.height;
    const tempCtx = tempCanvas.getContext("2d")!;

    // Draw the selection ImageData to temp canvas
    const sourceCanvas = document.createElement("canvas");
    sourceCanvas.width = selectionImage.width;
    sourceCanvas.height = selectionImage.height;
    const sourceCtx = sourceCanvas.getContext("2d")!;
    sourceCtx.putImageData(selectionImage, 0, 0);

    // Flip vertical
    tempCtx.translate(0, tempCanvas.height);
    tempCtx.scale(1, -1);
    tempCtx.drawImage(sourceCanvas, 0, 0);

    // Get flipped image data
    const flippedImageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

    // BUGFIX: Restore layer from saved snapshot (preserves other objects)
    if (selectionLayerSnapshot) {
      layerCtx.putImageData(selectionLayerSnapshot, 0, 0);
    }

    // Draw flipped selection
    layerCtx.putImageData(flippedImageData, selection.x * dpr, selection.y * dpr);
    compositeAllLayers();

    setSelectionImage(flippedImageData);
  };

  // Export to PNG file
  const exportToPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reflexia-canvas-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Show confirmation
      const message = document.createElement("div");
      message.textContent = "Canvas exported as PNG!";
      message.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:white;padding:12px 24px;border-radius:8px;z-index:1000;font-size:14px;";
      document.body.appendChild(message);
      setTimeout(() => message.remove(), 2000);
    }, "image/png");
  };

  // Layer management functions
  const addLayer = () => {
    const newLayer = createLayer(`Layer ${layers.length + 1}`);
    setLayers([...layers, newLayer]);
    setActiveLayerId(newLayer.id);
  };

  const deleteLayer = (layerId: string) => {
    if (layers.length <= 1) return; // Keep at least one layer
    const newLayers = layers.filter((l) => l.id !== layerId);
    setLayers(newLayers);
    if (activeLayerId === layerId) {
      setActiveLayerId(newLayers[0].id);
    }
  };

  const toggleLayerVisibility = (layerId: string) => {
    setLayers(
      layers.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l))
    );
  };

  const setLayerOpacity = (layerId: string, opacity: number) => {
    setLayers(
      layers.map((l) => (l.id === layerId ? { ...l, opacity } : l))
    );
  };

  const moveLayerUp = (layerId: string) => {
    const index = layers.findIndex((l) => l.id === layerId);
    if (index >= layers.length - 1) return;
    const newLayers = [...layers];
    [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
    setLayers(newLayers);
  };

  const moveLayerDown = (layerId: string) => {
    const index = layers.findIndex((l) => l.id === layerId);
    if (index <= 0) return;
    const newLayers = [...layers];
    [newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]];
    setLayers(newLayers);
  };

  const mergeLayers = () => {
    if (layers.length <= 1) return;

    // Create a new merged layer
    const mergedLayer = createLayer("Merged");
    const mergedCtx = mergedLayer.canvas.getContext("2d")!;

    // Draw all visible layers onto the merged layer
    for (const layer of layers) {
      if (!layer.visible) continue;
      mergedCtx.globalAlpha = layer.opacity;
      mergedCtx.drawImage(layer.canvas, 0, 0);
    }
    mergedCtx.globalAlpha = 1.0;

    setLayers([mergedLayer]);
    setActiveLayerId(mergedLayer.id);
  };

  // Touch gesture handlers for pinch-to-zoom and two-finger pan
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      // Two-finger gesture - prevent default drawing behavior
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      // Calculate initial distance for pinch-to-zoom
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      lastTouchDistance.current = Math.sqrt(dx * dx + dy * dy);

      // Calculate midpoint for panning
      lastTouchMidpoint.current = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      // Calculate current distance
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);

      // Calculate current midpoint
      const currentMidpoint = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };

      if (lastTouchDistance.current > 0 && lastTouchMidpoint.current) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();

        // Pinch-to-zoom centered on the pinch midpoint
        const distanceDelta = currentDistance - lastTouchDistance.current;
        const zoomDelta = distanceDelta * 0.005; // Scale factor (reduced for smoother zoom)
        const newZoom = Math.max(0.1, Math.min(5, zoom + zoomDelta));

        // Get midpoint position relative to canvas
        const midpointX = currentMidpoint.x - rect.left;
        const midpointY = currentMidpoint.y - rect.top;

        // Calculate canvas position at midpoint
        const canvasX = (midpointX - panOffset.x) / zoom;
        const canvasY = (midpointY - panOffset.y) / zoom;

        // Adjust pan offset to keep midpoint position fixed during zoom
        const newPanOffsetX = midpointX - canvasX * newZoom;
        const newPanOffsetY = midpointY - canvasY * newZoom;

        // Also apply pan from finger movement
        const panDeltaX = currentMidpoint.x - lastTouchMidpoint.current.x;
        const panDeltaY = currentMidpoint.y - lastTouchMidpoint.current.y;

        setPanOffset({
          x: newPanOffsetX + panDeltaX,
          y: newPanOffsetY + panDeltaY,
        });

        setZoom(newZoom);
      }

      lastTouchDistance.current = currentDistance;
      lastTouchMidpoint.current = currentMidpoint;
    }
  };

  // Mouse wheel and trackpad zoom handler
  const handleWheel = (e: React.WheelEvent<HTMLElement>) => {
    // Check if this is a zoom gesture (Ctrl+wheel or trackpad pinch)
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();

      // Get cursor position relative to canvas
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      // Calculate zoom change (deltaY is negative when zooming in)
      const zoomSensitivity = 0.001;
      const zoomDelta = -e.deltaY * zoomSensitivity;
      const newZoom = Math.max(0.1, Math.min(5, zoom + zoomDelta));

      // Calculate how much the cursor position moves due to zoom change
      // This keeps the cursor position fixed on the canvas during zoom
      const zoomRatio = newZoom / zoom;
      const cursorCanvasX = (cursorX - panOffset.x) / zoom;
      const cursorCanvasY = (cursorY - panOffset.y) / zoom;

      // Adjust pan offset to keep cursor position fixed
      const newPanOffsetX = cursorX - cursorCanvasX * newZoom;
      const newPanOffsetY = cursorY - cursorCanvasY * newZoom;

      setZoom(newZoom);
      setPanOffset({
        x: newPanOffsetX,
        y: newPanOffsetY,
      });
    } else if (tool === "hand" || e.shiftKey) {
      // Only pan when hand tool is active or shift is held
      e.preventDefault();
      e.stopPropagation();

      // Regular scroll - pan the canvas
      // Subtract delta to move canvas opposite to scroll direction
      setPanOffset({
        x: panOffset.x - e.deltaX,
        y: panOffset.y - e.deltaY,
      });
    }
    // Otherwise, allow normal scroll behavior
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    // Detect two-finger tap for undo
    if (e.changedTouches.length === 2 && e.touches.length === 0) {
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTime.current;

      // If tap happened quickly (< 300ms) without movement, trigger undo
      if (timeSinceLastTap > 300 && lastTouchDistance.current === 0) {
        undo();
        lastTapTime.current = now;
      }
    }

    if (e.touches.length < 2) {
      lastTouchDistance.current = 0;
      lastTouchMidpoint.current = null;
    }
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
          {!uiMinimized && (
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

            {/* Stroke Color Button */}
            <button
              onClick={() => {
                setShowStrokeColorPicker(!showStrokeColorPicker);
                setShowFillColorPicker(false);
              }}
              className="px-1.5 py-1.5 rounded border border-slate-800 text-slate-200 hover:bg-slate-900/40 relative"
              title="Stroke Color"
            >
              <div
                className="w-4 h-4 rounded border-2 border-slate-600"
                style={{ backgroundColor: strokeColor }}
              />
              <span className="absolute -top-1 -right-1 text-[8px] bg-slate-700 px-0.5 rounded">S</span>
            </button>

            {/* Fill Color Button */}
            <button
              onClick={() => {
                setShowFillColorPicker(!showFillColorPicker);
                setShowStrokeColorPicker(false);
              }}
              className="px-1.5 py-1.5 rounded border border-slate-800 text-slate-200 hover:bg-slate-900/40 relative"
              title="Fill Color"
            >
              <div
                className="w-4 h-4 rounded border border-slate-600"
                style={{ backgroundColor: fillColor }}
              />
              <span className="absolute -top-1 -right-1 text-[8px] bg-slate-700 px-0.5 rounded">F</span>
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

              {/* Shape Mode Toggle (for shape tools) */}
              {['rectangle', 'circle', 'triangle', 'star', 'heart', 'path'].includes(tool) && (
                <div className="flex gap-0.5 border border-slate-800 rounded overflow-hidden">
                  <button
                    onClick={() => setShapeMode('stroke')}
                    className={`px-2 py-1.5 text-xs font-semibold transition-colors ${
                      shapeMode === 'stroke'
                        ? 'bg-slate-700 text-slate-100'
                        : 'bg-transparent text-slate-400 hover:bg-slate-800/50'
                    }`}
                    title="Outline only"
                  >
                    Stroke
                  </button>
                  <button
                    onClick={() => setShapeMode('fill')}
                    className={`px-2 py-1.5 text-xs font-semibold transition-colors ${
                      shapeMode === 'fill'
                        ? 'bg-slate-700 text-slate-100'
                        : 'bg-transparent text-slate-400 hover:bg-slate-800/50'
                    }`}
                    title="Filled only"
                  >
                    Fill
                  </button>
                  <button
                    onClick={() => setShapeMode('both')}
                    className={`px-2 py-1.5 text-xs font-semibold transition-colors ${
                      shapeMode === 'both'
                        ? 'bg-slate-700 text-slate-100'
                        : 'bg-transparent text-slate-400 hover:bg-slate-800/50'
                    }`}
                    title="Fill and outline"
                  >
                    Both
                  </button>
                </div>
              )}

              {/* Tips Toggle */}
              <button
                onClick={() => setShowTips(!showTips)}
                className={`px-2 py-1.5 rounded border text-xs font-semibold transition-colors ${
                  showTips
                    ? 'bg-cyan-700 border-cyan-600 text-cyan-100'
                    : 'bg-transparent border-slate-800 text-slate-400'
                }`}
                title={showTips ? "Hide tips" : "Show tips"}
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Stroke Color Picker */}
          {!uiMinimized && showStrokeColorPicker && (
            <div className="p-2 bg-slate-900/60 rounded border border-slate-800 space-y-2 flex-shrink-0">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Droplet className="w-3 h-3" />
                Stroke Color
              </div>
              {/* Color Wheel */}
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={strokeColor}
                  onChange={(e) => setStrokeColor(e.target.value)}
                  className="w-full h-7 rounded border border-slate-700 bg-slate-950 cursor-pointer"
                  title="Pick stroke color"
                />
              </div>

              {/* Quick Colors */}
              <div className="flex gap-1.5">
                {quickColors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setStrokeColor(c)}
                    className={[
                      "w-6 h-6 rounded border hover:scale-110 transition-transform",
                      c === strokeColor ? "border-slate-100 border-2" : "border-slate-700",
                    ].join(" ")}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Fill Color Picker */}
          {!uiMinimized && showFillColorPicker && (
            <div className="p-2 bg-slate-900/60 rounded border border-slate-800 space-y-2 flex-shrink-0">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Droplet className="w-3 h-3" />
                Fill Color
              </div>
              {/* Color Wheel */}
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={fillColor}
                  onChange={(e) => setFillColor(e.target.value)}
                  className="w-full h-7 rounded border border-slate-700 bg-slate-950 cursor-pointer"
                  title="Pick fill color"
                />
              </div>

              {/* Quick Colors */}
              <div className="flex gap-1.5">
                {quickColors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setFillColor(c)}
                    className={[
                      "w-6 h-6 rounded border hover:scale-110 transition-transform",
                      c === fillColor ? "border-slate-100 border-2" : "border-slate-700",
                    ].join(" ")}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Zoom Controls */}
          {!uiMinimized && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900/40 rounded border border-slate-800 flex-shrink-0">
            <button
              onClick={() => handleZoom(-0.25)}
              disabled={zoom <= 0.1}
              className="p-1 rounded border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-slate-400 text-[10px] min-w-[2.5rem] text-center font-mono">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => handleZoom(0.25)}
              disabled={zoom >= 5}
              className="p-1 rounded border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
              <button
                onClick={resetView}
                className="px-1.5 py-1 rounded border border-slate-700 text-slate-300 hover:bg-slate-800 text-[10px]"
                title="Reset zoom (1:1) and center canvas"
              >
                1:1
              </button>
            </div>
          )}

          {/* Bottom row - Actions */}
          <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0">
            <button
              onClick={undo}
              disabled={historyStep <= 0}
              className="px-2 py-1 rounded border border-slate-800 text-slate-200 hover:bg-slate-900/40 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed text-xs"
              title="Undo (or two-finger tap)"
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
              title="Clear active layer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>

            <button
              onClick={() => setShowLayersPanel(!showLayersPanel)}
              className={`px-2 py-1 rounded border border-slate-800 text-slate-200 hover:bg-slate-900/40 flex items-center gap-1 text-xs ${showLayersPanel ? 'bg-slate-800' : ''}`}
              title="Layers"
            >
              <Layers className="w-3.5 h-3.5" />
              Layers
            </button>

            <button
              onClick={() => setUiMinimized(!uiMinimized)}
              className="px-2 py-1 rounded border border-slate-800 text-slate-200 hover:bg-slate-900/40 flex items-center gap-1 text-xs"
              title={uiMinimized ? "Maximize toolbar" : "Minimize toolbar"}
            >
              {uiMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={exportToPNG}
              className="px-2 py-1 rounded border border-slate-800 text-slate-200 hover:bg-slate-900/40 flex items-center gap-1 text-xs"
              title="Export canvas as PNG"
            >
              <Download className="w-3.5 h-3.5" />
              Export
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

          <div
            className="flex-1 rounded-lg border border-slate-800 bg-slate-950 p-1 overflow-hidden relative"
            onWheel={handleWheel}
          >
            <div
              style={{
                transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
                transformOrigin: "0 0",
                cursor: isDraggingSelection ? "grabbing" : tool === "hand" ? "grab" : selection ? "move" : "crosshair",
              }}
            >
              <canvas
                ref={canvasRef}
                className="rounded border border-slate-800"
                onPointerDown={start}
                onPointerMove={move}
                onPointerUp={end}
                onPointerCancel={end}
                onPointerLeave={end}
                onDoubleClick={handleDoubleClick}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              />

              {/* Selection Preview (while dragging) */}
              {selectionPreview && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: selectionPreview.x,
                    top: selectionPreview.y,
                    width: selectionPreview.width,
                    height: selectionPreview.height,
                    border: "2px dashed #94a3b8",
                    backgroundColor: "rgba(148, 163, 184, 0.1)",
                  }}
                />
              )}

              {/* Selection Overlay (finalized) */}
              {selection && (
                <>
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: selection.x,
                      top: selection.y,
                      width: selection.width,
                      height: selection.height,
                      border: "2px dashed #60a5fa",
                      backgroundColor: "rgba(96, 165, 250, 0.1)",
                      animation: "marching-ants 0.5s linear infinite",
                    }}
                  />

                  {/* Rotation Handle Connection Line */}
                  {selection && (() => {
                    const handleSize = 14 / zoom;
                    const rotateDistance = 35 / zoom;
                    const lineStartY = selection.y;
                    const lineEndY = selection.y - rotateDistance;
                    const centerX = selection.x + selection.width / 2;

                    return (
                      <div
                        className="absolute pointer-events-none"
                        style={{
                          left: centerX,
                          top: lineEndY,
                          width: '2px',
                          height: rotateDistance,
                          backgroundColor: '#f59e0b',
                          opacity: 0.6,
                        }}
                      />
                    );
                  })()}

                  {/* Transform Handles */}
                  {(() => {
                    const handles = getTransformHandles();
                    if (!handles) return null;

                    return Object.entries(handles).map(([name, rect]) => (
                      <div
                        key={name}
                        className="absolute pointer-events-auto cursor-pointer z-10 flex items-center justify-center"
                        style={{
                          left: rect.x,
                          top: rect.y,
                          width: rect.width,
                          height: rect.height,
                          backgroundColor: name === 'rotate' ? '#f59e0b' : '#60a5fa',
                          border: '2px solid white',
                          borderRadius: name === 'rotate' ? '50%' : '2px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                          cursor: name === 'rotate' ? 'pointer' :
                                  name.includes('Top') && name.includes('Left') ? 'nwse-resize' :
                                  name.includes('Top') && name.includes('Right') ? 'nesw-resize' :
                                  name.includes('Bottom') && name.includes('Left') ? 'nesw-resize' :
                                  name.includes('Bottom') && name.includes('Right') ? 'nwse-resize' :
                                  name.includes('top') || name.includes('bottom') ? 'ns-resize' :
                                  name.includes('left') || name.includes('right') ? 'ew-resize' : 'move',
                        }}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();

                          const canvas = canvasRef.current;
                          if (!canvas) return;
                          const rect = canvas.getBoundingClientRect();
                          const point = {
                            x: ((e.clientX - rect.left) - panOffset.x) / zoom,
                            y: ((e.clientY - rect.top) - panOffset.y) / zoom,
                          };
                          setActiveHandle(name);
                          setTransformStart(point);
                        }}
                        title={name === 'rotate' ? 'Drag to rotate (any angle)' : `Drag to resize (${name})`}
                      >
                        {name === 'rotate' && (
                          <RotateCw
                            size={Math.min(rect.width * 0.6, 10)}
                            className="text-white pointer-events-none"
                          />
                        )}
                      </div>
                    ));
                  })()}
                </>
              )}
            </div>
          </div>

          {/* Tool-specific Instructions */}
          {showTips && (
            <>
              {tool === "select" && !selection && (
                <div className="p-2 bg-cyan-900/40 rounded border border-cyan-700 flex-shrink-0">
                  <div className="text-cyan-200 text-xs text-center">
                    <strong>Click</strong> an object to select it • <strong>Drag</strong> to select area
                  </div>
                </div>
              )}

              {tool === "path" && (
                <div className="p-2 bg-purple-900/40 rounded border border-purple-700 flex-shrink-0">
                  <div className="text-purple-200 text-xs text-center">
                    <strong>Click</strong> to add points • <strong>Double-click</strong> to finish • <strong>Esc</strong> to cancel
                  </div>
                </div>
              )}

              {/* General zoom tip */}
              <div className="p-2 bg-slate-900/40 rounded border border-slate-700 flex-shrink-0">
                <div className="text-slate-300 text-xs text-center">
                  <strong>Ctrl+Scroll</strong> or <strong>Pinch</strong> to zoom • <strong>Shift+Scroll</strong> or <strong>Hand tool</strong> to pan
                </div>
              </div>
            </>
          )}

          {/* Selection Toolbar */}
          {selection && (
            <div className="flex items-center gap-1.5 p-2 bg-blue-900/40 rounded border border-blue-700 flex-shrink-0 flex-wrap">
              <div className="text-blue-200 text-xs font-semibold">Selection:</div>

              <button
                onClick={copySelection}
                className="px-2 py-1 rounded border border-blue-700 text-blue-200 hover:bg-blue-800/40 flex items-center gap-1 text-xs"
                title="Copy selection (Ctrl+C)"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy
              </button>

              <button
                onClick={cutSelection}
                className="px-2 py-1 rounded border border-blue-700 text-blue-200 hover:bg-blue-800/40 flex items-center gap-1 text-xs"
                title="Cut selection (Ctrl+X)"
              >
                <Scissors className="w-3.5 h-3.5" />
                Cut
              </button>

              <button
                onClick={deleteSelection}
                className="px-2 py-1 rounded border border-red-700 text-red-200 hover:bg-red-800/40 flex items-center gap-1 text-xs"
                title="Delete selection (Del)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>

              <div className="w-px h-4 bg-blue-700" />

              <button
                onClick={flipSelectionHorizontal}
                className="px-2 py-1 rounded border border-blue-700 text-blue-200 hover:bg-blue-800/40 flex items-center gap-1 text-xs"
                title="Flip horizontal"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
                Flip H
              </button>

              <button
                onClick={flipSelectionVertical}
                className="px-2 py-1 rounded border border-blue-700 text-blue-200 hover:bg-blue-800/40 flex items-center gap-1 text-xs"
                title="Flip vertical"
              >
                <FlipVertical className="w-3.5 h-3.5" />
                Flip V
              </button>

              {showTips && (
                <div className="text-blue-300 text-[10px] ml-auto">
                  Drag handles to resize • Orange handle = smooth rotate
                </div>
              )}
            </div>
          )}

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

          {/* Layers Panel */}
          {showLayersPanel && (
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-700 max-h-64 overflow-y-auto flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <div className="text-slate-200 text-sm font-semibold">Layers</div>
                <div className="flex gap-1">
                  <button
                    onClick={addLayer}
                    className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200"
                    title="Add layer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={mergeLayers}
                    disabled={layers.length <= 1}
                    className="px-2 py-1 rounded text-[10px] bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Merge all layers"
                  >
                    Merge
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                {[...layers].reverse().map((layer, idx) => (
                  <div
                    key={layer.id}
                    className={`p-2 rounded border ${
                      layer.id === activeLayerId
                        ? "border-blue-500 bg-blue-900/20"
                        : "border-slate-700 bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleLayerVisibility(layer.id)}
                        className="p-0.5 text-slate-400 hover:text-slate-200"
                        title={layer.visible ? "Hide layer" : "Show layer"}
                      >
                        {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>

                      <div
                        onClick={() => setActiveLayerId(layer.id)}
                        className="flex-1 text-xs text-slate-200 cursor-pointer"
                      >
                        {layer.name}
                      </div>

                      <div className="flex gap-0.5">
                        <button
                          onClick={() => moveLayerUp(layer.id)}
                          disabled={idx === 0}
                          className="p-0.5 text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => moveLayerDown(layer.id)}
                          disabled={idx === layers.length - 1}
                          className="p-0.5 text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <ChevronDownIcon className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => deleteLayer(layer.id)}
                          disabled={layers.length <= 1}
                          className="p-0.5 text-red-400 hover:text-red-300 disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Delete layer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Opacity slider */}
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">Opacity:</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={layer.opacity * 100}
                        onChange={(e) => setLayerOpacity(layer.id, Number(e.target.value) / 100)}
                        className="flex-1 h-1"
                        title={`${Math.round(layer.opacity * 100)}%`}
                      />
                      <span className="text-[10px] text-slate-400 w-8">
                        {Math.round(layer.opacity * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
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
