import * as React from "react";
import { useRef, useEffect } from "react";
import {
  Typography,
  Grid,
  Paper,
  Box,
  Button,
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";

// ─── Static Data ────────────────────────────────────────────────────────────

const productInfo = {
  modelNo: "DIMS000",
  productionId: "DIMS000@P4692",
  itemName: "CONSOLE REPAIR",
  startDate: "15-11-2025",
  dateOfDelivery: "25-11-2025",
  completeDate: "10-02-2026",
  qty: "1.00",
  perUnit: "21433",
  customerName: "",
  productType: "REPAIR",
  storeDealer: "M/S DIMENSION",
  grade: "CONSOLE",
};

const consumables = [
  { name: "SANDING DISC GIRT 120", qty: 10, price: 15.14, amount: 151.4 },
  { name: "SANDING DISC GIRT 220", qty: 17, price: 15.14, amount: 257.38 },
  { name: "SANDING DISC GIRT 320", qty: 14, price: 15.14, amount: 211.96 },
  { name: "SANDING DISC GIRT 400", qty: 14, price: 15.14, amount: 211.96 },
  { name: "SANDING DISC GIRT 600", qty: 14, price: 15.14, amount: 211.96 },
  { name: "SANDING DISC GIRT 800", qty: 14, price: 15.14, amount: 211.96 },
  { name: "SANDING DISC GIRT 1000", qty: 14, price: 15.14, amount: 211.96 },
  { name: "SANDING DISC GIRT 1500", qty: 14, price: 15.14, amount: 211.96 },
  { name: "SANDING DISC GIRT 80", qty: 10, price: 15.14, amount: 151.4 },
];
const consumablesTotal = 1831.94;

const paintPolish = [
  { name: "WHITE DHOTI", qty: 6, price: 15.5, amount: 93 },
  { name: "DRY ROLL 514C P 220 4INCHX50 MTR STARCKE", qty: 0.02, price: 1450, amount: 29 },
  { name: "DRY ROLL 514C P 120 4INCHX50 MTR STARCKE", qty: 0.02, price: 1450, amount: 29 },
  { name: "DRY ROLL 514C P 320 4INCHX50 MTR STARCKE", qty: 0.02, price: 1450, amount: 29 },
  { name: "EMERY PAPER GIRT1000(AC768)", qty: 4, price: 14.42, amount: 57.68 },
  { name: "EMERY PAPER GIRT1500(AC768)", qty: 4, price: 14.42, amount: 57.68 },
  { name: "NC THINNER", qty: 3, price: 60, amount: 180 },
  { name: "UNICO POLYSTER CLEAR TOP COAT 20 KG PACK SIRCA", qty: 5, price: 324, amount: 1620 },
  { name: "POLYSTER THINNER 1000 NO SIRCA", qty: 0.5, price: 130, amount: 65 },
];
const paintPolishTotal = 2160.36;

const labourDeptWise = [
  { department: "CARPENTRY", days: 0.5, total: 275 },
  { department: "PAINT & POLISH", days: 9, total: 8165.5 },
  { department: "STONE", days: 1, total: 9000 },
];
const labourDeptTotal = 17440.5;

const labourCost = [
  { dept: "CARPENTRY", team: "459 MAKHANCU SHARMA ( C )", payPerDay: 550, days: 0.5, total: 275 },
  { dept: "PAINT & POLISH", team: "479 SATENDRA YADAV (P)", payPerDay: 773, days: 0.5, total: 386.5 },
  { dept: "PAINT & POLISH", team: "405 VIPIN RAJ ( P )", payPerDay: 1080, days: 4.5, total: 4860 },
  { dept: "PAINT & POLISH", team: "449 ROHIT KUMAR ( P )", payPerDay: 717, days: 2, total: 1434 },
  { dept: "PAINT & POLISH", team: "393 MAHTAB ALAM ( P )", payPerDay: 670, days: 0.5, total: 335 },
  { dept: "STONE", team: "STONE CONTRACTOR (RAJ KUMAR)", payPerDay: 9000, days: 1, total: 9000 },
  { dept: "PAINT & POLISH", team: "453 SURAJ KUMAR ( P )", payPerDay: 720, days: 1, total: 720 },
  { dept: "PAINT & POLISH", team: "274 RAVINDRA ( P )", payPerDay: 860, days: 0.5, total: 430 },
];
const labourCostTotal = 17440.5;

const materialCost = [
  { category: "CONSUMABLE", qty: 121, amount: 1832 },
  { category: "INDIRECT PAINT", qty: 17.52, amount: 482 },
  { category: "DIRECT PAINT", qty: 5.04, amount: 1678 },
];
const materialCostTotal = 3992.3;

const rrpCalc = {
  materialCost: 3992.3,
  labourCharge: 17440.5,
  subTotal: 21432.8,
  overHeadCharges: 0.0,
  grossProfit: 0.0,
  total: 21433.0,
};

// ─── Shared table styles ─────────────────────────────────────────────────────

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "11px",
};

