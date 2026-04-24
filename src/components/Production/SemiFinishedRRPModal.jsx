// components/SemiFinishedRRPModal.jsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  IconButton,
  Box,
  Button,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { styled } from "@mui/material/styles";

const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(3),
  },
}));

const SectionTitle = styled(Typography)(() => ({
  fontWeight: 600,
  fontSize: "13px",
  textAlign: "center",
  backgroundColor: "#e8e8e8",
  padding: "6px 12px",
  border: "1px solid #ccc",
  letterSpacing: "0.5px",
}));

const StyledTableHead = styled(TableHead)(() => ({
  "& .MuiTableCell-root": {
    backgroundColor: "#f0f0f0",
    fontWeight: 600,
    fontSize: "12px",
    padding: "6px 10px",
    border: "1px solid #ccc",
    color: "#333",
  },
}));

const StyledTableCell = styled(TableCell)(() => ({
  fontSize: "13px",
  padding: "5px 10px",
  border: "1px solid #ccc",
  color: "#444",
}));

const SubSection = styled(Typography)(() => ({
  fontWeight: 500,
  fontSize: "12px",
  backgroundColor: "#f5f5f5",
  padding: "4px 10px",
  border: "1px solid #ccc",
  borderTop: "none",
}));

const SummaryRow = ({ label, value, bold = false, highlight = false }) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      px: 1.5,
      py: 0.75,
      border: "1px solid #ccc",
      borderTop: "none",
      backgroundColor: highlight ? "#f0f0f0" : "transparent",
    }}
  >
    <Typography sx={{ fontSize: "13px", fontWeight: bold ? 600 : 400, color: "#444" }}>
      {label}
    </Typography>
    <Typography sx={{ fontSize: "13px", fontWeight: bold ? 700 : 400, color: "#333", minWidth: 80, textAlign: "right" }}>
      {value}
    </Typography>
  </Box>
);

