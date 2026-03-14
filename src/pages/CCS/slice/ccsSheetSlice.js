import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";
import { errorMessage, getErrorMessage } from "../../../toast";
 
export const getDatawithSearch = createAsyncThunk(
  "ccsSheet/getDatawithSearch",
  async ({ page = 1, perPage = 10, search = "" } = {}, { rejectWithValue }) => {
    try {
      // API now returns: { success, data: [], total, page, per_page }
      const res = await api.post(`/admin/ccs`, {
        page,
        per_page: perPage,
        search,
      });
      return res.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);
 
export const deleteCcs = createAsyncThunk(
  "ccsSheet/deleteCcs",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.delete(`/admin/ccs/${id}`);
      return res.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);
 
const ccsSheetSlice = createSlice({
  name: "ccsSheet",
 
  initialState: {
    data: [],      // current page rows
    total: 0,      // total row count from server
    loading: false,
    error: null,
  },
 
  reducers: {
    clearCcsSheetData: (state) => {
      state.data  = [];
      state.total = 0;
      state.error = null;
    },
  },
 
  extraReducers: (builder) => {
    builder
      .addCase(getDatawithSearch.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(getDatawithSearch.fulfilled, (state, action) => {
        state.loading = false;
        // Response shape: { success, data: [], total, page, per_page }
        state.data    = action.payload.data  ?? [];
        state.total   = action.payload.total ?? 0;
      })
      .addCase(getDatawithSearch.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      })
      .addCase(deleteCcs.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteCcs.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(deleteCcs.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      });
  },
});
 
export const { clearCcsSheetData } = ccsSheetSlice.actions;
export default ccsSheetSlice.reducer;