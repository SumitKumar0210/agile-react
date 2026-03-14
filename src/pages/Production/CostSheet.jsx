import * as React from "react";
import { useRef, useEffect, useMemo } from "react";
import { Typography, Grid, Paper, Box, IconButton, Tooltip } from "@mui/material";
import { FiPrinter } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { getCostsheet } from "./slice/costSheetSlice";
import ImagePreviewDialog from "../../components/ImagePreviewDialog/ImagePreviewDialog";
import Profile from "../../assets/images/profile.jpg";

// ─── Shared table styles ──────────────────────────────────────────────────────

const tableStyle = { width: "100%", borderCollapse: "collapse", fontSize: "11px" };

const thStyle = {
    border: "1px solid #c0c0c0",
    backgroundColor: "#f0f0f0",
    padding: "4px 6px",
    fontWeight: 700,
    textAlign: "left",
};

const tdStyle = { border: "1px solid #c0c0c0", padding: "3px 6px" };

const sectionTitle = {
    backgroundColor: "#e8e8e8",
    fontWeight: 700,
    textAlign: "center",
    padding: "4px",
    border: "1px solid #c0c0c0",
    fontSize: "12px",
    letterSpacing: "0.5px",
};

// ─── Component ────────────────────────────────────────────────────────────────

const CostSheet = () => {
    const tableContainerRef = useRef(null);
    const dispatch = useDispatch();
    const { id } = useParams();
    const mediaUrl = import.meta.env.VITE_MEDIA_URL;

    const { data = {} } = useSelector((s) => s.costSheet);

    // materies comes as { "GroupName": [...items], ... } from Laravel's groupBy
    const materiesRaw = data.materies ?? {};
    const materiesGrouped = useMemo(
        () => Object.entries(materiesRaw), // [ ["CONSUMABLES", [...]], ["PAINT & POLISH", [...]], ... ]
        [materiesRaw]
    );
    const workSheets = data.workSheet ?? [];
    const rrp = data.rrp ?? {};

    useEffect(() => {
        dispatch(getCostsheet(id));
    }, [dispatch, id]);

    // ── Derived totals (computed from live data) ──────────────────────────────
    const materialTotal = useMemo(
        () =>
            materiesGrouped.reduce((total, [, items]) =>
                total + items.reduce((sum, r) => sum + (r.qty ?? 0) * (r.material?.price ?? 0), 0),
                0
            ),
        [materiesGrouped]
    );

    const labourTotal = useMemo(
        () => workSheets.reduce(
            (sum, r) => sum + (Number(r.per_hour_cost ?? 0) * (Number(r.total_minutes) / 60)),
            0
        ),
        [workSheets]
    );

    const subTotal = materialTotal + labourTotal;
    const overHead = Number(rrp.miscellaneous ?? 0);
    const grossProfitPct = Number(rrp.gross_profit ?? 0); // 12 (%)
    const grossProfitAmount = Number(rrp.gross_profit_amount ?? 0); // 14232
    const grandTotal = subTotal + overHead + grossProfitAmount;

    // ── Print handler ─────────────────────────────────────────────────────────
    const handlePrint = () => {
        if (!tableContainerRef.current) return;
        const printContents = tableContainerRef.current.innerHTML;
        const originalContents = document.body.innerHTML;
        document.body.innerHTML = `<html><body style="font-family:Arial,sans-serif;padding:16px">${printContents}</body></html>`;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload();
    };

    // ── Product info rows config ──────────────────────────────────────────────
    const productInfoRows = [
        { label: "Model No", value: data.modelNo },
        { label: "PRODUCTION ID", value: data.productionID },
        { label: "ITEM NAME", value: data.productName },
        { label: "START DATE", value: data.startDate },
        { label: "DATE OF DELIVERY", value: data.endDate },
        { label: "COMPLETE DATE", value: data.completeDate },
        { label: "QTY", value: data.qty },
        { label: "PER UNIT", value: data.perUnit },
        { label: "Customer Name", value: data.customerName },
        { label: "Product Type", value: data.productType },
    ];

    const rrpRows = [
        { label: "MATERIAL COST", value: Number(materialTotal).toFixed(2) },
        { label: "LABOUR CHARGE", value: Number(labourTotal).toFixed(2) },
        { label: "SUB TOTAL", value: Number(subTotal).toFixed(2), bold: true },
        { label: "OVER HEAD CHARGES", value: Number(overHead).toFixed(2) },
        { label: `GROSS PROFIT (${grossProfitPct}%)`, value: Number(grossProfitAmount).toFixed(2) },
    ];

    return (
        <Grid container spacing={1}>
            <Grid item size={12}>
                <Paper elevation={0} sx={{ width: "100%", overflowX: "auto", backgroundColor: "#fff", p: 2 }}>

                    {/* ── Top Toolbar ── */}
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                        <Typography variant="h6" className="page-title">Cost Sheet</Typography>
                        <Tooltip title="Print">
                            <IconButton onClick={handlePrint}>
                                <FiPrinter size={20} />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    {/* ── Sheet Content ── */}
                    <Box ref={tableContainerRef}>
                        <Typography variant="h6" sx={{ textAlign: "center", fontWeight: 700, mb: 1.5, letterSpacing: 2, fontSize: 15 }}>
                            COST SHEET
                        </Typography>

                        {/* ── Product Info Header ── */}
                        <table style={{ ...tableStyle, marginBottom: 12 }}>
                            <tbody>
                                <tr>
                                    <td rowSpan={productInfoRows.length} style={{ ...tdStyle, width: "22%", verticalAlign: "top", fontWeight: 700, fontSize: 12 }}>
                                        <div style={{ textAlign: "center", fontWeight: 700, marginBottom: 6 }}>{data.productName}</div>
                                        <div style={{ width: "100%", height: 120, border: "1px solid #ccc", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
                                            <ImagePreviewDialog
                                                imageUrl={data.productImage ? mediaUrl + data.productImage : Profile}
                                                alt={data.productName}
                                            />
                                        </div>
                                        <div style={{ textAlign: "center", marginTop: 4 }}>{data.modelNo}</div>
                                    </td>
                                    <td style={{ ...thStyle, width: "22%" }}>{productInfoRows[0].label}</td>
                                    <td style={tdStyle}>{productInfoRows[0].value}</td>
                                </tr>

                                {productInfoRows.slice(1).map((row) => (
                                    <tr key={row.label}>
                                        <td style={thStyle}>{row.label}</td>
                                        <td style={tdStyle}>{row.value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* ── Two-Column Body ── */}
                        <table style={{ ...tableStyle, marginBottom: 0 }}>
                            <tbody>
                                <tr>
                                    {/* LEFT — Materials */}
                                    <td style={{ verticalAlign: "top", width: "48%", paddingRight: 8 }}>
                                        <div style={sectionTitle}>MATERIAL USED</div>

                                        {/* One table per group */}
                                        {materiesGrouped.map(([groupName, items]) => {
                                            const groupTotal = items.reduce(
                                                (sum, r) => sum + (r.qty ?? 0) * (r.material?.price ?? 0), 0
                                            );
                                            return (
                                                <table key={groupName} style={{ ...tableStyle, marginTop: 10 }}>
                                                    <thead>
                                                        <tr><td colSpan={4} style={sectionTitle}>{groupName}</td></tr>
                                                        <tr>
                                                            <th style={thStyle}>ITEM NAME</th>
                                                            <th style={{ ...thStyle, textAlign: "right" }}>QTY</th>
                                                            <th style={{ ...thStyle, textAlign: "right" }}>PRICE</th>
                                                            <th style={{ ...thStyle, textAlign: "right" }}>AMOUNT</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {items.map((r, i) => {
                                                            const amount = (r.qty ?? 0) * (r.material?.price ?? 0);
                                                            return (
                                                                <tr key={i}>
                                                                    <td style={tdStyle}>{r.material?.name}</td>
                                                                    <td style={{ ...tdStyle, textAlign: "right" }}>{r.qty}</td>
                                                                    <td style={{ ...tdStyle, textAlign: "right" }}>{r.material?.price}</td>
                                                                    <td style={{ ...tdStyle, textAlign: "right" }}>{Number(amount).toFixed(2)}</td>
                                                                </tr>
                                                            );
                                                        })}
                                                        <tr>
                                                            <td colSpan={3} style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>
                                                                {groupName} Total
                                                            </td>
                                                            <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>
                                                                {Number(groupTotal).toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            );
                                        })}

                                        {/* Grand material total across all groups */}
                                        <table style={{ ...tableStyle, marginTop: 4 }}>
                                            <tbody>
                                                <tr style={{ backgroundColor: "#f0f0f0" }}>
                                                    <td colSpan={3} style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>
                                                        MATERIAL TOTAL
                                                    </td>
                                                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>
                                                        {Number(materialTotal).toFixed(2)}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>

                                    {/* RIGHT — Labour + RRP */}
                                    <td style={{ verticalAlign: "top", width: "52%", paddingLeft: 8 }}>

                                        {/* Labour Cost */}
                                        <table style={{ ...tableStyle, marginBottom: 12 }}>
                                            <thead>
                                                <tr><td colSpan={5} style={sectionTitle}>LABOUR COST</td></tr>
                                                <tr>
                                                    <th style={thStyle}>DEPARTMENT</th>
                                                    <th style={thStyle}>NAME</th>
                                                    <th style={{ ...thStyle, textAlign: "right" }}>PAY PER HOUR</th>
                                                    <th style={{ ...thStyle, textAlign: "right" }}>NO. OF HOUR</th>
                                                    <th style={{ ...thStyle, textAlign: "right" }}>TOTAL</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {workSheets.map((r, i) => {
                                                    const hours = Number(r.total_minutes) / 60;
                                                    const total = Number(r.per_hour_cost ?? 0) * hours;
                                                    return (
                                                        <tr key={i}>
                                                            <td style={tdStyle}>{r.department_name ?? "—"}</td>
                                                            <td style={tdStyle}>{r.labour_name}</td>
                                                            <td style={{ ...tdStyle, textAlign: "right" }}>{Number(r.per_hour_cost).toFixed(2)}</td>
                                                            <td style={{ ...tdStyle, textAlign: "right" }}>{hours.toFixed(2)}</td>
                                                            <td style={{ ...tdStyle, textAlign: "right" }}>{total.toFixed(2)}</td>
                                                        </tr>
                                                    );
                                                })}
                                                <tr>
                                                    <td colSpan={4} style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>TOTAL</td>
                                                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>{Number(labourTotal).toFixed(2)}</td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        {/* RRP Calculation */}
                                        <table style={tableStyle}>
                                            <thead>
                                                <tr><td colSpan={2} style={sectionTitle}>RRP CALCULATION</td></tr>
                                            </thead>
                                            <tbody>
                                                {rrpRows.map(({ label, value, bold }) => (
                                                    <tr key={label}>
                                                        <td style={{ ...tdStyle, fontWeight: bold ? 700 : "normal" }}>{label}</td>
                                                        <td style={{ ...tdStyle, textAlign: "right", fontWeight: bold ? 700 : "normal" }}>{value}</td>
                                                    </tr>
                                                ))}
                                                <tr style={{ backgroundColor: "#f0f0f0" }}>
                                                    <td style={{ ...tdStyle, fontWeight: 700 }}>TOTAL</td>
                                                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>{Number(grandTotal).toFixed(2)}</td>
                                                </tr>
                                            </tbody>
                                        </table>

                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </Box>
                </Paper>
            </Grid>
        </Grid>
    );
};

export default CostSheet;