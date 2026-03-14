// components/LogTimeDrawer.jsx
import React, { useState, useEffect } from "react";
import {
  Drawer,
  Box,
  Typography,
  Divider,
  TextField,
  Button,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Skeleton,
  Alert,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { RiDeleteBinLine } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { fetchActiveLabours } from "../../pages/Users/slices/labourSlice";
import {
  storeLabourLog,
  fetchLabourLogs,
} from "../../pages/Production/slice/labourLogSlice";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (date) => {
  if (!date) return "";
  if (typeof date === "string") {
    if (/^\d{2}-\d{2}-\d{4}$/.test(date)) return date;
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split("-");
      return `${day}-${month}-${year}`;
    }
    const parsed = dayjs(date);
    return parsed.isValid() ? parsed.format("DD-MM-YYYY") : date;
  }
  return date.format ? date.format("DD-MM-YYYY") : date;
};

// Format a dayjs time object → "HH:mm" string for API
const formatTime = (time) => {
  if (!time) return "";
  return time.format ? time.format("HH:mm") : time;
};

// Display "HH:mm" string nicely
const displayTime = (timeStr) => {
  if (!timeStr) return "-";
  return timeStr; // already "HH:mm"
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function LogTimeDrawer({ open, onClose, product, onSuccess }) {
  const dispatch = useDispatch();
  const { activeLabours: labourData = [], loading: labourLoading } =
    useSelector((state) => state.labour);
  const { data: existingLogs = [], loading: logsLoading } = useSelector(
    (state) => state.labourLog
  );

  const [selectedLabour, setSelectedLabour] = useState(null);
  const [logDate, setLogDate]               = useState(null);
  const [signIn, setSignIn]                 = useState(null);
  const [signOut, setSignOut]               = useState(null);
  const [logTimeItems, setLogTimeItems]     = useState([]);
  const [openDelete, setOpenDelete]         = useState(false);
  const [deleteIndex, setDeleteIndex]       = useState(null);
  const [validationError, setValidationError] = useState("");
  const [submitting, setSubmitting]         = useState(false);

  // Load data when drawer opens
  useEffect(() => {
    if (open && product) {
      dispatch(fetchActiveLabours());
      dispatch(fetchLabourLogs(product.id));
    }
  }, [open, product, dispatch]);

  // Reset form when drawer closes
  useEffect(() => {
    if (!open) {
      setLogTimeItems([]);
      setSelectedLabour(null);
      setLogDate(null);
      setSignIn(null);
      setSignOut(null);
      setValidationError("");
    }
  }, [open]);

  // Clear validation error when user changes any field
  useEffect(() => {
    if (validationError) setValidationError("");
  }, [selectedLabour, logDate, signIn, signOut]);

  // ── Duplicate check ────────────────────────────────────────────────────────
  const isLabourDateDuplicate = (labourId, date) => {
    const dateStr = formatDate(date);
    const duplicateInNew = logTimeItems.some(
      (item) => item.labour.id === labourId && formatDate(item.date) === dateStr
    );
    const duplicateInExisting = existingLogs.some(
      (log) => log.labour_id === labourId && formatDate(log.date) === dateStr
    );
    return duplicateInNew || duplicateInExisting;
  };

  // ── Add entry ──────────────────────────────────────────────────────────────
  const handleAddLogTime = () => {
    setValidationError("");

    if (!selectedLabour) {
      setValidationError("Please select an employee");
      return;
    }
    if (!logDate) {
      setValidationError("Please select a date");
      return;
    }
    if (!signIn) {
      setValidationError("Please select a sign-in time");
      return;
    }
    if (!signOut) {
      setValidationError("Please select a sign-out time");
      return;
    }
    if (signOut.isBefore(signIn) || signOut.isSame(signIn)) {
      setValidationError("Sign-out time must be after sign-in time");
      return;
    }
    if (isLabourDateDuplicate(selectedLabour.id, logDate)) {
      setValidationError(
        `${selectedLabour.name} has already logged time for ${formatDate(logDate)}`
      );
      return;
    }

    setLogTimeItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        labour: selectedLabour,
        date: logDate,
        sign_in: formatTime(signIn),
        sign_out: formatTime(signOut),
        isNew: true,
      },
    ]);

    // Reset form fields
    setSelectedLabour(null);
    setLogDate(null);
    setSignIn(null);
    setSignOut(null);
  };

  // ── Delete pending entry ───────────────────────────────────────────────────
  const handleDeleteLogTime = (index) => {
    setLogTimeItems((prev) => prev.filter((_, i) => i !== index));
    setOpenDelete(false);
    setDeleteIndex(null);
  };

  // ── Submit to API ──────────────────────────────────────────────────────────
  const handleUpdateLogTime = async () => {
    if (logTimeItems.length === 0 || !product) return;

    setSubmitting(true);
    setValidationError("");

    try {
      const formData = new FormData();
      formData.append("pp_id", product.id);

      logTimeItems.forEach((item) => {
        formData.append("labour_id[]", item.labour.id);
        formData.append("date[]", formatDate(item.date));
        formData.append("sign_in[]", item.sign_in);
        formData.append("sign_out[]", item.sign_out);
      });

      const res = await dispatch(storeLabourLog(formData));

      if (!res.error) {
        setLogTimeItems([]);
        await dispatch(fetchLabourLogs(product.id));
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setValidationError("Failed to save labour logs. Please try again.");
      }
    } catch (error) {
      console.error("Error saving labour logs:", error);
      setValidationError("An error occurred while saving. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const loading = labourLoading || logsLoading;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Drawer anchor="right" open={open} onClose={onClose} sx={{ zIndex: 9999 }}>
        <Box sx={{ width: 750, p: 2 }}>
          <Typography variant="h6" fontWeight={500} fontSize="18px" marginBottom="6px">
            Log Time
          </Typography>
          <Divider />

          <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1">{product?.item_name}</Typography>
            <Typography variant="subtitle1">{product?.group?.trim()}</Typography>
          </Box>

          {validationError && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {validationError}
            </Alert>
          )}

          {/* ── Form Row ── */}
          <Box
            display="flex"
            alignItems="center"
            paddingTop="15px"
            paddingBottom="10px"
            gap="10px"
            flexWrap="wrap"
          >
            {loading ? (
              <>
                <Skeleton variant="rounded" width={220} height={40} />
                <Skeleton variant="rounded" width={120} height={40} />
                <Skeleton variant="rounded" width={120} height={40} />
                <Skeleton variant="rounded" width={120} height={40} />
                <Skeleton variant="rounded" width={60} height={40} />
              </>
            ) : (
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                {/* Employee */}
                <Autocomplete
                  disablePortal
                  options={labourData || []}
                  value={selectedLabour}
                  onChange={(e, val) => {
                    setSelectedLabour(val);
                    if (val?.shift?.start_time) {
                      setSignIn(dayjs(val.shift.start_time, "HH:mm"));
                    } else {
                      setSignIn(null);
                    }
                    if (val?.shift?.end_time) {
                      setSignOut(dayjs(val.shift.end_time, "HH:mm"));
                    } else {
                      setSignOut(null);
                    }
                  }}
                  getOptionLabel={(option) =>
                    option?.name ? `${option.name} (${option.labour_code || option.id})` : ""
                  }
                  isOptionEqualToValue={(option, value) => value && option.id === value.id}
                  renderInput={(params) => (
                    <TextField {...params} label="Employee" placeholder="Search employee" size="small" />
                  )}
                  sx={{ width: 220 }}
                />

                {/* Date */}
                <DatePicker
                  label="Date"
                  value={logDate}
                  onChange={setLogDate}
                  maxDate={dayjs()}
                  slotProps={{
                    textField: { size: "small" },
                    popper: { sx: { zIndex: 999999 } },
                  }}
                  sx={{ width: 130 }}
                />

                {/* Sign In */}
                <TimePicker
                  label="Sign In"
                  value={signIn}
                  onChange={setSignIn}
                  slotProps={{
                    textField: { size: "small" },
                    popper: { sx: { zIndex: 999999 } },
                  }}
                  sx={{ width: 130 }}
                />

                {/* Sign Out */}
                <TimePicker
                  label="Sign Out"
                  value={signOut}
                  onChange={setSignOut}
                  minTime={signIn ?? undefined}
                  slotProps={{
                    textField: { size: "small" },
                    popper: { sx: { zIndex: 999999 } },
                  }}
                  sx={{ width: 130 }}
                />

                <Button
                  variant="contained"
                  onClick={handleAddLogTime}
                  disabled={!selectedLabour || !logDate || !signIn || !signOut}
                  sx={{ marginTop: 0 }}
                >
                  Add
                </Button>
              </LocalizationProvider>
            )}
          </Box>

          {/* ── Table ── */}
          <TableContainer sx={{ mt: 4 }}>
            {loading ? (
              <>
                <Skeleton variant="rectangular" height={50} sx={{ mb: 1 }} />
                <Skeleton variant="rectangular" height={50} sx={{ mb: 1 }} />
                <Skeleton variant="rectangular" height={50} sx={{ mb: 1 }} />
              </>
            ) : (
              <Table sx={{ minWidth: "100%" }} size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Emp Name (Emp Code)</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Sign In</TableCell>
                    <TableCell>Sign Out</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Existing logs from server */}
                  {existingLogs.map((log) => (
                    <TableRow key={`existing-${log.id}`}>
                      <TableCell>
                        {log.labour?.name}
                        <br />({log.labour?.labour_code || log.labour_id})
                      </TableCell>
                      <TableCell>{formatDate(log.date)}</TableCell>
                      <TableCell>{displayTime(log.sign_in)}</TableCell>
                      <TableCell>{displayTime(log.sign_out)}</TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          Saved
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Newly added (pending) items */}
                  {logTimeItems.map((item, index) => (
                    <TableRow key={item.id} sx={{ backgroundColor: "action.hover" }}>
                      <TableCell>
                        {item.labour?.name}
                        <br />({item.labour?.labour_code || item.labour?.id})
                      </TableCell>
                      <TableCell>{formatDate(item.date)}</TableCell>
                      <TableCell>{displayTime(item.sign_in)}</TableCell>
                      <TableCell>{displayTime(item.sign_out)}</TableCell>
                      <TableCell>
                        <Tooltip title="Delete" arrow>
                          <IconButton
                            color="error"
                            onClick={() => {
                              setDeleteIndex(index);
                              setOpenDelete(true);
                            }}
                          >
                            <RiDeleteBinLine size={16} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Empty state */}
                  {existingLogs.length === 0 && logTimeItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No log time entries
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </TableContainer>

          {/* ── Footer Buttons ── */}
          <Box mt={2} sx={{ display: "flex", justifyContent: "end", gap: 1 }}>
            <Button variant="outlined" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleUpdateLogTime}
              disabled={logTimeItems.length === 0 || submitting}
            >
              {submitting ? "Saving..." : "Update"}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)} sx={{ zIndex: 999999 }}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent style={{ width: "300px" }}>
          <DialogContentText>
            Are you sure you want to delete this entry? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button
            onClick={() => handleDeleteLogTime(deleteIndex)}
            variant="contained"
            color="error"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}