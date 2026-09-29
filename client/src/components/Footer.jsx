import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import brandLogo from '../assets/images/brand_logo.png';
import donateQR from '../assets/images/donateQR.png';
import { toolsData } from '../data/toolsData';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Set your payment handle / UPI ID / username here
  const donationHandle = "9503999234@upi"; // or "buymeacoffee.com/yourname"

  const handleCopy = () => {
    navigator.clipboard.writeText(donationHandle);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const organizeAndOptimize = toolsData.filter(
    (t) => t.category === 'organize' || t.category === 'optimize'
  );
  const convertToPdf = toolsData.filter((t) => t.category === 'convert-to');
  const convertFromPdf = toolsData.filter((t) => t.category === 'convert-from');
  const editAndImages = toolsData.filter(
    (t) => t.category === 'edit' || t.category === 'image' || t.category === 'convert'
  );

  return (
    <>
      <footer className="bg-white border-top mt-auto pt-4 pb-3">
        <div className="container-fluid px-4 px-lg-5">
          <div className="row g-4 justify-content-between">
            {/* Left Column: Brand, Logo & About */}
            <div className="col-12 col-xl-3 mb-3">
              <Link to="/" className="d-inline-flex align-items-center mb-3 text-decoration-none">
                <img
                  src={brandLogo}
                  alt="PDFMan Logo"
                  style={{ height: '200px', objectFit: 'contain' }}
                />
              </Link>
              <p className="text-muted small pe-xl-4 mb-3">
                PDFMan is your all-in-one platform for fast, private, and high-precision document and image processing. Convert, compress, split, and edit files directly in your browser.
              </p>
              <div className="d-flex gap-3 text-muted">
                {/* <a href="#github" className="text-secondary text-decoration-none fs-5 hover-red">
                  <i className="bi bi-github"></i>
                </a>
                <a href="#twitter" className="text-secondary text-decoration-none fs-5 hover-red">
                  <i className="bi bi-twitter-x"></i>
                </a>
                <a href="#linkedin" className="text-secondary text-decoration-none fs-5 hover-red">
                  <i className="bi bi-linkedin"></i>
                </a> */}
              </div>
            </div>

            {/* Right Columns: Structured Tool Categories */}
            <div className="col-12 col-xl-9">
              <div className="row g-4">
                {/* Column 1: Organize & Optimize */}
                <div className="col-6 col-md-3">
                  <h6 className="fw-bold text-dark text-uppercase small mb-3">Organize & Optimize</h6>
                  <ul className="list-unstyled d-flex flex-column gap-2 small">
                    {organizeAndOptimize.map((tool) => (
                      <li key={tool.id}>
                        <Link to={tool.path} className="text-muted text-decoration-none hover-red d-flex align-items-center gap-1">
                          <i className={`bi ${tool.icon} extra-small`} style={{ color: tool.color }}></i>
                          {tool.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Column 2: Convert to PDF */}
                <div className="col-6 col-md-3">
                  <h6 className="fw-bold text-dark text-uppercase small mb-3">Convert to PDF</h6>
                  <ul className="list-unstyled d-flex flex-column gap-2 small">
                    {convertToPdf.map((tool) => (
                      <li key={tool.id}>
                        <Link to={tool.path} className="text-muted text-decoration-none hover-red d-flex align-items-center gap-1">
                          <i className={`bi ${tool.icon} extra-small`} style={{ color: tool.color }}></i>
                          {tool.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Column 3: Convert from PDF */}
                <div className="col-6 col-md-3">
                  <h6 className="fw-bold text-dark text-uppercase small mb-3">Convert from PDF</h6>
                  <ul className="list-unstyled d-flex flex-column gap-2 small">
                    {convertFromPdf.map((tool) => (
                      <li key={tool.id}>
                        <Link to={tool.path} className="text-muted text-decoration-none hover-red d-flex align-items-center gap-1">
                          <i className={`bi ${tool.icon} extra-small`} style={{ color: tool.color }}></i>
                          {tool.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Column 4: Edit, OCR & Support */}
                <div className="col-6 col-md-3">
                  <h6 className="fw-bold text-dark text-uppercase small mb-3">Edit & Images</h6>
                  <ul className="list-unstyled d-flex flex-column gap-2 small">
                    {editAndImages.map((tool) => (
                      <li key={tool.id}>
                        <Link to={tool.path} className="text-muted text-decoration-none hover-red d-flex align-items-center gap-1">
                          <i className={`bi ${tool.icon} extra-small`} style={{ color: tool.color }}></i>
                          {tool.title}
                        </Link>
                      </li>
                    ))}
                  </ul>

                  <h6 className="fw-bold text-dark text-uppercase small mt-3 mb-2">Support</h6>
                  {/* Donate Button triggers QR Modal */}
                  <button
                    type="button"
                    onClick={() => setShowDonateModal(true)}
                    className="btn btn-sm btn-outline-danger fw-semibold d-inline-flex align-items-center gap-2 rounded-pill px-3 shadow-sm"
                    style={{ fontSize: '11px' }}
                  >
                    <i className="bi bi-heart-fill text-danger"></i>
                    <span>Donate / Sponsor</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <hr className="my-3 text-muted opacity-25" />
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center small text-muted">
            <span>&copy; {currentYear} PDFMan. All rights reserved.</span>
            <div className="d-flex gap-3 my-2 my-sm-0">
              {/* <a href="#privacy" className="text-muted text-decoration-none hover-red">Privacy Policy</a>
              <a href="#terms" className="text-muted text-decoration-none hover-red">Terms of Service</a>
              <a href="#contact" className="text-muted text-decoration-none hover-red">Contact</a> */}
            </div>
            <span>Engineered for fast, private document conversion.</span>
          </div>
        </div>
      </footer>

      {/* DONATE / SPONSOR QR MODAL */}
      {showDonateModal && (
        <div 
          className="modal show d-block" 
          tabIndex="-1" 
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
          onClick={() => setShowDonateModal(false)}
        >
          <div 
            className="modal-dialog modal-dialog-centered" 
            style={{ maxWidth: '380px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 rounded-4 shadow-lg p-4 text-center bg-white position-relative">
              <button 
                type="button" 
                className="btn-close position-absolute top-0 end-0 m-3" 
                onClick={() => setShowDonateModal(false)}
                aria-label="Close"
              ></button>

              <div className="mb-2">
                <span className="badge bg-danger bg-opacity-10 text-danger p-2 rounded-circle fs-4 mb-2 d-inline-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                  <img src={brandLogo} alt="Heart Icon" style={{ width: '70px', height: '70px' }} />
                </span>
                <h5 className="fw-bold mb-1 text-dark">Support PDFMan</h5>
                <p className="text-muted small mb-3">
                  If PDFMan has saved you time, help keep the servers fast and 100% free with a coffee!
                </p>
              </div>

              {/* QR Code Container */}
              <div className="p-3 bg-light border rounded-3 mb-3 d-inline-block mx-auto shadow-sm">
                <img
                  /* Replace with src={require('../assets/images/donate_qr.png')} once you add your QR code file */
                  src={donateQR}
                  alt="Scan to Donate"
                  className="img-fluid rounded"
                  style={{ width: '180px', height: '180px', objectFit: 'contain' }}
                />
              </div>

              {/* Scan Info & Copy Handle */}
              <div className="small text-muted mb-3">
                <i className="bi bi-qr-code-scan me-1"></i> Scan with any payment app (GPay, PhonePe, Paytm, etc.)
              </div>

              <div className="input-group mb-2">
                <input
                  type="text"
                  readOnly
                  className="form-control form-control-sm text-center font-monospace bg-light"
                  value={donationHandle}
                />
                <button 
                  className={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline-secondary'}`}
                  type="button" 
                  onClick={handleCopy}
                >
                  <i className={`bi ${copied ? 'bi-check-lg' : 'bi-clipboard'} me-1`}></i>
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              <button
                type="button"
                className="btn btn-sm btn-link text-muted text-decoration-none mt-2"
                onClick={() => setShowDonateModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}