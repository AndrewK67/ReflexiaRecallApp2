import React from 'react';
import { Sparkles } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="h-full w-full bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
      <div className="text-center">
        {/* Logo/Icon */}
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-purple-500/30 animate-pulse">
            <Sparkles size={40} className="text-white" />
          </div>
        </div>

        {/* App Name */}
        <h1 className="text-2xl font-bold text-white mb-4 tracking-tight">Reflexia</h1>

        {/* Loading Spinner */}
        <div className="flex justify-center mb-3">
          <div className="w-8 h-8 border-4 border-t-cyan-400 border-white/20 rounded-full animate-spin" />
        </div>

        {/* Loading Text */}
        <p className="text-sm text-white/60 font-medium">Loading your space...</p>
      </div>
    </div>
  );
}
