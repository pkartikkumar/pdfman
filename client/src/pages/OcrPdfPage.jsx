import React, { useState } from 'react';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import FileUploader from '../components/FileUploader';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/pdf';

export default function OcrPdfPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleProcessOcr = async () => {
    if (!file) return;
    setLoading(true);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_BASE}/ocr-pdf`, formData, {
        responseType: 'blob'
      });

      const originalBaseName = file.name.substring(0, file.name.lastIndexOf('.')) || 'scanned';
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pdfMan_${originalBaseName}_searchable.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      if (err.response && err.response.data instanceof Blob) {
        const errorText = await err.response.data.text();
        try {
          const parsed = JSON.parse(errorText);
          setErrorMsg(parsed.error || parsed.message);
        } catch {
          setErrorMsg('OCR processing failed. Check backend OCR models.');
        }
      } else {
        setErrorMsg('OCR processing failed. Please verify your backend server.');
      }
    } finally {
      setLoading(false);
    }
  };

  const schemaJson = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'PDFMan OCR PDF Converter',
    'url': window.location.href,
    'description': 'Convert scanned PDF documents and camera images into searchable and selectable PDFs using optical character recognition.',
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
        <title>OCR PDF Online Free - Make Scanned PDFs Searchable | PDFMan</title>
        <meta
          name="description"
          content="Convert scanned non-searchable PDFs, receipts, and images into fully searchable, copyable, and selectable PDF documents online using AI OCR."
        />
        <link rel="canonical" href="https://pdfman.com/ocr-pdf" />
        <meta property="og:title" content="OCR PDF Online Free - PDFMan" />
        <meta property="og:description" content="Recognize text in scanned documents and create selectable PDFs instantly." />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(schemaJson)}</script>
      </Helmet>

      <div className="container py-5 text-center" style={{ maxWidth: '680px' }}>
        <h1 className="fw-bold d-flex justify-content-center align-items-center gap-2 mb-2">
          <i className="bi bi-search text-danger"></i> OCR PDF
        </h1>
        <p className="text-muted mb-4">
          Convert scanned non-searchable PDF documents or photos into fully searchable and selectable PDFs.
        </p>

        {!file ? (
          <FileUploader
            accept=".pdf,image/*"
            multiple={false}
            onFilesSelected={(f) => {
              setFile(f[0]);
              setErrorMsg('');
            }}
            title="Select scanned PDF or Image"
            subtitle="or drop file here"
          />
        ) : (
          <div className="card p-4 shadow-sm border-0 rounded-4 mt-3 bg-white text-start">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <span className="fw-bold text-truncate me-2 d-flex align-items-center">
                <i className="bi bi-file-earmark-text text-danger me-2 fs-4"></i>
                {file.name}
              </span>
              <span className="badge bg-secondary">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>

            <div className="alert alert-info py-2 small mb-4">
              <i className="bi bi-info-circle me-1"></i> EasyOCR will scan every page and embed an invisible text layer, allowing you to search and copy words.
            </div>

            {errorMsg && (
              <div className="alert alert-danger py-2 small mb-4">
                <i className="bi bi-exclamation-triangle-fill me-1"></i> {errorMsg}
              </div>
            )}

            <div className="d-flex gap-2">
              <button
                onClick={handleProcessOcr}
                disabled={loading}
                className="btn btn-danger btn-lg flex-grow-1 fw-bold"
                style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Recognizing Text with AI...
                  </>
                ) : (
                  'Make PDF Searchable'
                )}
              </button>
              <button
                onClick={() => {
                  setFile(null);
                  setErrorMsg('');
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
          <h3 className="h5 fw-bold text-dark mb-3">How to make scanned PDFs searchable</h3>
          <ol className="small ps-3 mb-4">
            <li className="mb-2"><strong>Upload Scanned File:</strong> Select your scanned PDF file or document photo (JPG/PNG).</li>
            <li className="mb-2"><strong>AI Text Recognition:</strong> The backend optical character recognition engine analyzes characters, lines, and columns.</li>
            <li className="mb-2"><strong>Invisible Text Embedding:</strong> An invisible text layer is matched directly beneath the original scan pixels.</li>
            <li><strong>Download:</strong> Open the converted PDF to search with <kbd>Ctrl+F</kbd> and copy text directly.</li>
          </ol>

          <h3 className="h5 fw-bold text-dark mb-3">Frequently Asked Questions</h3>
          <div className="accordion accordion-flush" id="ocrFaqAccordion">
            <div className="accordion-item bg-transparent">
              <h2 className="accordion-header">
                <button className="accordion-button collapsed px-0 bg-transparent fw-semibold text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#ocrFaq1">
                  What is OCR and why do I need it?
                </button>
              </h2>
              <div id="ocrFaq1" className="accordion-collapse collapse" data-bs-parent="#ocrFaqAccordion">
                <div className="accordion-body px-0 small text-secondary">
                  Optical Character Recognition (OCR) converts pictures of text into actual machine-readable characters. This transforms flat image scans into interactive documents where you can search, highlight, and copy text.
                </div>
              </div>
            </div>
            <div className="accordion-item bg-transparent">
              <h2 className="accordion-header">
                <button className="accordion-button collapsed px-0 bg-transparent fw-semibold text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#ocrFaq2">
                  Will OCR alter the appearance of my original document?
                </button>
              </h2>
              <div id="ocrFaq2" className="accordion-collapse collapse" data-bs-parent="#ocrFaqAccordion">
                <div className="accordion-body px-0 small text-secondary">
                  No. The visual layout, signatures, stamps, and images remain identical. The detected text is embedded as an invisible overlay placed behind the visual pixels.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}