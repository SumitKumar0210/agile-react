// components/RequestStockDrawer.jsx
import React, { useState, useEffect } from "react";
import {
  Drawer,
  Box,
  Typography,
  Divider,
  TextField,
  Button,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
} from "@mui/material";
import { RiDeleteBinLine } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import { fetchActiveMaterials } from "../../pages/settings/slices/materialSlice";
import {
  storeMaterialRequest,
  fetchRequestItems,
} from "../../pages/Production/slice/materialRequestSlice";
import { getSemiFunishedProductsWithQty } from "../../pages/Production/SemiFurnishProduct/semiFurnishedProductSlice";

export default function RequestStockDrawer({ open, onClose, product, onSuccess }) {
  const dispatch = useDispatch();

  const { data: materialData = [], loading: materialLoading } = useSelector(
    (state) => state.material
  );
  const { data: requestItems = [], loading: requestLoading } = useSelector(
    (state) => state.materialRequest
  );
  const { data: semiProducts = [], loading: semiProductLoading } = useSelector(
    (state) => state.semiFurnishedProduct
  );

  // ── Local state ───────────────────────────────────────────────────────────
  const [itemType, setItemType]                 = useState("material");
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedSemi, setSelectedSemi]         = useState(null);
  const [stockQty, setStockQty]                 = useState("");
  const [stockItems, setStockItems]             = useState([]);
  const [openDelete, setOpenDelete]             = useState(false);
  const [deleteIndex, setDeleteIndex]           = useState(null);
  const [hasNewItems, setHasNewItems]           = useState(false);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const handleDateFormat = (date) => {
    if (!date) return "";
    const d     = new Date(date);
    const day   = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year  = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // ── Fetch on open ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (open && product?.id) {
      dispatch(fetchActiveMaterials(product.id));
      dispatch(fetchRequestItems(product.id));
      dispatch(getSemiFunishedProductsWithQty());
    }
  }, [open, dispatch, product?.id]);

  // ── Reset on close ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      setStockItems([]);
      setSelectedMaterial(null);
      setSelectedSemi(null);
      setStockQty("");
      setHasNewItems(false);
      setItemType("material");
    }
  }, [open]);

  // ── Map API response → unified row shape ──────────────────────────────────
  // API row shape:
  //   material row  → { material_id: N, material: {...}, semi_product_id: null, semi_furnished_product: null }
  //   semi row      → { material_id: null, material: null, semi_product_id: N, semi_furnished_product: {...} }
  useEffect(() => {
    if (requestItems && requestItems.length > 0 && open) {
      const mapped = requestItems.map((item) => {
        const isSemi =
          item.semi_product_id !== null &&
          item.semi_furnished_product !== null;

        if (isSemi) {
          const sp = item.semi_furnished_product;
          if(!sp) return;
          return {
            rowId:         item.id,
            id:            item.semi_product_id,
            name:          sp.name?.trim() || "—",
            size:          "—",
            opening_stock: sp.qty ?? 0,          // available stock on the semi product
            unit_price:    sp.unit_price ?? null,
            qty:           item.qty,              // requested qty
            created_at:    item.created_at,
            isNew:         false,
            itemType:      "semi",
            po:             sp.production_order ? {
              id: sp.production_order.id,
              name: sp.production_order.name,
            } : null,
          };
        }

        // material row
        const mat = item.material;
        return {
          rowId:               item.id,
          id:                  item.material_id,
          name:                mat?.name || "—",
          size:                mat?.size || "—",
          category:            mat?.category,
          opening_stock:       mat?.opening_stock ?? 0,
          unit_of_measurement: mat?.unit_of_measurement,
          qty:                 item.qty,
          created_at:          item.created_at,
          isNew:               false,
          itemType:            "material",
        };
      });

      setStockItems(mapped);
    }
  }, [requestItems, open]);

  // ── Add item ──────────────────────────────────────────────────────────────
  const handleAddItem = () => {
    if (!stockQty || Number(stockQty) <= 0) return;

    const today = new Date()
      .toISOString()
      .slice(0, 10)
      .split("-")
      .reverse()
      .join("-");

    if (itemType === "material") {
      if (!selectedMaterial) return;

      const exists = stockItems.find(
        (item) =>
          item.id === selectedMaterial.id &&
          item.isNew &&
          item.itemType === "material"
      );

      if (exists) {
        setStockItems((prev) =>
          prev.map((item) =>
            item.id === selectedMaterial.id &&
            item.isNew &&
            item.itemType === "material"
              ? { ...item, qty: Number(item.qty) + Number(stockQty) }
              : item
          )
        );
      } else {
        setStockItems((prev) => [
          ...prev,
          {
            id:                  selectedMaterial.id,
            name:                selectedMaterial.name,
            size:                selectedMaterial.size || "—",
            category:            selectedMaterial.category,
            opening_stock:       selectedMaterial.opening_stock ?? 0,
            unit_of_measurement: selectedMaterial.unit_of_measurement,
            qty:                 Number(stockQty),
            isNew:               true,
            itemType:            "material",
            addedDate:           today,
          },
        ]);
      }
      setSelectedMaterial(null);

    } else {
      if (!selectedSemi) return;

      const exists = stockItems.find(
        (item) =>
          item.id === selectedSemi.id &&
          item.isNew &&
          item.itemType === "semi"
      );

      if (exists) {
        setStockItems((prev) =>
          prev.map((item) =>
            item.id === selectedSemi.id &&
            item.isNew &&
            item.itemType === "semi"
              ? { ...item, qty: Number(item.qty) + Number(stockQty) }
              : item
          )
        );
      } else {
        setStockItems((prev) => [
          ...prev,
          {
            id:            selectedSemi.id,
            name:          selectedSemi.name?.trim(),
            size:          "—",
            opening_stock: selectedSemi.qty ?? 0,
            unit_price:    selectedSemi.unit_price,
            qty:           Number(stockQty),
            isNew:         true,
            itemType:      "semi",
            addedDate:     today,
          },
        ]);
      }
      setSelectedSemi(null);
    }

    setStockQty("");
    setHasNewItems(true);
  };

  // ── Delete item ───────────────────────────────────────────────────────────
  const handleDeleteStockItem = (index) => {
    const updated = stockItems.filter((_, i) => i !== index);
    setStockItems(updated);
    setOpenDelete(false);
    setDeleteIndex(null);
    setHasNewItems(updated.some((item) => item.isNew));
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleRequestStock = async () => {
    if (!hasNewItems || !product) return;

    const formData = new FormData();
    formData.append("pp_id", product.id);

    // Only new rows go to the API — existing rows were already saved
    stockItems
      .filter((item) => item.isNew)
      .forEach((item) => {
        if (item.itemType === "material") {
          formData.append("material_id[]",     item.id);
          formData.append("semi_product_id[]", "");
        } else {
          formData.append("material_id[]",     "");
          formData.append("semi_product_id[]", item.id);
        }
        formData.append("qty[]", item.qty);
      });

    const res = await dispatch(storeMaterialRequest(formData));
    if (res.error) return;

    // Mark all rows as saved so button disables again
    setStockItems((prev) => prev.map((item) => ({ ...item, isNew: false })));
    setHasNewItems(false);

    if (product?.id) {
      dispatch(fetchRequestItems(product.id));
    }

    onSuccess();
  };

  const formatBatchNo = (batchNo) => {
  if (!batchNo) return "—";
  return batchNo.replace(/^PO/i, "item");
};

  // ── Derived ───────────────────────────────────────────────────────────────
  const isLoading       = materialLoading || semiProductLoading;
  const currentSelected = itemType === "material" ? selectedMaterial : selectedSemi;
  const canAdd          = !!currentSelected && !!stockQty && Number(stockQty) > 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Drawer anchor="right" open={open} onClose={onClose} sx={{ zIndex: 9999 }}>
        <Box sx={{ width: 520, p: 2, display: "flex", flexDirection: "column", height: "100%" }}>

          {/* Header */}
          <Typography variant="h6" fontWeight={500} fontSize="18px" mb="6px">
            Request Stock
          </Typography>
          <Divider />

          {/* Product info */}
          <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1">{product?.item_name}</Typography>
            <Typography variant="subtitle1">{product?.group?.trim()}</Typography>
          </Box>

          {/* Toggle: Material | Semi-Finished */}
          <Box mt={2} mb={1}>
            <ToggleButtonGroup
              value={itemType}
              exclusive
              onChange={(_, val) => {
                if (!val) return;
                setItemType(val);
                setSelectedMaterial(null);
                setSelectedSemi(null);
                setStockQty("");
              }}
              size="small"
              sx={{
                "& .MuiToggleButton-root": { textTransform: "none", px: 2, fontSize: 13 },
              }}
            >
              <ToggleButton value="material">Material</ToggleButton>
              <ToggleButton value="semi">Semi-Finished Product</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Input row */}
          <Box display="flex" alignItems="center" gap={1} py={1}>
            {isLoading ? (
              <>
                <Skeleton variant="rounded" width={300} height={40} />
                <Skeleton variant="rounded" width={60}  height={40} />
                <Skeleton variant="rounded" width={70}  height={40} />
              </>
            ) : itemType === "material" ? (
              <>
                <Autocomplete
                  disablePortal
                  options={materialData}
                  value={selectedMaterial}
                  getOptionLabel={(opt) =>
                    opt?.name ? `${opt.name} (${opt.category?.name ?? ""})` : ""
                  }
                  onChange={(_, val) => setSelectedMaterial(val)}
                  renderOption={(props, option) => {
                    const { key, ...rest } = props;
                    return (
                      <li key={key} {...rest}>
                        <Box>
                          <Typography fontWeight={600}>{option.name}</Typography>
                          <Typography variant="caption" display="block">
                            Group: {option.group?.name || "—"}
                          </Typography>
                          <Typography variant="caption">
                            Size: {option.size} • UOM: {option.unit_of_measurement?.name ?? "—"}
                          </Typography>
                        </Box>
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Item Code" placeholder="Search material" size="small" />
                  )}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Qty" size="small" type="number"
                  value={stockQty} onChange={(e) => setStockQty(e.target.value)}
                  sx={{ width: 80 }}
                />
                <Button variant="contained" onClick={handleAddItem} disabled={!canAdd}>
                  Add
                </Button>
              </>
            ) : (
              <>
                <Autocomplete
                  disablePortal
                  options={semiProducts}
                  value={selectedSemi}
                  getOptionLabel={(opt) => opt?.name?.trim() || ""}
                  onChange={(_, val) => setSelectedSemi(val)}
                  renderOption={(props, option) => {
                    const { key, ...rest } = props;
                    return (
                      <li key={key} {...rest}>
                        <Box>
                          <Typography fontWeight={600}>{option.name?.trim()}</Typography>
                          <Typography variant="caption">
                            Stock: {option.qty ?? "—"} • Rate: ₹{option.unit_price ?? "—"} • Item: {formatBatchNo(option.production_order?.batch_no)}
                          </Typography>
                        </Box>
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Semi-Finished Product"
                      placeholder="Search product"
                      size="small"
                    />
                  )}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Qty" size="small" type="number"
                  value={stockQty} onChange={(e) => setStockQty(e.target.value)}
                  sx={{ width: 80 }}
                />
                <Button variant="contained" onClick={handleAddItem} disabled={!canAdd}>
                  Add
                </Button>
              </>
            )}
          </Box>

          {/* Combined table */}
          <TableContainer sx={{ mt: 2, flex: 1, overflowY: "auto" }}>
            {materialLoading || requestLoading ? (
              <>
                <Skeleton variant="rectangular" height={50} sx={{ mb: 1 }} />
                <Skeleton variant="rectangular" height={50} sx={{ mb: 1 }} />
              </>
            ) : (
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Stock&nbsp;/&nbsp;Req</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="center">Del</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stockItems.length > 0 ? (
                    stockItems.map((item, index) => (
                      <TableRow
                        key={`${item.itemType}-${item.id}-${index}`}
                        sx={{ backgroundColor: item.isNew ? "action.hover" : "inherit" }}
                      >
                        {/* Name */}
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {item.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.itemType === "semi"
                              ? item.unit_price ? `₹${item.unit_price}` : "—"
                              : item.size || item.category?.name || "—"}
                          </Typography>
                        </TableCell>

                        {/* Type chip */}
                        <TableCell>
                          <Chip
                            label={item.itemType === "semi" ? "Semi" : "Material"}
                            size="small"
                            color={item.itemType === "semi" ? "secondary" : "default"}
                            sx={{ fontSize: 11, height: 20 }}
                          />
                        </TableCell>

                        {/* Stock / Requested */}
                        <TableCell>
                          <Typography variant="body2">{item.opening_stock ?? 0}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Req: {item.qty}
                          </Typography>
                        </TableCell>

                        {/* Date */}
                        <TableCell>
                          <Typography variant="caption">
                            {item.isNew ? item.addedDate : handleDateFormat(item.created_at)}
                          </Typography>
                        </TableCell>

                        {/* Delete — new rows only */}
                        <TableCell align="center">
                          {item.isNew && (
                            <Tooltip title="Remove" arrow>
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => {
                                  setDeleteIndex(index);
                                  setOpenDelete(true);
                                }}
                              >
                                <RiDeleteBinLine size={15} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="text.secondary" py={2}>
                          No items added yet
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </TableContainer>

          {/* Footer */}
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button variant="contained" onClick={handleRequestStock} disabled={!hasNewItems}>
              Request
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Delete confirmation */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)} sx={{ zIndex: 999999 }}>
        <DialogTitle>Remove item?</DialogTitle>
        <DialogContent style={{ width: "300px" }}>
          <DialogContentText>This item will be removed from the request list.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button
            onClick={() => handleDeleteStockItem(deleteIndex)}
            variant="contained"
            color="error"
            autoFocus
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}