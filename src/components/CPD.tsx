import React, { useState, useMemo, useEffect } from 'react';
import {
  Award,
  Download,
  Plus,
  CheckCircle,
  AlertCircle,
  Calendar,
  FileText,
  TrendingUp,
  X,
  Save,
  ArrowLeft,
} from 'lucide-react';
import type { Entry } from '../types';
import type { HolodeckEntry } from './holodeck/types';
import type { CPDCountry, CPDCategoryType, CPDRecord } from '../data/cpdStandards';
import { CPD_STANDARDS, getCategoryInfo } from '../data/cpdStandards';
import {
  getAllCPDRecords,
  calculateCPDSummary,
  downloadCPDExport,
  createManualCPDRecord,
  saveManualCPDRecords,
  loadManualCPDRecords,
  getSuggestedHours,
} from '../services/cpdService';

interface CPDProps {
  entries: Entry[];
  onClose: () => void;
}

export default function CPD({ entries, onClose }: CPDProps) {
  const [selectedCountry, setSelectedCountry] = useState<CPDCountry>('UK_GMC');
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [manualRecords, setManualRecords] = useState<CPDRecord[]>([]);

  // Load manual records from localStorage
  useEffect(() => {
    setManualRecords(loadManualCPDRecords());
  }, []);

  // Load holodeck entries from localStorage
  const holodeckEntries = useMemo(() => {
    const saved = localStorage.getItem('holodeckEntries');
    if (!saved) return [];
    try {
      return JSON.parse(saved) as HolodeckEntry[];
    } catch {
      return [];
    }
  }, [entries]); // Re-check when entries change

  // Calculate CPD records and summary
  const { allRecords, summary } = useMemo(() => {
    const records = getAllCPDRecords(entries, holodeckEntries, manualRecords);
    const sum = calculateCPDSummary(records, selectedCountry);
    return { allRecords: records, summary: sum };
  }, [entries, holodeckEntries, manualRecords, selectedCountry]);

  const handleExport = () => {
    downloadCPDExport(allRecords, summary);
  };

  const handleAddManualRecord = (record: CPDRecord) => {
    const updated = [...manualRecords, record];
    setManualRecords(updated);
    saveManualCPDRecords(updated);
    setShowAddRecord(false);
  };

  const handleDeleteManualRecord = (recordId: string) => {
    const updated = manualRecords.filter((r) => r.id !== recordId);
    setManualRecords(updated);
    saveManualCPDRecords(updated);
  };

  const progressPercentage = Math.min(
    (summary.totalHours / summary.standard.annualRequirement.totalHours) * 100,
    100
  );

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
            aria-label="Go back to dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">CPD Portfolio</h1>
            <p className="text-white/60 text-sm">
              Professional development tracking and evidence
            </p>
          </div>
        </div>
      </div>

      {/* Country Selection */}
      <div className="flex-shrink-0 p-6 border-b border-white/10 relative z-10">
        <label className="block text-sm font-semibold text-white/80 mb-2">
          Regulatory Standard
        </label>
        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value as CPDCountry)}
          className="w-full px-4 py-3 rounded-2xl border border-white/15 bg-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          {Object.keys(CPD_STANDARDS).map((country) => {
            const standard = CPD_STANDARDS[country as CPDCountry];
            return (
              <option key={country} value={country}>
                {standard.regulatoryBody}
              </option>
            );
          })}
        </select>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 relative z-10">
        {/* Summary Card */}
        <div className="mb-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 p-6">
          {/* Progress Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold mb-1">
                {summary.totalHours.toFixed(1)} / {summary.standard.annualRequirement.totalHours} Hours
              </h2>
              <p className="text-sm text-white/60">
                {new Date(summary.cycleStartDate).toLocaleDateString()} -{' '}
                {new Date(summary.cycleEndDate).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {summary.meetsRequirements ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                  <CheckCircle size={16} className="text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-300">Requirements Met</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30">
                  <AlertCircle size={16} className="text-amber-400" />
                  <span className="text-xs font-bold text-amber-300">In Progress</span>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPercentage}%`,
                  backgroundColor: summary.meetsRequirements ? '#10b981' : '#06b6d4',
                }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-white/50">
              <span>0</span>
              <span>{progressPercentage.toFixed(0)}%</span>
              <span>{summary.standard.annualRequirement.totalHours}h</span>
            </div>
          </div>

          {/* Gaps */}
          {summary.gaps.length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <p className="text-xs font-bold text-amber-300 mb-2">Requirements to Meet:</p>
              <ul className="space-y-1">
                {summary.gaps.map((gap, idx) => (
                  <li key={idx} className="text-xs text-amber-200 flex items-start gap-2">
                    <span className="text-amber-400 flex-shrink-0">•</span>
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Records Count */}
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-sm">
            <span className="text-white/60">{summary.recordCount} CPD activities recorded</span>
            <span className="text-white/60">
              {summary.categoryBreakdown.length} categories covered
            </span>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-3">Category Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {summary.categoryBreakdown.map((cat) => {
              const categoryInfo = getCategoryInfo(cat.category);
              return (
                <div
                  key={cat.category}
                  className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-sm text-white">{categoryInfo.label}</h4>
                      <p className="text-xs text-white/50 mt-0.5">{categoryInfo.description}</p>
                    </div>
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: `${categoryInfo.color}30`, color: categoryInfo.color }}
                    >
                      {cat.hours.toFixed(0)}h
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: categoryInfo.color,
                      }}
                    />
                  </div>
                  <p className="text-xs text-white/40 mt-1">{cat.percentage.toFixed(1)}% of total</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setShowAddRecord(true)}
            className="flex-1 px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Plus size={18} />
            Add Manual Record
          </button>
          <button
            onClick={handleExport}
            className="flex-1 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Download size={18} />
            Export to CSV
          </button>
        </div>

        {/* Recent Records */}
        <div>
          <h3 className="text-lg font-bold mb-3">Recent CPD Activities</h3>
          <div className="space-y-3">
            {allRecords.slice(0, 20).map((record) => {
              const categoryInfo = getCategoryInfo(record.category);
              const isManual = record.id.startsWith('cpd_manual_');
              return (
                <div
                  key={record.id}
                  className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 p-4 hover:bg-white/15 transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-bold uppercase"
                          style={{ backgroundColor: `${categoryInfo.color}30`, color: categoryInfo.color }}
                        >
                          {categoryInfo.label}
                        </span>
                        <span className="text-xs text-white/40">
                          {new Date(record.date).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-white">{record.title}</h4>
                      <p className="text-xs text-white/60 mt-1">{record.description}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">{record.hours}h</p>
                        <p className="text-xs text-white/40">{record.evidenceType}</p>
                      </div>
                      {isManual && (
                        <button
                          onClick={() => handleDeleteManualRecord(record.id)}
                          className="text-white/40 hover:text-red-400 transition"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  {record.learningOutcomes && record.learningOutcomes.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/10">
                      <p className="text-xs text-white/50 font-semibold mb-1">Learning Outcomes:</p>
                      <ul className="space-y-0.5">
                        {record.learningOutcomes.map((outcome, idx) => (
                          <li key={idx} className="text-xs text-white/60 flex items-start gap-2">
                            <span className="text-cyan-400 flex-shrink-0">→</span>
                            <span>{outcome}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Manual Record Modal */}
      {showAddRecord && (
        <AddManualRecordModal
          onSave={handleAddManualRecord}
          onCancel={() => setShowAddRecord(false)}
        />
      )}

      {/* Footer */}
      <div className="flex-shrink-0 p-4 border-t border-white/10 bg-slate-950/80 backdrop-blur relative z-10">
        <p className="text-xs text-white/40 text-center">
          CPD records automatically generated from reflections and holodeck sessions
        </p>
      </div>
    </div>
  );
}

// Add Manual Record Modal Component
interface AddManualRecordModalProps {
  onSave: (record: CPDRecord) => void;
  onCancel: () => void;
}

function AddManualRecordModal({ onSave, onCancel }: AddManualRecordModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CPDCategoryType>('learning-development');
  const [hours, setHours] = useState('1.0');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [evidenceType, setEvidenceType] = useState<CPDRecord['evidenceType']>('course');
  const [learningOutcome, setLearningOutcome] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const record = createManualCPDRecord(
      title,
      category,
      parseFloat(hours) || 1.0,
      new Date(date).toISOString(),
      description,
      evidenceType,
      learningOutcome ? [learningOutcome] : undefined
    );

    onSave(record);
  };

  const categories = Object.keys(getCategoryInfo('clinical-practice')).length > 0
    ? ['clinical-practice', 'teaching-training', 'research-audit', 'learning-development', 'leadership-management', 'quality-improvement', 'reflection', 'professional-activities', 'peer-review', 'self-directed-learning'] as CPDCategoryType[]
    : [] as CPDCategoryType[];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl border border-white/15 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Add CPD Record</h2>
          <button onClick={onCancel} className="text-white/60 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-white/80 mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g., Advanced Life Support Course"
              className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-white/80 mb-2">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CPDCategoryType)}
              className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {categories.map((cat) => {
                const info = getCategoryInfo(cat);
                return (
                  <option key={cat} value={cat}>
                    {info.label}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Hours and Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">Hours *</label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Evidence Type */}
          <div>
            <label className="block text-sm font-semibold text-white/80 mb-2">Evidence Type *</label>
            <select
              value={evidenceType}
              onChange={(e) => setEvidenceType(e.target.value as CPDRecord['evidenceType'])}
              className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="course">Course</option>
              <option value="conference">Conference</option>
              <option value="reading">Reading</option>
              <option value="teaching">Teaching</option>
              <option value="audit">Audit</option>
              <option value="reflection">Reflection</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-white/80 mb-2">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="Brief description of the activity..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
            />
          </div>

          {/* Learning Outcome */}
          <div>
            <label className="block text-sm font-semibold text-white/80 mb-2">
              Learning Outcome (Optional)
            </label>
            <textarea
              value={learningOutcome}
              onChange={(e) => setLearningOutcome(e.target.value)}
              placeholder="What did you learn from this activity?"
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Save size={18} />
              Save Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
