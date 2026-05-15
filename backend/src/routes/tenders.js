import express from 'express';
import Tender from '../models/Tender.js';

const router = express.Router();

// @route   GET /api/tenders
// @desc    Get all tenders with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      state, 
      portal, 
      status = 'active',
      search,
      sortBy = 'dates.endDate',
      order = 'asc'
    } = req.query;

    // Build query
    const query = {};
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (state) query['location.state'] = state;
    if (portal) query['source.portal'] = portal;
    
    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Filter only future end dates for active tenders
    if (status === 'active') {
      query['dates.endDate'] = { $gte: new Date() };
    }

    // Pagination
    const skip = (page - 1) * limit;
    
    // Execute query
    const tenders = await Tender.find(query)
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('viewedBy.user', 'fullName companyName')
      .lean();

    // Get total count
    const total = await Tender.countDocuments(query);

    res.json({
      success: true,
      data: {
        tenders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get tenders error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching tenders' 
    });
  }
});

// @route   GET /api/tenders/expiring
// @desc    Get tenders expiring soon
// @access  Public
router.get('/expiring', async (req, res) => {
  try {
    const { hours = 72 } = req.query;
    
    const tenders = await Tender.findExpiringSoon(parseInt(hours));
    
    res.json({
      success: true,
      data: { tenders },
    });
  } catch (error) {
    console.error('Get expiring tenders error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching expiring tenders' 
    });
  }
});

// @route   GET /api/tenders/:id
// @desc    Get single tender by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id)
      .populate('viewedBy.user', 'fullName companyName')
      .populate('appliedBy.user', 'fullName companyName');
    
    if (!tender) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tender not found' 
      });
    }

    res.json({
      success: true,
      data: { tender },
    });
  } catch (error) {
    console.error('Get tender error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ 
        success: false, 
        message: 'Tender not found' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching tender' 
    });
  }
});

// @route   POST /api/tenders/:id/view
// @desc    Mark tender as viewed by user
// @access  Private
router.post('/:id/view', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    const tender = await Tender.findById(req.params.id);
    
    if (!tender) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tender not found' 
      });
    }

    // Check if already viewed
    const alreadyViewed = tender.viewedBy.some(
      view => view.user.toString() === userId
    );

    if (!alreadyViewed) {
      tender.viewedBy.push({ user: userId });
      await tender.save();
    }

    res.json({
      success: true,
      message: 'Tender marked as viewed',
    });
  } catch (error) {
    console.error('Mark viewed error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ 
        success: false, 
        message: 'Tender not found' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   POST /api/tenders/:id/apply
// @desc    Mark tender as applied by user
// @access  Private
router.post('/:id/apply', async (req, res) => {
  try {
    const { userId, status = 'applied' } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    const tender = await Tender.findById(req.params.id);
    
    if (!tender) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tender not found' 
      });
    }

    // Check if already applied
    const alreadyApplied = tender.appliedBy.some(
      app => app.user.toString() === userId
    );

    if (alreadyApplied) {
      // Update existing application status
      const application = tender.appliedBy.find(
        app => app.user.toString() === userId
      );
      application.status = status;
    } else {
      tender.appliedBy.push({ user: userId, status });
    }

    await tender.save();

    res.json({
      success: true,
      message: `Tender ${status} successfully`,
    });
  } catch (error) {
    console.error('Apply tender error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ 
        success: false, 
        message: 'Tender not found' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   GET /api/tenders/stats/overview
// @desc    Get tender statistics overview
// @access  Public
router.get('/stats/overview', async (req, res) => {
  try {
    const [
      totalActive,
      totalExpiring,
      byCategory,
      byPortal,
      byState
    ] = await Promise.all([
      Tender.countDocuments({ status: 'active', 'dates.endDate': { $gte: new Date() } }),
      Tender.countDocuments({ 
        status: 'active', 
        'dates.endDate': { 
          $lte: new Date(Date.now() + 72 * 60 * 60 * 1000),
          $gte: new Date()
        } 
      }),
      Tender.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      Tender.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$source.portal', count: { $sum: 1 } } }
      ]),
      Tender.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$location.state', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalActive,
        totalExpiring,
        byCategory,
        byPortal,
        byState,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching statistics' 
    });
  }
});

export default router;
