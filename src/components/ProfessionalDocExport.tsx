import React, { useState, useMemo } from 'react';
import { FileText, Download, Copy, Check, ChevronDown, X, FileCheck, AlertTriangle } from 'lucide-react';
import {
  generateProfessionalDoc,
  generateBatchDocumentation,
  exportDocumentationToText,
  getAllTemplates,
  DocumentTemplate,
  getTemplateInfo,
} from '../services/professionalDocService';
import type { Entry, ReflectionEntry } from '../types';

interface ProfessionalDocExportProps {
  entries: Entry[];
  onClose: () => void;
}

export default function ProfessionalDocExport({ entries, onClose }: ProfessionalDocExportProps) {
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate>('NMC_REFLECTIVE_ACCOUNT');
  const [generatedDoc, setGeneratedDoc] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [wordLimit, setWordLimit] = useState<number | undefined>(undefined);

  const templates = getAllTemplates();
  const currentTemplateInfo = getTemplateInfo(selectedTemplate);

  // Filter entries to only reflections
  const reflectionEntries = useMemo(() => {
    return entries.filter(e => e.type === 'REFLECTION' || e.type === 'reflection') as ReflectionEntry[];
  }, [entries]);

  const handleToggleEntry = (entryId: string) => {
    setSelectedEntries(prev =>
      prev.includes(entryId)
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEntries.length === reflectionEntries.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(reflectionEntries.map(e => e.id));
    }
  };

  const handleGenerate = () => {
    if (selectedEntries.length === 0) {
      alert('Please select at least one reflection');
      return;
    }

    const entriesToGenerate = reflectionEntries.filter(e => selectedEntries.includes(e.id));

    if (entriesToGenerate.length === 1) {
      // Single document
      const doc = generateProfessionalDoc(entriesToGenerate[0], {
        template: selectedTemplate,
        wordLimit,
        includeEvidence: true,
        style: 'formal',
      });
      setGeneratedDoc(exportDocumentationToText(doc));
    } else {
      // Multiple documents
      const docs = generateBatchDocumentation(entriesToGenerate, selectedTemplate, {
        wordLimit,
        includeEvidence: true,
        style: 'formal',
      });

      const combined = docs.map(doc => exportDocumentationToText(doc)).join('\n\n' + '='.repeat(80) + '\n\n');
      setGeneratedDoc(combined);
    }
  };

  const handleCopy = async () => {
    if (generatedDoc) {
      await navigator.clipboard.writeText(generatedDoc);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (generatedDoc) {
      const blob = new Blob([generatedDoc], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentTemplateInfo.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl border border-white/20 max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center">
                <FileText size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Professional Documentation</h2>
                <p className="text-sm text-white/60">Generate text for NHS Revalidation, GMC Appraisal, and more</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition"
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* AI Warning Banner */}
        <div className="bg-red-500/10 border-b border-red-500/30 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-red-300">
              <strong className="block mb-1">⚠️ AI-GENERATED CONTENT WARNING</strong>
              This feature uses AI to generate documentation. AI may produce errors, inaccuracies, or inappropriate content.
              <strong> You MUST review, edit, and verify all generated content before submission.</strong> Not affiliated with any regulatory body.
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!generatedDoc ? (
            <>
              {/* Template Selector */}
              <div>
                <label className="text-sm font-semibold text-white mb-2 block">
                  Select Template
                </label>
                <div className="relative">
                  <button
                    onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-left flex items-center justify-between hover:bg-white/10 transition"
                  >
                    <div>
                      <div className="font-semibold">{currentTemplateInfo.name}</div>
                      <div className="text-xs text-white/60">{currentTemplateInfo.description}</div>
                    </div>
                    <ChevronDown size={20} className={`transition-transform ${showTemplateSelector ? 'rotate-180' : ''}`} />
                  </button>

                  {showTemplateSelector && (
                    <div className="absolute z-10 mt-2 w-full bg-slate-900 border border-white/20 rounded-xl shadow-2xl max-h-96 overflow-y-auto">
                      {templates.map(template => (
                        <button
                          key={template.template}
                          onClick={() => {
                            setSelectedTemplate(template.template);
                            setShowTemplateSelector(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-white/10 transition border-b border-white/5 last:border-b-0 ${
                            selectedTemplate === template.template ? 'bg-white/5' : ''
                          }`}
                        >
                          <div className="font-semibold text-white text-sm">{template.name}</div>
                          <div className="text-xs text-white/60">{template.description}</div>
                          <div className="text-xs text-cyan-400 mt-1">Regulatory Body: {template.regulatoryBody}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Word Limit */}
              <div>
                <label className="text-sm font-semibold text-white mb-2 block">
                  Word Limit (Optional)
                </label>
                <input
                  type="number"
                  value={wordLimit || ''}
                  onChange={(e) => setWordLimit(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="No limit"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <p className="text-xs text-white/40 mt-1">
                  Leave empty for no word limit, or set a maximum (e.g., 500 words per section)
                </p>
              </div>

              {/* Entry Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-white">
                    Select Reflections ({selectedEntries.length} selected)
                  </label>
                  <button
                    onClick={handleSelectAll}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white font-semibold transition"
                  >
                    {selectedEntries.length === reflectionEntries.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                  {reflectionEntries.length === 0 ? (
                    <div className="text-center py-8 text-white/40">
                      <FileText size={48} className="mx-auto mb-3 opacity-50" />
                      <p>No reflections found.</p>
                      <p className="text-sm mt-1">Create some reflections first to generate documentation.</p>
                    </div>
                  ) : (
                    reflectionEntries.map(entry => (
                      <label
                        key={entry.id}
                        className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedEntries.includes(entry.id)}
                          onChange={() => handleToggleEntry(entry.id)}
                          className="mt-1 w-5 h-5 rounded border-white/20 bg-white/10 text-cyan-500 focus:ring-2 focus:ring-cyan-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white text-sm truncate">
                            {entry.title || 'Untitled Reflection'}
                          </div>
                          <div className="text-xs text-white/60">
                            {new Date(entry.date || entry.createdAt || Date.now()).toLocaleDateString('en-GB')}
                          </div>
                          {entry.model && (
                            <div className="text-xs text-cyan-400 mt-1">
                              Model: {entry.model}
                            </div>
                          )}
                        </div>
                        {(entry.cpd?.timeSpentMinutes || entry.cpd?.minutes) && (
                          <div className="text-xs text-white/60 bg-white/5 px-2 py-1 rounded">
                            {Math.round(((entry.cpd.timeSpentMinutes || entry.cpd.minutes || 0) / 60) * 10) / 10}h
                          </div>
                        )}
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={selectedEntries.length === 0}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-bold hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FileCheck size={20} />
                Generate Documentation
              </button>
            </>
          ) : (
            <>
              {/* Generated Document */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-white">Generated Documentation</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/15 transition flex items-center gap-2"
                    >
                      {copied ? (
                        <>
                          <Check size={16} className="text-emerald-400" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          Copy
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 rounded-xl bg-cyan-500 text-white font-semibold hover:bg-cyan-600 transition flex items-center gap-2"
                    >
                      <Download size={16} />
                      Download
                    </button>
                  </div>
                </div>

                <div className="bg-white/5 rounded-2xl border border-white/10 p-6 max-h-[500px] overflow-y-auto custom-scrollbar">
                  <pre className="text-sm text-white/90 whitespace-pre-wrap font-mono leading-relaxed">
                    {generatedDoc}
                  </pre>
                </div>

                <button
                  onClick={() => {
                    setGeneratedDoc(null);
                    setSelectedEntries([]);
                  }}
                  className="w-full mt-4 py-3 px-6 rounded-2xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/15 transition"
                >
                  Generate Another Document
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer Critical Warning */}
        <div className="p-4 border-t border-white/10 bg-red-500/10">
          <div className="space-y-2">
            <p className="text-xs text-red-400 font-bold text-center">
              🤖 ⚠️ CRITICAL: AI-GENERATED CONTENT - YOUR RESPONSIBILITY TO VERIFY
            </p>
            <p className="text-xs text-white/60 text-center">
              This documentation was generated by AI and may contain <strong>errors, inaccuracies, or inappropriate content</strong>.
              You MUST thoroughly review, edit, and verify ALL content before using it professionally.
              This app is NOT affiliated with any regulatory body. Always confirm your regulatory body accepts this format.
              <strong> Use entirely at your own risk.</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
