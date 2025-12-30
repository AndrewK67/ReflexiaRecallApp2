import React, { useState, useMemo } from 'react';
import { Wind, TrendingUp, Flame, Award, ChevronRight, ArrowLeft } from 'lucide-react';
import {
  GROUNDING_TECHNIQUES,
  getGroundingStats,
  getRecommendedTechnique,
  startGroundingSession,
  completeGroundingSession,
  type GroundingTechniqueId,
  type GroundingSession,
} from '../services/groundingService';
import BreathingGuide from './grounding/BreathingGuide';
import FiveFourThreeTwoOne from './grounding/FiveFourThreeTwoOne';
import BodyScan from './grounding/BodyScan';

interface GroundingProps {
  onClose: () => void;
}

type ViewMode = 'hub' | 'technique';

export default function Grounding({ onClose }: GroundingProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('hub');
  const [selectedTechnique, setSelectedTechnique] = useState<GroundingTechniqueId | null>(null);
  const [currentSession, setCurrentSession] = useState<GroundingSession | null>(null);

  const stats = useMemo(() => getGroundingStats(), [viewMode]);
  const recommendedId = useMemo(() => getRecommendedTechnique(), []);

  const techniques = Object.values(GROUNDING_TECHNIQUES);
  const breathingTechniques = techniques.filter((t) => t.category === 'breathing');
  const otherTechniques = techniques.filter((t) => t.category !== 'breathing');

  const handleStartTechnique = (techniqueId: GroundingTechniqueId) => {
    const session = startGroundingSession(techniqueId);
    setCurrentSession(session);
    setSelectedTechnique(techniqueId);
    setViewMode('technique');
  };

  const handleCompleteTechnique = (cyclesCompleted?: number) => {
    if (currentSession) {
      completeGroundingSession(currentSession.id, cyclesCompleted);
    }
    setViewMode('hub');
    setSelectedTechnique(null);
    setCurrentSession(null);
  };

  const handleCancelTechnique = () => {
    setViewMode('hub');
    setSelectedTechnique(null);
    setCurrentSession(null);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'breathing':
        return Wind;
      case 'sensory':
        return TrendingUp;
      case 'physical':
        return Award;
      default:
        return Wind;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-emerald-400 bg-emerald-500/20';
      case 'intermediate':
        return 'text-amber-400 bg-amber-500/20';
      case 'advanced':
        return 'text-rose-400 bg-rose-500/20';
      default:
        return 'text-slate-400 bg-slate-500/20';
    }
  };

  // Render technique content
  if (viewMode === 'technique' && selectedTechnique) {
    const technique = GROUNDING_TECHNIQUES[selectedTechnique];

    if (selectedTechnique === 'five-four-three-two-one') {
      return (
        <div className="h-full bg-slate-900">
          <FiveFourThreeTwoOne onComplete={handleCompleteTechnique} onCancel={handleCancelTechnique} />
        </div>
      );
    }

    if (selectedTechnique === 'body-scan') {
      return (
        <div className="h-full bg-slate-900">
          <BodyScan onComplete={handleCompleteTechnique} onCancel={handleCancelTechnique} />
        </div>
      );
    }

    if (technique.breathingPattern) {
      return (
        <div className="h-full bg-gradient-to-b from-slate-900 to-slate-800">
          <BreathingGuide
            pattern={technique.breathingPattern}
            onComplete={(cycles) => handleCompleteTechnique(cycles)}
            onCancel={handleCancelTechnique}
          />
        </div>
      );
    }
  }

  // Hub View
  return (
    <div className="h-full bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-white/10">
        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 transition"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">Grounding Center</h1>
        <div className="w-10" />
      </div>

      {/* Stats Cards */}
      <div className="px-6 py-4 grid grid-cols-3 gap-3">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 p-3 text-center">
          <div className="text-2xl font-bold text-cyan-400">{stats.totalSessions}</div>
          <div className="text-[10px] text-white/60 font-semibold mt-0.5">Sessions</div>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 p-3 text-center">
          <div className="text-2xl font-bold text-purple-400">{stats.totalMinutes}</div>
          <div className="text-[10px] text-white/60 font-semibold mt-0.5">Minutes</div>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <Flame size={20} className="text-orange-400" />
            <span className="text-2xl font-bold text-orange-400">{stats.streakDays}</span>
          </div>
          <div className="text-[10px] text-white/60 font-semibold mt-0.5">Day Streak</div>
        </div>
      </div>

      {/* Recommended */}
      {recommendedId && (
        <div className="px-6 py-4">
          <h2 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">Recommended for You</h2>
          <button
            onClick={() => handleStartTechnique(recommendedId)}
            className="w-full text-left p-4 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 rounded-2xl hover:border-cyan-500/50 transition group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {React.createElement(getCategoryIcon(GROUNDING_TECHNIQUES[recommendedId].category), {
                    size: 18,
                    className: 'text-cyan-400',
                  })}
                  <h3 className="font-bold text-white">{GROUNDING_TECHNIQUES[recommendedId].name}</h3>
                </div>
                <p className="text-xs text-white/70 mb-2">{GROUNDING_TECHNIQUES[recommendedId].description}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/50">{GROUNDING_TECHNIQUES[recommendedId].duration}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getDifficultyColor(
                      GROUNDING_TECHNIQUES[recommendedId].difficulty
                    )}`}
                  >
                    {GROUNDING_TECHNIQUES[recommendedId].difficulty}
                  </span>
                </div>
              </div>
              <ChevronRight size={20} className="text-white/40 group-hover:text-cyan-400 transition" />
            </div>
          </button>
        </div>
      )}

      {/* Techniques List */}
      <div className="flex-1 overflow-y-auto px-6 pb-32 custom-scrollbar">
        {/* Breathing Techniques */}
        <div className="mb-6">
          <h2 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">Breathing Techniques</h2>
          <div className="space-y-3">
            {breathingTechniques.map((technique) => (
              <button
                key={technique.id}
                onClick={() => handleStartTechnique(technique.id)}
                className="w-full text-left p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 hover:border-white/30 hover:bg-white/15 transition group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Wind size={16} className="text-cyan-400" />
                      <h3 className="font-bold text-sm text-white">{technique.name}</h3>
                    </div>
                    <p className="text-xs text-white/60 mb-2">{technique.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-white/40">{technique.duration}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getDifficultyColor(
                          technique.difficulty
                        )}`}
                      >
                        {technique.difficulty}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-white/30 group-hover:text-white/60 transition" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Other Techniques */}
        <div className="mb-6">
          <h2 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">Other Techniques</h2>
          <div className="space-y-3">
            {otherTechniques.map((technique) => (
              <button
                key={technique.id}
                onClick={() => handleStartTechnique(technique.id)}
                className="w-full text-left p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 hover:border-white/30 hover:bg-white/15 transition group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {React.createElement(getCategoryIcon(technique.category), {
                        size: 16,
                        className: technique.category === 'sensory' ? 'text-purple-400' : 'text-emerald-400',
                      })}
                      <h3 className="font-bold text-sm text-white">{technique.name}</h3>
                    </div>
                    <p className="text-xs text-white/60 mb-2">{technique.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-white/40">{technique.duration}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getDifficultyColor(
                          technique.difficulty
                        )}`}
                      >
                        {technique.difficulty}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-white/30 group-hover:text-white/60 transition" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
