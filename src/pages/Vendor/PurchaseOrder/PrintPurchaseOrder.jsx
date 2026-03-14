import React, { useState, useRef, useEffect } from "react";
import Grid from "@mui/material/Grid";
import {
  Button,
  Typography,
  Card,
  CardContent,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { AiOutlinePrinter } from "react-icons/ai";
import { useReactToPrint } from "react-to-print";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { editInward } from "../slice/purchaseInwardSlice";
import { useAuth } from "../../../context/AuthContext";

const PrintPurchaseOrder = () => {
const { appDetails } = useAuth();
  const contentRef = useRef(null);
  const { id } = useParams();
  const dispatch = useDispatch();
  const { selected: po = {}, loading = true, error } = useSelector((state) => state.purchaseInward);

  useEffect(() => {
    if (id) dispatch(editInward(id));
  }, [dispatch, id]);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: "Purchase Order",
    pageStyle: `
        @page {
          size: A4;
          margin: 5mm;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `,
  });

  const items =  po.material_items;
  // const items = typeof po.material_items === "string"
  // ? JSON.parse(po.material_items)
  // : Array.isArray(po.material_items)
  //   ? po.material_items
  //   : [];

  // Loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <Alert severity="error" sx={{ maxWidth: 500 }}>
          <Typography variant="h6" gutterBottom>Error Loading Data</Typography>
          <Typography variant="body2">{error.message || "Failed to load purchase order data"}</Typography>
        </Alert>
      </Box>
    );
  }

  // Empty/No data state
  if (!po || !po.id) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <Alert severity="warning" sx={{ maxWidth: 500 }}>
          <Typography variant="h6" gutterBottom>Data Not Found</Typography>
          <Typography variant="body2">The requested purchase order could not be found.</Typography>
        </Alert>
      </Box>
    );
  }

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
          <Typography variant="h6">Purchase Order</Typography>
        </Grid>
        <Grid>
          <Button
            variant="contained"
            startIcon={<AiOutlinePrinter />}
            color="warning"
            onClick={handlePrint}
          >
            Print
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
          <div ref={contentRef} style={{ background: "#fff", padding: "20px" }}>
            <Card>
              <CardContent>
                <Grid size={12} sx={{ pt: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Typography variant="h6" className="fs-15">Purchase Order</Typography>
                  </Box>
                </Grid>
                <Grid size={12} sx={{ pb: 2 }} borderBottom={1}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                      flexWrap: 'nowrap',
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                      <Typography variant="body1" sx={{ m: 0 }}>
                        <Box component="span" sx={{ fontWeight: 600 }}>{new Date().toLocaleDateString()}</Box>
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ m: 0 }}>
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        DIM/PO/{po.purchase_order ? po.purchase_order.purchase_no.slice(2) : '000'}
                      </Box>
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={12} sx={{ pt: 2, pb: 2 }} borderBottom={1}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: { xs: 'wrap', md: 'nowrap' },
                      gap: 2,
                      pt: 2
                    }}
                  >
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="body1" sx={{ mb: 1 }} style={{ fontWeight: 600 }}>Company Detail</Typography>
                      <Typography variant="p">
                        {appDetails?.application_name || 'Aarish Ply & Boards Pvt Ltd'}
                        <br />
                        {appDetails?.company_address}
                        <br />
                        GSTIN: {appDetails?.gst_no || 'N/A'}
                        {/* <br />
                        Dated: 14/10/2025 */}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="body1" sx={{ mb: 1 }} style={{ fontWeight: 600 }}>Vendor Detail</Typography>
                      <Typography variant="p">
                        {po.vendor?.name || 'N/A'}
                        <br />
                        {po.vendor?.address || 'N/A'}
                        <br />
                        {po.vendor?.city || 'N/A'}, {po.vendor?.state?.name || 'N/A'} {po.vendor?.zip_code || 'N/A'}
                        <br />
                        GSTIN: {po.vendor?.gst || 'N/A'}
                        <br />
                        {/* Dated: {po?.purchase_order?.order_date || 'N/A'} */}
                      </Typography>
                      {/* <Typography variant="body1" sx={{ mt: 1 }} style={{ fontWeight: 600 }}>
                        Dispatch Date: {po?.purchase_order?.order_date || 'N/A'}
                      </Typography> */}
                    </Grid>
                  </Box>
                </Grid>
                <Grid size={12} sx={{ mt: 3 }}>
                  <Typography variant="body1" sx={{ mb: 2 }} style={{ fontWeight: 600 }}>Material Detail</Typography>
                  {items && items.length > 0 ? (
                    <Table>
                      <Thead>
                        <Tr>
                          <Th>Item Name</Th>
                          <Th>Qty</Th>
                          <Th>Size</Th>
                          <Th>UOM</Th>
                          <Th>Rate</Th>
                          <Th>Total</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {items.map((item, index) => (
                          <Tr key={item.material_id || index}>
                            <Td>{item.name || item.material_name || 'N/A'}</Td>
                            <Td>{item.qty || item.qty || 0}</Td>
                            <Td>{item.size || item.size || 'N/A'}</Td>
                            <Td>{item.uom || item.uom || 'N/A'}</Td>
                            <Td>{item.rate || item.neg_rate || 0}</Td>
                            <Td>{item.total || item.amount || 0}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  ) : (
                    <Alert severity="info">No items found in this purchase order</Alert>
                  )}
                </Grid>
                <Grid size={12} sx={{ mt: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                      width: '300px',
                      marginLeft: 'auto',
                    }}
                  >
                    <Box
                      className="fs-15"
                      sx={{
                        display: 'flex',
                        borderBottom: '1px solid #ccc',
                        pb: 0.5,
                      }}
                    >
                      <span>Sub Total</span>
                      <span style={{ marginLeft: 'auto' }}>{po.subtotal || 0}</span>
                    </Box>

                    <Box className="fs-15" sx={{ display: 'flex' }}>
                      <span>Discount</span>
                      <span style={{ marginLeft: 'auto' }}>{po.discount || 0}</span>
                    </Box>

                    <Box className="fs-15" sx={{ display: 'flex' }}>
                      <span>Additional Charges</span>
                      <span style={{ marginLeft: 'auto' }}>{po.carriage_amount || 0}</span>
                    </Box>

                    <Box className="fs-15" sx={{ display: 'flex' }}>
                      <span>GST ({parseInt(po.gst_per) || 0}%)</span>
                      <span style={{ marginLeft: 'auto' }}>{po.gst_amount || 0}</span>
                    </Box>

                    <Box
                      className="fs-15"
                      sx={{
                        display: 'flex',
                        borderTop: '1px solid #222',
                        mt: 1,
                        pt: 0.5,
                        fontWeight: 600,
                      }}                
                    >
                      <span>Grand Total</span>
                      <span style={{ marginLeft: 'auto' }}>{po.grand_total || 0}</span>
                    </Box>
                  </Box>
                </Grid>
                <Grid size={12} style={{ marginTop: "150px" }} sx={{ px: 5, mb: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                      flexWrap: 'nowrap',
                    }}
                  >
                    <Typography
                      variant="p"
                      sx={{
                        m: 0,
                        width: "150px",
                        textAlign: "center",
                        lineHeight: "2 !important",
                        borderTop: 1,
                        borderColor: "grey.500"
                      }}
                    >
                      Approved By
                    </Typography>
                    <Typography
                      variant="p"
                      sx={{
                        m: 0,
                        width: "150px",
                        textAlign: "center",
                        lineHeight: "2 !important",
                        borderTop: 1,
                        borderColor: "grey.500"
                      }}
                    >
                      Prepared By
                    </Typography>
                    <Typography
                      variant="p"
                      sx={{
                        m: 0,
                        width: "150px",
                        textAlign: "center",
                        lineHeight: "2 !important",
                        borderTop: 1,
                        borderColor: "grey.500"
                      }}
                    >
                      QC Done By
                    </Typography>
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

export default PrintPurchaseOrder;