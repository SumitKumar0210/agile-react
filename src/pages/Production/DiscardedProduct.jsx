import * as React from "react";
import { useMemo, useRef, useState, useEffect } from "react";
import {
  Typography,
  Grid,
  Paper,
  Box,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  TextField,
  Pagination,
  InputAdornment,
  useMediaQuery,
  useTheme,
  Chip,
  Avatar,
  Skeleton,
  Button,
} from "@mui/material";
import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
  MRT_GlobalFilterTextField,
} from "material-react-table";
import SearchIcon from "@mui/icons-material/Search";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
import { MdOutlineQrCode2, MdStraighten } from "react-icons/md";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useDispatch, useSelector } from "react-redux";
import { getDiscardedData } from "../settings/slices/productSlice";
import ImagePreviewDialog from "../../components/ImagePreviewDialog/ImagePreviewDialog";
import Profile from "../../assets/images/profile.jpg";
import { format } from "date-fns";

const DiscardedProduct = () => {
  const mediaUrl = import.meta.env.VITE_MEDIA_URL;
  const dispatch = useDispatch();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const {
    discardedData = [],
    discardedLoading = false,
    discardedTotal = 0,
    discardedCurrentPage = 1,
    discardedPerPage = 10,
    discardedLastPage = 1,
  } = useSelector((state) => state.product);

  const tableContainerRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [expandedCards, setExpandedCards] = useState({});

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch data on mount and when filters change
  useEffect(() => {
    dispatch(
      getDiscardedData({
        page: pagination.pageIndex + 1,
        perPage: pagination.pageSize,
        search: debouncedSearch,
      })
    );
  }, [dispatch, pagination.pageIndex, pagination.pageSize, debouncedSearch]);

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 })); // Reset to first page
  };

  const handlePageChange = (event, newPage) => {
    setPagination((prev) => ({ ...prev, pageIndex: newPage - 1 }));
  };

  const toggleCardExpanded = (id) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const columns = useMemo(() => {
    const baseColumns = [
      {
        accessorKey: "product.image",
        header: "Image",
        size: 80,
        Cell: ({ row }) => (
          <ImagePreviewDialog
            imageUrl={
              row.original.product?.image
                ? mediaUrl + row.original.product.image
                : Profile
            }
            alt={row.original.product?.name || "Product"}
          />
        ),
      },
      {
        accessorKey: "product_name",
        header: "Product Name",
        size: 180,
        Cell: ({ row }) => (
          <Typography variant="body2" fontWeight={500}>
            {row.original.product?.name || "N/A"}
          </Typography>
        ),
      },
      {
        accessorKey: "product_model",
        header: "Model",
        size: 120,
        Cell: ({ row }) => row.original.product?.model || "N/A",
      },
      {
        accessorKey: "qty",
        header: "Quantity",
        size: 100,
      },
      {
        accessorKey: "remark",
        header: "Remark",
        size: 200,
        Cell: ({ row }) => (
          <Typography
            variant="body2"
            sx={{
              maxWidth: 200,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={row.original.remark}
          >
            {row.original.remark || "No remark"}
          </Typography>
        ),
      },
      {
        accessorKey: "date",
        header: "Date",
        size: 120,
        Cell: ({ row }) =>
          row.original.date
            ? format(new Date(row.original.date), "dd MMM yyyy")
            : "N/A",
      },
      {
        accessorKey: "user_name",
        header: "Action By",
        size: 180,
        Cell: ({ row }) => (
          <Typography variant="body2" fontWeight={500}>
            {row.original.user?.name || "N/A"}
          </Typography>
        ),
      },
    ];

    return baseColumns;
  }, [mediaUrl]);

  // Download CSV
  const downloadCSV = () => {
    const headers = ["Product Name", "Model", "Quantity", "Remark", "Date", "Action By"];
    const rows = discardedData.map((row) => [
      row.product?.name || "N/A",
      row.product?.model || "N/A",
      row.qty,
      row.remark || "No remark",
      row.date ? format(new Date(row.date), "dd MMM yyyy") : "N/A",
      row.user?.name || "N/A",
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Discarded_Products_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print handler
  const handlePrint = () => {
    if (!tableContainerRef.current) return;
    const printWindow = window.open("", "", "height=600,width=1200");
    if (!printWindow) {
      alert("Failed to open print window. Please check popup blocker.");
      return;
    }
    printWindow.document.write(tableContainerRef.current.innerHTML);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Grid item xs={12}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" className="page-title">
              Discarded Products
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {isMobile ? (
        // MOBILE VIEW
        <Box sx={{ minHeight: "100vh" }}>
          {/* Mobile Search - Always Visible */}
          <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search discarded products..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
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
          {discardedLoading && (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i} sx={{ mb: 2, boxShadow: 2 }}>
                  <Skeleton variant="rectangular" height={120} />
                  <CardContent>
                    <Skeleton variant="text" height={30} />
                    <Skeleton variant="text" height={20} />
                  </CardContent>
                </Card>
              ))}
            </>
          )}

          {/* Mobile Cards */}
          {!discardedLoading &&
            discardedData.map((item) => {
              const isExpanded = expandedCards[item.id] || false;
              const remarkText = item.remark || "No remark";
              const shouldShowReadMore = remarkText.length > 100;

              return (
                <Card
                  key={item.id}
                  sx={{ mb: 2, boxShadow: 2, overflow: "hidden", borderRadius: 2 }}
                >
                  {/* Header */}
                  <Box
                    sx={{
                      background: "linear-gradient(135deg, #ef5350 0%, #d32f2f 100%)",
                      p: 1.5,
                      color: "white",
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {item.product?.name || "Unknown Product"}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 0.5, mt: 0.5, flexWrap: "wrap" }}>
                          <Chip
                            label={`Qty: ${item.qty}`}
                            size="small"
                            sx={{
                              bgcolor: "white",
                              color: "error.main",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                            }}
                          />
                          {item.revised !== undefined && (
                            <Chip
                              label={item.revised === 1 ? "Revised" : "Pending"}
                              size="small"
                              sx={{
                                bgcolor: item.revised === 1 ? "#4caf50" : "#ffa726",
                                color: "white",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                      <Avatar
                        src={
                          item.product?.image
                            ? mediaUrl + item.product.image
                            : Profile
                        }
                        alt={item.product?.name}
                        sx={{ width: 56, height: 56, border: "2px solid white" }}
                      />
                    </Box>
                  </Box>

                  {/* Body */}
                  <CardContent sx={{ px: 1.5, pb: 1.5 }}>
                    <Box>
                      {/* Model */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mb: 0.8 }}>
                        <MdOutlineQrCode2 size={16} color="#666" />
                        <Typography variant="body2" fontWeight={500} color="text.secondary">
                          Model:
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {item.product?.model || "N/A"}
                        </Typography>
                      </Box>

                      {/* Date */}
                      <Box sx={{ mb: 0.8 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                          Date:
                        </Typography>
                        <Typography variant="body2" component="span" sx={{ ml: 0.5 }}>
                          {item.date ? format(new Date(item.date), "dd MMM yyyy, hh:mm a") : "N/A"}
                        </Typography>
                      </Box>

                      {/* Action By */}
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                          Action By:
                        </Typography>
                        <Typography variant="body2" component="span" sx={{ ml: 0.5 }} fontWeight={500}>
                          {item.user?.name || "N/A"}
                        </Typography>
                      </Box>

                      {/* Remark with Read More/Less */}
                      {item.remark && (
                        <Box
                          sx={{
                            bgcolor: "#fff3e0",
                            p: 1.5,
                            borderRadius: 1,
                            border: "1px solid #ffe0b2",
                            mt: 1,
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            Remark:
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              mt: 0.5,
                              color: "text.primary",
                              fontStyle: "italic",
                              wordWrap: "break-word",
                            }}
                          >
                            {shouldShowReadMore && !isExpanded
                              ? `${remarkText.substring(0, 100)}...`
                              : remarkText}
                          </Typography>
                          {shouldShowReadMore && (
                            <Button
                              size="small"
                              onClick={() => toggleCardExpanded(item.id)}
                              endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                              sx={{ mt: 0.5, p: 0, minWidth: "auto", textTransform: "none" }}
                            >
                              {isExpanded ? "Read Less" : "Read More"}
                            </Button>
                          )}
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              );
            })}

          {/* Empty State */}
          {!discardedLoading && discardedData.length === 0 && (
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="h6" color="text.secondary">
                No discarded products found
              </Typography>
            </Paper>
          )}

          {/* Mobile Pagination */}
          {!discardedLoading && discardedTotal > 0 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Pagination
                count={discardedLastPage}
                page={pagination.pageIndex + 1}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </Box>
      ) : (
        // DESKTOP VIEW
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              width: "100%",
              overflowX: "auto",
              backgroundColor: "#fff",
              px: 3,
            }}
            ref={tableContainerRef}
          >
            <MaterialReactTable
              columns={columns}
              data={discardedData}
              enableTopToolbar
              enableColumnFilters={false}
              enableSorting={false}
              enablePagination
              enableBottomToolbar
              enableGlobalFilter
              enableDensityToggle={false}
              enableColumnActions={false}
              manualPagination
              manualFiltering
              rowCount={discardedTotal}
              state={{
                isLoading: discardedLoading,
                pagination: {
                  pageIndex: pagination.pageIndex,
                  pageSize: pagination.pageSize,
                },
                globalFilter: searchQuery,
              }}
              onPaginationChange={setPagination}
              onGlobalFilterChange={handleSearchChange}
              initialState={{ density: "compact" }}
              muiTableContainerProps={{
                sx: { backgroundColor: "#fff", minWidth: "1200px" },
              }}
              muiTablePaperProps={{
                sx: { backgroundColor: "#fff", boxShadow: "none" },
              }}
              muiTableBodyRowProps={() => ({
                hover: true,
              })}
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
                    Discarded Products
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
    </>
  );
};

export default DiscardedProduct;