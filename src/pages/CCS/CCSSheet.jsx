import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import {
  Button, Paper, Typography, IconButton, Dialog, DialogActions,
  DialogContent, DialogContentText, DialogTitle, Box, Tooltip,
  Chip, Alert, Grid,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { BiSolidEditAlt }        from "react-icons/bi";
import { RiDeleteBinLine }        from "react-icons/ri";
import AddIcon                    from "@mui/icons-material/Add";
import { MdOutlineRemoveRedEye, MdCompareArrows, MdInfoOutline    }  from "react-icons/md";
import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
  MRT_GlobalFilterTextField,
} from "material-react-table";
import { FiPrinter }       from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";
import { getDatawithSearch, deleteCcs, clearCcsSheetData } from "./slice/ccsSheetSlice";
import { useAuth } from "../../context/AuthContext";
 
// ── helpers ──────────────────────────────────────────────────────────────────
 
const getMaterialNames = (materials = []) =>
  materials.map((m) => m?.material?.name).filter(Boolean).join(", ") || "—";
const getMaterialNamesInList = (materials) => {
  if (!Array.isArray(materials) || materials.length === 0) return "—";

  return (
    <ul style={{ margin: 0, paddingLeft: "18px" }}>
      {materials
        .filter((m) => m?.material?.name)
        .map((m, i) => (
          <li key={i}>{m.material.name}</li>
        ))}
    </ul>
  );
};
 
const getVendorNames = (vendors = []) =>
  vendors.map((v) => v?.vendor?.name).filter(Boolean).join(", ") || "—";
const getVendorNamesInList = (vendors) => {
  if (!Array.isArray(vendors) || vendors.length === 0) return "—";

  return (
    <ul style={{ margin: 0, paddingLeft: "18px" }}>
      {vendors
        .filter((v) => v?.vendor?.name)
        .map((v, i) => (
          <li key={i}>{v.vendor.name}</li>
        ))}
    </ul>
  );
};
 
// ── component ─────────────────────────────────────────────────────────────────
 
