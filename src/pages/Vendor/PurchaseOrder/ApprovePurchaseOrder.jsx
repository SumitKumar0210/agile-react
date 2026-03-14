import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
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
  CircularProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Link, useNavigate } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import { RiDeleteBinLine } from "react-icons/ri";
import AddIcon from "@mui/icons-material/Add";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
  MRT_GlobalFilterTextField,
} from "material-react-table";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";
import { getApprovePOData, deletePO } from "../slice/purchaseOrderSlice";
import UploadInvoiceButton from "../../../components/UploadInvoiceButton/UploadInvoiceButton";
import { useAuth } from "../../../context/AuthContext";

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

// Status helper
const getStatusChip = (status) => {
  switch (status) {
    case "Pending":
      return <Chip label="Pending" color="warning" size="small" />;
    case "Approved":
      return <Chip label="Approved" color="success" size="small" />;
    case "Partially Paid":
      return <Chip label="Partially Paid" color="info" size="small" />;
    default:
      return <Chip label={status || "Unknown"} size="small" />;
  }
};

const ApprovePurchaseOrder = () => {
  const { hasPermission, hasAnyPermission } = useAuth();
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const tableContainerRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { data = [], total = 0, loading } = useSelector(
    (state) => state.purchaseOrder
  );

 
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [globalFilter, setGlobalFilter] = useState("");


  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
   
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(globalFilter);
    }, 500); 
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [globalFilter]);

  useEffect(() => {
    const params = {
      page: pagination.pageIndex + 1,
      per_page: pagination.pageSize,
    };


    if (debouncedSearch) {
      params.search = debouncedSearch;
    }

    dispatch(getApprovePOData(params));
  }, [dispatch, pagination.pageIndex, pagination.pageSize, debouncedSearch]);


  useEffect(() => {
    if (debouncedSearch) {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }
  }, [debouncedSearch]);


  const tableData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.map((po) => ({
      id: po.id,
      poNumber: po.purchase_no || "N/A",
      vendorName: po.vendor?.name || "N/A",
      dated: po.order_date || "-",
      orderTotal: po.grand_total || 0,
      itemsOrdered: po.material_items.length ?? 0,
       
      // itemsOrdered: po.material_items
      //   ? JSON.parse(po.material_items).length
      //   : 0,
      qcPassed: po.inward ? JSON.parse(po.inward.material_items).length : 0,
      qcData: po.inward,
      status: po.quality_status ? "Approved" : "Pending",
    }));
  }, [data]);

  const handlePrintClick = useCallback(
    (id) => navigate("/vendor/purchase-order/print/" + id),
    [navigate]
  );

  const handleQualitycheckClick = useCallback(
    (id) => navigate("/vendor/purchase-order/quality-check/" + id),
    [navigate]
  );

  const handleDeleteClick = useCallback((id) => {
    setDeleteId(id);
    setOpenDelete(true);
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      await dispatch(deletePO(deleteId)).unwrap();
    
      dispatch(
        getApprovePOData({
          page: pagination.pageIndex + 1,
          per_page: pagination.pageSize,
          search: debouncedSearch || undefined,
        })
      );
      setOpenDelete(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Failed to delete purchase order:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo(() => {
    const baseColumns = [
      {
        accessorKey: "poNumber",
        header: "PO Number",
      },
      {
        accessorKey: "vendorName",
        header: "Vendor Name",
      },
      {
        accessorKey: "dated",
        header: "Order Date",
      },
      {
        accessorKey: "orderTotal",
        header: "Order Total",
        Cell: ({ cell }) => `₹${Number(cell.getValue()).toLocaleString("en-IN")}`,
      },
      {
        accessorKey: "itemsOrdered",
        header: "Items Ordered",
      },
      {
        accessorKey: "qcPassed",
        header: "QC Passed Items",
      },
      {
        accessorKey: "status",
        header: "Status",
        Cell: ({ cell }) => getStatusChip(cell.getValue()),
      },
    ];

    if(hasAnyPermission(["qc_po.delete","qc_po.read","qc_po.approve_qc","qc_po.update","qc_po.upload_invoice"])){
      baseColumns.push({
        id: "actions",
        header: "Actions",
        size: 80,
        enableSorting: false,
        enableColumnFilter: false,
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
        Cell: ({ row }) => (
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            {(hasPermission("qc_po.upload_invoice") && row.original?.qcData) && (
              <UploadInvoiceButton row={row.original?.qcData} />
            )}

            {hasPermission("qc_po.approve_qc") && (
              <Tooltip title="Quality Check">
              <IconButton
                color="primary"
                onClick={() => handleQualitycheckClick(row.original.id)}
              >
                <IoMdCheckmarkCircleOutline size={16} />
              </IconButton>
            </Tooltip>
            )}
            
            {hasPermission("qc_po.read") && (
              <Tooltip title="Print PO">
              <IconButton
                color="warning"
                onClick={() => handlePrintClick(row.original.id)}
              >
                <FiPrinter size={16} />
              </IconButton>
            </Tooltip>
            )}
            {hasPermission("qc_po.delete") && (
              <Tooltip title="Delete PO">
              <IconButton
                aria-label="delete"
                color="error"
                onClick={() => handleDeleteClick(row.original.id)}
              >
                <RiDeleteBinLine size={16} />
              </IconButton>
            </Tooltip>
            )}
          </Box>
        ),
      })
    }

    return baseColumns ; 
    [handlePrintClick, handleQualitycheckClick, handleDeleteClick]
  });

  const downloadCSV = useCallback(() => {
    const headers = columns
      .filter((col) => col.accessorKey)
      .map((col) => col.header);

    const rows = tableData.map((row) =>
      columns
        .filter((col) => col.accessorKey)
        .map((col) => {
          const value = row[col.accessorKey];
          return `"${value ?? ""}"`;
        })
        .join(",")
    );

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Purchase_Orders_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [columns, tableData]);

  const handlePrint = useCallback(() => {
    if (!tableContainerRef.current) return;
    const printContents = tableContainerRef.current.innerHTML;
    const originalContents = document.body.innerHTML;

    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  }, []);

  return (
    <>
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Grid>
          <Typography variant="h6">Quality Checks Order</Typography>
        </Grid>
        <Grid>
          {hasPermission("purchase_order.create") && (
            <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={Link}
            to="/vendor/purchase-order/create"
          >
            Create PO
          </Button>
          )}
        </Grid>
      </Grid>

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
            data={tableData}
            manualPagination
            rowCount={total}
            state={{
              pagination,
              globalFilter,
              isLoading: loading,
              showLoadingOverlay: loading,
            }}
            onPaginationChange={setPagination}
            onGlobalFilterChange={setGlobalFilter}
            enableTopToolbar
            enableColumnFilters={false}
            enableSorting={false}
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
                minWidth: "1200px",
              },
            }}
            muiTablePaperProps={{
              sx: { backgroundColor: "#fff", boxShadow: "none" },
            }}
            muiTableBodyRowProps={({ row }) => ({
              hover: false,
              sx:
                row.original.status === "inactive"
                  ? { "&:hover": { backgroundColor: "transparent" } }
                  : {},
            })}
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
                  Quality Checks Purchase Orders
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <MRT_GlobalFilterTextField table={table} />
                  <MRT_ToolbarInternalButtons table={table} />
                  <Tooltip title="Print Table">
                    <IconButton onClick={handlePrint}>
                      <FiPrinter size={20} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download as CSV">
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDelete}
        onClose={() => !isDeleting && setOpenDelete(false)}
      >
        <DialogTitle>Delete Purchase Order?</DialogTitle>
        <DialogContent sx={{ minWidth: 300 }}>
          <DialogContentText>
            Are you sure you want to delete this purchase order? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            autoFocus
            disabled={isDeleting}
            startIcon={
              isDeleting ? <CircularProgress size={16} color="inherit" /> : null
            }
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ApprovePurchaseOrder;