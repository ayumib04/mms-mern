// backend/routes/users.js
const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updatePassword
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getUsers)
  .post(authorize('Administrator'), createUser);

router.route('/:id')
  .get(getUserById)
  .put(authorize('Administrator'), updateUser)
  .delete(authorize('Administrator'), deleteUser);

router.put('/:id/password', updatePassword);

module.exports = router;
