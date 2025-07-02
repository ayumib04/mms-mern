// backend/models/InspectionTemplate.js
const mongoose = require('mongoose');

const checkpointSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['observation', 'measurement', 'test'],
    required: true
  },
  mandatory: {
    type: Boolean,
    default: true
  },
  unit: String,
  normalRange: {
    min: Number,
    max: Number
  },
  parameters: [String]
});

const inspectionTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true
  },
  equipmentTypes: [{
    type: String,
    enum: ['plant', 'equipment', 'assembly', 'sub-assembly', 'component']
  }],
  safetyChecks: [{
    type: String
  }],
  checkpoints: [checkpointSchema],
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
inspectionTemplateSchema.index({ name: 'text', isActive: 1 });

module.exports = mongoose.model('InspectionTemplate', inspectionTemplateSchema);

// backend/models/Inspection.js
const mongoose = require('mongoose');

const findingSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['passed', 'failed', 'observation'],
    required: true
  },
  action: String,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const journeyDataSchema = new mongoose.Schema({
  safetyChecks: {
    type: Map,
    of: Boolean
  },
  checkpoints: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  measurements: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  photos: [{
    id: String,
    name: String,
    path: String,
    timestamp: Date
  }],
  documents: [{
    id: String,
    name: String,
    path: String,
    timestamp: Date
  }],
  comments: String,
  finalStatus: {
    type: String,
    enum: ['passed', 'failed', 'observation'],
    default: 'passed'
  }
});

const inspectionSchema = new mongoose.Schema({
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
  template: {
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
    enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Scheduled'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  estimatedDuration: String,
  priority: {
    type: String,
    enum: ['Normal', 'High', 'Urgent'],
    default: 'Normal'
  },
  healthScoreBefore: Number,
  healthScoreAfter: Number,
  findings: [findingSchema],
  isDraft: {
    type: Boolean,
    default: false
  },
  journeyData: journeyDataSchema,
  resourceTracking: {
    measurementPhase: {
      startTime: Date,
      endTime: Date,
      resources: [{
        name: String,
        userId: mongoose.Schema.Types.ObjectId,
        timeSpent: Number
      }]
    },
    engagementPhase: {
      startTime: Date,
      endTime: Date,
      resources: [{
        name: String,
        userId: mongoose.Schema.Types.ObjectId,
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
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedDate: Date,
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
inspectionSchema.index({ equipment: 1, scheduledDate: 1, status: 1 });
inspectionSchema.index({ assignedTo: 1, status: 1 });

// Virtual for overdue status
inspectionSchema.virtual('isOverdue').get(function() {
  return this.scheduledDate < new Date() && this.status !== 'Completed';
});

// Method to generate backlogs from findings
inspectionSchema.methods.generateBacklogs = async function() {
  const Backlog = mongoose.model('Backlog');
  const backlogs = [];
  
  for (const finding of this.findings) {
    if (finding.status === 'failed' || finding.priority === 'high' || finding.priority === 'critical') {
      const backlog = new Backlog({
        equipment: this.equipment,
        issue: finding.description,
        category: 'Inspection Finding',
        priority: finding.priority === 'critical' ? 'P1' : 
                  finding.priority === 'high' ? 'P2' : 'P3',
        status: 'Open',
        source: 'Inspection Finding',
        autoGenerated: true,
        sourceReference: {
          type: 'Inspection',
          id: this._id
        },
        createdBy: this.completedBy || this.assignedTo
      });
      
      backlogs.push(await backlog.save());
    }
  }
  
  return backlogs;
};

module.exports = mongoose.model('Inspection', inspectionSchema);
