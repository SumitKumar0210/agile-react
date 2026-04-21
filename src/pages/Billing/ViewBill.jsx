import React, { useState, useRef, useEffect } from "react";
import Grid from "@mui/material/Grid";
import {
    Button,
    Typography,
    Card,
    CardContent,
    Box,
    CircularProgress,
} from "@mui/material";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { useNavigate, useParams } from "react-router-dom";
import { AiOutlinePrinter } from "react-icons/ai";
import { useReactToPrint } from "react-to-print";
import { useDispatch, useSelector } from "react-redux";
import { fetchBillById, updateBillStatus } from "./slice/billsSlice";
import ImagePreviewDialog from "../../components/ImagePreviewDialog/ImagePreviewDialog";
import { useAuth } from "../../context/AuthContext";

const printStyles = `
  @page {
    size: A4 landscape;
    margin: 10mm;
  }

  @media print {
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      font-family: Arial, sans-serif;
      font-size: 12px;
      color: #000;
    }

    .no-print {
      display: none !important;
    }

    .print-container {
      background: #fff !important;
      padding: 0 !important;
      box-shadow: none !important;
    }

    /* Logo */
    .print-logo {
      display: flex !important;
      justify-content: center !important;
      margin: 0 0 8px 0 !important;
      padding: 0 !important;
    }

    .print-logo img {
      margin: 0 !important;
      padding: 0 !important;
    }

    /* Header row */
    .bill-header-row {
      display: flex !important;
      justify-content: space-between !important;
      align-items: flex-start !important;
      margin-bottom: 12px !important;
    }

    /* From/To section */
    .from-to-section {
      display: flex !important;
      justify-content: space-between !important;
      margin-bottom: 12px !important;
    }

    .from-box, .to-box {
      width: 48% !important;
    }

    /* Table */
    table {
      width: 100% !important;
      border-collapse: collapse !important;
      margin-bottom: 12px !important;
    }

    th, td {
      border: 1px solid #ccc !important;
      padding: 5px 8px !important;
      text-align: left !important;
      font-size: 11px !important;
    }

    th {
      background-color: #f0f0f0 !important;
      font-weight: 600 !important;
    }

    /* Totals */
    .totals-section {
      display: flex !important;
      justify-content: space-between !important;
      align-items: flex-start !important;
      margin-top: 12px !important;
    }

    .order-terms-box {
      width: 48% !important;
    }

    .totals-box {
      width: 40% !important;
    }

    .total-row {
      display: flex !important;
      justify-content: space-between !important;
      padding: 3px 0 !important;
      border-bottom: 1px solid #eee !important;
    }

    .grand-total-row {
      display: flex !important;
      justify-content: space-between !important;
      padding: 4px 0 !important;
      border-top: 2px solid #222 !important;
      font-weight: 600 !important;
      font-size: 13px !important;
    }

    /* Hide image previews in print - show plain img instead */
    .image-preview-dialog {
      display: none !important;
    }

    .print-product-img {
      display: inline-block !important;
      width: 36px !important;
      height: 36px !important;
      object-fit: cover !important;
      vertical-align: middle !important;
      margin-right: 4px !important;
    }
  }
`;

