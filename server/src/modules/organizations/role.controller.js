const Role = require('./role.model');
const Membership = require('./membership.model');
const { MODULE_PERMISSIONS, ALL_PERMISSIONS } = require('../../shared/constants/roles');
const { successResponse } = require('../../shared/utils/response');
const { NotFoundError, ConflictError, ValidationError, ForbiddenError } = require('../../shared/errors');

const getPermissionsCatalog = async (req, res, next) => {
  try {
    return successResponse(res, {
      modules: MODULE_PERMISSIONS,
      allPermissions: ALL_PERMISSIONS,
    });
  } catch (error) {
    next(error);
  }
};

const listRoles = async (req, res, next) => {
  try {
    const query = {
      organizationId: req.organizationId,
    };
    const roles = await Role.find(query).sort({ isSystem: -1, createdAt: 1 });
    return successResponse(res, roles);
  } catch (error) {
    next(error);
  }
};

const getRole = async (req, res, next) => {
  try {
    const role = await Role.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!role) {
      throw new NotFoundError('Role not found');
    }
    return successResponse(res, role);
  } catch (error) {
    next(error);
  }
};

const createRole = async (req, res, next) => {
  try {
    const { name, permissions } = req.body;

    // Validate that all permissions are legitimate
    if (!Array.isArray(permissions)) {
      throw new ValidationError('Permissions must be an array of permission keys');
    }

    const invalidPermissions = permissions.filter((p) => !ALL_PERMISSIONS.includes(p));
    if (invalidPermissions.length > 0) {
      throw new ValidationError(
        `Invalid permission keys: ${invalidPermissions.join(', ')}`
      );
    }

    const existingRole = await Role.findOne({
      organizationId: req.organizationId,
      name: name.trim(),
    });

    if (existingRole) {
      throw new ConflictError(`A role named "${name}" already exists in this organization`);
    }

    const newRole = await Role.create({
      organizationId: req.organizationId,
      name: name.trim(),
      permissions,
      isSystem: false,
    });

    return successResponse(res, newRole, 201);
  } catch (error) {
    next(error);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const { name, permissions } = req.body;

    const role = await Role.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    if (name && name.trim() !== role.name) {
      if (role.isSystem && !req.user.isSuperAdmin) {
        throw new ForbiddenError('System role names cannot be modified');
      }
      const existing = await Role.findOne({
        organizationId: req.organizationId,
        name: name.trim(),
        _id: { $ne: role._id },
      });
      if (existing) {
        throw new ConflictError(`A role named "${name}" already exists`);
      }
      role.name = name.trim();
    }

    if (permissions !== undefined) {
      if (!Array.isArray(permissions)) {
        throw new ValidationError('Permissions must be an array of permission keys');
      }
      const invalid = permissions.filter((p) => !ALL_PERMISSIONS.includes(p));
      if (invalid.length > 0) {
        throw new ValidationError(`Invalid permissions: ${invalid.join(', ')}`);
      }
      role.permissions = permissions;
    }

    await role.save();
    return successResponse(res, role);
  } catch (error) {
    next(error);
  }
};

const deleteRole = async (req, res, next) => {
  try {
    const role = await Role.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    if (role.isSystem && !req.user.isSuperAdmin) {
      throw new ForbiddenError('System roles cannot be deleted');
    }

    // Check if any member is assigned to this role
    const activeAssignments = await Membership.countDocuments({
      roleId: role._id,
      status: 'ACTIVE',
    });
    if (activeAssignments > 0) {
      throw new ConflictError(
        `Cannot delete role "${role.name}" because it is currently assigned to ${activeAssignments} user(s). Reassign them first.`
      );
    }

    await Role.findByIdAndDelete(role._id);
    return successResponse(res, { message: `Role "${role.name}" removed successfully` });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPermissionsCatalog,
  listRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
};

