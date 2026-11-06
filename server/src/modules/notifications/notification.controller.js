const Notification = require('./notification.model');
const { successResponse } = require('../../shared/utils/response');

const listNotifications = async (req, res, next) => {
  try {
    const { unreadOnly } = req.query;
    const query = {
      organizationId: req.organizationId,
      $or: [{ userId: req.user._id }, { userId: null }],
    };

    if (unreadOnly === 'true') {
      query.readAt = null;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(30);

    return successResponse(res, notifications);
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        organizationId: req.organizationId,
      },
      { readAt: new Date() },
      { new: true }
    );

    return successResponse(res, notification);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listNotifications,
  markAsRead,
};
