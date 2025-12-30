import React, { useState } from 'react';
import {
  AlertTriangle,
  MapPin,
  Users,
  Camera,
  FileText,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
} from 'lucide-react';
import type { IncidentEntry, IncidentCategory, MediaItem } from '../types';
import CameraCapture from './media/CameraCapture';
import AudioCapture from './media/AudioCapture';
import VideoCapture from './media/VideoCapture';

interface IncidentCaptureProps {
  onSave: (incident: IncidentEntry) => void;
  onCancel: () => void;
}

const INCIDENT_CATEGORIES: { value: IncidentCategory; label: string; description: string }[] = [
  {
    value: 'Clinical Error',
    label: 'Clinical Error',
    description: 'Errors in diagnosis, treatment, or clinical judgment',
  },
  {
    value: 'Patient Safety',
    label: 'Patient Safety',
    description: 'Events affecting patient safety or wellbeing',
  },
  {
    value: 'Medication Error',
    label: 'Medication Error',
    description: 'Wrong medication, dose, route, or timing',
  },
  {
    value: 'Communication Breakdown',
    label: 'Communication Breakdown',
    description: 'Failed handoffs, misunderstandings, or information gaps',
  },
  {
    value: 'Equipment Failure',
    label: 'Equipment Failure',
    description: 'Malfunctioning or unavailable equipment',
  },
  {
    value: 'Near Miss',
    label: 'Near Miss',
    description: 'Event that could have caused harm but did not',
  },
  {
    value: 'Adverse Event',
    label: 'Adverse Event',
    description: 'Unexpected harm caused by medical care',
  },
  {
    value: 'Procedural Complication',
    label: 'Procedural Complication',
    description: 'Complications during procedures or interventions',
  },
  {
    value: 'Workplace Safety',
    label: 'Workplace Safety',
    description: 'Staff injury, exposure, or workplace hazards',
  },
  {
    value: 'Other',
    label: 'Other',
    description: 'Other incidents not covered above',
  },
];

