// backend/prisma/seed.ts - FIXED VERSION

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create default categories
    console.log('📂 Creating categories...');
    const categories = await Promise.all([
      prisma.category.upsert({
        where: { name: 'Sunday Service' },
        update: {},
        create: {
          name: 'Sunday Service',
          description: 'Weekly Sunday worship services',
          color: '#007bff',
          icon: '🏛️',
          isActive: true,
        },
      }),
      prisma.category.upsert({
        where: { name: 'Bible Study' },
        update: {},
        create: {
          name: 'Bible Study',
          description: 'In-depth Bible study sessions',
          color: '#28a745',
          icon: '📖',
          isActive: true,
        },
      }),
      prisma.category.upsert({
        where: { name: 'Prayer Meeting' },
        update: {},
        create: {
          name: 'Prayer Meeting',
          description: 'Community prayer gatherings',
          color: '#ffc107',
          icon: '🙏',
          isActive: true,
        },
      }),
      prisma.category.upsert({
        where: { name: 'Youth Service' },
        update: {},
        create: {
          name: 'Youth Service',
          description: 'Services focused on young people',
          color: '#dc3545',
          icon: '👥',
          isActive: true,
        },
      }),
      prisma.category.upsert({
        where: { name: 'Special Events' },
        update: {},
        create: {
          name: 'Special Events',
          description: 'Special church events and celebrations',
          color: '#6f42c1',
          icon: '🎉',
          isActive: true,
        },
      }),
    ]);

    console.log(`✅ Created ${categories.length} categories`);

    // Create default admin user
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const admin = await prisma.admin.upsert({
      where: { email: 'admin@beaconcentre.org' },
      update: {},
      create: {
        email: 'admin@beaconcentre.org',
        name: 'System Administrator',
        passwordHash: hashedPassword,
        role: 'SUPER_ADMIN', // FIXED: Use correct enum value
        permissions: [
          'manage_devotionals',
          'manage_sermons',
          'manage_announcements',
          'manage_categories',
          'manage_admins',
          'view_analytics',
          'manage_uploads',
        ],
        isActive: true,
      },
    });

    console.log('✅ Created admin user');

    // Create sample devotionals for the current week
    console.log('📖 Creating sample devotionals...');
    const today = new Date();
    const devotionals = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const devotionalData = {
        date,
        title: `Daily Devotional - ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`,
        verseText: getSampleVerse(i).text,
        verseReference: getSampleVerse(i).reference,
        content: getSampleDevotionalContent(i),
        prayer: getSamplePrayer(i),
      };

      const devotional = await prisma.devotional.upsert({
        where: { date: devotionalData.date },
        update: {},
        create: devotionalData,
      });

      devotionals.push(devotional);
    }

    console.log(`✅ Created ${devotionals.length} devotionals`);

    // Create sample video sermons
    console.log('🎬 Creating sample video sermons...');
    const videoSermons = await Promise.all([
      prisma.videoSermon.upsert({
        where: { youtubeId: 'dQw4w9WgXcQ' },
        update: {},
        create: {
          title: 'The Power of Faith',
          speaker: 'Pastor John Smith',
          youtubeId: 'dQw4w9WgXcQ',
          description: 'A powerful message about the transformative power of faith in our daily lives.',
          duration: '45:30',
          categoryId: categories[0].id, // Sunday Service
          sermonDate: new Date('2024-01-07'),
          thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
          isFeatured: true,
          isActive: true,
          tags: ['faith', 'transformation', 'inspiration'],
        },
      }),
      prisma.videoSermon.upsert({
        where: { youtubeId: 'oHg5SJYRHA0' },
        update: {},
        create: {
          title: 'Walking in Love',
          speaker: 'Pastor Mary Johnson',
          youtubeId: 'oHg5SJYRHA0',
          description: 'Understanding what it means to walk in love as followers of Christ.',
          duration: '38:15',
          categoryId: categories[1].id, // Bible Study
          sermonDate: new Date('2024-01-14'),
          thumbnailUrl: 'https://img.youtube.com/vi/oHg5SJYRHA0/maxresdefault.jpg',
          isFeatured: false,
          isActive: true,
          tags: ['love', 'relationships', 'christian living'],
        },
      }),
      prisma.videoSermon.upsert({
        where: { youtubeId: 'L_jWHffIx5E' },
        update: {},
        create: {
          title: 'The Heart of Worship',
          speaker: 'Pastor David Wilson',
          youtubeId: 'L_jWHffIx5E',
          description: 'Discovering the true heart of worship beyond the songs and rituals.',
          duration: '42:20',
          categoryId: categories[0].id, // Sunday Service
          sermonDate: new Date('2024-01-21'),
          thumbnailUrl: 'https://img.youtube.com/vi/L_jWHffIx5E/maxresdefault.jpg',
          isFeatured: true,
          isActive: true,
          tags: ['worship', 'heart', 'devotion'],
        },
      }),
    ]);

    console.log(`✅ Created ${videoSermons.length} video sermons`);

    // Create sample announcements
    console.log('📢 Creating sample announcements...');
    const announcements = await Promise.all([
      prisma.announcement.upsert({
        where: { id: 1 },
        update: {},
        create: {
          title: 'Welcome to The Beacon Centre App!',
          content: 'We are excited to have you join our digital community. Explore daily devotionals, sermons, and stay updated with church announcements.',
          priority: 'HIGH', // FIXED: Use correct enum value
          startDate: new Date(),
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          actionText: 'Get Started',
          actionUrl: '/devotionals',
          isActive: true,
        },
      }),
      prisma.announcement.upsert({
        where: { id: 2 },
        update: {},
        create: {
          title: 'Youth Conference 2024',
          content: 'Join us for an exciting youth conference featuring inspiring speakers, worship, and fellowship. Registration is now open!',
          priority: 'MEDIUM', // FIXED: Use correct enum value
          startDate: new Date(),
          expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
          actionText: 'Register Now',
          actionUrl: 'https://beaconcentre.org/youth-conference',
          isActive: true,
        },
      }),
      prisma.announcement.upsert({
        where: { id: 3 },
        update: {},
        create: {
          title: 'New Bible Study Groups',
          content: 'We are starting new small group Bible studies. Find a group that fits your schedule and join us for deeper fellowship and learning.',
          priority: 'MEDIUM', // FIXED: Use correct enum value
          startDate: new Date(),
          expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
          actionText: 'View Groups',
          actionUrl: '/bible-study-groups',
          isActive: true,
        },
      }),
    ]);

    console.log(`✅ Created ${announcements.length} announcements`);

    console.log('🎉 Database seeding completed successfully!');
    
    // Print summary
    console.log('\n📊 Seeding Summary:');
    console.log(`  - Categories: ${categories.length}`);
    console.log(`  - Admin users: 1`);
    console.log(`  - Devotionals: ${devotionals.length}`);
    console.log(`  - Video sermons: ${videoSermons.length}`);
    console.log(`  - Announcements: ${announcements.length}`);
    
    console.log('\n🔐 Admin Login Credentials:');
    console.log('  Email: admin@beaconcentre.org');
    console.log('  Password: admin123');
    console.log('  ⚠️  Please change this password in production!');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

