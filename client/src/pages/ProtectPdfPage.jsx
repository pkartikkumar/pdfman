import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import FileUploader from '../components/FileUploader';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/pdf';

export default function ProtectPdfPage() {
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(1);
  const [previewThumb, setPreviewThumb] = useState(null);

  // Password state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Load PDF and extract page 1 thumbnail
  const handlePdfSelect = async (files) => {
    const selected = files[0];
    if (!selected) return;

    setFile(selected);
    setErrorMsg('');
    try {
      const buf = await selected.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: buf }).promise;
      setNumPages(doc.numPages);

      const page = await doc.getPage(1);
      const vp = page.getViewport({ scale: 0.35 });
      const canvas = document.createElement('canvas');
      canvas.width = vp.width;
      canvas.height = vp.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
      setPreviewThumb(canvas.toDataURL());
    } catch {
      setErrorMsg('Could not read PDF preview. File might already be encrypted or damaged.');
    }
  };

  const handleProtect = async () => {
    if (!file) return;

    if (!password) {
      setErrorMsg('Please enter a password.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);

    try {
      const res = await axios.post(`${API_BASE}/protect-pdf`, formData, {
        responseType: 'blob'
      });

      const originalBaseName = file.name.substring(0, file.name.lastIndexOf('.')) || 'document';
      const blobUrl = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `pdfMan_${originalBaseName}_protected.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      if (err.response && err.response.data instanceof Blob) {
        const errorText = await err.response.data.text();
        try {
          const parsed = JSON.parse(errorText);
          setErrorMsg(parsed.error || parsed.message);
        } catch {
          setErrorMsg('Protection failed. Please check the backend server.');
        }
      } else {
        setErrorMsg('Protection failed. Please check the backend server.');
      }
    } finally {
      setLoading(false);
    }
  };

  const schemaJson = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'PDFMan PDF Protector',
    'url': window.location.href,
    'description': 'Protect and encrypt PDF files with strong AES passwords online for free to prevent unauthorized viewing or extraction.',
    'applicationCategory': 'SecurityApplication',
    'operatingSystem': 'All',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD'
    }
  };

  return (
    <>
      <Helmet>
        <title>Protect PDF Online Free - Password Protect PDF | PDFMan</title>
        <meta
          name="description"
          content="Password protect PDF files online for free. Encrypt your confidential documents with military-grade AES standards to prevent unauthorized access or copying."
        />
        <link rel="canonical" href="https://pdfman.com/protect-pdf" />
        <meta property="og:title" content="Protect PDF Online Free - PDFMan" />
        <meta property="og:description" content="Add strong password encryption to protect sensitive PDF documents." />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(schemaJson)}</script>
      </Helmet>

      <div className="container py-5 my-auto text-center" style={{ maxWidth: '680px' }}>
        <h1 className="fw-bold d-flex justify-content-center align-items-center gap-2 mb-2">
          <i className="bi bi-shield-lock-fill text-danger"></i> Protect PDF file
        </h1>
        <p className="text-muted mb-4">
          Encrypt your PDF with a strong password to prevent unauthorized access.
        </p>

        {!file ? (
          <FileUploader
            accept=".pdf"
            multiple={false}
            onFilesSelected={handlePdfSelect}
            title="Select PDF file"
            subtitle="or drop PDF here"
          />
        ) : (
          <div className="card p-4 shadow-sm border-0 rounded-4 bg-white text-start">
            {/* Header Info */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <span className="fw-bold text-truncate me-2 d-flex align-items-center">
                <i className="bi bi-file-earmark-pdf-fill text-danger me-2 fs-4"></i>
                {file.name}
              </span>
              <span className="badge bg-secondary">
                {numPages} {numPages === 1 ? 'Page' : 'Pages'}
              </span>
            </div>

            {/* Thumbnail preview */}
            {previewThumb && (
              <div className="text-center bg-light p-3 rounded-3 mb-4">
                <img
                  src={previewThumb}
                  alt="Page preview"
                  className="shadow-sm rounded border bg-white"
                  style={{ maxHeight: '180px', objectFit: 'contain' }}
                />
              </div>
            )}

            {/* Password Inputs */}
            <div className="mb-3">
              <label className="form-label small fw-bold text-muted text-uppercase mb-1">
                Choose a Password
              </label>
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                </button>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-bold text-muted text-uppercase mb-1">
                Repeat Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {errorMsg && (
              <div className="alert alert-danger py-2 small mb-3">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {errorMsg}
              </div>
            )}

            <div className="d-flex gap-2 mt-4">
              <button
                onClick={handleProtect}
                disabled={loading}
                className="btn btn-danger btn-lg flex-grow-1 fw-bold"
                style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Protecting PDF...
                  </>
                ) : (
                  <>
                    Protect PDF <i className="bi bi-arrow-right ms-1"></i>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setFile(null);
                  setPassword('');
                  setConfirmPassword('');
                  setErrorMsg('');
                  setPreviewThumb(null);
                }}
                disabled={loading}
                className="btn btn-outline-secondary btn-lg fw-semibold"
              >
                Change File
              </button>
            </div>
          </div>
        )}

        {/* Indexable SEO Content Section for Search Ranking */}
        <div className="mt-5 text-start border-top pt-4 text-muted">
          <h3 className="h5 fw-bold text-dark mb-3">How to password protect a PDF file online</h3>
          <ol className="small ps-3 mb-4">
            <li className="mb-2"><strong>Upload PDF:</strong> Drag and drop your file into the secure uploader box.</li>
            <li className="mb-2"><strong>Set Strong Password:</strong> Type your chosen password and re-enter it to confirm.</li>
            <li className="mb-2"><strong>Encrypt File:</strong> Our backend applies standard AES security encryption.</li>
            <li><strong>Download:</strong> Save your encrypted PDF. Anyone opening the file will be prompted for your password.</li>
          </ol>

          <h3 className="h5 fw-bold text-dark mb-3">Frequently Asked Questions</h3>
          <div className="accordion accordion-flush" id="protectFaqAccordion">
            <div className="accordion-item bg-transparent">
              <h2 className="accordion-header">
                <button className="accordion-button collapsed px-0 bg-transparent fw-semibold text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#pfaq1">
                  How strong is the encryption?
                </button>
              </h2>
              <div id="pfaq1" className="accordion-collapse collapse" data-bs-parent="#protectFaqAccordion">
                <div className="accordion-body px-0 small text-secondary">
                  PDFMan uses standard 128-bit/256-bit AES encryption algorithms compliant with Adobe Acrobat standards. Without your password, opening or extracting the internal stream data is mathematically infeasible.
                </div>
              </div>
            </div>
            <div className="accordion-item bg-transparent">
              <h2 className="accordion-header">
                <button className="accordion-button collapsed px-0 bg-transparent fw-semibold text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#pfaq2">
                  Can PDFMan read my password or file contents?
                </button>
              </h2>
              <div id="pfaq2" className="accordion-collapse collapse" data-bs-parent="#protectFaqAccordion">
                <div className="accordion-body px-0 small text-secondary">
                  No. Encryption is performed dynamically in temporary server sandboxes without logging keys or retaining files. Once downloaded, both the original and encrypted documents are deleted immediately.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}