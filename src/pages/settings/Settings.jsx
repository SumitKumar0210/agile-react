import React, { useState, useMemo } from "react";
import {
  Container,
  Card,
  CardContent,
  Tabs,
  Tab,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
} from "@mui/material";

// Icons
import { LuUserRoundCog } from "react-icons/lu";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import DescriptionIcon from "@mui/icons-material/Description";
import CalculateIcon from "@mui/icons-material/Calculate";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import LayersIcon from "@mui/icons-material/Layers";
import WorkIcon from "@mui/icons-material/Work";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LabelIcon from "@mui/icons-material/Label";
import { FaLayerGroup } from "react-icons/fa6";
import { GrGroup } from "react-icons/gr";
import { MdOutlineGrade } from "react-icons/md";
import { TbRosetteNumber1 } from "react-icons/tb";
import { GoGitBranch } from "react-icons/go";
import { MdOutlineStorefront } from "react-icons/md";
import { IoSettingsOutline } from "react-icons/io5";
import ListAltIcon from '@mui/icons-material/ListAlt';
import LockIcon from '@mui/icons-material/Lock';

import UserType from "./userType/UserType";
import Department from "./Department/Department";
import Group from "./Group/Group";
import Category from "./Category/Category";
import UOM from "./UOM/Uom";
import Grade from "./Grade/Grade";
import Branch from "./Branch/Branch";
import Vendor from "./Vendor/Vendor";
import Material from "./Material/Material";
import Product from "./Product/Product";
import Machine from "./Machine/Machine";
import GeneralSetting from "./GeneralSetting/GeneralSetting";
import TaxSlab from "./TaxSlab/TaxSlab";
import ProductType from "./ProductType/ProductType";
import RolesPage from "./Roles/Roles";
import { useAuth } from "../../context/AuthContext";
import WorkShift from "./Workshift/Workshift";
import { useLocation } from "react-router-dom";

// Define tab configuration with required permissions
const tabConfig = [
  {
    value: "tab2",
    label: "Groups",
    icon: <GrGroup />,
    component: <Group />,
    permission: "groups.read" // Define the required permission
  },
  {
    value: "tab3",
    label: "Categories",
    icon: <DescriptionIcon />,
    component: <Category />,
    permission: "categories.read"
  },
  {
    value: "tab9",
    label: "Machines",
    icon: <CheckCircleOutlineIcon />,
    component: <Machine />,
    permission: "machines.read"
  },
  {
    value: "tab8",
    label: "UOM",
    icon: <TbRosetteNumber1 />,
    component: <UOM />,
    permission: "uom.read"
  },
  {
    value: "tab5",
    label: "Material",
    icon: <FolderOpenIcon />,
    component: <Material />,
    permission: "materials.read"
  },
  {
    value: "tab26",
    label: "Product Type",
    icon: <LayersIcon />,
    component: <ProductType />,
    permission: "product_types.read"
  },
  {
    value: "tab7",
    label: "Products",
    icon: <LayersIcon />,
    component: <Product />,
    permission: "product.read"
  },
  {
    value: "tab33",
    label: "Tax Slabs",
    icon: <ListAltIcon />,
    component: <TaxSlab />,
    permission: "tax_slabs.read"
  },
  {
    value: "tab1",
    label: "User Roles",
    icon: <LuUserRoundCog />,
    component: <RolesPage />,
    permission: "roles.read",
    // Alternative: use role check instead
    // role: "admin" 
  },
  {
    value: "tab4",
    label: "Vendors",
    icon: <MdOutlineStorefront />,
    component: <Vendor />,
    permission: "vendors.read"
  },
  {
    value: "tab47",
    label: "Working Shift",
    icon: <MdOutlineStorefront />,
    component: <WorkShift />,
    permission: "working_shifts.read"
  },
  {
    value: "tab15",
    label: "Departments",
    icon: <FaLayerGroup />,
    component: <Department />,
    permission: "departments.read"
  },
  {
    value: "tab35",
    label: "General Settings",
    icon: <IoSettingsOutline />,
    component: <GeneralSetting />,
    permission: "general_settings.read",
    // Or require admin role
    // role: "admin"
  },
];