export default function IncidentCapture({ onSave, onCancel }: IncidentCaptureProps) {
  const [category, setCategory] = useState<IncidentCategory>('Patient Safety');
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [location, setLocation] = useState('');
  const [peopleInvolved, setPeopleInvolved] = useState<string[]>([]);
  const [personInput, setPersonInput] = useState('');
  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState('');
  const [immediateActions, setImmediateActions] = useState<string[]>([]);
  const [actionInput, setActionInput] = useState('');
  const [contributingFactors, setContributingFactors] = useState<string[]>([]);
  const [factorInput, setFactorInput] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [showMediaCapture, setShowMediaCapture] = useState(false);
  const [mediaType, setMediaType] = useState<'photo' | 'video' | 'audio'>('photo');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']));

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const addPerson = () => {
    if (personInput.trim()) {
      setPeopleInvolved([...peopleInvolved, personInput.trim()]);
      setPersonInput('');
    }
  };

  const removePerson = (index: number) => {
    setPeopleInvolved(peopleInvolved.filter((_, i) => i !== index));
  };

  const addAction = () => {
    if (actionInput.trim()) {
      setImmediateActions([...immediateActions, actionInput.trim()]);
      setActionInput('');
    }
  };

  const removeAction = (index: number) => {
    setImmediateActions(immediateActions.filter((_, i) => i !== index));
  };

  const addFactor = () => {
    if (factorInput.trim()) {
      setContributingFactors([...contributingFactors, factorInput.trim()]);
      setFactorInput('');
    }
  };

  const removeFactor = (index: number) => {
    setContributingFactors(contributingFactors.filter((_, i) => i !== index));
  };

  const handleMediaCapture = (dataUrl: string) => {
    const newMedia: MediaItem = {
      id: `media_${Date.now()}`,
      type: mediaType === 'photo' ? 'PHOTO' : mediaType === 'video' ? 'VIDEO' : 'AUDIO',
      dataUrl,
      createdAt: new Date().toISOString(),
    };
    setMedia([...media, newMedia]);
    setShowMediaCapture(false);
  };

  const removeMedia = (mediaId: string) => {
    setMedia(media.filter((m) => m.id !== mediaId));
  };

  const handleSubmit = () => {
    const incident: IncidentEntry = {
      id: `incident_${Date.now()}`,
      type: 'INCIDENT',
      date: new Date().toISOString(),
      category,
      severity,
      location: location.trim() || undefined,
      peopleInvolved: peopleInvolved.length > 0 ? peopleInvolved : undefined,
      notes: notes.trim(),
      outcome: outcome.trim() || undefined,
      immediateActions: immediateActions.length > 0 ? immediateActions : undefined,
      contributingFactors: contributingFactors.length > 0 ? contributingFactors : undefined,
      media: media.length > 0 ? media : undefined,
      createdAt: Date.now(),
    };
    onSave(incident);
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'LOW':
        return { bg: '#10b98120', border: '#10b981', text: '#10b981' };
      case 'MEDIUM':
        return { bg: '#f59e0b20', border: '#f59e0b', text: '#f59e0b' };
      case 'HIGH':
        return { bg: '#ef444420', border: '#ef4444', text: '#ef4444' };
      default:
        return { bg: '#ffffff20', border: '#ffffff', text: '#ffffff' };
    }
  };

  const severityColors = getSeverityColor(severity);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl border border-white/15 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <AlertTriangle size={24} className="text-amber-400" />
              Incident Report
            </h2>
            <p className="text-sm text-white/60 mt-1">Structured incident documentation</p>
          </div>
          <button onClick={onCancel} className="text-white/60 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information (Always Expanded) */}
          <div className="space-y-4">
            <button
              onClick={() => toggleSection('basic')}
              className="w-full flex items-center justify-between text-left"
            >
              <h3 className="text-lg font-bold text-white">Basic Information</h3>
              {expandedSections.has('basic') ? (
                <ChevronUp size={20} className="text-white/60" />
              ) : (
                <ChevronDown size={20} className="text-white/60" />
              )}
            </button>

            {expandedSections.has('basic') && (
              <div className="space-y-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-2">
                    Incident Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                    className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {INCIDENT_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-white/50 mt-1">
                    {INCIDENT_CATEGORIES.find((c) => c.value === category)?.description}
                  </p>
                </div>

                {/* Severity */}
                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-2">Severity *</label>
                  <div className="flex gap-3">
                    {['LOW', 'MEDIUM', 'HIGH'].map((sev) => {
                      const colors = getSeverityColor(sev);
                      return (
                        <button
                          key={sev}
                          onClick={() => setSeverity(sev as any)}
                          className={`flex-1 py-3 rounded-xl font-semibold transition border-2 ${
                            severity === sev ? 'scale-105' : 'opacity-60'
                          }`}
                          style={{
                            backgroundColor: colors.bg,
                            borderColor: colors.border,
                            color: colors.text,
                          }}
                        >
                          {sev}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-2">
                    <MapPin size={14} className="inline mr-1" />
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Ward 3, Emergency Department..."
                    className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-2">
                    <FileText size={14} className="inline mr-1" />
                    What Happened? *
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe the incident in detail..."
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* People Involved */}
          <div className="space-y-4">
            <button
              onClick={() => toggleSection('people')}
              className="w-full flex items-center justify-between text-left"
            >
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users size={20} />
                People Involved ({peopleInvolved.length})
              </h3>
              {expandedSections.has('people') ? (
                <ChevronUp size={20} className="text-white/60" />
              ) : (
                <ChevronDown size={20} className="text-white/60" />
              )}
            </button>

            {expandedSections.has('people') && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={personInput}
                    onChange={(e) => setPersonInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addPerson()}
                    placeholder="Name or role..."
                    className="flex-1 px-4 py-2 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    onClick={addPerson}
                    className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 transition"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {peopleInvolved.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {peopleInvolved.map((person, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15"
                      >
                        <span className="text-sm text-white">{person}</span>
                        <button
                          onClick={() => removePerson(idx)}
                          className="text-white/60 hover:text-red-400 transition"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Outcome */}
          <div className="space-y-4">
            <button
              onClick={() => toggleSection('outcome')}
              className="w-full flex items-center justify-between text-left"
            >
              <h3 className="text-lg font-bold text-white">Outcome & Impact</h3>
              {expandedSections.has('outcome') ? (
                <ChevronUp size={20} className="text-white/60" />
              ) : (
                <ChevronDown size={20} className="text-white/60" />
              )}
            </button>

            {expandedSections.has('outcome') && (
              <textarea
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="What was the outcome? Was anyone harmed?"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              />
            )}
          </div>

          {/* Immediate Actions */}
          <div className="space-y-4">
            <button
              onClick={() => toggleSection('actions')}
              className="w-full flex items-center justify-between text-left"
            >
              <h3 className="text-lg font-bold text-white">Immediate Actions Taken ({immediateActions.length})</h3>
              {expandedSections.has('actions') ? (
                <ChevronUp size={20} className="text-white/60" />
              ) : (
                <ChevronDown size={20} className="text-white/60" />
              )}
            </button>

            {expandedSections.has('actions') && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={actionInput}
                    onChange={(e) => setActionInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addAction()}
                    placeholder="Action taken..."
                    className="flex-1 px-4 py-2 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    onClick={addAction}
                    className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 transition"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {immediateActions.length > 0 && (
                  <ul className="space-y-2">
                    {immediateActions.map((action, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 p-2 rounded-xl bg-white/5 border border-white/10"
                      >
                        <span className="text-amber-400 flex-shrink-0 mt-0.5">→</span>
                        <span className="flex-1 text-sm text-white">{action}</span>
                        <button
                          onClick={() => removeAction(idx)}
                          className="text-white/60 hover:text-red-400 transition flex-shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Contributing Factors */}
          <div className="space-y-4">
            <button
              onClick={() => toggleSection('factors')}
              className="w-full flex items-center justify-between text-left"
            >
              <h3 className="text-lg font-bold text-white">Contributing Factors ({contributingFactors.length})</h3>
              {expandedSections.has('factors') ? (
                <ChevronUp size={20} className="text-white/60" />
              ) : (
                <ChevronDown size={20} className="text-white/60" />
              )}
            </button>

            {expandedSections.has('factors') && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={factorInput}
                    onChange={(e) => setFactorInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addFactor()}
                    placeholder="Factor that contributed..."
                    className="flex-1 px-4 py-2 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    onClick={addFactor}
                    className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 transition"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {contributingFactors.length > 0 && (
                  <ul className="space-y-2">
                    {contributingFactors.map((factor, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 p-2 rounded-xl bg-white/5 border border-white/10"
                      >
                        <span className="text-white/40 flex-shrink-0 mt-0.5">•</span>
                        <span className="flex-1 text-sm text-white">{factor}</span>
                        <button
                          onClick={() => removeFactor(idx)}
                          className="text-white/60 hover:text-red-400 transition flex-shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Media Attachments */}
          <div className="space-y-4">
            <button
              onClick={() => toggleSection('media')}
              className="w-full flex items-center justify-between text-left"
            >
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Camera size={20} />
                Media Evidence ({media.length})
              </h3>
              {expandedSections.has('media') ? (
                <ChevronUp size={20} className="text-white/60" />
              ) : (
                <ChevronDown size={20} className="text-white/60" />
              )}
            </button>

            {expandedSections.has('media') && (
              <div className="space-y-3">
                {!showMediaCapture && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setMediaType('photo');
                        setShowMediaCapture(true);
                      }}
                      className="flex-1 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-semibold transition"
                    >
                      📷 Photo
                    </button>
                    <button
                      onClick={() => {
                        setMediaType('video');
                        setShowMediaCapture(true);
                      }}
                      className="flex-1 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-semibold transition"
                    >
                      🎥 Video
                    </button>
                    <button
                      onClick={() => {
                        setMediaType('audio');
                        setShowMediaCapture(true);
                      }}
                      className="flex-1 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-semibold transition"
                    >
                      🎤 Audio
                    </button>
                  </div>
                )}

                {showMediaCapture && (
                  <div className="relative">
                    <button
                      onClick={() => setShowMediaCapture(false)}
                      className="absolute top-2 right-2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
                    >
                      <X size={18} />
                    </button>
                    {mediaType === 'photo' && (
                      <CameraCapture
                        onCapture={handleMediaCapture}
                        onCancel={() => setShowMediaCapture(false)}
                      />
                    )}
                    {mediaType === 'video' && (
                      <VideoCapture
                        onCapture={handleMediaCapture}
                        onCancel={() => setShowMediaCapture(false)}
                      />
                    )}
                    {mediaType === 'audio' && (
                      <AudioCapture
                        onCapture={handleMediaCapture}
                        onCancel={() => setShowMediaCapture(false)}
                      />
                    )}
                  </div>
                )}

                {media.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {media.map((item) => (
                      <div key={item.id} className="relative group">
                        {item.type === 'PHOTO' && (
                          <img
                            src={item.dataUrl}
                            alt="Evidence"
                            className="w-full h-24 object-cover rounded-xl border border-white/15"
                          />
                        )}
                        {item.type === 'VIDEO' && (
                          <video
                            src={item.dataUrl}
                            className="w-full h-24 object-cover rounded-xl border border-white/15"
                          />
                        )}
                        {item.type === 'AUDIO' && (
                          <div className="w-full h-24 rounded-xl border border-white/15 bg-white/5 flex items-center justify-center">
                            <span className="text-2xl">🎤</span>
                          </div>
                        )}
                        <button
                          onClick={() => removeMedia(item.id)}
                          className="absolute top-1 right-1 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex gap-3 sticky bottom-0 bg-slate-900">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!notes.trim()}
            className="flex-1 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:bg-white/10 disabled:text-white/40 text-white font-semibold flex items-center justify-center gap-2 transition active:scale-95 disabled:cursor-not-allowed"
            style={
              notes.trim()
                ? { backgroundColor: severityColors.border }
                : {}
            }
          >
            <Save size={18} />
            Save Incident Report
          </button>
        </div>
      </div>
    </div>
  );
}
