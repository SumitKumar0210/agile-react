import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Button,
  Typography,
  Card,
  Tooltip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CardContent,
  Stack,
  Box,
  TextField,
  CircularProgress,
  Backdrop,
  Chip,
} from "@mui/material";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { RiDeleteBinLine } from "react-icons/ri";
import { Autocomplete } from "@mui/material";
import { fetchActiveMaterials } from "../settings/slices/materialSlice";
import { useDispatch, useSelector } from "react-redux";
import { storeMaterial } from "./slice/ccsMaterialSlice";
import { useNavigate } from "react-router-dom";

// ─── Dummy Material Data ───────────────────────────────────────────────────────
const DUMMY_MATERIALS = [
  { id: 1, name: "PU FOAM FF SSF-HD 30 DENSITY 25mm", uom: "SHEET", size: "1829X889X25MM" },
  { id: 2, name: "PU FOAM FF SSF-HD 40 DENSITY 50mm", uom: "SHEET", size: "1829X889X50MM" },
  { id: 3, name: "REBOND FOAM 130 DENSITY 10mm",       uom: "SHEET", size: "2000X1000X10MM" },
  { id: 4, name: "MEMORY FOAM TOPPER 60 DENSITY 30mm", uom: "SHEET", size: "1829X889X30MM" },
  { id: 5, name: "COIR FIBRE SHEET 80mm",              uom: "SHEET", size: "1829X914X80MM" },
  { id: 6, name: "LATEX FOAM NATURAL 60 DENSITY 20mm", uom: "SHEET", size: "2000X1000X20MM" },
  { id: 7, name: "SPRING UNIT BONNELL 13.5 GAUGE",     uom: "PCS",   size: "1829X914MM" },
  { id: 8, name: "SPRING UNIT POCKET COIL 12 GAUGE",   uom: "PCS",   size: "1829X914MM" },
  { id: 9, name: "FELT FABRIC 600GSM",                 uom: "MTR",   size: "1.8M WIDTH" },
  { id: 10, name: "TICKING FABRIC DAMASK 150GSM",      uom: "MTR",   size: "2.4M WIDTH" },
];

