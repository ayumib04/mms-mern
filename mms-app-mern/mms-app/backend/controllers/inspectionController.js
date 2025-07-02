// backend/controllers/inspectionController.js
const Inspection = require('../models/Inspection');
const InspectionTemplate = require('../models/InspectionTemplate');
const Equipment = require('../models/Equipment');
const Backlog = require('../models/Backlog');

// @desc    Get all inspections
// @route   GET /api/inspections
// @access  Private
exports.getInspections = async (req, res, next) => {
  try {
    const {
      equipment,
      status,
      type,
      assignedTo,
      search,
      page = 1,
      limit = 20,
      sort = '-scheduledDate'
    } = req.query;

    // Build query
    const query = { isDeleted: false };

    if (equipment) query.equipment = equipment;
    if (status) query.status = status;
    if (type) query.type = type;
    if (assignedTo) query.assignedTo = assignedTo;
    
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } }
      ];
    }

    // Check user role - technicians can only see their assigned inspections
    if (req.user.role === 'Field Technician') {
      query.assignedTo = req.user.id;
    }

    // Execute query with pagination
    const total = await Inspection.countDocuments(query);
    const inspections = await Inspection.find(query)
      .populate('equipment', 'name code location')
      .populate('template', 'name')
      .populate('assignedTo', 'name')
      .populate('createdBy', 'name')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.status(200).json({
      success: true,
      count: inspections.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: inspections
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single inspection
// @route   GET /api/inspections/:id
// @access  Private
exports.getInspectionById = async (req, res, next) => {
  try {
    const inspection = await Inspection.findById(req.params.id)
      .populate('equipment')
      .populate('template')
      .populate('assignedTo', 'name email phone')
      .populate('createdBy', 'name');

    if (!inspection || inspection.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Inspection not found'
      });
    }

    // Check access
    if (req.user.role === 'Field Technician' && 
        inspection.assignedTo._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this inspection'
      });
    }

    res.status(200).json({
      success: true,
      data: inspection
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create inspection
// @route   POST /api/inspections
// @access  Private
exports.createInspection = async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id;
    
    // Generate unique code
    const count = await Inspection.countDocuments();
    req.body.code = `INSP-${String(count + 1).padStart(6, '0')}`;

    // Get equipment health score
    const equipment = await Equipment.findById(req.body.equipment);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }
    
    req.body.healthScoreBefore = equipment.healthScore;

    const inspection = await Inspection.create(req.body);

    // Emit socket event
    req.io.emit('inspection:created', inspection);

    res.status(201).json({
      success: true,
      data: inspection
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update inspection journey
// @route   PUT /api/inspections/:id/journey
// @access  Private
exports.updateInspectionJourney = async (req, res, next) => {
  try {
    const inspection = await Inspection.findById(req.params.id);

    if (!inspection || inspection.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Inspection not found'
      });
    }

    // Check access
    if (inspection.assignedTo.toString() !== req.user.id && 
        req.user.role === 'Field Technician') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this inspection'
      });
    }

    // Update journey data
    inspection.journeyData = req.body.journeyData;
    inspection.isDraft = req.body.isDraft !== false;
    inspection.status = 'In Progress';
    
    // Update resource tracking
    if (req.body.resourceTracking) {
      inspection.resourceTracking = req.body.resourceTracking;
    }

    await inspection.save();

    // Emit socket event
    req.io.emit('inspection:updated', inspection);

    res.status(200).json({
      success: true,
      data: inspection
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete inspection
// @route   POST /api/inspections/:id/complete
// @access  Private
exports.completeInspection = async (req, res, next) => {
  try {
    const inspection = await Inspection.findById(req.params.id)
      .populate('equipment');

    if (!inspection || inspection.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Inspection not found'
      });
    }

    // Update inspection
    inspection.status = 'Completed';
    inspection.isDraft = false;
    inspection.completedBy = req.user.id;
    inspection.completedDate = new Date();
    inspection.findings = req.body.findings || [];
    inspection.healthScoreAfter = req.body.healthScoreAfter || inspection.healthScoreBefore;
    
    if (req.body.journeyData) {
      inspection.journeyData = req.body.journeyData;
    }

    await inspection.save();

    // Update equipment health score
    if (inspection.equipment) {
      inspection.equipment.healthScore = inspection.healthScoreAfter;
      await inspection.equipment.save();
    }

    // Generate backlogs from findings
    const backlogs = await inspection.generateBacklogs();

    // Emit socket events
    req.io.emit('inspection:completed', inspection);
    if (backlogs.length > 0) {
      req.io.emit('backlogs:created', backlogs);
    }

    res.status(200).json({
      success: true,
      data: inspection,
      backlogs: backlogs.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get inspection templates
// @route   GET /api/inspections/templates
// @access  Private
exports.getTemplates = async (req, res, next) => {
  try {
    const { isActive = true } = req.query;
    
    const query = { isDeleted: false };
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const templates = await InspectionTemplate.find(query)
      .populate('createdBy', 'name')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: templates.length,
      data: templates
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create inspection template
// @route   POST /api/inspections/templates
// @access  Private (Admin/Supervisor)
exports.createTemplate = async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id;
    
    const template = await InspectionTemplate.create(req.body);

    res.status(201).json({
      success: true,
      data: template
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update inspection template
// @route   PUT /api/inspections/templates/:id
// @access  Private (Admin/Supervisor)
exports.updateTemplate = async (req, res, next) => {
  try {
    const template = await InspectionTemplate.findById(req.params.id);

    if (!template || template.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    Object.assign(template, req.body);
    await template.save();

    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    next(error);
  }
};