const thStyle = {
  border: "1px solid #c0c0c0",
  backgroundColor: "#f0f0f0",
  padding: "4px 6px",
  fontWeight: 700,
  textAlign: "left",
};

const tdStyle = {
  border: "1px solid #c0c0c0",
  padding: "3px 6px",
};

const sectionTitle = {
  backgroundColor: "#e8e8e8",
  fontWeight: 700,
  textAlign: "center",
  padding: "4px",
  border: "1px solid #c0c0c0",
  fontSize: "12px",
  letterSpacing: "0.5px",
};

// ─── Component ───────────────────────────────────────────────────────────────

const CostSheet = () => {
  const tableContainerRef = useRef(null);

  const handlePrint = () => {
    if (!tableContainerRef.current) return;
    const printContents = tableContainerRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = `<html><body style="font-family:Arial,sans-serif;padding:16px">${printContents}</body></html>`;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  const downloadCSV = () => {
    const rows = [
      ["Section", "Item", "QTY", "Price/Rate", "Amount/Total"],
      ...consumables.map((r) => ["CONSUMABLES", r.name, r.qty, r.price, r.amount]),
      ["CONSUMABLES", "TOTAL", "", "", consumablesTotal],
      ...paintPolish.map((r) => ["PAINT & POLISH", r.name, r.qty, r.price, r.amount]),
      ["PAINT & POLISH", "TOTAL", "", "", paintPolishTotal],
      ...labourDeptWise.map((r) => ["LABOUR DEPT WISE", r.department, r.days, "", r.total]),
      ["LABOUR DEPT WISE", "TOTAL", "", "", labourDeptTotal],
      ...labourCost.map((r) => ["LABOUR COST", `${r.dept} - ${r.team}`, r.days, r.payPerDay, r.total]),
      ["LABOUR COST", "TOTAL", "", "", labourCostTotal],
      ...materialCost.map((r) => ["MATERIAL COST", r.category, r.qty, "", r.amount]),
      ["MATERIAL COST", "TOTAL", "", "", materialCostTotal],
      ["RRP", "Material Cost", "", "", rrpCalc.materialCost],
      ["RRP", "Labour Charge", "", "", rrpCalc.labourCharge],
      ["RRP", "Sub Total", "", "", rrpCalc.subTotal],
      ["RRP", "Over Head Charges", "", "", rrpCalc.overHeadCharges],
      ["RRP", "Gross Profit", "", "", rrpCalc.grossProfit],
      ["RRP", "TOTAL", "", "", rrpCalc.total],
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "CostSheet_DIMS000.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Grid container spacing={1}>
      <Grid item size={12}>
        <Paper
          elevation={0}
          sx={{ width: "100%", overflowX: "auto", backgroundColor: "#fff", p: 2 }}
        >
          {/* ── Top Toolbar ── */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Typography variant="h6" className="page-title">
              Cost Sheet
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Tooltip title="Print">
                <IconButton onClick={handlePrint}>
                  <FiPrinter size={20} />
                </IconButton>
              </Tooltip>
              {/* <Tooltip title="Download CSV">
                <IconButton onClick={downloadCSV}>
                  <BsCloudDownload size={20} />
                </IconButton>
              </Tooltip> */}
            </Box>
          </Box>

          {/* ── Sheet Content ── */}
          <Box ref={tableContainerRef}>
            {/* Title */}
            <Typography
              variant="h6"
              sx={{ textAlign: "center", fontWeight: 700, mb: 1.5, letterSpacing: 2, fontSize: 15 }}
            >
              COST SHEET
            </Typography>

            {/* ── Product Info Header ── */}
            <table style={{ ...tableStyle, marginBottom: 12 }}>
              <tbody>
                <tr>
                  <td
                    rowSpan={12}
                    style={{
                      ...tdStyle,
                      width: "22%",
                      verticalAlign: "top",
                      fontWeight: 700,
                      fontSize: 12,
                    }}
                  >
                    <div style={{ textAlign: "center", fontWeight: 700, marginBottom: 6 }}>
                      CONSOLE REPAIR
                    </div>
                    {/* Placeholder image area */}
                    <div
                      style={{
                        width: "100%",
                        height: 120,
                        background: "#f5f5f5",
                        border: "1px solid #ccc",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#aaa",
                        fontSize: 11,
                        marginBottom: 6,
                      }}
                    >
                      [Product Image]
                    </div>
                    <div style={{ textAlign: "center", marginTop: 4 }}>DIMS000</div>
                  </td>
                  <td style={{ ...thStyle, width: "22%" }}>Model No</td>
                  <td style={{ ...tdStyle }}>{productInfo.modelNo}</td>
                </tr>
                <tr>
                  <td style={thStyle}>PRODUCTION ID</td>
                  <td style={tdStyle}>{productInfo.productionId}</td>
                </tr>
                <tr>
                  <td style={thStyle}>ITEM NAME</td>
                  <td style={tdStyle}>{productInfo.itemName}</td>
                </tr>
                <tr>
                  <td style={thStyle}>START DATE</td>
                  <td style={tdStyle}>{productInfo.startDate}</td>
                </tr>
                <tr>
                  <td style={thStyle}>DATE OF DELIVERY</td>
                  <td style={tdStyle}>{productInfo.dateOfDelivery}</td>
                </tr>
                <tr>
                  <td style={thStyle}>COMPLETE DATE</td>
                  <td style={tdStyle}>{productInfo.completeDate}</td>
                </tr>
                <tr>
                  <td style={thStyle}>QTY</td>
                  <td style={tdStyle}>{productInfo.qty}</td>
                </tr>
                <tr>
                  <td style={thStyle}>PER UNIT</td>
                  <td style={tdStyle}>{productInfo.perUnit}</td>
                </tr>
                <tr>
                  <td style={thStyle}>Customer Name</td>
                  <td style={tdStyle}>{productInfo.customerName}</td>
                </tr>
                <tr>
                  <td style={thStyle}>Product Type</td>
                  <td style={tdStyle}>{productInfo.productType}</td>
                </tr>
                <tr>
                  <td style={thStyle}>Store/Dealer</td>
                  <td style={tdStyle}>{productInfo.storeDealer}</td>
                </tr>
                <tr>
                  <td style={thStyle}>GRADE</td>
                  <td style={tdStyle}>{productInfo.grade}</td>
                </tr>
              </tbody>
            </table>

            {/* ── Two-Column Body ── */}
            <table style={{ ...tableStyle, marginBottom: 0 }}>
              <tbody>
                <tr>
                  {/* LEFT COLUMN */}
                  <td style={{ verticalAlign: "top", width: "48%", paddingRight: 8 }}>
                    {/* Material Used header */}
                    <div style={sectionTitle}>MATERIAL USED</div>

                    {/* Consumables */}
                    <table style={{ ...tableStyle, marginTop: 10 }}>
                      <thead>
                        <tr>
                          <td colSpan={4} style={sectionTitle}>CONSUMABLES</td>
                        </tr>
                        <tr>
                          <th style={thStyle}>ITEM NAME</th>
                          <th style={{ ...thStyle, textAlign: "right" }}>QTY</th>
                          <th style={{ ...thStyle, textAlign: "right" }}>PRICE</th>
                          <th style={{ ...thStyle, textAlign: "right" }}>AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {consumables.map((r, i) => (
                          <tr key={i}>
                            <td style={tdStyle}>{r.name}</td>
                            <td style={{ ...tdStyle, textAlign: "right" }}>{r.qty}</td>
                            <td style={{ ...tdStyle, textAlign: "right" }}>{r.price}</td>
                            <td style={{ ...tdStyle, textAlign: "right" }}>{r.amount}</td>
                          </tr>
                        ))}
                        <tr>
                          <td colSpan={3} style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>
                            Total
                          </td>
                          <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>
                            {consumablesTotal}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Paint & Polish */}
                    <table style={{ ...tableStyle, marginTop: 12 }}>
                      <thead>
                        <tr>
                          <td colSpan={4} style={sectionTitle}>PAINT &amp; POLISH</td>
                        </tr>
                        <tr>
                          <th style={thStyle}>ITEM NAME</th>
                          <th style={{ ...thStyle, textAlign: "right" }}>QTY</th>
                          <th style={{ ...thStyle, textAlign: "right" }}>PRICE</th>
                          <th style={{ ...thStyle, textAlign: "right" }}>AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paintPolish.map((r, i) => (
                          <tr key={i}>
                            <td style={tdStyle}>{r.name}</td>
                            <td style={{ ...tdStyle, textAlign: "right" }}>{r.qty}</td>
                            <td style={{ ...tdStyle, textAlign: "right" }}>{r.price}</td>
                            <td style={{ ...tdStyle, textAlign: "right" }}>{r.amount}</td>
                          </tr>
                        ))}
                        <tr>
                          <td colSpan={3} style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>
                            Total
                          </td>
                          <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>
                            {paintPolishTotal}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>

                  {/* RIGHT COLUMN */}
                  <td style={{ verticalAlign: "top", width: "52%", paddingLeft: 8 }}>

                    {/* Labour Cost Dept Wise */}
                    <table style={{ ...tableStyle, marginBottom: 12 }}>
                      <thead>
                        <tr>
                          <td colSpan={3} style={sectionTitle}>LABOUR COST DEPARTMENT WISE</td>
                        </tr>
                        <tr>
                          <th style={thStyle}>DEPARTMENT</th>
                          <th style={{ ...thStyle, textAlign: "right" }}>NO.OF DAYS</th>
                          <th style={{ ...thStyle, textAlign: "right" }}>TOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {labourDeptWise.map((r, i) => (
                          <tr key={i}>
                            <td style={tdStyle}>{r.department}</td>
                            <td style={{ ...tdStyle, textAlign: "right" }}>{r.days}</td>
                            <td style={{ ...tdStyle, textAlign: "right" }}>{r.total}</td>
                          </tr>
                        ))}
                        <tr>
                          <td colSpan={2} style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>
                            TOTAL
                          </td>
                          <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>
                            {labourDeptTotal}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Labour Cost Detail */}
                    <table style={{ ...tableStyle, marginBottom: 12 }}>
                      <thead>
                        <tr>
                          <td colSpan={5} style={sectionTitle}>LABOUR COST</td>
                        </tr>
                        <tr>
                          <th style={thStyle}>DEPARTMENT</th>
                          <th style={thStyle}>TEAM</th>
                          <th style={{ ...thStyle, textAlign: "right" }}>PAY PER DAY</th>
                          <th style={{ ...thStyle, textAlign: "right" }}>NO. OF DAYS</th>
                          <th style={{ ...thStyle, textAlign: "right" }}>TOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {labourCost.map((r, i) => (
                          <tr key={i}>
                            <td style={tdStyle}>{r.dept}</td>
                            <td style={tdStyle}>{r.team}</td>
                            <td style={{ ...tdStyle, textAlign: "right" }}>{r.payPerDay}</td>
                            <td style={{ ...tdStyle, textAlign: "right" }}>{r.days}</td>
                            <td style={{ ...tdStyle, textAlign: "right" }}>{r.total}</td>
                          </tr>
                        ))}
                        <tr>
                          <td colSpan={4} style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>
                            TOTAL
                          </td>
                          <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>
                            {labourCostTotal}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Material Cost */}
                    <table style={{ ...tableStyle, marginBottom: 12 }}>
                      <thead>
                        <tr>
                          <td colSpan={3} style={sectionTitle}>MATERIAL COST</td>
                        </tr>
                        <tr>
                          <th style={thStyle}>CATEGORY</th>
                          <th style={{ ...thStyle, textAlign: "right" }}>QTY</th>
                          <th style={{ ...thStyle, textAlign: "right" }}>AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {materialCost.map((r, i) => (
                          <tr key={i}>
                            <td style={tdStyle}>{r.category}</td>
                            <td style={{ ...tdStyle, textAlign: "right" }}>{r.qty}</td>
                            <td style={{ ...tdStyle, textAlign: "right" }}>{r.amount}</td>
                          </tr>
                        ))}
                        <tr>
                          <td colSpan={2} style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>
                            TOTAL
                          </td>
                          <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>
                            {materialCostTotal}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* RRP Calculation */}
                    <table style={tableStyle}>
                      <thead>
                        <tr>
                          <td colSpan={2} style={sectionTitle}>RRP CALCULATION</td>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={tdStyle}>MATERIAL COST + ADDITION(0.00)</td>
                          <td style={{ ...tdStyle, textAlign: "right" }}>{rrpCalc.materialCost}</td>
                        </tr>
                        <tr>
                          <td style={tdStyle}>LABOUR CHARGE + ADDITION(0.00)</td>
                          <td style={{ ...tdStyle, textAlign: "right" }}>{rrpCalc.labourCharge}</td>
                        </tr>
                        <tr>
                          <td style={{ ...tdStyle, fontWeight: 700 }}>SUB TOTAL</td>
                          <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>
                            {rrpCalc.subTotal}
                          </td>
                        </tr>
                        <tr>
                          <td style={tdStyle}>OVER HEAD CHARGES</td>
                          <td style={{ ...tdStyle, textAlign: "right" }}>{rrpCalc.overHeadCharges.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td style={tdStyle}>GROSS PROFIT</td>
                          <td style={{ ...tdStyle, textAlign: "right" }}>{rrpCalc.grossProfit.toFixed(2)}</td>
                        </tr>
                        <tr style={{ backgroundColor: "#f0f0f0" }}>
                          <td style={{ ...tdStyle, fontWeight: 700 }}>TOTAL</td>
                          <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>
                            {rrpCalc.total.toFixed(2)}
                          </td>
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