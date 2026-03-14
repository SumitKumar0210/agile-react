import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Typography,
  Paper,
  Box,
  IconButton,
  Tooltip,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
} from "material-react-table";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
import { IoMdRefresh } from "react-icons/io";
import { MdFilterList, MdClear } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { fetchInventory, setMaterialFilter, setDateRange, clearFilters } from "./slice/inventorySlice";
import { fetchActiveMaterials } from "../../settings/slices/materialSlice";

// Error Boundary
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
        <Box sx={{ p: 3, textAlign: "center", color: "red" }}>
          <Typography variant="h6">Something went wrong.</Typography>
          <Typography variant="body2">{this.state.error?.message}</Typography>
        </Box>
      );
    }
    return this.props.children;
  }
}

const Inventory = () => {
  const dispatch = useDispatch();
  const tableContainerRef = useRef(null);

  const { 
    data: inventoryData = [],
    loading, 
    error,
    viewType = 'logs', // 'logs' or 'summary'
    filters,
    pagination: reduxPagination,
  } = useSelector((state) => state.inventory);

  const { data: materials = [] } = useSelector((state) => state.material);
  
  console.log("Inventory Data:", inventoryData);
  console.log("View Type:", viewType);

  // Local state
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Check if showing summary with all materials
  const isShowingSummary = viewType === 'summary';
  const isShowingAllMaterials = isShowingSummary && !selectedMaterial;

  // Initial fetch
  useEffect(() => {
    dispatch(fetchActiveMaterials()); // Fetch materials for dropdown
    dispatch(fetchInventory({
      page: 1,
      perPage: 10,
    }));
  }, [dispatch]);

  // Handle filter changes
  const handleApplyFilters = useCallback(() => {
    const params = {
      page: 1,
      perPage: pagination.pageSize,
    };

    // User can choose to filter by material or show all
    if (selectedMaterial) {
      params.materialId = selectedMaterial;
    }
    
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    // Update filters in Redux
    dispatch(setMaterialFilter(selectedMaterial));
    dispatch(setDateRange({ startDate, endDate }));
    dispatch(fetchInventory(params));
    
    // Reset to first page
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [dispatch, selectedMaterial, startDate, endDate, pagination.pageSize]);

  // Handle pagination change
  const handlePaginationChange = useCallback((updater) => {
    setPagination((prev) => {
      const newPagination = typeof updater === 'function' ? updater(prev) : updater;
      
      // Fetch new page data
      const params = {
        page: newPagination.pageIndex + 1,
        perPage: newPagination.pageSize,
      };

      if (selectedMaterial) {
        params.materialId = selectedMaterial;
      }
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      dispatch(fetchInventory(params));
      
      return newPagination;
    });
  }, [dispatch, selectedMaterial, startDate, endDate]);

  // Refresh data
  const handleRefresh = useCallback(() => {
    const params = {
      page: pagination.pageIndex + 1,
      perPage: pagination.pageSize,
    };

    if (selectedMaterial) {
      params.materialId = selectedMaterial;
    }
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    dispatch(fetchInventory(params));
  }, [dispatch, pagination.pageIndex, pagination.pageSize, selectedMaterial, startDate, endDate]);

  // Clear filters
  const handleClearFilters = useCallback(() => {
    setSelectedMaterial("");
    setStartDate("");
    setEndDate("");
    dispatch(clearFilters());
    dispatch(fetchInventory({
      page: 1,
      perPage: pagination.pageSize,
    }));
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [dispatch, pagination.pageSize]);

  // Summary columns (shown when date range is selected)
  const summaryColumns = useMemo(
    () => [
      {
        accessorKey: "material_name",
        header: "Material Name",
        size: 200,
        Cell: ({ cell }) => loading ? <Skeleton variant="text" width="80%" /> : (
          <Typography fontWeight="600">{cell.getValue() || "-"}</Typography>
        ),
      },
      {
        accessorKey: "opening_stock",
        header: "Opening Stock",
        size: 150,
        Cell: ({ cell }) => {
          if (loading) return <Skeleton variant="text" width="80%" />;
          return (
            <Typography fontWeight="600" color="text.primary">
              {cell.getValue() || 0}
            </Typography>
          );
        },
      },
      {
        accessorKey: "total_in",
        header: "Total IN",
        size: 130,
        Cell: ({ cell }) => {
          if (loading) return <Skeleton variant="text" width="80%" />;
          const value = cell.getValue() || 0;
          return (
            <Typography color="success.main" fontWeight="600">
              +{value}
            </Typography>
          );
        },
      },
      {
        accessorKey: "total_out",
        header: "Total OUT",
        size: 130,
        Cell: ({ cell }) => {
          if (loading) return <Skeleton variant="text" width="80%" />;
          const value = cell.getValue() || 0;
          return (
            <Typography color="error.main" fontWeight="600">
              -{value}
            </Typography>
          );
        },
      },
      {
        accessorKey: "closing_stock",
        header: "Closing Stock",
        size: 150,
        Cell: ({ cell }) => {
          if (loading) return <Skeleton variant="text" width="80%" />;
          return (
            <Typography fontWeight="700" color="primary.main" fontSize="1.1rem">
              {cell.getValue() || 0}
            </Typography>
          );
        },
      },
    ],
    [loading]
  );

  // Transaction logs columns (default view)
  const logsColumns = useMemo(
    () => [
      {
        accessorKey: "material_name",
        header: "Material Name",
        size: 200,
        Cell: ({ cell }) => loading ? <Skeleton variant="text" width="80%" /> : (
          <Typography fontWeight="600">{cell.getValue() || "-"}</Typography>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        size: 100,
        Cell: ({ cell }) => {
          if (loading) return <Skeleton variant="text" width="80%" />;
          const value = cell.getValue();
          return (
            <Box
              sx={{
                display: "inline-block",
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                bgcolor: value === "IN" ? "success.light" : "error.light",
                color: value === "IN" ? "success.dark" : "error.dark",
                fontWeight: 600,
                fontSize: "0.875rem",
              }}
            >
              {value || "-"}
            </Box>
          );
        },
      },
      {
        accessorKey: "qty",
        header: "Quantity",
        size: 120,
        Cell: ({ cell, row }) => {
          if (loading) return <Skeleton variant="text" width="80%" />;
          const value = cell.getValue();
          const type = row.original.type;
          return (
            <Typography 
              color={type === "IN" ? "success.main" : "error.main"} 
              fontWeight="600"
            >
              {type === "IN" ? "+" : "-"}{value || 0}
            </Typography>
          );
        },
      },
      // {
      //   accessorKey: "previous_qty",
      //   header: "Previous Stock",
      //   size: 130,
      //   Cell: ({ cell }) => {
      //     if (loading) return <Skeleton variant="text" width="80%" />;
      //     return (
      //       <Typography color="text.secondary">
      //         {cell.getValue() !== null ? cell.getValue() : "-"}
      //       </Typography>
      //     );
      //   },
      // },
      // {
      //   accessorKey: "new_qty",
      //   header: "New Stock",
      //   size: 130,
      //   Cell: ({ cell }) => {
      //     if (loading) return <Skeleton variant="text" width="80%" />;
      //     return (
      //       <Typography fontWeight="600" color="primary.main">
      //         {cell.getValue() !== null ? cell.getValue() : "-"}
      //       </Typography>
      //     );
      //   },
      // },
      // {
      //   accessorKey: "reference_type",
      //   header: "Reference",
      //   size: 150,
      //   Cell: ({ cell, row }) => {
      //     if (loading) return <Skeleton variant="text" width="80%" />;
      //     const refType = cell.getValue();
      //     const refId = row.original.reference_id;
      //     if (!refType) return "-";
      //     return (
      //       <Typography variant="body2" color="text.secondary">
      //         {refType} #{refId}
      //       </Typography>
      //     );
      //   },
      // },
      // {
      //   accessorKey: "remarks",
      //   header: "Remarks",
      //   size: 200,
      //   Cell: ({ cell }) => {
      //     if (loading) return <Skeleton variant="text" width="80%" />;
      //     return (
      //       <Typography variant="body2" color="text.secondary">
      //         {cell.getValue() || "-"}
      //       </Typography>
      //     );
      //   },
      // },
      {
        accessorKey: "created_at",
        header: "Date",
        size: 180,
        Cell: ({ cell }) => {
          if (loading) return <Skeleton variant="text" width="80%" />;
          const date = cell.getValue();
          if (!date) return "-";
          return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        },
      },
    ],
    [loading]
  );

  // Select columns based on view type
  const columns = viewType === 'summary' ? summaryColumns : logsColumns;

  // Download CSV
  const downloadCSV = useCallback(() => {
    try {
      let headers, rows;

      if (viewType === 'summary') {
        headers = ["Material Name", "Opening Stock", "Total IN", "Total OUT", "Closing Stock"];
        rows = inventoryData.map((row) => [
          row.material_name || "",
          row.opening_stock || 0,
          row.total_in || 0,
          row.total_out || 0,
          row.closing_stock || 0,
        ]);
      } else {
        headers = [
          "Material Name",
          "Type",
          "Quantity",
          "Previous Stock",
          "New Stock",
          "Reference",
          "Remarks",
          "Date"
        ];

        rows = inventoryData.map((row) => [
          row.material_name || "",
          row.type || "",
          row.qty !== null ? row.qty : 0,
          row.previous_qty !== null ? row.previous_qty : 0,
          row.new_qty !== null ? row.new_qty : 0,
          row.reference_type ? `${row.reference_type} #${row.reference_id}` : "",
          row.remarks || "",
          row.created_at || ""
        ]);
      }

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
      const filename = viewType === 'summary' 
        ? `Material_Summary_${new Date().toISOString().split("T")[0]}.csv`
        : `Material_Logs_${new Date().toISOString().split("T")[0]}.csv`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("CSV download error:", error);
    }
  }, [inventoryData, viewType]);

  // Print handler
  const handlePrint = useCallback(() => {
    if (!tableContainerRef.current) return;
    try {
      const printWindow = window.open("", "", "height=600,width=1200");
      if (!printWindow) return;
      
      const title = viewType === 'summary' ? 'Material Summary Report' : 'Material Transaction Logs';
      const materialInfo = selectedMaterial && viewType === 'summary'
        ? `<p><strong>Material:</strong> ${materials.find(m => m.id === parseInt(selectedMaterial))?.name || 'Selected Material'}</p>`
        : isShowingAllMaterials 
        ? '<p><strong>Showing:</strong> All Materials</p>'
        : '';
      const dateInfo = viewType === 'summary' && startDate && endDate 
        ? `<p><strong>Period:</strong> ${startDate} to ${endDate}</p>`
        : '';
      
      const printContent = `
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { text-align: center; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f5f5f5; font-weight: bold; }
              .success { color: green; }
              .error { color: red; }
              .info { margin-bottom: 15px; }
            </style>
          </head>
          <body>
            <h1>${title}</h1>
            <div class="info">
              <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
              ${materialInfo}
              ${dateInfo}
            </div>
            ${tableContainerRef.current.innerHTML}
          </body>
        </html>
      `;
      
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      console.error("Print error:", error);
    }
  }, [viewType, startDate, endDate, selectedMaterial, materials, isShowingAllMaterials]);

  const totalRecords = reduxPagination?.total || 0;
  const hasActiveFilters = selectedMaterial || startDate || endDate;

  return (
    <ErrorBoundary>
      <Grid container spacing={2}>
        {/* Filters Section */}
        <Grid size={12}>
          <Paper
            elevation={0}
            sx={{
              width: "100%",
              backgroundColor: "#fff",
              p: 2,
              mb: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
              <MdFilterList size={24} style={{ marginRight: 8 }} />
              <Typography variant="h6">Filters</Typography>
              {hasActiveFilters && (
                <Box
                  sx={{
                    px: 1,
                    py: 0.5,
                    bgcolor: viewType === 'summary' ? "info.light" : "primary.light",
                    color: viewType === 'summary' ? "info.dark" : "primary.dark",
                    borderRadius: 1,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}
                >
                  {viewType === 'summary' ? 'Summary View' : 'Logs View'}
                </Box>
              )}
              {isShowingAllMaterials && (
                <Box
                  sx={{
                    px: 1,
                    py: 0.5,
                    bgcolor: "success.light",
                    color: "success.dark",
                    borderRadius: 1,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}
                >
                  All Materials
                </Box>
              )}
              {selectedMaterial && viewType === 'summary' && (
                <Box
                  sx={{
                    px: 1,
                    py: 0.5,
                    bgcolor: "warning.light",
                    color: "warning.dark",
                    borderRadius: 1,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}
                >
                  Single Material
                </Box>
              )}
            </Box>
            
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Select Material</InputLabel>
                  <Select
                    value={selectedMaterial}
                    onChange={(e) => setSelectedMaterial(e.target.value)}
                    label="Select Material"
                  >
                    <MenuItem value="">
                      <em>Select Materials</em>
                    </MenuItem>
                    {materials.map((material) => (
                      <MenuItem key={material.id} value={material.id}>
                        {material.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {startDate && endDate && (
                  <></>
                  // <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  //   {selectedMaterial ? 'Showing single material summary' : 'Showing all materials summary'}
                  // </Typography>
                )}
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: startDate }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={{ display: "flex", gap: 1, height: "100%" }}>
                  <Button
                    variant="contained"
                    onClick={handleApplyFilters}
                    startIcon={<MdFilterList />}
                    fullWidth
                    disabled={loading}
                    sx={{ mt: 0 }}
                  >
                    Apply
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleClearFilters}
                    startIcon={<MdClear />}
                    fullWidth
                    disabled={!hasActiveFilters || loading}
                    sx={{ mt: 0 }}
                  >
                    Clear
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Table Section */}
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
            <MaterialReactTable
              columns={columns}
              data={inventoryData}
              getRowId={(row) => row.id}
              manualPagination
              rowCount={totalRecords}
              state={{
                isLoading: loading,
                pagination: pagination,
                showProgressBars: loading,
              }}
              onPaginationChange={handlePaginationChange}
              enableTopToolbar
              enableColumnFilters={false}
              enableSorting={false}
              enablePagination
              enableBottomToolbar
              enableGlobalFilter={false}
              enableDensityToggle={false}
              enableColumnActions={false}
              enableColumnVisibilityToggle={false}
              initialState={{ density: "compact" }}
              muiTableContainerProps={{
                sx: {
                  width: "100%",
                  backgroundColor: "#fff",
                  overflowX: "auto",
                  minWidth: "1000px",
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
              renderTopToolbar={({ table }) => (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    p: 1,
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  <Box>
                    <Typography variant="h6" className='page-title'>
                      {viewType === 'summary' ? 'Material Summary Report' : 'Material Transaction Logs'}
                    </Typography>
                    {hasActiveFilters && (
                      <Typography variant="caption" color="text.secondary">
                        {viewType === 'summary' && startDate && endDate
                          ? `Period: ${startDate} to ${endDate}${isShowingAllMaterials ? ' (All Materials)' : selectedMaterial ? ' (Single Material)' : ''}`
                          : 'Filtered results'
                        }
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <MRT_ToolbarInternalButtons table={table} />
                    <Tooltip title="Refresh">
                      <IconButton onClick={handleRefresh} size="small" disabled={loading}>
                        <IoMdRefresh size={20} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Print">
                      <IconButton onClick={handlePrint} size="small">
                        <FiPrinter size={20} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download CSV">
                      <IconButton onClick={downloadCSV} size="small">
                        <BsCloudDownload size={20} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              )}
              renderBottomToolbarCustomActions={() => (
                <Box sx={{ px: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Records: {totalRecords}
                  </Typography>
                </Box>
              )}
            />
          </Paper>
        </Grid>
      </Grid>
    </ErrorBoundary>
  );
};

export default Inventory;