function getSampleVerse(index: number): { text: string; reference: string } {
  const verses = [
    {
      text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
      reference: "Proverbs 3:5-6"
    },
    {
      text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, to give you hope and a future.",
      reference: "Jeremiah 29:11"
    },
    {
      text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
      reference: "Romans 8:28"
    },
    {
      text: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",
      reference: "Joshua 1:9"
    },
    {
      text: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.",
      reference: "Isaiah 40:31"
    },
    {
      text: "The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul.",
      reference: "Psalm 23:1-3"
    },
    {
      text: "Come to me, all you who are weary and burdened, and I will give you rest. Take my yoke upon you and learn from me, for I am gentle and humble in heart, and you will find rest for your souls.",
      reference: "Matthew 11:28-29"
    }
  ];
  
  return verses[index % verses.length];
}

function getSampleDevotionalContent(index: number): string {
  const contents = [
    "In our journey of faith, we often encounter moments where our understanding falls short. Today's verse reminds us that true wisdom comes not from our own limited perspective, but from trusting in God's infinite wisdom. When we submit our ways to Him, He promises to direct our paths. This doesn't mean life will be without challenges, but rather that we can walk confidently knowing that our steps are ordered by the Lord. Take time today to surrender your plans to God and trust His guidance.",
    
    "God's plans for us are always good, even when we cannot see the full picture. In times of uncertainty or difficulty, this verse serves as an anchor for our souls. The Lord's plans are not haphazard or cruel, but filled with hope and purpose. When circumstances seem overwhelming, remember that God is working behind the scenes, weaving together a beautiful tapestry of your life. Your current situation is not your final destination. Trust in His timing and His perfect plan.",
    
    "Life has a way of throwing unexpected challenges our way, but God has a way of turning even the most difficult situations into something beautiful. This promise doesn't mean that everything that happens to us is good, but that God can work through all circumstances for our ultimate good. When facing trials, ask yourself: How might God use this situation to strengthen my faith, develop my character, or position me to help others? Trust that He is at work, even in the midst of difficulty.",
    
    "Courage is not the absence of fear, but the presence of faith in the midst of fear. God's command to be strong and courageous comes with a promise: He will be with us wherever we go. You are not facing your challenges alone. The same God who parted the Red Sea, who brought down the walls of Jericho, who raised Jesus from the dead, is with you today. Draw strength from His presence and step forward with confidence.",
    
    "When we feel exhausted and our strength is depleted, God offers us a divine exchange. Our weakness for His strength, our weariness for His energy, our limitations for His limitless power. The key is hoping in the Lord – placing our trust and expectation in Him rather than in our own abilities. As we wait on Him in prayer and worship, He renews us from the inside out. Today, come to Him with your burdens and receive His supernatural strength.",
    
    "In a world filled with anxiety and uncertainty, we can find peace in knowing that we have a loving Shepherd who cares for us. God is not a distant deity but a personal God who knows our needs and provides for them. He leads us to places of rest and refreshment, not just physically but spiritually and emotionally. When life feels chaotic, remember that you are under the care of the Good Shepherd who loves you deeply.",
    
    "Jesus extends a beautiful invitation to all who are carrying heavy burdens. His offer of rest is not just physical but encompasses every area of our lives – emotional, spiritual, and mental rest. The yoke He offers is not one of bondage but of partnership with Him. When we learn from Jesus and follow His example of gentleness and humility, we discover a lighter way of living. Today, accept His invitation and find the rest your soul desperately needs."
  ];
  
  return contents[index % contents.length];
}