// ─── Component ─────────────────────────────────────────────────────────────────
const CCSMaterial = () => {
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [qtyInput, setQtyInput] = useState("");
  const [tableItems, setTableItems] = useState([]);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteRowId, setDeleteRowId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {data,error, loading } = useSelector( (state) => state.material);

  useEffect( () => {
    dispatch(fetchActiveMaterials());
  },[]);


  // ── Add material to table ──────────────────────────────────────────────────
  const handleAdd = () => {
    if (!selectedMaterial) {
      alert("Please select a material.");
      return;
    }
    const qty = parseInt(qtyInput, 10);
    if (!qty || qty <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }

    // If material already in table, just increment qty
    const exists = tableItems.find((item) => item.materialId === selectedMaterial.id);
    if (exists) {
      setTableItems((prev) =>
        prev.map((item) =>
          item.materialId === selectedMaterial.id
            ? { ...item, qty: item.qty + qty }
            : item
        )
      );
    } else {
      setTableItems((prev) => [
        ...prev,
        {
          rowId: Date.now(),
          materialId: selectedMaterial.id,
          name: selectedMaterial.name,
          uom:  selectedMaterial.unit_of_measurement?.name,
          size: selectedMaterial.size,
          qty,
        },
      ]);
    }

    // Reset inputs
    setSelectedMaterial(null);
    setQtyInput("");
  };

  // ── Inline qty edit ────────────────────────────────────────────────────────
  const handleQtyChange = (rowId, value) => {
    const qty = parseInt(value, 10);
    setTableItems((prev) =>
      prev.map((item) =>
        item.rowId === rowId ? { ...item, qty: isNaN(qty) || qty < 1 ? 1 : qty } : item
      )
    );
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDeleteItem = (rowId) => {
    setDeleteRowId(rowId);
    setOpenDelete(true);
  };

  const confirmDelete = () => {
    setTableItems((prev) => prev.filter((item) => item.rowId !== deleteRowId));
    setOpenDelete(false);
    setDeleteRowId(null);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (tableItems.length === 0) {
      alert("Please add at least one material before submitting.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      materials: tableItems.map(({ rowId, ...rest }) => rest),
    };

    try {
      // ── Replace with your real API call, e.g.: ──────────────────────────
      const res = await dispatch(storeMaterial(payload)).unwrap();
      if(res.error){
        return;
      }
      navigate(`/ccs/${res.data.id}/vendor`);
      // ────────────────────────────────────────────────────────────────────

      // Simulated network delay
      await new Promise((resolve) => setTimeout(resolve, 1200));

      console.log("Submitted payload:", payload);
      setSubmitted(true);
      setTableItems([]);
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Full-screen loader */}
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isSubmitting}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress color="inherit" />
          <Typography sx={{ mt: 2 }}>Submitting materials…</Typography>
        </Box>
      </Backdrop>

      {/* Page title */}
      <Grid container spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Grid>
          <Typography variant="h6">CCS Material</Typography>
        </Grid>
      </Grid>

      {/* Success banner */}
      {/* {submitted && (
        <Box
          sx={{
            mb: 2,
            px: 2,
            py: 1.5,
            bgcolor: "success.light",
            borderRadius: 1,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Typography variant="body2" color="success.dark" fontWeight={600}>
            ✓ Materials submitted successfully!
          </Typography>
          <Button size="small" onClick={() => setSubmitted(false)}>
            Dismiss
          </Button>
        </Box>
      )} */}

      {/* Main card */}
      <Grid container spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Grid size={12}>
          <Card>
            <CardContent>

              {/* ── Selection row ─────────────────────────────────────────── */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  flexWrap: "wrap",
                  pt: 1,
                }}
              >
                {/* Material autocomplete */}
                <Autocomplete
                  options={data}
                  size="small"
                  value={selectedMaterial}
                  getOptionLabel={(option) => option.name}
                  onChange={(_, value) => setSelectedMaterial(value)}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Material" variant="outlined" />
                  )}
                  sx={{ width: 380 }}
                />

                {/* Preview chips when material selected */}
                {selectedMaterial && (
                  <Stack direction="row" spacing={1}>
                    <Chip label={`UOM: ${selectedMaterial.unit_of_measurement?.name }`} size="small" variant="outlined" />
                    <Chip label={`Size: ${selectedMaterial.size}`} size="small" variant="outlined" color="info" />
                  </Stack>
                )}

                {/* Qty input */}
                <TextField
                  size="small"
                  label="Qty"
                  type="number"
                  value={qtyInput}
                  onChange={(e) => setQtyInput(e.target.value)}
                  inputProps={{ min: 1 }}
                  sx={{ width: 100 }}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />

                {/* Add button */}
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAdd}
                  sx={{ height: 40, px: 3, my: 0 }}
                >
                  + Add
                </Button>
              </Box>

              {/* ── Table ─────────────────────────────────────────────────── */}
              {tableItems.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Table>
                    <Thead>
                      <Tr>
                        <Th style={{ textAlign: "left",  paddingBottom: 10, color: "#0288d1", fontWeight: 700, fontSize: 12, textTransform: "uppercase" }}>Name</Th>
                        <Th style={{ textAlign: "center", paddingBottom: 10, color: "#0288d1", fontWeight: 700, fontSize: 12, textTransform: "uppercase" }}>UOM</Th>
                        <Th style={{ textAlign: "center", paddingBottom: 10, color: "#0288d1", fontWeight: 700, fontSize: 12, textTransform: "uppercase" }}>Size</Th>
                        <Th style={{ textAlign: "center", paddingBottom: 10, color: "#0288d1", fontWeight: 700, fontSize: 12, textTransform: "uppercase" }}>QTY</Th>
                        <Th style={{ textAlign: "center", paddingBottom: 10, color: "#0288d1", fontWeight: 700, fontSize: 12, textTransform: "uppercase" }}>Action</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {tableItems.map((item) => (
                        <Tr key={item.rowId}>
                          <Td style={{ padding: "10px 8px", fontSize: 14 }}>{item.name}</Td>
                          <Td style={{ padding: "10px 8px", textAlign: "center" }}>
                            <TextField
                              size="small"
                              value={item.uom}
                              inputProps={{ readOnly: true }}
                              sx={{ width: 90 }}
                            />
                          </Td>
                          <Td style={{ padding: "10px 8px", textAlign: "center" }}>
                            <TextField
                              size="small"
                              value={item.size}
                              inputProps={{ readOnly: true }}
                              sx={{ width: 160 }}
                            />
                          </Td>
                          <Td style={{ padding: "10px 8px", textAlign: "center" }}>
                            <TextField
                              size="small"
                              type="number"
                              value={item.qty}
                              onChange={(e) => handleQtyChange(item.rowId, e.target.value)}
                              inputProps={{ min: 1 }}
                              sx={{ width: 90 }}
                            />
                          </Td>
                          <Td style={{ padding: "10px 8px", textAlign: "center" }}>
                            <Tooltip title="Delete">
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => handleDeleteItem(item.rowId)}
                              >
                                <RiDeleteBinLine size={16} />
                              </IconButton>
                            </Tooltip>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              )}

              {/* ── Empty state ───────────────────────────────────────────── */}
              {tableItems.length === 0 && !submitted && (
                <Box
                  sx={{
                    mt: 4,
                    py: 5,
                    textAlign: "center",
                    border: "1.5px dashed",
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No materials added yet. Select a material and click <strong>+ Add</strong>.
                  </Typography>
                </Box>
              )}

              {/* ── Submit row ────────────────────────────────────────────── */}
              <Grid size={12} sx={{ mt: 3 }}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={() => { setTableItems([]); setSelectedMaterial(null); setQtyInput(""); }}
                    disabled={tableItems.length === 0 || isSubmitting}
                  >
                    Clear All
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={tableItems.length === 0 || isSubmitting}
                    startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : null}
                  >
                    {isSubmitting ? "Submitting…" : "Submit"}
                  </Button>
                </Stack>
              </Grid>

            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Delete confirm dialog ────────────────────────────────────────────── */}
      <Dialog maxWidth="xs" fullWidth open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to remove this material?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CCSMaterial;