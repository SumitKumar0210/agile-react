import React, { useMemo, useState, useRef, useEffect } from "react";
import Grid from "@mui/material/Grid";
import PropTypes from "prop-types";
import {
  Button,
  Paper,
  Typography,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Box,
  Tooltip,
  Chip,
  TextField,
  InputAdornment,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Link } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import { BiSolidEditAlt } from "react-icons/bi";
import { RiDeleteBinLine } from "react-icons/ri";
import AddIcon from "@mui/icons-material/Add";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from 'react-router-dom';

import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
} from "material-react-table";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
import { fetchOrder, deleteOrder } from "../slice/orderSlice";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../../../context/AuthContext";

//  Styled Dialog
const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
    paddingBottom: theme.spacing(4),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

function BootstrapDialogTitle(props) {
  const { children, onClose, ...other } = props;
  return (
    <DialogTitle sx={{ m: 0, p: 2 }} {...other}>
      {children}
      {onClose && (
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      )}
    </DialogTitle>
  );
}

BootstrapDialogTitle.propTypes = {
  children: PropTypes.node,
  onClose: PropTypes.func.isRequired,
};

//  Status colors
const getStatusChip = (status, count = 0) => {
  console.log(status);
  switch (status) {
    case 0:
      return <Chip label="Pending" color="warning" size="small" />;
    case 3:
      return (
        <Chip
          label={`Complete`}
          color="success"
          size="small"
        />
      );;

    default:
      return (
        <Chip
          label={`In Production (${count})`}
          color="info"
          size="small"
        />
      );
  }
};


