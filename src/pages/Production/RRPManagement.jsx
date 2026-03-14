import * as React from "react";
import { useMemo, useRef, useState, useEffect } from "react";
import {
  Typography,
  Grid,
  Paper,
  Box,
  IconButton,
  Tooltip,
  Chip,
} from "@mui/material";
import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
  MRT_GlobalFilterTextField,
} from "material-react-table";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
import { MdCalculate, MdReceiptLong  } from "react-icons/md";

import { useDispatch, useSelector } from "react-redux";
import { updateProductRRP } from "../settings/slices/productSlice";
import { fetchReadyProduct } from "./slice/readyProductSlice";
import RRPDialog from "../../components/Rrpdialog/Rrpdialog";
import { useNavigate } from "react-router-dom";

const RRPManagement = () => {
  const dispatch = useDispatch();
  const { data: rawData = [], loading } = useSelector((state) => state.readyProduct);
  const navigate = useNavigate();

  const tableContainerRef = useRef(null);
  const [openRRPDialog, setOpenRRPDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    dispatch(fetchReadyProduct());
  }, [dispatch]);

  // Flatten the nested data structure
  const data = useMemo(() => {
    if (!rawData || !Array.isArray(rawData)) return [];

    const flattenedData = [];
    rawData.forEach((order) => {
      if (order.products && Array.isArray(order.products)) {
        order.products.forEach((product) => {
          flattenedData.push({
            ...product,
            batch_no: order.batch_no,
            customer_name: order.customer?.name || "",
            customer: order.customer,
            order_id: order.id,
            name: product.item_name,
            model: product.modal_no || "-",
            gross_profit: product.rrp?.gross_profit || "-",
            miscellaneous_cost: product.rrp?.miscellaneous || "-",
            material_cost: product.rrp?.material_cost || "-",
            labour_cost: product.rrp?.labour_cost || "-",
            product_type: product.group?.trim() || "-",
          });
        });
      }
    });

    return flattenedData;
  }, [rawData]);

  const handleOpenRRPDialog = (product) => {
   
    setSelectedProduct(product);
    setOpenRRPDialog(true);
  };

  const handleCloseRRPDialog = () => {
    setOpenRRPDialog(false);
    setSelectedProduct(null);
  };

  const handleSaveRRP = async (rrpData) => {
    try {
      console.log(rrpData);
      await dispatch(updateProductRRP(rrpData));
      dispatch(fetchReadyProduct());
    } catch (error) {
      console.error("Error updating RRP:", error);
    }
  };

  const columns = useMemo(() => [
    {
      accessorKey: "batch_no",
      header: "Order No",
      size: 120,
    },
    {
      accessorKey: "customer_name",
      header: "Customer Name",
      size: 150,
    },
    {
      accessorKey: "name",
      header: "Product Name",
      size: 180
    },
    {
      accessorKey: "size",
      header: "Size",
      size: 100
    },
    {
      accessorKey: "labour_cost",
      header: "Labour Cost",
      size: 100,
      Cell: ({ cell }) => `₹${cell.getValue()}`,
    },
    {
      accessorKey: "material_cost",
      header: "Material Cost",
      size: 100,
      Cell: ({ cell }) => `₹${cell.getValue()}`,
    },
    {
      accessorKey: "miscellaneous_cost",
      header: "MSC",
      size: 100,
      Cell: ({ cell }) => `₹${cell.getValue()}`,
    },
    {
      accessorKey: "gross_profit",
      header: "Qross Profit",
      size: 100,
      Cell: ({ cell }) => `${cell.getValue()}%`,
    },
    {
      accessorKey: "rrp_price",
      header: "RRP",
      size: 130,
      Cell: ({ row }) => {
        const rrpPrice = row.original.rrp_price;

        if (!rrpPrice || rrpPrice === 0 || rrpPrice === null || rrpPrice === "null") {
          return (
            <Chip
              label="Pending"
              color="warning"
              size="small"
              variant="outlined"
            />
          );
        }

        return (
          <Typography variant="body2" fontWeight={600} color="primary">
            ₹{parseFloat(rrpPrice).toFixed(2)}
          </Typography>
        );
      },
    },
    {
      accessorKey: "actions",
      header: "Actions",
      size: 100,
      enableSorting: false,
      enableColumnFilter: false,
      Cell: ({ row }) => (
        <>
        <Tooltip title="Calculate/Update RRP">
          <IconButton
            color="primary"
            size="small"
            onClick={() => handleOpenRRPDialog(row.original)}
          >
            <MdCalculate size={20} />
          </IconButton>
        </Tooltip>
        <Tooltip title="RRP Cost Sheet">
          <IconButton
            color="primary"
            size="small"
            onClick={() => navigate(`/production/cost-sheet/${row.original.id}`)}
          >
            <MdReceiptLong  size={20} />
          </IconButton>
        </Tooltip>
        </>
      ),
    },
  ], []);

  const downloadCSV = () => {
    const headers = [
      "Order No",
      "Customer Name",
      "Product Name",
      "Size",
      "Quantity",
      "RRP",
    ];

    const rows = data.map((row) => [
      `"${row.batch_no ?? ""}"`,
      `"${row.customer_name ?? ""}"`,
      `"${row.name ?? ""}"`,
      `"${row.size ?? ""}"`,
      `"${row.qty ?? ""}"`,
      `"${row.rrp_price && row.rrp_price !== 0 && row.rrp_price !== "null" ? parseFloat(row.rrp_price).toFixed(2) : "Pending"}"`,
    ].join(","));

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "RRP_Management_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      <Grid container spacing={2}>
        <Grid size={12}>
          <Paper
            elevation={0}
            sx={{ width: "100%", overflowX: "auto", backgroundColor: "#fff", px: 3 }}
            ref={tableContainerRef}
          >
            <MaterialReactTable
              columns={columns}
              data={data}
              enableTopToolbar
              enableColumnFilters
              enableSorting
              enablePagination
              enableBottomToolbar
              enableGlobalFilter
              enableDensityToggle={false}
              enableColumnActions={false}
              enableColumnVisibilityToggle={false}
              initialState={{ density: "compact" }}
              state={{ isLoading: loading }}
              muiTableContainerProps={{
                sx: {
                  width: "100%",
                  backgroundColor: "#fff",
                  overflowX: "auto",
                },
              }}
              muiTableBodyCellProps={{
                sx: { whiteSpace: "wrap" },
              }}
              muiTablePaperProps={{
                sx: { backgroundColor: "#fff", boxShadow: "none" },
              }}
              muiTableBodyRowProps={() => ({
                hover: false,
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
                  <Typography variant="h6" className="page-title">
                    RRP Management
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
                  </Box>
                </Box>
              )}
            />
          </Paper>
        </Grid>
      </Grid>

      <RRPDialog
        open={openRRPDialog}
        onClose={handleCloseRRPDialog}
        productData={selectedProduct}
        onSave={handleSaveRRP}
      />
    </>
  );
};

export default RRPManagement;