const CcsSheetList = () => {
  const { hasPermission, hasAnyPermission } = useAuth();
  const navigate            = useNavigate();
  const tableContainerRef   = useRef(null);
  const dispatch            = useDispatch();
  const debounceTimerRef    = useRef(null);
 
  const { data: tableData, total: totalRows, loading } = useSelector(
    (state) => state.ccsSheet
  );
 
  const [pagination,    setPagination]    = useState({ pageIndex: 0, pageSize: 10 });
  const [globalFilter,  setGlobalFilter]  = useState("");
  const [openDelete,    setOpenDelete]    = useState(false);
  const [deleteId,      setDeleteId]      = useState(null);
  const [alertMessage,  setAlertMessage]  = useState("");
  const [alertSeverity, setAlertSeverity] = useState("info");
 
  // ── alert ────────────────────────────────────────────────────────────────
  const showAlert = useCallback((msg, severity = "info") => {
    setAlertMessage(msg);
    setAlertSeverity(severity);
    setTimeout(() => setAlertMessage(""), 4000);
  }, []);
 
  // ── fetch ─────────────────────────────────────────────────────────────────
  const fetchData = useCallback(
    async (searchQuery = "") => {
      try {
        await dispatch(
          getDatawithSearch({
            page:    pagination.pageIndex + 1,
            perPage: pagination.pageSize,
            search:  searchQuery,
          })
        ).unwrap();
      } catch {
        showAlert("Failed to fetch CCS sheets", "error");
      }
    },
    [dispatch, pagination.pageIndex, pagination.pageSize, showAlert]
  );
 
  // re-fetch when page/size changes
  useEffect(() => {
    fetchData(globalFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.pageIndex, pagination.pageSize]);
 
  // initial fetch + cleanup
  useEffect(() => {
    fetchData();
    return () => {
      dispatch(clearCcsSheetData());
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
 
  // ── search ────────────────────────────────────────────────────────────────
  const handleGlobalFilterChange = useCallback(
    (value) => {
      setGlobalFilter(value);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        // reset to page 1 on new search
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        fetchData(value);
      }, 1000);
    },
    [fetchData]
  );
 
  // ── navigation ───────────────────────────────────────────────────────────
  const handleAddOrEditVendor = useCallback((id) => navigate(`/ccs/${id}/vendor`),  [navigate]);
  const handleCompareVendors = useCallback((id) => navigate(`/ccs/${id}/compare`),  [navigate]);
 
  // ── delete ────────────────────────────────────────────────────────────────
  const handleDeleteClick = useCallback((id) => {
    setDeleteId(id);
    setOpenDelete(true);
  }, []);
 
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteId) return;
    try {
      await dispatch(deleteCcs(deleteId)).unwrap();
      setOpenDelete(false);
      setDeleteId(null);
      showAlert("CCS Sheet deleted successfully", "success");
      fetchData(globalFilter);
    } catch {
      showAlert("Failed to delete CCS Sheet", "error");
    }
  }, [deleteId, dispatch, showAlert, fetchData, globalFilter]);
 
  // ── columns ───────────────────────────────────────────────────────────────
  const columns = useMemo(() => {
    const base = [
      {
        accessorKey: "ccs_no",
        header: "CCS No.",
        Cell: ({ cell }) => cell.getValue() || "—",
      },
      {
        accessorKey: "materials",
        header: "Materials",
        Cell: ({ row }) => getMaterialNamesInList(row.original.materials),
      },
      {
        accessorKey: "vendors",
        header: "Vendors",
        Cell: ({ row }) => getVendorNamesInList(row.original.vendors),
      },
      {
        id: "materialCount",
        header: "Material Count",
        Cell: ({ row }) => {
          const count = row.original.materials?.length ?? 0;
          return (
            <Chip
              label={`${count} item${count !== 1 ? "s" : ""}`}
              color="success"
              size="small"
            />
          );
        },
      },
      {
        id: "vendorCount",
        header: "Vendor Count",
        Cell: ({ row }) => {
          const count = row.original.vendors?.length ?? 0;
          return (
            <Chip
              label={`${count} vendor${count !== 1 ? "s" : ""}`}
              color="info"
              size="small"
            />
          );
        },
      },
    ];
 
    // if (hasAnyPermission(["ccs_sheet.delete", "ccs_sheet.update", "ccs_sheet.read"])) {
    if (true) {
      base.push({
        id: "actions",
        header: "Action",
        size: 100,
        enableSorting: false,
        enableColumnFilter: false,
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
        Cell: ({ row }) => (
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            {/* {hasPermission("ccs_sheet.read") && ( */}
            {true && (
              <Tooltip title="View Vendors & Materials">
                <IconButton color="warning" size="small" onClick={() => handleAddOrEditVendor(row.original.id)}>
                  <MdInfoOutline   size={16} />
                </IconButton>
              </Tooltip>
            )}
            {/* {hasPermission("ccs_sheet.update") && ( */}
            {true && (
              <Tooltip title="Compare Vendors">
                <IconButton color="primary" size="small" onClick={() => handleCompareVendors(row.original.id)}>
                  <MdCompareArrows  size={16} />
                </IconButton>
              </Tooltip>
            )}
            {/* {hasPermission("ccs_sheet.delete") && ( */}
            {true && (
              <Tooltip title="Delete">
                <IconButton color="error" size="small" onClick={() => handleDeleteClick(row.original.id)}>
                  <RiDeleteBinLine size={16} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ),
      });
    }
 
    return base;
  }, [handleAddOrEditVendor, handleCompareVendors, handleDeleteClick, hasPermission, hasAnyPermission]);
 
  // ── CSV export ────────────────────────────────────────────────────────────
  const downloadCSV = useCallback(() => {
    try {
      const headers = ["CCS No.", "Materials", "Vendors", "Material Count", "Vendor Count"];
      const rows = tableData.map((row) => [
        row.ccs_no || "",
        getMaterialNames(row.materials),
        getVendorNames(row.vendors),
        row.materials?.length ?? 0,
        row.vendors?.length ?? 0,
      ]);
      const csv = [
        headers.join(","),
        ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")),
      ].join("\n");
 
      const url  = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", `CCSSheet_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showAlert("CSV downloaded successfully", "success");
    } catch {
      showAlert("Failed to download CSV", "error");
    }
  }, [tableData, showAlert]);
 
  // ── print ─────────────────────────────────────────────────────────────────
  const handlePrint = useCallback(() => {
    if (!tableContainerRef.current) return;
    const w = window.open("", "", "height=600,width=1200");
    if (!w) { showAlert("Popup blocked. Allow popups to print.", "error"); return; }
    w.document.write(tableContainerRef.current.innerHTML);
    w.document.close();
    w.print();
  }, [showAlert]);
 
  // ── render ────────────────────────────────────────────────────────────────
  return (
    <>
      {alertMessage && (
        <Alert severity={alertSeverity} sx={{ mb: 2 }} onClose={() => setAlertMessage("")}>
          {alertMessage}
        </Alert>
      )}
 
      <Grid container spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Grid item>
          <Typography variant="h6">CCS Sheet</Typography>
        </Grid>
        <Grid item>
          {/* {hasPermission("ccs_sheet.create") && ( */}
          {true && (
            <Button variant="contained" startIcon={<AddIcon />} component={Link} to="/ccs/material">
              Create CCS
            </Button>
          )}
        </Grid>
      </Grid>
 
      <Paper
        elevation={0}
        ref={tableContainerRef}
        sx={{ width: "100%", overflow: "hidden", backgroundColor: "#fff", px: 2, py: 1 }}
      >
        <MaterialReactTable
          columns={columns}
          data={tableData}
          manualPagination
          manualFiltering
          rowCount={totalRows}
          state={{ pagination, isLoading: loading, globalFilter }}
          onPaginationChange={setPagination}
          onGlobalFilterChange={handleGlobalFilterChange}
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
            sx: { width: "100%", backgroundColor: "#fff", overflowX: "auto", minWidth: "900px" },
          }}
          muiTablePaperProps={{ sx: { backgroundColor: "#fff", boxShadow: "none" } }}
          renderTopToolbar={({ table }) => (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", p: 1 }}>
              <Typography variant="h6" className="page-title">CCS Sheet List</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <MRT_GlobalFilterTextField table={table} />
                <MRT_ToolbarInternalButtons table={table} />
                <Tooltip title="Print">
                  <IconButton onClick={handlePrint} size="small"><FiPrinter size={20} /></IconButton>
                </Tooltip>
                <Tooltip title="Download CSV">
                  <IconButton onClick={downloadCSV} size="small"><BsCloudDownload size={20} /></IconButton>
                </Tooltip>
              </Box>
            </Box>
          )}
        />
      </Paper>
 
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Delete CCS Sheet?</DialogTitle>
        <DialogContent sx={{ width: "300px" }}>
          <DialogContentText>This action cannot be undone</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
 
export default CcsSheetList;