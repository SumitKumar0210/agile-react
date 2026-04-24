// ./routes/AppRoutes.jsx
import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import ProtectedRoute from "./ProtectedRoute";
import SecurePage from "./SecurePage";
import JobCardPrint from "../components/JobCard/JobCardPrint";

// lazy load pages to reduce initial bundle & memory usage
const Login = lazy(() => import("../pages/auth/Login"));
const ForgotPassword = lazy(() => import("../pages/auth/ForgotPassword"));
const PublicQuoteDetailsView = lazy(() => import("../pages/Public/Quotation"));

const Dashboard = lazy(() => import("../pages/dashboard/Dashboard"));
const Settings = lazy(() => import("../pages/settings/Settings"));
const Users = lazy(() => import("../pages/Users/Users"));
const Customers = lazy(() => import("../pages/Users/Customers"));
const Labours = lazy(() => import("../pages/Users/Labours"));

const VendorDashboard = lazy(() => import("../pages/Vendor/Dashboard/VendorDashboard"));
const PurchaseOrder = lazy(() => import("../pages/Vendor/PurchaseOrder/PurchaseOrder"));
const CreatePurchaseOrder = lazy(() => import("../pages/Vendor/PurchaseOrder/CreatePurchaseOrder"));
const EditPurchaseOrder = lazy(() => import("../pages/Vendor/PurchaseOrder/EditPurchaseOrder"));
const ViewPurchaseOrder = lazy(() => import("../pages/Vendor/PurchaseOrder/ViewPurchaseOrder"));
const ApprovePurchaseOrder = lazy(() => import("../pages/Vendor/PurchaseOrder/ApprovePurchaseOrder"));
const PurchaseOrderQC = lazy(() => import("../pages/Vendor/PurchaseOrder/PurchaseOrderQC"));
const PrintPurchaseOrder = lazy(() => import("../pages/Vendor/PurchaseOrder/PrintPurchaseOrder"));

const VendorInvoice = lazy(() => import("../pages/Vendor/Invoice/Invoice"));
const InvoiceDetail = lazy(() => import("../pages/Vendor/Invoice/InvoiceDetail"));

const Payment = lazy(() => import("../pages/Vendor/Payment/Payment"));
const Ledger = lazy(() => import("../pages/Vendor/Ledger/Ledger"));
const CreateVendor = lazy(() => import("../pages/Vendor/CreateVendor/CreateVendor"));

const CustomerDashboard = lazy(() => import("../pages/Customer/Dashboard/CustomerDashboard"));
const Quote = lazy(() => import("../pages/Customer/Quote/Quote"));
const QuoteDetailsView = lazy(() => import("../pages/Customer/Quote/QuoteDetailsView"));
const CreateQuote = lazy(() => import("../pages/Customer/Quote/CreateQuote"));
const EditQuote = lazy(() => import("../pages/Customer/Quote/EditQuote"));
const OrderDetailsView = lazy(() => import("../pages/Customer/Order/OrderDetailsView"));
const CreateOrder = lazy(() => import("../pages/Customer/Order/CreateOrder"));
const EditOrder = lazy(() => import("../pages/Customer/Order/EditOrder"));
const CustomerLedger = lazy(() => import("../pages/Customer/Ledger/Ledger"));
const Vendor = lazy(() => import("../pages/Vendor/Ledger/vendor"));
const PublicQuote = PublicQuoteDetailsView; // alias used above
const Order = lazy(() => import("../pages/Customer/Order/Order"));
const OwnProductionOrder = lazy(() => import("../pages/Production/order"));
const AddOrder = lazy(() => import("../pages/Production/addOrder"));
const Customer = lazy(() => import("../pages/Customer/Ledger/Customer"));
const Production = lazy(() => import("../pages/Production/Production"));
const ProductRequest = lazy(() => import("../pages/Production/ProductRequest"));
const ReadyProduct = lazy(() => import("../pages/Production/ReadyProduct"));
const ProductChallan = lazy(() => import("../pages/Production/ProductChallna"));
const Bills = lazy(() => import("../pages/Billing/Bills"));
const GenerateBill = lazy(() => import("../pages/Billing/GenerateBill"));
const EditBill = lazy(() => import("../pages/Billing/EditGenerateBill"));
const ViewBill = lazy(() => import("../pages/Billing/ViewBill"));
const Challan = lazy(() => import("../pages/Billing/Challan"));
const DispatchProduct = lazy(() => import("../pages/Billing/DispatchProduct"));
const StockInOut = lazy(() => import("../pages/Billing/Stocks"));
const Permissions = lazy(() => import("../pages/Users/Permissions"));
const PermissionGroupManager = lazy(() => import("../pages/Users/userPermission"));
const ProductStocks = lazy(() => import("../pages/Production/ProductStock"));
const DiscardedProduct = lazy(() => import("../pages/Production/DiscardedProduct"));
const RRPManagement = lazy(() => import("../pages/Production/RRPManagement"));
const CostSheet = lazy(() => import("../pages/Production/CostSheet"));
const CCSMaterial = lazy(() => import("../pages/CCS/CCSMaterial"));
const CCSVendor = lazy(() => import("../pages/CCS/CCSVendor"));
const CCSComparison = lazy(() => import("../pages/CCS/CCSComparison"));
const CCSSheet = lazy(() => import("../pages/CCS/CCSSheet"));
const MaterialInventory = lazy(() => import("../pages/Vendor/Material/Inventory"));
const SubDepartment = lazy(() => import("../pages/settings/Department/SubDepartment/SubDepartment"));
const SemiFurnishedProductInventory = lazy(() => import("../pages/Production/SemiFurnishProduct/SemiFurnishProductInventory"));
const SemiFurnishedStock = lazy(() => import("../pages/Production/SemiFurnishProduct/SemiFurnishedStock"));


