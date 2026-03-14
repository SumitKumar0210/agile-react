// src/store/slices/purchaseOrderSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api"; // adjust the path to your API file
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";

// Fetch purchase orders with pagination and search
export const fetchPurchaseOrders = createAsyncThunk(
  "purchaseOrder/fetchPurchaseOrders",
  async ({ page, perPage, search,showApproved }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });

      if (search && search.trim()) {
        queryParams.append('search', search.trim());
      }

      if (showApproved !== undefined) {
        queryParams.append('showApproved', String(showApproved));
      }

      const res = await api.get(
        `admin/purchase-order/get-data?${queryParams.toString()}`
      );
      
      return {
        data: res.data.data || [],
        total: res.data.total || 0,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Fetch failed");
    }
  }
);

//  Fetch all customers (keeping your existing one)
export const fetchPOs = createAsyncThunk(
  "purchaseOrder/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("admin/purchase-order/get-data");
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Fetch failed");
    }
  }
);

export const getApprovePOData = createAsyncThunk(
  "purchaseOrder/getApprovePOData",
  async ({ page = 1, per_page = 10, search }, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/purchase-order/getApprovePOData", {
        page,
        per_page,
        search
      });

      return {
        data: res.data.data || [],
        total: res.data.total || 0,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Fetch failed");
    }
  }
);

//  Add customer
export const addPO = createAsyncThunk(
  "purchaseOrder/add",
  async (newCustomer, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/purchase-order/store", newCustomer);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

//  Update customer
export const updatePO = createAsyncThunk(
  "purchaseOrder/update",
  async (poData, { rejectWithValue }) => {
    try {
      console.log(poData)
      const res = await api.post(`admin/purchase-order/update/${poData.id}`, poData);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

//  Update customer
export const editPO = createAsyncThunk(
  "purchaseOrder/edit",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/purchase-order/edit/${id}`);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

//  Status update
export const statusUpdate = createAsyncThunk(
  "purchaseOrder/statusUpdate",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/purchase-order/status-update", { id, status });
      successMessage(res.data.message);
      return { id, status };
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

//  Status update
export const approvePO = createAsyncThunk(
  "purchaseOrder/approvePO",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/purchase-order/approvePO", { 'id': id });
      successMessage(res.data.message);
      return id;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

//  Delete customer
export const deletePO = createAsyncThunk(
  "purchaseOrder/delete",
  async ({id,reason}, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/purchase-order/delete/${id}`, { reason });
      successMessage(res.data.message);
      return id;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

//  Purchase Order slice
const purchaseOrderSlice = createSlice({
  name: "purchaseOrder",
  initialState: {
    data: [],
    orders: [], // Add this for the new fetchPurchaseOrders
    totalRows: 0, // Add this for total count
    selected: {},
    loading: false,
    error: null,
    total: 0,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch purchase orders with pagination and search
      .addCase(fetchPurchaseOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchaseOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.data;
        state.totalRows = action.payload.total;
      })
      .addCase(fetchPurchaseOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch all
      .addCase(fetchPOs.pending, (state) => { 
        state.loading = true; 
      })
      .addCase(fetchPOs.fulfilled, (state, action) => { 
        state.loading = false; 
        state.data = action.payload; 
      })
      .addCase(fetchPOs.rejected, (state, action) => { 
        state.loading = false; 
        state.error = action.payload || action.error.message; 
      })

      // Fetch approve PO data
      .addCase(getApprovePOData.pending, (state) => {
        state.loading = true;
      })
      .addCase(getApprovePOData.fulfilled, (state, action) => {
        state.data = action.payload.data;
        state.total = action.payload.total;
        state.loading = false;
      })
      .addCase(getApprovePOData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add
      .addCase(addPO.fulfilled, (state, action) => { 
        state.data = action.payload; 
      })

      // Edit
      .addCase(editPO.pending, (state) => {
        state.loading = true;
      })
      .addCase(editPO.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      .addCase(editPO.rejected, (state) => {
        state.loading = false;
      })

      // Update
      .addCase(updatePO.fulfilled, (state, action) => {
        const index = state.data.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) state.data[index] = action.payload;
      })

      // Status update
      .addCase(statusUpdate.fulfilled, (state, action) => {
        const index = state.data.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) state.data[index].status = action.payload.status;
      })

      // Delete
      .addCase(deletePO.fulfilled, (state, action) => {
        state.data = state.data.filter((d) => d.id !== action.payload);
        state.orders = state.orders.filter((d) => d.id !== action.payload);
      });
  }
});

export default purchaseOrderSlice.reducer;