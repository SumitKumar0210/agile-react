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
import { Link as RouterLink } from "react-router-dom";
import Logo from "../../assets/images/aarish-logo.png";
import { forgotPassword } from "./authSlice";
import { useDispatch } from "react-redux";
import { useAuth } from "../../context/AuthContext";

const ForgotPassword = () => {
  const mediaUrl = import.meta.env.VITE_MEDIA_URL;
  const { appDetails } = useAuth();

  const paperStyle = { padding: "20px 30px", width: 350 };
  const dispatch = useDispatch();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [isLoadingAppDetails, setIsLoadingAppDetails] = useState(true);

  // Check if appDetails is loaded
  useEffect(() => {
    if (appDetails && Object.keys(appDetails).length > 0) {
      setIsLoadingAppDetails(false);
    } 
    // else {
    //   const timer = setTimeout(() => {
    //     setIsLoadingAppDetails(false);
    //   }, 1000);
    //   return () => clearTimeout(timer);
    // }
  }, [appDetails]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || email.trim().length < 4) {
      setError("Email must be at least 4 characters long.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await dispatch(forgotPassword({ email }));
      if (res.error) {
        setError(res.error.message || "Something went wrong.");
      } else {
        setSuccess("Reset link sent to your email.");
      }
    } catch (err) {
      setError("Failed to send reset link.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            marginBottom: "10px",
            display: showSkeleton ? "none" : "block",
            margin: showSkeleton ? "0" : "0 auto 10px",
          }}
          onLoad={handleLogoLoad}
          onError={handleLogoError}
        />
        <Typography variant="h5" component="h2" sx={{ fontSize: '1.25rem', my: 2 }}>
          Forgot Password
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Enter your email and we'll send you a reset link.
        </Typography>
      </Grid>

      <form onSubmit={handleSubmit}>
        <TextField
          label="Email"
          placeholder="Enter your email"
          type="email"
          variant="outlined"
          size="small"
          fullWidth
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          sx={{ mb: 2 }}
        />

        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 1 }}>
            {error}
          </Typography>
        )}
        {success && (
          <Typography color="primary" variant="body2" sx={{ mb: 1 }}>
            {success}
          </Typography>
        )}

        <Button
          type="submit"
          color="primary"
          variant="contained"
          fullWidth
          disabled={isSubmitting}
          startIcon={
            isSubmitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : null
          }
        >
          {isSubmitting ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>

      <Typography align="center" sx={{ mt: 2 }}>
        <MuiLink component={RouterLink} to="/login">
          Back to Login
        </MuiLink>
      </Typography>
    </Paper>
  );
};

export default ForgotPassword;