import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";
import { errorMessage, getErrorMessage } from "../../../toast";



export const storeVendorWithCcs = createAsyncThunk(
  "ccsVendor/storeVendorWithCcs",
  async ({ ccs_id, vendors }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/admin/ccs/${ccs_id}/vendor`, { vendors });
      return res.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const getOnGoinProductionNumber = createAsyncThunk(
  "ccsVendor/getOnGoinProductionNumber",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.post(`/admin/production-order/on-going-production`);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const previousVendorData = createAsyncThunk(
  "ccsVendor/previousVendorData",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post(`/admin/ccs/${id}/vendor-details`);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);



const ccsVendorSlice = createSlice({
  name: "ccsVendor",

  initialState: {
    data: [],
    productionChains : [],
    previousData : [],
    loading: false,
    error: null
  },

  reducers: {
    clearCcsVendorData: (state) => {
      state.data = [];
      state.productionChains = [];
      state.previousData = [];
      state.error = null;
    }
  },

  extraReducers: (builder) => {
    builder

      .addCase(storeVendorWithCcs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(storeVendorWithCcs.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })

      .addCase(storeVendorWithCcs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(getOnGoinProductionNumber.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(getOnGoinProductionNumber.fulfilled, (state, action) => {
        state.loading = false;
        state.productionChains = action.payload;
        state.error = null;
      })

      .addCase(getOnGoinProductionNumber.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(previousVendorData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(previousVendorData.fulfilled, (state, action) => {
        state.loading = false;
        state.previousData = action.payload;
        state.error = null;
      })

      .addCase(previousVendorData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
       
});

export const { clearCcsVendorData } = ccsVendorSlice.actions;
export default ccsVendorSlice.reducer;