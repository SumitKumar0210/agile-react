import { configureStore } from '@reduxjs/toolkit';
import userTypeReducer from '../pages/settings/slices/userTypeSlice';
import authReducer from '../pages/auth/authSlice';
import departmentReducer from '../pages/settings/slices/departmentSlice';
import groupReducer from '../pages/settings/slices/groupSlice';
import categoryReducer from '../pages/settings/slices/categorySlice';
import unitOfMeasurementsReducer from '../pages/settings/slices/unitOfMeasurementsSlice';
import gradeReducer from '../pages/settings/slices/gradeSlice';
import branchReducer from '../pages/settings/slices/branchSlice';
import vendorReducer from '../pages/settings/slices/vendorSlice';
import materialReducer from '../pages/settings/slices/materialSlice';
import generalSettingReducer from '../pages/settings/slices/generalSettingSlice';
import machineReducer from '../pages/settings/slices/machineSlice';
import productReducer from '../pages/settings/slices/productSlice';
import stateReducer from '../pages/settings/slices/stateSlice';
import customerReducer from '../pages/Users/slices/customerSlice';
import userReducer from '../pages/Users/slices/userSlice';
import labourReducer from '../pages/Users/slices/labourSlice';
import purchaseOrderReducer from '../pages/Vendor/slice/purchaseOrderSlice';
import taxSlabReducer from '../pages/settings/slices/taxSlabSlice';
import purchaseInwardReducer from '../pages/Vendor/slice/purchaseInwardSlice';
import vendorInvoiceReducer from '../pages/Vendor/slice/vendorInvoiceSlice';
import ledgerReducer from '../pages/Vendor/slice/ledgerSlice';
import quotationReducer from '../pages/Customer/slice/quotationSlice';
import orderReducer from '../pages/Customer/slice/orderSlice';
import linkManagementReducer from '../components/Links/slice/linkManagementSlice';
import productionOrderReducer from '../pages/Production/slice/orderSlice';
import productionChainReducer from '../pages/Production/slice/productionChainSlice';
import attachmentReducer from '../pages/Production/slice/attachmentSlice';
import messageReducer from '../pages/Production/slice/messageSlice';
import labourLogReducer from '../pages/Production/slice/labourLogSlice';
import tentativeItemReducer from '../pages/Production/slice/tentativeItemSlice';
import materialRequestReducer from '../pages/Production/slice/materialRequestSlice';
import readyProductReducer from '../pages/Production/slice/readyProductSlice';
import billsReducer from '../pages/Billing/slice/billsSlice';
import failedQcReducer from '../pages/Production/slice/failedQcSlice';
import productTypeReducer from '../pages/settings/slices/productTypeSlice';
import shippingAddressReducer from '../pages/Billing/slice/shippingAddressSlice';
import paymentReducer from '../pages/Billing/slice/paymentSlice';
import customerLedgerReducer from '../pages/Customer/slice/customerLedgerSlice';
import stockReducer from '../pages/Billing/slice/stockSlice';
import userPermissionsReducer from '../pages/Users/slices/userPermissionsSlice';
import roleReducer from '../pages/settings/slices/roleSlice';
import workShiftReducer from '../pages/settings/slices/workShiftSlice';
import costSheetReducer from '../pages/Production/slice/costSheetSlice';
import ccsMaterialReducer from '../pages/CCS/slice/ccsMaterialSlice';
import ccsVendorReducer from '../pages/CCS/slice/ccsVendorSlice';
import ccsComparisonReducer from '../pages/CCS/slice/ccsComparisonSlice';
import ccsSheetReducer from '../pages/CCS/slice/ccsSheetSlice';
import logReducer from '../pages/Logs/slice/logSlice';
import inventoryReducer from '../pages/Vendor/Material/slice/inventorySlice';

export const store = configureStore({
    reducer: {
        userType: userTypeReducer,
        auth: authReducer,
        department: departmentReducer,
        group: groupReducer,
        category: categoryReducer,
        unitOfMeasurement: unitOfMeasurementsReducer,
        grade: gradeReducer,
        branch: branchReducer,
        vendor: vendorReducer,
        material: materialReducer,
        machine: machineReducer,
        product: productReducer,
        customer: customerReducer,
        state: stateReducer,
        user: userReducer,
        labour: labourReducer,
        purchaseOrder: purchaseOrderReducer,
        generalSetting: generalSettingReducer,
        taxSlab: taxSlabReducer,
        purchaseInward: purchaseInwardReducer,
        vendorInvoice: vendorInvoiceReducer,
        ledger: ledgerReducer,
        quotation: quotationReducer,
        order: orderReducer,
        link: linkManagementReducer,
        productionOrder: productionOrderReducer,
        productionChain: productionChainReducer,
        attachment: attachmentReducer,
        message: messageReducer,
        labourLog: labourLogReducer,
        tentativeItem: tentativeItemReducer,
        materialRequest: materialRequestReducer,
        readyProduct: readyProductReducer,
        bill: billsReducer,
        failedQc: failedQcReducer,
        productType: productTypeReducer,
        shippingAddress: shippingAddressReducer,
        payment: paymentReducer,
        customerLedger: customerLedgerReducer,
        stock: stockReducer,
        userPermissions: userPermissionsReducer,
        role: roleReducer,
        workShift: workShiftReducer,
        costSheet: costSheetReducer,
        ccsMaterial: ccsMaterialReducer,
        ccsVendor: ccsVendorReducer,
        ccsComparison: ccsComparisonReducer,
        ccsSheet: ccsSheetReducer,
        log: logReducer,
        inventory: inventoryReducer,
    }
})