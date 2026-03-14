import React, { useState, useRef, useEffect } from "react";
import Grid from "@mui/material/Grid";
import {
  Button,
  Typography,
  Card,
  CardContent,
  Box,
  TextField,
  Chip,
  Autocomplete,
  Stack,
  Paper,
  Alert,
  CircularProgress,
  Backdrop,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
} from "@mui/material";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import PrintIcon from "@mui/icons-material/Print";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useDispatch, useSelector } from "react-redux";
import { getVendorWithId, approveCCS } from "./slice/ccsComparisonSlice";
import { getMaterialWithId } from "./slice/ccsMaterialSlice";
import { useParams } from "react-router-dom";
import { fetchActiveTaxSlabs } from "../settings/slices/taxSlabSlice";
import { useNavigate } from "react-router-dom";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toNum = (v) => parseFloat(v) || 0;
const fmt   = (n) => toNum(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const calcSubTotal = (materials = []) =>
  materials.reduce((sum, m) => sum + toNum(m.amount), 0);

const lowestNegRate = (vendors, materialId) =>
  Math.min(
    ...vendors.map((v) => {
      const mat = (v.materials || []).find((m) => String(m.material_id) === String(materialId));
      return mat ? toNum(mat.neg_rate) : Infinity;
    })
  );

// ─── Component ────────────────────────────────────────────────────────────────
const CCSComparison = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { data: vendorList = [], ccs = null, error: vendorError, loading: vendorLoading } =
    useSelector((state) => state.ccsComparison);
  const { data: materialList = [], error: materialError, loading: materialLoading } =
    useSelector((state) => state.ccsMaterial);
  const { activeData: gsts = [], loading: gstLoading } =
    useSelector((state) => state.taxSlab);

  const [selectedVendors, setSelectedVendors]   = useState([]);
  const [compared, setCompared]                 = useState(false);
  const [selectedGstId, setSelectedGstId]       = useState("");   // tax slab id
  const [approvedVendor, setApprovedVendor]     = useState(null); // vendor object
  const [isApproving, setIsApproving]           = useState(false);
  const printRef = useRef(null);

  // ── Fetch on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (id) {
      dispatch(getVendorWithId(id));
      dispatch(getMaterialWithId(id));
    }
    dispatch(fetchActiveTaxSlabs());
  }, [id]);

  // ── Auto-select 18% GST once slabs load ────────────────────────────────────
  useEffect(() => {
    if (gsts.length > 0 && selectedGstId === "") {
      const defaultSlab = gsts.find((g) => toNum(g.percentage) === 18) ?? gsts[0];
      setSelectedGstId(defaultSlab.id);
    }
  }, [gsts]);

  // ── Current GST rate (fraction) ────────────────────────────────────────────
  const currentGst = gsts.find((g) => g.id === selectedGstId);
  const gstRate    = currentGst ? toNum(currentGst.percentage) / 100 : 0.18;
  const gstLabel   = currentGst ? `${toNum(currentGst.percentage).toFixed(0)}%` : "18%";

  // ── Vendor selection ────────────────────────────────────────────────────────
  const handleVendorChange = (_, value) => {
    setSelectedVendors(value);
    setCompared(false);
    setApprovedVendor(null);
  };

  const removeVendor = (vendorId) => {
    setSelectedVendors((prev) => prev.filter((v) => v.id !== vendorId));
    setCompared(false);
    setApprovedVendor(null);
  };

  const handleCompare = () => {
    if (selectedVendors.length < 2) {
      alert("Please select at least 2 vendors to compare.");
      return;
    }
    setCompared(true);
  };

  const handlePrint = () => window.print();

  // ── Approve ─────────────────────────────────────────────────────────────────
  const handleApprove = async () => {
    if (!approvedVendor) {
      alert("Please select a vendor to approve.");
      return;
    }

    const subTotal   = calcSubTotal(approvedVendor.materials);
    const gstAmount  = subTotal * gstRate;
    const grandTotal = subTotal + gstAmount;

    const payload = {
      ccs_id:     id,
      vendor_id:  approvedVendor.vendor?.id ?? approvedVendor.vendor_id,
      sub_total:  subTotal.toFixed(2),
      gst:        gstAmount.toFixed(2),
      grand_total: grandTotal.toFixed(2),
      gst_percentage: toNum(currentGst?.percentage ?? 18),
    };

    setIsApproving(true);
    try {
     const res =  await dispatch(approveCCS(payload)).unwrap();
     if(res.error){
        return;
     }
     navigate('/vendor/purchase-order');
    } catch (err) {
      console.error("Approve failed:", err);
      alert("Approval failed. Please try again.");
    } finally {
      setIsApproving(false);
    }
  };

  const isLoading = vendorLoading || materialLoading;
  const hasError  = vendorError || materialError;

  // ── Summary for approved vendor preview ─────────────────────────────────────
  const approvedSubTotal   = approvedVendor ? calcSubTotal(approvedVendor.materials) : 0;
  const approvedGst        = approvedSubTotal * gstRate;
  const approvedGrandTotal = approvedSubTotal + approvedGst;

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #ccs-print-area, #ccs-print-area * { visibility: visible; }
          #ccs-print-area { position: absolute; inset: 0; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Full-screen loader */}
      <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }} open={isLoading || isApproving}>
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress color="inherit" />
          <Typography sx={{ mt: 2 }}>
            {isApproving ? "Approving vendor…" : "Loading comparison data…"}
          </Typography>
        </Box>
      </Backdrop>

      {/* Page header */}
      <Grid container spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }} className="no-print">
        <Grid>
          <Typography variant="h6">
            CCS Comparison
            {ccs?.ccs_no && (
              <Chip label={ccs.ccs_no} size="small" color="info" variant="outlined" sx={{ ml: 1.5 }} />
            )}
          </Typography>
        </Grid>
      </Grid>

      {/* Error banners */}
      {hasError && (
        <Alert severity="error" sx={{ mb: 2 }} className="no-print">
          {vendorError || materialError}
        </Alert>
      )}

      {/* No vendors */}
      {!isLoading && !hasError && vendorList.length === 0 && (
        <Alert severity="warning" sx={{ mb: 2 }} className="no-print">
          No vendor quotations found for this CCS. Please add vendors first.
        </Alert>
      )}

      {/* ── Selector card ─────────────────────────────────────────────────────── */}
      {vendorList.length > 0 && (
        <Card sx={{ mb: 3 }} className="no-print">
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="subtitle2" color="text.secondary">
                Select vendors to compare (minimum 2)
              </Typography>

              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "flex-start" }}>
                {/* Multi vendor select */}
                <Autocomplete
                  multiple
                  options={vendorList}
                  value={selectedVendors}
                  getOptionLabel={(o) => o.vendor?.name ?? `Vendor #${o.id}`}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  onChange={handleVendorChange}
                  renderTags={() => null}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="Select Vendors"
                      placeholder="Search vendor…"
                      sx={{ width: 320 }}
                    />
                  )}
                />

                {/* GST selector */}
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>GST Rate</InputLabel>
                  <Select
                    label="GST Rate"
                    value={selectedGstId}
                    onChange={(e) => setSelectedGstId(e.target.value)}
                    disabled={gstLoading}
                  >
                    {gsts.map((g) => (
                      <MenuItem key={g.id} value={g.id}>
                        {toNum(g.percentage).toFixed(0)}%
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<CompareArrowsIcon />}
                  onClick={handleCompare}
                  disabled={selectedVendors.length < 2}
                  sx={{ height: 40, my: 0 }}
                >
                  Compare
                </Button>

                {compared && (
                  <Button
                    variant="outlined"
                    startIcon={<PrintIcon />}
                    onClick={handlePrint}
                    sx={{ height: 40, my: 0 }}
                  >
                    Print
                  </Button>
                )}
              </Box>

              {/* Selected vendor chips */}
              {selectedVendors.length > 0 && (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {selectedVendors.map((v) => (
                    <Chip
                      key={v.id}
                      label={v.vendor?.name ?? `Vendor #${v.id}`}
                      onDelete={() => removeVendor(v.id)}
                      color="info"
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* ── Comparison Table ──────────────────────────────────────────────────── */}
      {compared && selectedVendors.length >= 2 && (
        <Box id="ccs-print-area" ref={printRef}>
            {/* ── Approve section ───────────────────────────────────────────────── */}
          <Card sx={{ my: 3 }} className="no-print">
            <CardContent>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
                Approve Vendor Quotation
              </Typography>

              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "flex-end" }}>
                {/* Approved vendor selector */}
                <Autocomplete
                  options={selectedVendors}
                  value={approvedVendor}
                  getOptionLabel={(o) => o.vendor?.name ?? `Vendor #${o.id}`}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  onChange={(_, val) => setApprovedVendor(val)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="Select Approved Vendor *"
                      sx={{ width: 300 }}
                    />
                  )}
                />

                {/* Summary preview */}
                {approvedVendor && (
                  <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
                    <Box sx={{ px: 2, py: 1, bgcolor: "grey.100", borderRadius: 1, minWidth: 130 }}>
                      <Typography variant="caption" color="text.secondary" display="block">Sub Total</Typography>
                      <Typography variant="body2" fontWeight={700}>₹ {fmt(approvedSubTotal)}</Typography>
                    </Box>
                    <Box sx={{ px: 2, py: 1, bgcolor: "grey.100", borderRadius: 1, minWidth: 130 }}>
                      <Typography variant="caption" color="text.secondary" display="block">GST ({gstLabel})</Typography>
                      <Typography variant="body2" fontWeight={700}>₹ {fmt(approvedGst)}</Typography>
                    </Box>
                    <Box sx={{ px: 2, py: 1, bgcolor: "#e3f2fd", borderRadius: 1, minWidth: 130 }}>
                      <Typography variant="caption" color="text.secondary" display="block">Grand Total</Typography>
                      <Typography variant="body2" fontWeight={700} color="primary">₹ {fmt(approvedGrandTotal)}</Typography>
                    </Box>
                  </Stack>
                )}

                <Button
                  variant="contained"
                  color="success"
                  startIcon={isApproving ? <CircularProgress size={18} color="inherit" /> : <CheckCircleOutlineIcon />}
                  onClick={handleApprove}
                  disabled={!approvedVendor || isApproving}
                  sx={{ height: 40, ml: "auto" }}
                >
                  {isApproving ? "Approving…" : "Approve"}
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Paper elevation={1} sx={{ overflowX: "auto", border: "1px solid #d0d0d0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "inherit" }}>
              <thead>
                {/* Title */}
                <tr>
                  <td
                    colSpan={5 + selectedVendors.length * 3}
                    style={{ textAlign: "center", padding: "12px 8px 4px", borderBottom: "none" }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 15 }}>Cost Comparison Sheet</div>
                    {ccs?.ccs_no && <div style={{ fontSize: 12, color: "#555" }}>{ccs.ccs_no}</div>}
                  </td>
                </tr>

                {/* Spacer */}
                <tr>
                  <td colSpan={5 + selectedVendors.length * 3} style={{ height: 6, borderBottom: "1px solid #bbb" }} />
                </tr>

                {/* Vendor name headers */}
                <tr style={{ background: "#f5f5f5" }}>
                  <th style={thS("center")}>SR.NO</th>
                  <th style={thS("left")}>Item Description</th>
                  <th style={thS("center")}>Size</th>
                  <th style={thS("center")}>Qty</th>
                  <th style={thS("center")}>UOM</th>
                  {selectedVendors.map((v) => (
                    <th
                      key={v.id}
                      colSpan={3}
                      style={{ ...thS("center"), borderLeft: "2px solid #bbb", background: "#e3f2fd" }}
                    >
                      {v.vendor?.name ?? `Vendor #${v.id}`}
                    </th>
                  ))}
                </tr>

                {/* Rate sub-headers */}
                <tr style={{ background: "#fafafa" }}>
                  <th colSpan={5} style={thS()} />
                  {selectedVendors.map((v) => (
                    <React.Fragment key={v.id}>
                      <th style={{ ...thS("center"), borderLeft: "2px solid #bbb" }}>Quoted Rate</th>
                      <th style={thS("center")}>Neg. Rate</th>
                      <th style={thS("center")}>Amount</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>

              <tbody>
                {/* Material rows */}
                {materialList.map((mat, idx) => {
                  const low = lowestNegRate(selectedVendors, mat.material_id);
                  return (
                    <tr key={mat.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                      <td style={tdS("center")}>{idx + 1}</td>
                      <td style={tdS("left")}>{mat.material?.name ?? "—"}</td>
                      <td style={tdS("center")}>{mat.size ?? "—"}</td>
                      <td style={tdS("center")}>{mat.qty ?? "—"}</td>
                      <td style={tdS("center")}>{mat.uom ?? "—"}</td>
                      {selectedVendors.map((v) => {
                        const vMat    = (v.materials || []).find((m) => String(m.material_id) === String(mat.material_id));
                        const negRate = toNum(vMat?.neg_rate);
                        const isLow   = vMat && negRate === low;
                        return (
                          <React.Fragment key={v.id}>
                            <td style={{ ...tdS("right"), borderLeft: "2px solid #ddd" }}>
                              {vMat ? fmt(vMat.quote_rate) : "—"}
                            </td>
                            <td style={{ ...tdS("right"), ...(isLow ? { background: "#e8f5e9", fontWeight: 700, color: "#2e7d32" } : {}) }}>
                              {vMat ? fmt(vMat.neg_rate) : "—"}
                            </td>
                            <td style={tdS("right")}>
                              {vMat ? fmt(vMat.amount) : "—"}
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  );
                })}

                {/* Summary rows */}
                {[
                  { label: "Model No",           key: "model_no" },
                  { label: "Warranty",            key: "warranty" },
                  { label: "P&F Charge",          key: "pf_charge" },
                  { label: "Credit Days",          key: "credit_days" },
                  { label: "Payment Terms",        key: "payment_terms" },
                  { label: "Purchase Order Date",  key: "purchase_order_date" },
                  { label: "Indent Details",       key: "indent_details" },
                  { label: "Remarks",              key: "remarks" },
                ].map(({ label, key }) => (
                  <tr key={key} style={{ borderBottom: "1px solid #e0e0e0", background: "#fafafa" }}>
                    <td colSpan={5} style={{ ...tdS("right"), fontWeight: 600, paddingRight: 14 }}>{label}</td>
                    {selectedVendors.map((v) => (
                      <td key={v.id} colSpan={3} style={{ ...tdS("center"), borderLeft: "2px solid #ddd" }}>
                        {v[key] ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Sub Total */}
                <tr style={{ borderTop: "2px solid #bbb", background: "#f5f5f5" }}>
                  <td colSpan={5} style={{ ...tdS("right"), fontWeight: 700, paddingRight: 14 }}>Sub Total</td>
                  {selectedVendors.map((v) => (
                    <td key={v.id} colSpan={3} style={{ ...tdS("right"), fontWeight: 700, borderLeft: "2px solid #ddd" }}>
                      {fmt(calcSubTotal(v.materials))}
                    </td>
                  ))}
                </tr>

                {/* GST — dynamic */}
                <tr style={{ background: "#fafafa" }}>
                  <td colSpan={5} style={{ ...tdS("right"), fontWeight: 600, paddingRight: 14 }}>
                    GST ({gstLabel})
                  </td>
                  {selectedVendors.map((v) => {
                    const gstAmt = calcSubTotal(v.materials) * gstRate;
                    return (
                      <td key={v.id} colSpan={3} style={{ ...tdS("right"), borderLeft: "2px solid #ddd" }}>
                        {fmt(gstAmt)}
                      </td>
                    );
                  })}
                </tr>

                {/* Grand Total */}
                <tr style={{ borderTop: "2px solid #bbb", background: "#e3f2fd" }}>
                  <td colSpan={5} style={{ ...tdS("right"), fontWeight: 700, fontSize: 14, paddingRight: 14 }}>Grand Total</td>
                  {selectedVendors.map((v) => {
                    const total = calcSubTotal(v.materials) * (1 + gstRate);
                    return (
                      <td key={v.id} colSpan={3} style={{ ...tdS("right"), fontWeight: 700, fontSize: 14, borderLeft: "2px solid #ddd" }}>
                        {fmt(total)}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </Paper>

          {/* Legend */}
          <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 1 }} className="no-print">
            <Box sx={{ width: 14, height: 14, bgcolor: "#e8f5e9", border: "1px solid #a5d6a7", borderRadius: 0.5 }} />
            <Typography variant="caption" color="text.secondary">
              Green = lowest negotiated rate for that item
            </Typography>
          </Box>

          
        </Box>
      )}

      {/* Empty state */}
      {!isLoading && !compared && vendorList.length > 0 && (
        <Box sx={{ py: 8, textAlign: "center", border: "1.5px dashed", borderColor: "divider", borderRadius: 2 }}>
          <CompareArrowsIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Select at least <strong>2 vendors</strong> and click <strong>Compare</strong>.
          </Typography>
        </Box>
      )}
    </>
  );
};

// ─── Style helpers ────────────────────────────────────────────────────────────
const thS = (align = "left") => ({
  padding: "7px 10px",
  textAlign: align,
  fontSize: 12,
  fontWeight: 700,
  borderBottom: "2px solid #bbb",
  whiteSpace: "nowrap",
});

const tdS = (align = "left") => ({
  padding: "6px 10px",
  textAlign: align,
  fontSize: 12,
  verticalAlign: "middle",
});

export default CCSComparison;