# MERN Maintenance Management System

A comprehensive maintenance management system built with MongoDB, Express.js, React.js, and Node.js (MERN stack) for industrial equipment maintenance, inspections, and work order management.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Installation](#installation)
- [Configuration](#configuration)
- [Security](#security)
- [Performance Optimizations](#performance-optimizations)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### Core Functionality
- **Equipment Management**: Hierarchical equipment tracking with health scoring
- **Inspection System**: Template-based inspections with multi-step journey
- **Work Order Management**: Auto-generation based on running hours and conditions
- **Preventive Maintenance**: Scheduled maintenance tracking and notifications
- **Analytics Dashboard**: Real-time insights and reporting

### Technical Features
- **Authentication & Authorization**: JWT-based with role-based access control
- **Real-time Updates**: WebSocket integration for live notifications
- **Background Jobs**: Automated scheduling and alerts
- **Data Export**: CSV and PDF export functionality
- **File Management**: Document and image upload support

## 🛠 Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Socket.io** - Real-time communication
- **Bcrypt** - Password hashing

### Frontend
- **React.js** - UI library
- **Redux Toolkit/Zustand** - State management
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Formik + Yup** - Form validation
- **Socket.io-client** - WebSocket client

### DevOps
- **Docker** - Containerization
- **Nginx** - Reverse proxy
- **PM2** - Process management
- **Winston** - Logging

## 📁 Project Structure

```
mms-mern/
├── backend/
│   ├── config/
│   │   ├── database.js
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Equipment.js
│   │   ├── Inspection.js
│   │   ├── InspectionTemplate.js
│   │   ├── Backlog.js
│   │   ├── WorkOrder.js
│   │   ├── PreventiveMaintenance.js
│   │   └── AutoWorkOrderRule.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── equipment.js
│   │   ├── inspections.js
│   │   ├── backlogs.js
│   │   ├── workorders.js
│   │   ├── preventivemaintenance.js
│   │   └── analytics.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── rbac.js
│   │   └── errorHandler.js
│   ├── services/
│   │   ├── autoWorkOrderService.js
│   │   ├── notificationService.js
│   │   └── analyticsService.js
│   ├── controllers/
│   │   └── [controller files]
│   ├── utils/
│   │   ├── validators.js
│   │   └── helpers.js
│   ├── app.js
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── equipment/
│   │   │   ├── inspections/
│   │   │   ├── backlogs/
│   │   │   ├── workorders/
│   │   │   ├── preventivemaintenance/
│   │   │   ├── analytics/
│   │   │   ├── users/
│   │   │   └── common/
│   │   ├── services/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   └── package.json
│
├── docker-compose.yml
├── .env.example
└── README.md
```

## 💾 Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  username: String,
  email: String,
  password: String, // bcrypt hashed
  role: String,
  department: String,
  status: String,
  phone: String,
  lastLogin: Date,
  refreshToken: String,
  permissions: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### Equipment Collection
```javascript
{
  _id: ObjectId,
  code: String,
  name: String,
  type: String,
  level: Number,
  parent: ObjectId, // ref to Equipment
  criticality: String,
  location: String,
  status: String,
  description: String,
  manufacturer: String,
  model: String,
  serialNumber: String,
  commissionDate: Date,
  runningHours: Number,
  lastMaintenanceHours: Number,
  nextMaintenanceHours: Number,
  specifications: Object,
  ownership: {
    mechanical: String,
    electrical: String,
    operations: String
  },
  healthScore: Number,
  lastMaintenance: Date,
  nextMaintenance: Date,
  maintenanceCost: Number,
  uptimePercentage: Number,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Inspection Collection
```javascript
{
  _id: ObjectId,
  code: String,
  equipmentId: ObjectId,
  templateId: ObjectId,
  type: String,
  scheduledDate: Date,
  status: String,
  assignedTo: ObjectId,
  estimatedDuration: String,
  priority: String,
  healthScoreBefore: Number,
  healthScoreAfter: Number,
  findings: [{
    id: String,
    description: String,
    status: String,
    action: String,
    priority: String,
    timestamp: Date
  }],
  isDraft: Boolean,
  journeyData: {
    safetyChecks: Object,
    checkpoints: Object,
    measurements: Object,
    photos: [Object],
    documents: [Object],
    comments: String,
    finalStatus: String
  },
  resourceTracking: {
    measurementPhase: Object,
    engagementPhase: Object,
    totalTries: Number,
    totalTimeSpent: Number
  },
  escalationSettings: Object,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Work Order Collection
```javascript
{
  _id: ObjectId,
  code: String,
  backlogId: ObjectId,
  title: String,
  description: String,
  equipmentId: ObjectId,
  status: String,
  priority: String,
  type: String,
  woType: String, // 'Auto Generated' or 'User Generated'
  assignedTo: ObjectId,
  createdDate: Date,
  scheduledDate: Date,
  estimatedHours: Number,
  actualHours: Number,
  progress: Number,
  estimatedCost: Number,
  actualCost: Number,
  triggerCondition: Object,
  materials: [Object],
  labor: [Object],
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

## 📡 API Documentation

### Authentication Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| POST | `/api/auth/refresh` | Refresh JWT token |
| GET | `/api/auth/me` | Get current user |

### Equipment Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/equipment` | Get all equipment (with hierarchy support) |
| GET | `/api/equipment/:id` | Get specific equipment |
| POST | `/api/equipment` | Create new equipment |
| PUT | `/api/equipment/:id` | Update equipment |
| DELETE | `/api/equipment/:id` | Delete equipment |
| GET | `/api/equipment/hierarchy/:parentId` | Get equipment hierarchy |
| POST | `/api/equipment/import` | Bulk import equipment |
| GET | `/api/equipment/export` | Export equipment data |

### Inspections Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inspections` | Get all inspections |
| GET | `/api/inspections/:id` | Get specific inspection |
| POST | `/api/inspections` | Create new inspection |
| PUT | `/api/inspections/:id` | Update inspection |
| POST | `/api/inspections/:id/journey` | Start inspection journey |
| PUT | `/api/inspections/:id/journey` | Update inspection journey |
| POST | `/api/inspections/:id/complete` | Complete inspection |
| GET | `/api/inspections/templates` | Get inspection templates |
| POST | `/api/inspections/templates` | Create inspection template |

### Backlogs Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/backlogs` | Get all backlogs |
| POST | `/api/backlogs` | Create new backlog |
| PUT | `/api/backlogs/:id` | Update backlog |
| POST | `/api/backlogs/bulk-assign` | Bulk assign backlogs |
| POST | `/api/backlogs/generate-workorders` | Generate work orders from backlogs |
| DELETE | `/api/backlogs/:id` | Delete backlog |

### Work Orders Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workorders` | Get all work orders |
| POST | `/api/workorders` | Create new work order |
| PUT | `/api/workorders/:id` | Update work order |
| POST | `/api/workorders/auto-generate` | Auto-generate work orders |
| GET | `/api/workorders/rules` | Get auto-generation rules |
| POST | `/api/workorders/rules` | Create auto-generation rule |

### Analytics Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | Get dashboard metrics |
| GET | `/api/analytics/equipment-health` | Get equipment health analytics |
| GET | `/api/analytics/maintenance-trends` | Get maintenance trends |
| GET | `/api/analytics/cost-analysis` | Get cost analysis |
| GET | `/api/analytics/export` | Export analytics data |

## 🚀 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Redis (optional, for caching)
- Docker (optional, for containerization)

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure your .env file with appropriate values

# Run database migrations/seeds (if applicable)
npm run migrate

# Start development server
npm run dev
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm start
```

### Docker Setup
```bash
# Build and run with Docker Compose
docker-compose up --build

# Run in detached mode
docker-compose up -d
```

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
MONGODB_URI=mongodb://localhost:27017/mms-mern
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRE=30d
JWT_REFRESH_EXPIRE=90d

# Server
PORT=5000
NODE_ENV=development

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WEBSOCKET_URL=http://localhost:5000
```

## 🔒 Security

### Implemented Security Measures
- **Input Validation**: All inputs are validated and sanitized
- **Authentication**: JWT-based with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Password Security**: Bcrypt hashing with salt rounds
- **Rate Limiting**: API endpoint protection
- **CORS**: Properly configured cross-origin requests
- **HTTPS**: Enforced in production
- **Environment Variables**: Sensitive data protection
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Proper data encoding

### User Roles
1. **Administrator**: Full system access
2. **Department Head**: Department-level management
3. **Supervisor**: Team management and oversight
4. **Field Technician**: Equipment inspection and maintenance

## ⚡ Performance Optimizations

- **Database Indexing**: Optimized queries on frequently accessed fields
- **Caching**: Redis integration for analytics data
- **Lazy Loading**: Equipment hierarchy and large datasets
- **Pagination**: Efficient data loading
- **Image Optimization**: CDN integration for media files
- **WebSocket Pooling**: Efficient real-time connections
- **Code Splitting**: Optimized bundle sizes

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Coding Standards
- Follow ESLint configuration
- Write unit tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR


## 📞 Support

For support, email ayu.mib04@gmail.com or join our Slack channel.

---

**Note**: This is a comprehensive maintenance management system designed for industrial use. Please ensure proper testing before deploying to production environments.
