import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";

export const fetchProductionChainOrder = createAsyncThunk(
  "productionChain/fetchProductionChainOrder",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/production-order/get-production-batch`);
      successMessage(res.data.message);

      return {
        data: res.data.data || [],
        totalRecords: res.data.totalRecords || 0,
      };
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const fetchBatchProduct = createAsyncThunk(
  "productionChain/fetchBatchProduct",
  async (values, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/production-order/get-batch-products`, values);
      successMessage(res.data.message);

      return {
        data: res.data.data || [],
        totalRecords: res.data.totalRecords || 0,
      };
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// change product department
export const changeProductDepartment = createAsyncThunk(
  "productionChain/changeProductDepartment",
  async (values, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/production-order/set-change-department`, values);
      successMessage(res.data.message);
      return  res.data.data || [];
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// set new priority
export const setNewPriority = createAsyncThunk(
  "productionChain/setNewPriority",
  async (values, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/production-order/set-updated-value`, values);
      successMessage(res.data.message);
      return  values;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);
// set new supervisor
export const setNewSupervisor = createAsyncThunk(
  "productionChain/setNewSupervisor",
  async (values, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/production-order/set-updated-value`, values);
      successMessage(res.data.message);
      return  values;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// set new supervisor
export const markReadyForDelivey = createAsyncThunk(
  "productionChain/markReadyForDelivey",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/production-order/mark-ready-for-delivey`, {id:id});
      successMessage(res.data.message);
      return  id;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const getJobDetails = createAsyncThunk(
  "productionChain/getJobDetails",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/production-order/get-job-details`, {id:id});
      successMessage(res.data.message);
      return  res.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const getBomDetailsWithApprovedQty = createAsyncThunk(
  "productionChain/getBomDetailsWithApprovedQty",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/production-order/get-items-approved-qty`, { id });

      console.log("getBomDetailsWithApprovedQty:", res.data);

      return res.data;

    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

const productionChainSlice = createSlice({
  name: "productionChain",
  initialState: {
    data: [],
    batchProduct: [],
    bomDetails: [],
    loading: false,
    productionLoading: false,
    error: null,
    activeBatch: null,
    totalRecords: 0,
  },
  reducers: {
    setActiveBatch: (state, action) => {
      state.activeBatch = action.payload;
    },

    clearActiveBatch: (state) => {
      state.activeBatch = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchProductionChainOrder.pending, (state) => {
        state.productionLoading = true;
        state.error = null;
      })
      .addCase(fetchProductionChainOrder.fulfilled, (state, action) => {
        state.productionLoading = false;
        state.data = action.payload.data;
        state.totalRecords = action.payload.totalRecords;
      })
      .addCase(fetchProductionChainOrder.rejected, (state, action) => {
        state.productionLoading = false;
        state.error = action.payload;
      })

      .addCase(getBomDetailsWithApprovedQty.pending, (state) => {
        state.productionLoading = true;
        state.error = null;
      })
      .addCase(getBomDetailsWithApprovedQty.fulfilled, (state, action) => {
        state.productionLoading = false;
        state.bomDetails = action.payload.data;
      })
      .addCase(getBomDetailsWithApprovedQty.rejected, (state, action) => {
        state.productionLoading = false;
        state.error = action.payload;
      })

      .addCase(fetchBatchProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBatchProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.batchProduct = action.payload.data;
      })
      .addCase(fetchBatchProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setActiveBatch, clearActiveBatch } = productionChainSlice.actions;
export default productionChainSlice.reducer;
