// backend/models/AutoWorkOrderRule.js
const mongoose = require('mongoose');

const workOrderTemplateSchema = new mongoose.Schema({
  title: String,
  description: String,
  type: String,
  estimatedHours: Number,
  materials: [{
    item: String,
    quantity: Number,
    unitCost: Number
  }]
});

const autoWorkOrderRuleSchema = new mongoose.Schema({
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
  name: {
    type: String,
    required: [true, 'Rule name is required']
  },
  triggerType: {
    type: String,
    enum: ['running_hours', 'calendar_based', 'condition_based', 'inspection_finding'],
    required: true
  },
  triggerValue: {
    type: Number,
    required: true
  },
  triggerUnit: {
    type: String,
    enum: ['hours', 'days', 'weeks', 'months', 'threshold'],
    required: true
  },
  workOrderTemplate: workOrderTemplateSchema,
  lastTriggered: Date,
  nextTrigger: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: String,
    enum: ['P1', 'P2', 'P3', 'P4'],
    default: 'P2'
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
autoWorkOrderRuleSchema.index({ equipment: 1, isActive: 1 });
autoWorkOrderRuleSchema.index({ triggerType: 1, nextTrigger: 1 });

// Method to check if rule should trigger
autoWorkOrderRuleSchema.methods.shouldTrigger = async function(equipment) {
  if (!this.isActive) return false;
  
  switch (this.triggerType) {
    case 'running_hours':
      const hoursSinceLastMaintenance = equipment.runningHours - (equipment.lastMaintenanceHours || 0);
      return hoursSinceLastMaintenance >= this.triggerValue;
      
    case 'calendar_based':
      if (!this.lastTriggered) return true;
      const daysSinceLastTrigger = (new Date() - this.lastTriggered) / (1000 * 60 * 60 * 24);
      return daysSinceLastTrigger >= this.triggerValue;
      
    case 'condition_based':
      // Implement condition-based logic (e.g., health score below threshold)
      return equipment.healthScore < this.triggerValue;
      
    default:
      return false;
  }
};

module.exports = mongoose.model('AutoWorkOrderRule', autoWorkOrderRuleSchema);
