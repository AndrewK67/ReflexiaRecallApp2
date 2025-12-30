import React, { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Map, Clock, Grid } from 'lucide-react';
import type { Entry } from '../types';
import {
  getTopKeywords,
  detectThemes,
  findPatterns,
  generateClusters,
} from '../services/mentalAtlasService';

interface MentalAtlasProps {
  entries: Entry[];
}

type ViewMode = 'map' | 'timeline' | 'patterns';

const MentalAtlas: React.FC<MentalAtlasProps> = ({ entries }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Process data using Mental Atlas service
  const { topKeywords, themes, patterns, clusters } = useMemo(() => {
    return {
      topKeywords: getTopKeywords(entries, 15),
      themes: detectThemes(entries),
      patterns: findPatterns(entries, 30),
      clusters: generateClusters(entries),
    };
  }, [entries]);

  // Build nodes for map visualization
  const nodes = useMemo(() => {
    const centerNode = {
      id: 'SELF',
      label: 'YOU',
      value: 10,
      x: 200,
      y: 200,
      hue: 0,
    };

    const keywordNodes = topKeywords.map((kw, index) => {
      const rank = index + 1;
      const orbitRadius = rank <= 5 ? 80 : 140;
      const totalInOrbit = rank <= 5 ? 5 : topKeywords.length - 5;
      const angleStep = (Math.PI * 2) / totalInOrbit;
      const angleOffset = rank <= 5 ? 0 : Math.PI / 4;
      const posInOrbit = rank <= 5 ? rank - 1 : rank - 6;

      const angle = posInOrbit * angleStep + angleOffset;

      return {
        id: kw.word,
        label: kw.word,
        value: kw.count,
        x: 200 + Math.cos(angle) * orbitRadius,
        y: 200 + Math.sin(angle) * orbitRadius,
        hue: (index * 137.5) % 360,
      };
    });

    return [centerNode, ...keywordNodes];
  }, [topKeywords]);

  // Empty state
  if (entries.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-bold text-white">Mental Atlas</h1>
          <p className="text-white/60 text-sm mt-1">Pattern detection from your reflections</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-full border-2 border-white/10 mb-4 flex items-center justify-center">
            <Map size={32} className="text-white/30" />
          </div>
          <p className="text-white/70 font-semibold mb-2">Not enough data yet</p>
          <p className="text-white/40 text-sm max-w-xs">
            Complete more reflections to see patterns emerge in your thinking.
          </p>
        </div>
      </div>
    );
  }

  // Map View
  const renderMapView = () => {
    if (nodes.length <= 1) {
      return (
        <div className="flex items-center justify-center h-full text-white/40">
          <p className="text-sm">No keywords found in entries</p>
        </div>
      );
    }

    const links = nodes
      .filter((node) => node.id !== 'SELF')
      .map((node) => ({
        source: nodes[0],
        target: node,
      }));

    return (
      <div className="relative w-full aspect-square max-w-md mx-auto bg-slate-900 rounded-full border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)_inset] overflow-visible">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, #4f46e5 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        <svg viewBox="0 0 400 400" className="w-full h-full">
          <defs>
            <filter id="glow-node" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id="node-gradient-self">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#6366f1" />
            </radialGradient>
          </defs>

          {/* Links */}
          {links.map((link, i) => (
            <line
              key={i}
              x1={link.source.x}
              y1={link.source.y}
              x2={link.target.x}
              y2={link.target.y}
              stroke="white"
              strokeOpacity="0.1"
              strokeWidth="1"
            />
          ))}

          {/* Orbits */}
          <circle cx="200" cy="200" r="80" fill="none" stroke="white" strokeOpacity="0.05" strokeDasharray="4 4" />
          <circle cx="200" cy="200" r="140" fill="none" stroke="white" strokeOpacity="0.05" strokeDasharray="4 4" />

          {/* Nodes */}
          {nodes.map((node) => {
            const isSelf = node.id === 'SELF';
            const radius = isSelf ? 25 : Math.max(10, Math.min(20, node.value * 3));
            const color = isSelf ? '#ffffff' : `hsl(${node.hue}, 70%, 60%)`;
            const isHovered = hoveredNode === node.id;

            return (
              <g
                key={node.id}
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {isHovered && (
                  <circle cx={node.x} cy={node.y} r={radius + 5} fill="none" stroke={color} strokeWidth="2" opacity="0.5">
                    <animate attributeName="r" values={`${radius + 5};${radius + 10};${radius + 5}`} dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.5;0;0.5" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}

                <circle
                  cx={node.x}
                  cy={node.y}
                  r={radius}
                  fill={isSelf ? 'url(#node-gradient-self)' : color}
                  fillOpacity={isSelf ? 1 : 0.8}
                  stroke={isSelf ? 'none' : 'white'}
                  strokeWidth={isSelf ? 0 : 1}
                  filter="url(#glow-node)"
                />

                <text
                  x={node.x}
                  y={node.y + radius + 15}
                  textAnchor="middle"
                  fill="white"
                  fontSize={isSelf ? 14 : 10}
                  fontWeight={isSelf || isHovered ? 'bold' : 'normal'}
                  opacity={isSelf || isHovered ? 1 : 0.7}
                  className="pointer-events-none"
                  style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
                >
                  {node.label}
                </text>

                {isHovered && !isSelf && (
                  <text x={node.x} y={node.y - radius - 5} textAnchor="middle" fill={color} fontSize="10" fontWeight="bold">
                    ×{node.value}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  // Timeline View
  const renderTimelineView = () => {
    if (themes.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-white/40">
          <p className="text-sm">No themes detected yet</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <p className="text-white/60 text-sm mb-4">Themes that emerged over time in your reflections</p>

        {themes.map((theme, index) => {
          const startDate = new Date(theme.firstSeen).toLocaleDateString();
          const endDate = new Date(theme.lastSeen).toLocaleDateString();
          const color = `hsl(${(index * 137.5) % 360}, 70%, 60%)`;

          return (
            <div
              key={theme.id}
              className="p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {theme.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{ backgroundColor: `${color}30`, color }}
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/50">
                    <span>
                      {startDate} → {endDate}
                    </span>
                    <span>•</span>
                    <span>{theme.count} entries</span>
                    <span>•</span>
                    <span>{Math.round(theme.strength * 100)}% presence</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Patterns View
  const renderPatternsView = () => {
    if (patterns.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-white/40">
          <p className="text-sm">No patterns detected yet</p>
        </div>
      );
    }

    const emerging = patterns.filter((p) => p.type === 'emerging');
    const recurring = patterns.filter((p) => p.type === 'recurring');
    const fading = patterns.filter((p) => p.type === 'fading');

    const renderPatternList = (list: typeof patterns, title: string, icon: React.ReactNode, color: string) => {
      if (list.length === 0) return null;

      return (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            {icon}
            <h3 className="font-bold text-sm" style={{ color }}>
              {title}
            </h3>
            <span className="text-xs text-white/40">({list.length})</span>
          </div>

          <div className="space-y-2">
            {list.map((pattern) => (
              <div
                key={pattern.id}
                className="p-3 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-sm text-white">{pattern.keywords.join(', ')}</div>
                  <div className="text-xs text-white/50 mt-1">
                    {pattern.frequency.toFixed(1)} times/week
                  </div>
                </div>
                {pattern.trend === 'increasing' && <TrendingUp size={16} className="text-emerald-400" />}
                {pattern.trend === 'decreasing' && <TrendingDown size={16} className="text-rose-400" />}
                {pattern.trend === 'stable' && <Minus size={16} className="text-slate-400" />}
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div>
        <p className="text-white/60 text-sm mb-4">Patterns detected in your reflection history</p>

        {renderPatternList(emerging, 'Emerging', <TrendingUp size={16} className="text-emerald-400" />, '#34d399')}
        {renderPatternList(recurring, 'Recurring', <Minus size={16} className="text-blue-400" />, '#60a5fa')}
        {renderPatternList(fading, 'Fading', <TrendingDown size={16} className="text-slate-400" />, '#94a3b8')}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-white/10">
        <h1 className="text-2xl font-bold mb-1">Mental Atlas</h1>
        <p className="text-white/60 text-sm">Pattern detection from {entries.length} entries</p>
      </div>

      {/* View Tabs */}
      <div className="flex-shrink-0 px-6 pt-4">
        <div className="flex gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => setViewMode('map')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${
              viewMode === 'map' ? 'bg-white text-slate-900' : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Map size={16} /> Map
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${
              viewMode === 'timeline' ? 'bg-white text-slate-900' : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock size={16} /> Timeline
          </button>
          <button
            onClick={() => setViewMode('patterns')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${
              viewMode === 'patterns' ? 'bg-white text-slate-900' : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Grid size={16} /> Patterns
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-32">
        {viewMode === 'map' && renderMapView()}
        {viewMode === 'timeline' && renderTimelineView()}
        {viewMode === 'patterns' && renderPatternsView()}
      </div>

      {/* Info Footer */}
      <div className="flex-shrink-0 p-4 border-t border-white/10 bg-slate-950/80 backdrop-blur">
        <p className="text-xs text-white/40 text-center">
          Analysis is deterministic and works offline • No AI required
        </p>
      </div>
    </div>
  );
};

export default MentalAtlas;
