const Warehouse = require("./warehouse.model");
const { successResponse } = require("../../shared/utils/response");
const { NotFoundError, ConflictError } = require("../../shared/errors");

const listWarehouses = async (req, res, next) => {
  try {
    const warehouses = await Warehouse.find({
      organizationId: req.organizationId,
    }).sort({ isDefault: -1, createdAt: -1 });

    return successResponse(res, warehouses);
  } catch (error) {
    next(error);
  }
};

const getWarehouse = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!warehouse) {
      throw new NotFoundError("Warehouse not found");
    }
    return successResponse(res, warehouse);
  } catch (error) {
    next(error);
  }
};

const createWarehouse = async (req, res, next) => {
  try {
    const { code, name, address, contactPhone, contactEmail, isDefault } =
      req.body;

    const existingCode = await Warehouse.findOne({
      organizationId: req.organizationId,
      code: code.toUpperCase().trim(),
    });
    if (existingCode) {
      throw new ConflictError(`Warehouse code ${code} is already in use`);
    }

    if (isDefault) {
      await Warehouse.updateMany(
        { organizationId: req.organizationId },
        { isDefault: false },
      );
    }

    const warehouse = await Warehouse.create({
      organizationId: req.organizationId,
      code: code.toUpperCase().trim(),
      name: name.trim(),
      address: address || {},
      contactPhone: contactPhone || "",
      contactEmail: contactEmail || "",
      isDefault: !!isDefault,
    });

    return successResponse(res, warehouse, 201);
  } catch (error) {
    next(error);
  }
};

const updateWarehouse = async (req, res, next) => {
  try {
    const { name, address, contactPhone, contactEmail, isDefault, status } =
      req.body;
    const warehouse = await Warehouse.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!warehouse) {
      throw new NotFoundError("Warehouse not found");
    }

    if (name) warehouse.name = name.trim();
    if (address) warehouse.address = address;
    if (contactPhone !== undefined) warehouse.contactPhone = contactPhone;
    if (contactEmail !== undefined) warehouse.contactEmail = contactEmail;
    if (status) warehouse.status = status;

    if (isDefault && !warehouse.isDefault) {
      await Warehouse.updateMany(
        { organizationId: req.organizationId },
        { isDefault: false },
      );
      warehouse.isDefault = true;
    }

    await warehouse.save();
    return successResponse(res, warehouse);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
};