const Logs = lazy(() => import("../pages/Logs/Log"));
const Error404 = lazy(() => import("../pages/error/404"));
const Error403 = lazy(() => import("../pages/error/403"));

// minimal Suspense fallback
const SuspenseFallback = () => null;

const AppRoutes = () => {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Routes>
        {/* Default */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public link */}
        <Route
          path="/quotation/:link"
          element={
            <AuthLayout>
              <PublicQuote />
            </AuthLayout>
          }
        />

        <Route
          path="/logs"
          element={<SecurePage anyPermissions={[
           "logs.customer_payment",
          "logs.production",
          "logs.vendor_payment",
        ]}><Logs /></SecurePage>}
        />

        <Route
          path="/discarded-product"
          element={<SecurePage permission="discarded_product.read"><DiscardedProduct /></SecurePage>}
        />

        {/* Auth (public) */}
        <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
        <Route path="/forgot-password" element={<AuthLayout><ForgotPassword /></AuthLayout>} />

        {/* Protected + permissioned pages using SecurePage */}
        <Route path="/dashboard" element={<SecurePage><Dashboard /></SecurePage>} />
        <Route path="/settings" element={<SecurePage anyPermissions={[
          "settings.read",
          "groups.read",
          "categories.read",
          "machines.read",
          "uom.read",
          "materials.read",
          "product_types.read",
          "product.read",
          "tax_slabs.read",
          "roles.read",
          "vendors.read",
          "departments.read",
        ]}><Settings /></SecurePage>} />
        <Route path="/setting/:id/sub-department" element={<SecurePage ><SubDepartment /></SecurePage>} />
        <Route path="/users" element={<SecurePage permission="users.read"><Users /></SecurePage>} />
        <Route path="/customers" element={<SecurePage permission="customers.read"><Customers /></SecurePage>} />
        <Route path="/labours" element={<SecurePage permission="labours.read"><Labours /></SecurePage>} />
 
        {/* Vendor group */}
        <Route path="/vendor/dashboard" element={<SecurePage ><VendorDashboard /></SecurePage>} />
        <Route path="/vendor/purchase-order" element={<SecurePage permission="purchase_order.read"><PurchaseOrder /></SecurePage>} />
        <Route path="/vendor/purchase-order/create" element={<SecurePage permission="purchase_order.create"><CreatePurchaseOrder /></SecurePage>} />
        <Route path="/vendor/purchase-order/edit/:id" element={<SecurePage permission="purchase_order.update"><EditPurchaseOrder /></SecurePage>} />
        <Route path="/vendor/purchase-order/view/:id" element={<SecurePage permission="purchase_order.read"><ViewPurchaseOrder /></SecurePage>} />
        <Route path="/vendor/purchase-order/approve" element={<SecurePage permission="purchase_order.approve"><ApprovePurchaseOrder /></SecurePage>} />
        <Route path="/vendor/purchase-order/quality-check/:id" element={<SecurePage permission="qc_po.read"><PurchaseOrderQC /></SecurePage>} />
        <Route path="/vendor/purchase-order/print/:id" element={<SecurePage permission="qc_po.read"><PrintPurchaseOrder /></SecurePage>} />
        <Route path="/material-inventory" element={<SecurePage ><MaterialInventory /></SecurePage>} />


        <Route path="/vendor/invoice" element={<SecurePage permission="vendor_invoices.read"><VendorInvoice /></SecurePage>} />
        <Route path="/vendor/invoice/view/:id" element={<SecurePage permission="vendor_invoices.read"><InvoiceDetail /></SecurePage>} />
        {/* <Route path="/vendor/payment" element={<SecurePage><Payment /></SecurePage>} /> */}
        <Route path="/vendor/ledger/:id" element={<SecurePage permission="vendor_invoices.read"><Ledger /></SecurePage>} />
        <Route path="/vendor/list" element={<SecurePage permission="vendor_lists.read"><Vendor /></SecurePage>} />
        {/* <Route path="/vendor/create-vendor" element={<SecurePage permission="vendor.create"><CreateVendor /></SecurePage>} /> */}

        {/* Customer */}
        <Route path="/customer/dashboard" element={<SecurePage><CustomerDashboard /></SecurePage>} />
        <Route path="/customer/quote" element={<SecurePage permission="quotations.read"><Quote /></SecurePage>} />
        <Route path="/customer/quote/view/:id" element={<SecurePage permission="quotations.read"><QuoteDetailsView /></SecurePage>} />
        <Route path="/customer/quote/create" element={<SecurePage permission="quotations.create"><CreateQuote /></SecurePage>} />
        <Route path="/customer/quote/edit/:id" element={<SecurePage permission="quotations.update"><EditQuote /></SecurePage>} />
        <Route path="/customer/order" element={<SecurePage permission="customer_orders.read"><Order /></SecurePage>} />
        <Route path="/customer/order/view/:id" element={<SecurePage permission="customer_orders.read"><OrderDetailsView /></SecurePage>} />
        <Route path="/customer/order/create" element={<SecurePage permission="customer_orders.create"><CreateOrder /></SecurePage>} />
        <Route path="/customer/order/edit/:id" element={<SecurePage permission="customer_orders.update"><EditOrder /></SecurePage>} />
        <Route path="/customer/list" element={<SecurePage permission="customer_lists.read"><Customer /></SecurePage>} />
        <Route path="/customer/ledger/:id" element={<SecurePage permission="customer_lists.view_ledger"><CustomerLedger /></SecurePage>} />

        {/* Production */}
        <Route path="/production/create-order" element={<SecurePage permission="company_orders.create"><AddOrder /></SecurePage>} />
        <Route path="/production/orders" element={<SecurePage permission="company_orders.read"><OwnProductionOrder /></SecurePage>} />
        <Route path="/production/production-chain" element={<SecurePage permission="productions.read"><Production /></SecurePage>} />
        <Route path="/production/product-request" element={<SecurePage permission="materials.read"><ProductRequest /></SecurePage>} />
        <Route path="/product/stocks" element={<SecurePage ><ProductStocks permission="product_stocks.read" /></SecurePage>} />
        <Route path="/production/semi-furnished-products" element={<SecurePage ><SemiFurnishedProductInventory permission="product_stocks.read" /></SecurePage>} />
        <Route path="/production/semi-furnished-product-stocks" element={<SecurePage ><SemiFurnishedStock permission="product_stocks.read" /></SecurePage>} />
        <Route path="/production/cost-sheet/:id" element={<SecurePage ><CostSheet permission="rrp.read"  /></SecurePage>} />
        <Route path="/production/rrp-calculation" element={<SecurePage ><RRPManagement permission="rrp.read"  /></SecurePage>} />
        <Route path="/product/ready-product" element={<SecurePage ><ReadyProduct /></SecurePage>} />
        {/* <Route path="/product/challan/:id" element={<SecurePage permission="product.challan"><ProductChallan /></SecurePage>} /> */}

        {/* Bills */}
        <Route path="/bills" element={<SecurePage permission="bills.read"><Bills /></SecurePage>} />
        <Route path="/bill/generate-bill" element={<SecurePage permission="bills.create"><GenerateBill /></SecurePage>} />
        <Route path="/bill/edit-bill/:id" element={<SecurePage permission="bills.update"><EditBill /></SecurePage>} />
        <Route path="/bill/view/:id" element={<SecurePage permission="bills.read"><ViewBill /></SecurePage>} />
        <Route path="/bill/challan/:id" element={<SecurePage permission="bills.create_challan"><Challan /></SecurePage>} />
        <Route path="/bill/dispatched-product" element={<SecurePage permission="dispatch_product.read"><DispatchProduct /></SecurePage>} />

        {/* Stock */}
        <Route path="/stocks" element={<SecurePage permission="stocks.read"><StockInOut /></SecurePage>} />

        {/* CCS */}
        <Route path="/ccs" element={<SecurePage ><CCSSheet /></SecurePage>} />
        <Route path="/ccs/material" element={<SecurePage ><CCSMaterial /></SecurePage>} />
        <Route path="/ccs/:id/vendor" element={<SecurePage ><CCSVendor /></SecurePage>} />
        <Route path="/ccs/:id/compare" element={<SecurePage ><CCSComparison /></SecurePage>} />

        {/* Permission */}
        {/* <Route path="/permissions" element={<SecurePage permission="roles.assign"><Permissions /></SecurePage>} /> */}
        <Route path="/settings/:id/fetch-permissions" element={<SecurePage permission="roles.assign"><PermissionGroupManager /></SecurePage>} />

        <Route path="/job-card" element={<SecurePage><JobCardPrint /></SecurePage>} />
        {/* Error pages */}
        <Route path="/403" element={<Error403 />} />
        <Route path="*" element={<Error404 />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
