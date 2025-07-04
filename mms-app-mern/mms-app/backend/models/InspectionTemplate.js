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

