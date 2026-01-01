// Mental Atlas builder - deterministic, offline-safe, non-AI
// Extracts nodes and edges from reflection entries

import type { Entry, ReflectionEntry } from '../types';

export type AtlasNode = {
  id: string;
  label: string;
  kind: 'keyword' | 'emotion' | 'theme' | 'stage';
  weight: number;
};

export type AtlasEdge = {
  from: string;
  to: string;
  strength: number;
};

export type MentalAtlasData = {
  nodes: AtlasNode[];
  edges: AtlasEdge[];
};

// Common stopwords to filter out
const STOPWORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
  'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which',
  'me', 'when', 'make', 'can', 'like', 'no', 'just', 'him', 'know',
  'take', 'into', 'your', 'some', 'could', 'them', 'than', 'then',
  'its', 'am', 'is', 'was', 'are', 'been', 'has', 'had', 'were',
]);

// Extract meaningful words from text
function extractWords(text: string): string[] {
  if (!text || typeof text !== 'string') return [];

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter(word =>
      word.length >= 3 && // Minimum length
      !STOPWORDS.has(word) && // Not a stopword
      !/^\d+$/.test(word) // Not pure numbers
    );
}

// Build mental atlas from entries
export function buildMentalAtlas(entries: Entry[]): MentalAtlasData {
  const nodeMap = new Map<string, AtlasNode>();
  const edgeMap = new Map<string, AtlasEdge>();

  // Filter reflection entries only
  const reflections = entries.filter((e): e is ReflectionEntry =>
    e.type === 'REFLECTION' || e.type === 'reflection'
  );

  if (reflections.length === 0) {
    return { nodes: [], edges: [] };
  }

  // Process each reflection
  for (const reflection of reflections) {
    const entryWords: string[] = [];

    // Extract words from answers
    if (reflection.answers && typeof reflection.answers === 'object') {
      for (const [stageName, answer] of Object.entries(reflection.answers)) {
        if (typeof answer === 'string' && answer.trim()) {
          // Add stage name as node
          const stageId = `stage:${stageName.toLowerCase().trim()}`;
          if (!nodeMap.has(stageId)) {
            nodeMap.set(stageId, {
              id: stageId,
              label: stageName,
              kind: 'stage',
              weight: 0,
            });
          }
          const stageNode = nodeMap.get(stageId)!;
          stageNode.weight += 1;

          // Extract words from answer
          const words = extractWords(answer);
          entryWords.push(...words);
        }
      }
    }

    // Extract keywords if present
    if (Array.isArray(reflection.keywords)) {
      for (const kw of reflection.keywords) {
        if (typeof kw === 'string' && kw.trim()) {
          entryWords.push(kw.toLowerCase().trim());
        }
      }
    }

    // Create nodes from extracted words
    const wordCounts = new Map<string, number>();
    for (const word of entryWords) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }

    // Add nodes (filter out very rare words - appear less than 2 times across all entries)
    for (const [word, count] of wordCounts.entries()) {
      const nodeId = `word:${word}`;
      if (!nodeMap.has(nodeId)) {
        nodeMap.set(nodeId, {
          id: nodeId,
          label: word,
          kind: 'theme',
          weight: 0,
        });
      }
      const node = nodeMap.get(nodeId)!;
      node.weight += count;
    }

    // Create edges (co-occurrence within same reflection)
    const uniqueWords = Array.from(wordCounts.keys());
    for (let i = 0; i < uniqueWords.length; i++) {
      for (let j = i + 1; j < uniqueWords.length; j++) {
        const from = `word:${uniqueWords[i]}`;
        const to = `word:${uniqueWords[j]}`;
        const edgeKey = [from, to].sort().join('::');

        if (!edgeMap.has(edgeKey)) {
          edgeMap.set(edgeKey, { from, to, strength: 0 });
        }
        const edge = edgeMap.get(edgeKey)!;
        edge.strength += 1;
      }
    }
  }

  // Filter nodes: keep only those with weight >= 2
  const nodes = Array.from(nodeMap.values()).filter(n => n.weight >= 2);

  // Filter edges: keep only edges between existing nodes
  const validNodeIds = new Set(nodes.map(n => n.id));
  const edges = Array.from(edgeMap.values()).filter(
    e => validNodeIds.has(e.from) && validNodeIds.has(e.to)
  );

  return { nodes, edges };
}

// Find reflections related to a node
export function findRelatedReflections(nodeId: string, entries: Entry[]): ReflectionEntry[] {
  const reflections = entries.filter((e): e is ReflectionEntry =>
    e.type === 'REFLECTION' || e.type === 'reflection'
  );

  const related: ReflectionEntry[] = [];
  const searchTerm = nodeId.replace(/^(word|stage|keyword|theme):/, '').toLowerCase();

  for (const reflection of reflections) {
    let found = false;

    // Check answers
    if (reflection.answers && typeof reflection.answers === 'object') {
      for (const [stageName, answer] of Object.entries(reflection.answers)) {
        if (typeof answer === 'string') {
          const words = extractWords(answer);
          if (words.includes(searchTerm) || stageName.toLowerCase().includes(searchTerm)) {
            found = true;
            break;
          }
        }
      }
    }

    // Check keywords
    if (!found && Array.isArray(reflection.keywords)) {
      for (const kw of reflection.keywords) {
        if (typeof kw === 'string' && kw.toLowerCase().includes(searchTerm)) {
          found = true;
          break;
        }
      }
    }

    if (found) {
      related.push(reflection);
    }
  }

  return related;
}
