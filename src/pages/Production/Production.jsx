// Production.jsx - Optimized Main Component
import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  Container,
  Card,
  CardContent,
  Chip,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
} from "@mui/material";
import { IoMdAdd } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";

// Components
import NavigationMenu from "../../components/Production/Navigation";
import DepartmentFormDialog from "../../components/Department/DepartmentFormDialog";
import ProductDetailsModal from "../../components/Production/ProductDetailsModal";
import RequestStockDrawer from "../../components/Production/RequestStockDrawer";
import LogTimeDrawer from "../../components/Production/LogTimeDrawer";
import TentativeItemDrawer from "../../components/Production/TentativeItemDrawer";
import ProductCard from "../../components/Production/ProductCard";
import ProductCardSkeleton from "../../components/Production/ProductCardSkeleton";
import ActionMenu from "../../components/Production/ActionMenu";

// Redux Actions
import {
  addDepartment,
  fetchActiveDepartments,
} from "../settings/slices/departmentSlice";
import { fetchBatchProduct } from "./slice/productionChainSlice";
import { fetchActiveSupervisor } from "../Users/slices/userSlice";

export default function Production() {
  const dispatch = useDispatch();

  // Redux State
  const { activeBatch } = useSelector((state) => state.productionChain);
  const { data: departments = [] } = useSelector((state) => state.department);
  const {
    batchProduct: batchProductsData = {},
    loading: batchLoading,
    error: batchError,
  } = useSelector((state) => state.productionChain);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // UI States
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [openDepartmentDialog, setOpenDepartmentDialog] = useState(false);
  const [openRequestStockDrawer, setOpenRequestStockDrawer] = useState(false);
  const [openLogTimeDrawer, setOpenLogTimeDrawer] = useState(false);
  const [openTentativeDrawer, setOpenTentativeDrawer] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const menuOpen = Boolean(anchorEl);

  // Initial data fetch - Optimized with Promise.all
  useEffect(() => {
    const fetchInitialData = async () => {
      await Promise.all([
        dispatch(fetchActiveDepartments()),
        dispatch(fetchActiveSupervisor()),
      ]);
    };
    fetchInitialData();
  }, [dispatch]);

  // Fetch batch products when active batch changes
  useEffect(() => {
    if (activeBatch) {
      setIsRefreshing(true);
      dispatch(fetchBatchProduct(activeBatch)).finally(() => {
        setIsRefreshing(false);
      });
    }
  }, [activeBatch, dispatch]);

  // Memoized Handlers - Prevents unnecessary re-renders
  const handleOpenMenu = useCallback((e, product) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
    setSelectedProduct(product);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleOpenDetailsModal = useCallback((product) => {
    setSelectedProduct(product);
    setOpenDetailsModal(true);
  }, []);

  const handleCloseDetailsModal = useCallback(() => {
    setOpenDetailsModal(false);
    // Delay clearing for smooth modal close animation
    setTimeout(() => setSelectedProduct(null), 300);
  }, []);

  const handleAddDepartment = useCallback(
    async (values, { resetForm }) => {
      const res = await dispatch(addDepartment(values));
      if (!res.error) {
        resetForm();
        setOpenDepartmentDialog(false);
        dispatch(fetchActiveDepartments());
      }
    },
    [dispatch]
  );

  const handleOpenRequestStock = useCallback(() => {
    setOpenRequestStockDrawer(true);
    handleCloseMenu();
  }, [handleCloseMenu]);

  const handleOpenLogTime = useCallback(() => {
    setOpenLogTimeDrawer(true);
    handleCloseMenu();
  }, [handleCloseMenu]);

  const handleRefreshBatch = useCallback(() => {
    if (activeBatch && !isRefreshing) {
      setIsRefreshing(true);
      dispatch(fetchBatchProduct(activeBatch)).finally(() => {
        setIsRefreshing(false);
      });
    }
  }, [activeBatch, dispatch, isRefreshing]);

  // Memoized sorted departments - Only recalculates when departments change
  const sortedDepartments = useMemo(() => {
    return [...departments].sort((a, b) => a.sequence - b.sequence);
  }, [departments]);

  return (
    <>
      <Container
        disableGutters
        sx={{
          maxWidth: "100% !important",
          // overflowX: "hidden",
          marginBottom: 3,
        }}
      >
        {/* Header with loading indicator */}
        <Box
          sx={{
            mb: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* <Typography variant="h6" className="page-title">Production</Typography> */}
          {isRefreshing && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="caption" color="text.secondary">
                Refreshing...
              </Typography>
            </Box>
          )}
        </Box>

        {/* Error Alert */}
        {batchError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load batch data. Please try refreshing.
          </Alert>
        )}

        <Box
          sx={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            height: isMobile ? "auto !important" : "calc(100vh - 220px)",
            gap: 2,
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          {/* Navigation Panel */}
          <Box
            sx={{
              flex: isMobile ? "0 0 auto" : "0 0 240px",
              height: isMobile ? "auto !important" : "100%",
              boxSizing: "border-box",
            }}
          >
            <Card
              variant="outlined"
              sx={{
                height: isMobile ? "auto !important" : "100%",
                overflowY: isMobile ? "visible !important" : "auto",
                boxShadow: 1,
                transition: "box-shadow 0.2s ease-in-out",
                "&:hover": {
                  boxShadow: 2,
                },
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  Production
                </Typography>
                <NavigationMenu />
              </CardContent>
            </Card>
          </Box>

          {/* Main Content */}
          <Box
            sx={{
              flex: 1,
              height: isMobile ? "auto !important" : "100%",
              boxSizing: "border-box",
              overflow: "hidden",    // ✅ KEY — makes this the scroll container boundary
              minWidth: 0,           // ✅ prevents flex child from overflowing
            }}
          >
            {activeBatch ? (
              <Card
                variant="outlined"
                sx={{
                  backgroundColor: "transparent !important",
                  boxShadow: "none",
                  border: "none",
                }}
              >
                <CardContent sx={{ p: 1, height: "100%", overflow: "hidden" }}>
                  {/* Batch Info - Enhanced with hover effect */}
                  <Box
                    sx={{
                      mb: 2,
                      p: 2,
                      backgroundColor: "white",
                      borderRadius: 1,
                      // boxShadow: 1,
                      // transition: "box-shadow 0.2s ease-in-out",
                      // "&:hover": {
                      //   boxShadow: 0.5,
                      // },
                    }}
                  >
                    <Typography variant="h6" fontWeight={600}>
                      Batch: {activeBatch.batch_no}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Quotation ID: {activeBatch.quotation_id}
                    </Typography>
                    {activeBatch.priority && (
                      <Chip
                        label={`Priority: ${activeBatch.priority}`}
                        size="small"
                        sx={{ mt: 1 }}
                        color={
                          activeBatch.priority === "High"
                            ? "error"
                            : activeBatch.priority === "Medium"
                            ? "warning"
                            : "success"
                        }
                      />
                    )}
                  </Box>

                  {/* Department Columns - Enhanced scrollbar */}
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "nowrap", // ❗ forces single row
                      gap: 2,
                      overflowX: "auto",
                      pb: 0,
                      scrollBehavior: "smooth",
                      "&::-webkit-scrollbar": {
                        height: 4,
                      },
                      "&::-webkit-scrollbar-track": {
                        backgroundColor: "rgba(0,0,0,0.05)",
                        borderRadius: 4,
                      },
                      "&::-webkit-scrollbar-thumb": {
                        backgroundColor: "rgba(0,0,0,0.2)",
                        borderRadius: 4,
                        "&:hover": {
                          backgroundColor: "rgba(0,0,0,0.3)",
                        },
                      },

                      // 📱 Responsive card layout
                      "& > div": {
                        flex: "0 0 auto",
                        width: {
                          xs: "220px", // small screens
                          sm: "240px", // tablets
                          md: "260px", // medium screens
                          lg: "280px", // desktop (your original size)
                        },
                      },
                    }}
                  >
                    {batchLoading
                      ? sortedDepartments.map((dept) => (
                          <ProductCardSkeleton
                            key={dept.id}
                            department={dept}
                          />
                        ))
                      : sortedDepartments.map((dept) => {
                          const products = batchProductsData?.[dept.id] || [];
                          return (
                            <Box
                              key={dept.id}
                              sx={{
                                backgroundColor: "white",
                                p: 2,
                                borderRadius: 1,
                                mb: 2,
                                // boxShadow: 1,
                                // transition: "0.2s",
                                // "&:hover": { boxShadow: 2 },
                              }}
                            >
                              <Chip
                                size="small"
                                label={dept.name}
                                sx={{
                                  borderRadius: 1,
                                  backgroundColor: dept.color || "grey.500",
                                  color: "#fff",
                                  mb: 1,
                                  fontWeight: 500,
                                }}
                              />

                              {products.length === 0 ? (
                                <Box
                                  sx={{
                                    p: 2,
                                    textAlign: "center",
                                    color: "text.secondary",
                                    border: "1px dashed #ddd",
                                    borderRadius: 1,
                                    mt: 1,
                                  }}
                                >
                                  <Typography variant="body2">
                                    No products
                                  </Typography>
                                </Box>
                              ) : (
                                products.map((product) => (
                                  <ProductCard
                                    key={product.id}
                                    product={product}
                                    onOpen={() =>
                                      handleOpenDetailsModal(product)
                                    }
                                    onMenuOpen={(e) =>
                                      handleOpenMenu(e, product)
                                    }
                                    menuOpen={
                                      menuOpen &&
                                      selectedProduct?.id === product.id
                                    }
                                  />
                                ))
                              )}
                            </Box>
                          );
                        })}

                    {/* Add Department Button */}
                    {/* <Box sx={{ flex: "0 0 auto" }}>
                      <Tooltip title="Add Department" arrow>
                        <IconButton
                          onClick={() => setOpenDepartmentDialog(true)}
                          sx={{
                            backgroundColor: "grey.300",
                            color: "grey.700",
                            borderRadius: 1,
                            p: 1,
                            "&:hover": {
                              backgroundColor: "grey.400",
                              transform: "scale(1.05)",
                            },
                          }}
                        >
                          <IoMdAdd size={24} />
                        </IconButton>
                      </Tooltip>
                    </Box> */}
                  </Box>
                </CardContent>
              </Card>
            ) : (
              // Empty state when no batch is selected
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  backgroundColor: "white",
                  borderRadius: 1,
                  p: 3,
                  // boxShadow: 1,
                }}
              >
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Batch Selected
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Please select a batch from the navigation menu
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Container>

      {/* Product Details Modal */}
      <ProductDetailsModal
        open={openDetailsModal}
        onClose={handleCloseDetailsModal}
        product={selectedProduct}
        onRefresh={handleRefreshBatch}
        onOpenTentative={() => setOpenTentativeDrawer(true)}
      />

      {/* Action Menu */}
      <ActionMenu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleCloseMenu}
        product={selectedProduct}
        onOpenRequestStock={handleOpenRequestStock}
        onOpenLogTime={handleOpenLogTime}
        onRefresh={handleRefreshBatch}
      />

      {/* Request Stock Drawer */}
      <RequestStockDrawer
        open={openRequestStockDrawer}
        onClose={() => setOpenRequestStockDrawer(false)}
        product={selectedProduct}
        onSuccess={handleRefreshBatch}
      />

      {/* Log Time Drawer */}
      <LogTimeDrawer
        open={openLogTimeDrawer}
        onClose={() => setOpenLogTimeDrawer(false)}
        product={selectedProduct}
        onSuccess={handleRefreshBatch}
      />

      {/* Tentative Item Drawer */}
      <TentativeItemDrawer
        open={openTentativeDrawer}
        onClose={() => setOpenTentativeDrawer(false)}
        onCloseParentModal={ ()=> handleCloseDetailsModal(false)}
        product={selectedProduct}
        onSuccess={handleRefreshBatch}
      />

      {/* Add Department Dialog */}
      <DepartmentFormDialog
        open={openDepartmentDialog}
        onClose={() => setOpenDepartmentDialog(false)}
        onSubmit={handleAddDepartment}
        initialValues={{ name: "", color: "" }}
        title="Add Department"
        submitButtonText="Submit"
      />
    </>
  );
}