import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './app/AuthContext';
import { ToastProvider } from './app/ToastContext';
import AppShell from './components/AppShell';

// Auth Pages
import Login from './features/auth/Login';
import Register from './features/auth/Register';

// Operational Feature Pages
import Dashboard from './features/dashboard/Dashboard';
import Products from './features/products/Products';
import Categories from './features/categories/Categories';
import Warehouses from './features/warehouses/Warehouses';
import Inventory from './features/inventory/Inventory';
import Purchasing from './features/purchases/Purchasing';
import Suppliers from './features/suppliers/Suppliers';
import Sales from './features/sales/Sales';
import Customers from './features/customers/Customers';
import Invoices from './features/invoices/Invoices';
import Payments from './features/payments/Payments';
import Transfers from './features/transfers/Transfers';
import Returns from './features/returns/Returns';
import Reports from './features/reports/Reports';
import Roles from './features/roles/Roles';
import Team from './features/users/Team';
import Audit from './features/audit/Audit';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected SaaS Application Routes */}
            <Route element={<AppShell />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/warehouses" element={<Warehouses />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/purchases" element={<Purchasing />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/transfers" element={<Transfers />} />
              <Route path="/returns" element={<Returns />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/roles" element={<Roles />} />
              <Route path="/team" element={<Team />} />
              <Route path="/audit" element={<Audit />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
