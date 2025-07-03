// backend/scripts/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectDB } = require('../config/database');

// Import models
const User = require('../models/User');
const Equipment = require('../models/Equipment');
const InspectionTemplate = require('../models/InspectionTemplate');

const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Equipment.deleteMany({});
    await InspectionTemplate.deleteMany({});

    // Create users
    console.log('Creating users...');
    const users = await User.create([
      {
        name: 'Admin User',
        username: 'admin',
        email: 'admin@mms.com',
        password: 'admin123',
        role: 'Administrator',
        department: 'Maintenance',
        status: 'Active'
      },
      {
        name: 'Department Manager',
        username: 'manager',
        email: 'manager@mms.com',
        password: 'manager123',
        role: 'Department Head',
        department: 'Operations',
        status: 'Active'
      },
      {
        name: 'Maintenance Supervisor',
        username: 'supervisor',
        email: 'supervisor@mms.com',
        password: 'super123',
        role: 'Supervisor',
        department: 'Maintenance',
        status: 'Active'
      },
      {
        name: 'Field Technician',
        username: 'technician',
        email: 'tech@mms.com',
        password: 'tech123',
        role: 'Field Technician',
        department: 'Maintenance',
        status: 'Active'
      }
    ]);

    // Create equipment hierarchy
    console.log('Creating equipment...');
    
    // Plant level
    const plant = await Equipment.create({
      code: 'PLANT-001',
      name: 'Main Manufacturing Plant',
      type: 'plant',
      level: 1,
      criticality: 'A',
      location: 'Industrial Area, Sector 1',
      status: 'Active',
      description: 'Primary manufacturing facility',
      healthScore: 95,
      createdBy: users[0]._id
    });

    // Equipment level
    const equipment = await Equipment.create([
      {
        code: 'HVAC-001',
        name: 'HVAC System - Building A',
        type: 'equipment',
        level: 2,
        parent: plant._id,
        criticality: 'B',
        location: 'Building A, Floor 1',
        status: 'Active',
        manufacturer: 'Carrier',
        model: 'XC-5000',
        serialNumber: 'CAR2023001',
        runningHours: 1500,
        nextMaintenanceHours: 2000,
        healthScore: 92,
        createdBy: users[0]._id
      },
      {
        code: 'PUMP-001',
        name: 'Water Circulation Pump 1',
        type: 'equipment',
        level: 2,
        parent: plant._id,
        criticality: 'A',
        location: 'Pump Room 1',
        status: 'Active',
        manufacturer: 'Grundfos',
        model: 'CR-64',
        serialNumber: 'GRF2023001',
        runningHours: 3200,
        nextMaintenanceHours: 4000,
        healthScore: 88,
        createdBy: users[0]._id
      },
      {
        code: 'COMP-001',
        name: 'Air Compressor 1',
        type: 'equipment',
        level: 2,
        parent: plant._id,
        criticality: 'A',
        location: 'Compressor Room',
        status: 'Active',
        manufacturer: 'Atlas Copco',
        model: 'GA-55',
        serialNumber: 'AC2023001',
        runningHours: 2800,
        nextMaintenanceHours: 3000,
        healthScore: 85,
        createdBy: users[0]._id
      }
    ]);

    // Update plant children
    await Equipment.findByIdAndUpdate(plant._id, {
      children: equipment.map(e => e._id)
    });

    // Create inspection templates
    console.log('Creating inspection templates...');
    await InspectionTemplate.create([
      {
        name: 'Standard Equipment Inspection',
        equipmentTypes: ['equipment'],
        safetyChecks: [
          'Verify lockout/tagout',
          'Check PPE requirements',
          'Ensure area is clear of hazards'
        ],
        checkpoints: [
          {
            id: 'visual-check',
            name: 'Visual Inspection',
            type: 'observation',
            mandatory: true,
            parameters: ['Leaks', 'Corrosion', 'Damage', 'Cleanliness']
          },
          {
            id: 'temperature',
            name: 'Operating Temperature',
            type: 'measurement',
            mandatory: true,
            unit: '°C',
            normalRange: { min: 20, max: 80 }
          },
          {
            id: 'vibration',
            name: 'Vibration Level',
            type: 'measurement',
            mandatory: false,
            unit: 'mm/s',
            normalRange: { min: 0, max: 5 }
          },
          {
            id: 'noise',
            name: 'Noise Level',
            type: 'measurement',
            mandatory: false,
            unit: 'dB',
            normalRange: { min: 0, max: 85 }
          }
        ],
        isActive: true,
        createdBy: users[0]._id
      },
      {
        name: 'Pump Inspection Template',
        equipmentTypes: ['equipment'],
        safetyChecks: [
          'Verify pump isolation',
          'Check pressure relief valves',
          'Ensure proper ventilation'
        ],
        checkpoints: [
          {
            id: 'flow-rate',
            name: 'Flow Rate',
            type: 'measurement',
            mandatory: true,
            unit: 'm³/h',
            normalRange: { min: 50, max: 150 }
          },
          {
            id: 'pressure',
            name: 'Discharge Pressure',
            type: 'measurement',
            mandatory: true,
            unit: 'bar',
            normalRange: { min: 2, max: 8 }
          },
          {
            id: 'seal-check',
            name: 'Mechanical Seal Condition',
            type: 'observation',
            mandatory: true,
            parameters: ['No leaks', 'Minor leaks', 'Major leaks']
          }
        ],
        isActive: true,
        createdBy: users[0]._id
      }
    ]);

    console.log('✅ Database seeded successfully!');
    console.log('\nDemo accounts created:');
    console.log('Admin: admin / admin123');
    console.log('Manager: manager / manager123');
    console.log('Supervisor: supervisor / super123');
    console.log('Technician: technician / tech123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seed
seedDatabase();