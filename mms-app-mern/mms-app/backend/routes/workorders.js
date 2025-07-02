// backend/routes/workorders.js
const express = require('express');
const router = express.Router();
const {
  getWorkOrders,
  getWorkOrderById,
  createWorkOrder,
  updateWorkOrder,
  deleteWorkOrder,
  getAutoRules,
  createAutoRule,
  updateAutoRule,
  triggerAutoGeneration
} = require('../controllers/workOrderController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getWorkOrders)
  .post(createWorkOrder);

router.post('/auto-generate', authorize('Administrator', 'Supervisor'), triggerAutoGeneration);

router.route('/rules')
  .get(getAutoRules)
  .post(authorize('Administrator', 'Supervisor'), createAutoRule);

router.route('/rules/:id')
  .put(authorize('Administrator', 'Supervisor'), updateAutoRule);

router.route('/:id')
  .get(getWorkOrderById)
  .put(updateWorkOrder)
  .delete(authorize('Administrator'), deleteWorkOrder);

module.exports = router;
