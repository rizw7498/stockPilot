const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const requestIdMiddleware = require('./middleware/requestId');
const errorHandler = require('./middleware/errorHandler');
const { NotFoundError } = require('./shared/errors');
const { successResponse } = require('./shared/utils/response');

// Import Module Routes
const authRoutes = require('./modules/auth/auth.routes');
const organizationRoutes = require('./modules/organizations/organization.routes');
const warehouseRoutes = require('./modules/warehouses/warehouse.routes');
const categoryRoutes = require('./modules/categories/category.routes');
const productRoutes = require('./modules/products/product.routes');
const inventoryRoutes = require('./modules/inventory/inventory.routes');
const supplierRoutes = require('./modules/suppliers/supplier.routes');
const customerRoutes = require('./modules/customers/customer.routes');
const purchaseRoutes = require('./modules/purchases/purchase.routes');
const salesRoutes = require('./modules/sales/sales.routes');
const invoiceRoutes = require('./modules/invoices/invoice.routes');
const paymentRoutes = require('./modules/payments/payment.routes');
const returnRoutes = require('./modules/returns/return.routes');
const transferRoutes = require('./modules/transfers/transfer.routes');
const reportRoutes = require('./modules/reports/report.routes');
const auditRoutes = require('./modules/audit/audit.routes');
const notificationRoutes = require('./modules/notifications/notification.routes');

const app = express();

// Security and standard middlewares
app.use(helmet());
app.use(
  cors({
    origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(requestIdMiddleware);

if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  return successResponse(res, {
    status: 'UP',
    name: 'StockPilot API',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// API Routes Mounting
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/organizations', organizationRoutes);
app.use('/api/v1/warehouses', warehouseRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/suppliers', supplierRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/purchase-orders', purchaseRoutes);
app.use('/api/v1/sales-orders', salesRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/returns', returnRoutes);
app.use('/api/v1/transfers', transferRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/audit-logs', auditRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// 404 Route Catcher
app.use((req, res, next) => {
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
});

// Centralized Error Handler Middleware
app.use(errorHandler);

module.exports = app;
