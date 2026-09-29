import React, { useState } from 'react';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import FileUploader from '../components/FileUploader';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/pdf';

export default function HtmlToPdfPage() {
  const [activeTab, setActiveTab] = useState('file'); // 'file' | 'url' | 'code'
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [htmlCode, setHtmlCode] = useState(`<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; }
    h1 { color: #dc2626; }
    p { font-size: 16px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
    th { background: #f8fafc; }
  </style>
</head>
<body>
  <h1>Sample Document</h1>
  <p>This PDF was generated directly from raw HTML code using <strong>PDFMan</strong>.</p>
  <table>
    <tr><th>Item</th><th>Description</th><th>Status</th></tr>
    <tr><td>Invoice #101</td><td>Web Development</td><td>Paid</td></tr>
    <tr><td>Report</td><td>Q3 Financials</td><td>Approved</td></tr>
  </table>
</body>
</html>`);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleConvert = async () => {
    setErrorMsg('');
    setLoading(true);

    const formData = new FormData();

    if (activeTab === 'file') {
      if (!file) {
        setErrorMsg('Please select an HTML file.');
        setLoading(false);
        return;
      }
      formData.append('file', file);
    } else if (activeTab === 'url') {
      if (!url.trim()) {
        setErrorMsg('Please enter a valid website URL.');
        setLoading(false);
        return;
      }
      formData.append('url', url.trim());
    } else if (activeTab === 'code') {
      if (!htmlCode.trim()) {
        setErrorMsg('HTML code cannot be empty.');
        setLoading(false);
        return;
      }
      formData.append('html', htmlCode);
    }

    try {
      const response = await axios.post(`${API_BASE}/html-to-pdf`, formData, {
        responseType: 'blob'
      });

      const blobUrl = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `pdfMan_converted_${Date.now()}.pdf`;
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
          setErrorMsg('Failed to convert HTML to PDF.');
        }
      } else {
        setErrorMsg('Conversion failed. Please verify the backend server.');
      }
    } finally {
      setLoading(false);
    }
  };

  const schemaJson = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'PDFMan HTML to PDF Converter',
    'url': window.location.href,
    'description': 'Convert web pages, HTML files, or raw code to PDF documents with high accuracy and CSS layout fidelity.',
    'applicationCategory': 'UtilitiesApplication',
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
        <title>HTML to PDF Converter - Convert Web Pages to PDF Online | PDFMan</title>
        <meta
          name="description"
          content="Convert HTML files, raw source code, or live website URLs into high-quality PDF documents for free. Preserves CSS styling, layouts, tables, and images."
        />
        <link rel="canonical" href="https://pdfman.com/html-to-pdf" />
        <meta property="og:title" content="HTML to PDF Converter - PDFMan" />
        <meta property="og:description" content="Transform web pages, HTML files, or raw code into print-ready PDF documents." />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(schemaJson)}</script>
      </Helmet>

      <div className="container py-5 my-auto text-center" style={{ maxWidth: '720px' }}>
        <h1 className="fw-bold d-flex justify-content-center align-items-center gap-2 mb-2">
          <i className="bi bi-filetype-html text-danger"></i> Convert HTML to PDF
        </h1>
        <p className="text-muted mb-4">
          Transform web pages, HTML files, or raw code into print-ready PDF documents.
        </p>

        {/* Tabs Switcher */}
        <div className="d-flex justify-content-center gap-2 mb-4">
          <button
            onClick={() => { setActiveTab('file'); setErrorMsg(''); }}
            className={`btn btn-sm rounded-pill px-3 py-2 fw-semibold ${activeTab === 'file' ? 'btn-dark' : 'btn-outline-secondary'}`}
          >
            <i className="bi bi-upload me-1"></i> Upload File (.html)
          </button>
          <button
            onClick={() => { setActiveTab('url'); setErrorMsg(''); }}
            className={`btn btn-sm rounded-pill px-3 py-2 fw-semibold ${activeTab === 'url' ? 'btn-dark' : 'btn-outline-secondary'}`}
          >
            <i className="bi bi-globe me-1"></i> Webpage URL
          </button>
          <button
            onClick={() => { setActiveTab('code'); setErrorMsg(''); }}
            className={`btn btn-sm rounded-pill px-3 py-2 fw-semibold ${activeTab === 'code' ? 'btn-dark' : 'btn-outline-secondary'}`}
          >
            <i className="bi bi-code-slash me-1"></i> HTML Editor
          </button>
        </div>

        <div className="card p-4 shadow-sm border-0 rounded-4 bg-white text-start">
          {/* TAB 1: File Upload */}
          {activeTab === 'file' && (
            <div>
              {!file ? (
                <FileUploader
                  accept=".html,.htm"
                  multiple={false}
                  onFilesSelected={(f) => setFile(f[0])}
                  title="Select HTML file"
                  subtitle="or drop .html / .htm file here"
                />
              ) : (
                <div className="d-flex justify-content-between align-items-center p-3 border rounded-3 bg-light">
                  <span className="fw-bold text-truncate me-2 d-flex align-items-center">
                    <i className="bi bi-file-earmark-code text-danger fs-4 me-2"></i>
                    {file.name}
                  </span>
                  <button
                    className="btn btn-sm btn-outline-secondary rounded-pill"
                    onClick={() => setFile(null)}
                  >
                    Change File
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: URL Input */}
          {activeTab === 'url' && (
            <div>
              <label className="form-label small fw-bold text-muted text-uppercase mb-1">
                Website URL:
              </label>
              <div className="input-group mb-2">
                <span className="input-group-text bg-light text-muted">
                  <i className="bi bi-link-45deg"></i>
                </span>
                <input
                  type="url"
                  className="form-control"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <span className="text-muted extra-small" style={{ fontSize: '0.8rem' }}>
                Enter any publicly accessible webpage URL to capture and render.
              </span>
            </div>
          )}

          {/* TAB 3: Raw HTML Code Editor */}
          {activeTab === 'code' && (
            <div>
              <label className="form-label small fw-bold text-muted text-uppercase mb-1">
                Paste or Edit HTML:
              </label>
              <textarea
                className="form-control font-monospace small"
                rows={10}
                value={htmlCode}
                onChange={(e) => setHtmlCode(e.target.value)}
                style={{ fontSize: '13px', lineHeight: '1.4' }}
              />
            </div>
          )}

          {errorMsg && (
            <div className="alert alert-danger py-2 small mt-3 mb-0">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {errorMsg}
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleConvert}
            disabled={loading || (activeTab === 'file' && !file)}
            className="btn btn-danger btn-lg w-100 fw-bold rounded-3 shadow-sm mt-4 d-flex align-items-center justify-content-center gap-2"
            style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status"></span>
                Converting to PDF...
              </>
            ) : (
              <>
                Convert to PDF <i className="bi bi-arrow-right"></i>
              </>
            )}
          </button>
        </div>

        {/* Indexable SEO Content Section for Search Ranking */}
        <div className="mt-5 text-start border-top pt-4 text-muted">
          <h3 className="h5 fw-bold text-dark mb-3">How to Convert HTML to PDF Online</h3>
          <ol className="small ps-3 mb-4">
            <li className="mb-2"><strong>Select Source:</strong> Choose to upload a local <code>.html</code> file, paste a live URL, or edit raw code directly.</li>
            <li className="mb-2"><strong>Engine Processing:</strong> Our backend renders HTML5, CSS styles, web fonts, and layouts using high-accuracy headless rendering.</li>
            <li className="mb-2"><strong>Instant PDF Download:</strong> Click Convert to generate and download your formatted PDF document immediately.</li>
          </ol>

          <h3 className="h5 fw-bold text-dark mb-3">Frequently Asked Questions</h3>
          <div className="accordion accordion-flush" id="htmlFaqAccordion">
            <div className="accordion-item bg-transparent">
              <h2 className="accordion-header">
                <button className="accordion-button collapsed px-0 bg-transparent fw-semibold text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#htmlFaq1">
                  Does the converter keep CSS styling and background colors?
                </button>
              </h2>
              <div id="htmlFaq1" className="accordion-collapse collapse" data-bs-parent="#htmlFaqAccordion">
                <div className="accordion-body px-0 small text-secondary">
                  Yes. CSS print backgrounds, external fonts, grid systems, and tables are preserved so the output PDF accurately matches the source web design.
                </div>
              </div>
            </div>
            <div className="accordion-item bg-transparent">
              <h2 className="accordion-header">
                <button className="accordion-button collapsed px-0 bg-transparent fw-semibold text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#htmlFaq2">
                  Can I convert password-protected or local internal sites?
                </button>
              </h2>
              <div id="htmlFaq2" className="accordion-collapse collapse" data-bs-parent="#htmlFaqAccordion">
                <div className="accordion-body px-0 small text-secondary">
                  For secure, private, or intranet pages behind logins, use the <strong>Upload File</strong> or <strong>HTML Editor</strong> tab to paste the rendered markup directly rather than entering a restricted URL.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}