import React, { useState, useRef, useEffect, useMemo } from "react";
import Grid from "@mui/material/Grid";
import {
  Button,
  Typography,
  Card,
  CardContent,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { AiOutlinePrinter } from "react-icons/ai";
import { MdEdit, MdDownload } from "react-icons/md";
import { useReactToPrint } from "react-to-print";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import api from "../../api";
import ImagePreviewDialog from "../../components/ImagePreviewDialog/ImagePreviewDialog";
import { useAuth } from "../../context/AuthContext";

const PublicQuoteDetailsView = () => {
  const { link } = useParams();
  const navigate = useNavigate();
  const contentRef = useRef(null);
  const { appDetails } = useAuth();

  const imageUrl = import.meta.env.VITE_MEDIA_URL;

  // Get app details from localStorage (since this is public route)
  const appLogo = localStorage.getItem("logo") || "";
  const appName = localStorage.getItem("application_name") || "Company Name";

  // State management
  const [quotationDetails, setQuotationDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approving, setApproving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editReason, setEditReason] = useState("");
  const [submittingEditRequest, setSubmittingEditRequest] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Print handler with A4 styling
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Quote_${quotationDetails?.batch_no || "Invoice"}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 10mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .no-print {
          display: none !important;
        }
      }
    `,
  });

  // Parse items from quotation details
  const items = useMemo(() => {
    if (!quotationDetails?.product_ids) return [];

    try {
      const parsedItems = JSON.parse(quotationDetails.product_ids);
      return parsedItems.map((item) => ({
        id: item.id || `${Date.now()}-${Math.random()}`,
        group: item.group || "",
        name: item.name || "",
        itemCode: item.model || "",
        qty: parseInt(item.qty, 10) || 0,
        size: item.size || "",
        documents: item.document
          ? typeof item.document === "string"
            ? imageUrl + item.document
            : imageUrl + (item.document?.name || "")
          : "",
        cost: parseFloat(item.cost) || 0,
        unitPrice: parseFloat(item.unitPrice) || 0,
        narration: item.narration || "",
      }));
    } catch (error) {
      console.error("Error parsing product_ids:", error);
      return [];
    }
  }, [quotationDetails, imageUrl]);

  // Get unique groups/areas
  const uniqueAreas = useMemo(() => {
    return [...new Set(items.map((item) => item.group))].filter(Boolean);
  }, [items]);

  // Calculate totals
  const calculations = useMemo(() => {
    const subTotal = items.reduce((sum, item) => sum + item.cost, 0);
    const discount = parseFloat(quotationDetails?.discount || 0);
    const additionalCharges = parseFloat(quotationDetails?.additional_charges || 0);
    const gstRate = parseFloat(quotationDetails?.gst_rate || 0);
    const afterDiscount = subTotal - discount + additionalCharges;
    const gstAmount = (afterDiscount * gstRate) / 100;
    const grandTotal = afterDiscount + gstAmount;

    return {
      subTotal,
      discount,
      additionalCharges,
      gstRate,
      gstAmount,
      grandTotal,
    };
  }, [items, quotationDetails]);

  // Fetch Quotation Details
  const fetchQuotationDetails = async () => {
    if (!link) {
      setError("Invalid quotation link");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.post(`get-customer-quotation`, { link });

      if (!response.data) {
        throw new Error("No data received from server");
      }
      setQuotationDetails(response.data.data);
    } catch (err) {
      console.error("Error fetching quotation:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch quotation";
      setError(errorMessage);
      setSnackbar({
        open: true,
        message: `Error: ${errorMessage}`,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Approve Quotation 
  const approveQuotation = async () => {
    if (!quotationDetails?.id) {
      setSnackbar({
        open: true,
        message: "Invalid quotation ID",
        severity: "error",
      });
      return;
    }

    try {
      setApproving(true);

      const response = await api.post(`by-customer-status-update`, {
        id: quotationDetails.id,
      });

      // Update state immediately after successful response
      setQuotationDetails((prev) => ({
        ...prev,
        status: "2", // Set to approved status
        approved_at: new Date().toISOString(),
      }));

      setSnackbar({
        open: true,
        message: "Quotation approved successfully!",
        severity: "success",
      });

      // Fetch updated details from server
      await fetchQuotationDetails();

      return response.data;
    } catch (err) {
      console.error("Error approving quotation:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to approve quotation";
      setSnackbar({
        open: true,
        message: `Error approving: ${errorMessage}`,
        severity: "error",
      });
    } finally {
      setApproving(false);
    }
  };

  // Submit Edit Request 
  const submitEditRequest = async () => {
    if (!editReason.trim()) {
      setSnackbar({
        open: true,
        message: "Please enter a valid reason",
        severity: "error",
      });
      return;
    }

    try {
      setSubmittingEditRequest(true);

      const response = await api.post("/edit-request", {
        quotation_id: quotationDetails.id,
        reason: editReason,
      });

      // Update status to edit requested (status "3")
      setQuotationDetails((prev) => ({
        ...prev,
        status: "3", // Set to edit requested status
        edit_requested_at: new Date().toISOString(),
      }));

      setSnackbar({
        open: true,
        message: "Edit request sent successfully!",
        severity: "success",
      });

      handleCloseEditDialog();
      setEditReason("");

      // Fetch updated details from server
      await fetchQuotationDetails();

    } catch (error) {
      console.error("Edit request error:", error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.message || "Failed to send edit request",
        severity: "error",
      });
    } finally {
      setSubmittingEditRequest(false);
    }
  };

  useEffect(() => {
  if (!quotationDetails) return;
  const el = document.getElementById("contentBox");
  if (el?.parentElement) {
    el.parentElement.style.width = "100%";
  }
}, [quotationDetails]);

useEffect(() => {
  fetchQuotationDetails();
}, [link]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const handleApprove = () => {
    approveQuotation();
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // ----- Edit Request Handling -----

  const handleEditRequest = () => {
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditReason("");
  };

  const handleSubmitEditRequest = async () => {
    if (!editReason.trim()) return;

    try {
      setSubmittingEditRequest(true);

      const response = await api.post("quotation-edit-request", {
        quotation_id: quotationDetails.id,
        reason: editReason,
      });

      setSnackbar({
        open: true,
        message: "Edit request submitted successfully!",
        severity: "success",
      });

      setEditDialogOpen(false);
      setEditReason("");
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to submit edit request",
        severity: "error",
      });
    } finally {
      setSubmittingEditRequest(false);
    }
  };

  // ----- Download PDF -----

  const waitForImagesToLoad = () => {
    return new Promise((resolve) => {
      const images = contentRef.current?.querySelectorAll("img") || [];
      let loaded = 0;

      if (images.length === 0) {
        resolve();
        return;
      }

      images.forEach((img) => {
        if (img.complete) {
          loaded++;
          if (loaded === images.length) resolve();
        } else {
          img.onload = () => {
            loaded++;
            if (loaded === images.length) resolve();
          };
          img.onerror = () => {
            loaded++;
            if (loaded === images.length) resolve();
          };
        }
      });
    });
  };

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;

    try {
      setDownloading(true);

      // ⭐ Ensure all images (logo included) are fully loaded
      await waitForImagesToLoad();

      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true, // ⭐ important for remote images
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = 210;
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pageWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pdfHeight);
      pdf.save(`Quote_${quotationDetails?.batch_no || "Invoice"}.pdf`);
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#f5f5f5",
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error && !quotationDetails) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          minHeight: "100wh",
          backgroundColor: "#f5f5f5",
          gap: 2,
          p: 2,
        }}
      >
        <Typography variant="h6" color="error" align="center">
          Error Loading Quotation
        </Typography>
        <Typography variant="body2" align="center">{error}</Typography>
      </Box>
    );
  }

  if (!quotationDetails) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#f5f5f5",
          gap: 2,
        }}
      >
        <Typography variant="h6">No Quotation Found</Typography>
      </Box>
    );
  }

  return (
    <Box id="contentBox"
      sx={{ backgroundColor: "#f5f5f5", minHeight: "100vh", maxWidth: "100vw", py: { xs: 2, md: 3 } }}>
      <Box sx={{ maxWidth: { xs: "100%", md: "210mm" }, margin: "0 auto", px: { xs: 1, sm: 2 } }}>
        {/* Action Buttons - No Print */}
        <Box
          className="no-print"
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 1,
            mb: 2,
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="outlined"
            color="primary"
            startIcon={<MdEdit />}
            onClick={handleEditRequest}
            disabled={
              approving ||
              submittingEditRequest ||
              quotationDetails?.status == "2" ||
              quotationDetails?.status == "3"
            }
            size="small"
            sx={{ minWidth: { xs: "100px", sm: "120px" } }}
          >
            {submittingEditRequest ? (
              <CircularProgress size={20} color="inherit" />
            ) : quotationDetails?.status === "3" ? (
              "Edit Requested"
            ) : (
              "Edit Request"
            )}
          </Button>

          <Button
            variant="contained"
            color="success"
            onClick={handleApprove}
            disabled={
              approving ||
              submittingEditRequest ||
              quotationDetails?.status == "2" ||
              quotationDetails?.status == "3"
            }
            size="small"
            sx={{ minWidth: { xs: "100px", sm: "120px" } }}
          >
            {approving ? (
              <CircularProgress size={20} color="inherit" />
            ) : quotationDetails?.status === "2" ? (
              "Approved"
            ) : (
              "Approve"
            )}
          </Button>

          <Button
            variant="outlined"
            color="secondary"
            startIcon={<MdDownload />}
            onClick={handleDownloadPDF}
            disabled={downloading}
            size="small"
            sx={{ minWidth: { xs: "100px", sm: "120px" } }}
          >
            {downloading ? <CircularProgress size={20} /> : "Download"}
          </Button>
          <Button
            variant="contained"
            color="warning"
            startIcon={<AiOutlinePrinter />}
            onClick={handlePrint}
            size="small"
            sx={{ minWidth: { xs: "100px", sm: "120px" } }}
          >
            Print
          </Button>
        </Box>

        {/* A4 Page Container */}
        <Box
          ref={contentRef}
          sx={{
            backgroundColor: "#fff",
            boxShadow: { xs: "none", sm: "0 0 10px rgba(0,0,0,0.1)" },
            width: "100%",
            maxWidth: "210mm",
            padding: { xs: "15px", sm: "20px", md: "15mm" },
            margin: "0 auto",
            "@media print": {
              boxShadow: "none",
              margin: 0,
              padding: "15mm",
            },
          }}
        >
          {/* Header with Logo */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              borderBottom: "2px solid #333",
              pb: 2,
              mb: 3,
              gap: 2,
            }}
          >
            <Box>
              {appLogo ? (
                <img
                  src={appLogo}
                  alt={appName}
                  style={{
                    height: "50px",
                    maxWidth: "150px",
                    objectFit: "contain"
                  }}
                />
              ) : (
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: "1rem", sm: "1.25rem" } }}>
                  {appName}
                </Typography>
              )}
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#333", fontSize: { xs: "1.25rem", sm: "1.75rem" }, lineHeight: 1.2 }}>
                QUOTATION
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, mt: 0.5 }}>
                #{quotationDetails.batch_no || "N/A"}
              </Typography>
            </Box>
          </Box>

          {/* Quote Info Bar */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 2,
              mb: 3,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "0.65rem", sm: "0.7rem" }, display: "block", mb: 0.5 }}>
                Quote Date
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                {formatDate(quotationDetails.created_at)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "0.65rem", sm: "0.7rem" }, display: "block", mb: 0.5 }}>
                Delivery Date
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                {formatDate(quotationDetails.delivery_date)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "0.65rem", sm: "0.7rem" }, display: "block", mb: 0.5 }}>
                Priority
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                {quotationDetails.priority || "Normal"}
              </Typography>
            </Box>
          </Box>

          {/* From and To Section */}
          <Box sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: { xs: 2, sm: 3 },
            mb: 3
          }}>
            {/* From Section */}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  mb: 1,
                  color: "#666",
                  textTransform: "uppercase",
                  fontSize: { xs: "0.7rem", sm: "0.75rem" },
                  letterSpacing: 0.5
                }}
              >
                FROM:
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.6, fontSize: { xs: "0.7rem", sm: "0.8rem" } }}>
                <strong style={{ fontSize: { xs: "0.75rem", sm: "0.85rem" } }}>{appDetails.application_name}</strong>
                <br />
                {appDetails.company_address}
                <br />
                GSTIN: {appDetails.gst_no}
              </Typography>
            </Box>

            {/* To Section */}
            {quotationDetails.customer && (
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    mb: 1,
                    color: "#666",
                    textTransform: "uppercase",
                    fontSize: { xs: "0.7rem", sm: "0.75rem" },
                    letterSpacing: 0.5
                  }}
                >
                  TO:
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.6, fontSize: { xs: "0.7rem", sm: "0.8rem" } }}>
                  <strong style={{ fontSize: { xs: "0.75rem", sm: "0.85rem" } }}>{quotationDetails.customer.name}</strong>
                  <br />
                  {quotationDetails.customer.address}
                  <br />
                  {quotationDetails.customer.city},{" "}
                  {quotationDetails.customer.state?.name}{" "}
                  {quotationDetails.customer.zip_code}
                  {/* <br />
                  Mobile: {quotationDetails.customer.mobile}
                  <br />
                  Email: {quotationDetails.customer.email} */}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Items by Group */}
          {uniqueAreas.length > 0 ? (
            uniqueAreas.map((area) => (
              <Box key={area} sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    backgroundColor: "#e9ecef",
                    padding: { xs: "6px 10px", sm: "8px 12px" },
                    borderRadius: 1,
                    mb: 1.5,
                    fontSize: { xs: "0.8rem", sm: "0.9rem" },
                  }}
                >
                  {area}
                </Typography>

                {/* Responsive Table */}
                <Box sx={{ overflowX: "auto", mb: 2 }}>
                  <table style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "0.75rem",
                    minWidth: "100%"
                  }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f8f9fa" }}>
                        <th style={{
                          padding: "8px 6px",
                          border: "1px solid #dee2e6",
                          textAlign: "left",
                          fontWeight: 600,
                          fontSize: "0.7rem",
                          whiteSpace: "nowrap"
                        }}>
                          Item Name
                        </th>
                        <th style={{
                          padding: "8px 6px",
                          border: "1px solid #dee2e6",
                          textAlign: "left",
                          fontWeight: 600,
                          fontSize: "0.7rem",
                          whiteSpace: "nowrap"
                        }}>
                          Code
                        </th>
                        <th style={{
                          padding: "8px 6px",
                          border: "1px solid #dee2e6",
                          textAlign: "center",
                          fontWeight: 600,
                          fontSize: "0.7rem",
                          whiteSpace: "nowrap"
                        }}>
                          Qty
                        </th>
                        <th style={{
                          padding: "8px 6px",
                          border: "1px solid #dee2e6",
                          textAlign: "left",
                          fontWeight: 600,
                          fontSize: "0.7rem",
                          whiteSpace: "nowrap"
                        }}>
                          Size
                        </th>
                        <th style={{
                          padding: "8px 6px",
                          border: "1px solid #dee2e6",
                          textAlign: "right",
                          fontWeight: 600,
                          fontSize: "0.7rem",
                          whiteSpace: "nowrap"
                        }}>
                          Unit Price
                        </th>
                        <th style={{
                          padding: "8px 6px",
                          border: "1px solid #dee2e6",
                          textAlign: "right",
                          fontWeight: 600,
                          fontSize: "0.7rem",
                          whiteSpace: "nowrap"
                        }}>
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items
                        .filter((item) => item.group === area)
                        .map((item) => (
                          <tr key={item.id}>
                            <td style={{
                              padding: "8px 6px",
                              border: "1px solid #dee2e6",
                              fontSize: "0.7rem"
                            }}>
                              {item.name}
                            </td>
                            <td style={{
                              padding: "8px 6px",
                              border: "1px solid #dee2e6",
                              fontSize: "0.7rem"
                            }}>
                              {item.itemCode}
                            </td>
                            <td style={{
                              padding: "8px 6px",
                              border: "1px solid #dee2e6",
                              textAlign: "center",
                              fontSize: "0.7rem"
                            }}>
                              {item.qty}
                            </td>
                            <td style={{
                              padding: "8px 6px",
                              border: "1px solid #dee2e6",
                              fontSize: "0.7rem"
                            }}>
                              {item.size}
                            </td>
                            <td style={{
                              padding: "8px 6px",
                              border: "1px solid #dee2e6",
                              textAlign: "right",
                              fontSize: "0.7rem"
                            }}>
                              ₹{item.unitPrice.toLocaleString("en-IN")}
                            </td>
                            <td style={{
                              padding: "8px 6px",
                              border: "1px solid #dee2e6",
                              textAlign: "right",
                              fontWeight: 600,
                              fontSize: "0.7rem"
                            }}>
                              ₹{item.cost.toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </Box>
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: "center", py: 3, fontSize: "0.8rem" }}>
              No items found in this quotation
            </Typography>
          )}

          {/* Bottom Section: Terms and Totals */}
          <Box sx={{ mt: 3 }}>
            {/* Order Terms */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: "0.75rem", sm: "0.85rem" }, textTransform: "uppercase", color: "#666" }}>
                Order Terms:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: { xs: "0.7rem", sm: "0.75rem" },
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                }}
              >
                {quotationDetails.order_terms || "No order terms specified"}
              </Typography>
            </Box>

            {/* Totals - Right Aligned */}
            <Box sx={{
              display: "flex",
              justifyContent: "flex-end",
              mt: 3
            }}>
              <Box sx={{ minWidth: { xs: "100%", sm: "300px" }, maxWidth: "400px" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.75, fontSize: { xs: "0.75rem", sm: "0.85rem" }, borderBottom: "1px solid #e0e0e0" }}>
                  <span>Sub Total:</span>
                  <span>₹{calculations.subTotal.toLocaleString("en-IN")}</span>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.75, fontSize: { xs: "0.75rem", sm: "0.85rem" }, borderBottom: "1px solid #e0e0e0" }}>
                  <span>Discount:</span>
                  <span>₹{calculations.discount.toLocaleString("en-IN")}</span>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.75, fontSize: { xs: "0.75rem", sm: "0.85rem" }, borderBottom: "1px solid #e0e0e0" }}>
                  <span>Additional Charges:</span>
                  <span>₹{calculations.additionalCharges.toLocaleString("en-IN")}</span>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.75, fontSize: { xs: "0.75rem", sm: "0.85rem" }, borderBottom: "1px solid #e0e0e0" }}>
                  <span>GST ({calculations.gstRate}%):</span>
                  <span>₹{calculations.gstAmount.toLocaleString("en-IN")}</span>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    pt: 1.5,
                    fontWeight: 700,
                    fontSize: { xs: "0.95rem", sm: "1.1rem" },
                    color: "#333"
                  }}
                >
                  <span>Grand Total:</span>
                  <span>₹{calculations.grandTotal.toLocaleString("en-IN")}</span>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Edit Request Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Request</DialogTitle>

        <Divider />

        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please provide a reason for requesting changes:
          </Typography>

          <TextField
            autoFocus
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            label="Reason for Edit Request"
            value={editReason}
            onChange={(e) => setEditReason(e.target.value)}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button
            onClick={submitEditRequest}
            variant="contained"
            color="primary"
            disabled={submittingEditRequest || !editReason.trim()}
          >
            {submittingEditRequest ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Submit Request"
            )}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default PublicQuoteDetailsView;