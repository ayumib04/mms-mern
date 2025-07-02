// backend/routes/backlogs.js
const express = require('express');
const router = express.Router();
const {
  getBacklogs,
  createBacklog,
  updateBacklog,
  bulkAssignBacklogs,
  generateWorkOrders
} = require('../controllers/backlogController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getBacklogs)
  .post(createBacklog);

router.post('/bulk-assign', bulkAssignBacklogs);
router.post('/generate-workorders', generateWorkOrders);

router.route('/:id')
  .put(updateBacklog);

module.exports = router;
