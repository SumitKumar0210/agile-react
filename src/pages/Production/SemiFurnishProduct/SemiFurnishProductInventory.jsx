// pages/Inventory/SemiFurnishedInventory.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { getSemiFunishedProducts, getSemiProductLogs } from "./semiFurnishedProductSlice";
import { MdRefresh, MdSearch, MdInventory2 } from "react-icons/md";
import { HiCube } from "react-icons/hi";
import { TbCurrencyRupee } from "react-icons/tb";

// ─── Constants ────────────────────────────────────────────────────────────────

const TABLE_HEADERS = [
  "#", "Product Name", "Quantity", "Unit Price",
  "Total Value", "Stock Level", "Production Order", "Created At",
];

const STOCK_LEVELS = {
  out:  { label: "Out of Stock", color: "error"   },
  low:  { label: "Low Stock",    color: "warning"  },
  in:   { label: "In Stock",     color: "success"  },
};

// ─── Pure helpers (module-level, never recreated) ─────────────────────────────

const fmt = (v) =>
  parseFloat(v ?? 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "—";

const getStockLevel = (qty) => {
  if (qty <= 0)  return STOCK_LEVELS.out;
  if (qty <= 10) return STOCK_LEVELS.low;
  return STOCK_LEVELS.in;
};

const formatBatchNo = (batchNo) =>
  batchNo ? batchNo.replace(/^PO/i, "item") : "—";

const rowValue = (p) =>
  parseFloat(p.unit_price ?? 0) * (p.qty ?? 0);

// ─── Sub-components ───────────────────────────────────────────────────────────

const SummaryCard = React.memo(function SummaryCard({ icon, label, value, accent }) {
  return (
    <Card
      variant="outlined"
      sx={{
        flex: "1 1 180px",
        borderLeft: `4px solid ${accent}`,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.10)" },
      }}
    >
      <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, py: "14px !important" }}>
        <Box
          sx={{
            width: 40, height: 40, borderRadius: 1,
            backgroundColor: `${accent}18`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: accent, flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, letterSpacing: 0.3 }}>
            {label}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
});

// Skeleton matches TABLE_HEADERS length (8 columns)
const SkeletonRow = React.memo(function SkeletonRow() {
  return (
    <TableRow>
      {[40, 180, 80, 90, 100, 100, 120, 100].map((w, i) => (
        <TableCell key={i}>
          <Skeleton variant="text" width={w} height={22} />
        </TableCell>
      ))}
    </TableRow>
  );
});

