// Sidebar.jsx
import React, { useState, useEffect } from "react";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Box,
  Typography,
  Collapse,
  ListItemIcon,
  useMediaQuery,
  useTheme,
  Skeleton,
} from "@mui/material";
import { NavLink, useLocation } from "react-router-dom";

// Icons
import { SlArrowDown, SlArrowUp } from "react-icons/sl";
import { AiOutlineHome } from "react-icons/ai";
import { FiUsers } from "react-icons/fi";
import { MdStorefront, MdOutlineDashboard } from "react-icons/md";
import { RiFileList3Line, RiFlowChart } from "react-icons/ri";
import { LiaFileInvoiceSolid } from "react-icons/lia";
import { LuTable } from "react-icons/lu";
import { IoConstructOutline } from "react-icons/io5";
import { TbUsersPlus } from "react-icons/tb";
import { BsBoxSeam, BsTag  } from "react-icons/bs";

import Logo from "../../assets/images/logo.svg";
import { useAuth } from "../../context/AuthContext";

const drawerWidth = 220; 

/**
 * menuSections:
 * - Provide `anyPermissions` on parent or child to hide items when user lacks ALL of them.
 * - If `anyPermissions` is not provided -> item is visible to any logged-in user.
 */
const menuSections = [
  {
    title: "App",
    items: [{ text: "Dashboard", to: "/dashboard", icon: <AiOutlineHome /> }],
  },
  {
    title: "Dashboard",
    items: [
      {
        text: "Store",
        icon: <MdStorefront />,
        anyPermissions: ["purchase_order.create",
          "purchase_order.delete",
          "purchase_order.update",
          "purchase_order.read",
          "qc_po.delete",
          "qc_po.read",
          "qc_po.approve_qc",
          "qc_po.upload_bill",
          "qc_po.update",
          "qc_po.upload_invoice",
          "material_request.read",
          "material_request.approve",
          "vendor_invoices.read",
          "vendor_invoices.collect_payment",
          "vendor_lists.read",
          "stocks.read",
        ],
        children: [
          { text: "Dashboard", to: "/vendor/dashboard", icon: <MdOutlineDashboard /> },
          {text: "CCS List", to: "/ccs", icon: <RiFileList3Line /> },
          {
            text: "Purchase Order", to: "/vendor/purchase-order", icon: <RiFileList3Line />, anyPermissions: ["purchase_order.create",
              "purchase_order.delete",
              "purchase_order.update",
              "purchase_order.read"]
          },
          {
            text: "QC PO", to: "/vendor/purchase-order/approve", icon: <RiFileList3Line />, anyPermissions: ["qc_po.delete",
              "purchase_order.create",
              "qc_po.read",
              "qc_po.approve_qc",
              "qc_po.upload_bill",
              "qc_po.update",
              "qc_po.upload_invoice",]
          },
          {
            text: "Material Requests", to: "/production/product-request", icon: <MdOutlineDashboard />, anyPermissions: [
              "material_request.read",
              "material_request.approve",
            ]
          },
          {
            text: "Vendor Invoice", to: "/vendor/invoice", icon: <LiaFileInvoiceSolid />, anyPermissions: [
              "vendor_invoices.read",
              "vendor_invoices.collect_payment",
            ]
          },
          { text: "Vendor list", to: "/vendor/list", icon: <LuTable />, anyPermissions: ["vendor_lists.read"] },
          { text: "Movement", to: "/stocks", icon: <BsBoxSeam />, anyPermissions: ["stocks.read"] },
          {
            text: "Inventory", to: "/material-inventory", icon: <BsBoxSeam />, anyPermissions: ["product_stocks.read"]
          },
          {
            text: "Semi-Furnished Product Inventory", to: "/production/semi-furnished-product-stocks", icon: <BsBoxSeam />, anyPermissions: ["product_stocks.read"]
          },
          {
            text: "Semi-Furnished Product", to: "/production/semi-furnished-products", icon: <BsBoxSeam />, anyPermissions: ["product_stocks.read"]
          },
        ],
      },
      {
        text: "Customers",
        icon: <FiUsers />,
        anyPermissions: [
          "quotations.generate_public_link",
          "quotations.read",
          "quotations.update",
          "quotations.delete",
          "quotations.create",
          "quotations.approved_data",
          "customer_orders.add_production",
          "customer_orders.create",
          "customer_orders.update",
          "customer_orders.read",
          "customer_lists.view_ledger",
        ],
        children: [
          { text: "Dashboard", to: "/customer/dashboard", icon: <MdOutlineDashboard /> },
          {
            text: "Quotation", to: "/customer/quote", icon: <RiFileList3Line />, anyPermissions: [
              "quotations.generate_public_link",
              "quotations.read",
              "quotations.update",
              "quotations.delete",
              "quotations.create",
              "quotations.approved_data",
            ]
          },
          {
            text: "Order", to: "/customer/order", icon: <RiFileList3Line />, anyPermissions: [
              "customer_orders.add_production",
              "customer_orders.create",
              "customer_orders.update",
              "customer_orders.read",
            ]
          },
          { text: "Customer List", to: "/customer/list", icon: <LuTable />, anyPermissions: ["customer_lists.view_ledger"] },
        ],
      },
      {
        text: "Production",
        icon: <FiUsers />,
        anyPermissions: [
          "company_orders.read",
          "company_orders.update",
          "company_orders.create",
          "productions.switch_to",
          "productions.change_supervisor",
          "productions.change_priority",
          "productions.log_time",
          "productions.request_stock",
          "productions.add_tentative",
          "productions.upload_file",
          "productions.send_message",
          "productions.qc_fail",
          "productions.ready_for_delivery",
        ],
        children: [
          {
            text: "IH Production Order", to: "/production/orders", icon: <MdOutlineDashboard />, anyPermissions: [
              "company_orders.read",
              "company_orders.update",
              "company_orders.create",
            ]
          },
          {
            text: "Production Chain", to: "/production/production-chain", icon: <RiFlowChart />, anyPermissions: [
              "productions.switch_to",
              "productions.change_supervisor",
              "productions.change_priority",
              "productions.log_time",
              "productions.request_stock",
              "productions.add_tentative",
              "productions.upload_file",
              "productions.send_message",
              "productions.qc_fail",
              "productions.ready_for_delivery"
            ]
          },
          
        
          {
            text: "RRP", to: "/production/rrp-calculation", icon: <BsTag  />, permission:"rrp.read"
          },
        ],
      },
      {
        text: "Billing",
        icon: <FiUsers />,
        anyPermissions: [
          "bills.read",
          "bills.create_challan",
          "bills.mark_delivered",
          "bills.update",
          "bills.delete",
          "bills.create",
          "dispatch_product.read",
          "dispatch_product.view_challan",
          "dispatch_product.mark_delivered",
          "dispatch_product.collect_payment",
        ],
        children: [
          {
            text: "Bills", to: "/bills", icon: <RiFlowChart />, anyPermissions: [
              "bills.read",
              "bills.create_challan",
              "bills.mark_delivered",
              "bills.update",
              "bills.delete",
              "bills.create",

            ]
          },
          {
            text: "Dispatched Product", to: "/bill/dispatched-product", icon: <RiFlowChart />, anyPermissions: [
              "dispatch_product.read",
              "dispatch_product.view_challan",
              "dispatch_product.mark_delivered",
              "dispatch_product.collect_payment",
            ]
          },
          {
            text: "Product Stocks", to: "/product/stocks", icon: <BsBoxSeam />, anyPermissions: ["product_stocks.read"]
          },
          {
            text: "Discarded Product", to: "/discarded-product", icon: <BsBoxSeam />, anyPermissions: ["product_stocks.read"]
          },
        ],
      },
      {
        text: "Users",
        icon: <FiUsers />,
        anyPermissions: [
          "customers.update",
          "customers.delete",
          "customers.create",
          "labours.delete",
          "labours.create",
          "labours.update",
          "users.update",
          "users.delete",
          "users.create",
        ],
        children: [
          {
            text: "Users", to: "/users", icon: <FiUsers />, anyPermissions: [
              "users.update",
              "users.delete",
              "users.create",
            ]
          },
          {
            text: "Customers", to: "/customers", icon: <TbUsersPlus />, anyPermissions: [
              "customers.update",
              "customers.delete",
              "customers.create",
            ]
          },
          {
            text: "Labours", to: "/labours", icon: <IoConstructOutline />, anyPermissions: [
              "labours.delete",
              "labours.create",
              "labours.update",
            ]
          },
        ],
      },
      {
        text: "Logs", to: "/logs", icon: <MdOutlineDashboard />, anyPermissions: [
          "logs.customer_payment",
          "logs.production",
          "logs.vendor_payment",
        ]
      },
      {
        text: "Settings", to: "/settings", icon: <MdOutlineDashboard />, anyPermissions: [
          "settings.read",
          "groups.read",
          "categories.read",
          "machines.read",
          "uom.read",
          "materials.read",
          "product_types.read",
          "product.read",
          "tax_slabs.read",
          "roles.read",
          "vendors.read",
          "departments.read",
        ]
      },
    ],
  },
];

