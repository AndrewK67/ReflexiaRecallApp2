/**
 * Search & Filter Service
 * Advanced search, filtering, and sorting for entries
 */

import type { Entry, ReflectionEntry, IncidentEntry, ReflectionModelId } from '../types';

export interface SearchFilters {
  query?: string;
  entryType?: 'all' | 'reflection' | 'incident';
  reflectionModel?: ReflectionModelId | 'all';
  dateFrom?: string; // ISO date
  dateTo?: string; // ISO date
  tags?: string[];
  hasMedia?: boolean;
  isLocked?: boolean;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'all'; // For incidents
  sortBy?: 'date-desc' | 'date-asc' | 'relevance';
}

export interface SearchResult {
  entries: Entry[];
  totalCount: number;
  filteredCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

/**
 * Extract searchable text from an entry
 */
function extractSearchableText(entry: Entry): string {
  const texts: string[] = [];

  // Add title and content
  if (entry.title) texts.push(entry.title);
  if (entry.content) texts.push(entry.content);

  // Reflection-specific
  if (entry.type === 'REFLECTION' || entry.type === 'reflection') {
    const reflection = entry as ReflectionEntry;
    if (reflection.answers) {
      Object.values(reflection.answers).forEach((answer) => {
        if (typeof answer === 'string') {
          texts.push(answer);
        }
      });
    }
    if (reflection.summary) texts.push(reflection.summary);
    if (reflection.insights) texts.push(...reflection.insights);
    if (reflection.aiInsight) texts.push(reflection.aiInsight);
  }

  // Incident-specific
  if (entry.type === 'INCIDENT' || entry.type === 'incident') {
    const incident = entry as IncidentEntry;
    if (incident.notes) texts.push(incident.notes);
    if (incident.location) texts.push(incident.location);
    if (incident.peopleInvolved) texts.push(...incident.peopleInvolved);
    if (incident.outcome) texts.push(incident.outcome);
    if (incident.immediateActions) texts.push(...incident.immediateActions);
    if (incident.contributingFactors) texts.push(...incident.contributingFactors);
  }

  return texts.join(' ').toLowerCase();
}

/**
 * Check if entry matches search query
 */
function matchesQuery(entry: Entry, query: string): boolean {
  if (!query || query.trim() === '') return true;

  const searchableText = extractSearchableText(entry);
  const terms = query.toLowerCase().split(/\s+/);

  // All terms must be present (AND logic)
  return terms.every((term) => searchableText.includes(term));
}

/**
 * Check if entry matches filters
 */
function matchesFilters(entry: Entry, filters: SearchFilters): boolean {
  // Entry type filter
  if (filters.entryType && filters.entryType !== 'all') {
    const entryTypeLower = entry.type.toLowerCase();
    if (entryTypeLower !== filters.entryType.toLowerCase()) {
      return false;
    }
  }

  // Reflection model filter
  if (filters.reflectionModel && filters.reflectionModel !== 'all') {
    if (entry.type === 'REFLECTION' || entry.type === 'reflection') {
      const reflection = entry as ReflectionEntry;
      const model = reflection.model || reflection.modelId;
      if (model !== filters.reflectionModel) {
        return false;
      }
    } else {
      return false; // Not a reflection
    }
  }

  // Date range filter
  if (filters.dateFrom) {
    const entryDate = new Date(entry.date);
    const fromDate = new Date(filters.dateFrom);
    if (entryDate < fromDate) {
      return false;
    }
  }

  if (filters.dateTo) {
    const entryDate = new Date(entry.date);
    const toDate = new Date(filters.dateTo);
    toDate.setHours(23, 59, 59, 999); // End of day
    if (entryDate > toDate) {
      return false;
    }
  }

  // Tags filter
  if (filters.tags && filters.tags.length > 0) {
    const entryKeywords = entry.keywords || [];
    const hasMatchingTag = filters.tags.some((tag) =>
      entryKeywords.some((keyword) =>
        keyword.toLowerCase().includes(tag.toLowerCase())
      )
    );
    if (!hasMatchingTag) {
      return false;
    }
  }

  // Media filter
  if (filters.hasMedia !== undefined) {
    const hasMedia =
      (entry.attachments && entry.attachments.length > 0) ||
      ((entry as IncidentEntry).media && (entry as IncidentEntry).media!.length > 0);
    if (filters.hasMedia && !hasMedia) {
      return false;
    }
    if (!filters.hasMedia && hasMedia) {
      return false;
    }
  }

  // Severity filter (for incidents)
  if (filters.severity && filters.severity !== 'all') {
    if (entry.type === 'INCIDENT' || entry.type === 'incident') {
      const incident = entry as IncidentEntry;
      if (incident.severity !== filters.severity) {
        return false;
      }
    } else {
      return false; // Not an incident
    }
  }

  return true;
}

/**
 * Calculate relevance score for search results
 */
function calculateRelevance(entry: Entry, query: string): number {
  if (!query || query.trim() === '') return 0;

  const searchableText = extractSearchableText(entry);
  const terms = query.toLowerCase().split(/\s+/);
  let score = 0;

  terms.forEach((term) => {
    // Count occurrences of each term
    const regex = new RegExp(term, 'gi');
    const matches = searchableText.match(regex);
    if (matches) {
      score += matches.length;
    }

    // Boost score if term appears in title
    if (entry.title?.toLowerCase().includes(term)) {
      score += 5;
    }

    // Boost score if term appears in keywords
    if (entry.keywords?.some((kw) => kw.toLowerCase().includes(term))) {
      score += 3;
    }
  });

  return score;
}

/**
 * Sort entries based on sort option
 */
function sortEntries(entries: Entry[], sortBy: string, query?: string): Entry[] {
  const sorted = [...entries];

  switch (sortBy) {
    case 'date-desc':
      sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      break;
    case 'date-asc':
      sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      break;
    case 'relevance':
      if (query) {
        sorted.sort((a, b) => {
          const scoreA = calculateRelevance(a, query);
          const scoreB = calculateRelevance(b, query);
          return scoreB - scoreA;
        });
      } else {
        // Fallback to date desc if no query
        sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      break;
    default:
      sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  return sorted;
}

/**
 * Search and filter entries with pagination
 */
export function searchEntries(
  entries: Entry[],
  filters: SearchFilters = {},
  pagination: PaginationOptions = { page: 1, pageSize: 20 }
): SearchResult {
  // Filter by query
  let filtered = entries;
  if (filters.query) {
    filtered = filtered.filter((entry) => matchesQuery(entry, filters.query!));
  }

  // Apply additional filters
  filtered = filtered.filter((entry) => matchesFilters(entry, filters));

  // Sort
  const sortBy = filters.sortBy || 'date-desc';
  filtered = sortEntries(filtered, sortBy, filters.query);

  // Pagination
  const totalFiltered = filtered.length;
  const startIndex = (pagination.page - 1) * pagination.pageSize;
  const endIndex = startIndex + pagination.pageSize;
  const paginatedEntries = filtered.slice(startIndex, endIndex);

  const totalPages = Math.ceil(totalFiltered / pagination.pageSize);

  return {
    entries: paginatedEntries,
    totalCount: entries.length,
    filteredCount: totalFiltered,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages,
    hasMore: pagination.page < totalPages,
  };
}

/**
 * Get unique tags/keywords from entries
 */
export function extractUniqueTags(entries: Entry[]): string[] {
  const tags = new Set<string>();
  entries.forEach((entry) => {
    if (entry.keywords) {
      entry.keywords.forEach((kw) => tags.add(kw.toLowerCase()));
    }
  });
  return Array.from(tags).sort();
}

/**
 * Get date range from entries
 */
export function getDateRange(entries: Entry[]): { earliest: string; latest: string } | null {
  if (entries.length === 0) return null;

  const dates = entries.map((e) => new Date(e.date).getTime());
  const earliest = new Date(Math.min(...dates)).toISOString().split('T')[0];
  const latest = new Date(Math.max(...dates)).toISOString().split('T')[0];

  return { earliest, latest };
}

/**
 * Highlight search terms in text
 */
export function highlightSearchTerms(text: string, query: string): string {
  if (!query || query.trim() === '') return text;

  const terms = query.split(/\s+/);
  let highlighted = text;

  terms.forEach((term) => {
    const regex = new RegExp(`(${term})`, 'gi');
    highlighted = highlighted.replace(regex, '<mark>$1</mark>');
  });

  return highlighted;
}

/**
 * Get search suggestions based on partial query
 */
export function getSearchSuggestions(entries: Entry[], partialQuery: string): string[] {
  if (!partialQuery || partialQuery.length < 2) return [];

  const suggestions = new Set<string>();
  const lowerQuery = partialQuery.toLowerCase();

  entries.forEach((entry) => {
    // Extract words from searchable text
    const text = extractSearchableText(entry);
    const words = text.split(/\s+/);

    words.forEach((word) => {
      if (word.length >= 3 && word.startsWith(lowerQuery)) {
        suggestions.add(word);
      }
    });

    // Add matching keywords
    if (entry.keywords) {
      entry.keywords.forEach((kw) => {
        if (kw.toLowerCase().startsWith(lowerQuery)) {
          suggestions.add(kw.toLowerCase());
        }
      });
    }
  });

  return Array.from(suggestions).slice(0, 5); // Top 5 suggestions
}

/**
 * Export filtered entries to CSV
 */
export function exportSearchResultsToCSV(result: SearchResult, filters: SearchFilters): string {
  const lines: string[] = [];

  // Header
  lines.push('"Search Results Export"');
  lines.push(`"Generated: ${new Date().toISOString()}"`);
  lines.push('""');
  if (filters.query) {
    lines.push(`"Search Query: ${filters.query}"`);
  }
  lines.push(`"Total Results: ${result.filteredCount}"`);
  lines.push(`"Showing: ${result.entries.length} entries"`);
  lines.push('""');

  // Column headers
  lines.push('"Date","Type","Title","Content Preview"');

  // Rows
  result.entries.forEach((entry) => {
    const date = new Date(entry.date).toLocaleDateString();
    const type = entry.type;
    const title = (entry.title || '').replace(/"/g, '""');
    const preview = (entry.content || '').substring(0, 100).replace(/"/g, '""');

    lines.push(`"${date}","${type}","${title}","${preview}"`);
  });

  return lines.join('\n');
}
