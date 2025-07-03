// backend/controllers/workOrderController.js
const WorkOrder = require('../models/WorkOrder');
const AutoWorkOrderRule = require('../models/AutoWorkOrderRule');
const Equipment = require('../models/Equipment');
const Backlog = require('../models/Backlog');

// @desc    Get all work orders
// @route   GET /api/workorders
// @access  Private
exports.getWorkOrders = async (req, res, next) => {
  try {
    const {
      equipment,
      status,
      priority,
      type,
      woType,
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
    if (type) query.type = type;
    if (woType) query.woType = woType;
    if (assignedTo) query.assignedTo = assignedTo;
    
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } }
      ];
    }

    // Check user role - technicians can only see their assigned work orders
    if (req.user.role === 'Field Technician') {
      query.assignedTo = req.user.id;
    }

    // Execute query with pagination
    const total = await WorkOrder.countDocuments(query);
    const workOrders = await WorkOrder.find(query)
      .populate('equipment', 'name code location')
      .populate('backlog', 'code issue')
      .populate('assignedTo', 'name')
      .populate('createdBy', 'name')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.status(200).json({
      success: true,
      count: workOrders.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: workOrders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single work order
// @route   GET /api/workorders/:id
// @access  Private
exports.getWorkOrderById = async (req, res, next) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id)
      .populate('equipment')
      .populate('backlog')
      .populate('assignedTo', 'name email phone')
      .populate('materials')
      .populate('labor.technician', 'name')
      .populate('completionReport.completedBy', 'name');

    if (!workOrder || workOrder.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found'
      });
    }

    // Check access
    if (req.user.role === 'Field Technician' && 
        workOrder.assignedTo._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this work order'
      });
    }

    res.status(200).json({
      success: true,
      data: workOrder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create work order
// @route   POST /api/workorders
// @access  Private
exports.createWorkOrder = async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id;
    
    // Generate unique code
    const count = await WorkOrder.countDocuments();
    req.body.code = `WO-${String(count + 1).padStart(6, '0')}`;

    const workOrder = await WorkOrder.create(req.body);

    // Update backlog if linked
    if (workOrder.backlog) {
      await Backlog.findByIdAndUpdate(workOrder.backlog, {
        workOrder: workOrder._id,
        status: 'Planned'
      });
    }

    // Emit socket event
    req.io.emit('workorder:created', workOrder);

    res.status(201).json({
      success: true,
      data: workOrder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update work order
// @route   PUT /api/workorders/:id
// @access  Private
exports.updateWorkOrder = async (req, res, next) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id);

    if (!workOrder || workOrder.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found'
      });
    }

    // Track status changes
    const oldStatus = workOrder.status;
    
    Object.assign(workOrder, req.body);
    
    // Update timestamps based on status
    if (req.body.status === 'In Progress' && oldStatus !== 'In Progress') {
      workOrder.startDate = new Date();
    } else if (req.body.status === 'Completed' && oldStatus !== 'Completed') {
      workOrder.completionDate = new Date();
      workOrder.actualCost = workOrder.calculateTotalCost();
    }

    await workOrder.save();

    // Update backlog status if linked
    if (workOrder.backlog) {
      const backlogStatus = workOrder.status === 'Completed' ? 'Completed' : 
                           workOrder.status === 'In Progress' ? 'In Progress' : 'Planned';
      
      await Backlog.findByIdAndUpdate(workOrder.backlog, {
        status: backlogStatus,
        progress: workOrder.progress
      });
    }

    // Emit socket event
    req.io.emit('workorder:updated', workOrder);

    res.status(200).json({
      success: true,
      data: workOrder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete work order
// @route   DELETE /api/workorders/:id
// @access  Private (Admin only)
exports.deleteWorkOrder = async (req, res, next) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id);

    if (!workOrder || workOrder.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found'
      });
    }

    workOrder.isDeleted = true;
    await workOrder.save();

    // Update backlog if linked
    if (workOrder.backlog) {
      await Backlog.findByIdAndUpdate(workOrder.backlog, {
        workOrder: null,
        status: 'Open'
      });
    }

    // Emit socket event
    req.io.emit('workorder:deleted', workOrder._id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get auto work order rules
// @route   GET /api/workorders/rules
// @access  Private
exports.getAutoRules = async (req, res, next) => {
  try {
    const rules = await AutoWorkOrderRule.find({ isDeleted: false })
      .populate('equipment', 'name code')
      .populate('createdBy', 'name');

    res.status(200).json({
      success: true,
      count: rules.length,
      data: rules
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create auto work order rule
// @route   POST /api/workorders/rules
// @access  Private (Admin/Supervisor)
exports.createAutoRule = async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id;
    
    // Generate unique code
    const count = await AutoWorkOrderRule.countDocuments();
    req.body.code = `RULE-${String(count + 1).padStart(4, '0')}`;

    const rule = await AutoWorkOrderRule.create(req.body);

    res.status(201).json({
      success: true,
      data: rule
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update auto work order rule
// @route   PUT /api/workorders/rules/:id
// @access  Private (Admin/Supervisor)
exports.updateAutoRule = async (req, res, next) => {
  try {
    const rule = await AutoWorkOrderRule.findById(req.params.id);

    if (!rule || rule.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Rule not found'
      });
    }

    Object.assign(rule, req.body);
    await rule.save();

    res.status(200).json({
      success: true,
      data: rule
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Trigger auto work order generation
// @route   POST /api/workorders/auto-generate
// @access  Private (Admin/Supervisor)
exports.triggerAutoGeneration = async (req, res, next) => {
  try {
    const { checkAutoWorkOrders } = require('../services/autoWorkOrderService');
    await checkAutoWorkOrders();

    res.status(200).json({
      success: true,
      message: 'Auto work order generation triggered successfully'
    });
  } catch (error) {
    next(error);
  }
};