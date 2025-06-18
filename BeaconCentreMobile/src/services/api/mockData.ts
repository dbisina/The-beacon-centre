// src/services/api/mockData.ts - FIXED WITH WORKING AUDIO URLs
import { Devotional, VideoSermon, AudioSermon, Announcement, Category } from '@/types/api';

// DEVOTIONALS MOCK DATA
export const mockDevotionals: Devotional[] = [
  {
    id: 1,
    date: "2024-06-18",
    title: "Walking in Divine Purpose",
    verse_text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.",
    verse_reference: "Jeremiah 29:11",
    content: "God has a specific plan and purpose for your life. Today, remember that every step you take is guided by His loving hand. Trust in His timing and His ways, even when the path seems unclear. Your purpose is not just about what you do, but about who you become in the process of following Him.\n\nWhen we align our hearts with God's will, we discover that His plans far exceed our own limited vision. He sees the bigger picture and knows exactly what we need to flourish. Take time today to seek His direction through prayer and His Word.",
    prayer: "Heavenly Father, help me to trust in Your perfect plan for my life. Guide my steps and help me to walk in the purpose You have designed for me. Give me patience when I cannot see the way forward, and faith to believe that You are working all things together for my good. Amen.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    date: "2024-06-17",
    title: "The Power of Gratitude",
    verse_text: "Give thanks in all circumstances; for this is God's will for you in Christ Jesus.",
    verse_reference: "1 Thessalonians 5:18",
    content: "Gratitude transforms our perspective and opens our hearts to God's blessings. Even in difficult times, we can find reasons to thank God. Gratitude is not about denying our struggles, but about recognizing God's presence and faithfulness in the midst of them.\n\nWhen we cultivate a heart of thanksgiving, we shift our focus from what we lack to what we have been given. This simple practice can revolutionize our daily experience and deepen our relationship with God.",
    prayer: "Lord, help me to develop a grateful heart. Open my eyes to see Your blessings in every day, and give me the wisdom to thank You in all circumstances. Let gratitude be my natural response to Your goodness. Amen.",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 3,
    date: "2024-06-16",
    title: "Overcoming Fear with Faith",
    verse_text: "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",
    verse_reference: "Joshua 1:9",
    content: "Fear is one of the greatest obstacles to living the abundant life God has planned for us. But God has not given us a spirit of fear, but of power, love, and sound mind. Today, choose faith over fear.\n\nWhen fear whispers 'what if,' faith responds with 'even if.' Even if circumstances seem overwhelming, God is still in control. Even if the future seems uncertain, God holds tomorrow in His hands.",
    prayer: "Father, when fear tries to grip my heart, remind me of Your promises. Help me to be strong and courageous, knowing that You are always with me. Replace my anxiety with Your peace and my doubt with unwavering faith. Amen.",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 4,
    date: "2024-06-15",
    title: "The Gift of New Beginnings",
    verse_text: "Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!",
    verse_reference: "2 Corinthians 5:17",
    content: "Every day with God is an opportunity for a fresh start. No matter what happened yesterday, today offers new possibilities. God's mercies are new every morning, and His grace is sufficient for every challenge we face.\n\nDon't let past mistakes define your future. In Christ, you are a new creation with unlimited potential to grow, change, and impact the world around you.",
    prayer: "Thank You, Lord, for the gift of new beginnings. Help me to release the past and embrace the future You have prepared for me. Make me new from the inside out, and use me to bring hope to others. Amen.",
    created_at: new Date(Date.now() - 259200000).toISOString(),
    updated_at: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: 5,
    date: "2024-06-14",
    title: "Finding Peace in God's Presence",
    verse_text: "Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.",
    verse_reference: "John 14:27",
    content: "In a world filled with chaos and uncertainty, God offers us a peace that surpasses all understanding. This peace is not dependent on our circumstances, but on our relationship with Him.\n\nWhen we rest in God's presence, we find the calm our souls crave. His peace guards our hearts and minds, protecting us from the storms of life.",
    prayer: "Prince of Peace, fill my heart with Your perfect peace. When the world around me feels chaotic, help me to find my rest in You. Let Your peace rule in my heart and flow through me to others. Amen.",
    created_at: new Date(Date.now() - 345600000).toISOString(),
    updated_at: new Date(Date.now() - 345600000).toISOString(),
  }
];

