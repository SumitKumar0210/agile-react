// Login.jsx
import React, { useState, useEffect } from "react";
import {
  Grid,
  Paper,
  TextField,
  Button,
  Typography,
  Link as MuiLink,
  Skeleton,
  CircularProgress,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import Logo from "../../assets/images/aarish-logo.png";
import { useAuth } from "../../context/AuthContext";
import { authLogin } from "./authSlice";
import { useDispatch } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";

const mediaUrl = import.meta.env.VITE_MEDIA_URL || "";

const Login = () => {
  const paperStyle = { padding: "20px 30px", width: 350 };
  const navigate = useNavigate();
  const auth = useAuth(); 
  const dispatch = useDispatch();

  // prefer appDetails from context, fallback to local storage / static logo
  const appDetails = auth?.appDetails ?? {};
  const setUserFromCtx = auth?.setUser ?? null;
  const loginFromCtx = auth?.login ?? null;

  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAppDetails, setIsLoadingAppDetails] = useState(true);

  const validationSchema = Yup.object({
    email: Yup.string()
      .trim()
      .email("Please enter a valid email address")
      .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address")
      .min(4, "Email must be at least 4 characters long")
      .max(100, "Email cannot exceed 100 characters")
      .required("Email is required"),
    password: Yup.string()
      .min(4, "Password must be at least 4 characters")
      .required("Password is required"),
  });

  // Check if appDetails is loaded
  useEffect(() => {
    // If appDetails exists and has logo property (even if empty), consider it loaded
    if (appDetails && Object.keys(appDetails).length > 0) {
      setIsLoadingAppDetails(false);
    }
    //  else {
    //   // Give a small timeout to check if appDetails will be populated
    //   const timer = setTimeout(() => {
    //     setIsLoadingAppDetails(false);
    //   }, 5000);
    //   return () => clearTimeout(timer);
    // }
  }, [appDetails]);

  useEffect(() => {
    const preventBack = () => {
      window.history.pushState(null, "", window.location.href);
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", preventBack);

    return () => window.removeEventListener("popstate", preventBack);
  }, []);

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        const res = await dispatch(authLogin(values));

        if (res.error) {
          console.error("Login error:", res.payload ?? res.error);
          return;
        }

        const payload = res.payload || {};
        const token =
          payload.token ||
          payload.access_token ||
          (payload.data && payload.data.token) ||
          null;

       
        if (loginFromCtx && token) {
          await loginFromCtx(token);
        } else {
          // fallback: set user directly in context if setUser exists
          // try to build a minimal normalized user object
          const userObj = {
            name: payload.user_name ?? payload.name ?? (payload.data && payload.data.name) ?? "",
            profileImage: payload.image
              ? mediaUrl + payload.image
              : (payload.data && payload.data.image ? mediaUrl + payload.data.image : ""),
            type: payload.type ?? (payload.data && payload.data.type) ?? "",
            // optional: roles/permissions if your authLogin returns them
            roles: payload.roles ?? (payload.data && payload.data.roles) ?? [],
            permissions: payload.permissions ?? (payload.data && payload.data.permissions) ?? [],
          };

          if (setUserFromCtx) {
            try {
              setUserFromCtx(userObj);
            } catch (e) {
        
              console.warn("setUser failed", e);
            }
          }
          if (token) {
            try {
              localStorage.setItem("token", token);
            } catch (e) {}
            window.dispatchEvent(new CustomEvent("auth-login", { detail: { token } }));
          }
        }
        
        navigate("/dashboard");
      } catch (error) {
        console.error("Login failed:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Determine logo source with fallback logic
  const storedLogo = localStorage.getItem("logo");
  let logoSrc = Logo; // Default fallback

  if (appDetails && appDetails.logo) {
    logoSrc = appDetails.logo;
  } else if (storedLogo) {
    logoSrc = storedLogo;
  }

  // If logo failed to load, use default Logo
  const displayLogo = logoError ? Logo : logoSrc;

  const handleLogoLoad = () => {
    setLogoLoaded(true);
    setLogoError(false);
  };

  const handleLogoError = () => {
    setLogoLoaded(true);
    setLogoError(true);
  };

  // Show skeleton while loading app details OR while logo is loading
  const showSkeleton = isLoadingAppDetails || !logoLoaded;

  return (
    <Paper elevation={10} style={paperStyle}>
      <Grid align="center">
        {showSkeleton && (
          <Skeleton
            variant="rectangular"
            width={100}
            height={100}
            sx={{ marginBottom: "10px", borderRadius: 1, margin: "0 auto" }}
          />
        )}
        <img
          src={displayLogo}
          alt="logo"
          style={{
            width: "100px",
            display: showSkeleton ? "none" : "block",
            margin: "0 auto",
          }}
          onLoad={handleLogoLoad}
          onError={handleLogoError}
        />
        <Typography variant="h4" component="h2" sx={{ fontSize: '1.25rem', my: 2, mt: showSkeleton ? 0 : 1 }}>
          Sign In
        </Typography>
      </Grid>

      <form onSubmit={formik.handleSubmit}>
        <TextField
          label="Email"
          name="email"
          variant="outlined"
          fullWidth
          size="small"
          required
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.email && Boolean(formik.errors.email)}
          helperText={formik.touched.email && formik.errors.email}
          disabled={isSubmitting}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          variant="outlined"
          fullWidth
          size="small"
          required
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.password && Boolean(formik.errors.password)}
          helperText={formik.touched.password && formik.errors.password}
          disabled={isSubmitting}
          sx={{ mb: 2 }}
        />

        <Button
          type="submit"
          color="primary"
          variant="contained"
          fullWidth
          sx={{
            mt: 0,
          }}
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <Typography align="center" sx={{ marginTop: 1 }}>
        <MuiLink component={RouterLink} to="/forgot-password">
          Forgot password?
        </MuiLink>
      </Typography>
    </Paper>
  );
};

export default Login;