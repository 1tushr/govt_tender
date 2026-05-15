import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'],
  },
  companyName: {
    type: String,
    required: [true, 'Company/Business name is required'],
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  profile: {
    keywords: [{
      type: String,
      trim: true,
    }],
    categories: [{
      type: String,
      trim: true,
    }],
    states: [{
      type: String,
      trim: true,
    }],
    minBudget: Number,
    maxBudget: Number,
    organizationType: {
      type: String,
      enum: ['MSME', 'Startup', 'Private Ltd', 'Partnership', 'Proprietorship', 'Other'],
    },
  },
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    whatsappNotifications: {
      type: Boolean,
      default: false,
    },
    notificationFrequency: {
      type: String,
      enum: ['instant', 'daily', 'weekly'],
      default: 'daily',
    },
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'pro'],
      default: 'free',
    },
    startDate: Date,
    endDate: Date,
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled'],
      default: 'active',
    },
  },
  tenderStats: {
    totalViewed: { type: Number, default: 0 },
    applied: { type: Number, default: 0 },
    shortlisted: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  verified: {
    type: Boolean,
    default: false,
  },
  verificationOTP: String,
  verificationOTPExpire: Date,
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.getSignedJwtToken = function() {
  const jwt = await import('jsonwebtoken');
  return jwt.default.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

const User = mongoose.model('User', userSchema);

export default User;
