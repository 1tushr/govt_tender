import mongoose from 'mongoose';

const tenderSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  tenderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  organization: {
    type: String,
    required: true,
    trim: true,
  },
  department: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    enum: ['Goods', 'Services', 'Works', 'Consultancy'],
  },
  subCategory: String,
  description: {
    type: String,
    required: true,
  },
  eligibilityCriteria: {
    type: String,
  },
  documents: [{
    name: String,
    url: String,
    type: String,
  }],
  budget: {
    value: Number,
    currency: {
      type: String,
      default: 'INR',
    },
  },
  emdAmount: {
    value: Number,
    currency: {
      type: String,
      default: 'INR',
    },
  },
  location: {
    state: String,
    city: String,
    addresses: [String],
  },
  dates: {
    publishDate: {
      type: Date,
      required: true,
    },
    startDate: Date,
    endDate: {
      type: Date,
      required: true,
    },
    openingDate: Date,
    preBidMeetingDate: Date,
  },
  source: {
    portal: {
      type: String,
      required: true,
      enum: [
        'CPPP', 'GeM', 'GEPNIC', 'IndiaGov', 'UP', 'Delhi', 'Maharashtra',
        'Karnataka', 'TamilNadu', 'NProcure', 'Rajasthan', 'MP', 'Haryana',
        'Punjab', 'Bihar', 'WestBengal', 'Odisha', 'Telangana', 'AndhraPradesh',
        'Kerala', 'Chhattisgarh', 'Jharkhand', 'Assam', 'HimachalPradesh',
        'Uttarakhand', 'StartupIndia', 'IREPS', 'CoalIndia', 'eTenders',
        'Defence', 'BEL', 'RailTel', 'ISRO', 'DRDO', 'BSNL', 'NTPC', 'SBI',
        'TenderWizard', 'TCIL', 'NHAI', 'SmartCities', 'NIC'
      ],
    },
    url: {
      type: String,
      required: true,
    },
    scrapedAt: {
      type: Date,
      default: Date.now,
    },
  },
  aiAnalysis: {
    eligibilityMatch: {
      type: Number,
      min: 0,
      max: 100,
    },
    summary: String,
    keyRequirements: [String],
    riskFactors: [String],
    recommended: {
      type: Boolean,
      default: false,
    },
    analyzedAt: Date,
  },
  status: {
    type: String,
    enum: ['active', 'upcoming', 'closed', 'cancelled', 'awarded'],
    default: 'active',
  },
  viewedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  appliedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['applied', 'shortlisted', 'rejected', 'won'],
    },
  }],
  tags: [String],
}, {
  timestamps: true,
});

// Indexes for better query performance
tenderSchema.index({ tenderNumber: 1 });
tenderSchema.index({ 'source.portal': 1 });
tenderSchema.index({ 'dates.endDate': 1 });
tenderSchema.index({ status: 1 });
tenderSchema.index({ category: 1 });
tenderSchema.index({ 'location.state': 1 });
tenderSchema.index({ tags: 1 });
tenderSchema.index({ title: 'text', description: 'text', eligibilityCriteria: 'text' });

// Static method to find active tenders
tenderSchema.statics.findActive = function() {
  return this.find({
    status: 'active',
    'dates.endDate': { $gte: new Date() },
  });
};

// Static method to find expiring soon
tenderSchema.statics.findExpiringSoon = function(hours = 72) {
  const deadline = new Date(Date.now() + hours * 60 * 60 * 1000);
  return this.find({
    status: 'active',
    'dates.endDate': { $lte: deadline, $gte: new Date() },
  }).sort({ 'dates.endDate': 1 });
};

const Tender = mongoose.model('Tender', tenderSchema);

export default Tender;
