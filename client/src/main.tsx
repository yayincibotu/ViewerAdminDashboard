import * as React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Create and mount the React application
const container = document.getElementById("root") as HTMLElement;
const root = createRoot(container);

// Add listener to detect payment pages to optimize Stripe loading
document.addEventListener('DOMContentLoaded', function() {
  const path = window.location.pathname.toLowerCase();
  
  // Only preconnect to Stripe domains if we're on a payment-related page
  const isPaymentPage = 
    path.includes('/payment') ||
    path.includes('/checkout') ||
    path.includes('/subscribe') ||
    path.includes('/billing') ||
    (path.includes('/pricing') && window.location.search.includes('checkout=true'));
  
  if (!isPaymentPage) {
    // Remove any Stripe preconnects if we're not on a payment page
    document.querySelectorAll('link[rel="preconnect"][href*="stripe.com"]').forEach(el => {
      el.remove();
    });
  }
});

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);