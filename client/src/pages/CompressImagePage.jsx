import React, { useState } from 'react';
import axios from 'axios';
import FileUploader from '../components/FileUploader';

// Cleanly sanitize any rogue brackets, markdown links, or trailing slashes from the API URL
const cleanUrl = (url) => {
  if (!url) return 'https://pdfman-1h8j.onrender.com/api/pdf';
  return url.replace(/[\[\]()]/g, '').trim().replace(/\/+$/, '');
};

const API_BASE = cleanUrl(process.env.REACT_APP_API_URL);

export default function CompressImagePage() {
  const [file, setFile] = useState(null);
  const [level, setLevel] = useState('recommended'); // 'low' | 'recommended' | 'high'
  const [convertTo, setConvertTo] = useState('original');
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState(null);

  const handleCompress = async () => {
    if (!file) return;
    setLoading(true);
    setResultData(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('level', level);
    formData.append('convertTo', convertTo);

    try {
      const response = await axios.post(`${API_BASE}/compress-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        responseType: 'blob'
      });

      const savings = response.headers['x-savings-percent'] || 0;
      const origSize = Number(response.headers['x-original-size'] || file.size);
      const newSize = Number(response.headers['x-compressed-size'] || response.data.size);

      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const ext = convertTo === 'original' ? file.name.substring(file.name.lastIndexOf('.')) : `.${convertTo}`;
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

      setResultData({
        downloadUrl,
        savings,
        origSize: (origSize / 1024).toFixed(1),
        newSize: (newSize / 1024).toFixed(1),
        name: `pdfMan_compressed_${baseName}${ext}`
      });
    } catch (err) {
      console.error('Compression request failed:', err);
      alert('Failed to compress image. Check backend server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5 text-center" style={{ maxWidth: '680px' }}>
      <h1 className="fw-bold d-flex justify-content-center align-items-center gap-2 mb-2">
        <i className="bi bi-file-earmark-image brand-red"></i> Compress Image
      </h1>
      <p className="text-muted mb-4">
        Compress JPG, PNG, WebP, AVIF, HEIC, BMP, and TIFF files with up to 80% size savings.
      </p>

      {!file ? (
        <FileUploader
          accept=".jpg,.jpeg,.png,.webp,.avif,.heic,.heif,.bmp,.tiff"
          multiple={false}
          onFilesSelected={(f) => setFile(f[0])}
          title="Choose JPG, PNG, WebP, AVIF, or HEIC"
          subtitle="All modern camera and web image formats supported"
        />
      ) : (
        <div className="card p-4 shadow-sm border-0 rounded-4 bg-white text-start">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <span className="fw-bold text-truncate me-2 d-flex align-items-center">
              <i className="bi bi-image text-danger me-2 fs-4"></i>
              {file.name}
            </span>
            <span className="badge bg-secondary">
              {(file.size / 1024).toFixed(1)} KB
            </span>
          </div>

          {/* Compression Level Presets */}
          <label className="form-label small fw-bold text-muted text-uppercase mb-2">Compression Quality</label>
          <div className="row g-2 mb-4">
            <div className="col-4">
              <div
                onClick={() => setLevel('low')}
                className={`card p-3 text-center border-2 ${level === 'low' ? 'border-danger bg-danger bg-opacity-10' : 'border-light'}`}
                style={{ cursor: 'pointer' }}
              >
                <span className="fw-bold small">Extreme</span>
                <span className="text-muted" style={{ fontSize: '11px' }}>Maximum reduction</span>
              </div>
            </div>
            <div className="col-4">
              <div
                onClick={() => setLevel('recommended')}
                className={`card p-3 text-center border-2 ${level === 'recommended' ? 'border-danger bg-danger bg-opacity-10' : 'border-light'}`}
                style={{ cursor: 'pointer' }}
              >
                <span className="fw-bold small">Recommended</span>
                <span className="text-muted" style={{ fontSize: '11px' }}>Good quality</span>
              </div>
            </div>
            <div className="col-4">
              <div
                onClick={() => setLevel('high')}
                className={`card p-3 text-center border-2 ${level === 'high' ? 'border-danger bg-danger bg-opacity-10' : 'border-light'}`}
                style={{ cursor: 'pointer' }}
              >
                <span className="fw-bold small">Less</span>
                <span className="text-muted" style={{ fontSize: '11px' }}>High quality</span>
              </div>
            </div>
          </div>

          {/* Format Conversion Dropdown */}
          <div className="mb-4">
            <label className="form-label small fw-bold text-muted text-uppercase mb-1">Convert Format (Optional)</label>
            <select
              className="form-select"
              value={convertTo}
              onChange={(e) => setConvertTo(e.target.value)}
            >
              <option value="original">Keep original format</option>
              <option value="webp">Convert to WebP (Recommended for web)</option>
              <option value="jpeg">Convert to JPEG (Universal compatibility)</option>
              <option value="png">Convert to PNG</option>
            </select>
          </div>

          {/* Result Card */}
          {resultData && (
            <div className="alert alert-success d-flex align-items-center justify-content-between py-2 px-3 mb-4 rounded-3">
              <div>
                <span className="fw-bold d-block text-success">Saved {resultData.savings}%!</span>
                <span className="text-muted small">
                  {resultData.origSize} KB → {resultData.newSize} KB
                </span>
              </div>
              <a
                href={resultData.downloadUrl}
                download={resultData.name}
                className="btn btn-sm btn-success fw-bold px-3"
              >
                <i className="bi bi-download me-1"></i> Download
              </a>
            </div>
          )}

          <div className="d-flex gap-2">
            <button
              onClick={handleCompress}
              disabled={loading}
              className="btn btn-danger btn-lg flex-grow-1 fw-bold"
              style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Compressing Image...
                </>
              ) : (
                'Compress Image'
              )}
            </button>
            <button
              onClick={() => {
                setFile(null);
                setResultData(null);
              }}
              disabled={loading}
              className="btn btn-outline-secondary btn-lg fw-semibold"
            >
              Change
            </button>
          </div>
        </div>
      )}
    </div>
  );
}