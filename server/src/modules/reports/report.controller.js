const Product = require("../products/product.model");
const InventoryBalance = require("../inventory/inventoryBalance.model");
const PurchaseOrder = require("../purchases/purchaseOrder.model");
const SalesOrder = require("../sales/salesOrder.model");
const Invoice = require("../invoices/invoice.model");
const { successResponse } = require("../../shared/utils/response");

const getDashboardSummary = async (req, res, next) => {
  try {
    const orgId = req.organizationId;

    const [
      totalProducts,
      openPurchaseOrders,
      openSalesOrders,
      unpaidInvoices,
      allBalances,
      allProducts,
    ] = await Promise.all([
      Product.countDocuments({ organizationId: orgId, status: "ACTIVE" }),
      PurchaseOrder.countDocuments({
        organizationId: orgId,
        status: {
          $in: ["DRAFT", "SUBMITTED", "ORDERED", "PARTIALLY_RECEIVED"],
        },
      }),
      SalesOrder.countDocuments({
        organizationId: orgId,
        status: {
          $in: ["DRAFT", "CONFIRMED", "RESERVED", "PARTIALLY_FULFILLED"],
        },
      }),
      Invoice.aggregate([
        {
          $match: {
            organizationId: orgId,
            status: { $in: ["ISSUED", "PARTIALLY_PAID"] },
          },
        },
        {
          $group: {
            _id: null,
            totalDue: { $sum: "$balanceDueMinor" },
            count: { $sum: 1 },
          },
        },
      ]),
      InventoryBalance.find({ organizationId: orgId }),
      Product.find({ organizationId: orgId, status: "ACTIVE" }).select(
        "_id costMinor priceMinor reorderLevel name sku",
      ),
    ]);

    // Product lookup map
    const productMap = {};
    allProducts.forEach((p) => {
      productMap[p._id.toString()] = p;
    });

    let totalValuationMinor = 0;
    const productStockTotals = {};

    allBalances.forEach((b) => {
      const pId = b.productId.toString();
      const prod = productMap[pId];
      if (prod) {
        totalValuationMinor += (b.onHand || 0) * (prod.costMinor || 0);

        if (!productStockTotals[pId]) {
          productStockTotals[pId] = {
            onHand: 0,
            reserved: 0,
            reorderLevel: prod.reorderLevel || 10,
          };
        }
        productStockTotals[pId].onHand += b.onHand || 0;
        productStockTotals[pId].reserved += b.reserved || 0;
      }
    });

    let lowStockCount = 0;
    Object.values(productStockTotals).forEach((st) => {
      const available = Math.max(0, st.onHand - st.reserved);
      if (available <= st.reorderLevel) {
        lowStockCount++;
      }
    });

    // Recent 5 sales orders
    const recentOrders = await SalesOrder.find({ organizationId: orgId })
      .populate("customerId", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    return successResponse(res, {
      kpis: {
        totalProducts,
        totalValuationMinor,
        lowStockCount,
        openPurchaseOrders,
        openSalesOrders,
        outstandingReceivablesMinor:
          unpaidInvoices.length > 0 ? unpaidInvoices[0].totalDue : 0,
      },
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
};

const getStockValuationReport = async (req, res, next) => {
  try {
    const orgId = req.organizationId;
    const balances = await InventoryBalance.find({ organizationId: orgId })
      .populate("productId", "name sku unit costMinor priceMinor categoryId")
      .populate("warehouseId", "name code");

    let totalValuationMinor = 0;
    let totalOnHandUnits = 0;

    const valuationList = balances.map((b) => {
      const cost = b.productId ? b.productId.costMinor || 0 : 0;
      const val = (b.onHand || 0) * cost;
      totalValuationMinor += val;
      totalOnHandUnits += b.onHand || 0;

      return {
        balanceId: b._id,
        product: b.productId,
        warehouse: b.warehouseId,
        onHand: b.onHand,
        reserved: b.reserved,
        available: Math.max(0, b.onHand - b.reserved),
        unitCostMinor: cost,
        valuationMinor: val,
      };
    });

    return successResponse(res, {
      totalValuationMinor,
      totalOnHandUnits,
      items: valuationList,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary,
  getStockValuationReport,
};
