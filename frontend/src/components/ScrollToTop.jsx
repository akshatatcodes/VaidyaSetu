import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll the window to top (in case there's any window-level scroll)
    window.scrollTo(0, 0);
    
    // Target all scrollable containers in the application
    // We search for elements that are likely to be main content scrollable areas
    const scrollableElements = document.querySelectorAll('.overflow-y-auto, .overflow-auto, [style*="overflow-y: auto"], [style*="overflow-y: scroll"]');
    
    scrollableElements.forEach(el => {
      el.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
