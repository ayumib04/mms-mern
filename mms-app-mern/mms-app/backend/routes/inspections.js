// backend/routes/inspections.js
const express = require('express');
const router = express.Router();
const {
  getInspections,
  getInspectionById,
  createInspection,
  updateInspectionJourney,
  completeInspection,
  getTemplates,
  createTemplate,
  updateTemplate
} = require('../controllers/inspectionController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getInspections)
  .post(createInspection);

router.route('/templates')
  .get(getTemplates)
  .post(authorize('Administrator', 'Supervisor'), createTemplate);

router.route('/templates/:id')
  .put(authorize('Administrator', 'Supervisor'), updateTemplate);

router.route('/:id')
  .get(getInspectionById);

router.put('/:id/journey', updateInspectionJourney);
router.post('/:id/complete', completeInspection);

module.exports = router;
