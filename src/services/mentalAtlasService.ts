/**
 * Mental Atlas Service
 * Pattern detection and theme analysis from reflection history
 * No ML required - deterministic keyword and co-occurrence analysis
 */

import type { Entry, ReflectionEntry } from '../types';

// Stop words to filter out (common words with little meaning)
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'her', 'its', 'our', 'their', 'what', 'which', 'who',
  'when', 'where', 'why', 'how', 'am', 'im', 'ive', 'dont', 'doesnt', 'didnt',
  'wont', 'wouldnt', 'couldnt', 'shouldnt', 'cant', 'very', 'too', 'also',
  'just', 'so', 'than', 'such', 'no', 'not', 'only', 'own', 'same', 'about',
]);

export interface Keyword {
  word: string;
  count: number;
  firstSeen: string; // ISO date
  lastSeen: string; // ISO date
  entries: string[]; // Entry IDs
}

export interface Theme {
  id: string;
  keywords: string[];
  count: number;
  strength: number; // 0-1
  firstSeen: string;
  lastSeen: string;
  entries: string[];
}

export interface Pattern {
  id: string;
  type: 'recurring' | 'emerging' | 'fading';
  keywords: string[];
  frequency: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  timespan: {
    start: string;
    end: string;
  };
}

export interface Cluster {
  id: string;
  keywords: string[];
  size: number;
  centrality: number; // How connected this cluster is
}

export interface CooccurrenceMap {
  [keyword: string]: {
    [cooccurringWord: string]: number;
  };
}

/**
 * Extract meaningful keywords from text
 */
export function extractKeywords(text: string, minLength: number = 3): string[] {
  if (!text || typeof text !== 'string') return [];

  // Convert to lowercase and split on non-word characters
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= minLength && !STOP_WORDS.has(word));

  // Remove duplicates
  return Array.from(new Set(words));
}

/**
 * Extract all text content from an entry
 */
function extractEntryText(entry: Entry): string {
  const texts: string[] = [];

  if (entry.type === 'REFLECTION') {
    const reflectionEntry = entry as ReflectionEntry;
    if (reflectionEntry.answers) {
      Object.values(reflectionEntry.answers).forEach((answer) => {
        if (typeof answer === 'string') {
          texts.push(answer);
        }
      });
    }
  } else if (entry.type === 'INCIDENT') {
    const notes = (entry as any).notes;
    if (typeof notes === 'string') {
      texts.push(notes);
    }
  }

  return texts.join(' ');
}

/**
 * Build keyword frequency map from entries
 */
export function buildKeywordMap(entries: Entry[]): Map<string, Keyword> {
  const keywordMap = new Map<string, Keyword>();

  entries.forEach((entry) => {
    const text = extractEntryText(entry);
    const keywords = extractKeywords(text);
    const entryDate = entry.date;

    keywords.forEach((word) => {
      if (keywordMap.has(word)) {
        const existing = keywordMap.get(word)!;
        existing.count += 1;
        existing.lastSeen = entryDate;
        if (!existing.entries.includes(entry.id)) {
          existing.entries.push(entry.id);
        }
      } else {
        keywordMap.set(word, {
          word,
          count: 1,
          firstSeen: entryDate,
          lastSeen: entryDate,
          entries: [entry.id],
        });
      }
    });
  });

  return keywordMap;
}

/**
 * Build co-occurrence map (which words appear together)
 */
export function buildCooccurrenceMap(entries: Entry[]): CooccurrenceMap {
  const cooccurrenceMap: CooccurrenceMap = {};

  entries.forEach((entry) => {
    const text = extractEntryText(entry);
    const keywords = extractKeywords(text);

    // For each pair of keywords in the same entry
    for (let i = 0; i < keywords.length; i++) {
      const word1 = keywords[i];
      if (!cooccurrenceMap[word1]) {
        cooccurrenceMap[word1] = {};
      }

      for (let j = i + 1; j < keywords.length; j++) {
        const word2 = keywords[j];
        if (!cooccurrenceMap[word2]) {
          cooccurrenceMap[word2] = {};
        }

        // Increment co-occurrence count
        cooccurrenceMap[word1][word2] = (cooccurrenceMap[word1][word2] || 0) + 1;
        cooccurrenceMap[word2][word1] = (cooccurrenceMap[word2][word1] || 0) + 1;
      }
    }
  });

  return cooccurrenceMap;
}

/**
 * Detect themes (clusters of frequently co-occurring keywords)
 */
