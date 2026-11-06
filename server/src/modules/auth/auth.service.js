const mongoose = require('mongoose');
const User = require('./user.model');
const Organization = require('../organizations/organization.model');
const Role = require('../organizations/role.model');
const Membership = require('../organizations/membership.model');
const Warehouse = require('../warehouses/warehouse.model');
const { ROLES, ROLE_PERMISSIONS_MAP, ALL_PERMISSIONS } = require('../../shared/constants/roles');
const { ConflictError, UnauthorizedError, ValidationError, NotFoundError } = require('../../shared/errors');
const { generateAccessToken, generateRefreshToken } = require('../../shared/utils/jwt');
const { withTransaction } = require('../../shared/utils/transaction');

const register = async ({ name, email, password, organizationName, currency = 'USD' }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new ConflictError('A user with this email address already exists');
  }

  const slug =
    organizationName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-') +
    '-' +
    Math.random().toString(36).substring(2, 6);

  const passwordHash = await User.hashPassword(password);

  return await withTransaction(async (session) => {
    const opts = session ? { session } : {};

    // 1. Create Organization
    const [organization] = await Organization.create(
      [
        {
          name: organizationName.trim(),
          slug,
          currency: currency.toUpperCase(),
        },
      ],
      opts
    );

    // 2. Create User
    const [user] = await User.create(
      [
        {
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
          defaultOrganizationId: organization._id,
        },
      ],
      opts
    );

    // 3. Create Default Roles for this organization
    const rolesToCreate = [
      {
        organizationId: organization._id,
        name: ROLES.ORG_ADMIN,
        permissions: ROLE_PERMISSIONS_MAP[ROLES.ORG_ADMIN],
        isSystem: true,
      },
      {
        organizationId: organization._id,
        name: ROLES.MANAGER,
        permissions: ROLE_PERMISSIONS_MAP[ROLES.MANAGER],
        isSystem: true,
      },
      {
        organizationId: organization._id,
        name: ROLES.INVENTORY_STAFF,
        permissions: ROLE_PERMISSIONS_MAP[ROLES.INVENTORY_STAFF],
        isSystem: true,
      },
      {
        organizationId: organization._id,
        name: ROLES.SALES_STAFF,
        permissions: ROLE_PERMISSIONS_MAP[ROLES.SALES_STAFF],
        isSystem: true,
      },
      {
        organizationId: organization._id,
        name: ROLES.VIEWER,
        permissions: ROLE_PERMISSIONS_MAP[ROLES.VIEWER],
        isSystem: true,
      },
    ];
    const createdRoles = await Role.create(rolesToCreate, opts);
    const adminRole = createdRoles.find((r) => r.name === ROLES.ORG_ADMIN);

    // 4. Create Admin Membership
    const [membership] = await Membership.create(
      [
        {
          organizationId: organization._id,
          userId: user._id,
          roleId: adminRole._id,
          status: 'ACTIVE',
        },
      ],
      opts
    );

    // 5. Create Default Warehouse
    await Warehouse.create(
      [
        {
          organizationId: organization._id,
          code: 'WH-01',
          name: 'Main Warehouse',
          isDefault: true,
          status: 'ACTIVE',
        },
      ],
      opts
    );

    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
    };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
      },
      organization: {
        id: organization._id,
        name: organization.name,
        slug: organization.slug,
        currency: organization.currency,
      },
      membership: {
        id: membership._id,
        role: adminRole.name,
        permissions: adminRole.permissions,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  });
};

const login = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (user.status !== 'ACTIVE') {
    throw new UnauthorizedError('Your account has been deactivated or suspended');
  }

  user.lastLoginAt = new Date();
  await user.save();

  // Find active memberships
  const memberships = await Membership.find({
    userId: user._id,
    status: 'ACTIVE',
  })
    .populate('organizationId')
    .populate('roleId');

  if (memberships.length === 0) {
    throw new UnauthorizedError('No active organizations associated with this account');
  }

  // Active organization: either defaultOrg or first
  let activeMembership =
    memberships.find(
      (m) =>
        user.defaultOrganizationId &&
        m.organizationId &&
        m.organizationId._id.toString() === user.defaultOrganizationId.toString()
    ) || memberships[0];

  const tokenPayload = {
    userId: user._id.toString(),
    email: user.email,
  };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      status: user.status,
    },
    organization: activeMembership.organizationId,
    membership: {
      id: activeMembership._id,
      role: activeMembership.roleId.name,
      permissions: activeMembership.roleId.permissions,
    },
    allMemberships: memberships.map((m) => ({
      organization: m.organizationId,
      role: m.roleId ? m.roleId.name : null,
    })),
    tokens: {
      accessToken,
      refreshToken,
    },
  };
};

const getMe = async (user, organizationId = null) => {
  const memberships = await Membership.find({
    userId: user._id,
    status: 'ACTIVE',
  })
    .populate('organizationId')
    .populate('roleId');

  let activeMembership = null;
  if (organizationId) {
    activeMembership = memberships.find(
      (m) => m.organizationId && m.organizationId._id.toString() === organizationId.toString()
    );
  }
  if (!activeMembership) {
    activeMembership =
      memberships.find(
        (m) =>
          user.defaultOrganizationId &&
          m.organizationId &&
          m.organizationId._id.toString() === user.defaultOrganizationId.toString()
      ) || memberships[0];
  }

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      status: user.status,
      defaultOrganizationId: user.defaultOrganizationId,
    },
    activeOrganization: activeMembership ? activeMembership.organizationId : null,
    activeRole: activeMembership && activeMembership.roleId ? activeMembership.roleId.name : null,
    permissions:
      activeMembership && activeMembership.roleId ? activeMembership.roleId.permissions : [],
    memberships: memberships.map((m) => ({
      id: m._id,
      organization: m.organizationId,
      role: m.roleId ? m.roleId.name : null,
    })),
  };
};

module.exports = {
  register,
  login,
  getMe,
};
