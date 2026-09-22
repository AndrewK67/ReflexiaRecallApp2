import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Filter,
  X,
  Calendar,
  Tag,
  FileText,
  Camera,
  Lock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  SlidersHorizontal,
  Play,
  Pause,
  Volume2,
} from 'lucide-react';
import type { Entry } from '../types';
import {
  searchEntries,
  highlightSearchTerms,
  extractUniqueTags,
  exportSearchResultsToCSV,
  type SearchFilters,
  type SearchResult,
} from '../services/searchService';
import { isEntryLocked } from '../services/privacyService';
import { storageService } from '../services/storageService';
import { ALL as FRAMEWORKS, frameworkName } from '../frameworks';
import { isCapture, isReflection } from '../utils/entryKind';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { readMediaFile } from '../services/fileStorageService';

// Helper function to open Documents folder
async function openDocumentsFolder() {
  try {
    if (Capacitor.getPlatform() === 'android') {
      // Try multiple methods to open file manager
      
      // Method 1: Try to open Samsung My Files app specifically
      try {
        window.location.href = 'content://com.android.externalstorage.documents/document/primary%3ADocuments';
      } catch (e) {
        // silently ignore - fallback methods below
      }
      
      // Method 2: Generic file manager with GET_CONTENT action
      setTimeout(() => {
        try {
          const intent = 'intent:#Intent;' +
            'action=android.intent.action.GET_CONTENT;' +
            'type=*/*;' +
            'end';
          window.open(intent, '_system');
        } catch (e) {
          // silently ignore - fallback methods below
        }
      }, 500);
      
      // Method 3: Try to open file manager app
      setTimeout(() => {
        try {
          window.location.href = 'intent:#Intent;action=android.intent.action.VIEW;end';
        } catch (e) {
          alert('Could not open file manager. Please open My Files app and go to Documents folder manually.');
        }
      }, 1000);
    } else {
      alert('Please open your Files app and navigate to the Documents folder.');
    }
  } catch (error) {
    console.error('Error opening folder:', error);
    alert('Please open your Files/My Files app manually and go to Documents folder.');
  }
}