export function detectThemes(entries: Entry[], minThemeSize: number = 2): Theme[] {
  if (entries.length === 0) return [];

  const keywordMap = buildKeywordMap(entries);
  const cooccurrenceMap = buildCooccurrenceMap(entries);
  const themes: Theme[] = [];

  // Get top keywords by frequency
  const topKeywords = Array.from(keywordMap.values())
    .filter((kw) => kw.count >= 2) // Must appear at least twice
    .sort((a, b) => b.count - a.count)
    .slice(0, 20); // Top 20 keywords

  // Find clusters of related keywords
  const processed = new Set<string>();

  topKeywords.forEach((keyword) => {
    if (processed.has(keyword.word)) return;

    const cluster = [keyword.word];
    processed.add(keyword.word);

    // Find strongly related keywords
    const cooccurrences = cooccurrenceMap[keyword.word] || {};
    const related = Object.entries(cooccurrences)
      .filter(([word, count]) => !processed.has(word) && count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3) // Top 3 related words
      .map(([word]) => word);

    related.forEach((word) => {
      cluster.push(word);
      processed.add(word);
    });

    if (cluster.length >= minThemeSize) {
      // Calculate theme metadata
      const themeEntries = new Set<string>();
      const dates: string[] = [];

      cluster.forEach((word) => {
        const kw = keywordMap.get(word);
        if (kw) {
          kw.entries.forEach((id) => themeEntries.add(id));
          dates.push(kw.firstSeen, kw.lastSeen);
        }
      });

      dates.sort();
      const strength = themeEntries.size / entries.length; // 0-1

      themes.push({
        id: `theme_${cluster.join('_')}`,
        keywords: cluster,
        count: themeEntries.size,
        strength,
        firstSeen: dates[0] || new Date().toISOString(),
        lastSeen: dates[dates.length - 1] || new Date().toISOString(),
        entries: Array.from(themeEntries),
      });
    }
  });

  return themes.sort((a, b) => b.count - a.count);
}

/**
 * Find temporal patterns (recurring, emerging, fading)
 */
export function findPatterns(entries: Entry[], timeWindowDays: number = 30): Pattern[] {
  if (entries.length < 3) return [];

  const patterns: Pattern[] = [];
  const keywordMap = buildKeywordMap(entries);
  const now = new Date();

  // Analyze each keyword for temporal patterns
  Array.from(keywordMap.values()).forEach((keyword) => {
    if (keyword.count < 2) return;

    // Get entry dates for this keyword
    const entryDates = entries
      .filter((e) => keyword.entries.includes(e.id))
      .map((e) => new Date(e.date))
      .sort((a, b) => a.getTime() - b.getTime());

    if (entryDates.length === 0) return;

    const firstDate = entryDates[0];
    const lastDate = entryDates[entryDates.length - 1];
    const daysSinceFirst = (now.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
    const daysSinceLast = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);

    // Calculate frequency (mentions per week)
    const frequency = (keyword.count / Math.max(daysSinceFirst, 1)) * 7;

    // Determine pattern type
    let type: Pattern['type'] = 'recurring';
    let trend: Pattern['trend'] = 'stable';

    // Emerging: recently started appearing
    if (daysSinceFirst < timeWindowDays && keyword.count >= 2) {
      type = 'emerging';
      trend = 'increasing';
    }
    // Fading: hasn't appeared recently
    else if (daysSinceLast > timeWindowDays && keyword.count >= 2) {
      type = 'fading';
      trend = 'decreasing';
    }
    // Recurring: appears regularly over time
    else if (keyword.count >= 3 && daysSinceFirst > timeWindowDays) {
      type = 'recurring';

      // Check if increasing or decreasing
      const recentMentions = entryDates.filter(
        (d) => (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) < timeWindowDays
      ).length;
      const olderMentions = entryDates.length - recentMentions;

      if (recentMentions > olderMentions) {
        trend = 'increasing';
      } else if (recentMentions < olderMentions) {
        trend = 'decreasing';
      }
    }

    patterns.push({
      id: `pattern_${keyword.word}`,
      type,
      keywords: [keyword.word],
      frequency,
      trend,
      timespan: {
        start: firstDate.toISOString(),
        end: lastDate.toISOString(),
      },
    });
  });

  return patterns.sort((a, b) => b.frequency - a.frequency);
}

/**
 * Generate keyword clusters for visualization
 */
export function generateClusters(entries: Entry[]): Cluster[] {
  if (entries.length === 0) return [];

  const cooccurrenceMap = buildCooccurrenceMap(entries);
  const clusters: Cluster[] = [];
  const processed = new Set<string>();

  // Get all keywords sorted by total connections
  const keywords = Object.keys(cooccurrenceMap);
  const keywordsByConnections = keywords
    .map((word) => ({
      word,
      connections: Object.keys(cooccurrenceMap[word] || {}).length,
    }))
    .sort((a, b) => b.connections - a.connections);

  keywordsByConnections.forEach(({ word, connections }) => {
    if (processed.has(word)) return;

    const cluster = [word];
    processed.add(word);

    // Find most connected words
    const cooccurrences = cooccurrenceMap[word] || {};
    const connected = Object.entries(cooccurrences)
      .filter(([w]) => !processed.has(w))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([w]) => w);

    connected.forEach((w) => {
      cluster.push(w);
      processed.add(w);
    });

    clusters.push({
      id: `cluster_${word}`,
      keywords: cluster,
      size: cluster.length,
      centrality: connections / keywords.length,
    });
  });

  return clusters.sort((a, b) => b.centrality - a.centrality).slice(0, 10);
}

/**
 * Get top keywords overall
 */
export function getTopKeywords(entries: Entry[], limit: number = 20): Keyword[] {
  const keywordMap = buildKeywordMap(entries);
  return Array.from(keywordMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
