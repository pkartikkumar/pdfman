import React, { useState } from 'react';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import FileUploader from '../components/FileUploader';

// Cleanly sanitize any rogue brackets, markdown links, or trailing slashes
const cleanUrl = (url) => {
  if (!url) return 'https://pdfman-1h8j.onrender.com/api/pdf';
  return url.replace(/[\[\]()]/g, '').trim().replace(/\/+$/, '');
};

const API_BASE = cleanUrl(process.env.REACT_APP_API_URL);

export default function UnlockPdfPage() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePdfSelect = (files) => {
    const selected = files[0];
    if (!selected) return;

    setFile(selected);
    setErrorMsg('');
  };

  const handleUnlock = async () => {
    if (!file) return;

    setErrorMsg('');
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);

    try {
      const res = await axios.post(`${API_BASE}/unlock-pdf`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        responseType: 'blob'
      });

      const originalBaseName = file.name.substring(0, file.name.lastIndexOf('.')) || 'unlocked';
      const blobUrl = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `pdfMan_${originalBaseName}_unlocked.pdf`;
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
          setErrorMsg('Failed to unlock PDF. Please check your password.');
        }
      } else if (err.response?.data?.error) {
        setErrorMsg(err.response.data.error);
      } else {
        setErrorMsg('Failed to unlock PDF. Please check the backend server.');
      }
    } finally {
      setLoading(false);
    }
  };

  const schemaJson = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'PDFMan PDF Password Remover',
    'url': window.location.href,
    'description': 'Remove password security and editing restrictions from PDF files online for free.',
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
        <title>Unlock PDF Online Free - Remove PDF Password Security | PDFMan</title>
        <meta
          name="description"
          content="Unlock password-protected PDF files online for free. Remove owner and user passwords, printing locks, and editing restrictions instantly."
        />
        <link rel="canonical" href="https://pdfman.com/unlock-pdf" />
        <meta property="og:title" content="Unlock PDF Online Free - PDFMan" />
        <meta property="og:description" content="Remove PDF passwords and permission restrictions with instant download." />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(schemaJson)}</script>
      </Helmet>

      <div className="container py-5 my-auto text-center" style={{ maxWidth: '680px' }}>
        <h1 className="fw-bold d-flex justify-content-center align-items-center gap-2 mb-2">
          <i className="bi bi-unlock-fill text-danger"></i> Unlock PDF
        </h1>
        <p className="text-muted mb-4">
          Remove PDF password security and permissions to read and edit your document freely.
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
            <div className="d-flex justify-content-between align-items-center mb-4">
              <span className="fw-bold text-truncate me-2 d-flex align-items-center">
                <i className="bi bi-file-earmark-lock2-fill text-danger me-2 fs-4"></i>
                {file.name}
              </span>
              <span className="badge bg-secondary">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>

            <div className="alert alert-info py-2 px-3 small d-flex align-items-center gap-2 mb-3">
              <i className="bi bi-info-circle-fill fs-5"></i>
              <span>If the document has an open password, enter it below to permanently remove it.</span>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-bold text-muted text-uppercase mb-1">
                Document Password (If required)
              </label>
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter document password"
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

            {errorMsg && (
              <div className="alert alert-danger py-2 small mb-3">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {errorMsg}
              </div>
            )}

            <div className="d-flex gap-2 mt-4">
              <button
                type="button"
                onClick={handleUnlock}
                disabled={loading}
                className="btn btn-danger btn-lg flex-grow-1 fw-bold"
                style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Unlocking PDF...
                  </>
                ) : (
                  <>
                    Unlock PDF <i className="bi bi-arrow-right ms-1"></i>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPassword('');
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

        {/* Indexable SEO Content Section */}
        <div className="mt-5 text-start border-top pt-4 text-muted">
          <h3 className="h5 fw-bold text-dark mb-3">How to unlock and remove passwords from PDF</h3>
          <ol className="small ps-3 mb-4">
            <li className="mb-2"><strong>Upload Protected PDF:</strong> Select your locked PDF file.</li>
            <li className="mb-2"><strong>Enter Password:</strong> Provide the document password if an open password is set.</li>
            <li className="mb-2"><strong>Decrypt Document:</strong> The backend strips encryption layers and resets security flags.</li>
            <li><strong>Download Unlocked PDF:</strong> Save your unrestricted file, ready for editing, printing, and sharing without passwords.</li>
          </ol>

          <h3 className="h5 fw-bold text-dark mb-3">Frequently Asked Questions</h3>
          <div className="accordion accordion-flush" id="unlockFaqAccordion">
            <div className="accordion-item bg-transparent">
              <h2 className="accordion-header">
                <button className="accordion-button collapsed px-0 bg-transparent fw-semibold text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#ufaq1">
                  Can I unlock a PDF without knowing the password?
                </button>
              </h2>
              <div id="ufaq1" className="accordion-collapse collapse" data-bs-parent="#unlockFaqAccordion">
                <div className="accordion-body px-0 small text-secondary">
                  If the document has permission restrictions (like printing, copying, or editing restrictions), it can often be unlocked instantly without a password. However, if the PDF is protected with an open password (AES encryption), you must enter the password once so the system can permanently decrypt it.
                </div>
              </div>
            </div>
            <div className="accordion-item bg-transparent">
              <h2 className="accordion-header">
                <button className="accordion-button collapsed px-0 bg-transparent fw-semibold text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#ufaq2">
                  Will unlocking damage document formatting?
                </button>
              </h2>
              <div id="ufaq2" className="accordion-collapse collapse" data-bs-parent="#unlockFaqAccordion">
                <div className="accordion-body px-0 small text-secondary">
                  No. Decryption only removes the security layer and permissions dictionary. All text, images, vector graphics, and forms remain completely untouched.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}