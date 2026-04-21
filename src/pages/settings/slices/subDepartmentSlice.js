import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../api';
import { successMessage, errorMessage, getErrorMessage } from '../../../toast';

// Thunks
export const fetchSubDepartments = createAsyncThunk(
  'subDepartment/fetchAll',
  async (departmentId, { rejectWithValue }) => {
    try {
      const res = await api.get(`admin/sub-department/get-data?department_id=${departmentId}`);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const fetchActiveSubDepartments = createAsyncThunk(
  'subDepartment/fetchActiveSubDepartments',
  async (departmentId, { rejectWithValue }) => {
    try {
      const res = await api.get(`admin/sub-department/get-data?department_id=${departmentId}&status=1`);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const addSubDepartment = createAsyncThunk(
  'subDepartment/add',
  async (newData, { rejectWithValue }) => {
    try {
      const res = await api.post('admin/sub-department/store', newData);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const updateSubDepartment = createAsyncThunk(
  'subDepartment/update',
  async (updated, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/sub-department/update/${updated.id}`, updated);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const statusUpdate = createAsyncThunk(
  'subDepartment/statusUpdate',
  async (updated, { rejectWithValue }) => {
    try {
      const res = await api.post('admin/sub-department/status-update', {
        id: updated.id,
        status: updated.status,
      });
      successMessage(res.data.message);
      return updated;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const deleteSubDepartment = createAsyncThunk(
  'subDepartment/delete',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/sub-department/delete/${id}`, { id });
      successMessage(res.data.message || 'Sub-department deleted successfully!');
      return id;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const sequenceUpdate = createAsyncThunk(
  'subDepartment/sequenceUpdate',
  async (updated, { rejectWithValue }) => {
    try {
      const res = await api.post('admin/sub-department/sequence-update', updated);
      successMessage(res.data.message);
      return updated;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Slice
const subDepartmentSlice = createSlice({
  name: 'subDepartment',
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearSubDepartments: (state) => {
      state.data = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchSubDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubDepartments.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchSubDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      .addCase(fetchActiveSubDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveSubDepartments.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchActiveSubDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // Add
      .addCase(addSubDepartment.fulfilled, (state, action) => {
        state.data.unshift(action.payload);
      })

      // Update
      .addCase(updateSubDepartment.fulfilled, (state, action) => {
        const index = state.data.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
      })

      // Status Update
      .addCase(statusUpdate.fulfilled, (state, action) => {
        const index = state.data.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) {
          state.data[index].status = action.payload.status;
        }
      })

      // Sequence Update
      .addCase(sequenceUpdate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sequenceUpdate.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.data.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) {
          state.data[index].sequence = action.payload.sequence;
        }
      })
      .addCase(sequenceUpdate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // Delete
      .addCase(deleteSubDepartment.fulfilled, (state, action) => {
        state.data = state.data.filter((item) => item.id !== action.meta.arg);
      });
  },
});

export const { clearSubDepartments } = subDepartmentSlice.actions;
export default subDepartmentSlice.reducer;