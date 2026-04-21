import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Typography,
  Grid,
  Paper,
  Box,
  Button,
  IconButton,
  TextField,
  Tooltip,
  Skeleton,
  DialogContentText,
  CircularProgress,
} from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
  MRT_GlobalFilterTextField,
} from "material-react-table";
import AddIcon from "@mui/icons-material/Add";
import { BiSolidEditAlt } from "react-icons/bi";
import { RiDeleteBinLine } from "react-icons/ri";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
import { RiDraggable } from "react-icons/ri";
import { debounce } from "lodash";
import CustomSwitch from "../../../components/CustomSwitch/CustomSwitch";
import {
  addDepartment,
  fetchDepartments,
  statusUpdate,
  deleteDepartment,
  updateDepartment,
  sequenceUpdate,
} from "../slices/departmentSlice";
import { useDispatch, useSelector } from "react-redux";
import DepartmentFormDialog from "../../../components/Department/DepartmentFormDialog";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import AccountTreeIcon from "@mui/icons-material/AccountTree";

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

const Department = () => {
  const { hasPermission, hasAnyPermission } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();


  const tableContainerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [editData, setEditData] = useState(null);
  const [sequenceValues, setSequenceValues] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ── Drag-and-drop state ──────────────────────────────────────────────────
  const [draggingRow, setDraggingRow] = useState(null);
  const [localData, setLocalData] = useState([]);

  const { data: tableData = [], loading } = useSelector(
    (state) => state.department
  );

  // Keep localData in sync whenever Redux data changes
  useEffect(() => {
    setLocalData([...tableData]);
  }, [tableData]);

  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

  useEffect(() => {
    if (tableData.length > 0) {
      const init = {};
      tableData.forEach((d) => (init[d.id] = d.sequence || ""));
      setSequenceValues(init);
    }
  }, [tableData]);

  const debouncedSequenceUpdate = useMemo(
    () =>
      debounce((id, value) => {
        if (!value || isNaN(value)) return;
        dispatch(sequenceUpdate({ id, sequence: Number(value) }));
      }, 1500),
    [dispatch]
  );

  const handleSequenceChange = useCallback(
    (id, value) => {
      setSequenceValues((prev) => ({ ...prev, [id]: value }));
      debouncedSequenceUpdate(id, value);
    },
    [debouncedSequenceUpdate]
  );

  useEffect(() => {
    return () => debouncedSequenceUpdate.cancel();
  }, [debouncedSequenceUpdate]);

  // ── Row-order change handler ─────────────────────────────────────────────
  // Receives the already-reordered array and persists it.
  const handleRowOrderChange = useCallback(
    (newData) => {
      setLocalData(newData);
      // Persist new sequences (1-based) for every row
      newData.forEach((row, index) => {
        dispatch(sequenceUpdate({ id: row.id, sequence: index + 1 }));
      });
      // Mirror sequence values in local text-field state
      const updated = {};
      newData.forEach((row, index) => {
        updated[row.id] = index + 1;
      });
      setSequenceValues(updated);
    },
    [dispatch]
  );

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleEditOpen = (row) => {
    setEditData(row);
    setEditOpen(true);
  };
  const handleEditClose = () => {
    setEditOpen(false);
    setEditData(null);
  };

  const handleAdd = async (values, resetForm) => {
    setIsSaving(true);
    const res = await dispatch(addDepartment(values));
    setIsSaving(false);
    if (!res.error) {
      resetForm();
      handleClose();
    }
  };

  const handleEditSubmit = async (values, resetForm) => {
    setIsSaving(true);
    const res = await dispatch(updateDepartment({ id: editData.id, ...values }));
    setIsSaving(false);
    if (!res.error) {
      resetForm();
      handleEditClose();
    }
  };

  const handleDelete = (row) => {
    setDeleteData(row);
    setOpenDelete(true);
  };

  const handleConfirmDelete = async (id) => {
    setIsDeleting(true);
    await dispatch(deleteDepartment(id));
    setIsDeleting(false);
    setDeleteData(null);
    setOpenDelete(false);
  };

  const canUpdate = useMemo(() => hasPermission("departments.update"), [hasPermission]);

  const columns = useMemo(() => {
    const baseColumns = [
      {
        accessorKey: "name",
        header: "Department",
        Cell: ({ cell }) =>
          loading ? <Skeleton variant="text" width="80%" /> : cell.getValue(),
      },
      {
        accessorKey: "color",
        header: "Color",
        Cell: ({ cell, row }) => {
          if (loading) return <Skeleton variant="text" width="60%" />;
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: cell.getValue() || "#ccc",
                  borderRadius: 1,
                  border: "1px solid #ddd",
                }}
              />
              <Typography variant="body2">{cell.getValue()}</Typography>
            </Box>
          );
        },
      },
      {
        accessorKey: "sequence",
        header: "Sequence",
        Cell: ({ row }) => {
          if (loading) return <Skeleton variant="text" width={80} />;
          return (
            <TextField
              type="number"
              size="small"
              disabled={!canUpdate}
              value={
                sequenceValues[row.original.id] ??
                row.original.sequence ??
                ""
              }
              onChange={(e) =>
                handleSequenceChange(row.original.id, e.target.value)
              }
              inputProps={{ min: 0 }}
              sx={{ width: 80 }}
            />
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ row }) => {
          if (loading) return <Skeleton variant="circular" width={40} height={20} />;
          return (
            <CustomSwitch
              checked={!!row.original.status}
              disabled={!canUpdate}
              onChange={(e) =>
                dispatch(
                  statusUpdate({
                    ...row.original,
                    status: e.target.checked ? 1 : 0,
                  })
                )
              }
            />
          );
        },
      },
    ];

    if (hasAnyPermission?.(["departments.update", "departments.delete"])) {
      baseColumns.push({
        id: "actions",
        header: "Actions",
        enableSorting: false,
        enableColumnFilter: false,
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
        Cell: ({ row }) => {
          if (loading) return <Skeleton variant="text" width={80} />;

          const isProtectedSequence =
            row.original.sequence === 1 ||
            row.original.sequence === 2 ||
            row.original.sequence === 3 ||
            row.original.sequence === 4;

          return (
            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
              <Tooltip title="View Sub-Departments">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => navigate(`/setting/${row.original.id}/sub-department`)}
                >
                  <AccountTreeIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              {hasPermission("departments.update") && (
                <Tooltip title="Edit">
                  <IconButton onClick={() => handleEditOpen(row.original)}>
                    <BiSolidEditAlt size={16} />
                  </IconButton>
                </Tooltip>
              )}
              {hasPermission("departments.delete") && !isProtectedSequence && (
                <Tooltip title="Delete">
                  <IconButton color="error" onClick={() => handleDelete(row.original)}>
                    <RiDeleteBinLine size={16} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          );
        },
      });
    }

    return baseColumns;
  }, [
    loading,
    dispatch,
    sequenceValues,
    handleSequenceChange,
    hasPermission,
    hasAnyPermission,
    canUpdate,
  ]);

  const getRowId = (row) => row.id;

  const downloadCSV = () => {
    if (!localData.length) return;
    const headers = columns.filter((c) => c.accessorKey).map((c) => c.header);
    const rows = localData.map((r) =>
      columns
        .filter((c) => c.accessorKey)
        .map((c) => `"${r[c.accessorKey] ?? ""}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.setAttribute(
      "download",
      `departments_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!tableContainerRef.current) return;
    const printContents = tableContainerRef.current.innerHTML;
    const w = window.open("", "", "width=900,height=650");
    w.document.write(printContents);
    w.document.close();
    w.print();
  };

  return (
    <ErrorBoundary>
      <Grid container spacing={2}>
        <Grid size={12}>
          <Paper
            elevation={0}
            sx={{ width: "100%", overflowX: "auto", backgroundColor: "#fff" }}
            ref={tableContainerRef}
          >
            <MaterialReactTable
              columns={columns}
              data={localData}               // ← use localData (optimistic)
              getRowId={getRowId}

              // ── Drag-and-drop row ordering ─────────────────────────────
              enableRowOrdering={canUpdate}
              enableSorting={false}
              onDraggingRowChange={setDraggingRow}
              icons={{
                DragHandleIcon: () => <RiDraggable size={18} />,
              }}
              muiRowDragHandleProps={{
                sx: {
                  opacity: 0.8,
                  "&:hover": { opacity: 1 },
                  cursor: "grab",
                  "&:active": { cursor: "grabbing" },
                },
              }}
              muiTableBodyRowProps={({ row, table }) => ({
                onDragEnd: () => {
                  const { draggingRow: dragRow, hoveredRow } = table.getState();
                  if (!hoveredRow || !dragRow || dragRow.id === hoveredRow.id) return;
                  const newData = [...localData];
                  newData.splice(
                    hoveredRow.index,
                    0,
                    newData.splice(dragRow.index, 1)[0]
                  );
                  handleRowOrderChange(newData);
                },
              })}
              // ────────────────────────────────────────────────────────────

              state={{
                isLoading: loading,
                showLoadingOverlay: loading,
                draggingRow,
              }}
              enableTopToolbar
              enableColumnFilters
              enablePagination
              enableGlobalFilter
              enableBottomToolbar
              enableDensityToggle={false}
              enableColumnActions={false}
              enableColumnVisibilityToggle={false}
              initialState={{ density: "compact" }}
              muiTableContainerProps={{ sx: { backgroundColor: "#fff" } }}
              renderTopToolbar={({ table }) => (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 1,
                  }}
                >
                  <Typography variant="h6" className="page-title">
                    Department
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <MRT_GlobalFilterTextField table={table} />
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
                    {hasPermission("departments.create") && (
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpen}
                      >
                        Add Department
                      </Button>
                    )}
                  </Box>
                </Box>
              )}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Add Modal */}
      <DepartmentFormDialog
        open={open}
        onClose={handleClose}
        onSubmit={async (values, { resetForm }) => handleAdd(values, resetForm)}
        initialValues={{ name: "", color: "" }}
        title="Add Department"
        submitButtonText={isSaving ? "Saving..." : "Submit"}
        isSubmitting={isSaving}
      />

      {/* Edit Modal */}
      <DepartmentFormDialog
        open={editOpen}
        onClose={handleEditClose}
        onSubmit={(values, { resetForm }) => handleEditSubmit(values, resetForm)}
        initialValues={{
          name: editData?.name || "",
          color: editData?.color || "",
        }}
        title="Edit Department"
        submitButtonText={isSaving ? "Saving..." : "Save Changes"}
        isSubmitting={isSaving}
      />

      {/* Delete Modal */}
      <Dialog
        open={openDelete}
        onClose={() => !isDeleting && setOpenDelete(false)}
      >
        <DialogTitle>{"Delete this department?"}</DialogTitle>
        <DialogContent style={{ width: "300px" }}>
          <DialogContentText>This action cannot be undone</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={() => handleConfirmDelete(deleteData?.id)}
            variant="contained"
            color="error"
            autoFocus
            disabled={isDeleting}
            startIcon={
              isDeleting ? (
                <CircularProgress size={16} color="inherit" />
              ) : null
            }
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </ErrorBoundary>
  );
};

export default Department;