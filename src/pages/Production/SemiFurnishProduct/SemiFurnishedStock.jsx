import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Typography,
  Paper,
  Box,
  IconButton,
  Tooltip,
  Skeleton,
  Chip,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
} from "material-react-table";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
import { IoMdRefresh } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import { getSemiProductLogs } from "./semiFurnishedProductSlice"; // adjust path as needed

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

const SemiFurnishedStock = () => {
  const dispatch = useDispatch();
  const tableContainerRef = useRef(null);

  const {
    logs: inventoryData = [],
    logsLoading: loading,
    logsError: error,
  } = useSelector((state) => state.semiFurnishedProduct);

  // Local pagination (client-side since API returns all records)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Initial fetch
  useEffect(() => {
    dispatch(getSemiProductLogs());
  }, [dispatch]);

  // Refresh data
  const handleRefresh = useCallback(() => {
    dispatch(getSemiProductLogs());
  }, [dispatch]);

  const formatBatchNo = (batchNo) => {
  if (!batchNo) return "—";
  return batchNo.replace(/^PO/i, "item");
};

  // Columns
  const columns = useMemo(
    () => [
      {
        accessorKey: "semi_furnished_product.name",
        header: "Product Name",
        size: 220,
        Cell: ({ cell }) =>
          loading ? (
            <Skeleton variant="text" width="80%" />
          ) : (
            <Typography fontWeight="600">
              {cell.getValue()?.trim() || "-"}
            </Typography>
          ),
      },
      {
        id: "transaction_type",
        header: "Type",
        size: 110,
        accessorFn: (row) => (row.in_stock > 0 ? "IN" : "OUT"),
        Cell: ({ cell }) => {
          if (loading) return <Skeleton variant="text" width="60%" />;
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
                fontWeight: 700,
                fontSize: "0.8rem",
              }}
            >
              {value}
            </Box>
          );
        },
      },
      {
        id: "qty_changed",
        header: "Quantity",
        size: 120,
        accessorFn: (row) => (row.in_stock > 0 ? row.in_stock : row.out_stock),
        Cell: ({ cell, row }) => {
          if (loading) return <Skeleton variant="text" width="60%" />;
          const isIn = row.original.in_stock > 0;
          return (
            <Typography
              fontWeight="700"
              color={isIn ? "success.main" : "error.main"}
            >
              {isIn ? "+" : "-"}
              {cell.getValue()}
            </Typography>
          );
        },
      },
      {
        accessorKey: "in_stock",
        header: "Stock IN",
        size: 120,
        Cell: ({ cell }) => {
          if (loading) return <Skeleton variant="text" width="60%" />;
          const value = cell.getValue();
          return (
            <Typography color={value > 0 ? "success.main" : "text.disabled"} fontWeight="600">
              {value > 0 ? `+${value}` : "-"}
            </Typography>
          );
        },
      },
      {
        accessorKey: "out_stock",
        header: "Stock OUT",
        size: 120,
        Cell: ({ cell }) => {
          if (loading) return <Skeleton variant="text" width="60%" />;
          const value = cell.getValue();
          return (
            <Typography color={value > 0 ? "error.main" : "text.disabled"} fontWeight="600">
              {value > 0 ? `-${value}` : "-"}
            </Typography>
          );
        },
      },
      {
        accessorKey: "available_qty",
        header: "Available Stock",
        size: 150,
        Cell: ({ cell }) => {
          if (loading) return <Skeleton variant="text" width="70%" />;
          const value = cell.getValue();
          return (
            <Typography fontWeight="700" color="primary.main" fontSize="1rem">
              {value ?? "-"}
            </Typography>
          );
        },
      },
      {
        accessorKey: "semi_furnished_product.production_order.batch_no",
        header: "Production Order",
        size: 150,
        Cell: ({ cell }) => {
          if (loading) return <Skeleton variant="text" width="70%" />;
          const value = formatBatchNo(cell.getValue());
          return (
            <Typography fontWeight="700" color="primary.main" fontSize="1rem">
              {value ?? "-"}
            </Typography>
          );
        },
      },
      {
        accessorKey: "semi_furnished_product.unit_price",
        header: "Unit Price",
        size: 120,
        Cell: ({ cell }) => {
          if (loading) return <Skeleton variant="text" width="60%" />;
          const value = cell.getValue();
          return (
            <Typography color="text.secondary" fontWeight="500">
              {value ? `₹${parseFloat(value).toLocaleString("en-IN")}` : "-"}
            </Typography>
          );
        },
      },
      {
        accessorKey: "created_at",
        header: "Date & Time",
        size: 190,
        Cell: ({ cell }) => {
          if (loading) return <Skeleton variant="text" width="80%" />;
          const date = cell.getValue();
          if (!date) return "-";
          return (
            <Typography variant="body2" color="text.secondary">
              {new Date(date).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Typography>
          );
        },
      },
    ],
    [loading]
  );

  // Download CSV
  const downloadCSV = useCallback(() => {
    try {
      const headers = [
        "Product Name",
        "Type",
        "Quantity",
        "Stock IN",
        "Stock OUT",
        "Production Order",
        "Available Stock",
        "Unit Price",
        "Date",
      ];

      const rows = inventoryData.map((row) => {
        const isIn = row.in_stock > 0;
        return [
          row.semi_furnished_product?.name?.trim() || "",
          isIn ? "IN" : "OUT",
          isIn ? row.in_stock : row.out_stock,
          row.in_stock,
          row.out_stock,
          row.semi_furnished_product?.production_order?.batch_no ?? "—",
          row.available_qty ?? 0,
          row.semi_furnished_product?.unit_price || "",
          row.created_at || "",
        ];
      });

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row
            .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `SemiFurnished_Logs_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV download error:", err);
    }
  }, [inventoryData]);

  // Print handler
  const handlePrint = useCallback(() => {
    if (!tableContainerRef.current) return;
    try {
      const printWindow = window.open("", "", "height=600,width=1200");
      if (!printWindow) return;
      const printContent = `
        <html>
          <head>
            <title>Semi-Furnished Product Inventory Logs</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { text-align: center; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f5f5f5; font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>Semi-Furnished Product Inventory Logs</h1>
            <p><strong>Generated:</strong> ${new Date().toLocaleDateString("en-IN")}</p>
            <p><strong>Total Records:</strong> ${inventoryData.length}</p>
            ${tableContainerRef.current.innerHTML}
          </body>
        </html>
      `;
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    } catch (err) {
      console.error("Print error:", err);
    }
  }, [inventoryData]);

  return (
    <ErrorBoundary>
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
            <MaterialReactTable
              columns={columns}
              data={inventoryData}
              getRowId={(row) => String(row.id)}
              state={{
                isLoading: loading,
                pagination,
                showProgressBars: loading,
              }}
              onPaginationChange={setPagination}
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
                  minWidth: "900px",
                },
              }}
              muiTablePaperProps={{
                sx: { backgroundColor: "#fff", boxShadow: "none" },
              }}
              muiPaginationProps={{
                rowsPerPageOptions: [5, 10, 20, 50],
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
                    <Typography variant="h6" className="page-title">
                      Semi-Furnished Product Inventory Logs
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      All transaction records for semi-furnished products
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <MRT_ToolbarInternalButtons table={table} />
                    <Tooltip title="Refresh">
                      <IconButton
                        onClick={handleRefresh}
                        size="small"
                        disabled={loading}
                      >
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
                <Box sx={{ px: 2, display: "flex", gap: 2, alignItems: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Records: {inventoryData.length}
                  </Typography>
                  {/* <Chip
                    label={`IN: ${inventoryData.filter((r) => r.in_stock > 0).length}`}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                  <Chip
                    label={`OUT: ${inventoryData.filter((r) => r.out_stock > 0).length}`}
                    size="small"
                    color="error"
                    variant="outlined"
                  /> */}
                </Box>
              )}
            />
          </Paper>
        </Grid>
      </Grid>
    </ErrorBoundary>
  );
};

export default SemiFurnishedStock;