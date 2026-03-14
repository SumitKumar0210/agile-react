import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Typography,
  Paper,
  Box,
  IconButton,
  Tooltip,
  Skeleton,
  Card,
  CardContent,
  Divider,
  Pagination,
  InputAdornment,
  CircularProgress,
  TextField,
  Chip,
  useMediaQuery,
  useTheme,
  Alert,
  Snackbar
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
  MRT_GlobalFilterTextField,
} from "material-react-table";
import { FiPrinter } from "react-icons/fi";
import { FiUser, FiCalendar } from 'react-icons/fi';
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { PiCurrencyInr } from "react-icons/pi";
import { BsCloudDownload } from "react-icons/bs";
import { IoMdRefresh } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import { fetchStock } from "./slice/stockSlice";
import SearchIcon from "@mui/icons-material/Search";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, textAlign: "center", color: "error.main" }}>
          <Typography variant="h6" gutterBottom>Something went wrong.</Typography>
          <Typography variant="body2" color="text.secondary">
            {this.state.error?.message}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <IconButton 
              onClick={() => window.location.reload()} 
              color="primary"
              variant="contained"
            >
              <IoMdRefresh size={24} />
            </IconButton>
          </Box>
        </Box>
      );
    }
    return this.props.children;
  }
}

const StockInOut = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();
  const tableContainerRef = useRef(null);
  const searchTimerRef = useRef(null);

  const {
    data: stockData = [],
    loading,
    error,
    pagination: reduxPagination,
  } = useSelector((state) => state.stock);

  // State management
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  // Show snackbar helper
  const showSnackbar = useCallback((message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Close snackbar handler
  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(() => {
      if (globalFilter !== debouncedSearch) {
        setDebouncedSearch(globalFilter);
        // Reset to first page when search changes
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
      }
    }, 300);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [globalFilter, debouncedSearch]);

  // Fetch data when pagination or debounced search changes
  useEffect(() => {
    const params = {
      page: pagination.pageIndex + 1,
      perPage: pagination.pageSize,
      searchQuery: debouncedSearch,
    };

    // console.log('Fetching data with params:', params);
    dispatch(fetchStock(params));
  }, [dispatch, pagination.pageIndex, pagination.pageSize, debouncedSearch]);

  // Handle pagination change
  const handlePaginationChange = useCallback((updater) => {
    setPagination((prev) => {
      const newPagination = typeof updater === 'function' ? updater(prev) : updater;
      // console.log('Pagination changed:', newPagination);
      return newPagination;
    });
  }, []);

  // Handle search change (immediate UI update, debounced fetch)
  const handleGlobalFilterChange = useCallback((value) => {
    setGlobalFilter(value || "");
  }, []);

  // Refresh data
  const handleRefresh = useCallback(() => {
    showSnackbar("Refreshing data...", "info");
    dispatch(fetchStock({
      page: pagination.pageIndex + 1,
      perPage: pagination.pageSize,
      searchQuery: debouncedSearch,
    }));
  }, [dispatch, pagination.pageIndex, pagination.pageSize, debouncedSearch, showSnackbar]);

  // Table columns definition
  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        size: 80,
        Cell: ({ cell }) => loading ? <Skeleton variant="text" width="80%" /> : cell.getValue(),
      },
      {
        accessorKey: "product.name",
        header: "Product Name",
        Cell: ({ row }) => {
          if (loading) return <Skeleton variant="text" width="80%" />;
          return row.original.product?.name || "-";
        },
      },
      {
        accessorKey: "in_stock",
        header: "Stock In",
        Cell: ({ cell }) => {
          if (loading) return <Skeleton variant="text" width="80%" />;
          const value = cell.getValue();
          return value !== null && value !== undefined ? (
            <Typography color="success.main" fontWeight="600">
              +{value}
            </Typography>
          ) : (
            <Typography color="text.secondary">-</Typography>
          );
        },
      },
      {
        accessorKey: "out_stock",
        header: "Stock Out",
        Cell: ({ cell }) => {
          if (loading) return <Skeleton variant="text" width="80%" />;
          const value = cell.getValue();
          return value !== null && value !== undefined ? (
            <Typography color="error.main" fontWeight="600">
              -{value}
            </Typography>
          ) : (
            <Typography color="text.secondary">-</Typography>
          );
        },
      },
      {
        accessorKey: "available_qty",
        header: "Available Qty",
        Cell: ({ cell, row }) => {
          if (loading) return <Skeleton variant="text" width="80%" />;

          const value = cell.getValue();
          const inStock = row.original.in_stock;
          const outStock = row.original.out_stock;

          let color = "text.primary";
          if (inStock !== null && inStock !== undefined && inStock > 0) {
            color = "success.main";
          } else if (outStock !== null && outStock !== undefined && outStock > 0) {
            color = "error.main";
          }

          return value !== null && value !== undefined ? (
            <Typography color={color} fontWeight="600">
              {value}
            </Typography>
          ) : (
            <Typography color="text.secondary">-</Typography>
          );
        },
      },
      {
        accessorKey: "created_at",
        header: "Added on",
        Cell: ({ cell }) => {
          if (loading) return <Skeleton variant="text" width="80%" />;
          const date = cell.getValue();
          if (!date) return "-";
          try {
            return new Date(date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          } catch (error) {
            console.error('Date formatting error:', error);
            return "-";
          }
        },
      },
    ],
    [loading]
  );

  // Download CSV functionality
  const downloadCSV = useCallback(() => {
    try {
      if (!stockData || stockData.length === 0) {
        showSnackbar("No data available to download", "warning");
        return;
      }

      const headers = [
        "ID",
        "Product Name",
        "Stock In",
        "Stock Out",
        "Available Qty",
        "Created"
      ];

      const rows = stockData.map((row) => [
        row.id || "",
        row.product?.name || "",
        row.in_stock !== null && row.in_stock !== undefined ? row.in_stock : "",
        row.out_stock !== null && row.out_stock !== undefined ? row.out_stock : "",
        row.available_qty !== null && row.available_qty !== undefined ? row.available_qty : "",
        row.created_at || ""
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Stock_InOut_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showSnackbar("CSV downloaded successfully", "success");
    } catch (error) {
      console.error("CSV download error:", error);
      showSnackbar("Failed to download CSV", "error");
    }
  }, [stockData, showSnackbar]);

  // Print functionality
  const handlePrint = useCallback(() => {
    try {
      if (!stockData || stockData.length === 0) {
        showSnackbar("No data available to print", "warning");
        return;
      }

      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Stock Movement In/Out</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #1976d2; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              th { background-color: #1976d2; color: white; font-weight: bold; }
              tr:nth-child(even) { background-color: #f2f2f2; }
              .success { color: #2e7d32; font-weight: 600; }
              .error { color: #d32f2f; font-weight: 600; }
              .footer { margin-top: 30px; font-size: 12px; color: #666; }
              @media print {
                button { display: none; }
              }
            </style>
          </head>
          <body>
            <h1>Stock Movement In/Out</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product Name</th>
                  <th>Stock In</th>
                  <th>Stock Out</th>
                  <th>Available Qty</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                ${stockData.map(row => `
                  <tr>
                    <td>${row.id || '-'}</td>
                    <td>${row.product?.name || '-'}</td>
                    <td class="success">${row.in_stock !== null && row.in_stock !== undefined ? '+' + row.in_stock : '-'}</td>
                    <td class="error">${row.out_stock !== null && row.out_stock !== undefined ? '-' + row.out_stock : '-'}</td>
                    <td>${row.available_qty !== null && row.available_qty !== undefined ? row.available_qty : '-'}</td>
                    <td>${row.created_at ? new Date(row.created_at).toLocaleDateString() : '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="footer">
              <p>Total Records: ${stockData.length}</p>
            </div>
          </body>
        </html>
      `;

      const printWindow = window.open("", "_blank", "width=1200,height=600");
      if (!printWindow) {
        showSnackbar("Please allow pop-ups to print", "warning");
        return;
      }
      
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Wait for content to load before printing
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
      
      showSnackbar("Print dialog opened", "success");
    } catch (error) {
      console.error("Print error:", error);
      showSnackbar("Failed to print", "error");
    }
  }, [stockData, showSnackbar]);

  // Calculate total records from Redux state
  const totalRecords = reduxPagination?.total || 0;
  const totalPages = Math.ceil(totalRecords / pagination.pageSize);

  // Mobile pagination handlers
  const handleMobilePageChange = useCallback((event, value) => {
    setPagination((prev) => ({ ...prev, pageIndex: value - 1 }));
  }, []);

  // Mobile card component
  const MobileStockCard = ({ item }) => (
    <Card 
      sx={{ 
        mb: 2, 
        boxShadow: 2, 
        overflow: "hidden", 
        borderRadius: 2,
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3
        }
      }}
    >
      {/* Header Section - Blue Background */}
      <Box
        sx={{
          bgcolor: "primary.main",
          p: 1.5,
          color: "primary.contrastText",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "white", mb: 0.5 }}>
              {item.product?.name || "Unknown Product"}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <FiCalendar size={14} />
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)" }}>
                {item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                }) : 'N/A'}
              </Typography>
            </Box>
          </Box>
          {/* <Chip
            label={`ID: ${item.id}`}
            size="small"
            sx={{
              bgcolor: "white",
              color: "primary.main",
              fontWeight: 500,
              fontSize: "0.75rem",
            }}
          /> */}
        </Box>
      </Box>

      {/* Body Section */}
      <CardContent sx={{ p: 1.5 }}>
        <Grid container spacing={1}>
          <Grid size={4}>
            <Box sx={{ display: "flex", alignItems: "start", gap: 1, borderRight: '1px solid', borderColor: 'divider', pr: 1 }}>
              <Box
                sx={{
                  color: "success.main",
                  mt: 0.2,
                }}
              >
                <IoMdCheckmarkCircleOutline size={16} />
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    display: "block",
                    fontSize: "0.85rem",
                    mb: 0.3,
                  }}
                >
                  Stock In
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "0.875rem", color: "success.main" }}>
                  {item.in_stock !== null && item.in_stock !== undefined ? `+${item.in_stock}` : '-'}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid size={4}>
            <Box sx={{ display: "flex", alignItems: "start", gap: 1, borderRight: '1px solid', borderColor: 'divider', pr: 1 }}>
              <Box
                sx={{
                  color: "error.main",
                  mt: 0.2,
                }}
              >
                <IoMdCheckmarkCircleOutline size={16} />
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    display: "block",
                    fontSize: "0.85rem",
                    mb: 0.3,
                  }}
                >
                  Stock Out
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "0.875rem", color: "error.main" }}>
                  {item.out_stock !== null && item.out_stock !== undefined ? `-${item.out_stock}` : '-'}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid size={4}>
            <Box sx={{ display: "flex", alignItems: "start", gap: 1 }}>
              <Box
                sx={{
                  color: "primary.main",
                  mt: 0.2,
                }}
              >
                <IoMdCheckmarkCircleOutline size={16} />
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    display: "block",
                    fontSize: "0.85rem",
                    mb: 0.3,
                  }}
                >
                  Avl. Qty
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 500, 
                    fontSize: "0.875rem",
                    color: item.available_qty > 0 ? "success.main" : "text.primary"
                  }}
                >
                  {item.available_qty !== null && item.available_qty !== undefined ? item.available_qty : '-'}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <>
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Page Header - Only show on mobile */}
      {isMobile && (
        <Grid
          container
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Grid size={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" className="page-title">
                Stock Movement In/Out
              </Typography>
              {/* <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Refresh">
                  <IconButton onClick={handleRefresh} size="small" disabled={loading}>
                    <IoMdRefresh size={20} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download CSV">
                  <IconButton onClick={downloadCSV} size="small" disabled={loading || !stockData?.length}>
                    <BsCloudDownload size={20} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Print">
                  <IconButton onClick={handlePrint} size="small" disabled={loading || !stockData?.length}>
                    <FiPrinter size={20} />
                  </IconButton>
                </Tooltip>
              </Box> */}
            </Box>
          </Grid>
        </Grid>
      )}

      <ErrorBoundary>
        {isMobile ? (
          // 🔹 MOBILE VIEW (Cards)
          <>
            <Box sx={{ minHeight: '100vh' }}>
              {/* Mobile Search */}
              <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search stock movements..."
                  value={globalFilter}
                  onChange={(e) => handleGlobalFilterChange(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  disabled={loading}
                />
              </Paper>

              {/* Loading State */}
              {loading && !stockData?.length && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              )}

              {/* Error State */}
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {/* Empty State */}
              {!loading && !error && (!stockData || stockData.length === 0) && (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No stock movements found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {globalFilter ? 'Try adjusting your search' : 'Start by adding stock movements'}
                  </Typography>
                </Paper>
              )}

              {/* Stock Cards */}
              {!error && stockData && stockData.length > 0 && (
                <>
                  {stockData.map((item) => (
                    <MobileStockCard key={item.id} item={item} />
                  ))}
                </>
              )}

              {/* Mobile Pagination */}
              {!loading && !error && stockData && stockData.length > 0 && totalPages > 1 && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 3, mb: 2 }}>
                  <Pagination
                    count={totalPages}
                    page={pagination.pageIndex + 1}
                    onChange={handleMobilePageChange}
                    color="primary"
                    disabled={loading}
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}

              {/* Record Count */}
              {!loading && !error && stockData && stockData.length > 0 && (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Showing {pagination.pageIndex * pagination.pageSize + 1} to{' '}
                    {Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRecords)} of{' '}
                    {totalRecords} records
                  </Typography>
                </Box>
              )}
            </Box>
          </>
        ) : (
          // 🔹 DESKTOP VIEW (Table)
          <Grid container spacing={2}>
            <Grid size={12}>
              <Paper
                elevation={0}
                ref={tableContainerRef}
                sx={{
                  width: "100%",
                  overflow: "hidden",
                  backgroundColor: "#fff",
                  px: 2,
                  py: 1,
                }}
              >
                {/* Error Alert for Desktop */}
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                <MaterialReactTable
                  columns={columns}
                  data={stockData || []}
                  getRowId={(row) => row.id}
                  manualPagination
                  manualFiltering
                  rowCount={totalRecords}
                  state={{
                    isLoading: loading,
                    pagination: pagination,
                    globalFilter,
                    showProgressBars: loading,
                  }}
                  onPaginationChange={handlePaginationChange}
                  onGlobalFilterChange={handleGlobalFilterChange}
                  enableTopToolbar
                  enableColumnFilters={false}
                  enableSorting={false}
                  enablePagination
                  enableBottomToolbar
                  enableGlobalFilter
                  enableDensityToggle={false}
                  enableColumnActions={false}
                  enableColumnVisibilityToggle={false}
                  initialState={{ density: "compact" }}
                  muiTableContainerProps={{
                    sx: {
                      width: "100%",
                      backgroundColor: "#fff",
                      overflowX: "auto",
                      minWidth: "800px",
                    },
                  }}
                  muiTablePaperProps={{
                    sx: { backgroundColor: "#fff", boxShadow: "none" },
                  }}
                  muiPaginationProps={{
                    rowsPerPageOptions: [5, 10, 20, 50, 100],
                    showFirstButton: true,
                    showLastButton: true,
                  }}
                  muiTableBodyProps={{
                    sx: {
                      '& tr:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      },
                    },
                  }}
                  renderTopToolbar={({ table }) => (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        p: 1,
                        flexWrap: 'wrap',
                        gap: 1
                      }}
                    >
                      <Typography variant="h6" className='page-title'>
                        Stock Movement In/Out
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: 'wrap' }}>
                        <MRT_GlobalFilterTextField table={table} />
                        <MRT_ToolbarInternalButtons table={table} />
                        <Tooltip title="Refresh">
                          <IconButton onClick={handleRefresh} size="small" disabled={loading}>
                            <IoMdRefresh size={20} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Print">
                          <IconButton 
                            onClick={handlePrint} 
                            size="small"
                            disabled={loading || !stockData?.length}
                          >
                            <FiPrinter size={20} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download CSV">
                          <IconButton 
                            onClick={downloadCSV} 
                            size="small"
                            disabled={loading || !stockData?.length}
                          >
                            <BsCloudDownload size={20} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  )}
                  renderEmptyRowsFallback={() => (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No stock movements found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {globalFilter ? 'Try adjusting your search filters' : 'Start by adding stock movements to the system'}
                      </Typography>
                    </Box>
                  )}
                />
              </Paper>
            </Grid>
          </Grid>
        )}
      </ErrorBoundary>
    </>
  );
};

export default StockInOut;