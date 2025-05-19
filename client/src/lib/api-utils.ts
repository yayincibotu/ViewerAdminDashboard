/**
 * API error suppressor for common 401 Unauthorized errors
 * 
 * This utility helps manage console error messages for unauthenticated users
 */

// Add global error handler to intercept and suppress 401 errors
export const setupAPIErrorSuppression = () => {
  // Override console.error to filter out 401 errors
  const originalConsoleError = console.error;
  console.error = function(...args) {
    // Check if this is a 401 error - simple string matching
    const errorString = args.join(' ');
    if (
      errorString.includes('401') && 
      (errorString.includes('Unauthorized') || errorString.includes('/api/user'))
    ) {
      // Suppress these specific errors
      return;
    }
    
    // Pass through all other errors to the original console.error
    return originalConsoleError.apply(console, args);
  };
  
  // Also override fetch
  const originalFetch = window.fetch;
  window.fetch = async function(input, init) {
    try {
      const response = await originalFetch(input, init);
      
      // Suppress console errors for 401 responses - these are expected for unauthenticated users
      if (response.status === 401) {
        // Just return the response, error handling is suppressed above
        return response;
      }
      
      return response;
    } catch (error) {
      // Allow normal error handling for other types of errors
      throw error;
    }
  };
};