const { AppError } = require('../shared/errors');
const { errorResponse } = require('../shared/utils/response');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'An unexpected internal server error occurred';
  let details = err.details || null;

  // Handle Mongoose / MongoDB errors
  if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = `Invalid format for resource identifier: ${err.value}`;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  } else if (err.code === 11000) {
    statusCode = 409;
    code = 'CONFLICT';
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `Duplicate value entered for unique property: ${field}`;
    details = { field, value: err.keyValue ? err.keyValue[field] : undefined };
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'UNAUTHENTICATED';
    message = 'Invalid authentication token signature';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired, please log in or refresh';
  }

  if (statusCode === 500 && process.env.NODE_ENV !== 'test') {
    console.error(`[Error] Request ID ${req.id || 'N/A'}:`, err);
  }

  return errorResponse(res, statusCode, code, message, details, req.id);
};

module.exports = errorHandler;

