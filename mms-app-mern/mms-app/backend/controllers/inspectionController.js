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

const Inspection = require('../models/Inspection');
const Equipment = require('../models/Equipment');
const InspectionTemplate = require('../models/InspectionTemplate');

exports.getAllInspections = async (req, res) => {
  try {
    const { status, type, search } = req.query;
    let query = {};

    if (status && status !== 'all') query.status = status;
    if (type && type !== 'all') query.type = type;
    if (search) {
      query.$or = [
        { inspectionId: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } }
      ];
    }

    const inspections = await Inspection.find(query)
      .populate('equipmentId', 'name code')
      .populate('assignedTo', 'name')
      .populate('templateId', 'name')
      .sort({ scheduledDate: -1 });

    // Check for overdue inspections
    const updatedInspections = inspections.map(inspection => {
      const isOverdue = new Date(inspection.scheduledDate) < new Date() && 
                       inspection.status !== 'Completed';
      return {
        ...inspection.toObject(),
        isOverdue
      };
    });

    res.json(updatedInspections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createInspection = async (req, res) => {
  try {
    const inspectionCount = await Inspection.countDocuments();
    const inspectionId = `INSP-${Date.now()}`;

    const inspection = new Inspection({
      inspectionId,
      ...req.body
    });

    await inspection.save();
    
    const populatedInspection = await Inspection.findById(inspection._id)
      .populate('equipmentId', 'name code')
      .populate('assignedTo', 'name')
      .populate('templateId', 'name');

    res.status(201).json(populatedInspection);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateInspectionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const inspection = await Inspection.findById(id);
    if (!inspection) {
      return res.status(404).json({ message: 'Inspection not found' });
    }

    inspection.status = status;
    
    if (status === 'Completed' && !inspection.healthScoreAfter) {
      const equipment = await Equipment.findById(inspection.equipmentId);
      // Simple health score calculation based on findings
      const failedFindings = inspection.findings.filter(f => f.status === 'failed').length;
      const observationFindings = inspection.findings.filter(f => f.status === 'observation').length;
      
      inspection.healthScoreAfter = Math.max(50, 
        equipment.healthScore - (failedFindings * 10) - (observationFindings * 2)
      );
    }

    await inspection.save();

    const populatedInspection = await Inspection.findById(inspection._id)
      .populate('equipmentId', 'name code')
      .populate('assignedTo', 'name')
      .populate('templateId', 'name');

    res.json(populatedInspection);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateInspectionJourney = async (req, res) => {
  try {
    const { id } = req.params;
    const { journeyData, status, findings, healthScoreAfter, isDraft } = req.body;

    const inspection = await Inspection.findById(id);
    if (!inspection) {
      return res.status(404).json({ message: 'Inspection not found' });
    }

    if (journeyData) inspection.journeyData = journeyData;
    if (status) inspection.status = status;
    if (findings) inspection.findings = findings;
    if (healthScoreAfter !== undefined) inspection.healthScoreAfter = healthScoreAfter;
    if (isDraft !== undefined) inspection.isDraft = isDraft;

    // Update resource tracking
    if (req.body.resourceTracking) {
      inspection.resourceTracking = {
        ...inspection.resourceTracking,
        ...req.body.resourceTracking
      };
    }

    await inspection.save();

    const populatedInspection = await Inspection.findById(inspection._id)
      .populate('equipmentId', 'name code')
      .populate('assignedTo', 'name')
      .populate('templateId', 'name');

    res.json(populatedInspection);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getInspectionStats = async (req, res) => {
  try {
    const total = await Inspection.countDocuments();
    const scheduled = await Inspection.countDocuments({ status: 'Scheduled' });
    const inProgress = await Inspection.countDocuments({ status: 'In Progress' });
    const completed = await Inspection.countDocuments({ status: 'Completed' });
    
    // Count overdue
    const now = new Date();
    const overdueInspections = await Inspection.find({
      scheduledDate: { $lt: now },
      status: { $ne: 'Completed' }
    });
    
    res.json({
      total,
      scheduled,
      inProgress,
      completed,
      overdue: overdueInspections.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};