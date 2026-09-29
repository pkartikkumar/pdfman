import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Footer from './Footer';
import ToolsFooter from './ToolsFooter';

export default function FooterWrapper() {
  const { pathname } = useLocation();
  const [showFullFooter, setShowFullFooter] = useState(false);

  // Default to main footer on Home ('/'), and ToolsFooter on any specific tool route
  const isHomePage = pathname === '/';

  // Reset toggles whenever user navigates to a different page
  useEffect(() => {
    setShowFullFooter(false);
  }, [pathname]);

  if (isHomePage || showFullFooter) {
    return (
      <div>
        {!isHomePage && (
          <div className="bg-light text-center py-2 border-top">
            <button
              onClick={() => setShowFullFooter(false)}
              className="btn btn-sm btn-outline-secondary rounded-pill px-3"
            >
              <i className="bi bi-arrow-up-short"></i> Collapse to Quick Tools Bar
            </button>
          </div>
        )}
        <Footer />
      </div>
    );
  }

  return <ToolsFooter onShowMainFooter={() => setShowFullFooter(true)} />;
}