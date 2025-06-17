// src/services/api/client.ts - COMPREHENSIVE SERMON MOCK DATA
import axios, { AxiosInstance, AxiosError } from 'axios';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import LocalStorageService from '@/services/storage/LocalStorage';
import { 
  Devotional, 
  VideoSermon, 
  AudioSermon, 
  Announcement,
} from '@/types/api';

// COMPREHENSIVE Mock Data with rich content
const ENHANCED_MOCK_DATA = {
  devotionals: [
    {
      id: 1,
      date: new Date().toISOString().split('T')[0],
      title: "Walking in Faith",
      verse_text: "Now faith is the substance of things hoped for, the evidence of things not seen.",
      verse_reference: "Hebrews 11:1",
      content: `Faith is not just believing in something you cannot see; it's acting on that belief. When we walk by faith, we step into God's promises even when circumstances seem impossible.

Today, let your actions reflect your faith in God's promises. Trust that He is working all things together for your good, even when you can't see the full picture.

Remember, faith grows stronger through practice. Each step of obedience, each moment of trust, each decision to believe God's word over your circumstances builds your spiritual muscle.`,
      prayer: "Lord, help me to walk by faith and not by sight. Strengthen my trust in You, and help me to see Your hand at work in every situation. Amen.",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 2,
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      title: "His Grace is Sufficient",
      verse_text: "And He said to me, 'My grace is sufficient for you, for My strength is made perfect in weakness.'",
      verse_reference: "2 Corinthians 12:9",
      content: `In our moments of weakness, God's grace shines brightest. When we feel inadequate, His strength fills the gap. This is not a reason to despair but to rejoice!

Paul understood this truth deeply. His thorn in the flesh became a source of strength because it kept him dependent on God's grace. What seems like a limitation becomes a gateway to experiencing God's unlimited power.

Today, embrace your weaknesses as opportunities for God to show His strength through you.`,
      prayer: "Father, thank You for Your grace that covers all my weaknesses. Help me to boast in my weaknesses so that Your power may rest upon me.",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],

  // COMPREHENSIVE VIDEO SERMONS DATA
  videoSermons: [
    {
      id: 1,
      title: "The Power of Prayer",
      speaker: "Pastor David Miller",
      youtube_id: "dQw4w9WgXcQ",
      description: "Discover the transformative power of prayer in your daily life. Learn how to develop a deeper prayer life, overcome prayer barriers, and see God move in miraculous ways through persistent prayer.",
      duration: "45:30",
      category: "Prayer",
      sermon_date: "2024-06-15",
      thumbnail_url: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      is_featured: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      title: "Building Strong Relationships",
      speaker: "Pastor Sarah Johnson",
      youtube_id: "jNQXAC9IVRw",
      description: "Biblical principles for building lasting, meaningful relationships in marriage, family, and friendship. Learn how to love unconditionally, resolve conflicts biblically, and create deep connections.",
      duration: "38:15",
      category: "Relationships",
      sermon_date: "2024-06-08",
      thumbnail_url: "https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg",
      is_featured: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 3,
      title: "Financial Stewardship",
      speaker: "Pastor Michael Chen",
      youtube_id: "9bZkp7q19f0",
      description: "God's principles for managing money, giving generously, and building financial security with Kingdom values. Learn to be a faithful steward of God's resources.",
      duration: "42:20",
      category: "Stewardship",
      sermon_date: "2024-06-01",
      thumbnail_url: "https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg",
      is_featured: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 4,
      title: "Finding Purpose in God's Plan",
      speaker: "Pastor David Miller",
      youtube_id: "8leAAwMIigI",
      description: "Understanding God's unique purpose for your life. Discover your calling, embrace your gifts, and step boldly into the destiny God has prepared for you.",
      duration: "39:45",
      category: "Purpose",
      sermon_date: "2024-05-25",
      thumbnail_url: "https://img.youtube.com/vi/8leAAwMIigI/maxresdefault.jpg",
      is_featured: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 5,
      title: "The Heart of Worship",
      speaker: "Pastor Lisa Williams",
      youtube_id: "kJQP7kiw5Fk",
      description: "True worship goes beyond singing songs. Learn what it means to live a life of worship, honor God with your whole heart, and experience His presence daily.",
      duration: "44:10",
      category: "Worship",
      sermon_date: "2024-05-18",
      thumbnail_url: "https://img.youtube.com/vi/kJQP7kiw5Fk/maxresdefault.jpg",
      is_featured: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 6,
      title: "Overcoming Fear with Faith",
      speaker: "Pastor Sarah Johnson",
      youtube_id: "L_jWHffIx5E",
      description: "Fear doesn't have to control your life. Learn biblical strategies to overcome anxiety, worry, and fear by standing firm in God's promises and truth.",
      duration: "37:55",
      category: "Faith",
      sermon_date: "2024-05-11",
      thumbnail_url: "https://img.youtube.com/vi/L_jWHffIx5E/maxresdefault.jpg",
      is_featured: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 7,
      title: "The Gospel of Grace",
      speaker: "Pastor Michael Chen",
      youtube_id: "fJ9rUzIMcZQ",
      description: "Understanding the full meaning of God's grace. Explore how grace saves us, transforms us, and empowers us to live victoriously in Christ Jesus.",
      duration: "41:30",
      category: "Gospel",
      sermon_date: "2024-05-04",
      thumbnail_url: "https://img.youtube.com/vi/fJ9rUzIMcZQ/maxresdefault.jpg",
      is_featured: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 8,
      title: "Leadership in the Kingdom",
      speaker: "Pastor David Miller",
      youtube_id: "GtL1huin9xA",
      description: "Biblical principles of servant leadership. Learn how to lead like Jesus, influence others positively, and make a lasting impact in your community.",
      duration: "46:25",
      category: "Leadership",
      sermon_date: "2024-04-27",
      thumbnail_url: "https://img.youtube.com/vi/GtL1huin9xA/maxresdefault.jpg",
      is_featured: false,
      created_at: new Date().toISOString(),
    },
  ],

  // COMPREHENSIVE AUDIO SERMONS DATA
  audioSermons: [
    {
      id: 1,
      title: "Living by Faith",
      speaker: "Pastor Sarah Johnson",
      audio_url: "https://download.samplelib.com/mp3/sample-15s.mp3",
      cloudinary_public_id: "beacon_audio_living_by_faith",
      duration: "35:20",
      file_size: 25600000, // 25.6 MB
      category: "Faith",
      sermon_date: "2024-06-10",
      description: "A powerful message about trusting God in uncertain times and living out our faith daily. Learn practical steps to strengthen your faith walk.",
      is_featured: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      title: "The Heart of Worship",
      speaker: "Pastor David Miller",
      audio_url: "https://download.samplelib.com/mp3/sample-12s.mp3",
      cloudinary_public_id: "beacon_audio_heart_worship",
      duration: "28:45",
      file_size: 20800000, // 20.8 MB
      category: "Worship",
      sermon_date: "2024-06-03",
      description: "Discovering what true worship means and how to cultivate a heart of worship in everyday life. Move beyond ritual to relationship.",
      is_featured: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 3,
      title: "Walking in the Spirit",
      speaker: "Pastor Lisa Williams",
      audio_url: "https://download.samplelib.com/mp3/sample-9s.mp3",
      cloudinary_public_id: "beacon_audio_walking_spirit",
      duration: "32:15",
      file_size: 23300000, // 23.3 MB
      category: "Spiritual Growth",
      sermon_date: "2024-05-27",
      description: "Understanding the role of the Holy Spirit in our daily lives. Learn to be led by the Spirit and experience supernatural living.",
      is_featured: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 4,
      title: "God's Love Never Fails",
      speaker: "Pastor Michael Chen",
      audio_url: "https://download.samplelib.com/mp3/sample-6s.mp3",
      cloudinary_public_id: "beacon_audio_gods_love",
      duration: "29:50",
      file_size: 21600000, // 21.6 MB
      category: "Love",
      sermon_date: "2024-05-20",
      description: "Exploring the depth and breadth of God's unconditional love. Find security and identity in His unfailing love for you.",
      is_featured: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 5,
      title: "The Power of Forgiveness",
      speaker: "Pastor Sarah Johnson",
      audio_url: "https://download.samplelib.com/mp3/sample-3s.mp3",
      cloudinary_public_id: "beacon_audio_forgiveness",
      duration: "33:40",
      file_size: 24400000, // 24.4 MB
      category: "Forgiveness",
      sermon_date: "2024-05-13",
      description: "Breaking free from bitterness and resentment through biblical forgiveness. Experience healing and freedom through Christ's example.",
      is_featured: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 6,
      title: "Building Your Prayer Life",
      speaker: "Pastor David Miller",
      audio_url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
      cloudinary_public_id: "beacon_audio_prayer_life",
      duration: "31:25",
      file_size: 22700000, // 22.7 MB
      category: "Prayer",
      sermon_date: "2024-05-06",
      description: "Practical guidance for developing a consistent and powerful prayer life. Move from occasional prayers to intimate conversation with God.",
      is_featured: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 7,
      title: "Victory Over Temptation",
      speaker: "Pastor Michael Chen",
      audio_url: "https://download.samplelib.com/mp3/sample-15s.mp3",
      cloudinary_public_id: "beacon_audio_victory_temptation",
      duration: "30:15",
      file_size: 21900000, // 21.9 MB
      category: "Victory",
      sermon_date: "2024-04-29",
      description: "Biblical strategies for overcoming temptation and living in victory. Learn to resist the enemy and stand firm in Christ.",
      is_featured: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 8,
      title: "The Joy of Giving",
      speaker: "Pastor Lisa Williams",
      audio_url: "https://download.samplelib.com/mp3/sample-12s.mp3",
      cloudinary_public_id: "beacon_audio_joy_giving",
      duration: "27:30",
      file_size: 19900000, // 19.9 MB
      category: "Giving",
      sermon_date: "2024-04-22",
      description: "Discovering the blessing and joy that comes from generous giving. Learn about biblical generosity and its impact on your life.",
      is_featured: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 9,
      title: "Finding Peace in Chaos",
      speaker: "Pastor Sarah Johnson",
      audio_url: "https://download.samplelib.com/mp3/sample-9s.mp3",
      cloudinary_public_id: "beacon_audio_peace_chaos",
      duration: "34:05",
      file_size: 24700000, // 24.7 MB
      category: "Peace",
      sermon_date: "2024-04-15",
      description: "How to maintain God's peace in the midst of life's storms. Learn to trust in God's sovereignty and rest in His promises.",
      is_featured: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 10,
      title: "The Great Commission",
      speaker: "Pastor David Miller",
      audio_url: "https://download.samplelib.com/mp3/sample-6s.mp3",
      cloudinary_public_id: "beacon_audio_great_commission",
      duration: "36:45",
      file_size: 26600000, // 26.6 MB
      category: "Evangelism",
      sermon_date: "2024-04-08",
      description: "Understanding our calling to share the Gospel. Learn practical ways to be effective witnesses and make disciples in your daily life.",
      is_featured: false,
      created_at: new Date().toISOString(),
    },
  ],

  // ANNOUNCEMENTS DATA
  announcements: [
    {
      id: 1,
      title: "Special Christmas Service",
      content: "Join us for our special Christmas Eve service on December 24th at 7:00 PM. We'll have special music, candlelight service, and a powerful message about the hope of Christmas.",
      priority: "high" as const,
      start_date: new Date().toISOString().split('T')[0],
      expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      image_url: "https://via.placeholder.com/400x200/41BBAC/FFFFFF?text=Christmas+Service",
      action_url: "https://beaconcentre.org/christmas",
      action_text: "Learn More",
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      title: "New Bible Study Series",
      content: "Starting January 15th, we're beginning a new Bible study series on the Book of Romans. Classes will be held every Wednesday at 7:00 PM in the main sanctuary.",
      priority: "medium" as const,
      start_date: new Date().toISOString().split('T')[0],
      expiry_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      image_url: "https://via.placeholder.com/400x200/258180/FFFFFF?text=Bible+Study",
      action_url: "https://beaconcentre.org/bible-study",
      action_text: "Register Now",
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ],
};

class APIClient {
  private instance: AxiosInstance;
  private isOnline: boolean = true;

  constructor() {
    this.instance = axios.create({
      baseURL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
    this.setupNetworkListener();
  }

  private setupNetworkListener() {
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected ?? false;
    });
  }

  private setupInterceptors() {
    this.instance.interceptors.request.use(
      (config) => {
        if (Platform.OS) {
          config.headers['X-Device-Platform'] = Platform.OS;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        console.log('API request failed, using mock data:', error.message);
        return this.handleOfflineRequest(error.config);
      }
    );
  }

  private async handleOfflineRequest(config: any): Promise<any> {
    const endpoint = config?.url || '';
    
    console.log('Handling offline request for:', endpoint);

    // Return mock data based on endpoint
    if (endpoint.includes('/devotionals')) {
      return { 
        data: { 
          success: true, 
          data: ENHANCED_MOCK_DATA.devotionals 
        } 
      };
    }
    
    if (endpoint.includes('/video-sermons')) {
      return { 
        data: { 
          success: true, 
          data: ENHANCED_MOCK_DATA.videoSermons 
        } 
      };
    }
    
    if (endpoint.includes('/audio-sermons')) {
      return { 
        data: { 
          success: true, 
          data: ENHANCED_MOCK_DATA.audioSermons 
        } 
      };
    }
    
    if (endpoint.includes('/announcements')) {
      return { 
        data: { 
          success: true, 
          data: ENHANCED_MOCK_DATA.announcements 
        } 
      };
    }

    // Default fallback
    return { 
      data: { 
        success: true, 
        data: [] 
      } 
    };
  }

  async get<T>(endpoint: string): Promise<T> {
    try {
      console.log('Making API request to:', endpoint);
      const response = await this.instance.get(endpoint);
      
      if (response.data && response.data.success !== false) {
        const data = response.data.data || response.data;
        console.log('API response received:', data?.length || 'N/A', 'items');
        return data;
      }
      
      throw new Error('API response indicates failure');
    } catch (error) {
      console.log('API Error, falling back to mock data for:', endpoint);
      
      // ALWAYS return valid data, never undefined
      if (endpoint.includes('/devotionals')) {
        return ENHANCED_MOCK_DATA.devotionals as T;
      }
      if (endpoint.includes('/video-sermons')) {
        return ENHANCED_MOCK_DATA.videoSermons as T;
      }
      if (endpoint.includes('/audio-sermons')) {
        return ENHANCED_MOCK_DATA.audioSermons as T;
      }
      if (endpoint.includes('/announcements')) {
        return ENHANCED_MOCK_DATA.announcements as T;
      }
      
      // Always return an array as fallback
      return [] as T;
    }
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await this.instance.post(endpoint, data);
      return response.data.data || response.data;
    } catch (error) {
      console.log('POST request failed:', error);
      // Return mock success response
      return { success: true } as T;
    }
  }
}

export const apiClient = new APIClient();

// Export individual API functions with guaranteed returns
export const devotionalApi = {
  getAll: async (): Promise<Devotional[]> => {
    try {
      const result = await apiClient.get<Devotional[]>('/devotionals');
      return Array.isArray(result) ? result : ENHANCED_MOCK_DATA.devotionals;
    } catch (error) {
      return ENHANCED_MOCK_DATA.devotionals;
    }
  },
  
  getToday: async (): Promise<Devotional | null> => {
    try {
      const result = await apiClient.get<Devotional>('/devotionals/today');
      return result || ENHANCED_MOCK_DATA.devotionals[0];
    } catch (error) {
      return ENHANCED_MOCK_DATA.devotionals[0];
    }
  },
  
  getById: async (id: number): Promise<Devotional | null> => {
    try {
      const result = await apiClient.get<Devotional>(`/devotionals/${id}`);
      return result || ENHANCED_MOCK_DATA.devotionals.find(d => d.id === id) || null;
    } catch (error) {
      return ENHANCED_MOCK_DATA.devotionals.find(d => d.id === id) || null;
    }
  },
};

export const sermonApi = {
  getVideoSermons: async (): Promise<VideoSermon[]> => {
    try {
      const result = await apiClient.get<VideoSermon[]>('/video-sermons');
      return Array.isArray(result) ? result : ENHANCED_MOCK_DATA.videoSermons;
    } catch (error) {
      return ENHANCED_MOCK_DATA.videoSermons;
    }
  },
  
  getAudioSermons: async (): Promise<AudioSermon[]> => {
    try {
      const result = await apiClient.get<AudioSermon[]>('/audio-sermons');
      return Array.isArray(result) ? result : ENHANCED_MOCK_DATA.audioSermons;
    } catch (error) {
      return ENHANCED_MOCK_DATA.audioSermons;
    }
  },

  getFeaturedVideos: async (): Promise<VideoSermon[]> => {
    try {
      const allVideos = await apiClient.get<VideoSermon[]>('/video-sermons/featured');
      return Array.isArray(allVideos) ? allVideos.filter(v => v.is_featured) : ENHANCED_MOCK_DATA.videoSermons.filter(v => v.is_featured);
    } catch (error) {
      return ENHANCED_MOCK_DATA.videoSermons.filter(v => v.is_featured);
    }
  },

  getFeaturedAudio: async (): Promise<AudioSermon[]> => {
    try {
      const allAudio = await apiClient.get<AudioSermon[]>('/audio-sermons/featured');
      return Array.isArray(allAudio) ? allAudio.filter(a => a.is_featured) : ENHANCED_MOCK_DATA.audioSermons.filter(a => a.is_featured);
    } catch (error) {
      return ENHANCED_MOCK_DATA.audioSermons.filter(a => a.is_featured);
    }
  },
};

export const announcementApi = {
  getAll: async (): Promise<Announcement[]> => {
    try {
      const result = await apiClient.get<Announcement[]>('/announcements');
      return Array.isArray(result) ? result : ENHANCED_MOCK_DATA.announcements;
    } catch (error) {
      return ENHANCED_MOCK_DATA.announcements;
    }
  },

  getActive: async (): Promise<Announcement[]> => {
    try {
      const result = await apiClient.get<Announcement[]>('/announcements/active');
      if (Array.isArray(result)) {
        return result.filter(a => a.is_active);
      }
      return ENHANCED_MOCK_DATA.announcements.filter(a => a.is_active);
    } catch (error) {
      return ENHANCED_MOCK_DATA.announcements.filter(a => a.is_active);
    }
  },
};

export const analyticsApi = {
  track: async (data: any): Promise<void> => {
    try {
      await apiClient.post('/analytics/track', data);
    } catch (error) {
      console.log('Analytics tracking failed (non-critical):', error);
    }
  },
};