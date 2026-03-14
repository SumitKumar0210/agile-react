// components/TentativeItemDrawer.jsx
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
  CircularProgress,
} from "@mui/material";
import { RiDeleteBinLine } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import { fetchActiveMaterials } from "../../pages/settings/slices/materialSlice";
import { storeTentativeItems } from "../../pages/Production/slice/tentativeItemSlice";
import { successMessage, errorMessage } from "../../toast";

export default function TentativeItemDrawer({
  open,
  onClose,
  product,
  onSuccess,
  onCloseParentModal,
}) {
  const dispatch = useDispatch();
  const { data: materialData = [], loading: materialLoading } = useSelector(
    (state) => state.material
  );

  const [selectedTentativeItem, setSelectedTentativeItem] = useState(null);
  const [tentativeQty, setTentativeQty] = useState("");
  const [tentativeItems, setTentativeItems] = useState([]);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (open) {
      dispatch(fetchActiveMaterials());
    }
  }, [open, dispatch]);

  useEffect(() => {
    if (open && product) {
      setTentativeItems(product.tentative_items || []);
      setHasChanges(false);
    }
  }, [open, product]);

  useEffect(() => {
    if (!open) {
      setSelectedTentativeItem(null);
      setTentativeQty("");
      setIsUpdating(false);
      setHasChanges(false);
    }
  }, [open]);

  const handleUpdateTentative = async () => {
    if (!tentativeItems.length) {
      errorMessage("No tentative items available.");
      return;
    }

    setIsUpdating(true);

    try {
      const formData = new FormData();
      formData.append("pp_id", product.id);

      tentativeItems.forEach((item) => {
        formData.append("material_id[]", item.material_id);
        formData.append("qty[]", item.qty);
      });

      const res = await dispatch(storeTentativeItems(formData)).unwrap();

      console.log("Response from API:", res);

      successMessage("Tentative items updated successfully");

      // ✅ Close both drawers and parent modal
      onClose();
      setHasChanges(false);
      onSuccess();

      // ✅ Close parent modal if callback provided
      if (onCloseParentModal) {
        onCloseParentModal();
      }
    } catch (error) {
      console.error("Update failed:", error);
      errorMessage(error || "Something went wrong while updating!");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddTentativeItem = () => {
    if (!selectedTentativeItem || !tentativeQty || tentativeQty <= 0) return;

    const selectedId = Number(selectedTentativeItem.id);
    let updatedItems;

    const exists = tentativeItems.find(
      (item) => Number(item.material_id) === selectedId 
    );

    if (exists) {
      updatedItems = tentativeItems.map((item) =>
        Number(item.material_id) === selectedId
          ? { ...item, qty: Number(item.qty) + Number(tentativeQty) }
          : item
      );
    } else {
      updatedItems = [
        ...tentativeItems,
        {
          material_id: selectedId, // store ID as number to avoid future issues
          material: selectedTentativeItem,
          qty: Number(tentativeQty),
        },
      ];
    }

    setTentativeItems(updatedItems);
    setSelectedTentativeItem(null);
    setTentativeQty("");
    setHasChanges(true);
  };


  const handleDeleteTentativeItem = (index) => {
    const updatedItems = tentativeItems.filter((_, i) => i !== index);
    setTentativeItems(updatedItems);
    setOpenDelete(false);
    setDeleteIndex(null);
    setHasChanges(true);
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={isUpdating ? undefined : onClose}
        sx={{ zIndex: 9999 }}
      >
        <Box sx={{ width: 450, p: 2 }}>
          <Typography
            variant="h6"
            fontWeight={500}
            fontSize="18px"
            marginBottom="6px"
          >
            BOM Items
          </Typography>
          <Divider />

          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            paddingTop="15px"
            paddingBottom="10px"
            gap="10px"
          >
            {materialLoading ? (
              <>
                <Skeleton variant="rounded" width={250} height={40} />
                <Skeleton variant="rounded" width={80} height={40} />
                <Skeleton variant="rounded" width={70} height={40} />
              </>
            ) : (
              <>
                <Autocomplete
                  disablePortal
                  options={materialData}
                  value={selectedTentativeItem}
                  getOptionLabel={(option) =>
                    option?.name
                      ? `${option.name} (${option.category?.name ?? ""})`
                      : ""
                  }
                  onChange={(e, val) => setSelectedTentativeItem(val)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Raw Material"
                      placeholder="Search Raw Material"
                      size="small"
                    />
                  )}
                  sx={{ width: 250 }}
                  disabled={isUpdating}
                />
                <TextField
                  label="Qty"
                  variant="outlined"
                  size="small"
                  type="number"
                  value={tentativeQty}
                  onChange={(e) => setTentativeQty(e.target.value)}
                  sx={{ width: 80 }}
                  disabled={isUpdating}
                />
                <Button
                  variant="contained"
                  sx={{ mt: 0 }}
                  onClick={handleAddTentativeItem}
                  disabled={
                    !selectedTentativeItem ||
                    !tentativeQty ||
                    tentativeQty <= 0 ||
                    isUpdating
                  }
                >
                  Add
                </Button>
              </>
            )}
          </Box>

          <TableContainer sx={{ mt: 4 }}>
            {materialLoading ? (
              <>
                <Skeleton variant="rectangular" height={50} sx={{ mb: 1 }} />
                <Skeleton variant="rectangular" height={50} sx={{ mb: 1 }} />
              </>
            ) : (
              <Table sx={{ minWidth: "100%" }} size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Raw Material</TableCell>
                    <TableCell>Qty</TableCell>
                    <TableCell sx={{ textAlign: "right" }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tentativeItems.length > 0 ? (
                    tentativeItems.map((item, index) => {
                      const material =
                        item.material ||
                        materialData.find((m) => m.id === item.material_id);
                      return (
                        <TableRow key={index}>
                          <TableCell>{material?.name || "Unknown"}</TableCell>
                          <TableCell>{item.qty}</TableCell>
                          <TableCell sx={{ textAlign: "right" }}>
                            <Tooltip title="Delete" arrow>
                              <IconButton
                                aria-label="delete"
                                color="error"
                                onClick={() => {
                                  setDeleteIndex(index);
                                  setOpenDelete(true);
                                }}
                                disabled={isUpdating}
                              >
                                <RiDeleteBinLine size={16} />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No tentative items added
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </TableContainer>

          <Box mt={2} sx={{ display: "flex", justifyContent: "end", gap: 1 }}>
            <Button variant="outlined" onClick={onClose} disabled={isUpdating}>
              Close
            </Button>
            <Button
              variant="contained"
              onClick={handleUpdateTentative}
              disabled={!hasChanges || isUpdating}
              startIcon={
                isUpdating ? (
                  <CircularProgress size={20} color="inherit" />
                ) : null
              }
            >
              {isUpdating ? "Updating..." : "Update"}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        sx={{ zIndex: 999999 }}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent style={{ width: "300px" }}>
          <DialogContentText>
            Are you sure you want to delete this item? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)} disabled={isUpdating}>
            Cancel
          </Button>
          <Button
            onClick={() => handleDeleteTentativeItem(deleteIndex)}
            variant="contained"
            color="error"
            autoFocus
            disabled={isUpdating}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}