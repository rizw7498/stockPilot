const AuditLog = require('./auditLog.model');
const { successResponse } = require('../../shared/utils/response');

const listAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, entityType } = req.query;
    const query = { organizationId: req.organizationId };

    if (entityType) query.entityType = entityType;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('actorId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      AuditLog.countDocuments(query),
    ]);

    return successResponse(res, logs, 200, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listAuditLogs,
};

