// backend/models/WorkOrder.js
const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  item: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unitCost: {
    type: Number,
    required: true,
    min: 0
  },
  totalCost: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['Available', 'Ordered', 'Received', 'Used'],
    default: 'Available'
  }
});

const laborSchema = new mongoose.Schema({
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hours: {
    type: Number,
    required: true,
    min: 0
  },
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  }
});

const workOrderSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  backlog: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Backlog'
  },
  title: {
    type: String,
    required: [true, 'Work order title is required']
  },
  description: {
    type: String,
    required: [true, 'Work order description is required']
  },
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: true
  },
  status: {
    type: String,
    enum: ['Planned', 'Scheduled', 'In Progress', 'On Hold', 'Completed', 'Cancelled'],
    default: 'Planned'
  },
  priority: {
    type: String,
    enum: ['P1', 'P2', 'P3', 'P4'],
    required: true
  },
  type: {
    type: String,
    enum: ['Corrective', 'Preventive', 'Emergency', 'Shutdown'],
    required: true
  },
  woType: {
    type: String,
    enum: ['Auto Generated', 'User Generated'],
    default: 'User Generated'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  startDate: Date,
  completionDate: Date,
  estimatedHours: {
    type: Number,
    min: 0
  },
  actualHours: {
    type: Number,
    min: 0
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  estimatedCost: {
    type: Number,
    min: 0
  },
  actualCost: {
    type: Number,
    min: 0
  },
  triggerCondition: {
    type: {
      type: String,
      enum: ['running_hours', 'calendar_based', 'condition_based']
    },
    threshold: Number,
    currentValue: Number,
    description: String
  },
  materials: [materialSchema],
  labor: [laborSchema],
  workPermits: [{
    type: String,
    permitNumber: String,
    issuedDate: Date,
    expiryDate: Date
  }],
  safetyProcedures: [String],
  attachments: [{
    filename: String,
    path: String,
    uploadedAt: Date
  }],
  completionReport: {
    findings: String,
    recommendations: String,
    nextActions: String,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  autoGenerationRule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AutoWorkOrderRule'
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
workOrderSchema.index({ equipment: 1, status: 1, scheduledDate: 1 });
workOrderSchema.index({ assignedTo: 1, status: 1 });
workOrderSchema.index({ woType: 1, status: 1 });

// Virtual for overdue status
workOrderSchema.virtual('isOverdue').get(function() {
  return this.scheduledDate < new Date() && this.status !== 'Completed';
});

// Calculate total cost
workOrderSchema.methods.calculateTotalCost = function() {
  const materialCost = this.materials.reduce((sum, mat) => sum + mat.totalCost, 0);
  const laborCost = this.labor.reduce((sum, lab) => sum + lab.total, 0);
  return materialCost + laborCost;
};

// Update equipment running hours on completion
workOrderSchema.post('save', async function() {
  if (this.status === 'Completed' && this.actualHours) {
    const Equipment = mongoose.model('Equipment');
    const equipment = await Equipment.findById(this.equipment);
    if (equipment) {
      equipment.lastMaintenanceHours = equipment.runningHours;
      equipment.lastMaintenance = this.completionDate || new Date();
      await equipment.save();
    }
  }
});

module.exports = mongoose.model('WorkOrder', workOrderSchema);
