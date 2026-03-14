import React, { useState, useEffect, useCallback, useMemo } from "react";
import Grid from "@mui/material/Grid";
import {
  Button,
  Typography,
  Card,
  Box,
  Tooltip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CardContent,
  Stack,
  CircularProgress,
  Backdrop,
  Chip,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  useTheme,
  useMediaQuery,
  Divider,
  Alert,
  Snackbar,
} from "@mui/material";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Table as ResponsiveTable, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { AiOutlineSetting, AiOutlineEye } from "react-icons/ai";
import AddIcon from "@mui/icons-material/Add";
import { BiSolidEditAlt } from "react-icons/bi";
import { MdOutlineCheckCircle } from "react-icons/md";
import { RiDeleteBinLine } from "react-icons/ri";
import { useDispatch } from "react-redux";
import {
  approveAllProduct,
  approveSingleProduct,
  editOrder,
  getPreviousPO,
  getProductProductionLog
} from "../slice/orderSlice";
import ImagePreviewDialog from "../../../components/ImagePreviewDialog/ImagePreviewDialog";
import { format } from "date-fns";
import { trim } from "lodash";

// Constants
const ORDER_STATUS = {
  PENDING: 0,
  APPROVED: 1,
  IN_PROGRESS: 2,
  COMPLETED: 3,
  CANCELLED: 4,
};

const STATUS_CONFIG = {
  [ORDER_STATUS.PENDING]: { label: "Pending", color: "warning" },
  [ORDER_STATUS.APPROVED]: { label: "Approved", color: "success" },
  [ORDER_STATUS.IN_PROGRESS]: { label: "In Progress", color: "info" },
  [ORDER_STATUS.COMPLETED]: { label: "Completed", color: "success" },
  [ORDER_STATUS.CANCELLED]: { label: "Cancelled", color: "error" },
};

const PRODUCTION_STATUS = {
  NOT_STARTED: 0,
  IN_PROGRESS: 1,
  COMPLETED: 2,
};

const PRODUCTION_STATUS_CONFIG = {
  [PRODUCTION_STATUS.NOT_STARTED]: { label: "Not Started", color: "default" },
  [PRODUCTION_STATUS.IN_PROGRESS]: { label: "In Progress", color: "info" },
  [PRODUCTION_STATUS.COMPLETED]: { label: "Completed", color: "success" },
};

// Utility functions
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    return format(new Date(dateString), "dd MMM yyyy");
  } catch (error) {
    console.error("Date formatting error:", error);
    return "N/A";
  }
};

const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  try {
    return format(new Date(dateString), "dd MMM yyyy, hh:mm a");
  } catch (error) {
    console.error("DateTime formatting error:", error);
    return "N/A";
  }
};

const parseProductIds = (productIds) => {
  try {
    return typeof productIds === 'string' ? JSON.parse(productIds) : productIds || [];
  } catch (error) {
    console.error("Error parsing product_ids:", error);
    return [];
  }
};

