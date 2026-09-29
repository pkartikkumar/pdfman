import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import FileUploader from '../components/FileUploader';

// Cleanly sanitize any rogue brackets, markdown links, or trailing slashes
const cleanUrl = (url) => {
  if (!url) return 'https://pdfman-1h8j.onrender.com/api/pdf';
  return url.replace(/[\[\]()]/g, '').trim().replace(/\/+$/, '');
};

const API_BASE = cleanUrl(process.env.REACT_APP_API_URL);

const PRESET_COLORS = [
  { label: 'White', value: '#FFFFFF' },
  { label: 'Light Gray', value: '#F3F4F6' },
  { label: 'Black', value: '#000000' },
  { label: 'Studio Blue', value: '#1E3A8A' },
  { label: 'Pastel Red', value: '#FCA5A5' },
  { label: 'Soft Green', value: '#86EFAC' },
  { label: 'Warm Yellow', value: '#FEF08A' },
  { label: 'Purple', value: '#A855F7' }
];

export default function PngMakerPage() {
  const [file, setFile] = useState(null);
  const [originalPreview, setOriginalPreview] = useState(null);
  const [cutoutBlob, setCutoutBlob] = useState(null);
  const [cutoutImgElement, setCutoutImgElement] = useState(null);
  const [loading, setLoading] = useState(false);

  // Background replacement controls
  const [bgMode, setBgMode] = useState('transparent'); // 'transparent' | 'color' | 'image'
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');
  const [bgImageElement, setBgImageElement] = useState(null);

  const canvasRef = useRef(null);

  const handleFileSelect = (files) => {
    const selected = files[0];
    if (!selected) return;

    if (originalPreview) URL.revokeObjectURL(originalPreview);

    setFile(selected);
    setCutoutBlob(null);
    setCutoutImgElement(null);
    setBgMode('transparent');
    setBgImageElement(null);
    setOriginalPreview(URL.createObjectURL(selected));
  };

  // 1. Call AI Engine for Cutout
  const handleRemoveBg = async () => {
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_BASE}/remove-bg`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'image/png' });
      setCutoutBlob(blob);

      const cutoutUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.src = cutoutUrl;
      img.onload = () => {
        setCutoutImgElement(img);
      };
    } catch (err) {
      if (err.response && err.response.data instanceof Blob) {
        const errorText = await err.response.data.text();
        try {
          const parsed = JSON.parse(errorText);
          alert(`Cutout failed: ${parsed.error || parsed.message}`);
        } catch {
          alert('AI cutout failed. Please check the backend service.');
        }
      } else {
        alert('AI cutout failed. Please verify your backend server.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Custom Background Image Upload
  const handleBgImageUpload = (e) => {
    const bgFile = e.target.files[0];
    if (!bgFile) return;

    const img = new Image();
    img.src = URL.createObjectURL(bgFile);
    img.onload = () => {
      setBgImageElement(img);
      setBgMode('image');
    };
  };

  // 3. Composite Cutout with Background onto Canvas
  useEffect(() => {
    if (!cutoutImgElement || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = cutoutImgElement.naturalWidth || cutoutImgElement.width;
    canvas.height = cutoutImgElement.naturalHeight || cutoutImgElement.height;

    // Clear previous drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (bgMode === 'color') {
      ctx.fillStyle = selectedColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (bgMode === 'image' && bgImageElement) {
      const scale = Math.max(canvas.width / bgImageElement.width, canvas.height / bgImageElement.height);
      const x = (canvas.width - bgImageElement.width * scale) / 2;
      const y = (canvas.height - bgImageElement.height * scale) / 2;
      ctx.drawImage(bgImageElement, x, y, bgImageElement.width * scale, bgImageElement.height * scale);
    }

    ctx.drawImage(cutoutImgElement, 0, 0, canvas.width, canvas.height);
  }, [cutoutImgElement, bgMode, selectedColor, bgImageElement]);

  // 4. Download Composited Image
  const handleDownload = () => {
    if (!canvasRef.current || !file) return;

    const canvas = canvasRef.current;
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || 'image';
    const isPng = bgMode === 'transparent';
    const mimeType = isPng ? 'image/png' : 'image/jpeg';
    const ext = isPng ? 'png' : 'jpg';

    const dataUrl = canvas.toDataURL(mimeType, 0.95);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `PDFMan_${baseName}_${bgMode}.${ext}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleReset = () => {
    if (originalPreview) URL.revokeObjectURL(originalPreview);
    setFile(null);
    setCutoutBlob(null);
    setCutoutImgElement(null);
    setOriginalPreview(null);
    setBgImageElement(null);
  };

  return (
    <>
      <Helmet>
        <title>AI Background Remover & PNG Maker Online | PDFMan</title>
        <meta
          name="description"
          content="Remove image backgrounds automatically with AI. Create transparent PNG cutouts or replace backgrounds with colors and custom photos."
        />
      </Helmet>

      <div className="container py-5 text-center" style={{ maxWidth: '1050px' }}>
        <div className="mb-4">
          <h1 className="fw-bold d-flex justify-content-center align-items-center gap-2">
            <i className="bi bi-magic text-danger"></i> AI Background Remover & Editor
          </h1>
          <p className="text-muted">
            Isolate subjects with precision and replace backgrounds with custom photos or colors.
          </p>
        </div>

        {!file ? (
          <FileUploader
            accept="image/*"
            multiple={false}
            onFilesSelected={handleFileSelect}
            title="Upload image to remove or edit background"
            subtitle="Supports JPG, PNG, WebP"
          />
        ) : (
          <div className="card shadow-sm border-0 rounded-4 p-4 mt-3 bg-white text-start">
            <div className="row g-4">
              {/* Left Column: Image Canvas / Previews */}
              <div className="col-12 col-lg-7">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-bold text-truncate" style={{ maxWidth: '70%' }}>
                    <i className="bi bi-image text-danger me-2"></i>
                    {file.name}
                  </span>
                  <span className="badge bg-secondary">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>

                <div
                  className="border rounded-4 d-flex align-items-center justify-content-center position-relative overflow-hidden p-2"
                  style={{
                    height: '420px',
                    background:
                      bgMode === 'transparent'
                        ? 'repeating-conic-gradient(#e5e7eb 0% 25%, #ffffff 0% 50%) 50% / 20px 20px'
                        : '#f8fafc'
                  }}
                >
                  {loading && (
                    <div className="text-center">
                      <div className="spinner-border text-danger mb-2" role="status"></div>
                      <div className="fw-semibold text-muted">AI is isolating subject...</div>
                    </div>
                  )}

                  {!loading && !cutoutBlob && originalPreview && (
                    <img
                      src={originalPreview}
                      alt="Original"
                      className="img-fluid rounded-3"
                      style={{ maxHeight: '100%', objectFit: 'contain' }}
                    />
                  )}

                  {/* Composited Canvas Preview */}
                  <canvas
                    ref={canvasRef}
                    className={`img-fluid rounded-3 ${!cutoutBlob || loading ? 'd-none' : ''}`}
                    style={{ maxHeight: '100%', objectFit: 'contain' }}
                  />
                </div>
              </div>

              {/* Right Column: Background Replacement Controls */}
              <div className="col-12 col-lg-5 d-flex flex-column justify-content-between">
                <div>
                  <h5 className="fw-bold mb-3">Background Settings</h5>

                  {!cutoutBlob ? (
                    <div className="alert alert-light border p-3 rounded-3 text-muted small">
                      Click <strong>"Remove Background"</strong> below to activate custom background swapping.
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {/* Background Type Selector */}
                      <div className="btn-group w-100" role="group">
                        <button
                          type="button"
                          className={`btn ${bgMode === 'transparent' ? 'btn-danger' : 'btn-outline-secondary'}`}
                          style={bgMode === 'transparent' ? { backgroundColor: '#DC2626', borderColor: '#DC2626' } : {}}
                          onClick={() => setBgMode('transparent')}
                        >
                          Transparent
                        </button>
                        <button
                          type="button"
                          className={`btn ${bgMode === 'color' ? 'btn-danger' : 'btn-outline-secondary'}`}
                          style={bgMode === 'color' ? { backgroundColor: '#DC2626', borderColor: '#DC2626' } : {}}
                          onClick={() => setBgMode('color')}
                        >
                          Color Fill
                        </button>
                        <button
                          type="button"
                          className={`btn ${bgMode === 'image' ? 'btn-danger' : 'btn-outline-secondary'}`}
                          style={bgMode === 'image' ? { backgroundColor: '#DC2626', borderColor: '#DC2626' } : {}}
                          onClick={() => setBgMode('image')}
                        >
                          Image BG
                        </button>
                      </div>

                      {/* Mode 1: Color Palette */}
                      {bgMode === 'color' && (
                        <div className="p-3 border rounded-3 bg-light">
                          <label className="form-label small fw-bold mb-2">Preset Colors:</label>
                          <div className="d-flex flex-wrap gap-2 mb-3">
                            {PRESET_COLORS.map((col) => (
                              <div
                                key={col.value}
                                onClick={() => setSelectedColor(col.value)}
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  backgroundColor: col.value,
                                  cursor: 'pointer',
                                  border: selectedColor === col.value ? '3px solid #DC2626' : '1px solid #d1d5db'
                                }}
                                className="rounded-circle shadow-sm"
                                title={col.label}
                              />
                            ))}
                          </div>

                          <label className="form-label small fw-bold mb-1">Custom Color Picker:</label>
                          <div className="d-flex align-items-center gap-2">
                            <input
                              type="color"
                              className="form-control form-control-color border-0 p-0"
                              value={selectedColor}
                              onChange={(e) => setSelectedColor(e.target.value)}
                            />
                            <span className="font-monospace small">{selectedColor}</span>
                          </div>
                        </div>
                      )}

                      {/* Mode 2: Custom Background Image Upload */}
                      {bgMode === 'image' && (
                        <div className="p-3 border rounded-3 bg-light">
                          <label className="form-label small fw-bold mb-2">Upload Custom Backdrop:</label>
                          <input
                            type="file"
                            accept="image/*"
                            className="form-control mb-2"
                            onChange={handleBgImageUpload}
                          />
                          <div className="text-muted small">
                            Upload any wallpaper, outdoor photo, or scenic backdrop.
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="d-flex flex-column gap-2 mt-4">
                  {!cutoutBlob ? (
                    <button
                      type="button"
                      onClick={handleRemoveBg}
                      disabled={loading}
                      className="btn btn-danger btn-lg fw-bold w-100"
                      style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Processing Cutout...
                        </>
                      ) : (
                        '✨ Remove Background'
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="btn btn-success btn-lg fw-bold w-100"
                    >
                      <i className="bi bi-download me-2"></i> Download Result
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={loading}
                    className="btn btn-outline-secondary fw-semibold w-100"
                  >
                    Change Image
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}