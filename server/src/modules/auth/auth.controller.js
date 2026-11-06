const authService = require('./auth.service');
const { successResponse } = require('../../shared/utils/response');
const { setAuthCookies, clearAuthCookies, verifyRefreshToken, generateAccessToken } = require('../../shared/utils/jwt');
const { UnauthorizedError } = require('../../shared/errors');
const User = require('./user.model');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
    return successResponse(res, result, 201);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
    return successResponse(res, result, 200);
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    clearAuthCookies(res);
    return successResponse(res, { message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    let token = req.cookies && req.cookies.refreshToken;
    if (!token && req.body.refreshToken) {
      token = req.body.refreshToken;
    }

    if (!token) {
      throw new UnauthorizedError('Refresh token required');
    }

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.userId);

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedError('User account not found or suspended');
    }

    const newAccessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
    });

    setAuthCookies(res, newAccessToken);

    return successResponse(res, {
      accessToken: newAccessToken,
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const activeOrgId = req.headers['x-organization-id'] || null;
    const result = await authService.getMe(req.user, activeOrgId);
    return successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getMe,
};
