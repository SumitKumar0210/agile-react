import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";

// Fetch orders with pagination
export const fetchOrder = createAsyncThunk(
  "order/fetchOrder",
  async ({ pageIndex, pageLimit, search="" }, { rejectWithValue }) => {
    try {
      const res = await api.get(`admin/production-order/get-data`, {
        params: {
          page: pageIndex + 1,
          limit: pageLimit ?? 10,
          search:search
        }
      });
      return {
        data: res.data.data,
        totalRecords: res.data.total || res.data.data.length
      };
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const fetchQuotation = createAsyncThunk(
  "order/fetchQuotation",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/quotation-order/get-quotation-data`);
      return {
        data: res.data.data,
        totalRecords: res.data.total || res.data.data.length
      };
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// fetch supervisor
export const fetchSupervisor = createAsyncThunk(
  "order/fetchSupervisor",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/user/get-supervisor`);
      return {
        data: res.data.data,
        totalRecords: res.data.total || res.data.data.length
      };
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Add order
export const addOrder = createAsyncThunk(
  "order/addOrder",
  async (values, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/production-order/store`, values);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Edit order
export const editOrder = createAsyncThunk(
  "order/editOrder",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/production-order/edit/${id}`);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Update order
export const updateOrder = createAsyncThunk(
  "order/updateOrder",
  async (values, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/production-order/update/${values.id}`, values);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Delete order
export const deleteOrder = createAsyncThunk(
  "order/deleteOrder",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/quotation-order/delete/${id}`);
      successMessage(res.data.message);
      return { id };
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Approve All Product
export const approveAllProduct = createAsyncThunk(
  "order/approveAllProduct",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/production-order/approve-all-product`,id);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Approve All Product
export const approveSingleProduct = createAsyncThunk(
  "order/approveSingleProduct",
  async (values, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/production-order/approve-single-product`,values);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);
// Approve All Product
export const getPreviousPO = createAsyncThunk(
  "order/getPreviousPO",
  async ({ id, orderId }, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/production-order/get-previous-po`, {
        id: id,
        orderId: orderId ?? null,
      });
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);


export const getProductProductionLog = createAsyncThunk(
  "order/getProductProductionLog",
  async(id, { rejectWithValue}) => {

    try{
      const res = await api.post(`admin/production-order/product-production-log`, {
        id: id,
      });
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);



const orderSlice = createSlice({
  name: "order",
  initialState: {
    data: [],
    user: [],
    log: [],
    selected: {},
    totalRecords: 0,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch orders
      .addCase(fetchOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data || [];
        state.totalRecords = action.payload.totalRecords || 0;
      })
      .addCase(fetchOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch orders
      .addCase(getProductProductionLog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProductProductionLog.fulfilled, (state, action) => {
        state.loading = false;
        state.log = action.payload.data || [];
      })
      .addCase(getProductProductionLog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch orders
      .addCase(fetchQuotation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuotation.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data || [];
        state.totalRecords = action.payload.totalRecords || 0;
      })
      .addCase(fetchQuotation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch orders
      .addCase(fetchSupervisor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSupervisor.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.data || [];
        state.totalRecords = action.payload.totalRecords || 0;
      })
      .addCase(fetchSupervisor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add order
      .addCase(addOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.data.unshift(action.payload);
        state.totalRecords += 1;
      })
      .addCase(addOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Edit order
      .addCase(editOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })

      // Delete order
      .addCase(deleteOrder.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.data = state.data.filter(item => item.id !== action.payload.id);
        state.totalRecords = Math.max(0, state.totalRecords - 1);
      })
      .addCase(deleteOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default orderSlice.reducer;