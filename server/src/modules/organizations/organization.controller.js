const Organization = require('./organization.model');
const Membership = require('./membership.model');
const Role = require('./role.model');
const User = require('../auth/user.model');
const { successResponse } = require('../../shared/utils/response');
const { NotFoundError, ConflictError, ValidationError } = require('../../shared/errors');
const { v4: uuidv4 } = require('uuid');

const getCurrentOrganization = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.organizationId);
    if (!org) {
      throw new NotFoundError('Organization not found');
    }
    return successResponse(res, org);
  } catch (error) {
    next(error);
  }
};

const updateOrganization = async (req, res, next) => {
  try {
    const { name, currency, timezone, settings } = req.body;
    const org = await Organization.findById(req.organizationId);
    if (!org) {
      throw new NotFoundError('Organization not found');
    }

    if (name) org.name = name.trim();
    if (currency) org.currency = currency.toUpperCase().trim();
    if (timezone) org.timezone = timezone.trim();
    if (settings) {
      org.settings = { ...org.settings, ...settings };
    }

    await org.save();
    return successResponse(res, org);
  } catch (error) {
    next(error);
  }
};

const listMembers = async (req, res, next) => {
  try {
    const members = await Membership.find({ organizationId: req.organizationId })
      .populate('userId', 'name email status lastLoginAt')
      .populate('roleId', 'name permissions isSystem')
      .sort({ createdAt: -1 });

    return successResponse(res, members);
  } catch (error) {
    next(error);
  }
};

const inviteMember = async (req, res, next) => {
  try {
    const { email, roleId, name } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const role = await Role.findOne({
      _id: roleId,
      organizationId: req.organizationId,
    });
    if (!role) {
      throw new NotFoundError('Specified role not found for this organization');
    }

    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // Create user placeholder with random temporary password until acceptance
      const tempHash = await User.hashPassword(uuidv4());
      user = await User.create({
        name: name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        passwordHash: tempHash,
        status: 'PENDING',
      });
    }

    const existingMembership = await Membership.findOne({
      organizationId: req.organizationId,
      userId: user._id,
    });

    if (existingMembership) {
      throw new ConflictError('User is already a member of this organization');
    }

    const invitationToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const membership = await Membership.create({
      organizationId: req.organizationId,
      userId: user._id,
      roleId: role._id,
      status: user.status === 'PENDING' ? 'INVITED' : 'ACTIVE',
      invitedBy: req.user._id,
      invitationToken,
      invitationExpiresAt: expiresAt,
    });

    return successResponse(
      res,
      {
        membership,
        invitationToken,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

const updateMemberRole = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const { roleId } = req.body;

    const role = await Role.findOne({
      _id: roleId,
      organizationId: req.organizationId,
    });
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    const membership = await Membership.findOne({
      _id: memberId,
      organizationId: req.organizationId,
    });
    if (!membership) {
      throw new NotFoundError('Member record not found');
    }

    membership.roleId = role._id;
    await membership.save();

    return successResponse(res, membership);
  } catch (error) {
    next(error);
  }
};

const listRoles = async (req, res, next) => {
  try {
    const roles = await Role.find({ organizationId: req.organizationId });
    return successResponse(res, roles);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCurrentOrganization,
  updateOrganization,
  listMembers,
  inviteMember,
  updateMemberRole,
  listRoles,
};
