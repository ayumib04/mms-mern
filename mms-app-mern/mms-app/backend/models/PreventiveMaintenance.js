// backend/models/PreventiveMaintenance.js
const mongoose = require('mongoose');

const completionHistorySchema = new mongoose.Schema({
  completedDate: {
    type: Date,
    required: true
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actualCost: Number,
  findings: String,
  nextActions: String
});

const preventiveMaintenanceSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: true
  },
  title: {
    type: String,
    required: [true, 'PM title is required']
  },
  frequency: {
    type: String,
    enum: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Semi-Annually', 'Annually'],
    required: true
  },
  lastPerformed: Date,
  nextDue: {
    type: Date,
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  estimatedDuration: String,
  status: {
    type: String,
    enum: ['Scheduled', 'In Progress', 'Completed', 'Overdue'],
    default: 'Scheduled'
  },
  checklist: [{
    item: String,
    completed: {
      type: Boolean,
      default: false
    }
  }],
  estimatedCost: {
    type: Number,
    min: 0
  },
  actualCost: {
    type: Number,
    min: 0
  },
  completionHistory: [completionHistorySchema],
  notificationSettings: {
    daysBefore: {
      type: Number,
      default: 7
    },
    notifyUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
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
preventiveMaintenanceSchema.index({ equipment: 1, nextDue: 1, status: 1 });
preventiveMaintenanceSchema.index({ assignedTo: 1, status: 1 });

// Virtual for overdue status
preventiveMaintenanceSchema.virtual('isOverdue').get(function() {
  return this.nextDue < new Date() && this.status !== 'Completed';
});

// Method to calculate next due date
preventiveMaintenanceSchema.methods.calculateNextDue = function() {
  const now = new Date();
  let nextDue = new Date(this.lastPerformed || now);
  
  switch (this.frequency) {
    case 'Daily':
      nextDue.setDate(nextDue.getDate() + 1);
      break;
    case 'Weekly':
      nextDue.setDate(nextDue.getDate() + 7);
      break;
    case 'Monthly':
      nextDue.setMonth(nextDue.getMonth() + 1);
      break;
    case 'Quarterly':
      nextDue.setMonth(nextDue.getMonth() + 3);
      break;
    case 'Semi-Annually':
      nextDue.setMonth(nextDue.getMonth() + 6);
      break;
    case 'Annually':
      nextDue.setFullYear(nextDue.getFullYear() + 1);
      break;
  }
  
  this.nextDue = nextDue;
  return nextDue;
};

// Update status based on dates
preventiveMaintenanceSchema.pre('save', function(next) {
  if (this.nextDue < new Date() && this.status !== 'Completed') {
    this.status = 'Overdue';
  }
  next();
});

module.exports = mongoose.model('PreventiveMaintenance', preventiveMaintenanceSchema);

