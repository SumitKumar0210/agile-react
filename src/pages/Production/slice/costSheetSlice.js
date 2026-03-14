import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";
import { successMessage, getErrorMessage, errorMessage } from "../../../toast";

export const getCostsheet = createAsyncThunk(
  "costSheet/getCostsheet", 
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/production-order/rrp-summary", {id:id});
      successMessage("Cost sheet loaded successfully"); 
      return res.data.data;
    } catch (error) {
      errorMessage(getErrorMessage(error));
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const costSheetSlice = createSlice({
  name: "costSheet",
  initialState: {
    data: [],
    error: null,
    loading: false,
  },
  reducers: {
    clearCostSheet: (state) => {
      state.error = null;
      state.data = [];
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCostsheet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(getCostsheet.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })

      .addCase(getCostsheet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCostSheet } = costSheetSlice.actions;
export default costSheetSlice.reducer;