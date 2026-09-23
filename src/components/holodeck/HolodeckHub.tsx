import React from 'react';
import { ArrowLeft, Box } from 'lucide-react';
import { getAllSpaces } from '../../data/holodeckSpaces';
import type { SpaceId } from './types';

interface HolodeckHubProps {
  onSelectSpace: (spaceId: SpaceId) => void;
  onClose: () => void;
}

export default function HolodeckHub({ onSelectSpace, onClose }: HolodeckHubProps) {
  const spaces = getAllSpaces();

  return (
    // One scrolling page (phase 3B.5): the grid used to scroll inside its own
    // box under a fixed footer, so a phone showed one and a half rows of twenty.
    <div className="min-h-full bg-gradient-to-b from-slate-950 to-slate-900 text-white flex flex-col nav-safe">
      {/* Header */}
      <div className="flex-shrink-0 p-6 flex items-center gap-3 border-b border-white/10">
        <button aria-label="Back to dashboard"
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center transition"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <Box size={24} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Spaces</h1>
            <p className="text-white/60 text-xs uppercase tracking-widest font-mono">For specific moments</p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="flex-shrink-0 px-6 pt-4 pb-2">
        <p className="text-white/70 text-sm leading-relaxed">
          Each space is a few questions for one kind of moment. Pick the one that fits what you're dealing with. You can
          leave at any time, and what you write is kept with your other entries.
        </p>
      </div>

      {/* Spaces grid */}
      <div className="p-6 pb-4">
        <div className="grid grid-cols-2 gap-3">
          {spaces.map((space) => {
            const Icon = space.icon;
            return (
              <button
                key={space.id}
                onClick={() => onSelectSpace(space.id)}
                className="group relative p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-left overflow-hidden active:scale-95"
                style={{
                  borderColor: `${space.color}30`,
                }}
              >
                {/* Color accent */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
                  style={{ backgroundColor: space.color }}
                />

                {/* Content */}
                <div className="relative z-10">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{
                      backgroundColor: `${space.color}20`,
                    }}
                  >
                    <Icon size={20} style={{ color: space.color }} />
                  </div>

                  <h3 className="text-sm font-bold mb-1">{space.name}</h3>
                  <p className="text-xs text-white/50 leading-snug">{space.purpose}</p>

                  {space.isSafetyCritical && (
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30">
                      <div className="w-1 h-1 rounded-full bg-amber-400" />
                      <span className="text-xs text-amber-300 font-bold">Gentle</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <p className="px-6 pb-32 text-xs text-white/60 text-center">
        All spaces work offline • Leave any time • No judgement
      </p>
    </div>
  );
}
