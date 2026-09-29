import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import brandLogo from '../assets/images/brand_logo.png';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null); // 'toPdf' | 'fromPdf' | 'allTools' | null
  const navRef = useRef(null);

  const toggleNav = () => setIsOpen((prev) => !prev);

  const closeNav = () => {
    setIsOpen(false);
    setActiveDropdown(null);
  };

  const toggleDropdown = (name) => (e) => {
    e.preventDefault();
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        closeNav();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  return (
    <nav
      ref={navRef}
      className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm px-4 sticky-top"
    >
      <Link
        className="navbar-brand fw-bold fs-3 brand-red d-flex align-items-center gap-2"
        to="/"
        onClick={closeNav}
      >
        <img className="brandLogo" src={brandLogo} alt="Brand Logo" style={{ height: '60px' }} />
      </Link>

      {/* Hamburger Toggle */}
      <button
        className="navbar-toggler"
        type="button"
        onClick={toggleNav}
        aria-expanded={isOpen}
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon"></span>
      </button>

      {/* Nav Content */}
      <div className={`collapse navbar-collapse ${isOpen ? 'show' : ''}`} id="navContent">
        <ul className="navbar-nav me-auto mb-2 mb-lg-0 fw-semibold text-uppercase small align-items-lg-center">
          {/* Primary Quick Links */}
          <li className="nav-item">
            <Link className="nav-link" to="/merge-pdf" onClick={closeNav}>
              Merge PDF
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/split-pdf" onClick={closeNav}>
              Split PDF
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/compress-pdf" onClick={closeNav}>
              Compress PDF
            </Link>
          </li>

          {/* Dropdown 1: Convert to PDF */}
          <li className="nav-item dropdown">
            <a
              className={`nav-link dropdown-toggle text-uppercase fw-semibold ${activeDropdown === 'toPdf' ? 'show' : ''
                }`}
              href="#"
              id="navbarDropdownToPdf"
              role="button"
              onClick={toggleDropdown('toPdf')}
              aria-expanded={activeDropdown === 'toPdf'}
            >
              Convert to PDF
            </a>
            <ul
              className={`dropdown-menu border-0 shadow rounded-3 py-2 ${activeDropdown === 'toPdf' ? 'show' : ''
                }`}
              aria-labelledby="navbarDropdownToPdf"
            >
              <li>
                <Link
                  className="dropdown-item py-2 d-flex align-items-center gap-2"
                  to="/convert/word-to-pdf"
                  onClick={closeNav}
                >
                  <i className="bi bi-file-earmark-word-fill text-primary"></i>
                  <span>Word to PDF</span>
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item py-2 d-flex align-items-center gap-2"
                  to="/convert/powerpoint-to-pdf"
                  onClick={closeNav}
                >
                  <i className="bi bi-file-earmark-slides-fill text-danger"></i>
                  <span>PowerPoint to PDF</span>
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item py-2 d-flex align-items-center gap-2"
                  to="/convert/excel-to-pdf"
                  onClick={closeNav}
                >
                  <i className="bi bi-file-earmark-excel-fill text-success"></i>
                  <span>Excel to PDF</span>
                </Link>
              </li>
              <li>
                <hr className="dropdown-divider my-1" />
              </li>
              <li>
                <Link
                  className="dropdown-item py-2 d-flex align-items-center gap-2"
                  to="/jpg-to-pdf"
                  onClick={closeNav}
                >
                  <i className="bi bi-images text-warning"></i>
                  <span>JPG to PDF</span>
                </Link>
              </li>
              <li>
               <Link className="dropdown-item py-2" to="/html-to-pdf" onClick={closeNav}>
    <i className="bi bi-filetype-html text-danger me-2"></i>HTML to PDF
  </Link>
              </li>
            </ul>
          </li>

          {/* Dropdown 2: Convert from PDF */}
          <li className="nav-item dropdown">
            <a
              className={`nav-link dropdown-toggle text-uppercase fw-semibold ${activeDropdown === 'fromPdf' ? 'show' : ''
                }`}
              href="#"
              id="navbarDropdownFromPdf"
              role="button"
              onClick={toggleDropdown('fromPdf')}
              aria-expanded={activeDropdown === 'fromPdf'}
            >
              Convert from PDF
            </a>
            <ul
              className={`dropdown-menu border-0 shadow rounded-3 py-2 ${activeDropdown === 'fromPdf' ? 'show' : ''
                }`}
              aria-labelledby="navbarDropdownFromPdf"
            >
              <li>
                <Link
                  className="dropdown-item py-2 d-flex align-items-center gap-2"
                  to="/convert/pdf-to-word"
                  onClick={closeNav}
                >
                  <i className="bi bi-file-earmark-word text-primary"></i>
                  <span>PDF to Word</span>
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item py-2 d-flex align-items-center gap-2"
                  to="/convert/pdf-to-powerpoint"
                  onClick={closeNav}
                >
                  <i className="bi bi-file-earmark-slides text-danger"></i>
                  <span>PDF to PowerPoint</span>
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item py-2 d-flex align-items-center gap-2"
                  to="/convert/pdf-to-excel"
                  onClick={closeNav}
                >
                  <i className="bi bi-file-earmark-excel text-success"></i>
                  <span>PDF to Excel</span>
                </Link>
              </li>
              <li>
                <hr className="dropdown-divider my-1" />
              </li>
              <li>
                <Link
                  className="dropdown-item py-2 d-flex align-items-center gap-2"
                  to="/pdf-to-jpg"
                  onClick={closeNav}
                >
                  <i className="bi bi-file-earmark-image text-warning"></i>
                  <span>PDF to JPG</span>
                </Link>
              </li>

            </ul>
          </li>

          {/* Dropdown 3: All Tools (Mega-Menu Style Categorization) */}
          <li className="nav-item dropdown">
            <a
              className={`nav-link dropdown-toggle text-uppercase fw-semibold ${activeDropdown === 'allTools' ? 'show' : ''
                }`}
              href="#"
              id="navbarDropdownAllTools"
              role="button"
              onClick={toggleDropdown('allTools')}
              aria-expanded={activeDropdown === 'allTools'}
            >
              Other Tools
            </a>
            <div
              className={`dropdown-menu border-0 shadow rounded-4 p-3 ${activeDropdown === 'allTools' ? 'show' : ''
                }`}
              aria-labelledby="navbarDropdownAllTools"
              style={{ minWidth: '320px' }}
            >
              {/* Section 1: Edit & AI */}
              <h6 className="text-muted fw-bold text-uppercase px-2 mb-2" style={{ fontSize: '0.72rem' }}>
                Edit & Security
              </h6>
              <Link
                className="dropdown-item rounded-2 py-2 d-flex align-items-center gap-2"
                to="/edit-pdf"
                onClick={closeNav}
              >
                <i className="bi bi-pencil-square text-danger"></i>
                <div>
                  <div className="fw-semibold">Edit PDF</div>
                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>Edit text & layout in-place</small>
                </div>
              </Link>

              <Link className="dropdown-item rounded-2 py-2" to="/protect-pdf" onClick={closeNav}>
                <i className="bi bi-shield-lock-fill text-danger me-2"></i>Protect PDF
              </Link>

              <Link className="dropdown-item rounded-2 py-2" to="/unlock-pdf" onClick={closeNav}>
                <i className="bi bi-unlock-fill text-danger me-2"></i>Unlock PDF
              </Link>



              <Link
                className="dropdown-item rounded-2 py-2 d-flex align-items-center gap-2"
                to="/ocr-pdf"
                onClick={closeNav}
              >
                <i className="bi bi-search text-success"></i>
                <div>
                  <div className="fw-semibold">OCR PDF</div>
                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>Make scans searchable</small>
                </div>
              </Link>

              <hr className="dropdown-divider my-2" />
              {/* Section 2: Organize PDF */}
              <h6 className="text-muted fw-bold text-uppercase px-2 mb-2" style={{ fontSize: '0.72rem' }}>
                Organize PDF
              </h6>
              <Link
                className="dropdown-item rounded-2 py-2 d-flex align-items-center gap-2"
                to="/merge-pdf"
                onClick={closeNav}
              >
                <i className="bi bi-file-earmark-pdf text-danger"></i>
                <div>
                  <div className="fw-semibold">Merge PDF</div>
                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>Combine multiple PDFs into one</small>
                </div>
              </Link>
              <Link
                className="dropdown-item rounded-2 py-2 d-flex align-items-center gap-2"
                to="/split-pdf"
                onClick={closeNav}
              >
                <i className="bi bi-file-earmark-pdf text-info"></i>
                <div>
                  <div className="fw-semibold">Split PDF</div>
                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>Divide a PDF into separate pages</small>
                </div>
              </Link>
              <Link
                className="dropdown-item rounded-2 py-2 d-flex align-items-center gap-2"
                to="/add-watermark"
                onClick={closeNav}
              >
                <i className="bi bi-file-earmark-pdf text-warning"></i>
                <div>
                  <div className="fw-semibold">Add Watermark</div>
                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>Add text or image watermarks to PDFs</small>
                </div>
              </Link>

                     <hr className="dropdown-divider my-2" />

              {/* Section 2: Image & Graphic Tools */}
              <h6 className="text-muted fw-bold text-uppercase px-2 mb-2" style={{ fontSize: '0.72rem' }}>
                Image Tools
              </h6>
              <Link
                className="dropdown-item rounded-2 py-2 d-flex align-items-center gap-2"
                to="/compress-image"
                onClick={closeNav}
              >
                <i className="bi bi-file-earmark-image text-success"></i>
                <div>
                  <div className="fw-semibold">Compress Image</div>
                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>JPG, PNG, WebP, AVIF, HEIC</small>
                </div>
              </Link>
              <Link
                className="dropdown-item rounded-2 py-2 d-flex align-items-center gap-2"
                to="/png-maker"
                onClick={closeNav}
              >
                <i className="bi bi-filetype-png text-info"></i>
                <div>
                  <div className="fw-semibold">PNG Maker</div>
                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>AI background transparency</small>
                </div>
              </Link>
            </div>
          </li>
        </ul>

        {/* Action Buttons
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-sm btn-outline-secondary fw-semibold px-3 rounded-pill">
            Log in
          </button>
          <button className="btn btn-sm btn-danger fw-semibold px-3 rounded-pill" style={{ backgroundColor: '#e5322d', borderColor: '#e5322d' }}>
            Sign up
          </button>
        </div> */}
      </div>
    </nav>
  );
}