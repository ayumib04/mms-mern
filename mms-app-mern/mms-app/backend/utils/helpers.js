// backend/utils/helpers.js
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Generate unique filename
exports.generateUniqueFilename = (originalName) => {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `${timestamp}-${random}${ext}`;
};

// Format currency
exports.formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Calculate date difference
exports.dateDiff = (date1, date2, unit = 'days') => {
  const diff = Math.abs(date2 - date1);
  const conversions = {
    milliseconds: 1,
    seconds: 1000,
    minutes: 60000,
    hours: 3600000,
    days: 86400000,
    weeks: 604800000,
    months: 2628000000,
    years: 31536000000
  };
  
  return Math.floor(diff / conversions[unit]);
};

// Generate report filename
exports.generateReportFilename = (reportType, format = 'pdf') => {
  const date = new Date().toISOString().split('T')[0];
  return `${reportType}_report_${date}.${format}`;
};

// Parse CSV data
exports.parseCSV = (csvData) => {
  const lines = csvData.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }
  }

  return { headers, data };
};

// Sanitize filename
exports.sanitizeFilename = (filename) => {
  return filename.replace(/[^a-z0-9.-]/gi, '_').toLowerCase();
};

// Calculate health score
exports.calculateHealthScore = (equipment) => {
  let score = 100;
  
  // Deduct based on overdue maintenance
  if (equipment.runningHours > equipment.nextMaintenanceHours) {
    const overdue = equipment.runningHours - equipment.nextMaintenanceHours;
    score -= Math.min(overdue / 10, 30);
  }
  
  // Deduct based on age
  if (equipment.commissionDate) {
    const ageYears = this.dateDiff(equipment.commissionDate, new Date(), 'years');
    score -= Math.min(ageYears * 2, 20);
  }
  
  // Deduct based on maintenance cost
  if (equipment.maintenanceCost > 100000) {
    score -= 10;
  }
  
  return Math.max(Math.round(score), 0);
};

// Group by key
exports.groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) result[group] = [];
    result[group].push(item);
    return result;
  }, {});
};

// Deep clone object
exports.deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Paginate array
exports.paginate = (array, page = 1, limit = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    data: array.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      total: array.length,
      pages: Math.ceil(array.length / limit)
    }
  };
};

// Generate color from string
exports.stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const h = hash % 360;
  return `hsl(${h}, 70%, 50%)`;
};

// Format duration
exports.formatDuration = (hours) => {
  if (hours < 1) {
    return `${Math.round(hours * 60)} minutes`;
  } else if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days} day${days !== 1 ? 's' : ''}${remainingHours > 0 ? ` ${remainingHours}h` : ''}`;
  }
};

// Check if maintenance is overdue
exports.isMaintenanceOverdue = (equipment) => {
  if (!equipment.nextMaintenance) return false;
  return new Date(equipment.nextMaintenance) < new Date();
};

// Calculate priority score
exports.calculatePriorityScore = (item) => {
  const priorityWeights = { P1: 4, P2: 3, P3: 2, P4: 1 };
  const criticalityWeights = { A: 3, B: 2, C: 1 };
  
  let score = priorityWeights[item.priority] || 1;
  
  if (item.equipment?.criticality) {
    score *= criticalityWeights[item.equipment.criticality] || 1;
  }
  
  // Add urgency based on due date
  if (item.dueDate) {
    const daysUntilDue = this.dateDiff(new Date(), new Date(item.dueDate), 'days');
    if (daysUntilDue < 0) score *= 2; // Overdue
    else if (daysUntilDue < 7) score *= 1.5; // Due soon
  }
  
  return score;
};