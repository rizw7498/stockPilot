const Customer = require("./customer.model");
const { successResponse } = require("../../shared/utils/response");
const { NotFoundError } = require("../../shared/errors");

const listCustomers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status = "ACTIVE" } = req.query;
    const query = { organizationId: req.organizationId };

    if (status && status !== "ALL") {
      query.status = status;
    }

    if (search) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [customers, total] = await Promise.all([
      Customer.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Customer.countDocuments(query),
    ]);

    return successResponse(res, customers, 200, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (error) {
    next(error);
  }
};

const getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!customer) throw new NotFoundError("Customer not found");
    return successResponse(res, customer);
  } catch (error) {
    next(error);
  }
};

const createCustomer = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      billingAddress,
      shippingAddress,
      creditLimitMinor,
    } = req.body;
    const customer = await Customer.create({
      organizationId: req.organizationId,
      name: name.trim(),
      email: email ? email.toLowerCase().trim() : "",
      phone: phone ? phone.trim() : "",
      billingAddress: billingAddress || {},
      shippingAddress: shippingAddress || {},
      creditLimitMinor:
        creditLimitMinor !== undefined ? Math.round(creditLimitMinor) : 0,
    });
    return successResponse(res, customer, 201);
  } catch (error) {
    next(error);
  }
};

const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!customer) throw new NotFoundError("Customer not found");

    const fields = [
      "name",
      "email",
      "phone",
      "billingAddress",
      "shippingAddress",
      "creditLimitMinor",
      "status",
    ];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        customer[field] = req.body[field];
      }
    });

    await customer.save();
    return successResponse(res, customer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
};
