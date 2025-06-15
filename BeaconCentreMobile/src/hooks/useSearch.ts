// src/hooks/useSearch.ts
import { useState, useMemo, useEffect } from 'react';
import { Devotional, VideoSermon, AudioSermon, Announcement } from '@/types/api';

interface SearchableContent {
  devotionals: Devotional[];
  videoSermons: VideoSermon[];
  audioSermons: AudioSermon[];
  announcements: Announcement[];
}

interface SearchResults {
  devotionals: Devotional[];
  videoSermons: VideoSermon[];
  audioSermons: AudioSermon[];
  announcements: Announcement[];
  totalResults: number;
}

export const useSearch = (content: SearchableContent) => {
  const [query, setQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const searchResults: SearchResults = useMemo(() => {
    if (!query.trim()) {
      return {
        devotionals: [],
        videoSermons: [],
        audioSermons: [],
        announcements: [],
        totalResults: 0,
      };
    }

    const searchTerm = query.toLowerCase().trim();

    const devotionals = content.devotionals.filter(item =>
      item.title.toLowerCase().includes(searchTerm) ||
      item.content.toLowerCase().includes(searchTerm) ||
      item.verse_reference.toLowerCase().includes(searchTerm) ||
      item.verse_text.toLowerCase().includes(searchTerm)
    );

    const videoSermons = content.videoSermons.filter(item =>
      item.title.toLowerCase().includes(searchTerm) ||
      item.speaker.toLowerCase().includes(searchTerm) ||
      item.description?.toLowerCase().includes(searchTerm) ||
      item.category?.toLowerCase().includes(searchTerm)
    );

    const audioSermons = content.audioSermons.filter(item =>
      item.title.toLowerCase().includes(searchTerm) ||
      item.speaker.toLowerCase().includes(searchTerm) ||
      item.description?.toLowerCase().includes(searchTerm) ||
      item.category?.toLowerCase().includes(searchTerm)
    );

    const announcements = content.announcements.filter(item =>
      item.title.toLowerCase().includes(searchTerm) ||
      item.content.toLowerCase().includes(searchTerm)
    );

    return {
      devotionals,
      videoSermons,
      audioSermons,
      announcements,
      totalResults: devotionals.length + videoSermons.length + audioSermons.length + announcements.length,
    };
  }, [query, content]);

  const addToHistory = (searchTerm: string) => {
    if (searchTerm.trim() && !searchHistory.includes(searchTerm)) {
      setSearchHistory(prev => [searchTerm, ...prev].slice(0, 10)); // Keep last 10 searches
    }
  };

  const clearHistory = () => {
    setSearchHistory([]);
  };

  return {
    query,
    setQuery,
    searchResults,
    searchHistory,
    addToHistory,
    clearHistory,
  };
};