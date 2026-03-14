import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import Grid from "@mui/material/Grid";
import PropTypes from "prop-types";
import {
  Button,
  Paper,
  TextField,
  Typography,
  IconButton,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Box,
  InputAdornment,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Pagination,
  Card,
  CardContent,
  Divider,
  Switch,
  Avatar,
  Tooltip,
  Alert,
  Snackbar,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import CloseIcon from "@mui/icons-material/Close";
import { BiSolidEditAlt } from "react-icons/bi";
import { RiDeleteBinLine } from "react-icons/ri";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import AddIcon from "@mui/icons-material/Add";
import { FiUser, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { MdOutlineRemoveRedEye, MdCheckCircle } from "react-icons/md";
import SearchIcon from "@mui/icons-material/Search";
import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
  MRT_GlobalFilterTextField,
} from "material-react-table";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
import Profile from "../../assets/images/profile.jpg";
import CustomSwitch from "../../components/CustomSwitch/CustomSwitch";

import { useDispatch, useSelector } from "react-redux";
import { addUser, fetchUsers, updateUser, statusUpdate, deleteUser, fetchUsersWithSearch } from "./slices/userSlice";
import { fetchStates } from "../settings/slices/stateSlice";
import ImagePreviewDialog from "../../components/ImagePreviewDialog/ImagePreviewDialog";
import { compressImage } from "../../components/imageCompressor/imageCompressor";
import { useAuth } from "../../context/AuthContext";
import { fetchActiveRoles } from "../settings/slices/roleSlice";

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

//  Validation schema for Add
const validationSchema = Yup.object({
  name: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .required("Name is required"),

  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .max(50, "Password must not exceed 50 characters")
    .required("Password is required"),

  email: Yup.string()
    .email("Enter a valid email address")
    .required("Email is required"),

  mobile: Yup.string()
    .matches(/^[0-9]{10}$/, "Mobile must be exactly 10 digits")
    .required("Mobile is required"),

  state_id: Yup.string().required("State is required"),

  city: Yup.string()
    .min(2, "City must be at least 2 characters")
    .max(100, "City must not exceed 100 characters")
    .required("City is required"),

  address: Yup.string()
    .min(10, "Address must be at least 10 characters")
    .max(500, "Address must not exceed 500 characters")
    .required("Address is required"),

  zip_code: Yup.string()
    .matches(/^[0-9]{6}$/, "PIN code must be exactly 6 digits")
    .required("PIN code is required"),

  user_type_id: Yup.string().required("Role is required"),

  image: Yup.mixed().nullable(),
});

//  Edit Validation schema
const editValidationSchema = Yup.object({
  name: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .required("Name is required"),

  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .max(50, "Password must not exceed 50 characters")
    .nullable(),

  email: Yup.string()
    .email("Enter a valid email address")
    .required("Email is required"),

  mobile: Yup.string()
    .matches(/^[0-9]{10}$/, "Mobile must be exactly 10 digits")
    .required("Mobile is required"),

  state_id: Yup.string().required("State is required"),

  city: Yup.string()
    .min(2, "City must be at least 2 characters")
    .max(100, "City must not exceed 100 characters")
    .required("City is required"),

  address: Yup.string()
    .min(10, "Address must be at least 10 characters")
    .max(500, "Address must not exceed 500 characters")
    .required("Address is required"),

  zip_code: Yup.string()
    .matches(/^[0-9]{6}$/, "PIN code must be exactly 6 digits")
    .required("PIN code is required"),

  user_type_id: Yup.string().required("Role is required"),

  image: Yup.mixed().nullable(),
});

const Users = () => {
  const { hasPermission, hasAnyPermission } = useAuth();
  const [open, setOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    id: null,
    name: "",
    loading: false,
  });
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [compressingImage, setCompressingImage] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const tableContainerRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Pagination and search state
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [globalFilter, setGlobalFilter] = useState("");

  const {
    data: tableData = [],
    loading,
    error,
    totalRows = 0
  } = useSelector((state) => state.user);

  const { data: states = [] } = useSelector((state) => state.state);
  const { data: userTypes = [] } = useSelector((state) => state.role);

  const dispatch = useDispatch();
  const mediaUrl = import.meta.env.VITE_MEDIA_URL;

  // Fetch users with pagination and search
  useEffect(() => {
    const params = {
      pageIndex: pagination.pageIndex + 1, // API expects 1-based page number
      pageLimit: pagination.pageSize,
      search: globalFilter || "",
    };
    dispatch(fetchUsersWithSearch(params));
  }, [dispatch, pagination.pageIndex, pagination.pageSize, globalFilter]);

  // Fetch states and user types on mount
  useEffect(() => {
    dispatch(fetchStates());
    dispatch(fetchActiveRoles());
  }, [dispatch]);

  // Show error in snackbar
  useEffect(() => {
    if (error) {
      setSnackbar({ open: true, message: error, severity: "error" });
    }
  }, [error]);

  // Handle global filter change with debounce
  const handleGlobalFilterChange = useCallback((value) => {
    setGlobalFilter(value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 })); // Reset to first page on search
  }, []);

  // Stable callbacks
  const handleUpdate = useCallback((row) => {
    setEditData(row);
    setEditOpen(true);
  }, []);

  const handleDeleteClick = useCallback((row) => {
    setDeleteDialog({
      open: true,
      id: row.id,
      name: row.name,
      loading: false,
    });
  }, []);

  const handleEditClose = useCallback(() => {
    setEditOpen(false);
    setEditData(null);
  }, []);

  const handleSnackbarClose = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  //  Add user
  const handleAdd = useCallback(async (values, { resetForm, setSubmitting }) => {
    setSubmitting(true);
    try {
      await dispatch(addUser(values)).unwrap();
      resetForm();
      setOpen(false);
      // setSnackbar({ open: true, message: "User added successfully", severity: "success" });

      // Refresh data after add
      const params = {
        pageIndex: pagination.pageIndex + 1,
        pageLimit: pagination.pageSize,
        search: globalFilter || "",
      };
      await dispatch(fetchUsersWithSearch(params)).unwrap();
    } catch (error) {
      console.error("Add user failed:", error);
      // setSnackbar({ open: true, message: error || "Failed to add user", severity: "error" });
    } finally {
      setSubmitting(false);
    }
  }, [dispatch, pagination.pageIndex, pagination.pageSize, globalFilter]);

  //  confirm delete
  const confirmDelete = useCallback(async () => {
    if (!deleteDialog.id) return;

    setDeleteDialog((prev) => ({ ...prev, loading: true }));

    try {
      await dispatch(deleteUser(deleteDialog.id)).unwrap();
      setDeleteDialog({ open: false, id: null, name: "", loading: false });
      // setSnackbar({ open: true, message: "User deleted successfully", severity: "success" });

      // Refresh data after delete
      const params = {
        pageIndex: pagination.pageIndex + 1,
        pageLimit: pagination.pageSize,
        search: globalFilter || "",
      };
      await dispatch(fetchUsersWithSearch(params)).unwrap();
    } catch (error) {
      console.error("Delete failed:", error);
      // setSnackbar({ open: true, message: error || "Failed to delete user", severity: "error" });
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  }, [dispatch, deleteDialog.id, pagination.pageIndex, pagination.pageSize, globalFilter]);

  //  Edit submit
  const handleEditSubmit = useCallback(async (values, { resetForm, setSubmitting }) => {
    if (!editData?.id) {
      setSubmitting(false);
      return;
    }
    setSubmitting(true);
    try {
      await dispatch(updateUser({ id: editData.id, ...values })).unwrap();
      resetForm();
      handleEditClose();
      // setSnackbar({ open: true, message: "User updated successfully", severity: "success" });

      // Refresh data after update
      const params = {
        pageIndex: pagination.pageIndex + 1,
        pageLimit: pagination.pageSize,
        search: globalFilter || "",
      };
      await dispatch(fetchUsersWithSearch(params)).unwrap();
    } catch (error) {
      console.error("Update failed:", error);
      // setSnackbar({ open: true, message: error || "Failed to update user", severity: "error" });
    } finally {
      setSubmitting(false);
    }
  }, [dispatch, editData, pagination.pageIndex, pagination.pageSize, globalFilter, handleEditClose]);

  // Handle status toggle
  const handleStatusToggle = useCallback(async (row, checked) => {
    const newStatus = checked ? 1 : 0;
    try {
      await dispatch(statusUpdate({ ...row, status: newStatus })).unwrap();
      // setSnackbar({ open: true, message: "Status updated successfully", severity: "success" });

      // Refresh data
      const params = {
        pageIndex: pagination.pageIndex + 1,
        pageLimit: pagination.pageSize,
        search: globalFilter || "",
      };
      await dispatch(fetchUsersWithSearch(params)).unwrap();
    } catch (error) {
      console.error("Status update failed:", error);
      // setSnackbar({ open: true, message: error || "Failed to update status", severity: "error" });
    }
  }, [dispatch, pagination.pageIndex, pagination.pageSize, globalFilter]);

  // Handle image compression
  const handleImageChange = useCallback(async (event, setFieldValue) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setSnackbar({ open: true, message: "Please upload a valid image file", severity: "error" });
      return;
    }

    // Validate file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      setSnackbar({ open: true, message: "Image size must be less than 5MB", severity: "error" });
      return;
    }

    try {
      setCompressingImage(true);

      // Compress the image
      const compressed = await compressImage(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1024,
      });

      setFieldValue("image", compressed);
    } catch (error) {
      console.error("Image compression failed:", error);
      setFieldValue("image", file);
    } finally {
      setCompressingImage(false);
    }
  }, []);

  const renderMobileCard = useCallback((row) => {
    const canUpdate = hasPermission("users.update");
    const canDelete = hasPermission("users.delete");

    return (
      <Card key={row.id} sx={{ mb: 2, boxShadow: 2, overflow: "hidden", borderRadius: 2, maxWidth: 600 }}>
        {/* Header Section - Blue Background */}
        <Box
          sx={{
            bgcolor: "primary.main",
            p: 1.25,
            color: "primary.contrastText",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar
                src={row.image ? mediaUrl + row.image : Profile}
                alt={row.name}
                sx={{ width: 40, height: 40 }}
              />
              <Typography variant="h6" sx={{ fontWeight: 600, color: "white", mb: 0.5 }}>
                {row.name}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Body Section */}
        <CardContent sx={{ p: 1.5 }}>
          {/* Details Grid */}
          <Grid container spacing={1} sx={{ mb: 2 }}>
            <Grid size={12}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center" }}>
                  <FiMail size={16} />
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 400, fontSize: "0.875rem" }}>
                  {row.email}
                </Typography>
              </Box>
            </Grid>

            <Grid size={12}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center" }}>
                  <FiPhone size={16} />
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 400, fontSize: "0.875rem" }}>
                  {row.mobile}
                </Typography>
              </Box>
            </Grid>

            <Grid size={12}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center" }}>
                  <FiMapPin size={16} />
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 400, fontSize: "0.875rem" }}>
                  {row.address}
                </Typography>
              </Box>
            </Grid>

            <Grid size={12}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center" }}>
                  <FiUser size={16} />
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 400, fontSize: "0.875rem" }}>
                  {row.roles?.[0]?.name || 'N/A'}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ mb: 1.5 }} />

          {/* Action Buttons */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Switch
              checked={!!row.status}
              disabled={!canUpdate}
              onChange={(e) => canUpdate && handleStatusToggle(row, e.target.checked)}
              sx={{
                width: 36,
                height: 20,
                padding: 0,
                '& .MuiSwitch-switchBase': {
                  padding: 0,
                  margin: '2px',
                  transitionDuration: '300ms',
                  '&.Mui-checked': {
                    transform: 'translateX(16px)',
                    color: '#fff',
                    '& + .MuiSwitch-track': {
                      backgroundColor: '#0d6efd',
                      opacity: 1,
                      border: 0,
                    },
                  },
                  '&.Mui-disabled + .MuiSwitch-track': {
                    opacity: 0.5,
                  },
                },
                '& .MuiSwitch-thumb': {
                  boxSizing: 'border-box',
                  width: 16,
                  height: 16,
                  boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.2)',
                },
                '& .MuiSwitch-track': {
                  borderRadius: 10,
                  backgroundColor: '#d9e0e6ff',
                  opacity: 1,
                  transition: 'background-color 0.3s',
                },
              }}
            />
            <Box sx={{ display: "flex", gap: 1.5 }}>
              {canUpdate && (
                <IconButton
                  size="medium"
                  onClick={() => handleUpdate(row)}
                  sx={{
                    bgcolor: "#e3f2fd",
                    color: "#1976d2",
                    "&:hover": { bgcolor: "#bbdefb" },
                  }}
                >
                  <BiSolidEditAlt size={20} />
                </IconButton>
              )}
              {canDelete && (
                <IconButton
                  size="medium"
                  onClick={() => handleDeleteClick(row)}
                  sx={{
                    bgcolor: "#ffebee",
                    color: "#d32f2f",
                    "&:hover": { bgcolor: "#ffcdd2" },
                  }}
                >
                  <RiDeleteBinLine size={20} />
                </IconButton>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }, [mediaUrl, hasPermission, handleUpdate, handleDeleteClick, handleStatusToggle]);

  const canUpdate = useMemo(() => hasPermission("users.update"), [hasPermission]);

  const columns = useMemo(() => {
    const baseColumns = [
      {
        accessorKey: "profilePic",
        header: "Image",
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ row }) => (
          <ImagePreviewDialog
            imageUrl={row.original.image ? mediaUrl + row.original.image : Profile}
            alt={row.original.name}
          />
        ),
        size: 80,
      },
      { accessorKey: "name", header: "Name" },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "mobile", header: "Mobile" },
      { accessorKey: "city", header: "City" },
      {
        accessorKey: "user_type_id",
        header: "Role",
        Cell: ({ row }) => {
          const roles = row.original.roles || [];
          return roles.length ? roles.map(r => r.name).join(', ') : 'N/A';
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ row }) => (
          <CustomSwitch
            checked={!!row.original.status}
            disabled={!canUpdate}
            onChange={(e) => {
              if (!canUpdate) return;
              handleStatusToggle(row.original, e.target.checked);
            }}
          />
        ),
      },
    ];

    if (hasAnyPermission?.(["users.update", "users.delete"])) {
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
            {canUpdate && (
              <Tooltip title="Edit">
                <IconButton color="primary" onClick={() => handleUpdate(row.original)}>
                  <BiSolidEditAlt size={16} />
                </IconButton>
              </Tooltip>
            )}

            {hasPermission("users.delete") && (
              <Tooltip title="Delete">
                <IconButton color="error" onClick={() => handleDeleteClick(row.original)}>
                  <RiDeleteBinLine size={16} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ),
      });
    }

    return baseColumns;
  }, [mediaUrl, canUpdate, handleUpdate, handleDeleteClick, handleStatusToggle, hasAnyPermission, hasPermission]);

  //  CSV export
  const downloadCSV = useCallback(() => {
    const headers = ["Name", "Email", "Mobile", "City", "User Type"];
    const rows = tableData.map((row) => [
      `"${row.name ?? ""}"`,
      `"${row.email ?? ""}"`,
      `"${row.mobile ?? ""}"`,
      `"${row.city ?? ""}"`,
      `"${row.roles?.[0]?.name ?? ""}"`,
    ].join(","));

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "users.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [tableData]);

  //  Print handler
  const handlePrint = useCallback(() => {
    if (!tableContainerRef.current) return;
    const printContents = tableContainerRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  }, []);

  // Mobile pagination handlers
  const handleMobilePageChange = (event, value) => {
    setPagination((prev) => ({ ...prev, pageIndex: value - 1 }));
  };

  const totalPages = Math.ceil(totalRows / pagination.pageSize);

  return (
    <>
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Grid item>
          <Typography variant="h6" className="page-title">
            Users
          </Typography>
        </Grid>
        <Grid item>
          {hasPermission("users.create") && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpen(true)}
            >
              Add User
            </Button>
          )}
        </Grid>
      </Grid>

      {isMobile ? (
        // 🔹 MOBILE VIEW (Cards)
        <>
          <Box sx={{ minHeight: '100vh' }}>
            {/* Mobile Search */}
            <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search users..."
                value={globalFilter}
                onChange={(e) => handleGlobalFilterChange(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Paper>

            {/* Loading State */}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {/* User Cards */}
            {!loading && tableData.map((row) => renderMobileCard(row))}

            {/* No Data State */}
            {!loading && tableData.length === 0 && (
              <Box sx={{ textAlign: 'center', p: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No users found
                </Typography>
              </Box>
            )}

            {/* Mobile Pagination */}
            {!loading && totalPages > 1 && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 3, pb: 2 }}>
                <Pagination
                  count={totalPages}
                  page={pagination.pageIndex + 1}
                  onChange={handleMobilePageChange}
                  color="primary"
                />
              </Box>
            )}
          </Box>
          {/* Mobile Pagination - FIXED: Use totalRows instead of hardcoded 10 */}
          {/* <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <Pagination
              count={Math.ceil(totalRows / pagination.pageSize)}
              page={pagination.pageIndex + 1}
              onChange={handleMobilePageChange}
              color="primary"
            />
          </Box> */}
        </>
      ) : (
        // 🔹 DESKTOP VIEW (Table)
        <Grid size={12}>
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
              state={{
                pagination,
                isLoading: loading,
                globalFilter,
              }}
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
                sx: {
                  width: "100%",
                  backgroundColor: "#fff",
                  overflowX: "auto",
                  minWidth: "1200px"
                },
              }}
              muiTablePaperProps={{
                sx: { backgroundColor: "#fff", boxShadow: "none" }
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
                    Users
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <MRT_GlobalFilterTextField table={table} />
                    <MRT_ToolbarInternalButtons table={table} />
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
            />
          </Paper>
        </Grid>
      )}

      {/* Add Modal */}
      <BootstrapDialog onClose={() => setOpen(false)} open={open} fullWidth maxWidth="sm">
        <BootstrapDialogTitle onClose={() => setOpen(false)}>
          Add User
        </BootstrapDialogTitle>
        <Formik
          initialValues={{
            name: "",
            email: "",
            mobile: "",
            state_id: "",
            city: "",
            address: "",
            user_type_id: "",
            password: "",
            zip_code: "",
            image: null,
          }}
          validationSchema={validationSchema}
          onSubmit={handleAdd}
        >
          {({ handleChange, handleBlur, setFieldValue, touched, errors, values, isSubmitting }) => (
            <Form>
              <DialogContent dividers>
                <Grid container rowSpacing={1} columnSpacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      id="name"
                      name="name"
                      label="Name *"
                      variant="outlined"
                      size="small"
                      fullWidth
                      margin="dense"
                      value={values.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.name && Boolean(errors.name)}
                      helperText={touched.name && errors.name}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      id="email"
                      name="email"
                      label="Email Address *"
                      variant="outlined"
                      size="small"
                      fullWidth
                      margin="dense"
                      value={values.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.email && Boolean(errors.email)}
                      helperText={touched.email && errors.email}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      id="mobile"
                      name="mobile"
                      label="Mobile *"
                      variant="outlined"
                      size="small"
                      fullWidth
                      margin="dense"
                      value={values.mobile}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.mobile && Boolean(errors.mobile)}
                      helperText={touched.mobile && errors.mobile}
                      inputProps={{ maxLength: 10 }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      id="user_type_id"
                      name="user_type_id"
                      select
                      label="Role *"
                      variant="outlined"
                      size="small"
                      fullWidth
                      margin="dense"
                      value={values.user_type_id}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.user_type_id && Boolean(errors.user_type_id)}
                      helperText={touched.user_type_id && errors.user_type_id}
                    >
                      <MenuItem value="">
                        <em>Select User Type</em>
                      </MenuItem>
                      {userTypes.map((option) => (
                        <MenuItem key={option.id} value={option.name}>
                          {option.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      id="password"
                      name="password"
                      label="Password *"
                      variant="outlined"
                      size="small"
                      fullWidth
                      type="password"
                      margin="dense"
                      value={values.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.password && Boolean(errors.password)}
                      helperText={touched.password && errors.password}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Grid container spacing={2} alignItems="center" mt={1}>
                      <Grid size={8}>
                        <Button
                          variant="contained"
                          color="primary"
                          component="label"
                          startIcon={<FileUploadOutlinedIcon />}
                          fullWidth
                          disabled={compressingImage}
                        >
                          {compressingImage ? "Compressing..." : "Profile Pic"}
                          <input
                            hidden
                            type="file"
                            accept="image/*"
                            onChange={(event) => handleImageChange(event, setFieldValue)}
                          />
                        </Button>
                      </Grid>
                      <Grid size={4}>
                        {values.image && (
                          <img
                            src={URL.createObjectURL(values.image)}
                            alt="Preview"
                            style={{
                              width: "45px",
                              height: "45px",
                              objectFit: "cover",
                              borderRadius: "4px",
                              border: "1px solid #ddd",
                            }}
                          />
                        )}
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      id="state_id"
                      name="state_id"
                      label="State *"
                      variant="outlined"
                      size="small"
                      fullWidth
                      margin="dense"
                      value={values.state_id}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.state_id && Boolean(errors.state_id)}
                      helperText={touched.state_id && errors.state_id}
                    >
                      <MenuItem value="">
                        <em>Select State</em>
                      </MenuItem>
                      {states.map((option) => (
                        <MenuItem key={option.id} value={option.id}>
                          {option.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      id="city"
                      name="city"
                      label="City *"
                      variant="outlined"
                      size="small"
                      fullWidth
                      margin="dense"
                      value={values.city}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.city && Boolean(errors.city)}
                      helperText={touched.city && errors.city}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      id="zip_code"
                      name="zip_code"
                      label="PIN Code *"
                      variant="outlined"
                      size="small"
                      fullWidth
                      margin="dense"
                      value={values.zip_code}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.zip_code && Boolean(errors.zip_code)}
                      helperText={touched.zip_code && errors.zip_code}
                      inputProps={{ maxLength: 6 }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      id="address"
                      name="address"
                      label="Address *"
                      variant="outlined"
                      size="small"
                      fullWidth
                      margin="dense"
                      multiline
                      rows={2}
                      value={values.address}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.address && Boolean(errors.address)}
                      helperText={touched.address && errors.address}
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions sx={{ gap: 1, mb: 1 }}>
                <Button variant="outlined" color="error" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </BootstrapDialog>

      {/* Edit Modal */}
      <BootstrapDialog onClose={handleEditClose} open={editOpen} fullWidth maxWidth="sm">
        <BootstrapDialogTitle onClose={handleEditClose}>
          Edit User
        </BootstrapDialogTitle>
        <Formik
          initialValues={{
            name: editData?.name || "",
            email: editData?.email || "",
            mobile: editData?.mobile || "",
            state_id: editData?.state_id || "",
            city: editData?.city || "",
            address: editData?.address || "",
            user_type_id: editData?.roles[0]?.id || "",
            zip_code: editData?.zip_code || "",
            password: "",
            image: null,
          }}

          validationSchema={editValidationSchema}
          enableReinitialize
          onSubmit={handleEditSubmit}
        >
          {({ handleChange, handleBlur, setFieldValue, touched, errors, values, isSubmitting }) => (
            <Form>
              <DialogContent dividers>
                <Grid container rowSpacing={1} columnSpacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      id="name"
                      name="name"
                      label="Name *"
                      variant="outlined"
                      size="small"
                      fullWidth
                      margin="dense"
                      value={values.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.name && Boolean(errors.name)}
                      helperText={touched.name && errors.name}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      id="email"
                      name="email"
                      label="Email Address *"
                      variant="outlined"
                      size="small"
                      fullWidth
                      margin="dense"
                      value={values.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.email && Boolean(errors.email)}
                      helperText={touched.email && errors.email}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      id="mobile"
                      name="mobile"
                      label="Mobile *"
                      variant="outlined"
                      size="small"
                      fullWidth
                      margin="dense"
                      value={values.mobile}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.mobile && Boolean(errors.mobile)}
                      helperText={touched.mobile && errors.mobile}
                      inputProps={{ maxLength: 10 }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      id="user_type_id"
                      name="user_type_id"
                      select
                      label="Role *"
                      variant="outlined"
                      size="small"
                      fullWidth
                      margin="dense"
                      value={values.user_type_id}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.user_type_id && Boolean(errors.user_type_id)}
                      helperText={touched.user_type_id && errors.user_type_id}
                    >
                      <MenuItem value="">
                        <em>Select User Type</em>
                      </MenuItem>

                      {userTypes.map((option) => (
                        <MenuItem key={option.id} value={option.id}>
                          {option.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      id="password"
                      name="password"
                      label="Password (leave blank to keep current)"
                      variant="outlined"
                      size="small"
                      fullWidth
                      type="password"
                      margin="dense"
                      value={values.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.password && Boolean(errors.password)}
                      helperText={touched.password && errors.password}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Grid container spacing={2} alignItems="center" mt={1}>
                      <Grid size={8}>
                        <Button
                          variant="contained"
                          color="primary"
                          component="label"
                          startIcon={<FileUploadOutlinedIcon />}
                          fullWidth
                          disabled={compressingImage}
                        >
                          {compressingImage ? "Compressing..." : "Profile Pic"}
                          <input
                            hidden
                            type="file"
                            accept="image/*"
                            onChange={(event) => handleImageChange(event, setFieldValue)}
                          />
                        </Button>
                      </Grid>
                      <Grid size={4}>
                        <img
                          src={
                            values.image
                              ? URL.createObjectURL(values.image)
                              : editData?.image
                                ? `${mediaUrl}${editData.image}`
                                : Profile
                          }
                          alt="Preview"
                          style={{
                            width: "45px",
                            height: "45px",
                            objectFit: "cover",
                            borderRadius: "4px",
                            border: "1px solid #ddd",
                          }}
                          onError={(e) => {
                            e.target.src = Profile;
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      id="state_id"
                      name="state_id"
                      label="State *"
                      variant="outlined"
                      size="small"
                      fullWidth
                      margin="dense"
                      value={values.state_id}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.state_id && Boolean(errors.state_id)}
                      helperText={touched.state_id && errors.state_id}
                    >
                      <MenuItem value="">
                        <em>Select State</em>
                      </MenuItem>
                      {states.map((option) => (
                        <MenuItem key={option.id} value={option.id}>
                          {option.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      id="city"
                      name="city"
                      label="City *"
                      variant="outlined"
                      size="small"
                      fullWidth
                      margin="dense"
                      value={values.city}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.city && Boolean(errors.city)}
                      helperText={touched.city && errors.city}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      id="zip_code"
                      name="zip_code"
                      label="PIN Code *"
                      variant="outlined"
                      size="small"
                      fullWidth
                      margin="dense"
                      value={values.zip_code}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.zip_code && Boolean(errors.zip_code)}
                      helperText={touched.zip_code && errors.zip_code}
                      inputProps={{ maxLength: 6 }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      id="address"
                      name="address"
                      label="Address *"
                      variant="outlined"
                      size="small"
                      fullWidth
                      margin="dense"
                      multiline
                      rows={2}
                      value={values.address}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.address && Boolean(errors.address)}
                      helperText={touched.address && errors.address}
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions sx={{ gap: 1, mb: 1 }}>
                <Button variant="outlined" color="error" onClick={handleEditClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </BootstrapDialog>

      {/* Delete Modal */}
      <Dialog
        open={deleteDialog.open}
        onClose={() =>
          !deleteDialog.loading && setDeleteDialog({ open: false, id: null, name: "", loading: false })
        }
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete User?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete user{" "}
            <strong>{deleteDialog.name}</strong>?
            <br />
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setDeleteDialog({ open: false, id: null, name: "", loading: false })
            }
            disabled={deleteDialog.loading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDelete}
            disabled={deleteDialog.loading}
          >
            {deleteDialog.loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      {/* <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar> */}
    </>
  );
};

export default Users;