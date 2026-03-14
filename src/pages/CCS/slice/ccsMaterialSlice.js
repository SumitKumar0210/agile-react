import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";
import { errorMessage, getErrorMessage } from "../../../toast";



export const getMaterialWithId = createAsyncThunk(
  "ccsMaterial/getMaterialWithId",
  async (id, { rejectWithValue }) => {
    try {

      const res = await api.post(`/admin/ccs/get-material/${id}`);

      return res.data;

    } catch (error) {

      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const storeMaterial = createAsyncThunk(
  "ccsMaterial/storeMaterial",
  async (payload, { rejectWithValue }) => {
    try {

      const res = await api.post(`/admin/ccs/material`, payload);

      return res.data;

    } catch (error) {

      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);



const ccsMaterialSlice = createSlice({
  name: "ccsMaterial",

  initialState: {
    data: [],
    loading: false,
    error: null
  },

  reducers: {
    clearCcsMaterialData: (state) => {
      state.data = [];
      state.error = null;
    }
  },

  extraReducers: (builder) => {
    builder

      .addCase(getMaterialWithId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(getMaterialWithId.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload?.data ?? action.payload;
        state.error = null;
      })

      .addCase(getMaterialWithId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(storeMaterial.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(storeMaterial.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })

      .addCase(storeMaterial.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearCcsMaterialData } = ccsMaterialSlice.actions;
export default ccsMaterialSlice.reducer;