const Sidebar = ({ mobileOpen, onClose }) => {
  const auth = useAuth();
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const location = useLocation();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Fallback to localStorage for appDetails if context doesn't provide it
  const ctxAppDetails = auth?.appDetails ?? null;
  const storedLogo = typeof window !== "undefined" ? localStorage.getItem("logo") : null;
  const storedHorizontal = typeof window !== "undefined" ? localStorage.getItem("horizontalLogo") : null;
  const displayLogo = (ctxAppDetails?.horizontal_logo) || storedHorizontal || (ctxAppDetails?.logo) || storedLogo || Logo;
  const displayAppName = ctxAppDetails?.application_name || (typeof window !== "undefined" ? localStorage.getItem("application_name") : "") || "";

  // Initialize openSubmenu based on current route
  useEffect(() => {
    menuSections.forEach(({ items }) => {
      items.forEach(({ text, children }) => {
        if (children) {
          const isChildActive = children.some((child) =>
            location.pathname.startsWith(child.to)
          );
          if (isChildActive) {
            setOpenSubmenu(text);
          }
        }
      });
    });
  }, [location.pathname]);

  // Update document title (non-blocking)
  useEffect(() => {
    if (displayAppName) document.title = displayAppName;
  }, [displayAppName]);

  const handleToggle = (menu) => setOpenSubmenu(openSubmenu === menu ? null : menu);
  const handleItemClick = () => { if (isMobile) onClose?.(); };

  // permission helper: uses hasAnyPermission from auth if available, else default to true
  const canShow = (anyPermissions) => {
    if (!Array.isArray(anyPermissions) || anyPermissions.length === 0) return true;
    if (auth?.hasAnyPermission && typeof auth.hasAnyPermission === "function") {
      try {
        return auth.hasAnyPermission(anyPermissions);
      } catch (e) {
        // Safeguard: if permission check fails, hide the item
        console.warn("hasAnyPermission threw:", e);
        return false;
      }
    }
    // if auth provider doesn't expose hasAnyPermission (shouldn't happen), fall back to showing
    return true;
  };

  const drawerContent = (
    <>
      {/* Logo */}
      <Box display="flex" alignItems="center" justifyContent="center" sx={{ p: 2 }}>
        {/* Show skeleton while appDetails not available in either context or localStorage */}
        {(!displayLogo || displayLogo === "") ? (
          <Skeleton variant="rectangular" width={140} height={48} sx={{ borderRadius: 1 }} />
        ) : (
          <img
            src={displayLogo}
            alt={displayAppName || "logo"}
            style={{
              width: "140px",
              height: "48px",
              objectFit: "contain",
              display: imageLoaded ? "block" : "none",
            }}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = Logo;
              setImageLoaded(true);
            }}
          />
        )}
      </Box>

      {/* Menu */}
      {menuSections.map(({ items }, sectionIndex) => (
        <List key={sectionIndex} disablePadding>
          {items.map(({ text, to, icon, children, anyPermissions }) => {
            // If parent has permissions defined and user lacks them -> hide parent entirely
            if (!canShow(anyPermissions)) return null;

            const isParentActive = children?.some((c) => location.pathname.startsWith(c.to)) || (to && location.pathname.startsWith(to));

            return (
              <React.Fragment key={text}>
                <ListItemButton
                  component={to && !children ? NavLink : "button"}
                  to={to || undefined}
                  onClick={children ? () => handleToggle(text) : handleItemClick}
                  className="menu-item"
                  sx={{
                    mx: 1, mb: 0.25, borderRadius: 1, color: "text.primary",
                    display: "flex", alignItems: "center",
                    "& .MuiListItemIcon-root": { color: "inherit", minWidth: 20 },
                    "&.active, &:hover": {
                      backgroundColor: "rgba(25,118,210,0.08)",
                      color: "primary.main",
                      "& .MuiListItemIcon-root": { color: "primary.main" },
                      "& .MuiListItemText-primary": { color: "primary.main" },
                    },
                    ...(isParentActive && {
                      backgroundColor: "rgba(25,118,210,0.08)",
                      color: "primary.main",
                      "& .MuiListItemIcon-root": { color: "primary.main" },
                      "& .MuiListItemText-primary": { color: "primary.main" },
                    }),
                  }}
                >
                  {icon && <ListItemIcon>{icon}</ListItemIcon>}
                  <ListItemText primary={text} primaryTypographyProps={{ variant: "body2" }} />
                  {children && (openSubmenu === text ? <SlArrowUp /> : <SlArrowDown />)}
                </ListItemButton>

                {/* Submenu */}
                {children && (
                  <Collapse in={openSubmenu === text} timeout="auto" unmountOnExit>
                    <List disablePadding>
                      {children.map((sub) => {
                        if (!canShow(sub.anyPermissions)) return null;

                        return (
                          <ListItemButton
                            key={sub.text}
                            component={NavLink}
                            to={sub.to}
                            onClick={handleItemClick}
                            className="menu-item"
                            sx={{
                              pl: 4, mx: 1, mb: 0.25, borderRadius: 1, color: "text.primary",
                              "& .MuiListItemIcon-root": { color: "inherit", minWidth: 20 },
                              "&.active, &:hover": {
                                backgroundColor: "rgba(25,118,210,0.08)",
                                color: "primary.main",
                                "& .MuiListItemIcon-root": { color: "primary.main" },
                                "& .MuiListItemText-primary": { color: "primary.main" },
                              },
                            }}
                          >
                            {sub.icon && <ListItemIcon>{sub.icon}</ListItemIcon>}
                            <ListItemText primary={sub.text} primaryTypographyProps={{ variant: "body2", sx: { fontSize: "0.85rem" } }} />
                          </ListItemButton>
                        );
                      })}
                    </List>
                  </Collapse>
                )}
              </React.Fragment>
            );
          })}
        </List>
      ))}
    </>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: "block", sm: "none" }, "& .MuiDrawer-paper": { width: drawerWidth } }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="persistent"
        open={mobileOpen}
        sx={{ display: { xs: "none", sm: "block" }, "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" } }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Sidebar;
