import { useState, useEffect } from 'react';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if the window object is available (client-side)
    if (typeof window !== 'undefined') {
      // Initial check
      checkIfMobile();
      
      // Add event listener for window resize
      window.addEventListener('resize', checkIfMobile);
      
      // Clean up the event listener on component unmount
      return () => {
        window.removeEventListener('resize', checkIfMobile);
      };
    }
  }, []);

  function checkIfMobile() {
    setIsMobile(window.innerWidth < 768); // 768px is a common breakpoint for mobile devices
  }

  return isMobile;
}