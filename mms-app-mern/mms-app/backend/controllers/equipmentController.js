// backend/controllers/equipmentController.js
const Equipment = require('../models/Equipment');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const csv = require('csv-parser');
const { Parser } = require('json2csv');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = 'uploads/equipment';
    await fs.mkdir(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: process.env.MAX_FILE_SIZE || 10485760 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /csv|xlsx|xls|json/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only CSV, Excel, and JSON files are allowed'));
    }
  }
});

// @desc    Get all equipment with hierarchy
// @route   GET /api/equipment
// @access  Private
exports.getEquipment = async (req, res, next) => {
  try {
    const {
      search,
      level,
      criticality,
      status,
      parent,
      page = 1,
      limit = 20,
      sort = '-createdAt'
    } = req.query;

    // Build query
    const query = { isDeleted: false };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    if (level) query.level = level;
    if (criticality) query.criticality = criticality;
    if (status) query.status = status;
    if (parent) query.parent = parent;

    // Execute query with pagination
    const total = await Equipment.countDocuments(query);
    const equipment = await Equipment.find(query)
      .populate('parent', 'name code')
      .populate('createdBy', 'name')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.status(200).json({
      success: true,
      count: equipment.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: equipment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get equipment hierarchy
// @route   GET /api/equipment/hierarchy
// @access  Private
exports.getEquipmentHierarchy = async (req, res, next) => {
  try {
    const buildHierarchy = async (parentId = null) => {
      const equipment = await Equipment.find({ parent: parentId, isDeleted: false })
        .populate('createdBy', 'name')
        .sort('name');
      
      const hierarchy = [];
      
      for (const eq of equipment) {
        const children = await buildHierarchy(eq._id);
        hierarchy.push({
          ...eq.toObject(),
          children
        });
      }
      
      return hierarchy;
    };

    const hierarchy = await buildHierarchy();

    res.status(200).json({
      success: true,
      data: hierarchy
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single equipment
// @route   GET /api/equipment/:id
// @access  Private
exports.getEquipmentById = async (req, res, next) => {
  try {
    const equipment = await Equipment.findById(req.params.id)
      .populate('parent', 'name code')
      .populate('children', 'name code type level')
      .populate('createdBy', 'name');

    if (!equipment || equipment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: equipment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create equipment
// @route   POST /api/equipment
// @access  Private
exports.createEquipment = async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id;
    
    // Generate unique code if not provided
    if (!req.body.code) {
      const prefix = req.body.type.toUpperCase().substring(0, 3);
      const count = await Equipment.countDocuments({ type: req.body.type });
      req.body.code = `${prefix}-${String(count + 1).padStart(4, '0')}`;
    }

    const equipment = await Equipment.create(req.body);

    // Update parent's children array
    if (equipment.parent) {
      const parent = await Equipment.findById(equipment.parent);
      if (parent) {
        await parent.updateChildren();
      }
    }

    // Emit socket event
    req.io.emit('equipment:created', equipment);

    res.status(201).json({
      success: true,
      data: equipment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update equipment
// @route   PUT /api/equipment/:id
// @access  Private
exports.updateEquipment = async (req, res, next) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment || equipment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    // Check if parent is being changed
    const oldParent = equipment.parent;
    
    Object.assign(equipment, req.body);
    await equipment.save();

    // Update children arrays if parent changed
    if (oldParent !== equipment.parent) {
      if (oldParent) {
        const parent = await Equipment.findById(oldParent);
        if (parent) await parent.updateChildren();
      }
      if (equipment.parent) {
        const parent = await Equipment.findById(equipment.parent);
        if (parent) await parent.updateChildren();
      }
    }

    // Emit socket event
    req.io.emit('equipment:updated', equipment);

    res.status(200).json({
      success: true,
      data: equipment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete equipment (soft delete)
// @route   DELETE /api/equipment/:id
// @access  Private (Admin only)
exports.deleteEquipment = async (req, res, next) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment || equipment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    // Check if equipment has children
    const hasChildren = await Equipment.exists({ parent: equipment._id, isDeleted: false });
    
    if (hasChildren) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete equipment with child components'
      });
    }

    equipment.isDeleted = true;
    await equipment.save();

    // Update parent's children array
    if (equipment.parent) {
      const parent = await Equipment.findById(equipment.parent);
      if (parent) await parent.updateChildren();
    }

    // Emit socket event
    req.io.emit('equipment:deleted', equipment._id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Import equipment from file
// @route   POST /api/equipment/import
// @access  Private (Admin only)
exports.importEquipment = [
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Please upload a file'
        });
      }

      // Process file based on type
      const fileType = path.extname(req.file.originalname).toLowerCase();
      let equipmentData = [];

      if (fileType === '.csv') {
        // Process CSV file
        // Implementation for CSV parsing
      } else if (fileType === '.json') {
        const fileContent = await fs.readFile(req.file.path, 'utf8');
        equipmentData = JSON.parse(fileContent);
      }

      // Validate and create equipment
      const created = [];
      const errors = [];

      for (const data of equipmentData) {
        try {
          data.createdBy = req.user.id;
          const equipment = await Equipment.create(data);
          created.push(equipment);
        } catch (error) {
          errors.push({ data, error: error.message });
        }
      }

      // Clean up uploaded file
      await fs.unlink(req.file.path);

      res.status(200).json({
        success: true,
        created: created.length,
        errors: errors.length,
        data: { created, errors }
      });
    } catch (error) {
      // Clean up file on error
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      next(error);
    }
  }
];

// @desc    Export equipment data
// @route   GET /api/equipment/export
// @access  Private
exports.exportEquipment = async (req, res, next) => {
  try {
    const { format = 'csv', ...filters } = req.query;
    
    // Build query
    const query = { isDeleted: false };
    if (filters.level) query.level = filters.level;
    if (filters.criticality) query.criticality = filters.criticality;
    if (filters.status) query.status = filters.status;

    const equipment = await Equipment.find(query)
      .populate('parent', 'name code')
      .populate('createdBy', 'name');

    // Transform data for export
    const exportData = equipment.map(eq => ({
      code: eq.code,
      name: eq.name,
      type: eq.type,
      level: eq.level,
      parent: eq.parent?.name || '',
      criticality: eq.criticality,
      location: eq.location,
      status: eq.status,
      manufacturer: eq.manufacturer || '',
      model: eq.model || '',
      serialNumber: eq.serialNumber || '',
      healthScore: eq.healthScore,
      runningHours: eq.runningHours,
      createdBy: eq.createdBy?.name || '',
      createdAt: eq.createdAt
    }));

    if (format === 'csv') {
      const parser = new Parser();
      const csv = parser.parse(exportData);
      
      res.header('Content-Type', 'text/csv');
      res.attachment(`equipment_export_${Date.now()}.csv`);
      return res.send(csv);
    } else if (format === 'json') {
      res.header('Content-Type', 'application/json');
      res.attachment(`equipment_export_${Date.now()}.json`);
      return res.json(exportData);
    }

    res.status(400).json({
      success: false,
      message: 'Invalid export format'
    });
  } catch (error) {
    next(error);
  }
};