// VIDEO SERMONS MOCK DATA
export const mockVideoSermons: VideoSermon[] = [
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
    title: "Walking in Faith",
    speaker: "Pastor Sarah Johnson",
    youtube_id: "oBLn-TGaS5s",
    description: "Faith is not just believing in God's existence, but trusting Him completely with your life. This powerful message will challenge you to step out of your comfort zone and walk in supernatural faith.",
    duration: "38:45",
    category: "Faith",
    sermon_date: "2024-06-08",
    thumbnail_url: "https://img.youtube.com/vi/oBLn-TGaS5s/maxresdefault.jpg",
    is_featured: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 3,
    title: "Love Without Limits",
    speaker: "Pastor Michael Thompson",
    youtube_id: "K4DyBUG242c",
    description: "God's love for us is beyond human comprehension. Learn how to receive this love fully and extend it to others, even in difficult relationships.",
    duration: "42:15",
    category: "Love",
    sermon_date: "2024-06-01",
    thumbnail_url: "https://img.youtube.com/vi/K4DyBUG242c/maxresdefault.jpg",
    is_featured: false,
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 4,
    title: "Purpose-Driven Living",
    speaker: "Pastor David Miller",
    youtube_id: "M7lc1UVf-VE",
    description: "Every person has a unique purpose in God's kingdom. Discover how to identify your calling and live a life that makes an eternal impact.",
    duration: "51:20",
    category: "Purpose",
    sermon_date: "2024-05-25",
    thumbnail_url: "https://img.youtube.com/vi/M7lc1UVf-VE/maxresdefault.jpg",
    is_featured: false,
    created_at: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: 5,
    title: "The Heart of Worship",
    speaker: "Pastor Sarah Johnson",
    youtube_id: "oHg5SJYRHA0",
    description: "True worship goes beyond singing songs on Sunday. Learn what it means to live a life of worship that honors God in every aspect of your daily routine.",
    duration: "36:40",
    category: "Worship",
    sermon_date: "2024-05-18",
    thumbnail_url: "https://img.youtube.com/vi/oHg5SJYRHA0/maxresdefault.jpg",
    is_featured: false,
    created_at: new Date(Date.now() - 345600000).toISOString(),
  }
];

// AUDIO SERMONS MOCK DATA - WITH WORKING AUDIO URLs
export const mockAudioSermons: AudioSermon[] = [
  {
    id: 1,
    title: "Breaking Through Barriers",
    speaker: "Pastor John Wesley",
    audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cloudinary_public_id: "beacon-sermons/audio/breaking-through-barriers",
    duration: "48:25",
    file_size: 46750000,
    category: "Victory",
    sermon_date: "2024-06-12",
    description: "Every believer faces barriers in their spiritual journey. This powerful message reveals biblical strategies for overcoming obstacles and walking in victory.",
    is_featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: "The Grace Revolution",
    speaker: "Pastor Maria Rodriguez",
    audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    cloudinary_public_id: "beacon-sermons/audio/grace-revolution",
    duration: "52:10",
    file_size: 50240000,
    category: "Grace",
    sermon_date: "2024-06-05",
    description: "Understanding God's grace is life-changing. Discover how grace empowers you to live victoriously and extend mercy to others.",
    is_featured: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 3,
    title: "Financial Stewardship",
    speaker: "Pastor David Miller",
    audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    cloudinary_public_id: "beacon-sermons/audio/financial-stewardship",
    duration: "44:30",
    file_size: 42880000,
    category: "Stewardship",
    sermon_date: "2024-05-29",
    description: "Learn biblical principles for managing your finances and becoming a faithful steward of God's resources.",
    is_featured: false,
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 4,
    title: "Building Strong Relationships",
    speaker: "Pastor Sarah Johnson",
    audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    cloudinary_public_id: "beacon-sermons/audio/building-relationships",
    duration: "41:15",
    file_size: 39720000,
    category: "Relationships",
    sermon_date: "2024-05-22",
    description: "God designed us for relationship. Discover how to build meaningful connections that honor God and bless others.",
    is_featured: false,
    created_at: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: 5,
    title: "The Power of Forgiveness",
    speaker: "Pastor Michael Thompson",
    audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    cloudinary_public_id: "beacon-sermons/audio/power-of-forgiveness",
    duration: "39:45",
    file_size: 38280000,
    category: "Forgiveness",
    sermon_date: "2024-05-15",
    description: "Forgiveness is not optional for believers. Learn how to forgive others and experience the freedom that comes with letting go.",
    is_featured: false,
    created_at: new Date(Date.now() - 345600000).toISOString(),
  }
];

