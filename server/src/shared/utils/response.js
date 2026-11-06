const successResponse = (res, data, statusCode = 200, meta = null) => {
  const response = {
    success: true,
    data,
  };
  if (meta) {
    response.meta = meta;
  }
  return res.status(statusCode).json(response);
};

const errorResponse = (
  res,
  statusCode,
  code,
  message,
  details = null,
  requestId = null,
) => {
  const response = {
    success: false,
    error: {
      code,
      message,
    },
  };
  if (details) {
    response.error.details = details;
  }
  if (requestId) {
    response.requestId = requestId;
  }
  return res.status(statusCode).json(response);
};

module.exports = {
  successResponse,
  errorResponse,
};
