import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import type { Entry, ReflectionModelId } from '../types';
import {
  searchEntries,
  highlightSearchTerms,
  extractUniqueTags,
  exportSearchResultsToCSV,
  type SearchFilters,
  type SearchResult,
} from '../services/searchService';
import { isEntryLocked } from '../services/privacyService';
import { MODEL_CONFIG } from '../constants';

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
    if (filters.severity && filters.severity !== 'all') count++;
    return count;
  }, [filters]);

  return (
    <div className="h-full bg-gradient-to-b from-slate-50 to-white flex flex-col overflow-y-auto custom-scrollbar nav-safe">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 pt-12 pb-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-slate-800">Archive</h1>
          <button
            onClick={handleExport}
            disabled={searchResult.entries.length === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold transition"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search entries..."
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                ? 'bg-cyan-500 text-white border-cyan-500'
                : 'bg-white text-slate-600 border-slate-200 hover:border-cyan-500'
            }`}
          >
            <SlidersHorizontal size={16} />
            <span className="text-xs font-semibold">Filters</span>
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-white text-cyan-600 text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="text-xs text-slate-500 font-semibold">
            {searchResult.filteredCount} of {searchResult.totalCount} entries
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            {/* Entry Type */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Entry Type</label>
              <select
                value={filters.entryType || 'all'}
                onChange={(e) =>
                  handleFilterChange('entryType', e.target.value as 'all' | 'reflection' | 'incident')
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="all">All Types</option>
                <option value="reflection">Reflections</option>
                <option value="incident">Incidents</option>
              </select>
            </div>

            {/* Reflection Model (only show if type is reflection or all) */}
            {(!filters.entryType || filters.entryType === 'all' || filters.entryType === 'reflection') && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Reflection Model</label>
                <select
                  value={filters.reflectionModel || 'all'}
                  onChange={(e) =>
                    handleFilterChange('reflectionModel', e.target.value as ReflectionModelId | 'all')
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="all">All Models</option>
                  {Object.keys(MODEL_CONFIG).map((modelId) => (
                    <option key={modelId} value={modelId}>
                      {MODEL_CONFIG[modelId as ReflectionModelId].title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Severity (only show if type is incident or all) */}
            {(!filters.entryType || filters.entryType === 'all' || filters.entryType === 'incident') && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Incident Severity</label>
                <select
                  value={filters.severity || 'all'}
                  onChange={(e) => handleFilterChange('severity', e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'all')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="all">All Severities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            )}

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">From Date</label>
                <input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value || undefined)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">To Date</label>
                <input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value || undefined)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Has Media Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-600">Has Media</label>
              <button
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
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {filters.hasMedia === true ? 'Yes' : filters.hasMedia === false ? 'No' : 'Any'}
              </button>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Sort By</label>
              <select
                value={filters.sortBy || 'date-desc'}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="relevance">Most Relevant</option>
              </select>
            </div>

            {/* Clear Filters */}
            <button
              onClick={handleClearFilters}
              className="w-full px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Entry List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-32 custom-scrollbar">
        {searchResult.entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <FileText size={48} className="mb-3 opacity-50" />
            <p className="text-sm font-semibold">No entries found</p>
            <p className="text-xs mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {searchResult.entries.map((entry) => {
              const isLocked = isEntryLocked(entry.id);
              const isReflection = entry.type === 'REFLECTION' || entry.type === 'reflection';
              const isIncident = entry.type === 'INCIDENT' || entry.type === 'incident';

              return (
                <button
                  key={entry.id}
                  onClick={() => onOpenEntry(entry)}
                  className="w-full text-left p-4 bg-white rounded-2xl border border-slate-200 hover:border-cyan-500 hover:shadow-md transition group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {isReflection && <FileText size={14} className="text-cyan-500" />}
                        {isIncident && <Calendar size={14} className="text-rose-500" />}
                        {isLocked && <Lock size={12} className="text-amber-500" />}
                        <span className="text-xs font-bold text-slate-500">
                          {new Date(entry.date).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 line-clamp-1">
                        {entry.title || (isReflection ? (entry as any).model : 'Incident')}
                      </h3>
                    </div>
                    {entry.attachments && entry.attachments.length > 0 && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-100 text-purple-700">
                        <Camera size={12} />
                        <span className="text-[10px] font-bold">{entry.attachments.length}</span>
                      </div>
                    )}
                  </div>

                  {/* Content Preview */}
                  {entry.content && (
                    <p
                      className="text-xs text-slate-600 line-clamp-2 mb-2"
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
                        className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold"
                      >
                        {tag}
                      </span>
                    ))}
                    {entry.keywords && entry.keywords.length > 3 && (
                      <span className="text-[10px] text-slate-400 font-semibold">
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
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:border-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed transition"
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
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                      currentPage === pageNum
                        ? 'bg-cyan-500 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-cyan-500'
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
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:border-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Results Summary */}
        {searchResult.entries.length > 0 && (
          <div className="mt-4 text-center text-xs text-slate-400">
            Showing {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, searchResult.filteredCount)} of {searchResult.filteredCount}
          </div>
        )}
      </div>
    </div>
  );
}