// ANNOUNCEMENTS MOCK DATA
export const mockAnnouncements: Announcement[] = [
  {
    id: 1,
    title: "Annual Church Conference 2024",
    content: `Join us for our biggest event of the year! The Annual Church Conference will feature powerful speakers, worship, and fellowship. 

Event Details:
📅 Date: July 15-17, 2024
🕘 Time: 9:00 AM - 6:00 PM daily
📍 Location: The Beacon Centre Main Auditorium
🎫 Registration: Free (but required)

Special Speakers:
- Pastor John Maxwell (Leadership)
- Dr. Joyce Meyer (Faith & Victory)
- Pastor T.D. Jakes (Purpose & Destiny)

Register now at our website or contact the church office.`,
    priority: "high",
    start_date: "2024-06-01",
    expiry_date: "2024-07-20",
    image_url: "https://picsum.photos/800/600?random=1",
    cloudinary_public_id: "beacon-announcements/conference-2024",
    action_url: "https://beaconcentre.ng/conference",
    action_text: "Register Now",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: "Youth Camp Registration Open",
    content: `Calling all teenagers! Our annual Youth Camp is back with an exciting theme: "Generation Next: Rising Up for God"

What to Expect:
🎯 Life-changing workshops
🏆 Fun competitions and games  
🎵 Powerful worship sessions
🤝 New friendships
🙏 Spiritual breakthrough

Camp Details:
📅 August 5-9, 2024
📍 Camp Galilee, Jos
💰 ₦25,000 per camper
🚌 Transportation provided

Early bird discount: Register before July 1st and save ₦5,000!`,
    priority: "medium",
    start_date: "2024-06-10",
    expiry_date: "2024-08-01",
    image_url: "https://picsum.photos/800/600?random=2",
    cloudinary_public_id: "beacon-announcements/youth-camp-2024",
    action_url: "https://beaconcentre.ng/youth-camp",
    action_text: "Register",
    is_active: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 3,
    title: "New Member's Class",
    content: `Are you new to The Beacon Centre? Join our comprehensive New Member's Class to learn about our vision, values, and how you can become an integral part of our church family.

What You'll Learn:
📖 Our church history and mission
💒 Core beliefs and values
🤝 How to get involved
🎯 Available ministries and programs
❤️ How to find your place in our community

Class Schedule:
📅 Every Sunday for 4 weeks
🕐 10:00 AM - 11:00 AM
📍 Conference Room B
📝 Registration required

Light refreshments will be provided.`,
    priority: "low",
    start_date: "2024-06-15",
    expiry_date: "2024-12-31",
    image_url: "https://picsum.photos/800/600?random=3",
    cloudinary_public_id: "beacon-announcements/new-members-class",
    action_url: "https://beaconcentre.ng/new-members",
    action_text: "Learn More",
    is_active: true,
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 4,
    title: "Community Outreach Program",
    content: `Join us as we reach out to our community with God's love! This month, we're organizing a special outreach program to bless families in need.

Activities:
🥘 Free meal distribution
👕 Clothing drive
📚 Educational support for children
🏥 Free medical checkup
💇 Free haircuts and beauty services

How You Can Help:
• Volunteer your time
• Donate clothes, food, or money
• Spread the word
• Pray for the outreach

Together, we can make a difference!`,
    priority: "medium",
    start_date: "2024-06-20",
    expiry_date: "2024-07-01",
    image_url: "https://picsum.photos/800/600?random=4",
    cloudinary_public_id: "beacon-announcements/community-outreach",
    action_url: "https://beaconcentre.ng/outreach",
    action_text: "Volunteer",
    is_active: true,
    created_at: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: 5,
    title: "Marriage Enrichment Seminar",
    content: `Strengthen your marriage with biblical principles! Join us for a powerful two-day seminar designed to help couples build stronger, more fulfilling relationships.

Topics Covered:
💕 Love languages and communication
🤝 Conflict resolution God's way
💰 Financial unity in marriage
👨‍👩‍👧‍👦 Parenting as a team
🙏 Praying together as a couple

Seminar Details:
📅 July 20-21, 2024
🕘 9:00 AM - 4:00 PM both days
📍 Main Auditorium
💰 ₦10,000 per couple
🍽️ Lunch included

Register early as space is limited!`,
    priority: "medium",
    start_date: "2024-06-25",
    expiry_date: "2024-07-19",
    image_url: "https://picsum.photos/800/600?random=5",
    cloudinary_public_id: "beacon-announcements/marriage-seminar",
    action_url: "https://beaconcentre.ng/marriage-seminar",
    action_text: "Register",
    is_active: true,
    created_at: new Date(Date.now() - 345600000).toISOString(),
  }
];