const OrderDetailsView = () => {
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const mediaUrl = import.meta.env.VITE_MEDIA_URL;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [loading, setLoading] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [previousPOData, setPreviousPOData] = useState([]);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editedProductionQty, setEditedProductionQty] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  // Modal states
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [openStagesModal, setOpenStagesModal] = useState(false);
  const [selectedProductLogs, setSelectedProductLogs] = useState([]);

  // Snackbar helpers
  const showSnackbar = useCallback((message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  // Format items helper
  const formatItems = useCallback((productItems) => {
    return productItems.map((item, index) => ({
      id: index + 1,
      product_id: item.product_id,
      group: item.group || "N/A",
      name: item.name || "N/A",
      model: item.model || "N/A",
      unique_code: item.unique_code || "N/A",
      original_qty: item.original_qty || 0,
      production_qty: item.production_qty || 0,
      size: item.size || "N/A",
      document: item.document || "",
      start_date: item.start_date ? formatDate(item.start_date) : "N/A",
      end_date: item.end_date ? formatDate(item.end_date) : "N/A",
    }));
  }, []);

  // Load order details
  const loadOrderDetails = useCallback(async () => {
    if (!orderId) return;

    setLoading(true);
    try {
      const response = await dispatch(editOrder(orderId)).unwrap();
      const data = response.data || response;

      if (!data) {
        throw new Error("Order not found");
      }

      // Fetch previous PO data
      const previousPOResponse = await dispatch(
        getPreviousPO({ id: data.quotation_id, orderId })
      );
      setPreviousPOData(previousPOResponse.payload || []);

      // Parse and format product items
      const productItems = parseProductIds(data.product_ids);
      const formattedItems = formatItems(productItems);

      setOrderData(data);
      setItems(formattedItems);
      setProducts(data.products || []);

      // Initialize edited quantities
      const initialQty = formattedItems.reduce((acc, item) => {
        acc[item.id] = item.production_qty;
        return acc;
      }, {});
      setEditedProductionQty(initialQty);

      showSnackbar("Order details loaded successfully", "success");
    } catch (error) {
      console.error("Error loading order details:", error);
      showSnackbar("Failed to load order details", "error");
      setTimeout(() => navigate("/customer/order"), 2000);
    } finally {
      setLoading(false);
    }
  }, [orderId, dispatch, navigate, formatItems, showSnackbar]);

  // Load order data on mount
  useEffect(() => {
    loadOrderDetails();
  }, [loadOrderDetails]);

  // Handle production qty change
  const handleProductionQtyChange = useCallback((itemId, value, maxQty, prevQty = 0, completedQty = 0) => {
    let qty = Number(value);
    const totalUsedQty = prevQty + completedQty;
    const remainingQty = Math.max(0, maxQty - totalUsedQty);

    if (isNaN(qty) || qty < 0) qty = 0;
    if (qty > remainingQty) qty = remainingQty;

    setEditedProductionQty((prev) => ({
      ...prev,
      [itemId]: qty,
    }));
  }, []);

  // Handle edit item
  const handleEditClick = useCallback((itemId) => {
    setEditingItemId(itemId);
  }, []);

  // Handle save edited item
  const handleSaveEdit = useCallback(async (itemId) => {
    try {
      const item = items.find((i) => i.id === itemId);
      if (!item) {
        showSnackbar("Item not found", "error");
        return;
      }

      // Update local state
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId
            ? { ...item, production_qty: editedProductionQty[itemId] }
            : item
        )
      );
      setEditingItemId(null);
      showSnackbar("Production quantity updated", "success");
    } catch (error) {
      console.error("Error saving edit:", error);
      showSnackbar("Failed to save changes", "error");
    }
  }, [items, editedProductionQty, showSnackbar]);

  // Handle cancel edit
  const handleCancelEdit = useCallback((itemId) => {
    const originalItem = items.find((item) => item.id === itemId);
    if (originalItem) {
      setEditedProductionQty((prev) => ({
        ...prev,
        [itemId]: originalItem.production_qty,
      }));
    }
    setEditingItemId(null);
  }, [items]);

  // Handle delete item
  const handleDeleteClick = useCallback((itemId) => {
    setSelectedItemId(itemId);
    setOpenDelete(true);
  }, []);

  const confirmDelete = useCallback(() => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== selectedItemId));
    setOpenDelete(false);
    setSelectedItemId(null);
    showSnackbar("Item deleted successfully", "success");
  }, [selectedItemId, showSnackbar]);

  // Handle approve all products
  const handleApproveAll = useCallback(async () => {
    try {
      const updatedItems = items.map((item) => ({
        product_id: item.product_id,
        group: item.group,
        name: item.name,
        model: item.model,
        unique_code: item.unique_code,
        original_qty: item.original_qty,
        production_qty: editedProductionQty[item.id] || item.production_qty,
        size: item.size,
        document: item.document,
        start_date: item.start_date,
        end_date: item.end_date,
      }));

      await dispatch(
        approveAllProduct({
          id: orderId,
          items: updatedItems,
        })
      ).unwrap();

      showSnackbar("Order approved successfully", "success");
      await loadOrderDetails();
    } catch (error) {
      console.error("Error approving order:", error);
      showSnackbar("Failed to approve order. Please try again.", "error");
    }
  }, [items, editedProductionQty, orderId, dispatch, loadOrderDetails, showSnackbar]);

  // Handle approve single product
  const handleApproveSingle = useCallback(
    async (poID, group, productID) => {
      try {
        const item = items.find(
          (i) => i.product_id == productID && (i.group ?? "").trim() === (group ?? "").trim()
        );

        if (!item) {
          showSnackbar("Item not found", "error");
          return;
        }

        await dispatch(
          approveSingleProduct({
            po_id: poID,
            group: trim(group ?? ""),
            product_id: productID,
            production_qty: item
              ? editedProductionQty[item.id] || item.production_qty
              : 0,
          })
        ).unwrap();

        showSnackbar("Production started successfully", "success");
        await loadOrderDetails();
      } catch (error) {
        console.error("Error approving single product:", error);
        showSnackbar("Failed to start production. Please try again.", "error");
      }
    },
    [items, editedProductionQty, dispatch, loadOrderDetails, showSnackbar]
  );

  // Handle view production stages
  const handleViewStages = useCallback(async (ppId) => {
    setLoadingLogs(true);
    setOpenStagesModal(true);
    setSelectedProductLogs([]);

    try {
      const response = await dispatch(getProductProductionLog(ppId)).unwrap();
      const logsData = response.data || response || [];

      // Sort logs by created_at in ascending order (oldest first)
      const sortedLogs = [...logsData].sort((a, b) =>
        new Date(a.created_at) - new Date(b.created_at)
      );

      setSelectedProductLogs(sortedLogs);
    } catch (error) {
      console.error("Error fetching production logs:", error);
      showSnackbar("Failed to load production logs", "error");
      setSelectedProductLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  }, [dispatch, showSnackbar]);

  // Get status badge component
  const StatusBadge = useCallback(({ status }) => {
    const statusInfo = STATUS_CONFIG[status] || { label: "Unknown", color: "default" };
    return <Chip label={statusInfo.label} color={statusInfo.color} size="small" />;
  }, []);

  // Get production status badge
  const ProductionStatusBadge = useCallback(({ status }) => {
    const statusInfo = PRODUCTION_STATUS_CONFIG[status] || { label: "Unknown", color: "default" };
    return <Chip label={statusInfo.label} color={statusInfo.color} size="small" variant="outlined" />;
  }, []);

  // Memoized calculations
  const summary = useMemo(() => {
    return {
      totalItems: items.length,
      totalOriginalQty: items.reduce((sum, item) => sum + Number(item.original_qty || 0), 0),
      totalProductionQty: items.reduce(
        (sum, item) => sum + Number(editedProductionQty[item.id] || item.production_qty || 0),
        0
      ),
    };
  }, [items, editedProductionQty]);

  // Render item card for mobile view
  const renderItemCard = (item) => {
    const matchedProduct = products.find(
      (p) =>
        (p.group ?? "").trim() === (item.group ?? "").trim() && p.product_id == item.product_id
    );

    // Find in-production match (status = 1)
    const prevMatch = previousPOData.find(
      (p) =>
        p.status === 1 &&
        p.product_id == item.product_id &&
        (p.group ?? "").trim() === (item.group ?? "").trim()
    );

    // Find completed match (status = 2)
    const completedMatch = previousPOData.find(
      (p) =>
        p.status === 2 &&
        p.product_id == item.product_id &&
        (p.group ?? "").trim() === (item.group ?? "").trim()
    );

    const inProductionQty = prevMatch ? parseInt(prevMatch.total_qty || 0) : 0;
    const completedQty = completedMatch ? parseInt(completedMatch.total_qty || 0) : 0;
    const totalUsedQty = inProductionQty + completedQty;

    const isEditing = editingItemId === item.id;

    return (
      <Card key={item.id} sx={{ mb: 2, bgcolor: '#f9f9f9' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Chip label={`#${item.id}`} size="small" color="primary" />
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography variant="subtitle2" color="text.secondary">
                {item.group}
              </Typography>
              {matchedProduct && (
                <ProductionStatusBadge status={matchedProduct.status} />
              )}
            </Box>
          </Box>

          <Typography variant="h6" sx={{ mb: 1 }}>
            {item.name}
          </Typography>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={6}>
              <Typography variant="caption" color="text.secondary">Model</Typography>
              <Typography variant="body2">{item.model}</Typography>
            </Grid>
            <Grid size={6}>
              <Typography variant="caption" color="text.secondary">Unique Code</Typography>
              <Typography variant="body2">{item.unique_code}</Typography>
            </Grid>
            <Grid size={6}>
              <Typography variant="caption" color="text.secondary">Size</Typography>
              <Typography variant="body2">{item.size}</Typography>
            </Grid>
            <Grid size={6}>
              <Typography variant="caption" color="text.secondary">Original Qty</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.original_qty}</Typography>
            </Grid>
            
            {previousPOData.length > 0 && (
              <>
                <Grid size={4}>
                  <Typography variant="caption" color="text.secondary">In Production</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    {prevMatch ? (
                      <Chip
                        label={prevMatch.total_qty}
                        color="info"
                        size="small"
                        variant="outlined"
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">0</Typography>
                    )}
                  </Box>
                </Grid>
                <Grid size={4}>
                  <Typography variant="caption" color="text.secondary">Completed</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    {completedMatch ? (
                      <Chip
                        label={completedMatch.total_qty}
                        color="success"
                        size="small"
                        variant="outlined"
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">0</Typography>
                    )}
                  </Box>
                </Grid>
                <Grid size={4}>
                  <Typography variant="caption" color="text.secondary">Production Qty</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    {isEditing ? (
                      <TextField
                        type="number"
                        size="small"
                        value={editedProductionQty[item.id] || 0}
                        onChange={(e) =>
                          handleProductionQtyChange(
                            item.id,
                            e.target.value,
                            item.original_qty,
                            inProductionQty,
                            completedQty
                          )
                        }
                        inputProps={{ min: 0 }}
                        sx={{ width: "100%" }}
                      />
                    ) : (
                      <Chip
                        label={editedProductionQty[item.id] || item.production_qty}
                        color="primary"
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Grid>
              </>
            )}
            
            {previousPOData.length === 0 && (
              <Grid size={6}>
                <Typography variant="caption" color="text.secondary">Production Qty</Typography>
                <Box sx={{ mt: 0.5 }}>
                  {isEditing ? (
                    <TextField
                      type="number"
                      size="small"
                      value={editedProductionQty[item.id] || 0}
                      onChange={(e) =>
                        handleProductionQtyChange(
                          item.id,
                          e.target.value,
                          item.original_qty,
                          0,
                          0
                        )
                      }
                      inputProps={{ min: 0 }}
                      sx={{ width: "100%" }}
                    />
                  ) : (
                    <Chip
                      label={editedProductionQty[item.id] || item.production_qty}
                      color="primary"
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Grid>
            )}
            
            <Grid size={6}>
              <Typography variant="caption" color="text.secondary">Start Date</Typography>
              <Typography variant="body2">{item.start_date}</Typography>
            </Grid>
            <Grid size={6}>
              <Typography variant="caption" color="text.secondary">End Date</Typography>
              <Typography variant="body2">{item.end_date}</Typography>
            </Grid>
            <Grid size={12}>
              <Typography variant="caption" color="text.secondary">Document</Typography>
              <Box sx={{ mt: 0.5 }}>
                {item.document ? (
                  <ImagePreviewDialog
                    imageUrl={mediaUrl + item.document}
                    alt={item.name}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">No Document</Typography>
                )}
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {matchedProduct && matchedProduct.status === PRODUCTION_STATUS.NOT_STARTED && (
              <>
                {items.length > 1 && (
                  <Button
                    variant="outlined"
                    color="warning"
                    size="small"
                    startIcon={<AiOutlineSetting />}
                    onClick={() =>
                      handleApproveSingle(
                        matchedProduct.po_id,
                        matchedProduct.group,
                        matchedProduct.product_id
                      )
                    }
                  >
                    Start Production
                  </Button>
                )}

                {!isEditing && orderData?.quotation_id && (
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    startIcon={<BiSolidEditAlt />}
                    onClick={() => handleEditClick(item.id)}
                  >
                    Edit Qty
                  </Button>
                )}

                {isEditing && (
                  <>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      onClick={() => handleSaveEdit(item.id)}
                    >
                      Save
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleCancelEdit(item.id)}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </>
            )}

            {matchedProduct &&
              (matchedProduct.status === PRODUCTION_STATUS.IN_PROGRESS ||
                matchedProduct.status === PRODUCTION_STATUS.COMPLETED) && (
                <Button
                  variant="outlined"
                  color="info"
                  size="small"
                  startIcon={<AiOutlineEye />}
                  onClick={() => handleViewStages(matchedProduct.id)}
                >
                  View Stages
                </Button>
              )}

            {!matchedProduct && (
              <Typography variant="caption" color="text.secondary">
                No actions available
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Render loading state
  if (loading) {
    return (
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress color="inherit" />
          <Typography sx={{ mt: 2 }}>Loading order details...</Typography>
        </Box>
      </Backdrop>
    );
  }

  // Render no data state
  if (!orderData) {
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <Typography variant="h6">No order data found</Typography>
        <Button
          component={Link}
          to="/customer/order"
          variant="contained"
          sx={{ mt: 2 }}
        >
          Back to Orders
        </Button>
      </Box>
    );
  }

  const customer = orderData.customer;

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

      {/* Header */}
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: { xs: 2, md: 2 } }}
      >
        <Grid item>
          <Typography variant="h6" className="page-title">Order Details</Typography>
        </Grid>
        <Grid item>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              component={Link}
              to="/customer/order"
            >
              Back to Orders
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              component={Link}
              to="/customer/order/create"
            >
              Create Order
            </Button>
          </Stack>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={12}>
          <Card>
            <CardContent>
              {/* Order Header */}
              <Box sx={{ mb: 3 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 2 }}>
                  <Typography variant="h6">
                    Order No:{" "}
                    <Box component="span" sx={{ fontWeight: 600 }}>
                      {orderData.batch_no}
                    </Box>
                  </Typography>
                  <StatusBadge status={orderData.status} />
                </Stack>

                <Grid container spacing={{ xs: 2, md: 3 }} sx={{ justifyContent: "flex-start", textAlign: { xs: "left", md: "center" } }}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Quotation ID
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {orderData.quotation_id}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Commencement Date
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatDate(orderData.commencement_date)}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Delivery Date
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatDate(orderData.delivery_date)}
                    </Typography>
                  </Grid>

                  {orderData.priority && (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Priority
                      </Typography>
                      <Chip label={orderData.priority} color="warning" size="small" />
                    </Grid>
                  )}

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Created Date
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatDate(orderData.created_at)}
                    </Typography>
                  </Grid>

                  {orderData.remark && (
                    <Grid size={{ xs: 12, md: 12 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Remarks
                      </Typography>
                      <Typography variant="body1">{orderData.remark}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>

              {/* Customer Information */}
              {customer && (
                <Box sx={{ mb: 3, p: 2, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Customer Details
                  </Typography>
                  <Typography variant="body2">
                    <strong>{customer.name}</strong>
                    <br />
                    {customer.address}
                    <br />
                    {customer.city}, {customer.state?.name} {customer.zip_code}
                  </Typography>
                </Box>
              )}

              {/* Action Buttons */}
              {orderData.status === ORDER_STATUS.PENDING && (
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={2} 
                  sx={{ justifyContent: "flex-end", mb: 3 }}
                >
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<MdOutlineCheckCircle />}
                    onClick={handleApproveAll}
                    fullWidth={isMobile}
                  >
                    {items.length > 1 ? "Approve All" : "Approve"}
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<BiSolidEditAlt />}
                    component={Link}
                    to={`/customer/order/edit/${orderId}`}
                    fullWidth={isMobile}
                  >
                    Edit Order
                  </Button>
                </Stack>
              )}

              {/* Items Section */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Order Items ({items.length})
                </Typography>

                {items.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 5 }}>
                    <Typography variant="body2" color="text.secondary">
                      No items found
                    </Typography>
                  </Box>
                ) : (
                  <>
                    {/* Mobile View - Cards */}
                    {isMobile ? (
                      <Box>
                        {items.map((item) => renderItemCard(item))}
                      </Box>
                    ) : (
                      /* Desktop View - Table */
                      <Box sx={{ overflowX: 'auto' }}>
                        <ResponsiveTable>
                          <Thead>
                            <Tr>
                              <Th>#</Th>
                              <Th>Group</Th>
                              <Th>Product Name</Th>
                              <Th>Model</Th>
                              <Th>Unique Code</Th>
                              <Th>Original Qty</Th>
                              {previousPOData.length > 0 && <Th>Qty in Production</Th>}
                              <Th>Production Qty</Th>
                              {previousPOData.length > 0 && <Th>Completed Product</Th>}
                              <Th>Size</Th>
                              <Th>Document</Th>
                              <Th>Start Date</Th>
                              <Th>End Date</Th>
                              <Th>Status</Th>
                              <Th>Action</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {items.map((item) => {
                              const matchedProduct = products.find(
                                (p) =>
                                  (p.group ?? "").trim() === (item.group ?? "").trim() && p.product_id == item.product_id
                              );

                              // Find in-production match (status = 1)
                              const prevMatch = previousPOData.find(
                                (p) =>
                                  p.status === 1 &&
                                  p.product_id == item.product_id &&
                                  (p.group ?? "").trim() === (item.group ?? "").trim()
                              );

                              // Find completed match (status = 2)
                              const completedMatch = previousPOData.find(
                                (p) =>
                                  p.status === 2 &&
                                  p.product_id == item.product_id &&
                                  (p.group ?? "").trim() === (item.group ?? "").trim()
                              );

                              const inProductionQty = prevMatch ? parseInt(prevMatch.total_qty || 0) : 0;
                              const completedQty = completedMatch ? parseInt(completedMatch.total_qty || 0) : 0;
                              const totalUsedQty = inProductionQty + completedQty;

                              const isEditing = editingItemId === item.id;

                              return (
                                <Tr key={item.id}>
                                  <Td>{item.id}</Td>
                                  <Td>{item.group}</Td>
                                  <Td>{item.name}</Td>
                                  <Td>{item.model}</Td>
                                  <Td>{item.unique_code}</Td>
                                  <Td>{item.original_qty}</Td>
                                  
                                  {/* Qty in Production */}
                                  {previousPOData.length > 0 && (
                                    <Td style={{ textAlign: "center" }}>
                                      {prevMatch ? (
                                        <Chip
                                          label={prevMatch.total_qty}
                                          color="info"
                                          size="small"
                                          variant="outlined"
                                        />
                                      ) : (
                                        <Typography variant="body2" color="text.secondary">
                                          0
                                        </Typography>
                                      )}
                                    </Td>
                                  )}
                                  
                                  {/* Production Qty */}
                                  <Td style={{ textAlign: "center" }}>
                                    {isEditing ? (
                                      <TextField
                                        type="number"
                                        size="small"
                                        value={editedProductionQty[item.id] || 0}
                                        onChange={(e) =>
                                          handleProductionQtyChange(
                                            item.id,
                                            e.target.value,
                                            item.original_qty,
                                            inProductionQty,
                                            completedQty
                                          )
                                        }
                                        inputProps={{ min: 0 }}
                                        sx={{ width: "100px" }}
                                      />
                                    ) : (
                                      <Chip
                                        label={editedProductionQty[item.id] || item.production_qty}
                                        color="primary"
                                        size="small"
                                        variant="outlined"
                                      />
                                    )}
                                  </Td>
                                  
                                  {/* Completed Product */}
                                  {previousPOData.length > 0 && (
                                    <Td style={{ textAlign: "center" }}>
                                      {completedMatch ? (
                                        <Chip
                                          label={completedMatch.total_qty}
                                          color="success"
                                          size="small"
                                          variant="outlined"
                                        />
                                      ) : (
                                        <Typography variant="body2" color="text.secondary">
                                          0
                                        </Typography>
                                      )}
                                    </Td>
                                  )}
                                  
                                  <Td>{item.size}</Td>
                                  <Td>
                                    {item.document ? (
                                      <ImagePreviewDialog
                                        imageUrl={mediaUrl + item.document}
                                        alt={item.name}
                                      />
                                    ) : (
                                      <Typography variant="body2" color="text.secondary">
                                        No Document
                                      </Typography>
                                    )}
                                  </Td>
                                  <Td>{item.start_date}</Td>
                                  <Td>{item.end_date}</Td>
                                  <Td>
                                    {matchedProduct ? (
                                      <ProductionStatusBadge status={matchedProduct.status} />
                                    ) : (
                                      <Typography variant="caption" color="text.secondary">
                                        N/A
                                      </Typography>
                                    )}
                                  </Td>
                                  <Td>
                                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                                      {matchedProduct && matchedProduct.status === PRODUCTION_STATUS.NOT_STARTED && (
                                        <>
                                          {items.length > 1 && (
                                            <Tooltip title="Start Production">
                                              <IconButton
                                                color="warning"
                                                size="small"
                                                onClick={() =>
                                                  handleApproveSingle(
                                                    matchedProduct.po_id,
                                                    matchedProduct.group,
                                                    matchedProduct.product_id
                                                  )
                                                }
                                              >
                                                <AiOutlineSetting size={16} />
                                              </IconButton>
                                            </Tooltip>
                                          )}

                                          {!isEditing && orderData.quotation_id && (
                                            <Tooltip title="Edit Production Qty">
                                              <IconButton
                                                color="primary"
                                                size="small"
                                                onClick={() => handleEditClick(item.id)}
                                              >
                                                <BiSolidEditAlt size={16} />
                                              </IconButton>
                                            </Tooltip>
                                          )}

                                          {isEditing && (
                                            <>
                                              <Button
                                                size="small"
                                                variant="contained"
                                                color="success"
                                                onClick={() => handleSaveEdit(item.id)}
                                              >
                                                Save
                                              </Button>
                                              <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => handleCancelEdit(item.id)}
                                              >
                                                Cancel
                                              </Button>
                                            </>
                                          )}
                                        </>
                                      )}

                                      {matchedProduct &&
                                        (matchedProduct.status === PRODUCTION_STATUS.IN_PROGRESS ||
                                          matchedProduct.status === PRODUCTION_STATUS.COMPLETED) && (
                                          <Tooltip title="View Production Stages">
                                            <IconButton
                                              color="info"
                                              size="small"
                                              onClick={() => handleViewStages(matchedProduct.id)}
                                            >
                                              <AiOutlineEye size={18} />
                                            </IconButton>
                                          </Tooltip>
                                        )}

                                      {!matchedProduct && (
                                        <Typography variant="caption" color="text.secondary">
                                          —
                                        </Typography>
                                      )}
                                    </Box>
                                  </Td>
                                </Tr>
                              );
                            })}
                          </Tbody>
                        </ResponsiveTable>
                      </Box>
                    )}
                  </>
                )}
              </Box>

              {/* Summary Section */}
              {items.length > 0 && (
                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    backgroundColor: "#f9f9f9",
                    borderRadius: 1,
                    display: "flex",
                    justifyContent: { xs: "center", md: "flex-end" },
                  }}
                >
                  <Grid
                    container
                    spacing={2}
                    sx={{
                      width: { xs: "100%", md: "600px" },
                      maxWidth: 1000,
                      justifyContent: "center",
                      textAlign: "center"
                    }}
                  >
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Items
                      </Typography>
                      <Typography variant="h6">{summary.totalItems}</Typography>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Original Qty
                      </Typography>
                      <Typography variant="h6">{summary.totalOriginalQty}</Typography>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Production Qty
                      </Typography>
                      <Typography variant="h6">{summary.totalProductionQty}</Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Item?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this item? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Production Stages Modal */}
      <Dialog
        open={openStagesModal}
        onClose={() => setOpenStagesModal(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="h6">Production Stage History</Typography>
            {selectedProductLogs.length > 0 && (
              <Chip
                label={`${selectedProductLogs.length} Transitions`}
                color="primary"
                size="small"
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {loadingLogs ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 5 }}>
              <CircularProgress />
            </Box>
          ) : selectedProductLogs.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small" sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>From Stage</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>To Stage</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Remark</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Action By</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date & Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedProductLogs.map((log, index) => (
                    <TableRow
                      key={log.id}
                      sx={{
                        '&:hover': { backgroundColor: '#f9f9f9' },
                        '&:last-child td': { borderBottom: 0 }
                      }}
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Chip
                          label={
                            log.from_stage?.name
                              ? log.from_stage.name
                              : log.status === 0
                                ? "Order Created"
                                : "N/A"
                          }
                          size="small"
                          color="default"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            log.to_stage?.name
                              ? log.to_stage.name
                              : log.status === 0
                                ? "In Production"
                                : log.status === 2
                                  ? "Out from Production"
                                  : "N/A"
                          }
                          size="small"
                          color="primary"
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {log.remark || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {log.user?.name || "Unknown"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {log.action_by}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDateTime(log.created_at)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: "center", py: 5 }}>
              <Typography variant="body1" color="text.secondary">
                No production logs found for this product.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStagesModal(false)} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default OrderDetailsView;