function SettingsPage() {
  const { hasPermission, hasRole, hasAnyPermission } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Filter tabs based on user permissions
  const allowedTabs = useMemo(() => {
    return tabConfig.filter((tab) => {
      // Check if user has required permission
      if (tab.permission && !hasPermission(tab.permission)) {
        return false;
      }

      // Check if user has required role
      if (tab.role && !hasRole(tab.role)) {
        return false;
      }

      // Check if user has any of the required permissions
      if (tab.anyPermissions && !hasAnyPermission(tab.anyPermissions)) {
        return false;
      }

      return true;
    });
  }, [hasPermission, hasRole, hasAnyPermission]);

  // Set initial active tab to first allowed tab
  // const [activeTab, setActiveTab] = useState(() => {
  //   return allowedTabs.length > 0 ? allowedTabs[0].value : null;
  // });

  const location = useLocation();

  // Replace the existing useState for activeTab:
  const [activeTab, setActiveTab] = useState(() => {
    // If navigated back from sub-departments, restore the requested tab
    const requestedTab = location.state?.activeTab;
    if (requestedTab && allowedTabs.some((t) => t.value === requestedTab)) {
      return requestedTab;
    }
    return allowedTabs.length > 0 ? allowedTabs[0].value : null;
  });

  const handleChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const activeComponent = allowedTabs.find((t) => t.value === activeTab)?.component;

  // If user has no access to any settings tab
  if (allowedTabs.length === 0) {
    return (
      <Container
        disableGutters
        sx={{
          maxWidth: "100% !important",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh'
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <LockIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary">
            You don't have permission to access any settings.
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container
      disableGutters
      sx={{
        maxWidth: "100% !important",
        overflowX: "hidden",
        boxSizing: "border-box",
        marginBottom: 3
      }}
    >
      {/* Page Title */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">Settings</Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          height: isMobile ? "auto !important" : "calc(100vh - 220px)",
          gap: 2,
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {/* Sidebar */}
        <Box
          sx={{
            flex: isMobile ? "0 0 auto" : "0 0 240px",
            height: isMobile ? "auto !important" : "100%",
            boxSizing: "border-box",
          }}
        >
          <Card
            variant="outlined"
            sx={{
              height: isMobile ? "auto !important" : "100%",
              overflowY: isMobile ? "visible !important" : "auto",
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Navigation
              </Typography>
              <Tabs
                orientation={isMobile ? "horizontal" : "vertical"}
                value={activeTab}
                onChange={handleChange}
                variant="scrollable"
                allowScrollButtonsMobile
                TabIndicatorProps={{ style: { display: "none" } }}
                sx={{
                  alignItems: isMobile ? "center" : "flex-start",
                  maxWidth: "100%",
                  borderRight: "none",
                  '& .MuiTabs-scroller': {
                    display: "block",
                    width: "100%",
                  },
                  '& .MuiTab-root': {
                    justifyContent: 'flex-start',
                    borderRadius: 1,
                    textTransform: 'none',
                    minHeight: 40,
                    width: "100%",
                    maxWidth: "100%",
                    px: 1,
                    mb: 1,
                    backgroundColor: 'theme.light',
                    fontSize: isMobile ? "0.75rem" : "0.9rem",
                    fontWeight: 500,
                    "&:hover": {
                      backgroundColor: 'theme.active',
                      color: "primary.main",
                    },
                  },
                  '& .Mui-selected': {
                    backgroundColor: 'theme.active',
                    color: 'primary.main',
                    fontWeight: 500,
                    borderRight: 'none !important',
                  },
                  '& .MuiTab-root .MuiSvgIcon-root': {
                    fontSize: '1.2rem',
                    marginRight: 1,
                  },
                }}
              >
                {allowedTabs.map((tab) => (
                  <Tab
                    key={tab.value}
                    value={tab.value}
                    label={tab.label}
                    icon={tab.icon}
                    iconPosition="start"
                  />
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </Box>

        {/* Main Content */}
        <Box
          sx={{
            flex: 1,
            height: isMobile ? "auto !important" : "100%",
            boxSizing: "border-box",
            overflowX: "auto"
          }}
        >
          <Card
            variant="outlined"
            sx={{
              height: isMobile ? "auto !important" : "100%",
              display: "flex",
              flexDirection: "column",
              overflow: isMobile ? "visible !important" : "hidden",
            }}
          >
            <CardContent
              sx={{
                flexGrow: 1,
                overflowY: isMobile ? "visible !important" : "auto",
                p: 2,
              }}
            >
              {activeComponent}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  );
}

export default SettingsPage;