// CATEGORIES MOCK DATA
export const mockCategories: Category[] = [
  {
    id: 1,
    name: "Faith",
    description: "Building and strengthening your faith in God",
    color: "#3B82F6", // Blue
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Prayer",
    description: "Developing a powerful prayer life",
    color: "#8B5CF6", // Purple
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: "Love",
    description: "Understanding and practicing God's love",
    color: "#EC4899", // Pink
    created_at: new Date().toISOString(),
  },
  {
    id: 4,
    name: "Worship",
    description: "True worship and praise to God",
    color: "#EF4444", // Red
    created_at: new Date().toISOString(),
  },
  {
    id: 5,
    name: "Purpose",
    description: "Discovering and walking in your God-given purpose",
    color: "#F97316", // Orange
    created_at: new Date().toISOString(),
  },
  {
    id: 6,
    name: "Relationships",
    description: "Building healthy relationships that honor God",
    color: "#EC4899", // Pink
    created_at: new Date().toISOString(),
  },
  {
    id: 7,
    name: "Stewardship",
    description: "Managing God's resources with wisdom and faithfulness",
    color: "#10B981", // Emerald
    created_at: new Date().toISOString(),
  },
  {
    id: 8,
    name: "Victory",
    description: "Living victoriously through Christ",
    color: "#F97316", // Orange
    created_at: new Date().toISOString(),
  },
  {
    id: 9,
    name: "Grace",
    description: "Understanding and living in God's amazing grace",
    color: "#22C55E", // Green
    created_at: new Date().toISOString(),
  },
  {
    id: 10,
    name: "Forgiveness",
    description: "The power and importance of forgiveness",
    color: "#14B8A6", // Teal
    created_at: new Date().toISOString(),
  }
];

// UTILITY FUNCTIONS FOR MOCK DATA
export const getMockDevotionalByDate = (date: string): Devotional | null => {
  return mockDevotionals.find(devotional => devotional.date === date) || null;
};

export const getTodaysMockDevotional = (): Devotional | null => {
  const today = new Date().toISOString().split('T')[0];
  return getMockDevotionalByDate(today);
};

export const getFeaturedMockContent = () => {
  return {
    videos: mockVideoSermons.filter(sermon => sermon.is_featured),
    audios: mockAudioSermons.filter(sermon => sermon.is_featured),
  };
};

export const getMockSermonsByCategory = (category: string) => {
  return {
    videos: mockVideoSermons.filter(sermon => 
      sermon.category?.toLowerCase() === category.toLowerCase()
    ),
    audios: mockAudioSermons.filter(sermon => 
      sermon.category?.toLowerCase() === category.toLowerCase()
    ),
  };
};

export const getActiveMockAnnouncements = (): Announcement[] => {
  const today = new Date().toISOString().split('T')[0];
  return mockAnnouncements.filter(announcement => {
    const startDate = new Date(announcement.start_date);
    const expiryDate = announcement.expiry_date ? 
      new Date(announcement.expiry_date) : null;
    const currentDate = new Date(today);
    
    return announcement.is_active && 
           startDate <= currentDate && 
           (!expiryDate || expiryDate >= currentDate);
  });
};

export const getMockCategoryByName = (name: string): Category | null => {
  return mockCategories.find(category => 
    category.name.toLowerCase() === name.toLowerCase()
  ) || null;
};

// **MISSING FUNCTION ADDED** - This was causing the error!
export const getMockDataByEndpoint = (endpoint: string): any => {
  console.log('🔍 Getting mock data for endpoint:', endpoint);
  
  // Remove query parameters and normalize endpoint
  const cleanEndpoint = endpoint.split('?')[0].toLowerCase();
  
  if (cleanEndpoint.includes('devotionals')) {
    if (cleanEndpoint.includes('today')) {
      return getTodaysMockDevotional();
    } else if (cleanEndpoint.includes('date/')) {
      const dateMatch = endpoint.match(/date\/(.+)/);
      if (dateMatch) {
        return getMockDevotionalByDate(dateMatch[1]);
      }
    }
    return mockDevotionals;
  }
  
  if (cleanEndpoint.includes('video-sermons')) {
    if (cleanEndpoint.includes('featured')) {
      return mockVideoSermons.filter(sermon => sermon.is_featured);
    }
    return mockVideoSermons;
  }
  
  if (cleanEndpoint.includes('audio-sermons')) {
    if (cleanEndpoint.includes('featured')) {
      return mockAudioSermons.filter(sermon => sermon.is_featured);
    }
    return mockAudioSermons;
  }
  
  if (cleanEndpoint.includes('announcements')) {
    if (cleanEndpoint.includes('active')) {
      return getActiveMockAnnouncements();
    }
    return mockAnnouncements;
  }
  
  if (cleanEndpoint.includes('categories')) {
    return mockCategories;
  }
  
  // Default fallback
  console.log('⚠️ No mock data found for endpoint:', endpoint);
  return [];
};

// COMBINED MOCK DATA EXPORT
export const mockData = {
  devotionals: mockDevotionals,
  videoSermons: mockVideoSermons,
  audioSermons: mockAudioSermons,
  announcements: mockAnnouncements,
  categories: mockCategories,
  
  // Utility functions
  getDevotionalByDate: getMockDevotionalByDate,
  getTodaysDevotional: getTodaysMockDevotional,
  getFeaturedContent: getFeaturedMockContent,
  getSermonsByCategory: getMockSermonsByCategory,
  getActiveAnnouncements: getActiveMockAnnouncements,
  getCategoryByName: getMockCategoryByName,
  getDataByEndpoint: getMockDataByEndpoint, // Added this export too
};

export default mockData;