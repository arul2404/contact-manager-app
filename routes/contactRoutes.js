const express = require('express');
const router = express.Router();
const {
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  toggleFavorite,
  getStats,
} = require('../controllers/contactController');
const { protect } = require('../middleware/auth');

// All contact routes require authentication
router.use(protect);

router.route('/stats/summary').get(getStats);
router.route('/').get(getContacts).post(createContact);
router.route('/:id').get(getContactById).put(updateContact).delete(deleteContact);
router.route('/:id/favorite').patch(toggleFavorite);

module.exports = router;
