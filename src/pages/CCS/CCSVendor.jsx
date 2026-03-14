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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { RiDeleteBinLine } from "react-icons/ri";
import { Autocomplete } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { getMaterialWithId } from "./slice/ccsMaterialSlice";
import { useDispatch, useSelector } from "react-redux";
import { fetchActiveVendors } from "../settings/slices/vendorSlice";
import { useParams } from "react-router-dom";
import {
  storeVendorWithCcs,
  getOnGoinProductionNumber,
  previousVendorData,
} from "./slice/ccsVendorSlice";
import { useNavigate } from "react-router-dom";

// ─── Shared table header styles ───────────────────────────────────────────────
const thStyle = (h) => ({
  paddingBottom: 10,
  paddingTop: 6,
  color: "#0288d1",
  fontWeight: 700,
  fontSize: 12,
  textTransform: "uppercase",
  textAlign: h === "Name" ? "left" : "center",
  whiteSpace: "nowrap",
});

const TABLE_HEADERS = ["Name", "UOM", "Size", "QTY", "Quote Rate", "Neg Rate", "Amount"];

// ─── Build items from fresh API material list (new vendor) ────────────────────
const buildItemsFromMaterials = (materials = []) =>
  materials.map((mat, index) => ({
    rowId: mat.id ?? index,
    materialId: mat.material?.id,
    name: mat.material?.name,
    uom: mat.uom ?? "",
    size: mat.size ?? "",
    qty: mat.qty ?? "",
    quoteRate: "",
    negRate: "",
  }));

// ─── Build items from previousData materials ──────────────────────────────────
const buildItemsFromPrevious = (prevMaterials = []) =>
  prevMaterials.map((mat, index) => ({
    rowId: mat.id ?? index,
    materialId: mat.material_id ?? mat.material?.id,
    name: mat.material_name ?? mat.material?.name ?? mat.name ?? "",
    uom: mat.uom ?? "",
    size: mat.size ?? "",
    qty: mat.qty ?? "",
    quoteRate: mat.quote_rate ?? "",
    negRate: mat.neg_rate ?? "",
  }));

// ─── Map a previousData record → editable vendor shape ───────────────────────
const buildVendorFromPrevious = (pv, vendorsData = []) => {
  const matchedVendor = vendorsData.find((v) => v.id === pv.vendor_id) ?? null;
  return {
    id: pv.id,           // use real DB id as local key
    isExisting: true,    // flag: update, not create
    dbId: pv.id,
    vendor: matchedVendor,
    modelNo: pv.model_no ?? "",
    pfCharge: pv.pf_charge ?? "",
    creditdays: pv.credit_days ?? "",
    warranty: pv.warranty ?? "",
    paymentTerms: pv.payment_terms ?? "",
    purchaseOrderDate: pv.purchase_order_date ? new Date(pv.purchase_order_date) : null,
    indentDetails: pv.indent_details ?? "",
    remarks: pv.remarks ?? "",
    items: buildItemsFromPrevious(pv.materials ?? []),
  };
};

// ─── Empty vendor template (pre-filled with materials) ────────────────────────
const newVendorTemplate = (materials = []) => ({
  id: Date.now(),
  isExisting: false,
  dbId: null,
  vendor: null,
  modelNo: "",
  pfCharge: "",
  creditdays: "",
  warranty: "",
  paymentTerms: "",
  purchaseOrderDate: null,
  indentDetails: "",
  remarks: "",
  items: buildItemsFromMaterials(materials),
});

