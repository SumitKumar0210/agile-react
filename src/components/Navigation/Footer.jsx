import { Box, Typography } from "@mui/material";
import { useAuth } from "../../context/AuthContext";

const drawerWidth = 220;

const Footer = ({ mobileOpen }) => {
  const auth = useAuth();
  const ctxAppDetails = auth?.appDetails ?? null;
  const displayAppName = ctxAppDetails?.application_name || (typeof window !== "undefined" ? localStorage.getItem("application_name") : "") || "";
  
  return (
    <Box
      sx={{
        py: 2,
        bgcolor: "#fff",
        mt: "auto",
        // pl: { sm: mobileOpen ? `${drawerWidth}px` : 0 },
        transition: "all 0.3s ease",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 2,
        }}
      >
        <Typography variant="body2">
          © {new Date().getFullYear()} {displayAppName}. All rights reserved.
        </Typography>
        <Typography variant="body2" sx={{ textAlign: "right" }}>
          Powered by <a href="https://techiesquad.com" target="_blank">Techie Squad &reg;</a>
        </Typography>
      </Box>
    </Box>
  );
};

export default Footer;
