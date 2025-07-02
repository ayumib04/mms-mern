// backend/controllers/backlogController.js
const Backlog = require('../models/Backlog');
const WorkOrder = require('../models/WorkOrder');
const Equipment = require('../models/Equipment');

// @desc    Get all backlogs
// @route   GET /api/backlogs
// @access  Private
exports.getBacklogs = async (req, res, next) => {
  try {
    const {
      equipment,
      status,
      priority,
      category,
      assignedTo,
      search,
      page = 1,
      limit = 20,
      sort = '-createdAt'
    } = req.query;

    // Build query
    const query = { isDeleted: false };

    if (equipment) query.equipment = equipment;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (assignedTo) query.assignedTo = assignedTo;
    
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { issue: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const total = await Backlog.countDocuments(query);
    const backlogs = await Backlog.find(query)
      .populate('equipment', 'name code location')
      .populate('assignedTo', 'name')
      .populate('workOrder', 'code')
      .populate('createdBy', 'name')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.status(200).json({
      success: true,
      count: backlogs.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: backlogs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create backlog
// @route   POST /api/backlogs
// @access  Private
exports.createBacklog = async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id;
    
    // Generate unique code
    const count = await Backlog.countDocuments();
    req.body.code = `BL-${String(count + 1).padStart(6, '0')}`;

    const backlog = await Backlog.create(req.body);

    // Emit socket event
    req.io.emit('backlog:created', backlog);

    res.status(201).json({
      success: true,
      data: backlog
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update backlog
// @route   PUT /api/backlogs/:id
// @access  Private
exports.updateBacklog = async (req, res, next) => {
  try {
    const backlog = await Backlog.findById(req.params.id);

    if (!backlog || backlog.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Backlog not found'
      });
    }

    Object.assign(backlog, req.body);
    await backlog.save();

    // Emit socket event
    req.io.emit('backlog:updated', backlog);

    res.status(200).json({
      success: true,
      data: backlog
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk assign backlogs
// @route   POST /api/backlogs/bulk-assign
// @access  Private
exports.bulkAssignBacklogs = async (req, res, next) => {
  try {
    const { backlogIds, assignments } = req.body;

    if (!backlogIds || !Array.isArray(backlogIds) || backlogIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide backlog IDs'
      });
    }

    const updateData = {};
    if (assignments.assignedTo) updateData.assignedTo = assignments.assignedTo;
    if (assignments.priority) updateData.priority = assignments.priority;
    if (assignments.dueDate) updateData.dueDate = assignments.dueDate;
    if (assignments.category) updateData.category = assignments.category;

    const result = await Backlog.updateMany(
      { _id: { $in: backlogIds }, isDeleted: false },
      { $set: updateData }
    );

    // Emit socket event
    req.io.emit('backlogs:bulkUpdated', { backlogIds, assignments });

    res.status(200).json({
      success: true,
      updated: result.modifiedCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate work orders from backlogs
// @route   POST /api/backlogs/generate-workorders
// @access  Private
exports.generateWorkOrders = async (req, res, next) => {
  try {
    const { backlogIds } = req.body;

    if (!backlogIds || !Array.isArray(backlogIds) || backlogIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide backlog IDs'
      });
    }

    // Get eligible backlogs
    const backlogs = await Backlog.find({
      _id: { $in: backlogIds },
      status: { $in: ['Open', 'Validated', 'Planned'] },
      workOrder: null,
      isDeleted: false
    }).populate('equipment', 'name code');

    const workOrders = [];

    for (const backlog of backlogs) {
      // Generate work order code
      const count = await WorkOrder.countDocuments();
      const woCode = `WO-${String(count + 1).padStart(6, '0')}`;

      const workOrder = await WorkOrder.create({
        code: woCode,
        backlog: backlog._id,
        title: `${backlog.category} Work: ${backlog.issue.substring(0, 50)}...`,
        description: backlog.issue,
        equipment: backlog.equipment._id,
        status: 'Planned',
        priority: backlog.priority,
        type: 'Corrective',
        woType: 'User Generated',
        assignedTo: backlog.assignedTo,
        scheduledDate: backlog.dueDate,
        estimatedHours: backlog.estimatedHours,
        estimatedCost: backlog.estimatedCost || (backlog.estimatedHours * 500),
        createdBy: req.user.id
      });

      // Update backlog
      backlog.workOrder = workOrder._id;
      backlog.status = 'Planned';
      await backlog.save();

      workOrders.push(workOrder);
    }

    // Emit socket events
    req.io.emit('workorders:created', workOrders);

    res.status(200).json({
      success: true,
      created: workOrders.length,
      data: workOrders
    });
  } catch (error) {
    next(error);
  }
};