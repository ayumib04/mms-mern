// backend/routes/equipment.js
const express = require('express');
const router = express.Router();
const {
  getEquipment,
  getEquipmentHierarchy,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  importEquipment,
  exportEquipment
} = require('../controllers/equipmentController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getEquipment)
  .post(authorize('Administrator', 'Department Head', 'Supervisor'), createEquipment);

router.get('/hierarchy', getEquipmentHierarchy);
router.get('/export', exportEquipment);
router.post('/import', authorize('Administrator'), importEquipment);

router.route('/:id')
  .get(getEquipmentById)
  .put(authorize('Administrator', 'Department Head', 'Supervisor'), updateEquipment)
  .delete(authorize('Administrator'), deleteEquipment);

module.exports = router;

