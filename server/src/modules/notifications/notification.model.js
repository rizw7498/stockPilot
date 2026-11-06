const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null means all org staff or targeted
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "LOW_STOCK",
        "PO_APPROVAL",
        "GOODS_RECEIVED",
        "SO_PENDING",
        "SO_DISPATCHED",
        "TRANSFER",
        "ALERT",
      ],
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    entityType: {
      type: String,
      default: "",
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ organizationId: 1, userId: 1, readAt: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
