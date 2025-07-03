// backend/utils/validators.js
const { body, validationResult } = require('express-validator');

// Validation middleware
exports.validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// User validators
exports.validateUser = [
  body('name').notEmpty().withMessage('Name is required'),
  body('username').notEmpty().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['Administrator', 'Department Head', 'Supervisor', 'Field Technician']).withMessage('Invalid role'),
  body('department').notEmpty().withMessage('Department is required')
];

// Equipment validators
exports.validateEquipment = [
  body('code').notEmpty().withMessage('Equipment code is required'),
  body('name').notEmpty().withMessage('Equipment name is required'),
  body('type').isIn(['plant', 'equipment', 'assembly', 'sub-assembly', 'component']).withMessage('Invalid equipment type'),
  body('level').isInt({ min: 1, max: 5 }).withMessage('Level must be between 1 and 5'),
  body('criticality').isIn(['A', 'B', 'C']).withMessage('Invalid criticality'),
  body('location').notEmpty().withMessage('Location is required')
];

// Inspection validators
exports.validateInspection = [
  body('equipment').notEmpty().isMongoId().withMessage('Valid equipment ID is required'),
  body('type').notEmpty().withMessage('Inspection type is required'),
  body('scheduledDate').isISO8601().withMessage('Valid scheduled date is required'),
  body('assignedTo').notEmpty().isMongoId().withMessage('Valid assignee ID is required')
];

// Work order validators
exports.validateWorkOrder = [
  body('title').notEmpty().withMessage('Work order title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('equipment').notEmpty().isMongoId().withMessage('Valid equipment ID is required'),
  body('priority').isIn(['P1', 'P2', 'P3', 'P4']).withMessage('Invalid priority'),
  body('type').isIn(['Corrective', 'Preventive', 'Emergency', 'Shutdown']).withMessage('Invalid work order type')
];

// Backlog validators
exports.validateBacklog = [
  body('equipment').notEmpty().isMongoId().withMessage('Valid equipment ID is required'),
  body('issue').notEmpty().withMessage('Issue description is required'),
  body('category').isIn(['Mechanical', 'Electrical', 'Safety', 'Environmental', 'Operational', 'Instrumentation', 'Preventive', 'Inspection Finding']).withMessage('Invalid category'),
  body('priority').isIn(['P1', 'P2', 'P3', 'P4']).withMessage('Invalid priority')
];

// PM validators
exports.validatePM = [
  body('equipment').notEmpty().isMongoId().withMessage('Valid equipment ID is required'),
  body('title').notEmpty().withMessage('PM title is required'),
  body('frequency').isIn(['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Semi-Annually', 'Annually']).withMessage('Invalid frequency'),
  body('nextDue').isISO8601().withMessage('Valid next due date is required')
];