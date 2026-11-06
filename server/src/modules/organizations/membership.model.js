const mongoose = require('mongoose');
const { MEMBERSHIP_STATUSES } = require('../../shared/constants/statuses');

const membershipSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(MEMBERSHIP_STATUSES),
      default: MEMBERSHIP_STATUSES.ACTIVE,
      index: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    invitationToken: {
      type: String,
      default: null,
      index: true,
    },
    invitationExpiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

membershipSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Membership', membershipSchema);
