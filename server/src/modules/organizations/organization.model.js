const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: 150,
    },
    slug: {
      type: String,
      required: [true, 'Organization slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    currency: {
      type: String,
      default: 'USD',
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
    },
    timezone: {
      type: String,
      default: 'UTC',
      trim: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'TRIAL'],
      default: 'ACTIVE',
      index: true,
    },
    settings: {
      reserveOnDraft: { type: Boolean, default: false },
      allowNegativeStock: { type: Boolean, default: false },
      lowStockNotificationEmail: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Organization', organizationSchema);
