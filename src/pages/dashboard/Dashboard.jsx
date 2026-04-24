import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Paper,
  Chip,
  LinearProgress,
  Skeleton
} from "@mui/material";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  productionOutput, topVendorChart, qcTrendsData,
  dispatchTrackerData, activeProductionDataDepartmentWise,
  materialSummary,getStatisticsData,
} from "./dashboardSlice";
import { useDispatch, useSelector } from "react-redux";




export default function Dashboard() {
  // const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  const {
    productionOutputData: productionData = [],
    loadingProductionOutput: loading,
    topVendorChartData: machineData = [],
    loadingTopVendorChart,
    qcTrendsData: qcData = [],
    loadingQcTrends,
    dispatchTrackerData: dispatchData = [],
    loadingDispatchTracker,
    activeDepartmentData: activeData = [],
    loadingActiveDepartment,
    materialSummary: materialSummaryData = [],
    loadingMaterialSummary,
    statisticsData,
    loadingStatisticsData,
  } = useSelector((s) => s.dashboard);
  console.log(materialSummaryData);

  useEffect(() => {
    dispatch(productionOutput());
    dispatch(topVendorChart());
    dispatch(qcTrendsData());
    dispatch(activeProductionDataDepartmentWise());
    dispatch(dispatchTrackerData());
    dispatch(materialSummary());
    dispatch(getStatisticsData());
  }, [dispatch]);
  // setLoading(false)

  // const productionData = [
  //   { time: "jan", output: 150 },
  //   { time: "feb", output: 200 },
  //   { time: "Mar", output: 320 },
  //   { time: "Apr", output: 410 },
  //   { time: "May", output: 390 },
  //   { time: "Jun", output: 340 },
  //   { time: "Jul", output: 280 },
  // ];

  // const machineData = [
  //   { name: "Machine A", value: 92 },
  //   { name: "Machine B", value: 85 },
  //   { name: "Machine C", value: 78 },
  //   { name: "Machine D", value: 88 },
  // ];

  // const qcData = [
  //   { name: "Pass", value: 985, color: "#10b981" },
  //   { name: "Fail", value: 15, color: "#ef4444" },
  // ];

  // const dispatchData = [
  //   { status: "Pending", count: 45, color: "#f59e0b" },
  //   { status: "In Transit", count: 32, color: "#3b82f6" },
  //   { status: "Delivered", count: 118, color: "#10b981" },
  // ];

  const kpis = [
    { title: "Production", value: "2,340 Units", color: "#3b82f6" },
    { title: "Efficiency", value: "94.2%", color: "#22c55e" },
    { title: "Quality", value: "98.5%", color: "#059669" },
    { title: "Orders", value: "342", color: "#a855f7" },
    { title: "Alerts", value: "3", color: "#ef4444" },
    { title: "Cost", value: "₹2.4M", color: "#f59e0b" },
  ];

  const rawMaterials = [
    { name: "Steel Coil", stock: 156, unit: "rolls", status: "normal" },
    { name: "Aluminum", stock: 48, unit: "kg", status: "low" },
    { name: "Lubricant", stock: 320, unit: "liters", status: "normal" },
  ];

  // Skeleton for KPI cards
  const KpiCardSkeleton = () => (
    <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#374153", height: "100%" }}>
      <Skeleton variant="text" width="80%" height={20} sx={{ mx: 'auto', bgcolor: '#4b5563' }} />
      <Skeleton variant="text" width="60%" height={30} sx={{ mx: 'auto', mt: 1, bgcolor: '#4b5563' }} />
    </Paper>
  );

  // Skeleton for charts
  const ChartSkeleton = ({ height = 250 }) => (
    <Box sx={{ width: '100%', height }}>
      <Skeleton
        variant="rectangular"
        width="100%"
        height={height}
        sx={{ borderRadius: 1, bgcolor: '#4b5563' }}
      />
    </Box>
  );

  // Skeleton for raw materials list
  const RawMaterialSkeleton = () => (
    <Box display="flex" justifyContent="space-between" mb={2}>
      <Box flex={1}>
        <Skeleton variant="text" width="60%" height={20} sx={{ bgcolor: '#4b5563' }} />
        <Skeleton variant="text" width="40%" height={15} sx={{ bgcolor: '#4b5563' }} />
      </Box>
      <Skeleton variant="rectangular" width={60} height={32} sx={{ borderRadius: 16, bgcolor: '#4b5563' }} />
    </Box>
  );

  // Skeleton for dispatch tracker items
  const DispatchItemSkeleton = () => (
    <Box display="flex" alignItems="center" mb={1}>
      <Skeleton variant="circular" width={8} height={8} sx={{ bgcolor: '#4b5563', mr: 1 }} />
      <Skeleton variant="text" width="80%" height={15} sx={{ bgcolor: '#4b5563' }} />
    </Box>
  );

  return (
    <Box>
      {/* KPI CARDS */}
      <Grid container spacing={2}>
        {loading ? (
          Array(6).fill(0).map((_, index) => (
            <Grid size={2} key={`kpi-skeleton-${index}`}>
              <KpiCardSkeleton />
            </Grid>
          ))
        ) : (
          <>
            <Grid size={2}>
              <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#3b82f6", height: "100%" }}>
                <Typography color="white" fontSize={14}>Active Production</Typography>
                <Typography color="white" fontSize={18} fontWeight={500}>{statisticsData?.activeProduction ?? 0}</Typography>
              </Paper>
            </Grid>
            <Grid size={2}>
              <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#22c55e", height: "100%" }}>
                <Typography color="white" fontSize={14}>Ready For Delivery</Typography>
                <Typography color="white" fontSize={18} fontWeight={500}>{statisticsData?.readyProduct ?? 0}</Typography>
              </Paper>
            </Grid>
            <Grid size={2}>
              <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#059669", height: "100%" }}>
                <Typography color="white" fontSize={14}>Semi Furnished</Typography>
                <Typography color="white" fontSize={18} fontWeight={500}>{statisticsData?.semiFurnished ?? 0}</Typography>
              </Paper>
            </Grid>
            <Grid size={2}>
              <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#a855f7", height: "100%" }}>
                <Typography color="white" fontSize={14}>Orders</Typography>
                <Typography color="white" fontSize={18} fontWeight={500}>{statisticsData?.orders ?? 0}</Typography>
              </Paper>
            </Grid>
            <Grid size={2}>
              <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#ef4444", height: "100%" }}>
                <Typography color="white" fontSize={14}>Vendors Due Amount</Typography>
                <Typography color="white" fontSize={18} fontWeight={500}>₹{statisticsData?.vendorDueAmount ?? 0}</Typography>
              </Paper>
            </Grid>
            <Grid size={2}>
              <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#f59e0b", height: "100%" }}>
                <Typography color="white" fontSize={14}>Billing Amount</Typography>
                <Typography color="white" fontSize={18} fontWeight={500}>₹{statisticsData?.billingAmount ?? 0}</Typography>
              </Paper>
            </Grid>
         </>
          // kpis.map((k, i) => (
          //   <Grid size={2} key={i}>
          //     <Paper sx={{ p: 2, textAlign: "center", bgcolor: k.color, height: "100%" }}>
          //       <Typography color="white" fontSize={14}>{k.title}</Typography>
          //       <Typography color="white" fontSize={18} fontWeight={500}>{k.value}</Typography>
          //     </Paper>
          //   </Grid>
          // ))
        )}
      </Grid>

      {/* ROW 1 */}
      <Grid container spacing={2} mt={2}>
        {/* PRODUCTION */}
        <Grid size={6}>
          <Paper sx={{ p: 2, bgcolor: "#374153", height: "100%" }}>
            <Typography color="white" mb={2} fontWeight={500}>Production Output</Typography>
            {loading ? (
              <ChartSkeleton height={260} />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={productionData}>
                  <defs>
                    <linearGradient id="prod" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="10%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="90%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#cbd5e1" fontSize={14} />
                  <YAxis stroke="#cbd5e1" fontSize={14} />
                  <Tooltip contentStyle={{ background: "#fcfcfc", border: "none" }} />
                  <Area dataKey="output" stroke="#3b82f6" fill="url(#prod)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        {/* MACHINE UTILIZATION */}
        <Grid size={3}>
          <Paper sx={{ p: 2, bgcolor: "#374153", height: "100%" }}>
            <Typography color="white" mb={2}>Top Vendor</Typography>
            {loading ? (
              <ChartSkeleton height={250} />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={machineData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#cbd5e1" fontSize={14} />
                  <YAxis dataKey="name" type="category" stroke="#cbd5e1" fontSize={14} />
                  <Tooltip contentStyle={{ background: "#fcfcfc", border: "none" }} />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        {/* QC CHART */}
        <Grid size={3}>
          <Paper sx={{ p: 2, bgcolor: "#374153", height: "100%" }}>
            <Typography color="white" mb={2}>QC Trends</Typography>
            {loading ? (
              <ChartSkeleton height={250} />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={qcData} innerRadius={60} outerRadius={110} dataKey="value">
                      {qcData.map((v, i) => <Cell key={i} fill={v.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#fcfcfc", border: "none" }} />
                  </PieChart>
                </ResponsiveContainer>

                {(() => {
                  const total = qcData.reduce((sum, item) => sum + (item.value || 0), 0);
                  return qcData.map((item, i) => {
                    const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";
                    return (
                      <Typography key={i} color="white" fontSize={12} mt={0.5}>
                        <Box
                          component="span"
                          sx={{
                            display: "inline-block",
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            bgcolor: item.color,
                            mr: 1,
                          }}
                        />
                        {item.name}: {item.value} ({percent}%)
                      </Typography>
                    );
                  });
                })()}
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* ROW 2 */}
      <Grid container spacing={2} mt={2}>

        {/* DISPATCH */}
        <Grid size={4}>
          <Paper sx={{ p: 2, bgcolor: "#374153", height: "100%" }}>
            <Typography color="white" fontWeight={500}>Dispatch Tracker</Typography>
            {loading ? (
              <>
                <ChartSkeleton height={150} />
                <Box mt={2}>
                  {Array(3).fill(0).map((_, index) => (
                    <DispatchItemSkeleton key={`dispatch-skeleton-${index}`} />
                  ))}
                </Box>
              </>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={dispatchData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="status" stroke="#cbd5e1" />
                    <YAxis stroke="#cbd5e1" />
                    <Tooltip contentStyle={{ background: "#fcfcfc", border: "none" }} />
                    <Bar dataKey="count" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
                {dispatchData.map((d, i) => (
                  <Typography color="white" key={i} fontSize={12} sx={{ mt: 0.5 }}>
                    ● {d.status}: {d.count}
                  </Typography>
                ))}
              </>
            )}
          </Paper>
        </Grid>

        {/* RAW MATERIAL */}
        {/* <Grid size={4}>
          <Paper sx={{ p: 2, bgcolor: "#374153", height: "100%" }}>
            <Typography color="white" fontWeight={500} mb={2}>Raw Materials</Typography>
            {loading ? (
              Array(3).fill(0).map((_, index) => (
                <RawMaterialSkeleton key={`material-skeleton-${index}`} />
              ))
            ) : (
              rawMaterials.map((m, i) => (
                <Box key={i} display="flex" justifyContent="space-between" mb={1}>
                  <Box>
                    <Typography color="white">{m.name}</Typography>
                    <Typography fontSize={12} color="gray">{m.stock} {m.unit}</Typography>
                  </Box>
                  <Chip label={m.status} color={m.status === "low" ? "error" : "success"} />
                </Box>
              ))
            )}
          </Paper>
        </Grid> */}

        {/* MATERIAL SUMMARY */}
        <Grid size={4}>
          <Paper sx={{ p: 2, bgcolor: "#374153", height: "100%" }}>
            <Typography color="white" fontWeight={500}>Material Summary</Typography>
            {loading ? (
              <>
                <Skeleton variant="text" width="40%" height={40} sx={{ bgcolor: '#4b5563', mb: 1 }} />
                <Skeleton variant="rectangular" width="100%" height={10} sx={{ borderRadius: 5, mb: 2, bgcolor: '#4b5563' }} />
                <Skeleton variant="text" width="60%" height={15} sx={{ bgcolor: '#4b5563', mb: 0.5 }} />
                <Skeleton variant="text" width="50%" height={15} sx={{ bgcolor: '#4b5563' }} />
              </>
            ) : (
              <>
                <Typography color="success.main" fontSize={30}>
                  {materialSummaryData?.availability_percent ?? 0}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={materialSummaryData?.availability_percent ?? 0}
                  sx={{ height: 10, borderRadius: 5, mb: 2 }}
                />
                <Typography color="white" fontSize={13}>
                  Total Requested Materials: {materialSummaryData?.total_materials ?? 0}
                </Typography>
                <Typography color="white" fontSize={13}>
                  Available: {materialSummaryData?.available_materials ?? 0}
                </Typography>
                <Typography color="white" fontSize={13}>
                  Unavailable: {materialSummaryData?.unavailable_materials ?? 0}
                </Typography>
              </>
            )}
          </Paper>
        </Grid>

        {/* ACTIVE PRODUCTION */}
        <Grid size={4}>
          <Paper sx={{ p: 2, bgcolor: "#374153", height: "100%" }}>
            <Typography color="white" fontWeight={500}>Active Production</Typography>
            {loading ? (
              <>
                <ChartSkeleton height={150} />
                <Box mt={2}>
                  {Array(6).fill(0).map((_, index) => (
                    <DispatchItemSkeleton key={`active-skeleton-${index}`} />
                  ))}
                </Box>
              </>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={activeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="name"
                      stroke="#cbd5e1"
                      tick={{ fontSize: 11 }}
                      // Only label every other bar when there are many departments
                      interval={activeData.length > 5 ? 1 : 0}
                    />
                    <YAxis stroke="#cbd5e1" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: "#1e293b", border: "none", borderRadius: 6 }}
                      labelStyle={{ color: "#fff" }}
                      itemStyle={{ color: "#cbd5e1" }}
                    />
                    <Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>

                {/* ── Legend: split into left and right columns dynamically ── */}
                {(() => {
                  const half = Math.ceil(activeData.length / 2); // ceil handles odd counts
                  const left = activeData.slice(0, half);
                  const right = activeData.slice(half);

                  return (
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "2px 8px",
                        mt: 1.5,
                      }}
                    >
                      {/* Left column */}
                      <Box>
                        {left.map((d, i) => (
                          <Typography
                            key={`left-${i}`}
                            color="white"
                            fontSize={11}
                            sx={{ mt: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}
                          >
                            <Box
                              component="span"
                              sx={{
                                width: 8, height: 8, borderRadius: "50%",
                                backgroundColor: "#6366f1",
                                display: "inline-block", flexShrink: 0,
                              }}
                            />
                            {d.name}: {d.count}
                          </Typography>
                        ))}
                      </Box>

                      {/* Right column */}
                      <Box>
                        {right.map((d, i) => (
                          <Typography
                            key={`right-${i}`}
                            color="white"
                            fontSize={11}
                            sx={{ mt: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}
                          >
                            <Box
                              component="span"
                              sx={{
                                width: 8, height: 8, borderRadius: "50%",
                                backgroundColor: "#6366f1",
                                display: "inline-block", flexShrink: 0,
                              }}
                            />
                            {d.name}: {d.count}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  );
                })()}
              </>
            )}
          </Paper>
        </Grid>


      </Grid>
    </Box>
  );
}