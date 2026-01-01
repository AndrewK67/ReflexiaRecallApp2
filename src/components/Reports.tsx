import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  TrendingUp,
  Calendar,
  BarChart3,
  PieChart,
  X,
} from 'lucide-react';
import type { Entry, ReflectionEntry } from '../types';

interface ReportsProps {
  entries: Entry[];
  onClose: () => void;
}

export default function Reports({ entries, onClose }: ReportsProps) {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(today.toISOString().split('T')[0]);

  // Filter entries by date range
  const filteredEntries = useMemo(() => {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999); // Include entire end date

    return entries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= from && entryDate <= to;
    });
  }, [entries, dateFrom, dateTo]);

  // Calculate statistics
  const stats = useMemo(() => {
    const reflections = filteredEntries.filter(
      (e): e is ReflectionEntry => e.type === 'REFLECTION'
    );
    const incidents = filteredEntries.filter((e) => e.type === 'INCIDENT');

    // Mood analysis
    const moods = reflections
      .map((r) => r.mood)
      .filter((m): m is number => typeof m === 'number');
    const avgMood = moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : 0;

    // Model usage
    const modelCounts = new Map<string, number>();
    reflections.forEach((r) => {
      const model = r.model || 'Unknown';
      modelCounts.set(model, (modelCounts.get(model) || 0) + 1);
    });

    // Daily counts
    const dailyCounts = new Map<string, number>();
    filteredEntries.forEach((e) => {
      const day = new Date(e.date).toISOString().split('T')[0];
      dailyCounts.set(day, (dailyCounts.get(day) || 0) + 1);
    });

    return {
      totalEntries: filteredEntries.length,
      reflections: reflections.length,
      incidents: incidents.length,
      avgMood: avgMood.toFixed(1),
      modelCounts: Array.from(modelCounts.entries()).sort((a, b) => b[1] - a[1]),
      avgPerDay: (filteredEntries.length / Math.max(1, dailyCounts.size)).toFixed(1),
      daysWithEntries: dailyCounts.size,
    };
  }, [filteredEntries]);

  const handleExportCSV = () => {
    const csvRows = [
      ['Date', 'Time', 'Type', 'Model', 'Mood', 'Notes'],
      ...filteredEntries.map((entry) => {
        const date = new Date(entry.date);
        const type = entry.type;
        const model = type === 'REFLECTION' ? (entry as ReflectionEntry).model : 'N/A';
        const mood = type === 'REFLECTION' ? (entry as ReflectionEntry).mood || 'N/A' : 'N/A';
        const notes = type === 'INCIDENT' ? (entry as any).notes || '' : '';

        return [
          date.toLocaleDateString(),
          date.toLocaleTimeString(),
          type,
          model,
          mood,
          notes.replace(/"/g, '""'),
        ].map(v => `"${v}"`).join(',');
      }),
    ];

    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reflexia-report-${dateFrom}-to-${dateTo}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportText = () => {
    const lines = [
      'REFLEXIA REPORT',
      '='.repeat(50),
      `Report Period: ${new Date(dateFrom).toLocaleDateString()} - ${new Date(dateTo).toLocaleDateString()}`,
      `Generated: ${new Date().toLocaleString()}`,
      '',
      'SUMMARY STATISTICS',
      '-'.repeat(50),
      `Total Entries: ${stats.totalEntries}`,
      `Reflections: ${stats.reflections}`,
      `Incidents: ${stats.incidents}`,
      `Average Mood: ${stats.avgMood}/5`,
      `Average Entries Per Day: ${stats.avgPerDay}`,
      `Days with Entries: ${stats.daysWithEntries}`,
      '',
      'REFLECTION MODELS USED',
      '-'.repeat(50),
      ...stats.modelCounts.map(([model, count]) => `${model}: ${count} times`),
      '',
      'DETAILED ENTRIES',
      '-'.repeat(50),
      ...filteredEntries.map((entry) => {
        const date = new Date(entry.date);
        const type = entry.type;
        const model = type === 'REFLECTION' ? (entry as ReflectionEntry).model : 'Incident';
        const mood = type === 'REFLECTION' ? (entry as ReflectionEntry).mood : 'N/A';

        return `\n[${date.toLocaleString()}] ${model} - Mood: ${mood}`;
      }),
    ];

    const text = lines.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reflexia-report-${dateFrom}-to-${dateTo}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full bg-gradient-to-b from-slate-950 to-slate-900 text-white flex flex-col overflow-y-auto custom-scrollbar nav-safe relative">
      <div className="animated-backdrop-dark overflow-hidden">
        <div className="orb one" />
        <div className="orb two" />
        <div className="orb three" />
        <div className="grain" />
      </div>

      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 transition"
            aria-label="Close reports"
          >
            <X size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Reports</h1>
            <p className="text-white/60 text-sm">
              Analytics and insights from your reflections
            </p>
          </div>
        </div>
      </div>

      {/* Date Range */}
      <div className="flex-shrink-0 p-6 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Calendar size={16} className="text-white/60" />
          <span className="text-sm font-semibold text-white/80">Report Period</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-white/60 mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-white/15 bg-white/5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-white/15 bg-white/5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-20 relative z-10">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={16} className="text-cyan-400" />
              <span className="text-xs text-white/60 font-semibold">Total Entries</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalEntries}</p>
            <p className="text-xs text-white/50 mt-1">
              {stats.reflections} reflections, {stats.incidents} incidents
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-emerald-400" />
              <span className="text-xs text-white/60 font-semibold">Avg Mood</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.avgMood}</p>
            <p className="text-xs text-white/50 mt-1">out of 5.0</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={16} className="text-indigo-400" />
              <span className="text-xs text-white/60 font-semibold">Daily Average</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.avgPerDay}</p>
            <p className="text-xs text-white/50 mt-1">entries per day</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} className="text-purple-400" />
              <span className="text-xs text-white/60 font-semibold">Active Days</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.daysWithEntries}</p>
            <p className="text-xs text-white/50 mt-1">with entries</p>
          </div>
        </div>

        {/* Model Usage */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <PieChart size={16} className="text-white/60" />
            <h2 className="text-lg font-bold">Reflection Models Used</h2>
          </div>
          <div className="space-y-2">
            {stats.modelCounts.map(([model, count]) => {
              const percentage = ((count / stats.reflections) * 100).toFixed(0);
              return (
                <div key={model} className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/15 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">{model}</span>
                    <span className="text-xs text-white/60">{count} times ({percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Export Actions */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Download size={16} />
            Export Report
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleExportCSV}
              className="px-4 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Download size={18} />
              CSV
            </button>
            <button
              onClick={handleExportText}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold flex items-center justify-center gap-2 transition active:scale-95"
            >
              <FileText size={18} />
              Text
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
