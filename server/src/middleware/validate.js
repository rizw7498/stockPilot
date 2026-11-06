const { ValidationError } = require("../shared/errors");

const validate = (schema) => (req, res, next) => {
  try {
    if (schema.body && req.body) {
      req.body = schema.body.parse(req.body);
    }
    if (schema.query && req.query) {
      req.query = schema.query.parse(req.query);
    }
    if (schema.params && req.params) {
      req.params = schema.params.parse(req.params);
    }
    next();
  } catch (error) {
    if (error.errors) {
      const details = error.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      }));
      return next(new ValidationError("Request validation failed", details));
    }
    return next(new ValidationError(error.message));
  }
};

module.exports = validate;
