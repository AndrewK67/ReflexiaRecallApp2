import React, { useState } from 'react';
import { Check, Smartphone, Monitor, FileText, Image, Video } from 'lucide-react';

export interface CanvasSize {
  name: string;
  width: number;
  height: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'print' | 'screen' | 'social' | 'custom';
}

export const CANVAS_PRESETS: CanvasSize[] = [
  // Mobile-optimized (default)
  {
    name: 'Phone',
    width: 400,
    height: 780,
    description: 'Optimized for mobile',
    icon: Smartphone,
    category: 'screen'
  },
  // Print sizes (at 150 DPI for mobile performance)
  {
    name: 'A5',
    width: 874,
    height: 1240,
    description: '148×210mm @ 150 DPI',
    icon: FileText,
    category: 'print'
  },
  {
    name: 'A4',
    width: 1240,
    height: 1754,
    description: '210×297mm @ 150 DPI',
    icon: FileText,
    category: 'print'
  },
  // Screen/Video sizes
  {
    name: 'HD 720p',
    width: 1280,
    height: 720,
    description: '16:9 landscape',
    icon: Video,
    category: 'screen'
  },
  {
    name: 'Full HD',
    width: 1920,
    height: 1080,
    description: '16:9 landscape',
    icon: Monitor,
    category: 'screen'
  },
  // Social media
  {
    name: 'Instagram Square',
    width: 1080,
    height: 1080,
    description: '1:1 ratio',
    icon: Image,
    category: 'social'
  },
  {
    name: 'Instagram Story',
    width: 1080,
    height: 1920,
    description: '9:16 portrait',
    icon: Smartphone,
    category: 'social'
  },
];

interface CanvasSizeSelectorProps {
  onSelect: (size: CanvasSize) => void;
  onCancel: () => void;
  currentSize?: { width: number; height: number };
}

export default function CanvasSizeSelector({ onSelect, onCancel, currentSize }: CanvasSizeSelectorProps) {
  const [selectedPreset, setSelectedPreset] = useState<CanvasSize | null>(
    currentSize 
      ? CANVAS_PRESETS.find(p => p.width === currentSize.width && p.height === currentSize.height) || null
      : CANVAS_PRESETS[0]
  );
  const [showCustom, setShowCustom] = useState(false);
  const [customWidth, setCustomWidth] = useState(800);
  const [customHeight, setCustomHeight] = useState(600);

  const handleSelect = () => {
    if (showCustom) {
      onSelect({
        name: 'Custom',
        width: customWidth,
        height: customHeight,
        description: `${customWidth}×${customHeight}px`,
        icon: Image,
        category: 'custom'
      });
    } else if (selectedPreset) {
      onSelect(selectedPreset);
    }
  };

  const getMemoryWarning = (size: CanvasSize) => {
    const pixels = size.width * size.height;
    if (pixels > 2000000) return '⚠️ High memory usage';
    if (pixels > 1500000) return '⚡ May lag on older devices';
    return null;
  };

  return (
    <div className="absolute inset-0 z-[100] flex flex-col bg-slate-950">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-slate-800">
        <h2 className="text-lg font-bold text-slate-100">Select Canvas Size</h2>
        <p className="text-xs text-slate-400 mt-1">Choose a preset or enter custom dimensions</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Presets by category */}
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Mobile Optimized</h3>
          <div className="grid gap-2">
            {CANVAS_PRESETS.filter(p => p.category === 'screen' && p.name === 'Phone').map((preset) => (
              <PresetButton
                key={preset.name}
                preset={preset}
                selected={selectedPreset?.name === preset.name && !showCustom}
                onClick={() => {
                  setSelectedPreset(preset);
                  setShowCustom(false);
                }}
                warning={getMemoryWarning(preset)}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Print Quality</h3>
          <div className="grid gap-2">
            {CANVAS_PRESETS.filter(p => p.category === 'print').map((preset) => (
              <PresetButton
                key={preset.name}
                preset={preset}
                selected={selectedPreset?.name === preset.name && !showCustom}
                onClick={() => {
                  setSelectedPreset(preset);
                  setShowCustom(false);
                }}
                warning={getMemoryWarning(preset)}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Screen / Video</h3>
          <div className="grid gap-2">
            {CANVAS_PRESETS.filter(p => p.category === 'screen' && p.name !== 'Phone').map((preset) => (
              <PresetButton
                key={preset.name}
                preset={preset}
                selected={selectedPreset?.name === preset.name && !showCustom}
                onClick={() => {
                  setSelectedPreset(preset);
                  setShowCustom(false);
                }}
                warning={getMemoryWarning(preset)}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Social Media</h3>
          <div className="grid gap-2">
            {CANVAS_PRESETS.filter(p => p.category === 'social').map((preset) => (
              <PresetButton
                key={preset.name}
                preset={preset}
                selected={selectedPreset?.name === preset.name && !showCustom}
                onClick={() => {
                  setSelectedPreset(preset);
                  setShowCustom(false);
                }}
                warning={getMemoryWarning(preset)}
              />
            ))}
          </div>
        </div>

        {/* Custom Size */}
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Custom Size</h3>
          <button
            onClick={() => setShowCustom(!showCustom)}
            className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
              showCustom
                ? 'border-blue-500 bg-blue-900/20'
                : 'border-slate-700 bg-slate-900/40 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-200">Custom Dimensions</div>
                <div className="text-xs text-slate-400">Enter your own width and height</div>
              </div>
              {showCustom && <Check className="w-5 h-5 text-blue-400" />}
            </div>
          </button>

          {showCustom && (
            <div className="mt-2 p-3 bg-slate-900/60 rounded-lg border border-slate-700 space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Width (px)</label>
                <input
                  type="number"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(Math.max(100, Math.min(4000, parseInt(e.target.value) || 100)))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-200 text-sm"
                  min="100"
                  max="4000"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Height (px)</label>
                <input
                  type="number"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(Math.max(100, Math.min(4000, parseInt(e.target.value) || 100)))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-200 text-sm"
                  min="100"
                  max="4000"
                />
              </div>
              {customWidth * customHeight > 2000000 && (
                <div className="text-xs text-amber-400">⚠️ Large canvas may impact performance</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 p-4 border-t border-slate-800 flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 font-semibold hover:bg-slate-800 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSelect}
          disabled={!showCustom && !selectedPreset}
          className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

interface PresetButtonProps {
  preset: CanvasSize;
  selected: boolean;
  onClick: () => void;
  warning?: string | null;
}

function PresetButton({ preset, selected, onClick, warning }: PresetButtonProps) {
  const Icon = preset.icon;
  
  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
        selected
          ? 'border-blue-500 bg-blue-900/20'
          : 'border-slate-700 bg-slate-900/40 hover:border-slate-600'
      }`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${selected ? 'text-blue-400' : 'text-slate-400'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-semibold text-slate-200">{preset.name}</div>
            {selected && <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />}
          </div>
          <div className="text-xs text-slate-400">{preset.description}</div>
          <div className="text-xs text-slate-500 mt-0.5">{preset.width}×{preset.height}px</div>
          {warning && (
            <div className="text-xs text-amber-400 mt-1">{warning}</div>
          )}
        </div>
      </div>
    </button>
  );
}
