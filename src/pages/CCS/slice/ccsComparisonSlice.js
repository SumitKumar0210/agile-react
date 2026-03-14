import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";
import { errorMessage, getErrorMessage } from "../../../toast";



export const approveCCS = createAsyncThunk(
  "ccsComparison/approveCCS",
  async ( data , { rejectWithValue }) => {
    try {
      const res = await api.post(`/admin/ccs/approve-ccs`, { ccs_id:data.ccs_id,
        vendor_id:data.vendor_id,
        gst_percentage:data.gst_percentage,
      });
      return res.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const getVendorWithId = createAsyncThunk(
  "ccsComparison/getVendorWithId",
  async (id, { rejectWithValue }) => {
    try {

      const res = await api.post(`/admin/ccs/${id}/get-vendor`);

      return res.data;

    } catch (error) {

      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);



const ccsComparisonSlice = createSlice({
  name: "ccsComparison",

  initialState: {
    data: [],
    ccs: [],
    loading: false,
    error: null
  },

  reducers: {
    clearCcsComparisonData: (state) => {
      state.data = [];
      state.ccs = [];
      state.error = null;
    }
  },

  extraReducers: (builder) => {
    builder

      .addCase(approveCCS.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(approveCCS.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })

      .addCase(approveCCS.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getVendorWithId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(getVendorWithId.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
        state.ccs = action.payload.ccs;
        state.error = null;
      })
      .addCase(getVendorWithId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearCcsComparisonData } = ccsComparisonSlice.actions;
export default ccsComparisonSlice.reducer;