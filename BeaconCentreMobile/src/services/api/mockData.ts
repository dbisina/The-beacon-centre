// src/data/mockData.ts - COMPLETE MOCK DATA FOR THE BEACON CENTRE
import { Devotional, VideoSermon, AudioSermon, Announcement, Category } from '@/types/api';

// DEVOTIONALS MOCK DATA
export const mockDevotionals: Devotional[] = [
  {
    id: 1,
    date: new Date().toISOString().split('T')[0], // Today
    title: "Walking in Divine Purpose",
    verse_text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, to give you hope and a future.",
    verse_reference: "Jeremiah 29:11",
    content: `God has a unique plan for each of our lives. Sometimes we may feel lost or uncertain about our direction, but we can rest assured that our Heavenly Father knows exactly where He is leading us.

His plans are not to harm us but to prosper us. When we face challenges and difficulties, remember that these are often stepping stones to the greater purpose God has in store for us.

Today, take time to seek God's will for your life. Trust in His timing and His ways, even when they don't make sense to our human understanding. He is preparing you for something beautiful.

Walk boldly in the confidence that you are exactly where God wants you to be in this moment. Your current season is preparing you for your next level of blessing and responsibility.`,
    prayer: "Dear Lord, help me to trust in Your perfect plan for my life. Give me patience to wait on Your timing and wisdom to understand Your ways. May I walk confidently in the purpose You have designed specifically for me. In Jesus' name, Amen.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
    title: "The Power of Persistent Prayer",
    verse_text: "Pray without ceasing. In everything give thanks; for this is the will of God in Christ Jesus for you.",
    verse_reference: "1 Thessalonians 5:17-18",
    content: `Prayer is not just a religious duty; it's our direct line of communication with our Creator. When we pray without ceasing, we maintain a constant awareness of God's presence in our lives.

Persistent prayer changes us more than it changes our circumstances. As we spend time in God's presence, our hearts align with His will, and we begin to see situations from His perspective.

Don't be discouraged if answers don't come immediately. God's timing is perfect, and sometimes the waiting period is part of His plan to prepare us for what He wants to give us.

Make prayer a lifestyle, not just an emergency hotline. Talk to God throughout your day - in your car, at work, during your quiet moments. He is always listening and always ready to respond.`,
    prayer: "Father, teach me to pray without ceasing. Help me to make prayer a natural part of my daily rhythm. Strengthen my faith when answers seem delayed, and help me to trust in Your perfect timing. Thank You for always being available to hear from me. Amen.",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 3,
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0], // 2 days ago
    title: "Forgiveness: The Key to Freedom",
    verse_text: "Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you.",
    verse_reference: "Ephesians 4:32",
    content: `Forgiveness is one of the most powerful forces in the universe. When we choose to forgive, we don't just free the person who hurt us - we free ourselves from the prison of bitterness and resentment.

Christ's example of forgiveness sets the standard for how we should treat others. He forgave those who crucified Him, showing us that no offense is too great for forgiveness.

Forgiveness doesn't mean forgetting or excusing harmful behavior. It means choosing to release the right to revenge and trusting God to handle justice in His way and time.

Today, ask God to reveal any areas of unforgiveness in your heart. Choose to release those who have hurt you, and experience the freedom that comes with letting go.`,
    prayer: "Lord Jesus, thank You for forgiving me completely. Help me to extend that same forgiveness to others, even when it's difficult. Show me any areas of unforgiveness in my heart and give me the strength to let go. Fill my heart with Your love and compassion. Amen.",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 4,
    date: new Date(Date.now() - 259200000).toISOString().split('T')[0], // 3 days ago
    title: "Faith in the Storm",
    verse_text: "We live by faith, not by sight.",
    verse_reference: "2 Corinthians 5:7",
    content: `Life will inevitably bring storms - times of uncertainty, fear, and challenge. But these storms are not meant to destroy us; they're meant to strengthen our faith and reveal God's faithfulness.

When we can't see the way forward, faith becomes our compass. It's not about having all the answers; it's about trusting the One who does.

Faith doesn't eliminate the storm, but it gives us peace in the midst of it. When we anchor our trust in God's character rather than our circumstances, we can have supernatural peace even in chaos.

Remember, every storm you've weathered has made you stronger. God has been faithful before, and He will be faithful again. Trust Him today, even when you can't see tomorrow.`,
    prayer: "Heavenly Father, when the storms of life rage around me, help me to keep my eyes fixed on You. Strengthen my faith when I can't see the way forward. Remind me of Your past faithfulness and help me to trust You with my future. Be my anchor in every storm. Amen.",
    created_at: new Date(Date.now() - 259200000).toISOString(),
    updated_at: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: 5,
    date: new Date(Date.now() - 345600000).toISOString().split('T')[0], // 4 days ago
    title: "The Joy of Giving",
    verse_text: "It is more blessed to give than to receive.",
    verse_reference: "Acts 20:35",
    content: `True joy is found not in what we can get, but in what we can give. When we adopt a lifestyle of generosity, we reflect the heart of our generous God who gave His only Son for us.

Giving doesn't always have to be monetary. We can give our time, our talents, our encouragement, our presence, and our prayers. Every act of giving, no matter how small, makes a difference.

When we give with a cheerful heart, we experience a joy that money can't buy. We become partners with God in blessing others and advancing His kingdom on earth.

Look for opportunities today to be a blessing to someone else. You'll be amazed at how much joy comes back to you when you focus on giving rather than receiving.`,
    prayer: "Lord, thank You for Your incredible generosity toward me. Help me to have a generous heart like Yours. Show me opportunities to bless others today, and give me joy in giving. Use me as a vessel of Your love and provision to those around me. Amen.",
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

// AUDIO SERMONS MOCK DATA
export const mockAudioSermons: AudioSermon[] = [
  {
    id: 1,
    title: "Breaking Through Barriers",
    speaker: "Pastor John Wesley",
    audio_url: "https://pixabay.com/music/beats-eona-emotional-ambient-pop-351436",
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
    audio_url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
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
    audio_url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
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
    audio_url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
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
    audio_url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
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

Register now at our website or contact the church office. Don't miss this life-changing experience!`,
    priority: "high",
    start_date: "2024-06-01",
    expiry_date: "2024-07-17",
    image_url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop",
    cloudinary_public_id: "beacon-announcements/annual-conference-2024",
    action_url: "https://thebeaconcentre.org/conference2024",
    action_text: "Register Now",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: "Youth Camp Registration Open",
    content: `Calling all youth ages 13-18! Our summer youth camp is back with more adventure, fun, and spiritual growth than ever before.

Camp Highlights:
🏕️ 5 Days of Adventure & Fun
⛰️ Outdoor Activities & Sports
🎵 Worship & Music Sessions
📖 Bible Study & Life Skills
🍕 Great Food & Fellowship

Dates: August 10-14, 2024
Location: Camp Shiloh, Jos
Cost: ₦25,000 per person
Early Bird Special: Register before July 1st and save ₦5,000!

Contact Pastor Youth Department for more information and registration forms.`,
    priority: "medium",
    start_date: "2024-05-15",
    expiry_date: "2024-08-10",
    image_url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=600&fit=crop",
    cloudinary_public_id: "beacon-announcements/youth-camp-2024",
    action_url: "https://thebeaconcentre.org/youthcamp",
    action_text: "Learn More",
    is_active: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 3,
    title: "New Members Class",
    content: `Are you new to The Beacon Centre? Join our New Members Class to learn more about our church family, vision, and how you can get involved.

What You'll Learn:
✓ Our church history and vision
✓ Core beliefs and values
✓ Ministry opportunities
✓ How to get connected
✓ Membership benefits and responsibilities

Class Schedule:
📅 Every Sunday for 4 weeks
🕘 2:00 PM - 3:30 PM
📍 Conference Room B
☕ Light refreshments provided

Next class starts: June 30, 2024
Registration required - speak to any usher or contact the church office.`,
    priority: "low",
    start_date: "2024-06-15",
    expiry_date: "2024-06-29",
    image_url: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=600&fit=crop",
    cloudinary_public_id: "beacon-announcements/new-members-class",
    action_url: null,
    action_text: null,
    is_active: true,
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 4,
    title: "Prayer Warriors Needed",
    content: `Join our dedicated team of prayer warriors! We're looking for committed believers to intercede for our church, community, and nation.

Prayer Team Commitment:
🙏 1 hour weekly prayer commitment
📱 WhatsApp prayer group participation
📧 Weekly prayer requests updates
⛪ Monthly prayer team gathering
🌍 Special prayer assignments

Benefits:
- Deeper relationship with God
- Training in effective intercession
- Fellowship with like-minded believers
- Making eternal impact through prayer

If you feel called to join this vital ministry, contact Pastor Ruth or sign up at the information desk.`,
    priority: "medium",
    start_date: "2024-06-10",
    expiry_date: "2024-07-31",
    image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop",
    cloudinary_public_id: "beacon-announcements/prayer-warriors",
    action_url: "mailto:prayer@thebeaconcentre.org",
    action_text: "Contact Us",
    is_active: true,
    created_at: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: 5,
    title: "Community Outreach Program",
    content: `Be the hands and feet of Jesus in our community! Join our monthly outreach program to serve those in need.

This Month's Outreach:
📍 Location: Utako Market Area
📅 Date: Last Saturday of every month
🕘 Time: 9:00 AM - 2:00 PM

Activities:
- Free medical checkups
- Food distribution
- Children's activities
- Prayer and counseling
- Community clean-up

What to Bring:
- Willing heart to serve
- Comfortable clothes
- Water bottle
- Any skills you'd like to share

Transportation provided from church. Meet at the main entrance at 8:30 AM.`,
    priority: "low",
    start_date: "2024-06-01",
    expiry_date: "2024-12-31",
    image_url: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=600&fit=crop",
    cloudinary_public_id: "beacon-announcements/community-outreach",
    action_url: null,
    action_text: null,
    is_active: true,
    created_at: new Date(Date.now() - 345600000).toISOString(),
  }
];

// CATEGORIES MOCK DATA
export const mockCategories: Category[] = [
  {
    id: 1,
    name: "Faith",
    description: "Messages about building and strengthening your faith in God",
    color: "#3B82F6", // Blue
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Prayer",
    description: "Teaching on the power and practice of prayer",
    color: "#8B5CF6", // Purple
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: "Worship",
    description: "Understanding true worship and living a worshipful life",
    color: "#F59E0B", // Amber
    created_at: new Date().toISOString(),
  },
  {
    id: 4,
    name: "Love",
    description: "God's love for us and our love for others",
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
    const expiryDate = announcement.expiry_date ? new Date(announcement.expiry_date) : null;
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
};

export default mockData;