function getSamplePrayer(index: number): string {
  const prayers = [
    "Heavenly Father, help me to trust You completely today. When my understanding fails and my plans seem uncertain, remind me that Your ways are higher than mine. Guide my steps and help me to submit my will to Yours. Give me the faith to follow Your leading, even when I cannot see the full path ahead. In Jesus' name, Amen.",
    
    "Lord, thank You for having good plans for my life. When I feel lost or discouraged, help me to remember that You are working all things together for my good. Give me patience to wait for Your timing and the faith to trust Your process. Help me to hope in You and Your promises, knowing that Your plans will not fail. In Jesus' name, Amen.",
    
    "God, I thank You that You can work through every situation in my life for good. Help me to see Your hand at work, even in difficult circumstances. Give me the faith to trust You when I don't understand, and the wisdom to learn from every experience. Use my trials to make me more like Jesus and to help others who face similar challenges. In Jesus' name, Amen.",
    
    "Lord Jesus, fill me with Your courage today. When fear tries to paralyze me, remind me that You are with me. Help me to be strong in Your strength and courageous in Your love. Give me the boldness to step out in faith and to trust that You will never leave me nor forsake me. Thank You for Your constant presence in my life. In Jesus' name, Amen.",
    
    "Father, I am weary and need Your strength. I place my hope in You and ask that You would renew my energy and refresh my spirit. Help me to soar above my circumstances and to run the race set before me without growing weary. Thank You for Your promise to give strength to the weak and power to the faint. In Jesus' name, Amen.",
    
    "Good Shepherd, thank You for Your loving care over my life. Lead me to Your green pastures of peace and beside Your still waters of rest. Refresh my soul and restore my hope. Help me to trust in Your provision and to rest in Your protection. Thank You for being my constant companion and guide. In Jesus' name, Amen.",
    
    "Jesus, I accept Your invitation to come to You with all my burdens. Thank You for offering me rest for my weary soul. Help me to learn from Your example of gentleness and humility. Teach me to walk in Your easy yoke and to find peace in Your presence. Give me the rest that only You can provide. In Jesus' name, Amen."
  ];
  
  return prayers[index % prayers.length];
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });