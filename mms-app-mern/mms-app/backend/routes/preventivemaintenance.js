// backend/routes/preventivemaintenance.js
const express = require('express');
const router = express.Router();
const {
  getPMSchedules,
  getPMScheduleById,
  createPMSchedule,
  updatePMSchedule,
  completePMSchedule,
  autoGeneratePMSchedules
} = require('../controllers/pmController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getPMSchedules)
  .post(createPMSchedule);

router.post('/auto-generate', authorize('Administrator', 'Supervisor'), autoGeneratePMSchedules);

router.route('/:id')
  .get(getPMScheduleById)
  .put(updatePMSchedule);

router.post('/:id/complete', completePMSchedule);

module.exports = router;