const Order = () => {
  const { hasPermission, hasAnyPermission } = useAuth();
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const tableContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { data: orders, loading, error, totalRecords } = useSelector((state) => state.order);

  // Normalize orders data to always be an array
  const normalizedOrders = Array.isArray(orders) ? orders : [];
  const normalizedTotal = typeof totalRecords === 'number' ? totalRecords : 0;

  // Generate a unique key based on data to force table re-render when data changes
  const tableKey = `${normalizedOrders.length}-${normalizedTotal}-${debouncedSearch}`;

  // Focus search input when shown
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(globalFilter);
      // Reset to first page when search changes
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [globalFilter]);

  // Fetch orders when pagination or search changes
  useEffect(() => {
    const params = {
      pageIndex: pagination.pageIndex,
      pageLimit: pagination.pageSize,
      search: debouncedSearch,
    };

    console.log("Fetching orders with params:", params);
    dispatch(fetchOrder(params));
  }, [dispatch, pagination.pageIndex, pagination.pageSize, debouncedSearch]);

  const handleViewClick = (id) => {
    navigate('/customer/order/view/' + id);
  };

  const handleEditClick = (id) => {
    navigate('/customer/order/edit/' + id);
  };

  const handleDelete = (row) => {
    setDeleteRow(row);
    setOpenDelete(true);
  };

  const deleteData = async (id) => {
    try {
      await dispatch(deleteOrder(id)).unwrap();
      setOpenDelete(false);

      // Refresh data after deletion
      dispatch(fetchOrder({
        pageIndex: pagination.pageIndex,
        pageLimit: pagination.pageSize,
        search: debouncedSearch,
      }));
    } catch (error) {
      console.error("Delete failed:", error);
      setOpenDelete(false);
    }
  };

  const handleSearchToggle = () => {
    if (showSearch && globalFilter) {
      // Clear search when closing
      setGlobalFilter("");
    }
    setShowSearch(!showSearch);
  };

  const handleDateFormate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleIQtyCount = (items) => {
    try {
      const parsed = JSON.parse(items);
      if (!Array.isArray(parsed)) return 0;
      return parsed.length ?? 0;
    } catch (e) {
      console.error("Invalid product_ids format:", e);
      return 0;
    }
  };

  const calculateQCPassed = (items) => {
    try {
      const parsed = JSON.parse(items);
      if (!Array.isArray(parsed)) return 0;
      return parsed.reduce((total, item) => total + Number(item.qc_passed || 0), 0);
    } catch (e) {
      console.error("Invalid product_ids format:", e);
      return 0;
    }
  };

  const calculateDelivered = (items) => {
    try {
      const parsed = JSON.parse(items);
      if (!Array.isArray(parsed)) return 0;
      return parsed.reduce((total, item) => total + Number(item.delivered || 0), 0);
    } catch (e) {
      console.error("Invalid product_ids format:", e);
      return 0;
    }
  };

  //  Table columns
  const columns = useMemo(() => {
    const baseColumns = [
      { accessorKey: "orderNumber", header: "Order No.", Cell: ({ row }) => row.original?.batch_no ?? '' },
      { accessorKey: "customerName", header: "Customer Name", Cell: ({ row }) => row.original?.customer?.name ?? '' },
      { accessorKey: "dated", header: "Dated", Cell: ({ row }) => handleDateFormate(row.original.created_at) },
      { accessorKey: "itemOrdered", header: "Item Ordered", Cell: ({ row }) => handleIQtyCount(row.original?.product_ids) },
      { accessorKey: "commencement_date", header: "Commencement Date", Cell: ({ row }) => handleDateFormate(row.original.commencement_date) },
      { accessorKey: "delivered_date", header: "Delivered Date", Cell: ({ row }) => handleDateFormate(row.original.delivery_date) },
      {
        accessorKey: "status",
        header: "Status",
        Cell: ({ row }) => getStatusChip(row.original?.status, row.original?.production_product_count),
      },
    ];

    if (hasAnyPermission(["customer_orders.add_production", "customer_orders.update"])) {
      baseColumns.push({
        id: "actions",
        header: "Action",
        size: 80,
        enableSorting: false,
        enableColumnFilter: false,
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
        Cell: ({ row }) => (
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            {hasPermission("customer_orders.add_production") && (
              <Tooltip title="View">
                <IconButton
                  color="warning"
                  onClick={() => handleViewClick(row.original.id)}
                >
                  <MdOutlineRemoveRedEye size={16} />
                </IconButton>
              </Tooltip>
            )}
            {(hasPermission("customer_orders.update") && row.original.status === 0)
              && (
                <Tooltip title="Edit">
                  <IconButton
                    color="primary"
                    onClick={() => handleEditClick(row.original.id)}
                  >
                    <BiSolidEditAlt size={16} />
                  </IconButton>
                </Tooltip>
              )}

          </Box>
        ),
      })
    }
    return baseColumns;
    []
  }
  );

  //  CSV export using normalized data
  const downloadCSV = () => {
    if (!normalizedOrders || normalizedOrders.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = ["Order No.", "Customer Name", "Dated", "Item Ordered", "Commencement Date", "Delivered Date", "Status"];

    const rows = normalizedOrders.map((row) => {
      const orderNo = row.batch_no || "";
      const customerName = row.customer?.name || "N/A";
      const dated = handleDateFormate(row.created_at);
      const itemOrdered = handleIQtyCount(row.product_ids);
      const commencementDate = handleDateFormate(row.commencement_date);
      const deliveredDate = handleDateFormate(row.delivery_date);
      const status = row.status === 0 ? "Pending" : `In Production (${row.production_product_count || 0})`;

      return [
        `"${orderNo}"`,
        `"${customerName}"`,
        `"${dated}"`,
        `"${itemOrdered}"`,
        `"${commencementDate}"`,
        `"${deliveredDate}"`,
        `"${status}"`
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `Orders_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  //  Print handler
  const handlePrint = () => {
    if (!tableContainerRef.current) return;
    const printContents = tableContainerRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  return (
    <>
      {/* Header Row */}
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Grid>
          <Typography variant="h6">Order</Typography>
        </Grid>
        <Grid>
          {hasPermission("customer_orders.create") && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              component={Link}
              to="/customer/order/create"
            >
              Create Order
            </Button>
          )}

        </Grid>
      </Grid>

      {/* Order Table */}
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
            key={tableKey}
            columns={columns}
            data={normalizedOrders}
            manualPagination
            manualFiltering
            rowCount={normalizedTotal}
            state={{
              isLoading: loading,
              showLoadingOverlay: loading,
              pagination: pagination,
              globalFilter: globalFilter,
            }}
            onPaginationChange={setPagination}
            onGlobalFilterChange={setGlobalFilter}
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
                minWidth: "1200px",
              },
            }}
            muiTablePaperProps={{
              sx: { backgroundColor: "#fff", boxShadow: "none" },
            }}
            muiTableBodyRowProps={{
              hover: false,
            }}
            muiTableBodyProps={{
              sx: {
                '& tr': {
                  display: normalizedOrders.length === 0 ? 'none' : 'table-row'
                }
              }
            }}
            renderTopToolbar={({ table }) => (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  p: 1,
                }}
              >
                <Typography variant="h6" className='page-title'>
                  Order List

                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {showSearch && (
                    <TextField
                      inputRef={searchInputRef}
                      size="small"
                      placeholder="Search..."
                      value={globalFilter}
                      onChange={(e) => setGlobalFilter(e.target.value)}
                      InputProps={{
                        endAdornment: globalFilter && (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => setGlobalFilter("")}
                              edge="end"
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{ width: 250 }}
                    />
                  )}

                  <Tooltip title={showSearch ? "Close Search" : "Search"}>
                    <IconButton onClick={handleSearchToggle}>
                      <SearchIcon size={20} />
                    </IconButton>
                  </Tooltip>

                  <MRT_ToolbarInternalButtons table={table} />

                  <Tooltip title="Print">
                    <IconButton onClick={handlePrint}>
                      <FiPrinter size={20} />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Download CSV">
                    <IconButton onClick={downloadCSV}>
                      <BsCloudDownload size={20} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            )}
          />
        </Paper>
      </Grid>

      {/* Delete Modal */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>{"Delete this order?"}</DialogTitle>
        <DialogContent style={{ width: "300px" }}>
          <DialogContentText>This action cannot be undone</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button
            onClick={() => deleteData(deleteRow?.id)}
            variant="contained"
            color="error"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Order;