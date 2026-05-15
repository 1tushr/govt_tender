import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected for seeding');

    // Import models
    const User = (await import('./models/User.js')).default;
    const Tender = (await import('./models/Tender.js')).default;

    // Clear existing data (optional - comment out in production)
    // await User.deleteMany({});
    // await Tender.deleteMany({});
    // console.log('🗑️  Cleared existing data');

    // Create sample admin user
    const adminExists = await User.findOne({ email: 'admin@govtenderscout.in' });
    if (!adminExists) {
      const admin = new User({
        fullName: 'Admin User',
        email: 'admin@govtenderscout.in',
        mobile: '9876543210',
        companyName: 'GovTender Scout',
        password: 'admin123',
        role: 'admin',
        verified: true,
      });
      await admin.save();
      console.log('✅ Created admin user (email: admin@govtenderscout.in, password: admin123)');
    }

    // Create sample test user
    const userExists = await User.findOne({ email: 'test@example.com' });
    if (!userExists) {
      const testUser = new User({
        fullName: 'Test User',
        email: 'test@example.com',
        mobile: '9123456789',
        companyName: 'Test Company Pvt Ltd',
        password: 'test1234',
        profile: {
          keywords: ['construction', 'IT services', 'consulting'],
          categories: ['Services', 'Works'],
          states: ['Delhi', 'Maharashtra', 'Karnataka'],
          organizationType: 'Private Ltd',
        },
        preferences: {
          emailNotifications: true,
          whatsappNotifications: false,
          notificationFrequency: 'daily',
        },
        verified: true,
      });
      await testUser.save();
      console.log('✅ Created test user (email: test@example.com, password: test1234)');
    }

    // Create sample tenders
    const sampleTenders = [
      {
        title: 'Supply of Computers and Peripherals for Government Office',
        tenderNumber: 'GEM-2024-001',
        organization: 'Ministry of Electronics and IT',
        department: 'MeitY',
        category: 'Goods',
        description: 'Supply and installation of 500 desktop computers with peripherals for various government offices in Delhi NCR.',
        eligibilityCriteria: 'Manufacturer/Authorized Dealer with minimum 3 years experience. Turnover of Rs. 5 Crores in last 3 years.',
        budget: { value: 2500000, currency: 'INR' },
        emdAmount: { value: 50000, currency: 'INR' },
        location: { state: 'Delhi', city: 'New Delhi', addresses: ['Block A, CGO Complex'] },
        dates: {
          publishDate: new Date(),
          startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          openingDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000),
        },
        source: { portal: 'GeM', url: 'https://gem.gov.in/tender/001' },
        status: 'active',
        tags: ['computers', 'IT hardware', 'Delhi'],
      },
      {
        title: 'Construction of Primary Health Center Building',
        tenderNumber: 'CPPP-2024-002',
        organization: 'State Health Department',
        department: 'Health & Family Welfare',
        category: 'Works',
        description: 'Construction of G+1 Primary Health Center building with all civil, electrical, and plumbing works.',
        eligibilityCriteria: 'Class-A Contractor registered with CPWD/PWD. Minimum 5 similar works completed. Turnover of Rs. 10 Crores.',
        budget: { value: 15000000, currency: 'INR' },
        emdAmount: { value: 300000, currency: 'INR' },
        location: { state: 'Maharashtra', city: 'Pune', addresses: ['Village XYZ, Pune District'] },
        dates: {
          publishDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          startDate: new Date(),
          endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
          openingDate: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000),
          preBidMeetingDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        },
        source: { portal: 'CPPP', url: 'https://eprocure.gov.in/tender/002' },
        status: 'active',
        tags: ['construction', 'building', 'healthcare', 'Maharashtra'],
      },
      {
        title: 'Annual Maintenance Contract for IT Infrastructure',
        tenderNumber: 'KARN-2024-003',
        organization: 'Karnataka State Electricity Board',
        department: 'KSEB',
        category: 'Services',
        description: 'Comprehensive annual maintenance contract for servers, networking equipment, and software systems.',
        eligibilityCriteria: 'ISO 9001 certified company. Minimum 3 years AMC experience. Support team in Karnataka.',
        budget: { value: 8000000, currency: 'INR' },
        emdAmount: { value: 160000, currency: 'INR' },
        location: { state: 'Karnataka', city: 'Bangalore', addresses: ['KSEB Tower, Bangalore'] },
        dates: {
          publishDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
          openingDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
        },
        source: { portal: 'Karnataka', url: 'https://eproc.karnataka.gov.in/tender/003' },
        status: 'active',
        tags: ['AMC', 'IT services', 'maintenance', 'Karnataka'],
      },
      {
        title: 'Urgent: Supply of Medical Equipment for District Hospital',
        tenderNumber: 'TAMIL-2024-004',
        organization: 'Tamil Nadu Health Systems Project',
        department: 'Health Department',
        category: 'Goods',
        description: 'Emergency procurement of ventilators, patient monitors, and ICU equipment for district hospital upgrade.',
        eligibilityCriteria: 'Manufacturer or authorized distributor. CDSCO approval mandatory. Installation and training included.',
        budget: { value: 12000000, currency: 'INR' },
        emdAmount: { value: 240000, currency: 'INR' },
        location: { state: 'TamilNadu', city: 'Chennai', addresses: ['Government General Hospital'] },
        dates: {
          publishDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          startDate: new Date(),
          endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          openingDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        },
        source: { portal: 'TamilNadu', url: 'https://tntenders.gov.in/tender/004' },
        status: 'active',
        tags: ['medical', 'healthcare', 'urgent', 'Tamil Nadu'],
      },
      {
        title: 'Web Portal Development for E-Governance',
        tenderNumber: 'RAJ-2024-005',
        organization: 'Rajasthan State Portal',
        department: 'IT Department',
        category: 'Services',
        subCategory: 'Software Development',
        description: 'Design, development, and deployment of citizen-centric e-governance portal with mobile app integration.',
        eligibilityCriteria: 'CMMI Level 3 or ISO 27001 certified. Minimum 5 e-governance projects. Team size 20+. 3 years support.',
        budget: { value: 6500000, currency: 'INR' },
        emdAmount: { value: 130000, currency: 'INR' },
        location: { state: 'Rajasthan', city: 'Jaipur', addresses: ['IT Park, Jaipur'] },
        dates: {
          publishDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
          openingDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
          preBidMeetingDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        },
        source: { portal: 'Rajasthan', url: 'https://eproc.rajasthan.gov.in/tender/005' },
        status: 'active',
        tags: ['software', 'web development', 'e-governance', 'Rajasthan'],
      },
    ];

    let createdCount = 0;
    for (const tenderData of sampleTenders) {
      const exists = await Tender.findOne({ tenderNumber: tenderData.tenderNumber });
      if (!exists) {
        const tender = new Tender(tenderData);
        await tender.save();
        createdCount++;
        console.log(`✅ Created tender: ${tenderData.title}`);
      } else {
        console.log(`⏭️  Skipped existing tender: ${tenderData.tenderNumber}`);
      }
    }

    console.log(`\n🎉 Database seeding completed!`);
    console.log(`   - ${createdCount} new tenders created`);
    console.log(`   - Admin user: admin@govtenderscout.in / admin123`);
    console.log(`   - Test user: test@example.com / test1234`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
