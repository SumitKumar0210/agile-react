import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Button,
  IconButton,
  Tooltip,
  Box,
  CircularProgress,
} from "@mui/material";
import { AiOutlineLink } from "react-icons/ai";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EmailIcon from "@mui/icons-material/Email";
import CloseIcon from "@mui/icons-material/Close";
import { useDispatch, useSelector } from "react-redux";
import {
  generateLink,
  getLink,
  clearLinkData,
} from "./slice/linkManagementSlice";
import { sendQuotationMail } from "../../pages/Customer/slice/quotationSlice";
import { successMessage, errorMessage } from "../../toast";

const URL = import.meta.env.VITE_FRONTEND_BASE_URL;

const LinkGenerator = ({ id, customerId }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.link);

  const [openGenerate, setOpenGenerate] = useState(false);
  const [expiryDays, setExpiryDays] = useState(1);
  const [currentLink, setCurrentLink] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const prefix = URL + "quotation/";

  // Check if link already exists
  const handleGenerateableId = async () => {
    setOpenGenerate(true);
    setCurrentLink(null);

    try {
      const result = await dispatch(getLink({ id,entity: "quotation" })).unwrap();
      setCurrentLink(result.link);
      
      // Optionally show message that link already exists
      if (result.link) {
        successMessage(result.successMessage || result.message || "Link already exists");
      }
    } catch (error) {
      setCurrentLink(null);
      // Only show error if it's not a "not found" error
      if (error.errorMessage || error.message) {
        errorMessage(error.errorMessage || error.message);
      }
    }
  };

  // Generate link when form submitted
  const handleExpirySubmit = async () => {
    setIsGenerating(true);
    try {
      const result = await dispatch(
        generateLink({ id, expiry_days: expiryDays, entity: "quotation" })
      ).unwrap();
      setCurrentLink(result.link);
      
      // Show success notification
      successMessage(result.successMessage || result.message || "Link generated successfully!");
    } catch (error) {
      console.error("Generate link failed:", error);
      errorMessage(error.errorMessage || error.message || "Failed to generate link");
    } finally {
      setIsGenerating(false);
    }
  };

  // Send mail with quotation link
  const handleSendMail = async () => {
    if (!customerId) {
      errorMessage("Customer ID not found");
      return;
    }

    if (!currentLink) {
      errorMessage("Please generate a link first");
      return;
    }

    setIsSending(true);

    try {
      const formData = new FormData();
      formData.append("quotation_id", id);
      formData.append("customer_id", customerId);
      console.log(formData);

      const response = await dispatch(sendQuotationMail(formData)).unwrap();

      // Show success message
      // successMessage(response.successMessage || response.message || "Quotation sent successfully to customer!");
      handleClose();
    } catch (error) {
      // Show error message
      errorMessage(error.errorMessage || error.message || "Failed to send quotation");
    } finally {
      setIsSending(false);
    }
  };

  // Close modal
  const handleClose = () => {
    if (!isSending && !isGenerating) {
      setOpenGenerate(false);
      setCurrentLink(null);
      setExpiryDays(1);
      dispatch(clearLinkData());
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };


  return (
    <>
      <Tooltip title="Generate Public Link">
        <IconButton color="info" onClick={handleGenerateableId}>
          <AiOutlineLink size={16} />
        </IconButton>
      </Tooltip>

      {/* Modal */}
      <Dialog open={openGenerate} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Generate Public Link</Typography>
            <IconButton
              onClick={handleClose}
              size="small"
              disabled={isSending || isGenerating}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ minWidth: 350 }}>
          {loading ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2 }}>
              <CircularProgress size={20} />
              <Typography>Checking existing link...</Typography>
            </Box>
          ) : currentLink ? (
            <Box sx={{ mt: 1 }}>
              {/* Success Message */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 2,
                }}
              >
                <CheckCircleIcon
                  sx={{
                    color: "success.main",
                    fontSize: 24,
                  }}
                />
                <Box>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 500,
                      color: "text.primary",
                    }}
                  >
                    Public link available
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Your quotation customer link is ready to send
                  </Typography>
                </Box>
              </Box>

              {/* Info Box */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1.5,
                  p: 2,
                  bgcolor: "info.50",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "info.200",
                }}
              >
                <EmailIcon
                  color="info"
                  sx={{
                    mt: 0.2,
                    fontSize: 20,
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  Click "Send Mail" to send this quotation link directly to the
                  customer's email address
                </Typography>
              </Box>
            </Box>
          ) : (
            <TextField
              label="Expiry (in days)"
              type="number"
              size="small"
              fullWidth
              margin="normal"
              value={expiryDays}
              onChange={(e) => setExpiryDays(e.target.value)}
              inputProps={{ min: 1, max: 365 }}
              disabled={isGenerating}
            />
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
          <Button
            onClick={handleClose}
            disabled={isSending || isGenerating}
            variant="outlined"
            color="inherit"
          >
            Cancel
          </Button>

          {currentLink ? (
            <Button
              onClick={handleSendMail}
              variant="contained"
              color="primary"
              disabled={isSending}
              startIcon={
                isSending ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <EmailIcon />
                )
              }
            >
              {isSending ? "Sending..." : "Send Mail"}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              onClick={handleExpirySubmit}
              disabled={isGenerating}
              startIcon={
                isGenerating ? <CircularProgress size={18} color="inherit" /> : null
              }
            >
              {isGenerating ? "Generating..." : "Generate"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LinkGenerator;