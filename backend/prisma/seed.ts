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
    today.setHours(0, 0, 0, 0); // midnight - matches getTodaysDevotional()'s exact-match lookup
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

    // Create sample video sermons - real, public, embeddable YouTube videos
    // (TED/TEDx talks on faith and purpose) so the app has genuine playable
    // content to test against instead of placeholder/joke video IDs.
    console.log('🎬 Creating sample video sermons...');
    const videoSermons = await Promise.all([
      prisma.videoSermon.upsert({
        where: { youtubeId: 'bDldAOiZBho' },
        update: {},
        create: {
          title: 'A Life of Purpose',
          speaker: 'Rick Warren',
          youtubeId: 'bDldAOiZBho',
          description: 'A powerful message about the transformative power of faith in our daily lives.',
          duration: '20:00',
          kind: 'SERMON',
          categoryId: categories[0].id, // Sunday Service
          sermonDate: new Date('2024-01-07'),
          thumbnailUrl: 'https://img.youtube.com/vi/bDldAOiZBho/maxresdefault.jpg',
          isFeatured: true,
          isActive: true,
          tags: ['faith', 'transformation', 'inspiration'],
        },
      }),
      prisma.videoSermon.upsert({
        where: { youtubeId: 'XTxuhEipb4k' },
        update: {},
        create: {
          title: 'Practical Faith',
          speaker: 'Mike Dupre',
          youtubeId: 'XTxuhEipb4k',
          description: 'Understanding what it means to walk out our faith in everyday life.',
          duration: '14:00',
          kind: 'SERMON',
          categoryId: categories[1].id, // Bible Study
          sermonDate: new Date('2024-01-14'),
          thumbnailUrl: 'https://img.youtube.com/vi/XTxuhEipb4k/maxresdefault.jpg',
          isFeatured: false,
          isActive: true,
          tags: ['faith', 'christian living'],
        },
      }),
      prisma.videoSermon.upsert({
        where: { youtubeId: '36zrJfAFcuc' },
        update: {},
        create: {
          title: 'The Heart of Worship',
          speaker: 'His Holiness Pope Francis',
          youtubeId: '36zrJfAFcuc',
          description: 'Discovering the true heart of worship beyond the songs and rituals.',
          duration: '17:00',
          kind: 'SERMON',
          categoryId: categories[0].id, // Sunday Service
          sermonDate: new Date('2024-01-21'),
          thumbnailUrl: 'https://img.youtube.com/vi/36zrJfAFcuc/maxresdefault.jpg',
          isFeatured: true,
          isActive: true,
          tags: ['worship', 'heart', 'devotion'],
        },
      }),
      prisma.videoSermon.upsert({
        where: { youtubeId: 'fLeJJPxua3E' },
        update: {},
        create: {
          title: 'One Minute of Motivation',
          speaker: 'The Beacon Centre',
          youtubeId: 'fLeJJPxua3E',
          description: 'A quick word of encouragement to carry with you today.',
          duration: '1:00',
          kind: 'EXCERPT',
          categoryId: categories[3].id, // Youth Service
          sermonDate: new Date('2024-01-10'),
          thumbnailUrl: 'https://img.youtube.com/vi/fLeJJPxua3E/maxresdefault.jpg',
          isFeatured: false,
          isActive: true,
          tags: ['short', 'encouragement'],
        },
      }),
      prisma.videoSermon.upsert({
        where: { youtubeId: 'pKBF2AzNjA4' },
        update: {},
        create: {
          title: 'Believe In Yourself',
          speaker: 'The Beacon Centre',
          youtubeId: 'pKBF2AzNjA4',
          description: 'You were made for more than you think.',
          duration: '1:00',
          kind: 'EXCERPT',
          categoryId: categories[3].id, // Youth Service
          sermonDate: new Date('2024-01-17'),
          thumbnailUrl: 'https://img.youtube.com/vi/pKBF2AzNjA4/maxresdefault.jpg',
          isFeatured: false,
          isActive: true,
          tags: ['short', 'encouragement'],
        },
      }),
    ]);

    console.log(`✅ Created ${videoSermons.length} video sermons`);

    // Create sample audio sermons. audioUrl points at stable, publicly
    // reachable test mp3s (SoundHelix's well-known demo tracks) since there's
    // no real Cloudinary-hosted audio to seed with yet - swap for real
    // uploads once the admin panel has some.
    console.log('🎧 Creating sample audio sermons...');
    const audioSermons = await Promise.all([
      prisma.audioSermon.upsert({
        where: { id: 1 },
        update: {},
        create: {
          title: 'Stay Lit — Part 1',
          speaker: 'Pastor John Smith',
          audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
          cloudinaryPublicId: 'seed/audio-sermon-1',
          duration: '32:00',
          categoryId: categories[0].id,
          sermonDate: new Date('2024-01-07'),
          description: 'The first in our Stay Lit series on faithfulness in the ordinary.',
          isFeatured: true,
          isActive: true,
          tags: ['faithfulness'],
        },
      }),
      prisma.audioSermon.upsert({
        where: { id: 2 },
        update: {},
        create: {
          title: 'The God Who Sees',
          speaker: 'Pastor Mary Johnson',
          audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
          cloudinaryPublicId: 'seed/audio-sermon-2',
          duration: '41:00',
          categoryId: categories[2].id, // Prayer Meeting
          sermonDate: new Date('2024-01-14'),
          description: 'On being fully known and fully loved.',
          isFeatured: false,
          isActive: true,
          tags: ['prayer'],
        },
      }),
      prisma.audioSermon.upsert({
        where: { id: 3 },
        update: {},
        create: {
          title: 'Rooted — Midweek Refuel',
          speaker: 'Pastor David Wilson',
          audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
          cloudinaryPublicId: 'seed/audio-sermon-3',
          duration: '27:00',
          categoryId: categories[1].id,
          sermonDate: new Date('2024-01-17'),
          description: 'Staying rooted in the middle of the week.',
          isFeatured: false,
          isActive: true,
          tags: ['bible study'],
        },
      }),
    ]);

    console.log(`✅ Created ${audioSermons.length} audio sermons`);

    // Create Community Service Groups - the real ones, given by name only;
    // admin fills in meeting day/time/address per group via the admin panel.
    console.log('👨‍👩‍👧‍👦 Creating CSGs...');
    const CSG_NAMES = [
      'Kuola CSG',
      'Oluyole CSG',
      'Tipper Garage/Taska CSG',
      'New Garage CSG',
      'Lead City CSG',
      'Oluyole Extension CSG',
      'Sango CSG',
      'Ringroad/Challenge/Fele CSG',
      'Elebu CSG',
    ];
    const csgs = [];
    for (const name of CSG_NAMES) {
      const existing = await prisma.csg.findFirst({ where: { name } });
      csgs.push(existing ?? (await prisma.csg.create({ data: { name, isActive: true } })));
    }

    console.log(`✅ Created ${csgs.length} CSGs`);

    // Create fundraising projects
    console.log('🏗️ Creating sample projects...');
    const projects = await Promise.all([
      prisma.project.upsert({
        where: { id: 1 },
        update: {},
        create: {
          title: 'The new auditorium roof',
          blurb: 'Replacing the main roof before the rains return.',
          description: 'Our current roof has served us well for over a decade, but recent inspections show it needs full replacement before this year\'s rainy season.',
          targetAmount: BigInt(5_000_000_000), // ₦50,000,000 in kobo
          raisedAmount: BigInt(3_420_000_000), // ₦34,200,000 in kobo
          donorCount: 412,
          deadline: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000),
          isActive: true,
        },
      }),
      prisma.project.upsert({
        where: { id: 2 },
        update: {},
        create: {
          title: 'Campus outreach bus',
          blurb: 'Getting students to Sunday service and back.',
          description: 'A dedicated shuttle bus to bring university students to and from Sunday services safely and reliably.',
          targetAmount: BigInt(1_200_000_000), // ₦12,000,000 in kobo
          raisedAmount: BigInt(372_000_000), // ₦3,720,000 in kobo
          donorCount: 86,
          deadline: new Date(Date.now() + 61 * 24 * 60 * 60 * 1000),
          isActive: true,
        },
      }),
    ]);

    console.log(`✅ Created ${projects.length} projects`);

    // Create the church's bank account for manual/default giving.
    // ⚠️ Placeholder details - replace with the real account before production.
    console.log('🏦 Creating sample church bank account...');
    const bankAccount = await prisma.churchBankAccount.upsert({
      where: { id: 1 },
      update: {},
      create: {
        bankName: 'First Bank of Nigeria',
        accountName: 'The Beacon Centre',
        accountNumber: '0123456789',
        instructions: 'Please use your name as the transfer narration/reference so we can identify your gift.',
        isActive: true,
        sortOrder: 0,
      },
    });

    console.log('✅ Created church bank account');

    // Create the live service schedule
    console.log('📺 Creating live schedule...');
    const liveSchedule = await Promise.all([
      prisma.liveSchedule.upsert({
        where: { id: 1 },
        update: {},
        create: {
          name: 'Impart Service',
          dayOfWeek: 0, // Sunday
          time: '09:00',
          timezone: 'Africa/Lagos',
          isActive: true,
        },
      }),
      prisma.liveSchedule.upsert({
        where: { id: 2 },
        update: {},
        create: {
          name: 'Refuel Service',
          dayOfWeek: 3, // Wednesday
          time: '18:00',
          timezone: 'Africa/Lagos',
          isActive: true,
        },
      }),
    ]);

    console.log(`✅ Created ${liveSchedule.length} live schedule entries`);

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
    console.log(`  - Audio sermons: ${audioSermons.length}`);
    console.log(`  - CSGs: ${csgs.length}`);
    console.log(`  - Projects: ${projects.length}`);
    console.log(`  - Bank accounts: 1`);
    console.log(`  - Live schedule entries: ${liveSchedule.length}`);
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