import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import axios from 'axios';
import FileUploader from '../components/FileUploader';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

// Add dynamic API base for Vercel deployment & local fallback
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/pdf';

export default function PdfToImgPage() {
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(1);
  const [thumbnails, setThumbnails] = useState([]);
  const [format, setFormat] = useState('jpg'); // 'jpg' | 'png'
  const [dpi, setDpi] = useState(150); // 150 (Normal) | 300 (High)
  const [loading, setLoading] = useState(false);

  // Load PDF and extract previews
  const handlePdfSelect = async (files) => {
    const selected = files[0];
    if (!selected) return;

    setFile(selected);
    const buf = await selected.arrayBuffer();
    const doc = await pdfjsLib.getDocument({ data: buf }).promise;
    setNumPages(doc.numPages);

    // Build page preview thumbnails (up to 4 pages for preview display)
    const thumbs = [];
    const previewCount = Math.min(doc.numPages, 4);
    for (let i = 1; i <= previewCount; i++) {
      const page = await doc.getPage(i);
      const vp = page.getViewport({ scale: 0.28 });
      const canvas = document.createElement('canvas');
      canvas.width = vp.width;
      canvas.height = vp.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
      thumbs.push(canvas.toDataURL());
    }
    setThumbnails(thumbs);
  };

  const handleConvert = async () => {
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', format);
    formData.append('dpi', dpi);

    try {
      const res = await axios.post(`${API_BASE}/pdf-to-img`, formData, {
  responseType: 'blob'
});

      const originalBaseName = file.name.substring(0, file.name.lastIndexOf('.')) || 'converted';
      const isZip = numPages > 1;
      const downloadExt = isZip ? 'zip' : format;

      const blobUrl = URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `pdfMan_${originalBaseName}_${isZip ? 'images.zip' : '.' + downloadExt}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      if (err.response && err.response.data instanceof Blob) {
        const errorText = await err.response.data.text();
        try {
          const parsed = JSON.parse(errorText);
          alert(`Conversion failed: ${parsed.error || parsed.message}`);
        } catch {
          alert(`Conversion failed: ${errorText}`);
        }
      } else {
        alert('Failed to convert PDF to image. Please verify backend server.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5 my-auto text-center" style={{ maxWidth: '680px' }}>
      <h1 className="fw-bold d-flex justify-content-center align-items-center gap-2 mb-2">
        <i className="bi bi-file-earmark-image text-warning"></i> PDF to JPG / PNG
      </h1>
      <p className="text-muted mb-4">
        Extract all pages from your PDF and save them as high-quality JPG or PNG images.
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
              <i className="bi bi-file-earmark-pdf text-danger me-2 fs-4"></i>
              {file.name}
            </span>
            <span className="badge bg-secondary">
              {numPages} {numPages === 1 ? 'Page' : 'Pages'}
            </span>
          </div>

          {/* Page Preview Tiles */}
          <div className="d-flex gap-2 justify-content-center bg-light p-3 rounded-3 mb-4 overflow-auto">
            {thumbnails.map((src, idx) => (
              <div key={idx} className="border bg-white rounded p-1 shadow-sm text-center">
                <img src={src} alt={`Page ${idx + 1}`} style={{ height: '110px', objectFit: 'contain' }} />
                <div className="text-muted mt-1" style={{ fontSize: '10px' }}>Page {idx + 1}</div>
              </div>
            ))}
            {numPages > 4 && (
              <div className="d-flex align-items-center justify-content-center bg-white border rounded px-3 text-muted small fw-semibold">
                +{numPages - 4} more
              </div>
            )}
          </div>

          {/* Options: Output Format & Quality */}
          <div className="row g-3 mb-4">
            <div className="col-6">
              <label className="form-label small fw-bold text-muted text-uppercase mb-1">Image Format</label>
              <select
                className="form-select"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
              >
                <option value="jpg">JPG (Small file size)</option>
                <option value="png">PNG (Highest clarity)</option>
              </select>
            </div>
            <div className="col-6">
              <label className="form-label small fw-bold text-muted text-uppercase mb-1">Image Quality</label>
              <select
                className="form-select"
                value={dpi}
                onChange={(e) => setDpi(Number(e.target.value))}
              >
                <option value={150}>Standard (150 DPI)</option>
                <option value={300}>High Quality (300 DPI)</option>
              </select>
            </div>
          </div>

          {numPages > 1 && (
            <div className="alert alert-info py-2 px-3 small d-flex align-items-center gap-2 mb-4">
              <i className="bi bi-info-circle-fill fs-5"></i>
              <span>Since this PDF has multiple pages, all images will be downloaded together in a single <strong>.ZIP</strong> file.</span>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="d-flex gap-2">
            <button
              onClick={handleConvert}
              disabled={loading}
              className="btn btn-danger btn-lg flex-grow-1 fw-bold"
              style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Converting Pages...
                </>
              ) : (
                `Convert to ${format.toUpperCase()}`
              )}
            </button>
            <button
              onClick={() => {
                setFile(null);
                setThumbnails([]);
              }}
              disabled={loading}
              className="btn btn-outline-secondary btn-lg fw-semibold"
            >
              Change File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}