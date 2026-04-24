import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api";
import { getErrorMessage, errorMessage } from "../../toast"; // adjust to your actual export

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const productionOutput = createAsyncThunk(
  "dashboard/productionOutput",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("admin/dashboard/production-output");
      return res.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const topVendorChart = createAsyncThunk(
  "dashboard/topVendorChart",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("admin/dashboard/top-vendor-chart");
      return res.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const qcTrendsData = createAsyncThunk(
  "dashboard/qcTrendsData",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("admin/dashboard/qc-trends-data");
      return res.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const activeProductionDataDepartmentWise = createAsyncThunk(
  "dashboard/activeProductionDataDepartmentWise",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("admin/dashboard/active-production-data-department-wise");
      return res.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// ── was duplicate key "dashboard/activeProductionDataDepartmentWise" — fixed ──
export const dispatchTrackerData = createAsyncThunk(
  "dashboard/dispatchTrackerData",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("admin/dashboard/dispatch-tracker-data");
      return res.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const materialSummary = createAsyncThunk(
  "dashboard/materialSummary",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("admin/dashboard/material-summary");
      return res.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const getStatisticsData = createAsyncThunk(
  "dashboard/getStatisticsData",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("admin/dashboard/statistics-data");
      return res.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// ─── Helper: build the standard pending/fulfilled/rejected trio ───────────────
// Avoids repeating the same 3 addCase calls for every thunk.
// dataKey  = which state key to write fulfilled payload into
// loadKey  = which loading flag to toggle (defaults to global `loading`)

function addThunkCases(builder, thunk, dataKey, loadKey = "loading") {
  builder
    .addCase(thunk.pending, (state) => {
      state[loadKey] = true;
      state.error    = null;
    })
    .addCase(thunk.fulfilled, (state, action) => {
      state[loadKey]  = false;
      state[dataKey]  = action.payload?.data ?? action.payload;
    })
    .addCase(thunk.rejected, (state, action) => {
      state[loadKey] = false;
      state.error    = action.payload;
    });
}

// ─── Slice ────────────────────────────────────────────────────────────────────

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {
    // each thunk gets its own state key so they don't clobber each other
    productionOutputData:       [],
    topVendorChartData:         [],
    qcTrendsData:               [],
    activeDepartmentData:       [],
    dispatchTrackerData:        [],
    materialSummary:            [],
    statisticsData:             [],

    // granular loading flags so spinners are independent per widget
    loadingProductionOutput:    false,
    loadingTopVendorChart:      false,
    loadingQcTrends:            false,
    loadingActiveDepartment:    false,
    loadingDispatchTracker:     false,
    loadingMaterialSummary:     false,
    loadingStatisticsData:      false,

    error: null,
  },
  reducers: {
    clearDashboard: (state) => {
      state.productionOutputData    = [];
      state.topVendorChartData      = [];
      state.qcTrendsData            = [];
      state.activeDepartmentData    = [];
      state.dispatchTrackerData     = [];
      state.materialSummary         = [];
      state.statisticsData          = [];
      state.error                   = null;
    },
  },
  extraReducers: (builder) => {
    addThunkCases(builder, productionOutput,                  "productionOutputData",  "loadingProductionOutput");
    addThunkCases(builder, topVendorChart,                    "topVendorChartData",    "loadingTopVendorChart");
    addThunkCases(builder, qcTrendsData,                      "qcTrendsData",          "loadingQcTrends");
    addThunkCases(builder, activeProductionDataDepartmentWise,"activeDepartmentData",  "loadingActiveDepartment");
    addThunkCases(builder, dispatchTrackerData,               "dispatchTrackerData",   "loadingDispatchTracker");
    addThunkCases(builder, materialSummary,                   "materialSummary",       "loadingMaterialSummary");
    addThunkCases(builder, getStatisticsData,                    "statisticsData",        "loadingStatisticsData");
  },
});

export const { clearDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;