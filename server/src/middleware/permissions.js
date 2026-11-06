const { ForbiddenError } = require('../shared/errors');

const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    // Super Admin bypasses all individual permission checks
    if (req.user && req.user.isSuperAdmin) {
      return next();
    }

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

const requireSuperAdmin = (req, res, next) => {
  if (!req.user || !req.user.isSuperAdmin) {
    return next(new ForbiddenError('Access restricted to Super Admin only'));
  }
  next();
};

module.exports = {
  requirePermission,
  requireSuperAdmin,
};
