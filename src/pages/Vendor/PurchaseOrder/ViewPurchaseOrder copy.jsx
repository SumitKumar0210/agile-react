import React, { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import {
  Button,
  Typography,
  Card,
  Tooltip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CardContent,
  Stack,
  CircularProgress,
  Box
} from "@mui/material";
import { Link } from "react-router-dom";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { AiOutlinePrinter } from "react-icons/ai";
import { RiDeleteBinLine } from "react-icons/ri";
import AddIcon from "@mui/icons-material/Add";
import { BiSolidEditAlt } from "react-icons/bi";
import { MdOutlineCheckCircle } from "react-icons/md";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { editPO, approvePO } from "../slice/purchaseOrderSlice";
import { useNavigate } from "react-router-dom";
const ViewPurchaseOrder = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { selected:data = {}, loading = false } = useSelector((state) => state.purchaseOrder);

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        await dispatch(editPO(id));
      }
    };
    fetchData();
  }, [id, dispatch]);

  const navigate = useNavigate();

  const handleApprove = async () => {
    const res = dispatch(approvePO(id));
    if(res.error) return ;
    navigate("/vendor/purchase-order");
    
  }

  const isLoaded = !loading && Object.keys(data).length > 0;

  if (loading || !isLoaded) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }
  const items = data.material_items ?? [];
  // const items = data.material_items ? JSON.parse(data.material_items) : [];

  // Render your component with data here
  return (
    <>
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Grid>
          <Typography variant="h6">Order Details</Typography>
        </Grid>
        <Grid>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={Link}
            to="/vendor/purchase-order/create"
          >
            Create PO
          </Button>
        </Grid>
      </Grid>

      <Grid
        container
        spacing={1}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Grid size={12}>
          <Card>
            <CardContent>
              {data && (
                <Grid size={{ xs: 12, md: 3 }} sx={{ pt: 2 }}>
                  <Typography variant="body2">
                    <strong>{data.vendor?.name}</strong>
                    <br />
                    {data.vendor?.address}
                    <br />
                    GSTIN: {data.vendor?.gst || "N/A"}
                  </Typography>
                </Grid>
              )}

              <Grid size={12} sx={{ mt: 3 }}>
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{
                    justifyContent: "flex-end",
                    alignItems: "flex-end",
                  }}
                >
                  {data.status == '1' && (
                    
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => {handleApprove(id)}}
                        startIcon={<MdOutlineCheckCircle />} >
                        Approve
                      </Button>
                    
                  )}
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<BiSolidEditAlt />}
                    component={Link} to={`/vendor/purchase-order/edit/${id}`} >
                    Edit PO
                  </Button>

                </Stack>
              </Grid>

              <Grid size={12} sx={{ mt: 3, overflowX: 'auto' }}>
                <Table>
                  <Thead>
                    <Tr>
                      <Th>Item Name</Th>
                      <Th>Item Code</Th>
                      <Th>Qty</Th>
                      <Th>Size</Th>
                      <Th>UOM</Th>
                      <Th>Rate</Th>
                      <Th>Total</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {/* {items && items.length > 0 ? (
                      items.map((item) => (
                        <Tr key={item.id || Math.random()}>
                          <Td>{item.name}</Td>
                          <Td>{item.code || "N/A"}</Td>
                          <Td>{item.qty}</Td>
                          <Td>{item.size}</Td>
                          <Td>{item.uom}</Td>
                          <Td>₹{item.rate?.toLocaleString('en-IN') || 0}</Td>
                          <Td>₹{item.total?.toLocaleString('en-IN') || 0}</Td>
                        </Tr>
                      ))
                    ) : ( */}
                    {items && items.length > 0 ? (
                      items.map((item) => (
                        <Tr key={item.material_id || Math.random()}>
                          <Td>{item.material_name}</Td>
                          <Td>{item.code || "N/A"}</Td>
                          <Td>{item.qty}</Td>
                          <Td>{item.size}</Td>
                          <Td>{item.uom}</Td>
                          <Td>₹{item.neg_rate?.toLocaleString('en-IN') || 0}</Td>
                          <Td>₹{item.amount?.toLocaleString('en-IN') || 0}</Td>
                        </Tr>
                      ))
                    ) : (
                      <Tr>
                        <Td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                          No items found
                        </Td>
                      </Tr>
                     )} 
                  </Tbody>
                </Table>
              </Grid>

              <Grid size={12} sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '200px', textAlign: 'right' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ccc', pb: 0.5 }}>
                      <span>Sub Total:</span>
                      <span>₹{data.subtotal?.toLocaleString('en-IN') || 0}</span>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ccc', pb: 0.5 }}>
                      <span>Discount:</span>
                      <span>₹{data.discount?.toLocaleString('en-IN') || 0}</span>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ccc', pb: 0.5 }}>
                      <span>Charges:</span>
                      <span>₹{data.cariage_amount?.toLocaleString('en-IN') || 0}</span>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ccc', pb: 0.5 }}>
                      <span>GST ({parseInt(data.gst_per) || 0}%):</span>
                      <span>₹{data.gst_amount?.toLocaleString('en-IN') || 0}</span>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #222', mt: 1, pt: 0.5, fontWeight: '600' }}>
                      <span>Grand Total:</span>
                      <span>₹{data.grand_total?.toLocaleString('en-IN') || 0}</span>
                    </Box>
                  </Box>
                </Box>
              </Grid>

              {data.order_terms && (
                <Grid size={12} sx={{ mt: 3 }}>
                  <Typography variant="body2">
                    <strong>Order Terms:</strong>
                    <br />
                    {data.order_terms}
                  </Typography>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};

export default ViewPurchaseOrder;