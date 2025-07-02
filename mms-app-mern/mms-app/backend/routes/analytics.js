// backend/routes/analytics.js
const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getEquipmentHealth,
  getMaintenanceTrends,
  getCostAnalysis,
  getPerformanceMetrics,
  getReliabilityMetrics,
  exportAnalytics
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/equipment-health', getEquipmentHealth);
router.get('/maintenance-trends', getMaintenanceTrends);
router.get('/cost-analysis', getCostAnalysis);
router.get('/performance', getPerformanceMetrics);
router.get('/reliability', getReliabilityMetrics);
router.get('/export', exportAnalytics);

module.exports = router;
