import React, { useState } from 'react';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import FileUploader from '../components/FileUploader';

// Cleanly sanitize any rogue brackets, markdown links, or trailing slashes from the API URL
const cleanUrl = (url) => {
  if (!url) return 'https://pdfman-1h8j.onrender.com/api/pdf';
  return url.replace(/[\[\]()]/g, '').trim().replace(/\/+$/, '');
};

const API_BASE = cleanUrl(process.env.REACT_APP_API_URL);

export default function CompressPdfPage() {
  const [file, setFile] = useState(null);
  const [quality, setQuality] = useState('ebook'); // 'screen' | 'ebook' | 'printer'
  const [compressing, setCompressing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCompress = async () => {
    if (!file) return;
    setCompressing(true);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('quality', quality);

    try {
      const response = await axios.post(`${API_BASE}/compress`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        responseType: 'blob'
      });

      // Create download link from returned blob
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PDFMan_compressed_${file.name}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      if (err.response && err.response.data instanceof Blob) {
        const errorText = await err.response.data.text();
        try {
          const parsed = JSON.parse(errorText);
          setErrorMsg(parsed.error || parsed.message || 'Compression failed.');
        } catch {
          setErrorMsg('Failed to compress. Please check backend server.');
        }
      } else {
        setErrorMsg('Failed to compress. Please check backend server.');
      }
    } finally {
      setCompressing(false);
    }
  };

  const schemaJson = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'PDFMan PDF Compressor',
    'url': window.location.href,
    'description': 'Compress PDF files online for free. Reduce document file size without sacrificing readability or vector quality.',
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
        <title>Compress PDF Online Free - Reduce PDF File Size | PDFMan</title>
        <meta
          name="description"
          content="Compress PDF documents online for free. Select your compression level to reduce file size for email and web while preserving crisp text and high image clarity."
        />
        <link rel="canonical" href="https://pdfman.com/compress-pdf" />
        <meta property="og:title" content="Compress PDF Online Free - PDFMan" />
        <meta property="og:description" content="Reduce PDF size while maintaining top document quality with instant download." />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(schemaJson)}</script>
      </Helmet>

      <div className="container py-5" style={{ maxWidth: '680px' }}>
        <div className="text-center mb-4">
          <h1 className="fw-bold d-flex justify-content-center align-items-center gap-2 mb-2">
            <i className="bi bi-file-earmark-zip text-danger"></i> Compress PDF file
          </h1>
          <p className="text-muted">
            Choose your compression level to reduce size while maintaining document quality.
          </p>
        </div>

        {!file ? (
          <FileUploader
            accept=".pdf"
            multiple={false}
            onFilesSelected={(files) => {
              setFile(files[0]);
              setErrorMsg('');
            }}
            title="Select PDF file"
            subtitle="or drop PDF file here"
          />
        ) : (
          <div className="card shadow-sm border-0 p-4 rounded-4 bg-white text-start">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="fw-bold text-truncate me-2" style={{ maxWidth: '75%' }}>
                <i className="bi bi-file-earmark-pdf text-danger me-2"></i>
                {file.name}
              </span>
              <span className="badge bg-secondary">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>

            <label className="form-label fw-bold mb-2">Select Compression Level:</label>
            <div className="list-group mb-4">
              <label
                className={`list-group-item d-flex gap-3 align-items-center ${
                  quality === 'screen' ? 'bg-light border-danger' : ''
                }`}
                style={{ cursor: 'pointer' }}
              >
                <input
                  type="radio"
                  name="compression"
                  className="form-check-input mt-0"
                  checked={quality === 'screen'}
                  onChange={() => setQuality('screen')}
                />
                <div>
                  <strong className="text-dark">Extreme Compression</strong>
                  <div className="text-muted small">
                    Smallest file size, maximum compression (ideal for email attachments)
                  </div>
                </div>
              </label>

              <label
                className={`list-group-item d-flex gap-3 align-items-center ${
                  quality === 'ebook' ? 'bg-light border-danger' : ''
                }`}
                style={{ cursor: 'pointer' }}
              >
                <input
                  type="radio"
                  name="compression"
                  className="form-check-input mt-0"
                  checked={quality === 'ebook'}
                  onChange={() => setQuality('ebook')}
                />
                <div>
                  <strong className="text-dark">Recommended Compression</strong>
                  <div className="text-muted small">
                    Balanced file size and standard document clarity
                  </div>
                </div>
              </label>

              <label
                className={`list-group-item d-flex gap-3 align-items-center ${
                  quality === 'printer' ? 'bg-light border-danger' : ''
                }`}
                style={{ cursor: 'pointer' }}
              >
                <input
                  type="radio"
                  name="compression"
                  className="form-check-input mt-0"
                  checked={quality === 'printer'}
                  onChange={() => setQuality('printer')}
                />
                <div>
                  <strong className="text-dark">Low Compression</strong>
                  <div className="text-muted small">
                    Light compression with maximum visual quality retained
                  </div>
                </div>
              </label>
            </div>

            {errorMsg && (
              <div className="alert alert-danger py-2 small mb-3">
                <i className="bi bi-exclamation-triangle-fill me-1"></i> {errorMsg}
              </div>
            )}

            <div className="d-flex gap-2">
              <button
                onClick={handleCompress}
                disabled={compressing}
                className="btn btn-danger btn-lg fw-bold flex-grow-1"
                style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}
              >
                {compressing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Compressing PDF...
                  </>
                ) : (
                  'Compress PDF'
                )}
              </button>
              <button
                onClick={() => {
                  setFile(null);
                  setErrorMsg('');
                }}
                disabled={compressing}
                className="btn btn-outline-secondary btn-lg fw-semibold"
              >
                Change File
              </button>
            </div>
          </div>
        )}

        {/* Indexable SEO Content Section for Search Ranking */}
        <div className="mt-5 text-start border-top pt-4 text-muted">
          <h3 className="h5 fw-bold text-dark mb-3">How to compress PDF files online</h3>
          <ol className="small ps-3 mb-4">
            <li className="mb-2"><strong>Upload Your Document:</strong> Drag and drop your PDF or select it from your device.</li>
            <li className="mb-2"><strong>Choose Compression Profile:</strong> Pick between Extreme (email ready), Recommended (standard web sharing), or Low compression (print precision).</li>
            <li className="mb-2"><strong>Compress:</strong> Click Compress PDF to run the optimization process.</li>
            <li><strong>Instant Download:</strong> Save the compressed PDF directly to your device.</li>
          </ol>

          <h3 className="h5 fw-bold text-dark mb-3">Frequently Asked Questions</h3>
          <div className="accordion accordion-flush" id="compressFaq">
            <div className="accordion-item bg-transparent">
              <h2 className="accordion-header">
                <button className="accordion-button collapsed px-0 bg-transparent fw-semibold text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#cfaq1">
                  Does compressing reduce PDF text clarity?
                </button>
              </h2>
              <div id="cfaq1" className="accordion-collapse collapse" data-bs-parent="#compressFaq">
                <div className="accordion-body px-0 small text-secondary">
                  No. Text, fonts, and vector elements remain sharp and scalable. Compression targets redundant structural objects and downsamples heavy embedded raster images without compromising readability.
                </div>
              </div>
            </div>
            <div className="accordion-item bg-transparent">
              <h2 className="accordion-header">
                <button className="accordion-button collapsed px-0 bg-transparent fw-semibold text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#cfaq2">
                  Are my files deleted after compression?
                </button>
              </h2>
              <div id="cfaq2" className="accordion-collapse collapse" data-bs-parent="#compressFaq">
                <div className="accordion-body px-0 small text-secondary">
                  Yes. Processed files are immediately deleted from server storage as soon as the download finishes. Your documents are never stored or shared.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}