const ViewBill = () => {
    const { id } = useParams();
    const { appDetails } = useAuth();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const contentRef = useRef(null);

    const mediaUrl = import.meta.env.VITE_MEDIA_URL;

    const [items, setItems] = useState([]);
    const [quotationDetails, setQuotationDetails] = useState(null);

    const { selected: billData = {}, loading: billLoading } =
        useSelector((state) => state.bill);

    const logoUrl = localStorage.getItem("logo");

    const handlePrint = useReactToPrint({
        contentRef,
        documentTitle: `Quote_${quotationDetails?.batch_no || "Invoice"}`,
        pageStyle: printStyles,
    });

    useEffect(() => {
        if (id) {
            fetchQuotation(id);
        }
    }, [dispatch, id]);

    const fetchQuotation = (id) => {
        dispatch(fetchBillById(id));
    };

    const handleApprove = async (id) => {
        await dispatch(updateBillStatus(id));
        fetchQuotation(id);
    };

    useEffect(() => {
        if (billData && billData.id) {
            try {
                setItems(billData.product || []);
                setQuotationDetails(billData);
            } catch (error) {
                console.error("Error parsing quotation data:", error);
            }
        }
    }, [billData]);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const subTotal = items.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const discount = parseFloat(quotationDetails?.discount || 0);
    const additionalCharges = parseFloat(quotationDetails?.additional_charges || 0);
    const gstRate = parseFloat(quotationDetails?.gst || 0);
    const afterDiscount = subTotal - discount + additionalCharges;
    const gstAmount = (afterDiscount * gstRate) / 100;
    const grandTotal = afterDiscount + gstAmount;

    if (billLoading || !quotationDetails) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
                <CircularProgress size={60} />
            </Box>
        );
    }

    return (
        <>
            {/* Action Buttons — hidden on print */}
            <Grid
                container
                spacing={2}
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 2 }}
                className="no-print"
            >
                <Grid>
                    <Typography variant="h6">Bill Details</Typography>
                </Grid>
                <Grid>
                    {quotationDetails.status === 1 && quotationDetails.status !== 2 && (
                        <Button
                            variant="contained"
                            color="success"
                            onClick={() => handleApprove(billData.id)}
                            sx={{ mr: 2 }}
                        >
                            Approve
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        color="warning"
                        startIcon={<AiOutlinePrinter />}
                        onClick={handlePrint}
                    >
                        Print
                    </Button>
                </Grid>
            </Grid>

            {/* Printable Content */}
            <Grid container spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Grid size={12}>
                    <div ref={contentRef} className="print-container" style={{ background: "#fff", padding: "20px" }}>
                        <Card>
                            <CardContent>

                                {/* ── Logo (print only, hidden on screen) ── */}
                                <Box
                                    className="print-logo"
                                    sx={{
                                        display: "none",
                                        justifyContent: "center",
                                        mb: 1,
                                        p: 0,
                                    }}
                                >
                                    {logoUrl && (
                                        <img
                                            src={logoUrl}
                                            alt="Logo"
                                            style={{ height: "52px", objectFit: "contain", display: "block" }}
                                        />
                                    )}
                                </Box>

                                {/* ── Header: Invoice No. | Logo (center) | Dates ── */}
                                <Grid size={12} sx={{ pt: 2 }}>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: 2,
                                        }}
                                    >
                                        {/* Left: Invoice No */}
                                        <Typography variant="body1" sx={{ m: 0, flex: 1 }}>
                                            Invoice No. :{" "}
                                            <Box component="span" sx={{ fontWeight: 600 }}>
                                                {quotationDetails.invoice_no || "N/A"}
                                            </Box>
                                        </Typography>

                                        {/* Center: Logo (screen only) */}
                                        {logoUrl && (
                                            <Box
                                                className="no-print"
                                                sx={{ display: "flex", justifyContent: "center", flex: 1 }}
                                            >
                                                <img
                                                    src={logoUrl}
                                                    alt="Logo"
                                                    style={{ height: "52px", objectFit: "contain" }}
                                                />
                                            </Box>
                                        )}

                                        {/* Right: Dates */}
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "flex-end",
                                                gap: 2,
                                                flex: 1,
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            <Typography variant="body1" sx={{ m: 0 }}>
                                                Billing Date:{" "}
                                                <Box component="span" sx={{ fontWeight: 600 }}>
                                                    {formatDate(quotationDetails.date)}
                                                </Box>
                                            </Typography>
                                            <Typography variant="body1" sx={{ m: 0 }}>
                                                Delivery Date:{" "}
                                                <Box component="span" sx={{ fontWeight: 600 }}>
                                                    {formatDate(quotationDetails.delivery_date)}
                                                </Box>
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>

                                {/* ── From / To ── */}
                                <Box
                                    className="from-to-section"
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                        mb: 2,
                                        mt: 1,
                                        gap: 2,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <Box className="from-box" sx={{ width: { xs: "100%", md: "48%" } }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                            From:
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>{appDetails.application_name}</strong>
                                            <br />
                                            {appDetails.gst_no}
                                            <br />
                                            {appDetails.company_address}
                                        </Typography>
                                    </Box>

                                    {quotationDetails.customer && (
                                        <Box className="to-box" sx={{ width: { xs: "100%", md: "48%" }, display: "flex", justifyContent: "center" }}>
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                                    To:
                                                </Typography>
                                                <Typography variant="body2">
                                                    <strong>{quotationDetails.customer.name}</strong>
                                                    <br />
                                                    {quotationDetails.customer.address}
                                                    <br />
                                                    {quotationDetails.customer.city},{" "}
                                                    {quotationDetails.customer.state?.name}{" "}
                                                    {quotationDetails.customer.zip_code}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    )}
                                </Box>

                                {/* ── Items Table ── */}
                                {items.length > 0 && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                                            Bill Items ({items.length})
                                        </Typography>
                                        <Table>
                                            <Thead>
                                                <Tr>
                                                    <Th>Item Name</Th>
                                                    <Th>Item Code</Th>
                                                    <Th>Qty</Th>
                                                    <Th>Size</Th>
                                                    <Th>Unit Price (₹)</Th>
                                                    <Th>Total Cost (₹)</Th>
                                                    <Th>Documents</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {items.map((item) => (
                                                    <Tr key={item.id}>
                                                        <Td>{item.product?.name}</Td>
                                                        <Td>{item.product?.model}</Td>
                                                        <Td>{item.qty}</Td>
                                                        <Td>{item.product?.size}</Td>
                                                        <Td>₹{item.rate}</Td>
                                                        <Td>₹{(item.amount || 0).toLocaleString("en-IN")}</Td>
                                                        <Td>
                                                            {item.product?.image ? (
                                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                                    {/* shown on screen */}
                                                                    <Box className="no-print">
                                                                        <ImagePreviewDialog
                                                                            imageUrl={mediaUrl + item.product?.image}
                                                                            alt={item.product?.name || "Document"}
                                                                        />
                                                                    </Box>
                                                                    {/* shown on print */}
                                                                    <img
                                                                        className="print-product-img"
                                                                        src={mediaUrl + item.product?.image}
                                                                        alt={item.product?.name || "Document"}
                                                                        style={{
                                                                            display: "none", // overridden by @media print
                                                                            width: 36,
                                                                            height: 36,
                                                                            objectFit: "cover",
                                                                        }}
                                                                    />
                                                                    <Typography variant="caption">
                                                                        {item.product?.name || "Document"}
                                                                    </Typography>
                                                                </Box>
                                                            ) : (
                                                                "-"
                                                            )}
                                                        </Td>
                                                    </Tr>
                                                ))}
                                            </Tbody>
                                        </Table>
                                    </Box>
                                )}

                                {/* ── Order Terms + Totals ── */}
                                <Grid size={12} sx={{ mt: 3 }}>
                                    <Box
                                        className="totals-section"
                                        sx={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            width: "100%",
                                            gap: 2,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        {/* Order Terms */}
                                        <Box className="order-terms-box" sx={{ width: "48%", minWidth: "300px" }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                                Order Terms:
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    padding: "8px",
                                                    border: "1px solid #ccc",
                                                    borderRadius: "4px",
                                                    minHeight: "80px",
                                                    whiteSpace: "pre-wrap",
                                                }}
                                            >
                                                {quotationDetails.term_and_condition || "No order terms specified"}
                                            </Typography>
                                        </Box>

                                        {/* Totals */}
                                        <Box
                                            className="totals-box"
                                            sx={{ display: "flex", flexDirection: "column", gap: 1, minWidth: "300px" }}
                                        >
                                            {[
                                                { label: "Sub Total", value: subTotal },
                                                { label: "Discount", value: discount },
                                                { label: "Additional Charges", value: additionalCharges },
                                                { label: `GST (${gstRate}%)`, value: gstAmount },
                                            ].map(({ label, value }) => (
                                                <Box
                                                    key={label}
                                                    className="total-row"
                                                    sx={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        borderBottom: "1px solid #ccc",
                                                        pb: 0.5,
                                                    }}
                                                >
                                                    <span>{label}</span>
                                                    <span>₹{value.toLocaleString("en-IN")}</span>
                                                </Box>
                                            ))}

                                            <Box
                                                className="grand-total-row"
                                                sx={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    borderTop: "2px solid #222",
                                                    mt: 1,
                                                    pt: 0.5,
                                                    fontWeight: "600",
                                                }}
                                            >
                                                <span>Grand Total</span>
                                                <span>₹{grandTotal.toLocaleString("en-IN")}</span>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Grid>

                            </CardContent>
                        </Card>
                    </div>
                </Grid>
            </Grid>
        </>
    );
};

export default ViewBill;