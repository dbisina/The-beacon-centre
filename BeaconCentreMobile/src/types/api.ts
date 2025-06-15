// src/types/api.ts
export interface Devotional {
    id: number;
    date: string;
    title: string;
    verse_text: string;
    verse_reference: string;
    content: string;
    prayer?: string;
    created_at: string;
    updated_at: string;
  }
  
  export interface VideoSermon {
    id: number;
    title: string;
    speaker: string;
    youtube_id: string;
    description?: string;
    duration?: string;
    category?: string;
    sermon_date?: string;
    thumbnail_url?: string;
    is_featured: boolean;
    created_at: string;
  }
  
  export interface AudioSermon {
    id: number;
    title: string;
    speaker: string;
    audio_url: string;
    cloudinary_public_id?: string;
    duration?: string;
    file_size?: number;
    category?: string;
    sermon_date?: string;
    description?: string;
    is_featured: boolean;
    created_at: string;
  }
  
  export interface Announcement {
    id: number;
    title: string;
    content: string;
    priority: 'low' | 'medium' | 'high';
    start_date: string;
    expiry_date?: string;
    image_url?: string;
    cloudinary_public_id?: string;
    action_url?: string;
    action_text?: string;
    is_active: boolean;
    created_at: string;
  }
  
  export interface Category {
    id: number;
    name: string;
    description?: string;
    color?: string;
    created_at: string;
  }
  