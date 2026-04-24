import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";

export const markSemiFurnishedProduct = createAsyncThunk(
  "semiFurnishedProduct/markSemiFurnishedProduct",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/production-order/semi-furnished/mark", payload);

      successMessage("Marked as Semi-Finished");
      return res.data;

    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const semiFurnishedProductRRP = createAsyncThunk(
  "semiFurnishedProduct/semiFurnishedProductRRP",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/production-order/semi-furnished/rrp-calculation", {id:payload});

    //   successMessage("Marked as Semi-Finished");
    console.log(res);
      return res.data;

    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const getSemiFunishedProducts = createAsyncThunk(
  "semiFurnishedProduct/getSemiFunishedProducts",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/production-order/semi-furnished/get-data", payload);

      // successMessage("Marked as Semi-Finished");
     
      return res.data.data;

    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const getSemiFunishedProductsWithQty = createAsyncThunk(
  "semiFurnishedProduct/getSemiFunishedProductsWithQty",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/production-order/semi-furnished/get-data-with-qty", payload);

      // successMessage("Marked as Semi-Finished");
     
      return res.data.data;

    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const getRequestedSemiProduct = createAsyncThunk(
  "semiFurnishedProduct/getRequestedSemiProduct",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/production-order/semi-furnished/${payload.id}/get-data`, payload);

      // successMessage("Marked as Semi-Finished");
     
      return res.data.data;

    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const getSemiProductLogs = createAsyncThunk(
  "semiFurnishedProduct/getSemiProductLogs",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/production-order/semi-furnished-product/logs`);

      // successMessage("Marked as Semi-Finished");
     
      return res.data.data;

    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

const semiFurnishedProductSlice = createSlice({
  name: "semiFurnishedProduct",
  initialState: {
    data: [],
    requestedData: [],
    logs: [],
    error: null,
    loading: false,
  },

  reducers: {
    cleanData: (state) => {
      state.data = [];
      state.requestedData = [];
      state.logs = [];
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(markSemiFurnishedProduct.pending, (state) => {
        state.loading = true;
      })
      .addCase(markSemiFurnishedProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.data.push(action.payload);
      })
      .addCase(markSemiFurnishedProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getSemiFunishedProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(getSemiFunishedProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(getSemiFunishedProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getSemiFunishedProductsWithQty.pending, (state) => {
        state.loading = true;
      })
      .addCase(getSemiFunishedProductsWithQty.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(getSemiFunishedProductsWithQty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getRequestedSemiProduct.pending, (state) => {
        state.loading = true;
      })
      .addCase(getRequestedSemiProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.requestedData = action.payload;
      })
      .addCase(getRequestedSemiProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getSemiProductLogs.pending, (state) => {
        state.loading = true;
      })
      .addCase(getSemiProductLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.logs = action.payload;
      })
      .addCase(getSemiProductLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { cleanData } = semiFurnishedProductSlice.actions;
export default semiFurnishedProductSlice.reducer;