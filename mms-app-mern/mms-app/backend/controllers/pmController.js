// backend/controllers/pmController.js
const PreventiveMaintenance = require('../models/PreventiveMaintenance');
const Equipment = require('../models/Equipment');
const WorkOrder = require('../models/WorkOrder');

// @desc    Get all PM schedules
// @route   GET /api/preventive-maintenance
// @access  Private
exports.getPMSchedules = async (req, res, next) => {
  try {
    const {
      equipment,
      status,
      assignedTo,
      search,
      page = 1,
      limit = 20,
      sort = '-nextDue'
    } = req.query;

    // Build query
    const query = { isDeleted: false };

    if (equipment) query.equipment = equipment;
    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;
    
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const total = await PreventiveMaintenance.countDocuments(query);
    const schedules = await PreventiveMaintenance.find(query)
      .populate('equipment', 'name code location')
      .populate('assignedTo', 'name')
      .populate('createdBy', 'name')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.status(200).json({
      success: true,
      count: schedules.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: schedules
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single PM schedule
// @route   GET /api/preventive-maintenance/:id
// @access  Private
exports.getPMScheduleById = async (req, res, next) => {
  try {
    const schedule = await PreventiveMaintenance.findById(req.params.id)
      .populate('equipment')
      .populate('assignedTo', 'name email phone')
      .populate('completionHistory.completedBy', 'name');

    if (!schedule || schedule.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'PM schedule not found'
      });
    }

    res.status(200).json({
      success: true,
      data: schedule
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create PM schedule
// @route   POST /api/preventive-maintenance
// @access  Private
exports.createPMSchedule = async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id;
    
    // Generate unique code
    const count = await PreventiveMaintenance.countDocuments();
    req.body.code = `PM-${String(count + 1).padStart(6, '0')}`;

    const schedule = await PreventiveMaintenance.create(req.body);
    
    // Calculate next due date
    await schedule.calculateNextDue();
    await schedule.save();

    // Emit socket event
    req.io.emit('pm:created', schedule);

    res.status(201).json({
      success: true,
      data: schedule
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update PM schedule
// @route   PUT /api/preventive-maintenance/:id
// @access  Private
exports.updatePMSchedule = async (req, res, next) => {
  try {
    const schedule = await PreventiveMaintenance.findById(req.params.id);

    if (!schedule || schedule.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'PM schedule not found'
      });
    }

    Object.assign(schedule, req.body);
    
    // Recalculate next due if frequency changed
    if (req.body.frequency) {
      await schedule.calculateNextDue();
    }
    
    await schedule.save();

    // Emit socket event
    req.io.emit('pm:updated', schedule);

    res.status(200).json({
      success: true,
      data: schedule
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete PM schedule
// @route   POST /api/preventive-maintenance/:id/complete
// @access  Private
exports.completePMSchedule = async (req, res, next) => {
  try {
    const schedule = await PreventiveMaintenance.findById(req.params.id);

    if (!schedule || schedule.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'PM schedule not found'
      });
    }

    // Add completion history
    schedule.completionHistory.push({
      completedDate: new Date(),
      completedBy: req.user.id,
      actualCost: req.body.actualCost || schedule.estimatedCost,
      findings: req.body.findings,
      nextActions: req.body.nextActions
    });

    // Update schedule
    schedule.lastPerformed = new Date();
    schedule.status = 'Scheduled';
    schedule.actualCost = req.body.actualCost || schedule.estimatedCost;
    
    // Calculate next due date
    await schedule.calculateNextDue();
    await schedule.save();

    // Update equipment last maintenance
    if (schedule.equipment) {
      await Equipment.findByIdAndUpdate(schedule.equipment, {
        lastMaintenance: new Date(),
        $inc: { maintenanceCost: schedule.actualCost }
      });
    }

    // Emit socket event
    req.io.emit('pm:completed', schedule);

    res.status(200).json({
      success: true,
      data: schedule
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Auto-generate PM schedules from templates
// @route   POST /api/preventive-maintenance/auto-generate
// @access  Private (Admin/Supervisor)
exports.autoGeneratePMSchedules = async (req, res, next) => {
  try {
    const { equipmentType, frequency } = req.body;
    
    // Find equipment without PM schedules
    const equipment = await Equipment.find({
      type: equipmentType,
      isDeleted: false,
      status: 'Active'
    });

    const schedules = [];
    
    for (const eq of equipment) {
      // Check if PM already exists
      const existingPM = await PreventiveMaintenance.findOne({
        equipment: eq._id,
        frequency: frequency,
        isDeleted: false
      });

      if (!existingPM) {
        const count = await PreventiveMaintenance.countDocuments();
        const pmData = {
          code: `PM-${String(count + schedules.length + 1).padStart(6, '0')}`,
          equipment: eq._id,
          title: `${frequency} Maintenance - ${eq.name}`,
          frequency: frequency,
          nextDue: new Date(),
          estimatedDuration: '2 hours',
          checklist: getDefaultChecklist(eq.type, frequency),
          estimatedCost: getEstimatedCost(eq.type, frequency),
          createdBy: req.user.id
        };

        const schedule = await PreventiveMaintenance.create(pmData);
        await schedule.calculateNextDue();
        await schedule.save();
        
        schedules.push(schedule);
      }
    }

    res.status(200).json({
      success: true,
      created: schedules.length,
      data: schedules
    });
  } catch (error) {
    next(error);
  }
};

// Helper functions
const getDefaultChecklist = (equipmentType, frequency) => {
  const checklists = {
    'Daily': [
      { item: 'Visual inspection for leaks or damage', completed: false },
      { item: 'Check operating parameters', completed: false },
      { item: 'Listen for unusual noises', completed: false }
    ],
    'Weekly': [
      { item: 'Clean equipment surfaces', completed: false },
      { item: 'Check fluid levels', completed: false },
      { item: 'Test safety devices', completed: false },
      { item: 'Record operating hours', completed: false }
    ],
    'Monthly': [
      { item: 'Lubrication of moving parts', completed: false },
      { item: 'Tighten connections', completed: false },
      { item: 'Check belt tension', completed: false },
      { item: 'Calibrate instruments', completed: false },
      { item: 'Test emergency stops', completed: false }
    ]
  };

  return checklists[frequency] || [];
};

const getEstimatedCost = (equipmentType, frequency) => {
  const baseCosts = {
    'Daily': 500,
    'Weekly': 1000,
    'Monthly': 2500,
    'Quarterly': 5000,
    'Semi-Annually': 7500,
    'Annually': 10000
  };

  return baseCosts[frequency] || 1000;
};