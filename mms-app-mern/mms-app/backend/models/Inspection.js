const mongoose = require('mongoose');

const inspectionSchema = new mongoose.Schema({
  inspectionId: {
    type: String,
    unique: true,
    required: true
  },
  equipmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: true
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InspectionTemplate'
  },
  type: {
    type: String,
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Scheduled', 'In Progress', 'Completed', 'Overdue'],
    default: 'Scheduled'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  estimatedDuration: String,
  priority: {
    type: String,
    enum: ['Normal', 'High', 'Urgent'],
    default: 'Normal'
  },
  healthScoreBefore: Number,
  healthScoreAfter: Number,
  findings: [{
    id: String,
    description: String,
    status: {
      type: String,
      enum: ['passed', 'failed', 'observation']
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    action: String,
    timestamp: Date
  }],
  isDraft: {
    type: Boolean,
    default: false
  },
  resourceTracking: {
    measurementPhase: {
      startTime: Date,
      endTime: Date,
      resources: [{
        name: String,
        timeSpent: Number
      }]
    },
    engagementPhase: {
      startTime: Date,
      endTime: Date,
      resources: [{
        name: String,
        timeSpent: Number
      }]
    },
    totalTries: {
      type: Number,
      default: 0
    },
    totalTimeSpent: {
      type: Number,
      default: 0
    }
  },
  escalationSettings: {
    delayThreshold: {
      type: Number,
      default: 24
    },
    criticalityThreshold: String,
    escalationContacts: [{
      name: String,
      role: String,
      email: String,
      phone: String
    }]
  },
  journeyData: {
    safetyChecks: mongoose.Schema.Types.Mixed,
    checkpoints: mongoose.Schema.Types.Mixed,
    measurements: mongoose.Schema.Types.Mixed,
    findings: [mongoose.Schema.Types.Mixed],
    photos: [{
      id: String,
      name: String,
      timestamp: Date
    }],
    documents: [{
      id: String,
      name: String,
      timestamp: Date
    }],
    comments: String,
    finalStatus: {
      type: String,
      enum: ['passed', 'failed', 'observation']
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Inspection', inspectionSchema);