import React, { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Button,
    Grid,
    Paper,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Logo from "../../assets/images/logo.svg";
import { useLocation } from "react-router-dom";
import { getJobDetails } from "../../pages/Production/slice/productionChainSlice";
import { useDispatch } from "react-redux";


// ─── Theme ────────────────────────────────────────────────────────────────────
const theme = createTheme({
    typography: {
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        fontSize: 14,
    },
    palette: {
        primary: { main: "#7B3B1A" },
        secondary: { main: "#F5F0EB" },
    },
});

// ─── Constants ────────────────────────────────────────────────────────────────
const BROWN = "#7B3B1A";
const CREAM = "#F5F0EB";
const GOLD = "#C8861A";
const LIGHT_BROWN = "#EDE3D8";

// ─── Sub-components ───────────────────────────────────────────────────────────
const SectionHeader = ({ children }) => (
    <Box sx={{ bgcolor: BROWN, px: 2, py: 1, borderRadius: "4px 4px 0 0" }}>
        <Typography
            sx={{
                color: "#fff",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
            }}
        >
            {children}
        </Typography>
    </Box>
);

const SectionBox = ({ children, sx = {} }) => (
    <Box
        sx={{
            border: `1px solid ${LIGHT_BROWN}`,
            borderTop: "none",
            borderRadius: "0 0 4px 4px",
            mb: 2,
            ...sx,
        }}
    >
        {children}
    </Box>
);

const LabelValue = ({ label, value, sx = {} }) => (
    <Box sx={{ px: 2, py: 1.2, ...sx }}>
        <Typography
            sx={{
                fontSize: "9px",
                color: "#999",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                mb: 0.4,
            }}
        >
            {label}
        </Typography>
        <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#1a1a1a" }}>
            {value}
        </Typography>
    </Box>
);

// ─── Data ─────────────────────────────────────────────────────────────────────
const jobData = {
    company: "Agile",
    subtitle: "Factory Management System",
    shop: "CARPENTRY",
    jobCode: "JC-0847-CAR",
    poNo: "PO-2026-0847",
    issueDate: "10 Mar 2026",
    dueDate: "22 Mar 2026",
    orderQty: "12 units",
    product: {
        modelNo: "SF-CHE-003",
        name: "Chesterfield 3-Seater Sofa",
        category: "Upholstered Seating",
        dimensions: "W 2100 × D 900 × H 800 mm",
        finish: "Dark Walnut / Grey Velvet",
        unitWeight: "68 kg",
        customer: "Nilkamal Home Solutions",
        salesOrder: "SO-4521",
    },
    materials: [
        { id: 1, code: "RM001", description: "Teak Wood Plank 6ft", qtyUnit: 4, totalQty: 48, unit: "pcs" },
        { id: 2, code: "RM004", description: "MDF Board 8×4 18mm", qtyUnit: 1, totalQty: 12, unit: "pcs" },
        { id: 3, code: "RM006", description: "Dowel Pin 8mm Oak", qtyUnit: 24, totalQty: 288, unit: "pcs" },
    ],
    instructions: [
        "All joints to use dowel + PVA glue. No staples on visible frame.",
        "Ensure all edges are sanded smooth before passing to next shop.",
    ],
    qcItems: [
        "Frame dimensions within ±2mm tolerance",
        "All joints flush & secure",
        "No visible cracks or splits",
        "Surface sanded smooth",
    ],
    finishSpecs: [
        {
            component: "Exposed Timber Frame & Legs",
            type: "PU Lacquer",
            color: "Dark Walnut",
            code: "DW-308",
            sheen: "Matt",
            method: "Spray",
            coats: 2,
            dry: "4 hrs",
            prep: "Sand to 180 grit, tack cloth before each coat",
        },
        {
            component: "Internal Frame (Non-visible)",
            type: "Wood Stain",
            color: "Mahogany Brown",
            code: "MB-112",
            sheen: "-",
            method: "Brush",
            coats: 1,
            dry: "2 hrs",
            prep: "Sand to 120 grit, dust off",
        },
        {
            component: "Upholstery Fabric",
            type: "Fabric Protector",
            color: "N/A",
            code: "",
            sheen: "-",
            method: "Spray",
            coats: 1,
            dry: "30 min",
            prep: "Fabric fully stretched before application",
        },
    ],
};

// ─── Printable Document ───────────────────────────────────────────────────────
const PrintableJobCard = React.forwardRef((props, ref) => {
    const { data, productDetail } = props;
    const qcChecklist = productDetail.qcChecklist || [];
    const finishSpecs = productDetail.finishSpecs || [];
    const product = productDetail.product || [];
    const department = product.department || [];
    const [jobDetails, setJobDetails] = useState(null);
    const dispatch = useDispatch();
    const logo = localStorage.getItem("logo")??'';
    const companyName = localStorage.getItem("application_name")??'';
    useEffect(() => {

        const fetchJobDetails = async () => {
            try {
                const res = await dispatch(getJobDetails(product.id)).unwrap();
                setJobDetails(res);
                // console.log("this is res:", res);
            } catch (error) {
                console.error("Error fetching job details:", error);
            }
        };

        if (product?.id) {
            fetchJobDetails();
        }

    }, [product?.id]);

    const tentative_items = jobDetails?.tentiveItems || [];;

    console.log("this is job details:", product);
    return (
        <Box
            ref={ref}
            sx={{
                width: "210mm",
                minHeight: "297mm",
                mx: "auto",
                bgcolor: "#fff",
                fontFamily: "'DM Sans', sans-serif",
                color: "#1a1a1a",
                p: "9mm",
                boxSizing: "border-box",
                "@media print": {
                    width: "210mm",
                    minHeight: "297mm",
                    p: "9mm",
                    boxShadow: "none",
                },
            }}
        >
            {/* ── HEADER ── */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    mb: 2.5,
                    pb: 2,
                    borderBottom: `2px solid ${LIGHT_BROWN}`,
                }}
            >
                {/* Logo + Company */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                        sx={{
                            width: 56,
                            // height: 46,
                            // bgcolor: BROWN,
                            // borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            overflow: "hidden"
                        }}
                    >
                        <Box
                            component="img"
                            src={logo ?? Logo}  // 👈 replace with your logo path
                            alt="Company Logo"
                            sx={{
                                width: "80%",
                                height: "80%",
                                objectFit: "contain"
                            }}
                        />
                    </Box>

                    <Box>
                        <Typography
                            sx={{
                                fontWeight: 700,
                                fontSize: "18px",
                                color: BROWN,
                                letterSpacing: "0.04em"
                            }}
                        >
                            {companyName ?? data.company}
                        </Typography>

                        <Typography sx={{ fontSize: "12px", color: "#444" }}>
                            {data.subtitle}
                        </Typography>
                    </Box>
                </Box>

                {/* Shop badge */}
                <Box sx={{ textAlign: "center" }}>
                    <Box
                        sx={{
                            border: `2.5px solid ${BROWN}`,
                            borderRadius: "5px",
                            px: 2.5,
                            py: 0.8,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 1,
                        }}
                    >
                        {/* <Box sx={{ width: 3, height: 18, bgcolor: BROWN, borderRadius: "2px" }} /> */}
                        <Typography sx={{ fontWeight: 700, fontSize: "13px", color: BROWN, letterSpacing: "0.1em" }}>
                            {department?.name ?? data.shop}
                        </Typography>
                    </Box>
                    {/* <Typography sx={{ fontSize: "12px", color: "#444", mt: 0.6 }}>{data.jobCode}</Typography> */}
                </Box>

                {/* PO Details */}
                {/* { label: "Due Date", value: data.dueDate, highlight: true }, */}
                <Box>
                    {[
                        { label: "PO No", value: jobDetails?.poNumber ?? "N/A" },
                        { label: "Issue Date", value: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) },
                        { label: "Order Qty", value: product.qty ?? data.orderQty },
                    ].map(({ label, value, highlight }) => (
                        <Box key={label} sx={{ display: "flex", gap: 1.5, mb: 0.5, alignItems: "baseline" }}>
                            <Typography sx={{ fontSize: "12px", color: "#444", width: 72 }}>{label}</Typography>
                            <Typography sx={{ fontSize: "12px", fontWeight: 700, color: highlight ? GOLD : "#1a1a1a" }}>
                                {value}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            </Box>

            {/* ── PRODUCT DETAILS ── */}
            <SectionHeader>Product Details</SectionHeader>
            <SectionBox>
                <Grid container sx={{ borderBottom: `1px solid ${LIGHT_BROWN}` }}>
                    <Grid item xs={3} sx={{ borderRight: `1px solid ${LIGHT_BROWN}` }}>
                        <LabelValue label="Model No." value={product.product.model} />
                    </Grid>
                    <Grid item xs={5} sx={{ borderRight: `1px solid ${LIGHT_BROWN}` }}>
                        <LabelValue label="Product Name" value={product.product.name} />
                    </Grid>
                    <Grid item xs={4}>
                        <LabelValue label="Category" sx={{ borderRight: `1px solid ${LIGHT_BROWN}` }} value={jobDetails?.productType ?? "N/A"} />
                    </Grid>
                    <Grid item xs={3} sx={{ borderRight: `1px solid ${LIGHT_BROWN}` }}>
                        <LabelValue label="Dimensions" value={product.product.size} />
                    </Grid>
                    <Grid item xs={4}>
                        <LabelValue label="Customer" sx={{ borderRight: `1px solid ${LIGHT_BROWN}` }} value={jobDetails?.customerName} />
                    </Grid>
                    <Grid item xs={3} >
                        <LabelValue label="Sales Order" value={data.product.salesOrder} />
                    </Grid>
                </Grid>
                <Grid container sx={{ borderBottom: `1px solid ${LIGHT_BROWN}` }}>
                    {/* <Grid item xs={3} sx={{ borderRight: `1px solid ${LIGHT_BROWN}` }}>
                        <LabelValue label="Dimensions" value={product.product.size} />
                    </Grid> */}
                    {/* <Grid item xs={3} sx={{ borderRight: `1px solid ${LIGHT_BROWN}` }}>
            <LabelValue label="Finish" value={data.product.finish} />
          </Grid>
          <Grid item xs={2} sx={{ borderRight: `1px solid ${LIGHT_BROWN}` }}>
            <LabelValue label="Unit Weight" value={data.product.unitWeight} />
          </Grid> */}
                    {/* <Grid item xs={4}>
                        <LabelValue label="Customer" sx={{ borderRight: `1px solid ${LIGHT_BROWN}` }} value={jobDetails?.customerName} />
                    </Grid>
                    <Grid item xs={3} sx={{ borderRight: `1px solid ${LIGHT_BROWN}` }}>
                        <LabelValue label="Sales Order" value={data.product.salesOrder} />
                    </Grid> */}
                </Grid>
                {/* <Grid container>
          <Grid item xs={4}>
            <LabelValue label="Sales Order" value={data.product.salesOrder} />
          </Grid>
        </Grid> */}
            </SectionBox>

            {/* ── MATERIALS ── */}
            <SectionHeader>Materials – Carpentry Shop</SectionHeader>
            <SectionBox>
                <Table
                    size="small"
                    sx={{
                        "& td, & th": {
                            py: 1,
                            px: 2,
                            fontSize: "12px",
                            border: "none",
                        },
                    }}
                >
                    <TableHead>
                        <TableRow sx={{ bgcolor: CREAM }}>
                            {["#", "Item Code", "Description", "Qty/Unit", "Unit", "Issued", "Checked"].map((h) => (
                                <TableCell
                                    key={h}
                                    sx={{
                                        fontWeight: 700,
                                        fontSize: "10px",
                                        letterSpacing: "0.06em",
                                        textTransform: "uppercase",
                                        color: "#555",
                                        borderBottom: `1px solid ${LIGHT_BROWN} !important`,
                                    }}
                                >
                                    {h}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {tentative_items.map((row, i) => (

                            <TableRow key={row.id} sx={{ bgcolor: i % 2 === 0 ? "#fff" : "#faf7f4", borderBottom: `1px solid ${LIGHT_BROWN}` }}>
                                <TableCell sx={{ color: "#444", fontSize: "12px" }}>{row.id}</TableCell>
                                <TableCell sx={{ color: BROWN, fontWeight: 600, textDecoration: "underline", fontSize: "12px" }}>
                                    {row.hsn_code}
                                </TableCell>
                                <TableCell sx={{ fontWeight: 500, fontSize: "12px" }}>{row.material_name}</TableCell>
                                <TableCell sx={{ textAlign: "center", fontSize: "12px" }}>{row.qty}</TableCell>
                                <TableCell sx={{ fontSize: "12px" }}>{row.uom}</TableCell>
                                <TableCell>
                                    <Box sx={{ borderBottom: "1px solid #ccc", width: 64, mt: 0.5 }} />
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ borderBottom: "1px solid #ccc", width: 64, mt: 0.5 }} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </SectionBox>

            {/* ── FINISH SPECIFICATIONS ── */}
            <SectionHeader>Finish Specifications</SectionHeader>

            <SectionBox>
                <Table
                    size="small"
                    sx={{
                        "& td, & th": {
                            py: 1,
                            px: 1.5,
                            fontSize: "11px",
                            border: "none",
                        },
                    }}
                >
                    <TableHead>
                        <TableRow sx={{ bgcolor: CREAM }}>
                            {[
                                "Component",
                                "Type",
                                "Colour / Code",
                                "Sheen",
                                "Method",
                                // "Coats",
                                // "Dry Time",
                                // "Surface Prep",
                                "Checked",
                            ].map((h) => (
                                <TableCell
                                    key={h}
                                    sx={{
                                        fontWeight: 700,
                                        fontSize: "10px",
                                        letterSpacing: "0.06em",
                                        textTransform: "uppercase",
                                        borderBottom: `1px solid ${LIGHT_BROWN}`,
                                        color: "#555",
                                    }}
                                >
                                    {h}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {finishSpecs.map((row, i) => (
                            <TableRow
                                key={i}
                                sx={{
                                    borderBottom: `1px solid ${LIGHT_BROWN}`,
                                    bgcolor: i % 2 ? "#faf7f4" : "#fff",
                                }}
                            >
                                <TableCell sx={{ fontWeight: 600 }}>{row.component}</TableCell>

                                <TableCell>
                                    <Box
                                        sx={{
                                            bgcolor: BROWN,
                                            color: "#fff",
                                            fontSize: "9px",
                                            px: 1,
                                            py: 0.3,
                                            borderRadius: "2px",
                                            display: "inline-block",
                                        }}
                                    >
                                        {row.type ?? row.finish_type}
                                    </Box>
                                </TableCell>

                                <TableCell>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <Box
                                            sx={{
                                                width: 8,
                                                height: 8,
                                                bgcolor: "#4b2a16",
                                                borderRadius: "50%",
                                            }}
                                        />
                                        <Typography sx={{ fontSize: "11px" }}>
                                            {row.color ?? row.colour_name}
                                        </Typography>

                                        {row.code && (
                                            <Box
                                                sx={{
                                                    bgcolor: "#eee",
                                                    px: 0.7,
                                                    py: 0.2,
                                                    fontSize: "9px",
                                                    borderRadius: "2px",
                                                }}
                                            >
                                                {row.code ?? row.colour_code}
                                            </Box>
                                        )}
                                    </Box>
                                </TableCell>

                                <TableCell>{row.sheen}</TableCell>
                                <TableCell>{row.method}</TableCell>

                                {/* <TableCell sx={{ textAlign: "center", fontWeight: 700 }}>
                  {row.coats}
                </TableCell>

                <TableCell>{row.dry}</TableCell>

                <TableCell sx={{ fontSize: "10px", color: "#555" }}>
                  {row.prep}
                </TableCell> */}

                                <TableCell>
                                    <Box sx={{ borderBottom: "1px solid #ccc", width: 60 }} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </SectionBox>
            {/* ── QC CHECKLIST ── */}
            <SectionHeader>QC Checklist</SectionHeader>
            <SectionBox>
                {qcChecklist.map((item, i) => (
                    <Box
                        key={i}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            px: 2,
                            py: 1.2,
                            borderBottom: i < qcChecklist.length - 1 ? `1px solid ${LIGHT_BROWN}` : "none",
                        }}
                    >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Box
                                sx={{
                                    width: 15,
                                    height: 15,
                                    border: `1.5px solid #bbb`,
                                    borderRadius: "2px",
                                    flexShrink: 0,
                                }}
                            />
                            <Typography sx={{ fontSize: "12px" }}>{item.checklist}</Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography sx={{ fontSize: "9px", color: "#aaa", letterSpacing: "0.08em", lineHeight: 1 }}>SIGN</Typography>
                            <Box
                                sx={{
                                    borderBottom: "1px solid #ccc",
                                    width: 72,
                                    mt: "auto",
                                }}
                            />
                        </Box>
                    </Box>
                ))}
            </SectionBox>

            {/* ── OPERATOR SIGN-OFF ── */}
            <SectionHeader>Operator Sign-Off</SectionHeader>
            <SectionBox>
                <Grid container sx={{ px: 2, py: 1.5 }}>
                    {["Operator Name", "Start Time", "End Time", "Supervisor Sign-Off", "Date"].map((label) => (
                        <Grid size="grow" key={label}>
                            <Typography
                                sx={{
                                    fontSize: "10px",
                                    color: "#999",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.08em",
                                    mb: 0.5,
                                    textAlign: "center"
                                }}
                            >
                                {label}
                            </Typography>

                            <Box
                                sx={{
                                    borderBottom: "1px solid #444",
                                    width: "90%",
                                    mt: 3,
                                }}
                            />
                        </Grid>
                    ))}
                </Grid>
            </SectionBox>

            {/* ── FOOTER ── */}
            {/* <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: 1.5,
                    pt: 1,
                    borderTop: `1px solid ${LIGHT_BROWN}`,
                }}
            >
                <Typography sx={{ fontSize: "10px", color: "#aaa" }}>
                    {data.poNo} • {data.product.modelNo} • Carpentry
                </Typography>
                <Typography sx={{ fontSize: "10px", color: "#aaa" }}>{data.jobCode}</Typography>
                <Typography sx={{ fontSize: "10px", color: "#aaa" }}>Page 1 of 1</Typography>
            </Box> */}
        </Box>
    );
});

PrintableJobCard.displayName = "PrintableJobCard";

// ─── Main Component ───────────────────────────────────────────────────────────
export default function JobCardPrint() {
    const printRef = useRef(null);

    const location = useLocation();
    const data = location.state;
    

    // react-to-print v3 uses contentRef; v2 uses content: () => ref.current
    // Both are provided for compatibility
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        content: () => printRef.current,
        documentTitle: `Job Card - ${jobData.jobCode}`,
        pageStyle: `
      @page {
        size: A4 portrait;
        margin: 0mm;
      }
      @media print {
        html, body {
          height: 297mm;
          width: 210mm;
        }
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
      }
    `,
    });

    return (
        <ThemeProvider theme={theme}>
            {/* Toolbar — hidden on print */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    //   px: 3,
                    //   py: 1.5,
                    //   bgcolor: CREAM,
                    //   borderBottom: `2px solid ${LIGHT_BROWN}`,
                    "@media print": { display: "none" },
                }}
            >
                <Box>
                    <Typography sx={{ fontSize: "18px", fontWeight: 500 }}>
                        Job Card Preview
                    </Typography>
                    {/* <Typography sx={{ fontSize: "12px", color: "#444" }}>
                        {jobData.jobCode} · {jobData.shop}
                    </Typography> */}
                </Box>
                <Button
                    variant="contained"
                    color="warning"
                    startIcon={<PrintIcon />}
                    onClick={() => handlePrint()}

                >
                    Print Job Card
                </Button>
            </Box>

            {/* Page preview wrapper */}
            <Box
                sx={{
                    //   bgcolor: "#d8d0c8",
                    px: 4,
                    py: 2,
                    minHeight: "calc(100vh - 64px)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "flex-start",
                    "@media print": { p: 0, bgcolor: "#fff" },
                }}
            >
                <Paper
                    elevation={8}
                    sx={{
                        borderRadius: "5px",
                        overflow: "hidden",
                        width: "210mm",
                        "@media print": { boxShadow: "none", borderRadius: 0 },
                    }}
                >
                    <PrintableJobCard ref={printRef} data={jobData} productDetail={data} />
                </Paper>
            </Box>
        </ThemeProvider>
    );
}