// ─── Component ────────────────────────────────────────────────────────────────
const CCSVendor = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { data: materials = [], loading: materialsLoading } = useSelector(
    (state) => state.ccsMaterial
  );
  const { data: vendorsData = [] } = useSelector((state) => state.vendor);
  const { productionChains, previousData } = useSelector((state) => state.ccsVendor);

  const [vendors, setVendors] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ── Fetch on mount ────────────────────────────────────────────────────────
  useEffect(() => {
    if (id) dispatch(getMaterialWithId(id));
    if (id) dispatch(previousVendorData(id));
    dispatch(fetchActiveVendors());
    dispatch(getOnGoinProductionNumber());
  }, []);

  // ── Seed vendors: previousData → editable, else blank ────────────────────
  useEffect(() => {
    if (materialsLoading) return;
    if (materials.length === 0) return;
    if (previousData === null || previousData === undefined) return; // not fetched yet
    if (vendorsData.length === 0) return; // need vendor list to resolve names

    if (previousData.length > 0) {
      const fromPrev = previousData.map((pv) =>
        buildVendorFromPrevious(pv, vendorsData)
      );
      setVendors(fromPrev);
      setExpanded(fromPrev[0]?.id ?? null);
    } else {
      const first = newVendorTemplate(materials);
      setVendors([first]);
      setExpanded(first.id);
    }
  }, [materials, previousData, vendorsData]);

  // ── Accordion toggle ──────────────────────────────────────────────────────
  const handleAccordion = (panelId) =>
    setExpanded((prev) => (prev === panelId ? null : panelId));

  // ── Update any top-level vendor field ─────────────────────────────────────
  const updateVendor = (vendorId, field, value) =>
    setVendors((prev) =>
      prev.map((v) => (v.id === vendorId ? { ...v, [field]: value } : v))
    );

  // ── Add a fresh blank vendor ──────────────────────────────────────────────
  const addVendor = () => {
    const nv = newVendorTemplate(materials);
    setVendors((prev) => [...prev, nv]);
    setExpanded(nv.id);
  };

  // ── Trigger delete confirmation ───────────────────────────────────────────
  const confirmDeleteVendor = (vendorId) => {
    setDeleteTarget({ type: "vendor", vendorId });
    setOpenDelete(true);
  };

  // ── Update a single material row field ────────────────────────────────────
  const updateItemField = (vendorId, rowId, field, value) =>
    setVendors((prev) =>
      prev.map((v) =>
        v.id === vendorId
          ? {
              ...v,
              items: v.items.map((item) =>
                item.rowId === rowId ? { ...item, [field]: value } : item
              ),
            }
          : v
      )
    );

  // ── Auto-calculate amount ─────────────────────────────────────────────────
  const calcAmount = (qty, negRate) => {
    const q = parseFloat(qty);
    const r = parseFloat(negRate);
    return !isNaN(q) && !isNaN(r) ? (q * r).toFixed(2) : "";
  };

  // ── Confirm delete ────────────────────────────────────────────────────────
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "vendor") {
      setVendors((prev) => prev.filter((v) => v.id !== deleteTarget.vendorId));
      if (expanded === deleteTarget.vendorId) setExpanded(null);
    }
    setOpenDelete(false);
    setDeleteTarget(null);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    for (const v of vendors) {
      if (!v.vendor) {
        alert("Please select a vendor for all entries.");
        setExpanded(v.id);
        return;
      }
      for (const item of v.items) {
        if (!item.qty || parseFloat(item.qty) <= 0) {
          alert(
            `Please enter a valid qty for "${item.name}" under vendor "${v.vendor.name}".`
          );
          setExpanded(v.id);
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const payload = vendors.map((v) => ({
        // Pass db id for existing records so backend can update them
        ...(v.isExisting && { id: v.dbId }),
        vendor_id: v.vendor.id,
        vendor_name: v.vendor.name,
        // modelNo may be an Autocomplete object or a plain string
        model_no: v.modelNo?.batch_no ?? v.modelNo ?? "",
        pf_charge: v.pfCharge,
        creditdays: v.creditdays,
        warranty: v.warranty,
        payment_terms: v.paymentTerms,
        purchase_order_date: v.purchaseOrderDate,
        indent_details: v.indentDetails,
        remarks: v.remarks,
        items: v.items.map((item) => ({
          material_id: item.materialId,
          material_name: item.name,
          uom: item.uom,
          size: item.size,
          qty: item.qty,
          quote_rate: item.quoteRate,
          neg_rate: item.negRate,
          amount: calcAmount(item.qty, item.negRate),
        })),
      }));

      const res = await dispatch(
        storeVendorWithCcs({ ccs_id: id, vendors: payload })
      ).unwrap();

      if (res.error) return;

      navigate(`/ccs/${id}/compare`);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>

      {/* Full-screen loader */}
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isSubmitting || materialsLoading}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress color="inherit" />
          <Typography sx={{ mt: 2 }}>
            {materialsLoading ? "Loading materials…" : "Submitting vendors…"}
          </Typography>
        </Box>
      </Backdrop>

      {/* Page header */}
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Grid>
          <Typography variant="h6">CCS Vendor</Typography>
        </Grid>
        <Grid>
          <Button
            variant="outlined"
            startIcon={<PersonAddIcon />}
            onClick={addVendor}
            disabled={materialsLoading || materials.length === 0}
          >
            Add Vendor
          </Button>
        </Grid>
      </Grid>

      {/* Success banner */}
      {submitted && (
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
            ✓ Vendor details submitted successfully!
          </Typography>
          <Button size="small" onClick={() => setSubmitted(false)}>
            Dismiss
          </Button>
        </Box>
      )}

      {/* ── All vendor accordion cards (previous + new, unified) ──────────────── */}
      {vendors.map((v, vIdx) => (
        <Card key={v.id} sx={{ mb: 2 }}>
          <Accordion
            expanded={expanded === v.id}
            onChange={() => handleAccordion(v.id)}
            disableGutters
            elevation={0}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ px: 2, py: 0.5, bgcolor: "grey.50" }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  Vendor {vIdx + 1}
                  {v.vendor && ` — ${v.vendor.name}`}
                </Typography>

                <Chip
                  label={`${v.items.length} material${v.items.length !== 1 ? "s" : ""}`}
                  size="small"
                  color="info"
                  variant="outlined"
                />

                {/* Existing vs New badge */}
                {v.isExisting ? (
                  <Chip label="Existing" size="small" color="warning" variant="outlined" />
                ) : (
                  <Chip label="New" size="small" color="success" variant="outlined" />
                )}

                <Box sx={{ flex: 1 }} />

                {vendors.length > 1 && (
                  <Tooltip title="Remove vendor">
                    <IconButton
                      color="error"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDeleteVendor(v.id);
                      }}
                    >
                      <RiDeleteBinLine size={16} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </AccordionSummary>

            <AccordionDetails sx={{ p: 2 }}>
              <CardContent sx={{ p: 0 }}>

                {/* Vendor selector */}
                <Box sx={{ mb: 3 }}>
                  <Autocomplete
                    options={vendorsData}
                    size="small"
                    value={v.vendor}
                    getOptionLabel={(o) => o.name}
                    onChange={(_, val) => updateVendor(v.id, "vendor", val)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Vendor *"
                        variant="outlined"
                      />
                    )}
                    sx={{ width: 380 }}
                  />
                </Box>

                {/* Detail fields */}
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Stack spacing={2}>
                      <Autocomplete
                        options={productionChains}
                        size="small"
                        value={
                          typeof v.modelNo === "object"
                            ? v.modelNo
                            : productionChains.find((c) => c.batch_no === v.modelNo) ?? null
                        }
                        getOptionLabel={(o) => o?.batch_no ?? ""}
                        isOptionEqualToValue={(o, val) => o?.id === val?.id}
                        onChange={(_, val) => updateVendor(v.id, "modelNo", val)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Select Model No"
                            variant="outlined"
                            placeholder={
                              typeof v.modelNo === "string" && v.modelNo
                                ? v.modelNo
                                : undefined
                            }
                          />
                        )}
                      />
                      <TextField
                        size="small"
                        label="P&F Charge"
                        value={v.pfCharge}
                        onChange={(e) => updateVendor(v.id, "pfCharge", e.target.value)}
                        fullWidth
                      />
                      <TextField
                        size="small"
                        label="Credit Days"
                        value={v.creditdays}
                        onChange={(e) => updateVendor(v.id, "creditdays", e.target.value)}
                        fullWidth
                      />
                      <TextField
                        size="small"
                        label="Remarks"
                        value={v.remarks}
                        onChange={(e) => updateVendor(v.id, "remarks", e.target.value)}
                        multiline
                        rows={3}
                        fullWidth
                      />
                    </Stack>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Stack spacing={2}>
                      <TextField
                        size="small"
                        label="Warranty"
                        value={v.warranty}
                        onChange={(e) => updateVendor(v.id, "warranty", e.target.value)}
                        fullWidth
                      />
                      <TextField
                        size="small"
                        label="Payment Terms"
                        value={v.paymentTerms}
                        onChange={(e) => updateVendor(v.id, "paymentTerms", e.target.value)}
                        fullWidth
                      />
                      <DatePicker
                        label="Purchase Order Date"
                        value={v.purchaseOrderDate}
                        onChange={(val) => updateVendor(v.id, "purchaseOrderDate", val)}
                        slotProps={{ textField: { size: "small", fullWidth: true } }}
                      />
                      <TextField
                        size="small"
                        label="Indent Details"
                        value={v.indentDetails}
                        onChange={(e) => updateVendor(v.id, "indentDetails", e.target.value)}
                        fullWidth
                      />
                    </Stack>
                  </Grid>
                </Grid>

                {/* Materials table */}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Materials
                  </Typography>

                  {v.items.length > 0 ? (
                    <Table>
                      <Thead>
                        <Tr>
                          {TABLE_HEADERS.map((h) => (
                            <Th key={h} style={thStyle(h)}>
                              {h}
                            </Th>
                          ))}
                        </Tr>
                      </Thead>
                      <Tbody>
                        {v.items.map((item) => {
                          const amount = calcAmount(item.qty, item.negRate);
                          return (
                            <Tr key={item.rowId}>
                              {/* Name — read only */}
                              <Td style={{ padding: "8px 6px", fontSize: 13 }}>
                                {item.name}
                              </Td>

                              {/* UOM — read only */}
                              <Td style={{ padding: "8px 4px", textAlign: "center" }}>
                                <TextField
                                  size="small"
                                  value={item.uom}
                                  inputProps={{ readOnly: true }}
                                  sx={{ width: 80 }}
                                />
                              </Td>

                              {/* Size — read only */}
                              <Td style={{ padding: "8px 4px", textAlign: "center" }}>
                                <TextField
                                  size="small"
                                  value={item.size}
                                  inputProps={{ readOnly: true }}
                                  sx={{ width: 140 }}
                                />
                              </Td>

                              {/* QTY — editable */}
                              <Td style={{ padding: "8px 4px", textAlign: "center" }}>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={item.qty}
                                  onChange={(e) =>
                                    updateItemField(v.id, item.rowId, "qty", e.target.value)
                                  }
                                  inputProps={{ min: 0 }}
                                  sx={{ width: 80 }}
                                />
                              </Td>

                              {/* Quote Rate — editable */}
                              <Td style={{ padding: "8px 4px", textAlign: "center" }}>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={item.quoteRate}
                                  onChange={(e) =>
                                    updateItemField(v.id, item.rowId, "quoteRate", e.target.value)
                                  }
                                  inputProps={{ min: 0 }}
                                  sx={{ width: 110 }}
                                />
                              </Td>

                              {/* Neg Rate — editable */}
                              <Td style={{ padding: "8px 4px", textAlign: "center" }}>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={item.negRate}
                                  onChange={(e) =>
                                    updateItemField(v.id, item.rowId, "negRate", e.target.value)
                                  }
                                  inputProps={{ min: 0 }}
                                  sx={{ width: 110 }}
                                />
                              </Td>

                              {/* Amount — auto-calculated */}
                              <Td style={{ padding: "8px 4px", textAlign: "center" }}>
                                <TextField
                                  size="small"
                                  value={amount}
                                  inputProps={{ readOnly: true }}
                                  placeholder="Auto"
                                  sx={{ width: 110 }}
                                />
                              </Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  ) : (
                    <Box
                      sx={{
                        py: 3,
                        textAlign: "center",
                        border: "1.5px dashed",
                        borderColor: "divider",
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        No materials found for this CCS.
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </AccordionDetails>
          </Accordion>
        </Card>
      ))}

      {/* Dashed add-vendor strip */}
      <Box
        sx={{
          border: "1.5px dashed",
          borderColor: "primary.light",
          borderRadius: 2,
          py: 2,
          textAlign: "center",
          cursor: materialsLoading ? "not-allowed" : "pointer",
          mb: 3,
          opacity: materialsLoading ? 0.5 : 1,
          "&:hover": { bgcolor: "primary.50" },
        }}
        onClick={!materialsLoading ? addVendor : undefined}
      >
        <Typography variant="body2" color="primary.main" fontWeight={600}>
          + Add Another Vendor
        </Typography>
      </Box>

      {/* Action buttons */}
      <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mb: 4 }}>
        <Button
          variant="outlined"
          color="inherit"
          onClick={() => {
            // Reset restores previousData if available, else blank
            if (previousData && previousData.length > 0) {
              const fromPrev = previousData.map((pv) =>
                buildVendorFromPrevious(pv, vendorsData)
              );
              setVendors(fromPrev);
              setExpanded(fromPrev[0]?.id ?? null);
            } else {
              const fresh = newVendorTemplate(materials);
              setVendors([fresh]);
              setExpanded(fresh.id);
            }
          }}
          disabled={isSubmitting}
        >
          Reset
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={isSubmitting || vendors.length === 0 || materialsLoading}
          startIcon={
            isSubmitting ? <CircularProgress size={18} color="inherit" /> : null
          }
        >
          {isSubmitting ? "Submitting…" : "Submit All"}
        </Button>
      </Stack>

      {/* Delete confirmation dialog */}
      <Dialog
        maxWidth="xs"
        fullWidth
        open={openDelete}
        onClose={() => setOpenDelete(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove this vendor and all its materials?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default CCSVendor;