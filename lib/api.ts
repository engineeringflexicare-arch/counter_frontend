import axios from "axios";

// Determine base URL, failing fast in production if missing
let baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;

if (!baseURL) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("CRITICAL CONFIGURATION ERROR: NEXT_PUBLIC_API_BASE_URL is not set in production.");
  } else {
    // Development fallback
    baseURL = "http://localhost:3000";
  }
}

const api = axios.create({
  baseURL,
  withCredentials: true, // Send HttpOnly cookies automatically
});

// We no longer attach the token from localStorage via interceptor,
// as it is now managed via HttpOnly cookies by the browser.

export default api;