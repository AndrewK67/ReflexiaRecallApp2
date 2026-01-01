import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  Star,
  BookOpen,
  ExternalLink,
  X,
  FileText,
  Clock,
  Tag,
  Award,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  LEARNING_RESOURCES,
  CATEGORY_INFO,
  RESOURCE_TYPE_INFO,
  searchResources,
  type LearningResource,
  type ResourceCategory,
  type ResourceType,
  type DifficultyLevel,
} from '../data/learningResources';

export default function Library() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | 'all'>('all');
  const [selectedType, setSelectedType] = useState<ResourceType | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'all'>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [expandedResource, setExpandedResource] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('libraryFavorites');
    if (saved) {
      setFavorites(new Set(JSON.parse(saved)));
    }
  }, []);

  // Save favorites to localStorage
  const toggleFavorite = (resourceId: string) => {
    setFavorites((prev) => {
      const updated = new Set(prev);
      if (updated.has(resourceId)) {
        updated.delete(resourceId);
      } else {
        updated.add(resourceId);
      }
      localStorage.setItem('libraryFavorites', JSON.stringify(Array.from(updated)));
      return updated;
    });
  };

  // Filter resources
  const filteredResources = useMemo(() => {
    let results = LEARNING_RESOURCES;

    // Search filter
    if (searchQuery.trim()) {
      results = searchResources(searchQuery);
    }

    // Category filter
    if (selectedCategory !== 'all') {
      results = results.filter((r) => r.category === selectedCategory);
    }

    // Type filter
    if (selectedType !== 'all') {
      results = results.filter((r) => r.type === selectedType);
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      results = results.filter((r) => r.difficulty === selectedDifficulty);
    }

    // Favorites filter
    if (showFavoritesOnly) {
      results = results.filter((r) => favorites.has(r.id));
    }

    return results;
  }, [searchQuery, selectedCategory, selectedType, selectedDifficulty, showFavoritesOnly, favorites]);

  const categories = Object.keys(CATEGORY_INFO) as ResourceCategory[];
  const types = Object.keys(RESOURCE_TYPE_INFO) as ResourceType[];

  const getDifficultyColor = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case 'beginner':
        return '#10b981';
      case 'intermediate':
        return '#f59e0b';
      case 'advanced':
        return '#ef4444';
    }
  };

  const ResourceCard = ({ resource }: { resource: LearningResource }) => {
    const isExpanded = expandedResource === resource.id;
    const isFavorite = favorites.has(resource.id);
    const categoryColor = CATEGORY_INFO[resource.category].color;

    return (
      <div
        className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 p-5 hover:bg-white/15 transition-all"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{RESOURCE_TYPE_INFO[resource.type].icon}</span>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-bold uppercase"
                style={{ backgroundColor: `${categoryColor}30`, color: categoryColor }}
              >
                {CATEGORY_INFO[resource.category].label}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{resource.title}</h3>
            {resource.author && (
              <p className="text-xs text-white/50">by {resource.author}</p>
            )}
          </div>
          <button
            onClick={() => toggleFavorite(resource.id)}
            className="ml-3 flex-shrink-0"
          >
            <Star
              size={20}
              className={`transition ${
                isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-white/40 hover:text-white/60'
              }`}
            />
          </button>
        </div>

        {/* Description */}
        <p className="text-white/70 text-sm mb-3 leading-relaxed">
          {resource.description}
        </p>

        {/* Metadata */}
        <div className="flex flex-wrap gap-2 mb-3">
          {resource.duration && (
            <div className="flex items-center gap-1 text-xs text-white/50">
              <Clock size={12} />
              {resource.duration}
            </div>
          )}
          <div
            className="flex items-center gap-1 text-xs font-semibold"
            style={{ color: getDifficultyColor(resource.difficulty) }}
          >
            <Award size={12} />
            {resource.difficulty}
          </div>
        </div>

        {/* Tags */}
        {resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {resource.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-xs"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Key Points (expandable) */}
        {resource.keyPoints && resource.keyPoints.length > 0 && (
          <div className="mb-3">
            <button
              onClick={() => setExpandedResource(isExpanded ? null : resource.id)}
              className="flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white transition"
            >
              <FileText size={14} />
              Key Points
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {isExpanded && (
              <ul className="mt-2 space-y-1.5 text-sm text-white/70">
                {resource.keyPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-white/40 flex-shrink-0">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Offline Content (expandable) */}
        {resource.offlineContent && (
          <div className="mb-3">
            <button
              onClick={() => setExpandedResource(isExpanded ? null : resource.id)}
              className="flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition"
            >
              <BookOpen size={14} />
              Read Offline Summary
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {isExpanded && (
              <div className="mt-2 p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">
                  {resource.offlineContent}
                </p>
              </div>
            )}
          </div>
        )}

        {/* External Link */}
        {resource.url && (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition"
          >
            <ExternalLink size={14} />
            View External Resource
          </a>
        )}
      </div>
    );
  };

  return (
    <div className="h-full bg-gradient-to-b from-slate-950 to-slate-900 text-white flex flex-col overflow-y-auto custom-scrollbar relative nav-safe">
      <div className="animated-backdrop-dark overflow-hidden">
        <div className="orb one" />
        <div className="orb two" />
        <div className="orb three" />
        <div className="grain" />
      </div>

      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/10 relative z-10 flex items-center justify-between">
        <h1 className="text-xl font-bold">Learning Library</h1>
        <span className="text-xs text-white/60 font-semibold">
          {filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Search and Filters */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/10 relative z-10">
        {/* Search Bar and Filter Toggle */}
        <div className="flex gap-2 mb-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resources..."
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-white/15 bg-white/5 text-white text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
              showFilters
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'bg-white/10 text-white/60 border border-white/15 hover:bg-white/15'
            }`}
          >
            <Filter size={16} />
            {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Collapsible Filters */}
        {showFilters && (
          <div className="space-y-2 pt-2">
            <div className="grid grid-cols-3 gap-2">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as ResourceCategory | 'all')}
                className="w-full px-2 py-1.5 rounded-lg border border-white/15 bg-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_INFO[cat].label}
                  </option>
                ))}
              </select>

              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as ResourceType | 'all')}
                className="w-full px-2 py-1.5 rounded-lg border border-white/15 bg-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="all">All Types</option>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {RESOURCE_TYPE_INFO[type].label}
                  </option>
                ))}
              </select>

              {/* Difficulty Filter */}
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value as DifficultyLevel | 'all')}
                className="w-full px-2 py-1.5 rounded-lg border border-white/15 bg-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            {/* Favorites Toggle */}
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                showFavoritesOnly
                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                  : 'bg-white/10 text-white/60 border border-white/15 hover:bg-white/15'
              }`}
            >
              <Star size={12} className={showFavoritesOnly ? 'fill-yellow-400' : ''} />
              {showFavoritesOnly ? 'Favorites Only' : 'All Resources'}
            </button>
          </div>
        )}
      </div>

      {/* Resources Grid */}
      <div className="flex-1 overflow-y-auto p-4 pb-20 relative z-10">
        {filteredResources.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <BookOpen size={48} className="text-white/20 mb-4" />
            <p className="text-white/70 font-semibold mb-2">No resources found</p>
            <p className="text-white/40 text-sm max-w-xs">
              Try adjusting your search or filters to find what you're looking for.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-32">
            {filteredResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
