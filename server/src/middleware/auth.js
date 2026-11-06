const { UnauthorizedError } = require('../shared/errors');
const { verifyAccessToken } = require('../shared/utils/jwt');
const User = require('../modules/auth/user.model');

const authMiddleware = async (req, res, next) => {
  try {
    let token = null;

    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new UnauthorizedError('Authentication token missing'));
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId);

    if (!user || user.status !== 'ACTIVE') {
      return next(new UnauthorizedError('User account not found or deactivated'));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authMiddleware;