const ProductRow = React.memo(function ProductRow({ product, index }) {
  const stockLevel = getStockLevel(product.qty);
  const totalVal   = rowValue(product);

  return (
    <TableRow
      sx={{
        "&:hover": { backgroundColor: "#fafafa" },
        transition: "background-color 0.15s",
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      <TableCell sx={{ color: "text.secondary", fontSize: "12px", width: 40 }}>
        {index + 1}
      </TableCell>

      <TableCell sx={{ fontWeight: 500, fontSize: "13px", maxWidth: 260 }}>
        <Typography
          variant="body2"
          sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          title={product.name?.trim()}
        >
          {product.name?.trim() || "—"}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          ID: {product.product_id}
        </Typography>
      </TableCell>

      <TableCell sx={{ fontSize: "13px", fontWeight: 600 }}>
        {product.qty?.toLocaleString("en-IN") ?? 0}
      </TableCell>

      <TableCell sx={{ fontSize: "13px" }}>
        ₹ {fmt(product.unit_price)}
      </TableCell>

      <TableCell sx={{ fontSize: "13px", fontWeight: 600, color: "#2e7d32" }}>
        ₹ {fmt(totalVal)}
      </TableCell>

      <TableCell>
        <Chip
          label={stockLevel.label}
          size="small"
          color={stockLevel.color}
          sx={{ fontSize: "11px", height: 22, fontWeight: 600 }}
        />
      </TableCell>

      <TableCell sx={{ fontSize: "12px", color: "text.secondary", whiteSpace: "nowrap" }}>
        {formatBatchNo(product.production_order?.batch_no)}
      </TableCell>

      <TableCell sx={{ fontSize: "12px", color: "text.secondary", whiteSpace: "nowrap" }}>
        {formatDate(product.created_at)}
      </TableCell>
    </TableRow>
  );
});

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SemiFurnishedInventory() {
  const dispatch = useDispatch();
  const { data: products = [], loading, error } = useSelector(
    (state) => state.semiFurnishedProduct
  );

  const [search, setSearch]       = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(getSemiFunishedProducts());
    dispatch(getSemiProductLogs());
  }, [dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(getSemiFunishedProducts());
    setRefreshing(false);
  }, [dispatch]);

  // ── All derived values in ONE useMemo pass ────────────────────────────────
  // Avoids 4 separate reduce() calls over the same array
  const { filtered, totalQty, totalValue, lowStock } = useMemo(() => {
    const q = search.trim().toLowerCase();

    let tQty = 0, tVal = 0, low = 0;
    const fil = [];

    for (const p of products) {
      tQty += p.qty ?? 0;
      tVal += rowValue(p);
      if (p.qty > 0 && p.qty <= 10) low++;
      if (!q || p.name?.toLowerCase().includes(q)) fil.push(p);
    }

    return { filtered: fil, totalQty: tQty, totalValue: tVal, lowStock: low };
  }, [products, search]);

  // Filtered totals (footer) — only recalculate when filtered changes
  const { filteredQty, filteredValue } = useMemo(() => ({
    filteredQty:   filtered.reduce((s, p) => s + (p.qty ?? 0), 0),
    filteredValue: filtered.reduce((s, p) => s + rowValue(p), 0),
  }), [filtered]);

  return (
    <Container disableGutters sx={{ maxWidth: "100% !important", mb: 4 }}>

      {/* ── Header ── */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 36, height: 36, borderRadius: 1,
              backgroundColor: "#e3f0ff",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#1976d2",
            }}
          >
            <MdInventory2 size={20} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>
              Semi-Furnished Inventory
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Track all semi-finished product stock
            </Typography>
          </Box>
        </Box>

        <Tooltip title="Refresh">
          <span>
            <IconButton onClick={handleRefresh} disabled={refreshing || loading} size="small">
              {refreshing ? <CircularProgress size={18} /> : <MdRefresh size={20} />}
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* ── Summary Cards ── */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
        <SummaryCard icon={<HiCube size={20} />}        label="Total SKUs"        value={products.length}                           accent="#1976d2" />
        <SummaryCard icon={<MdInventory2 size={20} />}  label="Total Quantity"    value={totalQty.toLocaleString("en-IN")}           accent="#2e7d32" />
        <SummaryCard icon={<TbCurrencyRupee size={20} />} label="Inventory Value" value={`₹ ${fmt(totalValue)}`}                    accent="#7b1fa2" />
        <SummaryCard icon={<MdInventory2 size={20} />}  label="Low Stock Items"   value={lowStock}                                  accent="#ed6c02" />
      </Box>

      {/* ── Error ── */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load inventory. Please try refreshing.
        </Alert>
      )}

      {/* ── Table Card ── */}
      <Card variant="outlined" sx={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
        <CardContent sx={{ pb: "16px !important" }}>

          {/* Toolbar */}
          <Box sx={{ mb: 2, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.secondary" }}>
              {loading ? "Loading…" : `${filtered.length} product${filtered.length !== 1 ? "s" : ""}`}
            </Typography>
            <TextField
              size="small"
              placeholder="Search by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MdSearch size={18} color="#999" />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 260 }}
            />
          </Box>

          <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e8e8e8", borderRadius: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  {TABLE_HEADERS.map((col) => (
                    <TableCell
                      key={col}
                      sx={{ fontWeight: 700, fontSize: "12px", color: "#555", whiteSpace: "nowrap", py: 1.2 }}
                    >
                      {col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }, (_, i) => <SkeletonRow key={i} />)
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={TABLE_HEADERS.length} align="center" sx={{ py: 5 }}>
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, color: "text.secondary" }}>
                        <HiCube size={36} opacity={0.3} />
                        <Typography variant="body2">
                          {search ? "No products match your search" : "No semi-furnished products found"}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((product, index) => (
                    <ProductRow key={product.id} product={product} index={index} />
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Footer totals */}
          {!loading && filtered.length > 0 && (
            <Box
              sx={{
                mt: 1.5, px: 2, py: 1,
                backgroundColor: "#f5f5f5",
                borderRadius: 1,
                display: "flex", justifyContent: "flex-end", gap: 4,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Total Qty:{" "}
                <span style={{ color: "#1976d2" }}>
                  {filteredQty.toLocaleString("en-IN")}
                </span>
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Total Value:{" "}
                <span style={{ color: "#2e7d32" }}>₹ {fmt(filteredValue)}</span>
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}