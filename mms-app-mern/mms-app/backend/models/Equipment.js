// backend/models/Equipment.js
const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Equipment code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Equipment name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['plant', 'equipment', 'assembly', 'sub-assembly', 'component'],
    required: true
  },
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    default: null
  },
  criticality: {
    type: String,
    enum: ['A', 'B', 'C'],
    required: true
  },
  location: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Maintenance', 'Decommissioned'],
    default: 'Active'
  },
  description: String,
  manufacturer: String,
  model: String,
  serialNumber: String,
  commissionDate: Date,
  runningHours: {
    type: Number,
    default: 0,
    min: 0
  },
  lastMaintenanceHours: {
    type: Number,
    default: 0,
    min: 0
  },
  nextMaintenanceHours: {
    type: Number,
    default: 1000,
    min: 0
  },
  specifications: {
    type: Map,
    of: String
  },
  ownership: {
    mechanical: String,
    electrical: String,
    operations: String
  },
  healthScore: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  lastMaintenance: Date,
  nextMaintenance: Date,
  maintenanceCost: {
    type: Number,
    default: 0,
    min: 0
  },
  uptimePercentage: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment'
  }],
  attachments: [{
    filename: String,
    path: String,
    uploadedAt: Date,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
equipmentSchema.index({ code: 1, name: 'text', location: 1 });
equipmentSchema.index({ parent: 1, level: 1 });

// Virtual for full path
equipmentSchema.virtual('fullPath').get(async function() {
  let path = [this.name];
  let current = this;
  
  while (current.parent) {
    current = await mongoose.model('Equipment').findById(current.parent);
    if (current) {
      path.unshift(current.name);
    }
  }
  
  return path.join(' > ');
});

// Method to update children array
equipmentSchema.methods.updateChildren = async function() {
  const Equipment = mongoose.model('Equipment');
  const children = await Equipment.find({ parent: this._id, isDeleted: false });
  this.children = children.map(child => child._id);
  await this.save();
};

// Pre-save middleware to validate hierarchy
equipmentSchema.pre('save', async function(next) {
  if (this.parent) {
    const Equipment = mongoose.model('Equipment');
    const parent = await Equipment.findById(this.parent);
    if (!parent) {
      return next(new Error('Parent equipment not found'));
    }
    if (parent.level !== this.level - 1) {
      return next(new Error('Invalid hierarchy level'));
    }
  }
  next();
});

module.exports = mongoose.model('Equipment', equipmentSchema);