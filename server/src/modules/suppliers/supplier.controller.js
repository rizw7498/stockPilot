const Supplier = require("./supplier.model");
const { successResponse } = require("../../shared/utils/response");
const { NotFoundError } = require("../../shared/errors");

const listSuppliers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status = "ACTIVE" } = req.query;
    const query = { organizationId: req.organizationId };

    if (status && status !== "ALL") {
      query.status = status;
    }

    if (search) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: regex },
        { companyName: regex },
        { email: regex },
        { phone: regex },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [suppliers, total] = await Promise.all([
      Supplier.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Supplier.countDocuments(query),
    ]);

    return successResponse(res, suppliers, 200, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (error) {
    next(error);
  }
};

const getSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!supplier) throw new NotFoundError("Supplier not found");
    return successResponse(res, supplier);
  } catch (error) {
    next(error);
  }
};

const createSupplier = async (req, res, next) => {
  try {
    const { name, companyName, email, phone, address, paymentTerms } = req.body;
    const supplier = await Supplier.create({
      organizationId: req.organizationId,
      name: name.trim(),
      companyName: companyName ? companyName.trim() : "",
      email: email ? email.toLowerCase().trim() : "",
      phone: phone ? phone.trim() : "",
      address: address || {},
      paymentTerms: paymentTerms || "NET_30",
    });
    return successResponse(res, supplier, 201);
  } catch (error) {
    next(error);
  }
};

const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!supplier) throw new NotFoundError("Supplier not found");

    const fields = [
      "name",
      "companyName",
      "email",
      "phone",
      "address",
      "paymentTerms",
      "status",
    ];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        supplier[field] = req.body[field];
      }
    });

    await supplier.save();
    return successResponse(res, supplier);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
};