export default function SemiFinishedRRPModal({ open, onClose, rrpData, saving = false, onSave }) {
  const [overheadCharges, setOverheadCharges] = useState(0);
  const [grossProfitPct, setGrossProfitPct] = useState(5);

  useEffect(() => {
    if (rrpData) {
      setOverheadCharges(rrpData.miscellaneous ?? 0);
      // Derive gross profit % from data if possible, default 5
      const subTotal = (rrpData.material_cost ?? 0) + (rrpData.labour_cost ?? 0);
      if (subTotal > 0 && rrpData.gross_profit_amount > 0) {
        setGrossProfitPct(((rrpData.gross_profit_amount / subTotal) * 100).toFixed(2));
      } else {
        setGrossProfitPct(5);
      }
    }
  }, [rrpData]);

  if (!rrpData) return null;

  const materialCost = rrpData.material_cost ?? 0;
  const labourCost = rrpData.labour_cost ?? 0;
  const subTotal = materialCost + labourCost;
  const grossProfitAmount = parseFloat(((subTotal * parseFloat(grossProfitPct || 0)) / 100).toFixed(2));
  const total = subTotal + parseFloat(overheadCharges || 0) + grossProfitAmount;

  // Group materials by group name
  const materialGroups = rrpData.materies ?? {};

  // Build labour rows from worksheet
  const labourMap = {};
  (rrpData.workSheet ?? []).forEach((w) => {
    const key = `${w.department_name}__${w.labour_name}__${w.per_hour_cost}`;
    if (!labourMap[key]) {
      labourMap[key] = {
        department: w.department_name,
        name: w.labour_name,
        perHour: parseFloat(w.per_hour_cost),
        totalMinutes: 0,
      };
    }
    labourMap[key].totalMinutes += parseInt(w.total_minutes ?? 0);
  });
  const labourRows = Object.values(labourMap).map((l) => ({
    ...l,
    hours: parseFloat((l.totalMinutes / 60).toFixed(2)),
    total: parseFloat(((l.totalMinutes / 60) * l.perHour).toFixed(2)),
  }));

  const fmt = (v) =>
    parseFloat(v ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <StyledDialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Semi-Finished — RRP Calculation
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>

          {/* LEFT — MATERIAL USED */}
          <Box sx={{ flex: "1 1 380px", minWidth: 320 }}>
            <Box sx={{ border: "1px solid #ccc" }}>
              <SectionTitle>MATERIAL USED</SectionTitle>

              {Object.entries(materialGroups).map(([groupName, items]) => (
                <Box key={groupName}>
                  <SubSection>{groupName}</SubSection>
                  <Table size="small" sx={{ "& td, & th": { border: "1px solid #ccc" } }}>
                    <StyledTableHead>
                      <TableRow>
                        <TableCell>ITEM NAME</TableCell>
                        <TableCell align="center">QTY</TableCell>
                        <TableCell align="right">PRICE</TableCell>
                        <TableCell align="right">AMOUNT</TableCell>
                      </TableRow>
                    </StyledTableHead>
                    <TableBody>
                      {items.map((item, idx) => {
                        const price = parseFloat(item.material?.price ?? 0);
                        const amount = price * item.qty;
                        return (
                          <TableRow key={idx}>
                            <StyledTableCell>{item.material?.name ?? "-"}</StyledTableCell>
                            <StyledTableCell align="center">{item.qty}</StyledTableCell>
                            <StyledTableCell align="right">{fmt(price)}</StyledTableCell>
                            <StyledTableCell align="right">{fmt(amount)}</StyledTableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow>
                        <StyledTableCell colSpan={3} align="right" sx={{ fontWeight: 600, backgroundColor: "#f5f5f5" }}>
                          {groupName} Total
                        </StyledTableCell>
                        <StyledTableCell align="right" sx={{ fontWeight: 600, backgroundColor: "#f5f5f5" }}>
                          {fmt(items.reduce((s, i) => s + parseFloat(i.material?.price ?? 0) * i.qty, 0))}
                        </StyledTableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Box>
              ))}

              {/* Material Total footer */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  px: 1.5,
                  py: 0.75,
                  borderTop: "1px solid #ccc",
                  backgroundColor: "#e8e8e8",
                }}
              >
                <Typography sx={{ fontWeight: 700, fontSize: "13px" }}>MATERIAL TOTAL</Typography>
                <Typography sx={{ fontWeight: 700, fontSize: "13px" }}>{fmt(materialCost)}</Typography>
              </Box>
            </Box>
          </Box>

          {/* RIGHT — LABOUR COST + RRP CALCULATION */}
          <Box sx={{ flex: "1 1 380px", minWidth: 300, display: "flex", flexDirection: "column", gap: 3 }}>

            {/* LABOUR COST */}
            <Box sx={{ border: "1px solid #ccc" }}>
              <SectionTitle>LABOUR COST</SectionTitle>
              <Table size="small" sx={{ "& td, & th": { border: "1px solid #ccc" } }}>
                <StyledTableHead>
                  <TableRow>
                    <TableCell>DEPARTMENT</TableCell>
                    <TableCell>NAME</TableCell>
                    <TableCell align="right">PAY PER HOUR</TableCell>
                    <TableCell align="right">NO. OF HOUR</TableCell>
                    <TableCell align="right">TOTAL</TableCell>
                  </TableRow>
                </StyledTableHead>
                <TableBody>
                  {labourRows.map((row, idx) => (
                    <TableRow key={idx}>
                      <StyledTableCell>{row.department}</StyledTableCell>
                      <StyledTableCell>{row.name}</StyledTableCell>
                      <StyledTableCell align="right">{fmt(row.perHour)}</StyledTableCell>
                      <StyledTableCell align="right">{row.hours}</StyledTableCell>
                      <StyledTableCell align="right">{fmt(row.total)}</StyledTableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <StyledTableCell colSpan={4} align="right" sx={{ fontWeight: 700, backgroundColor: "#f0f0f0" }}>
                      TOTAL
                    </StyledTableCell>
                    <StyledTableCell align="right" sx={{ fontWeight: 700, backgroundColor: "#f0f0f0" }}>
                      {fmt(labourCost)}
                    </StyledTableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>

            {/* RRP CALCULATION */}
            <Box sx={{ border: "1px solid #ccc" }}>
              <SectionTitle>RRP CALCULATION</SectionTitle>

              <SummaryRow label="MATERIAL COST" value={fmt(materialCost)} />
              <SummaryRow label="LABOUR CHARGE" value={fmt(labourCost)} />
              <SummaryRow label="SUB TOTAL" value={fmt(subTotal)} bold highlight />

              {/* Editable overhead */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  px: 1.5,
                  py: 0.5,
                  border: "1px solid #ccc",
                  borderTop: "none",
                }}
              >
                <Typography sx={{ fontSize: "13px", color: "#444" }}>OVER HEAD CHARGES</Typography>
                <TextField
                  size="small"
                  type="number"
                  value={overheadCharges}
                  onChange={(e) => setOverheadCharges(e.target.value)}
                  inputProps={{ min: 0, style: { textAlign: "right", padding: "4px 8px", fontSize: "13px", width: "90px" } }}
                  sx={{ "& .MuiOutlinedInput-root": { height: 28 } }}
                />
              </Box>

              {/* Editable gross profit % */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  px: 1.5,
                  py: 0.5,
                  border: "1px solid #ccc",
                  borderTop: "none",
                }}
              >
                <Typography sx={{ fontSize: "13px", color: "#444" }}>
                  GROSS PROFIT ({grossProfitPct}%)
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TextField
                    size="small"
                    type="number"
                    value={grossProfitPct}
                    onChange={(e) => setGrossProfitPct(e.target.value)}
                    inputProps={{ min: 0, max: 100, style: { textAlign: "right", padding: "4px 8px", fontSize: "13px", width: "50px" } }}
                    sx={{ "& .MuiOutlinedInput-root": { height: 28 } }}
                  />
                  <Typography sx={{ fontSize: "13px", minWidth: 80, textAlign: "right", color: "#333" }}>
                    {fmt(grossProfitAmount)}
                  </Typography>
                </Box>
              </Box>

              <SummaryRow label="TOTAL" value={fmt(total)} bold highlight />
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" disabled={saving}>
          Close
        </Button>
        <Button
          variant="contained"
          color="success"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : null}
          onClick={() =>
            onSave?.({
              overhead: parseFloat(overheadCharges || 0),
              gross_profit_pct: parseFloat(grossProfitPct || 0),
              gross_profit_amount: grossProfitAmount,
              total,
            })
          }
        >
          {saving ? "Saving..." : "Save RRP"}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
}