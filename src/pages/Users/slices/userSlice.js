import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api"; // adjust the path to your api file
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";

//  Fetch all users
export const fetchUsers = createAsyncThunk(
  "users/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { pageIndex = 1, pageLimit = 10, search = "" } = params;

      const res = await api.get("admin/user/get-data", {
        params: { page: pageIndex, limit: pageLimit, search },
      });

      const data = res.data?.data || [];

      return {
        data,
        totalRecords: res.data?.total ?? 0,
        currentPage: res.data?.current_page ?? pageIndex,
        perPage: res.data?.per_page ?? pageLimit,
        lastPage: res.data?.last_page ?? 1,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to fetch users"
      );
    }
  }
);

//  Fetch all users
export const fetchUsersWithSearch = createAsyncThunk(
  "users/fetchUsersWithSearch",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { pageIndex = 1, pageLimit = 10, search = "" } = params;

      const res = await api.get("admin/user/search", {
        params: { page: pageIndex, limit: pageLimit, search },
      });

      const data = res.data?.data || [];

      return {
        data,
        totalRecords: res.data?.total ?? 0,
        currentPage: res.data?.current_page ?? pageIndex,
        perPage: res.data?.per_page ?? pageLimit,
        lastPage: res.data?.last_page ?? 1,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to fetch users"
      );
    }
  }
);

//  Fetch all active supervisor
export const fetchActiveSupervisor = createAsyncThunk(
  "users/fetchActiveSupervisor",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/user/get-supervisor");
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to fetch users");
    }
  }
);

//  Add user
export const addUser = createAsyncThunk(
  "users/add",
  async (newUser, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/user/store", newUser);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

//  Update user
export const updateUser = createAsyncThunk(
  "users/update",
  async ({ id, ...updated }, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/user/update/${id}`, updated);
      successMessage(res.data.message);
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
  "users/statusUpdate",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/user/status-update", { id, status });
      successMessage(res.data.message);
      return { id, status };
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

//  Delete user
export const deleteUser = createAsyncThunk(
  "users/delete",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/user/delete/${id}`);
      successMessage(res.data.message);
      return id;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// ---------------- Slice ----------------
const userSlice = createSlice({
  name: "users",
  initialState: {
    data: [],
    supervisor: [],
    loading: false,
    error: null,
    totalRows: 0,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data; // Fixed: Extract the data array
        state.totalRows = action.payload.totalRecords;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchUsersWithSearch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsersWithSearch.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data; // Fixed: Extract the data array
        state.totalRows = action.payload.totalRecords;
      })
      .addCase(fetchUsersWithSearch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetch Active Supervisor
      .addCase(fetchActiveSupervisor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveSupervisor.fulfilled, (state, action) => {
        state.loading = false;
        state.supervisor = action.payload;
      })
      .addCase(fetchActiveSupervisor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add
      .addCase(addUser.fulfilled, (state, action) => {
        if (Array.isArray(state.data)) {
          state.data.unshift(action.payload);
        }
      })

      // Update
      .addCase(updateUser.fulfilled, (state, action) => {
        if (Array.isArray(state.data)) {
          const index = state.data.findIndex((u) => u.id === action.payload.id);
          if (index !== -1) state.data[index] = action.payload;
        }
      })

      // Status Update
      .addCase(statusUpdate.fulfilled, (state, action) => {
        if (Array.isArray(state.data)) {
          const user = state.data.find((u) => u.id === action.payload.id);
          if (user) user.status = action.payload.status;
        }
      })

      // Delete
      .addCase(deleteUser.fulfilled, (state, action) => {
        if (Array.isArray(state.data)) {
          state.data = state.data.filter((u) => u.id !== action.payload);
        }
      });
  },
});

export default userSlice.reducer;