// pages/ProductRequest/ProductRequest.jsx
import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
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
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  CircularProgress,
} from "@mui/material";
import { MdOutlineRemoveRedEye, MdCheckCircle } from "react-icons/md";
import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
  MRT_GlobalFilterTextField,
} from "material-react-table";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllRequestItems, approveRequest } from "./slice/materialRequestSlice";
import { useAuth } from "../../context/AuthContext";

const ProductRequest = () => {
  const { hasPermission, hasAnyPermission } = useAuth();
  const [openApprove, setOpenApprove] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimeoutRef = useRef(null);

  const tableContainerRef = useRef(null);
  const dispatch = useDispatch();
  const mediaUrl = import.meta.env.VITE_MEDIA_URL;

  const { data: tableDatas = [], loading, totalRecords = 0 } = useSelector(
    (state) => state.materialRequest
  );
  const tableData = tableDatas.data ?? [];


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
    if (debouncedSearch) {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }
  }, [debouncedSearch]);

  useEffect(() => {
    const params = {
      pageIndex: pagination.pageIndex,
      pageLimit: pagination.pageSize,
    };

    if (debouncedSearch) {
      params.search = debouncedSearch;
    }

    dispatch(fetchAllRequestItems(params));
  }, [dispatch, pagination.pageIndex, pagination.pageSize, debouncedSearch]);

  const handleDateFormat = useCallback((date) => {
    if (!date) return "";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }, []);

  const handleView = useCallback((row) => {
    const isApproved = row.material_request.some(item => item.status === 1);
    setIsApproved(isApproved);
    
    setSelectedRow(row);
    setOpenViewModal(true);
  }, []);

  const colseModel = () =>{
    setOpenViewModal(false);
    setIsApproved(false)
  }

  const handleApprove = useCallback((row) => {
    setSelectedRow(row);
    setOpenApprove(true);
  }, []);

  const handleConfirmApprove = async () => {
    if (!selectedRow) return;

    setIsApproving(true);
    try {
      const res = await dispatch(approveRequest(selectedRow.uuid));


      if (res.error) {
        console.error("Approval failed:", res.error);
        return;
      }

      setOpenApprove(false);
      setSelectedRow(null);
                                 
      await dispatch(
        fetchAllRequestItems({
          pageIndex: pagination.pageIndex,
          pageLimit: pagination.pageSize,
          ...(debouncedSearch && { search: debouncedSearch }),
        })
      );

    } catch (error) {
      console.error("Error approving request:", error);
    } finally {
      setIsApproving(false);
    }
  };

  const getStatusChip = useCallback((status) => {
    switch (status) {
      case 0:
        return <Chip label="Pending" color="warning" size="small" />;
      case 1:
        return <Chip label="Approved" color="success" size="small" />;
      case 2:
        return <Chip label="Rejected" color="error" size="small" />;
      default:
        return <Chip label="Unknown" color="default" size="small" />;
    }
  }, []);

  const columns = useMemo(() => {
    const baseColumns = [
      {
        accessorKey: "item_name",
        header: "Production Item",
        Cell: ({ row }) => row.original?.item_name ?? "—",
      },
      {
        accessorKey: "Date",
        header: "Request Date",
        Cell: ({ row }) => handleDateFormat(row.original?.material_request?.[0]?.created_at) ?? "—",
      },
      {
        accessorKey: "item",
        header: "Materials Requested",
        Cell: ({ row }) => row.original?.material_request?.length ?? 0
      },
      {
        accessorKey: "status",
        header: "Status",
        Cell: ({ row }) => getStatusChip(row.original?.material_request?.[0]?.status),
      },
    ];

    if(hasAnyPermission(["material_request.approve","material_request.read"]))
    {
      baseColumns.push({
        id: "actions",
        header: "Actions",
        size: 120,
        enableSorting: false,
        enableColumnFilter: false,
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
        Cell: ({ row }) => (
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            {hasPermission("material_request.read") && (
              <Tooltip title="View Details">
              <IconButton
                color="info"
                onClick={() => handleView(row.original)}
              >
                <MdOutlineRemoveRedEye size={18} />
              </IconButton>
            </Tooltip>
            )}
            
            {(hasPermission("material_request.approve") && row.original?.material_request?.[0]?.status === 0) && (
              <Tooltip title="Approve Request">
                <IconButton
                  color="success"
                  onClick={() => handleApprove(row.original)}
                >
                  <MdCheckCircle size={18} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ),
      })
    }

    return baseColumns ;
    [handleView, handleApprove, handleDateFormat, getStatusChip]
  }
  );

  const downloadCSV = useCallback(() => {
    const headers = columns
      .filter((col) => col.accessorKey)
      .map((col) => col.header);

    const rows = tableData.map((row) =>
      columns
        .filter((col) => col.accessorKey)
        .map((col) => {
          const key = col.accessorKey;
          if (key === "item_name") return `"${row?.item_name ?? ""}"`;
          if (key === "Date") return `"${handleDateFormat(row?.material_request?.[0]?.created_at)}"`;
          if (key === "item") return `"${row?.material_request?.length ?? 0}"`;
          if (key === "status") {
            const statusMap = { 0: "Pending", 1: "Approved", 2: "Rejected" };
            return `"${statusMap[row?.material_request?.[0]?.status] ?? "Unknown"}"`;
          }
          return `"${row[key] ?? ""}"`;
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
      `Material_Requests_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [columns, tableData, handleDateFormat]);

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
      {/* Header Row */}
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Grid>
          <Typography variant="h6">Material Requests</Typography>
        </Grid>
      </Grid>

      {/* Product Request Table */}
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
            rowCount={totalRecords}
            state={{
              isLoading: loading,
              showLoadingOverlay: loading,
              pagination: pagination,
              globalFilter,
            }}
            onPaginationChange={setPagination}
            onGlobalFilterChange={setGlobalFilter}
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
                minWidth: "1200px",
              },
            }}
            muiTablePaperProps={{
              sx: { backgroundColor: "#fff", boxShadow: "none" },
            }}
            muiTableBodyRowProps={{
              hover: false,
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
                  Material Request List
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

      {/* View Materials Modal */}
      <Dialog
        open={openViewModal}
        onClose={() => colseModel()}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">Material Request Details</Typography>
            {selectedRow?.material_request?.[0]?.status !== undefined &&
              getStatusChip(selectedRow.material_request[0].status)}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {/* Production Item Info */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Production Item
            </Typography>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {selectedRow?.item_name}
            </Typography>
            <Box sx={{ display: "flex", gap: 2, mb: 1 }}>
              <Typography variant="body2">
                <strong>Size:</strong> {selectedRow?.size || "—"}
              </Typography>
              <Typography variant="body2">
                <strong>Quantity:</strong> {selectedRow?.qty || "—"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Typography variant="body2">
                <strong>Start Date:</strong> {handleDateFormat(selectedRow?.start_date)}
              </Typography>
              <Typography variant="body2">
                <strong>Delivery Date:</strong> {handleDateFormat(selectedRow?.delivery_date)}
              </Typography>
            </Box>
          </Box>

          {/* Requested Materials Table */}
          <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 3 }}>
            Requested Materials ({selectedRow?.material_request?.length || 0})
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Image</TableCell>
                  <TableCell>Material Name</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell align="right">Requested Qty</TableCell>
                  {!isApproved && (

                  <TableCell align="right">Available Qty</TableCell>
                  )}
                  <TableCell>Request Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedRow?.material_request?.map((request) => (
                  <TableRow key={request.id} hover>
                    <TableCell>
                      <Avatar
                        src={request.material?.image ? mediaUrl + request.material.image : ""}
                        alt={request.material?.name}
                        variant="rounded"
                        sx={{ width: 40, height: 40 }}
                      >
                        {request.material?.name?.charAt(0)}
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {request.material?.name || "—"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {request.material?.remark || ""}
                      </Typography>
                    </TableCell>
                    <TableCell>{request.material?.size || "—"}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={500}>
                        {request.qty}
                      </Typography>
                    </TableCell>
                   
                    {!isApproved &&(

                    <TableCell align="right">
               
                      <Chip
                        label={request.material?.available_qty || 0}
                        size="small"
                        color={
                          (request.material?.available_qty || 0) >= request.qty
                            ? "success"
                            : "error"
                        }
                      />
                    </TableCell>
                    )}
                    <TableCell>
                      <Typography variant="caption">
                        {handleDateFormat(request.created_at)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
                {(!selectedRow?.material_request || selectedRow.material_request.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        No materials requested
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => colseModel()} variant="outlined">
            Close
          </Button>
          {(hasPermission("material_request.approve")  && selectedRow?.material_request?.[0]?.status === 0) && (
            <Button
              onClick={() => {
                colseModel();
                handleApprove(selectedRow);
              }}
              variant="contained"
              color="success"
              startIcon={<MdCheckCircle />}
            >
              Approve Request
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <Dialog
        open={openApprove}
        onClose={() => !isApproving && setOpenApprove(false)}
      >
        <DialogTitle>Approve Material Request</DialogTitle>
        <DialogContent sx={{ minWidth: 350 }}>
          <DialogContentText>
            Are you sure you want to approve this material request?
            <br /><br />
            <strong>Production Item:</strong> {selectedRow?.item_name}
            <br />
            <strong>Total Materials:</strong> {selectedRow?.material_request?.length ?? 0}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenApprove(false)}
            disabled={isApproving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmApprove}
            variant="contained"
            color="success"
            autoFocus
            disabled={isApproving}
            startIcon={isApproving ? <CircularProgress size={16} color="inherit" /> : <MdCheckCircle />}
          >
            {isApproving ? "Approving..." : "Approve"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProductRequest;