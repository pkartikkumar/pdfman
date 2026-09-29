import React from 'react';
import { Link } from 'react-router-dom';
import { toolsData } from '../data/toolsData';
import brandLogo from '../assets/images/brand_logo.png';

export default function ToolsFooter({ onShowMainFooter }) {
  return (
    <footer className="bg-white border-top py-3 mt-auto shadow-sm">
      <div className="container d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
        {/* Left: Brand & Toggle to Full Footer */}
        <div className="d-flex align-items-center gap-3">
          <span className="fw-bold brand-red small d-flex align-items-center gap-1">
            <img src={brandLogo} alt="PDFMAN Logo" className="img-fluid" style={{ maxWidth: '50px' }} />
          </span>
          <span className="text-muted small d-none d-sm-inline">|</span>
          <button
            onClick={onShowMainFooter}
            className="btn btn-sm btn-link text-decoration-none text-muted p-0 small fw-semibold hover-red d-flex align-items-center gap-1"
          >
            <i className="bi bi-layout-text-window-reverse"></i> View All Pages & Links
          </button>
        </div>

        {/* Center: Popular Quick Tool Switchers */}
        <div className="d-flex flex-wrap justify-content-center align-items-center gap-2">
          {toolsData.slice(0, 7).map((tool) => (
            <Link
              key={tool.id}
              to={tool.path}
              className="badge bg-light text-secondary border text-decoration-none py-2 px-3 rounded-pill fw-semibold hover-red transition-all"
              style={{ fontSize: '11px' }}
            >
              <i className={`bi ${tool.icon} me-1`} style={{ color: tool.color }}></i>
              {tool.title}
            </Link>
          ))}
        </div>

        {/* Right: Copyright */}
        <div className="small text-muted text-nowrap">
          &copy; {new Date().getFullYear()} PDFMAN
        </div>
      </div>
    </footer>
  );
}