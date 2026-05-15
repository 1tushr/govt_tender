import express from 'express';
import axios from 'axios';
import User from '../models/User.js';

const router = express.Router();

// @route   POST /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    const allowedUpdates = [
      'profile.keywords',
      'profile.categories',
      'profile.states',
      'profile.minBudget',
      'profile.maxBudget',
      'profile.organizationType',
      'preferences.emailNotifications',
      'preferences.whatsappNotifications',
      'preferences.notificationFrequency',
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error updating profile' 
    });
  }
});

// @route   GET /api/users/recommendations
// @desc    Get tender recommendations for user
// @access  Private
router.get('/recommendations', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Build match query based on user profile
    const Tender = (await import('../models/Tender.js')).default;
    
    const matchQuery = {
      status: 'active',
      'dates.endDate': { $gte: new Date() },
    };

    // Match keywords in title or description
    if (user.profile.keywords && user.profile.keywords.length > 0) {
      matchQuery.$or = user.profile.keywords.map(keyword => ({
        title: { $regex: keyword, $options: 'i' },
        description: { $regex: keyword, $options: 'i' },
      }));
    }

    // Match states
    if (user.profile.states && user.profile.states.length > 0) {
      matchQuery['location.state'] = { $in: user.profile.states };
    }

    // Match categories
    if (user.profile.categories && user.profile.categories.length > 0) {
      matchQuery.category = { $in: user.profile.categories };
    }

    // Match budget range
    if (user.profile.minBudget || user.profile.maxBudget) {
      matchQuery['budget.value'] = {};
      if (user.profile.minBudget) {
        matchQuery['budget.value'].$gte = user.profile.minBudget;
      }
      if (user.profile.maxBudget) {
        matchQuery['budget.value'].$lte = user.profile.maxBudget;
      }
    }

    const recommendations = await Tender.find(matchQuery)
      .sort({ 'dates.publishDate': -1 })
      .limit(20)
      .lean();

    res.json({
      success: true,
      data: { recommendations },
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching recommendations' 
    });
  }
});

// @route   GET /api/users/dashboard
// @desc    Get user dashboard data
// @access  Private
router.get('/dashboard', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const Tender = (await import('../models/Tender.js')).default;

    // Get tenders user has applied to
    const appliedTenders = await Tender.find({
      'appliedBy.user': userId,
    }).select('title tenderNumber organization dates status');

    // Get viewed but not applied
    const viewedTenders = await Tender.find({
      'viewedBy.user': userId,
      'appliedBy.user': { $ne: userId },
    }).select('title tenderNumber organization dates status');

    // Get expiring soon from user's interests
    const expiringSoon = await Tender.find({
      status: 'active',
      'dates.endDate': { 
        $lte: new Date(Date.now() + 72 * 60 * 60 * 1000),
        $gte: new Date()
      },
    }).limit(5);

    res.json({
      success: true,
      data: {
        stats: user.tenderStats,
        appliedTenders,
        viewedTenders: viewedTenders.slice(0, 10),
        expiringSoon,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching dashboard data' 
    });
  }
});

export default router;
