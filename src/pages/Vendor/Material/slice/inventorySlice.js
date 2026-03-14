import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../../api";
import { errorMessage, getErrorMessage } from "../../../../toast";

// Fetch inventory/material logs
export const fetchInventory = createAsyncThunk(
    "inventory/fetchInventory",
    async ({ materialId = "", startDate = "", endDate = "", page = 1, perPage = 10 } = {}, { rejectWithValue }) => {
        try {
            const params = {
                page,
                per_page: perPage
            };

            if (materialId) params.material_id = materialId;
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;

            const res = await api.post("/admin/material/material-logs", null, { params });

            return {
                data: res.data.data || [],
                total: res.data.total || 0,
                currentPage: res.data.current_page || 1,
                lastPage: res.data.last_page || 1,
                perPage: res.data.per_page || perPage,
                viewType: res.data.view_type || 'logs',
            };
        } catch (error) {
            const errMsg = getErrorMessage(error);
            errorMessage(errMsg);
            return rejectWithValue(errMsg);
        }
    }
);

const inventorySlice = createSlice({
    name: "inventory",
    initialState: {
        data: [],
        loading: false,
        error: null,
        viewType: 'logs', // 'logs' or 'summary'
        filters: {
            materialId: "",
            startDate: "",
            endDate: "",
        },
        pagination: {
            currentPage: 1,
            perPage: 10,
            total: 0,
            lastPage: 1,
        },
    },
    reducers: {
        setMaterialFilter: (state, action) => {
            state.filters.materialId = action.payload;
            state.pagination.currentPage = 1;
        },
        setDateRange: (state, action) => {
            state.filters.startDate = action.payload.startDate;
            state.filters.endDate = action.payload.endDate;
            state.pagination.currentPage = 1;
        },
        clearFilters: (state) => {
            state.filters = {
                materialId: "",
                startDate: "",
                endDate: "",
            };
            state.pagination.currentPage = 1;
            state.viewType = 'logs';
        },
        resetPagination: (state) => {
            state.pagination.currentPage = 1;
        },
        clearInventoryData: (state) => {
            state.data = [];
            state.pagination = {
                currentPage: 1,
                perPage: 10,
                total: 0,
                lastPage: 1,
            };
            state.error = null;
            state.viewType = 'logs';
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchInventory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchInventory.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload.data;
                state.viewType = action.payload.viewType;
                state.pagination = {
                    currentPage: action.payload.currentPage,
                    perPage: action.payload.perPage,
                    total: action.payload.total,
                    lastPage: action.payload.lastPage,
                };
                state.error = null;
            })
            .addCase(fetchInventory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.data = [];
            });
    },
});

export const {
    setMaterialFilter,
    setDateRange,
    clearFilters,
    resetPagination,
    clearInventoryData,
} = inventorySlice.actions;

export default inventorySlice.reducer;