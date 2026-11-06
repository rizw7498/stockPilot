const { ForbiddenError } = require('../shared/errors');

const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.rolePermissions) {
      return next(new ForbiddenError('No permissions assigned to this session'));
    }

    const hasAll = requiredPermissions.every((perm) =>
      req.rolePermissions.includes(perm)
    );

    if (!hasAll) {
      return next(
        new ForbiddenError(
          `Permission denied. Required permission: ${requiredPermissions.join(', ')}`
        )
      );
    }

    next();
  };
};

module.exports = {
  requirePermission,
};
