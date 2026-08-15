const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
      match: [
        /^$|^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/,
        'Please enter a valid email address',
      ],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: {
        values: ['Personal', 'Work', 'Family', 'Client', 'Other'],
        message: '{VALUE} is not a supported category',
      },
      default: 'Personal',
    },
    company: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    avatarColor: {
      type: String,
      default: '#3b82f6',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user and name search optimization
contactSchema.index({ user: 1, name: 1 });
contactSchema.index({ user: 1, category: 1 });
contactSchema.index({ user: 1, isFavorite: 1 });

module.exports = mongoose.model('Contact', contactSchema);
