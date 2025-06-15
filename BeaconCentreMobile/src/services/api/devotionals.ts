// src/services/api/devotionals.ts
import { apiClient } from './client';
import { Devotional } from '@/types/api';
import LocalStorageService from '@/services/storage/LocalStorage';

export const devotionalsApi = {
  async getAll(): Promise<Devotional[]> {
    try {
      return await apiClient.get<Devotional[]>('/devotionals');
    } catch (error) {
      // Fallback to cached data
      const cached = await LocalStorageService.getCachedData<Devotional[]>('devotionals');
      if (cached) {
        return cached;
      }
      throw error;
    }
  },

  async getById(id: number): Promise<Devotional> {
    return await apiClient.get<Devotional>(`/devotionals/${id}`);
  },

  async getByDate(date: string): Promise<Devotional> {
    return await apiClient.get<Devotional>(`/devotionals/date/${date}`);
  },

  async getToday(): Promise<Devotional> {
    try {
      const devotional = await apiClient.get<Devotional>('/devotionals/today');
      // Cache today's devotional
      await LocalStorageService.cacheData('todays_devotional', devotional);
      return devotional;
    } catch (error) {
      // Fallback to cached
      const cached = await LocalStorageService.getCachedData<Devotional>('todays_devotional');
      if (cached) {
        return cached;
      }
      throw error;
    }
  },

  async getRecent(limit: number = 10): Promise<Devotional[]> {
    const allDevotionals = await this.getAll();
    return allDevotionals
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  },

  async search(query: string): Promise<Devotional[]> {
    const allDevotionals = await this.getAll();
    const searchTerm = query.toLowerCase();
    
    return allDevotionals.filter(devotional =>
      devotional.title.toLowerCase().includes(searchTerm) ||
      devotional.content.toLowerCase().includes(searchTerm) ||
      devotional.verse_reference.toLowerCase().includes(searchTerm) ||
      devotional.verse_text.toLowerCase().includes(searchTerm)
    );
  },
};