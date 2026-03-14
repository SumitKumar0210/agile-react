import React, { useState, useEffect } from "react";
import {
    Drawer,
    Box,
    Typography,
    IconButton,
    Divider,
    Button,
    TextField,
    Select,
    MenuItem,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Paper,
    FormControl
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { getJobDetails } from "../../pages/Production/slice/productionChainSlice";

const JobCardDrawer = ({ open, onClose, product }) => {

    const navigate = useNavigate();
    const [finishRows, setFinishRows] = useState([]);
    const [qcRows, setQcRows] = useState([]);
    const [jobDetails, setJobDetails] = useState(null);
    const dispatch = useDispatch();
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

    const departmentName = product?.department?.name ?? "N/A";
    const productName = product?.product?.name ?? "N/A";

    console.log("this is job details:", jobDetails, product);

    const handleAddFinishRow = () => {
        setFinishRows((prev) => [
            ...prev,
            {
                component: "",
                finish_type: "",
                colour_name: "",
                colour_code: "",
                sheen: "",
                method: ""
            }
        ]);
    };

    const handleFinishChange = (index, field, value) => {
        setFinishRows((prev) =>
            prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
        );
    };

    const handleAddQcRow = () => {
        setQcRows((prev) => [...prev, { checklist: "" }]);
    };

    const handleQcChange = (index, value) => {
        setQcRows((prev) =>
            prev.map((row, i) => (i === index ? { ...row, checklist: value } : row))
        );
    };

    const handleSubmit = () => {
        console.log("Finish Specs:", finishRows);
        console.log("QC Checklist:", qcRows);
    };
    const handlePrintJobCard = () => {
        navigate("/job-card/", {
            state: {
                product: product,
                finishSpecs: finishRows,
                qcChecklist: qcRows
            }
        });
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            sx={{ zIndex: 1400 }}
            PaperProps={{
                sx: {
                    width: 740,
                    display: "flex",
                    flexDirection: "column",
                    height: "100vh"
                }
            }}
            ModalProps={{
                disableEnforceFocus: true,
                disableAutoFocus: true,
                disableRestoreFocus: true,
                keepMounted: false
            }}
        >
            {/* HEADER */}
            <Box sx={{ background: "#1e1e1e", color: "#fff", px: 2, py: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" color="warning.main">
                        Finish Specifications (Department : {departmentName})
                    </Typography>

                    <IconButton onClick={onClose} sx={{ color: "#fff" }}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Typography sx={{ fontSize: 13, opacity: 0.7 }}>
                    {jobDetails?.poNumber ?? ""} · {product?.item_name || "-"} ·{" "}
                    {product?.group?.trim?.() || "-"}
                </Typography>
            </Box>

            {/* ORDER INFO */}
            <Box sx={{ px: 2, py: 1, display: "flex", gap: 6 }}>
                <Box>
                    <Typography variant="caption">ORDER QTY</Typography>
                    <Typography fontWeight={500}>{product?.qty || "-"} units</Typography>
                </Box>

                <Box>
                    <Typography variant="caption">CUSTOMER</Typography>
                    <Typography fontWeight={500}>{jobDetails?.customerName ?? ""}</Typography>
                </Box>

                <Box>
                    <Typography variant="caption">DELIVERY</Typography>
                    <Typography fontWeight={500}>
                        {product?.delivery_date || "-"}
                    </Typography>
                </Box>

                {/* <Box>
                    <Typography variant="caption">SALES ORDER</Typography>
                    <Typography fontWeight={500}>SO-4521</Typography>
                </Box> */}
            </Box>

            <Divider />

            {/* SCROLLABLE CONTENT */}
            <Box sx={{ flex: 1, overflowY: "auto" }}>
                {/* FINISH SPECIFICATIONS */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        px: 2,
                        py: 1
                    }}
                >
                    <Box>
                        <Typography fontWeight={500}>FINISH SPECIFICATIONS</Typography>
                    </Box>

                    <Button variant="outlined" sx={{ mt: 0 }} onClick={handleAddFinishRow}>
                        + Add Finish
                    </Button>
                </Box>

                <Box sx={{ px: 2 }}>
                    {finishRows.length === 0 && (
                        <Box
                            sx={{
                                border: "1px solid #ddd",
                                borderRadius: 2,
                                textAlign: "center",
                                p: 6,
                                color: "#777"
                            }}
                        >
                            No finishes added for Carpentry
                        </Box>
                    )}

                    {finishRows.length > 0 && (
                        <Paper variant="outlined" sx={{ mb: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell width={40}>#</TableCell>
                                        <TableCell>Component</TableCell>
                                        <TableCell>Finish Type</TableCell>
                                        <TableCell>Colour Name</TableCell>
                                        <TableCell>Colour Code</TableCell>
                                        <TableCell>Sheen</TableCell>
                                        <TableCell>Method</TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {finishRows.map((row, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                {String(index + 1).padStart(2, "0")}
                                            </TableCell>

                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    fullWidth
                                                    value={row.component}
                                                    onChange={(e) =>
                                                        handleFinishChange(index, "component", e.target.value)
                                                    }
                                                />
                                            </TableCell>

                                            {/* <TableCell>
                                                <FormControl fullWidth size="small">
                                                    <Select
                                                        value={row.finish_type}
                                                        onChange={(e) => handleFinishChange(index, "finish_type", e.target.value)}
                                                        displayEmpty
                                                        MenuProps={{ disablePortal: true }}
                                                    >
                                                        <MenuItem value="">Type...</MenuItem>
                                                        <MenuItem value="paint">Paint</MenuItem>
                                                        <MenuItem value="polish">Polish</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </TableCell> */}
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    fullWidth
                                                    value={row.finish_type}
                                                    onChange={(e) =>
                                                        handleFinishChange(index, "finish_type", e.target.value)
                                                    }
                                                    placeholder="Type..."
                                                />
                                            </TableCell>

                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    fullWidth
                                                    value={row.colour_name}
                                                    onChange={(e) =>
                                                        handleFinishChange(index, "colour_name", e.target.value)
                                                    }
                                                />
                                            </TableCell>

                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    fullWidth
                                                    value={row.colour_code}
                                                    onChange={(e) =>
                                                        handleFinishChange(index, "colour_code", e.target.value)
                                                    }
                                                />
                                            </TableCell>

                                            {/* <TableCell>
                                                <FormControl fullWidth size="small">
                                                    <Select
                                                        value={row.sheen}
                                                        onChange={(e) =>
                                                            handleFinishChange(index, "sheen", e.target.value)
                                                        }
                                                        displayEmpty
                                                        MenuProps={{ disablePortal: true }}
                                                    >
                                                        <MenuItem value="">Sheen</MenuItem>
                                                        <MenuItem value="matte">Matte</MenuItem>
                                                        <MenuItem value="gloss">Gloss</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </TableCell> */}
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    fullWidth
                                                    value={row.sheen}
                                                    onChange={(e) =>
                                                        handleFinishChange(index, "sheen", e.target.value)
                                                    }
                                                    placeholder="Sheen"
                                                />
                                            </TableCell>

                                            {/* <TableCell>
                                                <FormControl fullWidth size="small">
                                                    <Select
                                                        value={row.method}
                                                        onChange={(e) =>
                                                            handleFinishChange(index, "method", e.target.value)
                                                        }
                                                        displayEmpty
                                                        MenuProps={{ disablePortal: true }}
                                                    >
                                                        <MenuItem value="">Method</MenuItem>
                                                        <MenuItem value="spray">Spray</MenuItem>
                                                        <MenuItem value="brush">Brush</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </TableCell> */}

                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    fullWidth
                                                    value={row.method}
                                                    onChange={(e) =>
                                                        handleFinishChange(index, "method", e.target.value)
                                                    }
                                                    placeholder="Method"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Paper>
                    )}
                </Box>

                {/* QC CHECKLIST */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        px: 2,
                        py: 1
                    }}
                >
                    <Typography fontWeight={600}>QC Checklist</Typography>

                    <Button variant="outlined" sx={{ mt: 0 }} onClick={handleAddQcRow}>
                        + Add QC Checklist
                    </Button>
                </Box>

                <Box sx={{ px: 2 }}>
                    {qcRows.length === 0 && (
                        <Box
                            sx={{
                                border: "1px solid #ddd",
                                borderRadius: 2,
                                textAlign: "center",
                                p: 6,
                                color: "#777"
                            }}
                        >
                            No Checklist added for Carpentry
                        </Box>
                    )}

                    {qcRows.length > 0 && (
                        <Paper variant="outlined" sx={{ mb: 3 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell width={40}>#</TableCell>
                                        <TableCell>Checklist Item</TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {qcRows.map((row, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                {String(index + 1).padStart(2, "0")}
                                            </TableCell>

                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    fullWidth
                                                    value={row.checklist}
                                                    onChange={(e) => handleQcChange(index, e.target.value)}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Paper>
                    )}
                </Box>
            </Box>

            {/* FOOTER */}
            <Box
                sx={{
                    px: 2,
                    py: 1.5,
                    borderTop: "1px solid #eee",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#fff",
                    flexShrink: 0,
                    boxShadow: "0 -2px 8px rgba(0,0,0,0.05)"
                }}
            >
                <Button
                    variant="outlined"
                    color="warning"
                    sx={{ mt: 0 }}
                    onClick={handlePrintJobCard}
                >
                    Print Job Card
                </Button>

                <Button variant="contained" color="primary" sx={{ mt: 0 }} onClick={handleSubmit}>
                    Save Finishes
                </Button>
            </Box>
        </Drawer>
    );
};

export default JobCardDrawer;