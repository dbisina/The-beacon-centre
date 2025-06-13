import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@beaconcentre.org' },
    update: {},
    create: {
      email: 'admin@beaconcentre.org',
      passwordHash: hashedPassword,
      name: 'Admin User',
      role: 'admin',
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create categories
  const categories = [
    { name: 'Worship', description: 'Worship and praise focused content', color: '#41BBAC' },
    { name: 'Teaching', description: 'Biblical teaching and instruction', color: '#1CB4EE' },
    { name: 'Prayer', description: 'Prayer and intercession content', color: '#F2B059' },
    { name: 'Youth', description: 'Content for young people', color: '#CB3CA0' },
    { name: 'Family', description: 'Family-oriented messages', color: '#258180' },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }

  console.log('✅ Categories created');

  // Create sample devotional
  const today = new Date();
  await prisma.devotional.upsert({
    where: { date: today },
    update: {},
    create: {
      date: today,
      title: 'Walking in Faith',
      verseText: 'Now faith is confidence in what we hope for and assurance about what we do not see.',
      verseReference: 'Hebrews 11:1',
      content: 'Faith is not about having all the answers or seeing the complete picture. It is about trusting in God\'s goodness and His plan for our lives, even when we cannot see the way forward. Today, let us choose to walk by faith and not by sight, knowing that God is faithful to guide our steps.',
      prayer: 'Lord, help us to trust in You completely. Strengthen our faith and help us to walk confidently in Your ways. Amen.',
    },
  });

  console.log('✅ Sample devotional created');

  // Create sample announcement
  await prisma.announcement.create({
    data: {
      title: 'Welcome to The Beacon Centre App!',
      content: 'We are excited to launch our new mobile app where you can access daily devotionals, listen to sermons, and stay connected with our community. Download now and start your spiritual journey with us!',
      priority: 'HIGH',
      startDate: new Date(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isActive: true,
    },
  });

  console.log('✅ Sample announcement created');

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });