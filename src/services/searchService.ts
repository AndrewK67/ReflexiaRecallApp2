/**
 * Search & Filter Service
 * Advanced search, filtering, and sorting for entries
 */

import type { Entry } from '../types';
import { isCapture, isReflection } from '../utils/entryKind';

export interface SearchFilters {
  query?: string;
  entryType?: 'all' | 'reflection' | 'capture';
  reflectionModel?: string | 'all';
  dateFrom?: string; // ISO date
  dateTo?: string; // ISO date
  tags?: string[];
  hasMedia?: boolean;
  isLocked?: boolean;
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
  if (isReflection(entry)) {
    const reflection = entry;
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

  // Captures: the note. (Clinical fields the parked professional module
  // wrote — location, people, outcome — are that module's to search.)
  if (isCapture(entry)) {
    if (entry.notes) texts.push(entry.notes);
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
  // Entry type filter ("capture" is stored as INCIDENT; see entryKind.ts)
  if (filters.entryType === 'reflection' && !isReflection(entry)) return false;
  if (filters.entryType === 'capture' && !isCapture(entry)) return false;

  // Reflection model filter
  if (filters.reflectionModel && filters.reflectionModel !== 'all') {
    if (isReflection(entry)) {
      const reflection = entry;
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
      (isCapture(entry) && !!entry.media && entry.media.length > 0);
    if (filters.hasMedia && !hasMedia) {
      return false;
    }
    if (!filters.hasMedia && hasMedia) {
      return false;
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
    // Count occurrences of each term. Plain text, not a RegExp: a term like
    // "(again" used to throw and take the whole app down (phase 3D.6).
    score += countOccurrences(searchableText, term);

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

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  for (let i = haystack.indexOf(needle); i !== -1; i = haystack.indexOf(needle, i + needle.length)) count++;
  return count;
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
 * Every entry the query and filters match, sorted — all of them, not a page.
 * Export uses this (phase 3D.6: the CSV used to hold only the page on
 * screen, the first twenty).
 */
export function filterEntries(entries: Entry[], filters: SearchFilters = {}): Entry[] {
  let filtered = entries;
  if (filters.query) {
    filtered = filtered.filter((entry) => matchesQuery(entry, filters.query!));
  }
  filtered = filtered.filter((entry) => matchesFilters(entry, filters));
  return sortEntries(filtered, filters.sortBy || 'date-desc', filters.query);
}

/**
 * Search and filter entries with pagination
 */
export function searchEntries(
  entries: Entry[],
  filters: SearchFilters = {},
  pagination: PaginationOptions = { page: 1, pageSize: 20 }
): SearchResult {
  const filtered = filterEntries(entries, filters);

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
 * Split text into plain and matching parts, for the caller to render as
 * text with <mark> around the matches. It returns data, not HTML: the old
 * highlightSearchTerms() returned an HTML string that Archive injected with
 * dangerouslySetInnerHTML, so an entry from an imported backup file could
 * run code in the app (phase 3D.6). Matching is case-insensitive and
 * literal - no RegExp is built from what someone typed.
 */
export function highlightParts(text: string, query: string): Array<{ text: string; match: boolean }> {
  const terms = [...new Set(query.toLowerCase().split(/\s+/).filter(Boolean))].sort((a, b) => b.length - a.length);
  if (!text || terms.length === 0) return text ? [{ text, match: false }] : [];
  const lower = text.toLowerCase();
  const parts: Array<{ text: string; match: boolean }> = [];
  let plainFrom = 0;
  let i = 0;
  while (i < text.length) {
    const term = terms.find((t) => lower.startsWith(t, i));
    if (term) {
      if (i > plainFrom) parts.push({ text: text.slice(plainFrom, i), match: false });
      parts.push({ text: text.slice(i, i + term.length), match: true });
      i += term.length;
      plainFrom = i;
    } else {
      i++;
    }
  }
  if (plainFrom < text.length) parts.push({ text: text.slice(plainFrom), match: false });
  return parts;
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

// CSV export lives in utils/csv.ts (entriesToCsv) since phase 3D.6; the one
// that was here wrote title and content, which nothing fills in.
