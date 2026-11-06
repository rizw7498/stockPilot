const { ForbiddenError, UnauthorizedError } = require('../shared/errors');
const Membership = require('../modules/organizations/membership.model');
const Organization = require('../modules/organizations/organization.model');
const Role = require('../modules/organizations/role.model');

const tenantMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new UnauthorizedError('User authentication required before tenant resolution'));
    }

    const requestedOrgId = req.headers['x-organization-id'] || req.query.organizationId;
    let query = {
      userId: req.user._id,
      status: 'ACTIVE',
    };

    if (requestedOrgId) {
      query.organizationId = requestedOrgId;
    } else if (req.user.defaultOrganizationId) {
      query.organizationId = req.user.defaultOrganizationId;
    }

    let membership = await Membership.findOne(query).populate('roleId');

    // If no membership found by defaultOrg, fallback to any active membership
    if (!membership && !requestedOrgId) {
      membership = await Membership.findOne({
        userId: req.user._id,
        status: 'ACTIVE',
      }).populate('roleId');
    }

    if (!membership) {
      return next(new ForbiddenError('No active organization membership found for this user'));
    }

    // Verify organization itself is active
    const organization = await Organization.findById(membership.organizationId);
    if (!organization || organization.status === 'SUSPENDED') {
      return next(new ForbiddenError('The organization is suspended or inactive'));
    }

    req.organization = organization;
    req.organizationId = organization._id;
    req.membership = membership;
    req.role = membership.roleId;
    req.rolePermissions = membership.roleId ? membership.roleId.permissions || [] : [];

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = tenantMiddleware;

