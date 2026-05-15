import cron from 'node-cron';
import axios from 'axios';
import cheerio from 'cheerio';
import Tender from '../models/Tender.js';
import User from '../models/User.js';
import winston from 'winston';

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/monitor.log' }),
  ],
});

// Portal configurations with selectors (these are examples - need to be customized per portal)
const PORTAL_CONFIGS = {
  CPPP: {
    url: 'https://eprocure.gov.in',
    name: 'Central Public Procurement Portal',
    // Note: Real implementation would need actual selectors
    active: false, // Disabled until proper selectors are configured
  },
  GeM: {
    url: 'https://gem.gov.in',
    name: 'Government e-Marketplace',
    active: false,
  },
  // Add more portals as needed
};

// Mock tender generator for demonstration (replace with real scraping)
const generateMockTender = (portal) => {
  const categories = ['Goods', 'Services', 'Works', 'Consultancy'];
  const states = ['Delhi', 'Maharashtra', 'Karnataka', 'TamilNadu', 'Rajasthan', 'Gujarat', 'UP', 'WestBengal'];
  
  return {
    title: `${categories[Math.floor(Math.random() * categories.length)]} for ${portal} Portal ${Date.now()}`,
    tenderNumber: `${portal}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    organization: `${portal} Organization ${Math.floor(Math.random() * 10)}`,
    department: 'Test Department',
    category: categories[Math.floor(Math.random() * categories.length)],
    description: `This is a sample tender description for testing purposes. The actual tender would contain detailed requirements, specifications, and terms and conditions.`,
    eligibilityCriteria: 'Eligibility criteria would be listed here including experience, turnover, certifications required.',
    budget: { value: Math.floor(Math.random() * 10000000) + 100000, currency: 'INR' },
    emdAmount: { value: Math.floor(Math.random() * 200000) + 10000, currency: 'INR' },
    location: { 
      state: states[Math.floor(Math.random() * states.length)], 
      city: 'Sample City', 
      addresses: ['Sample Address'] 
    },
    dates: {
      publishDate: new Date(),
      startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + (15 + Math.floor(Math.random() * 30)) * 24 * 60 * 60 * 1000),
      openingDate: new Date(Date.now() + (17 + Math.floor(Math.random() * 30)) * 24 * 60 * 60 * 1000),
    },
    source: { 
      portal: portal, 
      url: `${PORTAL_CONFIGS[portal]?.url || 'https://example.com'}/tender/${Date.now()}` 
    },
    status: 'active',
    tags: ['sample', 'test', portal],
  };
};

// Monitor a single portal
const monitorPortal = async (portalKey, config) => {
  try {
    logger.info(`Starting monitor for ${config.name} (${portalKey})`);
    
    if (!config.active) {
      logger.warn(`Portal ${portalKey} is not active, skipping...`);
      return [];
    }

    // In production, this would:
    // 1. Fetch the portal URL with axios or puppeteer
    // 2. Parse HTML with cheerio
    // 3. Extract tender data using configured selectors
    // 4. Transform to our schema format
    
    // For now, generate mock data for demonstration
    const mockTenders = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => 
      generateMockTender(portalKey)
    );

    // Save tenders to database (skip duplicates)
    const savedTenders = [];
    for (const tenderData of mockTenders) {
      const exists = await Tender.findOne({ tenderNumber: tenderData.tenderNumber });
      if (!exists) {
        const tender = new Tender(tenderData);
        await tender.save();
        savedTenders.push(tender);
        logger.info(`Saved new tender: ${tender.title}`);
      } else {
        logger.debug(`Skipped duplicate tender: ${tenderData.tenderNumber}`);
      }
    }

    logger.info(`Monitor complete for ${portalKey}: ${savedTenders.length} new tenders found`);
    return savedTenders;
  } catch (error) {
    logger.error(`Error monitoring ${portalKey}: ${error.message}`);
    return [];
  }
};

// Main monitoring function
const runMonitoring = async () => {
  logger.info('=== Starting tender monitoring cycle ===');
  
  const startTime = Date.now();
  let totalNewTenders = 0;

  // Monitor all configured portals
  for (const [portalKey, config] of Object.entries(PORTAL_CONFIGS)) {
    const newTenders = await monitorPortal(portalKey, config);
    totalNewTenders += newTenders.length;
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  logger.info(`=== Monitoring cycle complete: ${totalNewTenders} new tenders in ${duration}s ===`);

  // Send notifications if new tenders found
  if (totalNewTenders > 0) {
    try {
      const newTenderIds = await Tender.find({
        'source.scrapedAt': { $gte: new Date(Date.now() - duration * 1000) }
      }).distinct('_id');

      // Trigger bulk notification (in production, use queue system)
      await axios.post('http://localhost:5000/api/notifications/bulk-alert', {
        tenderIds: newTenderIds,
        notificationType: 'email',
      }).catch(err => logger.warn(`Bulk alert failed: ${err.message}`));
      
      logger.info(`Sent bulk alerts for ${newTenderIds.length} tenders`);
    } catch (error) {
      logger.error(`Notification error: ${error.message}`);
    }
  }

  return totalNewTenders;
};

// Schedule monitoring job
const scheduleMonitoring = () => {
  const schedule = process.env.MONITORING_SCHEDULE || '0 6 * * *'; // Default: 6 AM daily
  
  logger.info(`Scheduling monitoring with cron: ${schedule}`);
  
  cron.schedule(schedule, async () => {
    try {
      await runMonitoring();
    } catch (error) {
      logger.error(`Scheduled monitoring failed: ${error.message}`);
    }
  });

  logger.info('Monitoring scheduler started');
};

// Run immediately if called directly
if (process.argv[1]?.includes('monitor.js')) {
  (async () => {
    try {
      const mongoose = await import('mongoose');
      await mongoose.connect(process.env.MONGODB_URI);
      logger.info('Connected to MongoDB');
      
      await runMonitoring();
      
      process.exit(0);
    } catch (error) {
      logger.error(`Standalone run failed: ${error.message}`);
      process.exit(1);
    }
  })();
}

export { runMonitoring, scheduleMonitoring, monitorPortal };
