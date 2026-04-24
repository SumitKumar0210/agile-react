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
  Chip,
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
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { BiSolidEditAlt } from "react-icons/bi";
import { RiDeleteBinLine } from "react-icons/ri";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
import { RiDraggable } from "react-icons/ri";
import { debounce } from "lodash";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import CustomSwitch from "../../../../components/CustomSwitch/CustomSwitch";
// import CustomSwitch from "../../../components/CustomSwitch/CustomSwitch";
import SubDepartmentFormDialog from "../../../../components/SubDepartment/SubDepartmentFormDialog";
import { useAuth } from "../../../../context/AuthContext";
import {
  fetchSubDepartments,
  addSubDepartment,
  updateSubDepartment,
  statusUpdate,
  deleteSubDepartment,
  sequenceUpdate,
  clearSubDepartments,
} from "../../slices/subDepartmentSlice";
import { fetchDepartments } from "../../slices/departmentSlice";

// ── Error Boundary ────────────────────────────────────────────────────────────
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

// ── Component ─────────────────────────────────────────────────────────────────
const SubDepartment = () => {
  const { id: departmentId } = useParams(); // route: /departments/:id/sub-departments
  const navigate = useNavigate();
  const { hasPermission, hasAnyPermission } = useAuth();
  const dispatch = useDispatch();
  const tableContainerRef = useRef(null);

  // Modal state
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [editData, setEditData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Drag-and-drop state
  const [draggingRow, setDraggingRow] = useState(null);
  const [localData, setLocalData] = useState([]);

  // Sequence text-field state
  const [sequenceValues, setSequenceValues] = useState({});

  // Redux selectors
  const { data: tableData = [], loading } = useSelector(
    (state) => state.subDepartment
  );
  const { data: departments = [] } = useSelector((state) => state.department);

  // Derive the parent department name from the store
  const parentDepartment = useMemo(
    () => departments.find((d) => String(d.id) === String(departmentId)),
    [departments, departmentId]
  );

  // ── Data fetching ──────────────────────────────────────────────────────────
  useEffect(() => {
    // Fetch parent departments (for name display) if not already loaded
    if (!departments.length) {
      dispatch(fetchDepartments());
    }
  }, [dispatch, departments.length]);

  useEffect(() => {
    if (departmentId) {
      dispatch(fetchSubDepartments(departmentId));
    }
    // Cleanup on unmount so stale data isn't shown when navigating away
    return () => {
      dispatch(clearSubDepartments());
    };
  }, [dispatch, departmentId]);

  // Sync localData with Redux whenever store updates
  useEffect(() => {
    setLocalData([...tableData]);
  }, [tableData]);

  // Sync sequence text-field values
  useEffect(() => {
    if (tableData.length > 0) {
      const init = {};
      tableData.forEach((d) => (init[d.id] = d.sequence ?? ""));
      setSequenceValues(init);
    }
  }, [tableData]);

  // ── Sequence field debounce ────────────────────────────────────────────────
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

  useEffect(() => () => debouncedSequenceUpdate.cancel(), [debouncedSequenceUpdate]);

  // ── Drag-and-drop row reordering ───────────────────────────────────────────
  const handleRowOrderChange = useCallback(
    (newData) => {
      setLocalData(newData);
      newData.forEach((row, index) => {
        dispatch(sequenceUpdate({ id: row.id, sequence: index + 1 }));
      });
      const updated = {};
      newData.forEach((row, index) => {
        updated[row.id] = index + 1;
      });
      setSequenceValues(updated);
    },
    [dispatch]
  );

  // ── CRUD handlers ──────────────────────────────────────────────────────────
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
    const res = await dispatch(
      addSubDepartment({ ...values, department_id: departmentId })
    );
    setIsSaving(false);
    if (!res.error) {
      resetForm();
      handleClose();
    }
  };

  const handleEditSubmit = async (values, resetForm) => {
    setIsSaving(true);
    const res = await dispatch(
      updateSubDepartment({ id: editData.id, ...values, department_id: departmentId })
    );
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
    await dispatch(deleteSubDepartment(id));
    setIsDeleting(false);
    setDeleteData(null);
    setOpenDelete(false);
  };

  const canUpdate = useMemo(
    () => hasPermission("departments.create"),
    [hasPermission]
  );

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns = useMemo(() => {
    const baseColumns = [
      {
        accessorKey: "name",
        header: "Sub-Process",
        Cell: ({ cell }) =>
          loading ? <Skeleton variant="text" width="80%" /> : cell.getValue(),
      },
      // {
      //   accessorKey: "color",
      //   header: "Color",
      //   Cell: ({ cell }) => {
      //     if (loading) return <Skeleton variant="text" width="60%" />;
      //     return (
      //       <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      //         <Box
      //           sx={{
      //             width: 20,
      //             height: 20,
      //             backgroundColor: cell.getValue() || "#ccc",
      //             borderRadius: 1,
      //             border: "1px solid #ddd",
      //           }}
      //         />
      //         <Typography variant="body2">{cell.getValue()}</Typography>
      //       </Box>
      //     );
      //   },
      // },
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
          if (loading)
            return <Skeleton variant="circular" width={40} height={20} />;
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

    if (hasAnyPermission?.(["departments.create"])) {
      baseColumns.push({
        id: "actions",
        header: "Actions",
        enableSorting: false,
        enableColumnFilter: false,
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
        Cell: ({ row }) => {
          if (loading) return <Skeleton variant="text" width={80} />;

          const isProtectedSequence = [0].includes(
            row.original.sequence
          );

          return (
            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
              {hasPermission("departments.create") && (
                <Tooltip title="Edit">
                  <IconButton onClick={() => handleEditOpen(row.original)}>
                    <BiSolidEditAlt size={16} />
                  </IconButton>
                </Tooltip>
              )}
              {hasPermission("departments.create") && !isProtectedSequence && (
                <Tooltip title="Delete">
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(row.original)}
                  >
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

  // ── CSV / Print ────────────────────────────────────────────────────────────
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
      `sub_departments_${new Date().toISOString().split("T")[0]}.csv`
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

  // ── Render ─────────────────────────────────────────────────────────────────
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
              data={localData}
              getRowId={(row) => row.id}

              // Drag-and-drop row ordering
              enableRowOrdering={canUpdate}
              enableSorting={false}
              onDraggingRowChange={setDraggingRow}
              icons={{ DragHandleIcon: () => <RiDraggable size={18} /> }}
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
                  if (!hoveredRow || !dragRow || dragRow.id === hoveredRow.id)
                    return;
                  const newData = [...localData];
                  newData.splice(
                    hoveredRow.index,
                    0,
                    newData.splice(dragRow.index, 1)[0]
                  );
                  handleRowOrderChange(newData);
                },
              })}

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
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  {/* Left side: back button + title */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Tooltip title="Back to Departments">
                      <IconButton
                        size="small"
                        onClick={() => navigate("/settings", { state: { activeTab: "tab15" } })}
                      >
                        <ArrowBackIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Typography variant="h6" className="page-title">
                      Sub-Processes
                    </Typography>
                    {parentDepartment && (
                      <Chip
                        size="small"
                        label={parentDepartment.name}
                        sx={{
                          backgroundColor:
                            parentDepartment.color || undefined,
                          color: "#fff",
                          fontWeight: 500,
                        }}
                      />
                    )}
                  </Box>

                  {/* Right side: search + actions */}
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
                        Add Sub-Process
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
      <SubDepartmentFormDialog
        open={open}
        onClose={handleClose}
        onSubmit={async (values, { resetForm }) => handleAdd(values, resetForm)}
        initialValues={{ name: "", color: "" }}
        title="Add Sub-Department"
        submitButtonText={isSaving ? "Saving..." : "Submit"}
        isSubmitting={isSaving}
      />

      {/* Edit Modal */}
      <SubDepartmentFormDialog
        open={editOpen}
        onClose={handleEditClose}
        onSubmit={(values, { resetForm }) =>
          handleEditSubmit(values, resetForm)
        }
        initialValues={{
          name: editData?.name || "",
          color: editData?.color || "",
        }}
        title="Edit Sub-Department"
        submitButtonText={isSaving ? "Saving..." : "Save Changes"}
        isSubmitting={isSaving}
      />

      {/* Delete Confirmation Modal */}
      <Dialog
        open={openDelete}
        onClose={() => !isDeleting && setOpenDelete(false)}
      >
        <DialogTitle>{"Delete this sub-department?"}</DialogTitle>
        <DialogContent style={{ width: "300px" }}>
          <DialogContentText>This action cannot be undone</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenDelete(false)}
            disabled={isDeleting}
          >
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

export default SubDepartment;