// Helper function to save audio to Downloads folder
async function saveAudioToDownloads(audioUrl: string) {
  try {
    if (audioUrl.startsWith('file://')) {
      if (Capacitor.getPlatform() === 'android') {
        try {
          // Read the file from app's data directory
          // Don't remove the leading slash - Capacitor needs the full path
          const originalPath = audioUrl.replace('file://', '');

          const fileData = await Filesystem.readFile({
            path: originalPath,
          });
          
          const dataSize = typeof fileData.data === 'string' ? fileData.data.length : fileData.data.size;

          if (!fileData.data || dataSize === 0) {
            alert('Error: Audio file is empty or could not be read.');
            return;
          }
          
          // Create a timestamp-based filename
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
          const publicFileName = `Reflexia_Audio_${timestamp}.webm`;
          
          // Write to Documents directory (Downloads not always accessible)
          await Filesystem.writeFile({
            path: publicFileName,
            data: fileData.data,
            directory: Directory.Documents,
          });

          // Verify the file was written by reading it back
          const verification = await Filesystem.readFile({
            path: publicFileName,
            directory: Directory.Documents,
          });
          const verifySize = typeof verification.data === 'string' ? verification.data.length : verification.data.size;

          // Show detailed success message with clear instructions
          alert(
            `✅ Audio saved successfully!\n\n` +
            `📂 Location: Documents folder\n` +
            `📄 File: ${publicFileName}\n` +
            `File size: ${Math.round(verifySize / 1024)}KB\n\n` +
            `🎵 How to play:\n` +
            `1. Open "My Files" or "Files" app on your phone\n` +
            `2. Tap "Documents" folder\n` +
            `3. Look for file: ${publicFileName}\n` +
            `4. Tap the file to play\n\n` +
            `📱 Recommended players:\n` +
            `• VLC for Android (free from Play Store)\n` +
            `• Chrome browser\n` +
            `• MX Player\n\n` +
            `💡 Tip: All Reflexia audio files start with "Reflexia_Audio_"`
          );
          
        } catch (err) {
          console.error('Error saving file:', err);
          alert(`Error saving audio: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      } else {
        window.open(audioUrl, '_system');
      }
    } else if (audioUrl.startsWith('idb://')) {
      // Resolve IndexedDB URL to a playable blob URL, then trigger download
      try {
        const resolvedUrl = await readMediaFile(audioUrl);
        const response = await fetch(resolvedUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `audio_${Date.now()}.${blob.type.split('/')[1] || 'webm'}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(blobUrl);
      } catch (err) {
        console.error('Error reading audio from IndexedDB:', err);
        alert('Could not read audio file. It may have been deleted.');
      }
    } else if (audioUrl.startsWith('blob:')) {
      alert('This audio is not yet saved. Please use the "Save to Device" button in the capture screen first.');
    } else if (audioUrl.startsWith('data:')) {
      // Legacy base64 data URLs — trigger direct download
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `audio_${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      // Unknown URL scheme — don't navigate
      alert('Could not download audio: unsupported format.');
    }
  } catch (error) {
    console.error('Error saving audio file:', error);
    alert('Could not save audio file. Please try again.');
  }
}

interface ArchiveProps {
  entries: Entry[];
  onOpenEntry: (entry: Entry) => void;
}

export default function Archive({ entries, onOpenEntry }: ArchiveProps) {
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: 'date-desc',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Audio playback state
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load user profile for blur setting
  const [blurEnabled, setBlurEnabled] = useState(false);

  useEffect(() => {
    const profile = storageService.loadProfile();
    setBlurEnabled(profile.blurHistory ?? false);
  }, []);

  // Audio playback handlers
  const toggleAudioPlayback = async (audioUrl: string) => {
    if (playingAudioUrl === audioUrl) {
      // Pause if already playing this audio
      audioRef.current?.pause();
      setPlayingAudioUrl(null);
    } else {
      // Play new audio
      if (audioRef.current) {
        audioRef.current.pause();
      }

      // Resolve idb:// and other non-playable URLs to playable ones
      let playableUrl = audioUrl;
      if (audioUrl.startsWith('idb://') || audioUrl.startsWith('file://')) {
        try {
          playableUrl = await readMediaFile(audioUrl);
        } catch (err) {
          console.error('Failed to resolve audio URL:', err);
          return;
        }
      }

      audioRef.current = new Audio(playableUrl);
      audioRef.current.play().catch(err => console.error('Audio playback error:', err));
      setPlayingAudioUrl(audioUrl);

      audioRef.current.ontimeupdate = () => {
        if (audioRef.current) {
          setAudioProgress(audioRef.current.currentTime);
          setAudioDuration(audioRef.current.duration);
        }
      };

      audioRef.current.onended = () => {
        setPlayingAudioUrl(null);
        setAudioProgress(0);
      };
    }
  };

  const seekAudio = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setAudioProgress(time);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Get unique tags from all entries
  const availableTags = useMemo(() => extractUniqueTags(entries), [entries]);

  // Search results
  const searchResult: SearchResult = useMemo(() => {
    const activeFilters: SearchFilters = {
      ...filters,
      query: searchQuery.trim() || undefined,
    };
    return searchEntries(entries, activeFilters, { page: currentPage, pageSize });
  }, [entries, filters, searchQuery, currentPage]);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({ sortBy: 'date-desc' });
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleExport = () => {
    const csv = exportSearchResultsToCSV(searchResult, { ...filters, query: searchQuery });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reflexia-archive-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.entryType && filters.entryType !== 'all') count++;
    if (filters.reflectionModel && filters.reflectionModel !== 'all') count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.tags && filters.tags.length > 0) count++;
    if (filters.hasMedia !== undefined) count++;
    return count;
  }, [filters]);

  return (
    <div className="h-full bg-gradient-to-b from-slate-950 to-slate-900 text-white flex flex-col overflow-y-auto custom-scrollbar nav-safe relative">
      <div className="animated-backdrop-dark overflow-hidden">
        <div className="orb one" />
        <div className="orb two" />
        <div className="orb three" />
        <div className="grain" />
      </div>

      {/* Header */}
      <div className="border-b border-white/10 px-6 pt-10 pb-4 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center">
              <FileText size={24} className="text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Archive</h1>
              <p className="text-white/60 text-xs uppercase tracking-widest font-mono">Search & Filter</p>
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={searchResult.entries.length === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 disabled:bg-white/5 disabled:text-white/30 text-cyan-300 border border-cyan-500/30 disabled:border-white/10 text-xs font-semibold transition"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="search"
            aria-label="Search entries"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search entries..."
            className="w-full pl-10 pr-10 py-3 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-white/50 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition ${
              showFilters
                ? 'bg-cyan-600/20 text-white border-cyan-500/30'
                : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10'
            }`}
          >
            <SlidersHorizontal size={16} />
            <span className="text-xs font-semibold">Filters</span>
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-cyan-500 text-white text-xs font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="text-xs text-white/60 font-semibold">
            {searchResult.filteredCount} of {searchResult.totalCount} entries
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
            {/* Entry Type */}
            <div>
              <label htmlFor="archive-filter-type" className="block text-xs font-bold text-white/80 mb-1.5">Entry type</label>
              <select
                id="archive-filter-type"
                value={filters.entryType || 'all'}
                onChange={(e) =>
                  handleFilterChange('entryType', e.target.value as 'all' | 'reflection' | 'capture')
                }
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:bg-white/10"
              >
                <option value="all">All Types</option>
                <option value="reflection">Reflections</option>
                <option value="capture">Captures</option>
              </select>
            </div>

            {/* Framework (only show if type is reflection or all) */}
            {(!filters.entryType || filters.entryType === 'all' || filters.entryType === 'reflection') && (
              <div>
                <label htmlFor="archive-filter-framework" className="block text-xs font-bold text-white/80 mb-1.5">Framework</label>
                <select
                  id="archive-filter-framework"
                  value={filters.reflectionModel || 'all'}
                  onChange={(e) =>
                    handleFilterChange('reflectionModel', e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:bg-white/10"
                >
                  <option value="all">All frameworks</option>
                  {FRAMEWORKS.filter((f) => f.kind === 'built-in').map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                  <optgroup label="Frameworks">
                    {FRAMEWORKS.filter((f) => f.kind === 'framework').map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Spaces">
                    {FRAMEWORKS.filter((f) => f.kind === 'space').map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            )}

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="archive-filter-from" className="block text-xs font-bold text-white/80 mb-1.5">From date</label>
                <input
                  id="archive-filter-from"
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value || undefined)}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:bg-white/10"
                />
              </div>
              <div>
                <label htmlFor="archive-filter-to" className="block text-xs font-bold text-white/80 mb-1.5">To date</label>
                <input
                  id="archive-filter-to"
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value || undefined)}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:bg-white/10"
                />
              </div>
            </div>

            {/* Has Media Toggle */}
            <div className="flex items-center justify-between">
              <span id="archive-filter-media-label" className="text-xs font-bold text-white/80">Has media</span>
              <button
                aria-labelledby="archive-filter-media-label archive-filter-media-value"
                onClick={() => {
                  if (filters.hasMedia === undefined) {
                    handleFilterChange('hasMedia', true);
                  } else if (filters.hasMedia === true) {
                    handleFilterChange('hasMedia', false);
                  } else {
                    handleFilterChange('hasMedia', undefined);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filters.hasMedia === true
                    ? 'bg-cyan-500 text-white'
                    : filters.hasMedia === false
                    ? 'bg-slate-400 text-white'
                    : 'bg-white/10 text-white/80'
                }`}
              >
                <span id="archive-filter-media-value">{filters.hasMedia === true ? 'Yes' : filters.hasMedia === false ? 'No' : 'Any'}</span>
              </button>
            </div>

            {/* Sort By */}
            <div>
              <label htmlFor="archive-filter-sort" className="block text-xs font-bold text-white/80 mb-1.5">Sort by</label>
              <select
                id="archive-filter-sort"
                value={filters.sortBy || 'date-desc'}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:bg-white/10"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="relevance">Most Relevant</option>
              </select>
            </div>

            {/* Clear Filters */}
            <button
              onClick={handleClearFilters}
              className="w-full px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Entry List */}
      <div className="flex-1 overflow-y-auto px-6 py-4 pb-20 custom-scrollbar relative z-10" tabIndex={0} aria-label="Entries">
        {searchResult.entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/60">
            <FileText size={48} className="mb-3 opacity-50" />
            <p className="text-sm font-semibold">No entries found</p>
            <p className="text-xs mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {searchResult.entries.map((entry) => {
              const isLocked = isEntryLocked(entry.id);
              const reflection = isReflection(entry);
              const capture = isCapture(entry);

              return (
                <button
                  key={entry.id}
                  onClick={() => onOpenEntry(entry)}
                  className="w-full text-left p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {reflection && <FileText size={14} className="text-cyan-400" />}
                        {capture && <Camera size={14} className="text-cyan-400" />}
                        {isLocked && <Lock size={12} className="text-amber-400" />}
                        <span className="text-xs font-bold text-white/60">
                          {new Date(entry.date).toLocaleDateString()}
                        </span>
                      </div>
                      <h2 className={`text-sm font-bold text-white line-clamp-1 ${blurEnabled ? 'blur-sm' : ''}`}>
                        {entry.title || (reflection ? frameworkName((entry as any).model) : 'Capture')}
                      </h2>
                    </div>

                    {/* Media Preview/Count */}
                    {(() => {
                      const media = (entry as any).media || [];
                      const hasVideo = media.some((m: any) => m.type === 'VIDEO');
                      const hasPhoto = media.some((m: any) => m.type === 'PHOTO');
                      const hasAudio = media.some((m: any) => m.type === 'AUDIO');
                      const totalMedia = media.length;

                      if (totalMedia === 0 && entry.attachments && entry.attachments.length > 0) {
                        return (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300">
                            <Camera size={12} />
                            <span className="text-xs font-bold">{entry.attachments.length}</span>
                          </div>
                        );
                      }

                      if (totalMedia > 0) {
                        return (
                          <div className="flex items-center gap-1">
                            {hasVideo && (
                              <div className="px-2 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center gap-1">
                                <span className="text-xs">🎥</span>
                                <span className="text-xs font-bold">{media.filter((m: any) => m.type === 'VIDEO').length}</span>
                              </div>
                            )}
                            {hasPhoto && (
                              <div className="px-2 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center gap-1">
                                <Camera size={10} />
                                <span className="text-xs font-bold">{media.filter((m: any) => m.type === 'PHOTO').length}</span>
                              </div>
                            )}
                            {hasAudio && (
                              <div className="flex flex-col gap-1">
                                {media.filter((m: any) => m.type === 'AUDIO').map((audioFile: any, idx: number) => {
                                  const audioUrl = audioFile.url;
                                  const isPlaying = playingAudioUrl === audioUrl;
                                  
                                  return (
                                    <div 
                                      key={idx}
                                      onClick={(e) => e.stopPropagation()}
                                      className="px-2 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center gap-2 min-w-[200px]"
                                    >
                                      {/* Play/Pause Button */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleAudioPlayback(audioUrl);
                                        }}
                                        className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/40 hover:bg-emerald-500/60 flex items-center justify-center transition"
                                        title={isPlaying ? "Pause" : "Play"}
                                      >
                                        {isPlaying ? (
                                          <Pause size={12} fill="currentColor" />
                                        ) : (
                                          <Play size={12} fill="currentColor" />
                                        )}
                                      </button>

                                      {/* Progress Bar */}
                                      {isPlaying && (
                                        <div className="flex-1 flex items-center gap-1.5">
                                          <input
                                            type="range"
                                            min="0"
                                            max={audioDuration || 100}
                                            value={audioProgress}
                                            onChange={(e) => {
                                              e.stopPropagation();
                                              seekAudio(Number(e.target.value));
                                            }}
                                            className="flex-1 h-1 bg-emerald-500/30 rounded-full appearance-none cursor-pointer"
                                            style={{
                                              background: `linear-gradient(to right, rgb(52 211 153) 0%, rgb(52 211 153) ${(audioProgress / audioDuration) * 100}%, rgb(52 211 153 / 0.3) ${(audioProgress / audioDuration) * 100}%, rgb(52 211 153 / 0.3) 100%)`
                                            }}
                                          />
                                          <span className="text-xs font-mono">
                                            {Math.floor(audioProgress)}s / {Math.floor(audioDuration)}s
                                          </span>
                                        </div>
                                      )}

                                      {/* Static indicator when not playing */}
                                      {!isPlaying && (
                                        <div className="flex items-center gap-1">
                                          <Volume2 size={10} />
                                          <span className="text-xs">Audio</span>
                                        </div>
                                      )}

                                      {/* Download Button */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          saveAudioToDownloads(audioUrl);
                                        }}
                                        className="flex-shrink-0 p-1 rounded hover:bg-emerald-500/40 transition"
                                        title="Save to Downloads"
                                      >
                                        <Download size={10} />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }

                      return null;
                    })()}
                  </div>

                  {/* Content Preview */}
                  {entry.content && (
                    <p
                      className={`text-xs text-white/70 line-clamp-2 mb-2 ${blurEnabled ? 'blur-sm' : ''}`}
                      dangerouslySetInnerHTML={{
                        __html: searchQuery
                          ? highlightSearchTerms(entry.content.substring(0, 200), searchQuery)
                          : entry.content.substring(0, 200),
                      }}
                    />
                  )}

                  {/* Footer */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {entry.keywords && entry.keywords.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className={`px-2 py-0.5 rounded-full bg-white/10 text-white/80 text-xs font-semibold ${blurEnabled ? 'blur-sm' : ''}`}
                      >
                        {tag}
                      </span>
                    ))}
                    {entry.keywords && entry.keywords.length > 3 && (
                      <span className="text-xs text-white/60 font-semibold">
                        +{entry.keywords.length - 3} more
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {searchResult.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="p-2 rounded-xl bg-white/10 border border-white/10 text-white hover:border-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, searchResult.totalPages) }, (_, i) => {
                // Show pages around current page
                let pageNum: number;
                if (searchResult.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= searchResult.totalPages - 2) {
                  pageNum = searchResult.totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    aria-label={`Page ${pageNum}`}
                    aria-current={currentPage === pageNum ? 'page' : undefined}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                      currentPage === pageNum
                        ? 'bg-cyan-500 text-white'
                        : 'bg-white/10 border border-white/10 text-white hover:border-cyan-500'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(searchResult.totalPages, p + 1))}
              disabled={currentPage === searchResult.totalPages}
              aria-label="Next page"
              className="p-2 rounded-xl bg-white/10 border border-white/10 text-white hover:border-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Results Summary */}
        {searchResult.entries.length > 0 && (
          <div className="mt-4 text-center text-xs text-white/60">
            Showing {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, searchResult.filteredCount)} of {searchResult.filteredCount}
          </div>
        )}
      </div>
    </div>
  );
}
