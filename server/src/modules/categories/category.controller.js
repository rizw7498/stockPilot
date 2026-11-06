const Category = require("./category.model");
const { successResponse } = require("../../shared/utils/response");
const { NotFoundError, ConflictError } = require("../../shared/errors");

const listCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({
      organizationId: req.organizationId,
    }).populate("parentId", "name");

    return successResponse(res, categories);
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, description, parentId } = req.body;
    const existing = await Category.findOne({
      organizationId: req.organizationId,
      name: new RegExp(`^${name.trim()}$`, "i"),
    });
    if (existing) {
      throw new ConflictError("A category with this name already exists");
    }

    const category = await Category.create({
      organizationId: req.organizationId,
      name: name.trim(),
      description: description || "",
      parentId: parentId || null,
    });

    return successResponse(res, category, 201);
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { name, description, parentId, status } = req.body;
    const category = await Category.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!category) {
      throw new NotFoundError("Category not found");
    }

    if (name) category.name = name.trim();
    if (description !== undefined) category.description = description.trim();
    if (parentId !== undefined) category.parentId = parentId || null;
    if (status) category.status = status;

    await category.save();
    return successResponse(res, category);
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!category) {
      throw new NotFoundError("Category not found");
    }
    return successResponse(res, { message: "Category removed successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
