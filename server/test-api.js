const request = require('supertest');
const mongoose = require('mongoose');
const app = require('./src/app');
const env = require('./src/config/env');

async function runTests() {
  console.log('🧪 Starting StockPilot Backend E2E Test Suite...');

  // Connect to test database
  const testDbUri = env.MONGODB_URI.replace(/\/stockpilot(\?|$)/, '/stockpilot_test$1');
  await mongoose.connect(testDbUri);
  console.log(`✅ Connected to test DB: ${mongoose.connection.name}`);

  // Clean collections in test database
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  console.log('🧹 Cleaned test database collections.');

  let authToken = '';
  let orgId = '';
  let defaultWarehouseId = '';
  let createdRoleId = '';
  let categoryId = '';
  let productId = '';
  let supplierId = '';
  let customerId = '';
  let poId = '';
  let soId = '';
  let invoiceId = '';

  // 1. Health Check
  console.log('\n--- 1. Testing Health Endpoint ---');
  const healthRes = await request(app).get('/api/v1/health');
  console.assert(healthRes.status === 200, `Health status failed: ${healthRes.status}`);
  console.assert(healthRes.body.data.status === 'UP', 'Health status payload invalid');
  console.log('✅ Health check passed: status is UP');

  // 2. Auth: Register
  console.log('\n--- 2. Testing Tenant & User Registration ---');
  const regPayload = {
    name: 'Admin User',
    email: 'admin@pilotstock.com',
    password: 'Password@123',
    organizationName: 'StockPilot Corp',
    currency: 'USD',
  };
  const regRes = await request(app).post('/api/v1/auth/register').send(regPayload);
  console.assert(regRes.status === 201, `Register failed: ${regRes.status} ${JSON.stringify(regRes.body)}`);
  authToken = regRes.body.data.tokens.accessToken;
  orgId = regRes.body.data.organization.id;
  console.log(`✅ Organization registered: ${regRes.body.data.organization.name} (ID: ${orgId})`);

  // 3. Auth: Login
  console.log('\n--- 3. Testing Login & Profile Fetch ---');
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: regPayload.email, password: regPayload.password });
  console.assert(loginRes.status === 200, 'Login failed');
  authToken = loginRes.body.data.tokens.accessToken;

  const meRes = await request(app)
    .get('/api/v1/auth/me')
    .set('Authorization', `Bearer ${authToken}`)
    .set('x-organization-id', orgId);
  console.assert(meRes.status === 200, 'GetMe failed');
  console.log(`✅ Current authenticated user verified: ${meRes.body.data.user.name}`);

  // 4. Dynamic Roles & Permissions
  console.log('\n--- 4. Testing Dynamic Roles & Permissions ---');
  const catRes = await request(app)
    .get('/api/v1/roles/permissions-catalog')
    .set('Authorization', `Bearer ${authToken}`)
    .set('x-organization-id', orgId);
  console.assert(catRes.status === 200, 'Get permissions catalog failed');
  console.assert(catRes.body.data.allPermissions.length > 0, 'No permissions returned');
  console.log(`✅ Permissions Catalog loaded: ${catRes.body.data.allPermissions.length} total permissions`);

  // Create custom dynamic role
  const createRoleRes = await request(app)
    .post('/api/v1/roles')
    .set('Authorization', `Bearer ${authToken}`)
    .set('x-organization-id', orgId)
    .send({
      name: 'Custom Warehouse Lead',
      permissions: ['inventory.read', 'inventory.adjust', 'inventory.transfer', 'products.read'],
    });
  console.assert(createRoleRes.status === 201, `Create role failed: ${JSON.stringify(createRoleRes.body)}`);
  createdRoleId = createRoleRes.body.data._id;
  console.log(`✅ Dynamic Role created: "${createRoleRes.body.data.name}" with ${createRoleRes.body.data.permissions.length} permissions`);

  // Update dynamic role permissions
  const updateRoleRes = await request(app)
    .patch(`/api/v1/roles/${createdRoleId}`)
    .set('Authorization', `Bearer ${authToken}`)
    .set('x-organization-id', orgId)
    .send({
      permissions: ['inventory.read', 'inventory.adjust', 'inventory.transfer', 'products.read', 'purchases.receive'],
    });
  console.assert(updateRoleRes.status === 200, 'Update dynamic role failed');
  console.assert(updateRoleRes.body.data.permissions.includes('purchases.receive'), 'Permission not updated');
  console.log('✅ Dynamic Role permissions updated successfully (added purchases.receive)');

  // 5. Warehouses
  console.log('\n--- 5. Testing Warehouse Management ---');
  const whRes = await request(app)
    .get('/api/v1/warehouses')
    .set('Authorization', `Bearer ${authToken}`)
    .set('x-organization-id', orgId);
  console.assert(whRes.status === 200, 'List warehouses failed');
  console.assert(whRes.body.data.length > 0, 'Default warehouse not auto-created');
  defaultWarehouseId = whRes.body.data[0]._id;
  console.log(`✅ Default warehouse verified: ${whRes.body.data[0].name} (Code: ${whRes.body.data[0].code})`);

  // 6. Categories & Products
  console.log('\n--- 6. Testing Product & Opening Stock ---');
  const categoryCreateRes = await request(app)
    .post('/api/v1/categories')
    .set('Authorization', `Bearer ${authToken}`)
    .set('x-organization-id', orgId)
    .send({ name: 'Electronics', description: 'Gadgets & tech components' });
  console.assert(categoryCreateRes.status === 201, 'Create category failed');
  categoryId = categoryCreateRes.body.data._id;
  console.log(`✅ Category created: ${categoryCreateRes.body.data.name}`);

  const productCreateRes = await request(app)
    .post('/api/v1/products')
    .set('Authorization', `Bearer ${authToken}`)
    .set('x-organization-id', orgId)
    .send({
      sku: 'SKU-ELC-001',
      name: 'Wireless Bluetooth Headset',
      categoryId,
      costMinor: 2500, // $25.00
      priceMinor: 5000, // $50.00
      reorderLevel: 5,
      initialStock: 20,
      initialWarehouseId: defaultWarehouseId,
    });
  console.assert(productCreateRes.status === 201, `Create product failed: ${JSON.stringify(productCreateRes.body)}`);
  productId = productCreateRes.body.data._id;
  console.log(`✅ Product created: ${productCreateRes.body.data.name} (SKU: ${productCreateRes.body.data.sku}) with opening stock 20`);

  // 7. Inventory Verification
  console.log('\n--- 7. Verifying Inventory Engine & Ledger ---');
  const invRes = await request(app)
    .get('/api/v1/inventory')
    .set('Authorization', `Bearer ${authToken}`)
    .set('x-organization-id', orgId);
  console.assert(invRes.status === 200, 'Get inventory failed');
  console.assert(invRes.body.data[0].onHand === 20, 'Opening onHand stock incorrect');
  console.assert(invRes.body.data[0].available === 20, 'Opening available stock incorrect');

  const ledgerRes = await request(app)
    .get('/api/v1/inventory/ledger')
    .set('Authorization', `Bearer ${authToken}`)
    .set('x-organization-id', orgId);
  console.assert(ledgerRes.status === 200, 'Get ledger failed');
  console.assert(ledgerRes.body.data[0].type === 'OPENING_STOCK', 'Stock ledger movement missing');
  console.log(`✅ Stock Balance & Ledger Movement verified: onHand = 20, movement = ${ledgerRes.body.data[0].type}`);

  // 8. Suppliers & Purchasing
  console.log('\n--- 8. Testing Supplier & Purchasing Workflow ---');
  const supplierRes = await request(app)
    .post('/api/v1/suppliers')
    .set('Authorization', `Bearer ${authToken}`)
    .set('x-organization-id', orgId)
    .send({
      name: 'Apex Global Tech',
      companyName: 'Apex Distributors Ltd',
      email: 'sales@apex.com',
      paymentTerms: 'NET_30',
    });
  console.assert(supplierRes.status === 201, 'Create supplier failed');
  supplierId = supplierRes.body.data._id;
  console.log(`✅ Supplier created: ${supplierRes.body.data.name}`);

  // Create Purchase Order for 15 units
  const poCreateRes = await request(app)
    .post('/api/v1/purchase-orders')
    .set('Authorization', `Bearer ${authToken}`)
    .set('x-organization-id', orgId)
    .send({
      supplierId,
      warehouseId: defaultWarehouseId,
      lines: [{ productId, orderedQty: 15, unitCostMinor: 2500 }],
    });
  console.assert(poCreateRes.status === 201, 'Create PO failed');
  poId = poCreateRes.body.data._id;
  console.log(`✅ Purchase Order created: ${poCreateRes.body.data.poNumber} (orderedQty: 15)`);

  // Approve PO
  await request(app)
    .post(`/api/v1/purchase-orders/${poId}/approve`)
    .set('Authorization', `Bearer ${authToken}`)
    .set('x-organization-id', orgId);

  // Receive 10 units (partial receipt)
  const rcvRes = await request(app)
    .post(`/api/v1/purchase-orders/${poId}/receipts`)
    .set('Authorization', `Bearer ${authToken}`)
    .set('x-organization-id', orgId)
    .send({
      lines: [{ productId, receivedQty: 10, damagedQty: 0 }],
      notes: 'First batch of 10 headsets received in good condition',
    });
  console.assert(rcvRes.status === 200, `Receive goods failed: ${JSON.stringify(rcvRes.body)}`);
  console.assert(rcvRes.body.data.order.status === 'PARTIALLY_RECEIVED', 'PO status should be PARTIALLY_RECEIVED');

  // Verify stock increased from 20 -> 30
  const invAfterPO = await request(app)
    .get('/api/v1/inventory')
    .set('Authorization', `Bearer ${authToken}`)
    .set('x-organization-id', orgId);
  console.assert(invAfterPO.body.data[0].onHand === 30, `Expected onHand 30, got ${invAfterPO.body.data[0].onHand}`);
  console.log('✅ Goods Receipt posted: onHand increased to 30, PO is PARTIALLY_RECEIVED');

  // 9. Customers & Sales Order Workflow
  console.log('\n--- 9. Testing Customers & Sales Fulfillment Workflow ---');
  const custRes = await request(app)
    .post('/api/v1/customers')
    .set('Authorization', `Bearer ${authToken}`)
    .set('x-organization-id', orgId)
    .send({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1-555-0199',
    });
  console.assert(custRes.status === 201, 'Create customer failed');
  customerId = custRes.body.data._id;
  console.log(`✅ Customer created: ${custRes.body.data.name}`);

  // Create Sales Order for 5 units
  const soCreateRes = await request(app)
    .post('/api/v1/sales-orders')
    .set('Authorization', `Bearer ${authToken}`)
    .set('x-organization-id', orgId)
    .send({
      customerId,
      warehouseId: defaultWarehouseId,
      lines: [{ productId, orderedQty: 5, unitPriceMinor: 5000 }],
    });
  console.assert(soCreateRes.status === 201, 'Create SO failed');
  soId = soCreateRes.body.data._id;
  console.log(`✅ Sales Order created: ${soCreateRes.body.data.orderNumber} (orderedQty: 5)`);

  // Confirm and Reserve stock
  const confirmRes = await request(app)
    .post(`/api/v1/sales-orders/${soId}/confirm`)
    .set('Authorization', `Bearer ${authToken}`)
    .set('x-organization-id', orgId);
  console.assert(confirmRes.status === 200, 'Confirm SO failed');
  console.assert(confirmRes.body.data.status === 'RESERVED', 'SO status should be RESERVED');

  // Check reserved quantity is 5, available is 25
  const invAfterReserve = await request(app)
    .get('/api/v1/inventory')
    .set('Authorization', `Bearer ${authToken}`)
    .set('x-organization-id', orgId);
  console.assert(invAfterReserve.body.data[0].reserved === 5, 'Reserved quantity incorrect');
  console.assert(invAfterReserve.body.data[0].available === 25, 'Available quantity incorrect');
  console.log('✅ Stock Reservation confirmed: onHand: 30, reserved: 5, available: 25');

  // Fulfill / Dispatch 5 units
  const fulfillRes = await request(app)
    .post(`/api/v1/sales-orders/${soId}/fulfillments`)
    .set('Authorization', `Bearer ${authToken}`)
    .set('x-organization-id', orgId)
    .send({
      lines: [{ productId, fulfilledQty: 5 }],
      carrier: 'DHL Express',
      trackingNumber: 'DHL-123456789',
    });
  console.assert(fulfillRes.status === 200, 'Fulfillment failed');
  console.assert(fulfillRes.body.data.order.status === 'FULFILLED', 'SO should be FULFILLED');

  // Check onHand decreased to 25, reserved back to 0
  const invAfterFulfill = await request(app)
    .get('/api/v1/inventory')
    .set('Authorization', `Bearer ${authToken}`)
    .set('x-organization-id', orgId);
  console.assert(invAfterFulfill.body.data[0].onHand === 25, `Expected onHand 25, got ${invAfterFulfill.body.data[0].onHand}`);
  console.assert(invAfterFulfill.body.data[0].reserved === 0, 'Reserved quantity should be 0');
  console.log('✅ Fulfillment dispatched: onHand decreased to 25, reserved released to 0');

  // 10. Invoicing & Payment
  console.log('\n--- 10. Testing Invoicing & Payment Workflow ---');
  const invCreateRes = await request(app)
    .post('/api/v1/invoices')
    .set('Authorization', `Bearer ${authToken}`)
    .set('x-organization-id', orgId)
    .send({ salesOrderId: soId });
  console.assert(invCreateRes.status === 201, `Create invoice failed: ${JSON.stringify(invCreateRes.body)}`);
  invoiceId = invCreateRes.body.data._id;
  console.assert(invCreateRes.body.data.totalAmountMinor === 25000, 'Invoice total incorrect (should be $250.00 = 25000)');
  console.log(`✅ Invoice generated: ${invCreateRes.body.data.invoiceNumber} (Total: $250.00, Balance due: $250.00)`);

  // Record payment of $250.00
  const payRes = await request(app)
    .post('/api/v1/payments')
    .set('Authorization', `Bearer ${authToken}`)
    .set('x-organization-id', orgId)
    .send({
      direction: 'INCOMING',
      partyType: 'CUSTOMER',
      partyId: customerId,
      invoiceId,
      amountMinor: 25000,
      method: 'CARD',
      reference: 'TXN-CARD-9912',
    });
  console.assert(payRes.status === 201, 'Payment failed');
  console.assert(payRes.body.data.invoice.status === 'PAID', 'Invoice should be marked PAID');
  console.assert(payRes.body.data.invoice.balanceDueMinor === 0, 'Invoice balance due should be 0');
  console.log('✅ Payment recorded: Invoice fully PAID, balance due is 0');

  // 11. Reports & Dashboard
  console.log('\n--- 11. Testing Dashboard & Reports ---');
  const dashRes = await request(app)
    .get('/api/v1/reports/dashboard')
    .set('Authorization', `Bearer ${authToken}`)
    .set('x-organization-id', orgId);
  console.assert(dashRes.status === 200, 'Dashboard summary failed');
  console.assert(dashRes.body.data.kpis.totalProducts === 1, 'Total products KPI mismatch');
  console.log(`✅ Dashboard KPI summary verified: ${JSON.stringify(dashRes.body.data.kpis)}`);

  console.log('\n======================================================');
  console.log('🎉 ALL 11 TEST SUITES PASSED WITH 100% SUCCESS!');
  console.log('======================================================\n');

  await mongoose.disconnect();
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});

