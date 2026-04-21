import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Tooltip,
} from "@mui/material";
import { HiOutlineMenu } from "react-icons/hi";
import Logout from "@mui/icons-material/Logout";
import Settings from "@mui/icons-material/Settings";
import PersonAdd from "@mui/icons-material/PersonAdd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import User from "../../assets/images/user.jpg";

const drawerWidth = 220;

const Header = ({ mobileOpen, onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleClose();
    logout();
    navigate("/login");
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: "#fff",
        color: "text.primary",
        boxShadow: "none",
        borderBottom: "1px solid #f0f0f0",
        width: { sm: mobileOpen ? `calc(100% - ${drawerWidth}px)` : "100%" },
        ml: { sm: mobileOpen ? `${drawerWidth}px` : 0 },
        transition: "all 0.3s ease",
      }}
    >
      <Toolbar>
        <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
          {/* Left Side (Menu Icon) */}
         <Box display="flex" alignItems="center">
            {/* Toggle/Menu Icon */}
            <IconButton edge="start" onClick={onToggleSidebar} sx={{ mr: 1 }}>
              <HiOutlineMenu size={22} />
            </IconButton>
            {/* Title (AGLIE) */}
            <Typography variant="h6" sx={{ fontWeight: 600, display: { xs: 'block', sm: 'none' } }}>
              AGLIE
            </Typography>
          </Box>

          {/* Right Side (User Menu) */}
          <Box>
            <Tooltip title="Account settings">
              <IconButton onClick={handleClick} size="small" sx={{ ml: 2 }}>
                <Avatar sx={{ width: 40, height: 40 }} src={user?.profileImage??User} alt="User" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        {/* Dropdown Menu */}
        <Menu
          anchorEl={anchorEl}
          id="account-menu"
          open={open}
          onClose={handleClose}
          onClick={handleClose}
          slotProps={{
            paper: {
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 0.5,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
              "&::before": {
                content: '""',
                display: "block",
                position: "absolute",
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: "background.paper",
                transform: "translateY(-50%) rotate(45deg)",
                zIndex: 0,
              },
            },
          }
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <MenuItem sx={{ flexDirection: "column", alignItems: "center" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              {user?.name || "Amit Kumar"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.type || "Admin"}
            </Typography>
          </MenuItem>

          <Divider />

          <MenuItem onClick={() => navigate("#")}>
            <ListItemIcon>
              <PersonAdd fontSize="small" />
            </ListItemIcon>
            Profile
          </MenuItem>

          <MenuItem onClick={() => navigate("#")}>
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            Reset Password
          </MenuItem>

          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
