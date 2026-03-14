import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api"; // adjust path
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";
// Fetch all products
// export const fetchProducts = createAsyncThunk(
//   "product/fetchAll",
//   async () => {
//     const res = await api.get("admin/product/get-data");
//     return res.data.data;
//   }
// );

export const fetchProducts = createAsyncThunk(
  "product/fetchAll",
  async ({ page = 1, perPage = 10, search = "" } = {}, { rejectWithValue }) => {
    try {
      const params = {
        page,
        per_page: perPage,
      };
      
      if (search) {
        params.search = search;
      }

      const res = await api.get("admin/product/get-data", { params });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch products");
    }
  }
);
export const fetchProductsWithSearch = createAsyncThunk(
  "product/fetchProductsWithSearch",
  async ({ page = 1, perPage = 10, search = "" } = {}, { rejectWithValue }) => {
    try {
      const params = {
        page,
        per_page: perPage,
      };
      
      if (search) {
        params.search = search;
      }

      const res = await api.get("admin/product/get-data", { params });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch products");
    }
  }
);

  export const getDiscardedData = createAsyncThunk(
    "product/getDiscardedData",
    async ({ page = 1, perPage = 10, search = "" } = {}, { rejectWithValue }) => {
      try {
        const params = {
          page,
          per_page: perPage,
        };
        
        if (search) {
          params.search = search;
        }

        const res = await api.get("admin/discard-product/get-data", { params });
        return res.data;
      } catch (error) {
        return rejectWithValue(error.response?.data?.message || "Failed to fetch products");
      }
    }
  );

// Discard stock
export const discardStock = createAsyncThunk(
  "product/discardStock",
  async ({ id, qty, remark }, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/discard-product/remove-from-inventory`, {
        product_id: id,
        qty,
        remark,
      });
      successMessage(res.data.message);
      return res.data.data?.product || res.data.product; // Handle both response structures
    } catch (error) {
      const errMsg = error.response?.data?.message || error.response?.data?.error || "Failed to discard stock";
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);


export const fetchActiveProducts = createAsyncThunk(
  "product/fetchAll",
  async () => {
    const res = await api.get("admin/product/get-data?status=1");
    return res.data.data;
  }
);

// Add product
export const addProduct = createAsyncThunk(
  "product/add",
  async (newData, { rejectWithValue }) => {
    // console.log("sendData:", JSON.stringify(newData, null, 2));

    try {
      const res = await api.post("admin/product/store", newData,);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);


// Update product
export const updateProduct = createAsyncThunk(
  "product/update",
  async ({ updated }, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/product/update/${updated.id}`, updated,);
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
  "product/update",
  async (updated) => {
    try {
      const res = await api.post("admin/product/status-update", {
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

// Delete product
export const deleteProduct = createAsyncThunk("product/delete", async (id) => {
  try {
    const res = await api.post(`admin/product/delete/${id}`);
    successMessage(res.data.message);
    return id;
  } catch (error) {
    const errMsg = getErrorMessage(error);
    errorMessage(errMsg);
    return rejectWithValue(errMsg);
  }
});

// Action to update product RRP
export const updateProductRRP = createAsyncThunk(
  "product/updateRRP",
  async (rrpData, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `admin/production-order/calculate-rrp`,
        {
          miscellaneous_cost: rrpData.miscellaneous_cost,
          gross_profit: rrpData.gross_profit,
          id: rrpData.id,
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to update RRP");
    }
  }
);

const productSlice = createSlice({
  name: "product",
  initialState: {
    data: [],
    searchData: [],
    loading: false,
    error: null,
    meta: {
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: 0,
      from: 0,
      to: 0,
    },
    discardedData: [],
    discardedLoading: false,
    discardedError: null,
    discardedTotal: 0,
    discardedCurrentPage: 1,
    discardedPerPage: 10,
    discardedLastPage: 1,
    searchTerm: "",
  },
  reducers: {
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    clearSearch: (state) => {
      state.searchTerm = "";
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
       .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchProductsWithSearch.fulfilled, (state, action) => {
        state.loading = false;
        state.searchData = Array.isArray(action.payload.data) ? action.payload.data : [];
        state.meta = action.payload.meta || state.meta;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch getDiscardedData
       .addCase(getDiscardedData.pending, (state) => {
        state.discardedLoading = true;
        state.discardedError = null;
      })
      .addCase(getDiscardedData.fulfilled, (state, action) => {
        state.discardedLoading = false;
        state.discardedData = action.payload.data || [];
        state.discardedTotal = action.payload.total || 0;
        state.discardedCurrentPage = action.payload.current_page || 1;
        state.discardedPerPage = action.payload.per_page || 10;
        state.discardedLastPage = action.payload.last_page || 1;
      })
      .addCase(getDiscardedData.rejected, (state, action) => {
        state.discardedLoading = false;
        state.discardedError = action.payload;
        state.discardedData = [];
      })
      
      // Discard stock
      .addCase(discardStock.fulfilled, (state, action) => {
        const updatedProduct = action.payload;
        state.data = state.data.map((item) =>
          item.id === updatedProduct.id ? updatedProduct : item
        );
      })
      
      // Add
      .addCase(addProduct.fulfilled, (state, action) => {
        state.data.unshift(action.payload);
      })
      // Update
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.data.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) state.data[index] = action.payload;
      })
      // Delete
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.data = state.data.filter((d) => d.id !== action.payload);
      })
      // Add to extraReducers in your slice
      .addCase(updateProductRRP.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProductRRP.fulfilled, (state, action) => {
        state.loading = false;
        // Update the product in the state
        const index = state.data.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = { ...state.data[index], ...action.payload };
        }
      })
      .addCase(updateProductRRP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

  },
});
export const { setSearchTerm, clearSearch } = productSlice.actions;
export default productSlice.reducer;
