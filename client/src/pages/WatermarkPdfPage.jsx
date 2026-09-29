import React, { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import FileUploader from '../components/FileUploader';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/pdf';

export default function WatermarkPdfPage() {
  const [file, setFile] = useState(null);
  const [previewThumb, setPreviewThumb] = useState(null);
  const [numPages, setNumPages] = useState(1);

  // Mode: 'text' | 'image'
  const [mode, setMode] = useState('text');

  // Text Watermark Parameters
  const [text, setText] = useState('PDFMAN');
  const [fontSize, setFontSize] = useState(32);
  const [fontFamily, setFontFamily] = useState('helv');
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [color, setColor] = useState('#E11D48');

  // Image Watermark Parameters
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  // Common Parameters
  const [position, setPosition] = useState(5); // 1 to 9 (Center = 5)
  const [mosaic, setMosaic] = useState(true);
  const [transparency, setTransparency] = useState(0.5); // Default 50% opacity
  const [rotation, setRotation] = useState(45);
  const [fromPage, setFromPage] = useState(1);
  const [toPage, setToPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const imgInputRef = useRef(null);

  // Load PDF & Render Thumbnail
  const handlePdfSelect = async (files) => {
    const selected = files[0];
    if (!selected) return;

    setFile(selected);
    setErrorMsg('');
    try {
      const buf = await selected.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: buf }).promise;
      setNumPages(doc.numPages);
      setToPage(doc.numPages);

      const page = await doc.getPage(1);
      const vp = page.getViewport({ scale: 0.45 });
      const canvas = document.createElement('canvas');
      canvas.width = vp.width;
      canvas.height = vp.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
      setPreviewThumb(canvas.toDataURL());
    } catch {
      setErrorMsg('Could not read PDF preview. File might be password protected or corrupted.');
    }
  };

  const handleImageSelect = (e) => {
    const img = e.target.files[0];
    if (!img) return;
    setImageFile(img);
    setImagePreviewUrl(URL.createObjectURL(img));
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setErrorMsg('');

    const params = {
      type: mode,
      text,
      fontFamily: bold ? `${fontFamily}b` : italic ? `${fontFamily}i` : fontFamily,
      fontSize,
      color,
      opacity: transparency,
      rotation,
      mosaic,
      position,
      fromPage,
      toPage,
      imageWidth: 140,
      imageHeight: 90
    };

    const formData = new FormData();
    formData.append('file', file);
    formData.append('params', JSON.stringify(params));
    if (mode === 'image' && imageFile) {
      formData.append('watermarkImage', imageFile);
    }

    try {
      const res = await axios.post(`${API_BASE}/add-watermark`, formData, {
        responseType: 'blob'
      });

      const blobUrl = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `pdfMan_watermarked_${file.name}`;
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
          setErrorMsg('Watermarking failed. Please verify the backend server.');
        }
      } else if (err.response?.data?.error) {
        setErrorMsg(err.response.data.error);
      } else {
        setErrorMsg('Watermarking failed: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const schemaJson = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'PDFMan Watermark PDF',
    'url': window.location.href,
    'description': 'Add text and image watermarks to PDF files online for free. Customize font, color, opacity, rotation, and repeat grid.',
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
        <title>Add Watermark to PDF Online Free - Stamp Text or Image | PDFMan</title>
        <meta
          name="description"
          content="Add custom text or image watermarks to PDF documents online for free. Choose font, size, rotation, opacity, and mosaic repeat layout across all pages."
        />
        <link rel="canonical" href="https://pdfman.com/watermark-pdf" />
        <meta property="og:title" content="Add Watermark to PDF Online Free - PDFMan" />
        <meta property="og:description" content="Stamp text or image watermarks over your PDF documents in seconds." />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(schemaJson)}</script>
      </Helmet>

      <div className="container-fluid py-4 min-vh-100 bg-light">
        {!file ? (
          <div className="container py-5 text-center" style={{ maxWidth: '680px' }}>
            <h1 className="fw-bold mb-2 d-flex justify-content-center align-items-center gap-2">
              <i className="bi bi-droplet-half text-danger"></i> Add watermark into a PDF
            </h1>
            <p className="text-muted mb-4">
              Stamp an image or text over your PDF in seconds. Choose typography, transparency, and position.
            </p>
            <FileUploader
              accept=".pdf"
              multiple={false}
              onFilesSelected={handlePdfSelect}
              title="Select PDF file"
              subtitle="or drop PDF here"
            />

            {/* Indexable SEO Content Section for Search Ranking */}
            <div className="mt-5 text-start border-top pt-4 text-muted">
              <h3 className="h5 fw-bold text-dark mb-3">How to add a watermark to PDF files online</h3>
              <ol className="small ps-3 mb-4">
                <li className="mb-2"><strong>Upload PDF:</strong> Select your file or drag and drop it into the uploader above.</li>
                <li className="mb-2"><strong>Customize Stamp:</strong> Select text or image mode, set font size, opacity, color, and angle.</li>
                <li className="mb-2"><strong>Select Placement:</strong> Use the 9-point grid or enable 9x Mosaic repeat across the page.</li>
                <li><strong>Apply & Download:</strong> Click Add watermark to generate and download your stamped document.</li>
              </ol>

              <h3 className="h5 fw-bold text-dark mb-3">Frequently Asked Questions</h3>
              <div className="accordion accordion-flush" id="watermarkFaq">
                <div className="accordion-item bg-transparent">
                  <h2 className="accordion-header">
                    <button className="accordion-button collapsed px-0 bg-transparent fw-semibold text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#wfaq1">
                      Can the watermark be placed behind existing text?
                    </button>
                  </h2>
                  <div id="wfaq1" className="accordion-collapse collapse" data-bs-parent="#watermarkFaq">
                    <div className="accordion-body px-0 small text-secondary">
                      Our engine applies watermarks with configurable transparency levels (from 10% to 100%) so background and foreground text remain readable while protecting the document.
                    </div>
                  </div>
                </div>
                <div className="accordion-item bg-transparent">
                  <h2 className="accordion-header">
                    <button className="accordion-button collapsed px-0 bg-transparent fw-semibold text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#wfaq2">
                      Can I watermark only specific pages?
                    </button>
                  </h2>
                  <div id="wfaq2" className="accordion-collapse collapse" data-bs-parent="#watermarkFaq">
                    <div className="accordion-body px-0 small text-secondary">
                      Yes. Use the page range controls in the options panel to apply your stamp to all pages or restrict it between specific starting and ending page numbers.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="container-fluid px-lg-5">
            <div className="row g-4">
              {/* Center: Live Interactive Preview Canvas */}
              <div className="col-12 col-lg-7 d-flex flex-column align-items-center justify-content-center p-4">
                <div
                  className="position-relative bg-white shadow rounded border overflow-hidden"
                  style={{ width: '380px', height: '520px' }}
                >
                  {previewThumb && (
                    <img
                      src={previewThumb}
                      alt="Page 1 Preview"
                      className="w-100 h-100"
                      style={{ objectFit: 'contain' }}
                    />
                  )}

                  {/* Simulated Watermark Stamp Overlay */}
                  <div
                    className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-wrap align-items-center justify-content-center"
                    style={{
                      pointerEvents: 'none',
                      opacity: transparency,
                      zIndex: 10
                    }}
                  >
                    {mosaic ? (
                      <div className="d-flex flex-wrap w-100 h-100 justify-content-around align-content-around p-3">
                        {[...Array(9)].map((_, i) => (
                          <div
                            key={i}
                            style={{
                              transform: `rotate(${rotation}deg)`,
                              color,
                              fontSize: `${fontSize * 0.45}px`,
                              fontWeight: bold ? 'bold' : 'normal',
                              fontStyle: italic ? 'italic' : 'normal',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {mode === 'text' ? text : imagePreviewUrl ? (
                              <img src={imagePreviewUrl} alt="Watermark preview" style={{ width: '50px', height: 'auto' }} />
                            ) : '[Image]'}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        style={{
                          transform: `rotate(${rotation}deg)`,
                          color,
                          fontSize: `${fontSize * 0.75}px`,
                          fontWeight: bold ? 'bold' : 'normal',
                          fontStyle: italic ? 'italic' : 'normal',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {mode === 'text' ? text : imagePreviewUrl ? (
                          <img src={imagePreviewUrl} alt="Watermark preview" style={{ width: '100px', height: 'auto' }} />
                        ) : '[Image]'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Options Panel */}
              <div className="col-12 col-lg-5">
                <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold mb-0">Watermark options</h5>
                    <button
                      className="btn btn-sm btn-outline-secondary rounded-pill"
                      onClick={() => {
                        setFile(null);
                        setPreviewThumb(null);
                        setImageFile(null);
                        setImagePreviewUrl(null);
                        setErrorMsg('');
                      }}
                    >
                      Change PDF
                    </button>
                  </div>

                  {/* Place Text vs Place Image Tabs */}
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <button
                        type="button"
                        className={`btn w-100 py-2 border rounded-3 fw-semibold ${mode === 'text' ? 'border-danger text-danger bg-danger bg-opacity-10' : 'btn-light'}`}
                        onClick={() => setMode('text')}
                      >
                        <i className="bi bi-fonts fs-5 d-block"></i> Place text
                      </button>
                    </div>
                    <div className="col-6">
                      <button
                        type="button"
                        className={`btn w-100 py-2 border rounded-3 fw-semibold ${mode === 'image' ? 'border-danger text-danger bg-danger bg-opacity-10' : 'btn-light'}`}
                        onClick={() => {
                          setMode('image');
                          if (!imageFile) imgInputRef.current?.click();
                        }}
                      >
                        <i className="bi bi-image fs-5 d-block"></i> Place image
                      </button>
                      <input type="file" ref={imgInputRef} onChange={handleImageSelect} accept="image/*" className="d-none" />
                    </div>
                  </div>

                  {/* Text Controls */}
                  {mode === 'text' ? (
                    <>
                      <div className="mb-3">
                        <label className="form-label small fw-bold text-muted mb-1">Text:</label>
                        <input
                          type="text"
                          className="form-control"
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                        />
                      </div>

                      <div className="d-flex align-items-center gap-2 mb-3">
                        <select className="form-select form-select-sm" value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
                          <option value="helv">Arial / Helvetica</option>
                          <option value="times">Times New Roman</option>
                          <option value="couri">Courier</option>
                        </select>
                        <select className="form-select form-select-sm" style={{ width: '80px' }} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))}>
                          <option value="16">16</option>
                          <option value="24">24</option>
                          <option value="32">32</option>
                          <option value="48">48</option>
                          <option value="72">72</option>
                        </select>
                        <button type="button" className={`btn btn-sm ${bold ? 'btn-dark' : 'btn-outline-secondary'}`} onClick={() => setBold(!bold)}><i className="bi bi-type-bold"></i></button>
                        <button type="button" className={`btn btn-sm ${italic ? 'btn-dark' : 'btn-outline-secondary'}`} onClick={() => setItalic(!italic)}><i className="bi bi-type-italic"></i></button>
                        <input type="color" className="form-control form-control-color border-0 p-0" value={color} onChange={(e) => setColor(e.target.value)} />
                      </div>
                    </>
                  ) : (
                    <div className="mb-3">
                      <button type="button" className="btn btn-outline-secondary w-100 py-2" onClick={() => imgInputRef.current?.click()}>
                        <i className="bi bi-upload me-1"></i> {imageFile ? imageFile.name : 'Select watermark image'}
                      </button>
                    </div>
                  )}

                  {/* Position Matrix & Mosaic */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted mb-1">Position:</label>
                    <div className="d-flex align-items-center gap-4">
                      <div className="d-grid" style={{ gridTemplateColumns: 'repeat(3, 24px)', gap: '4px' }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((pos) => (
                          <div
                            key={pos}
                            onClick={() => { setPosition(pos); setMosaic(false); }}
                            style={{
                              width: '24px',
                              height: '24px',
                              cursor: 'pointer',
                              backgroundColor: (!mosaic && position === pos) ? '#E11D48' : '#e2e8f0',
                              borderRadius: '3px'
                            }}
                          />
                        ))}
                      </div>

                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="mosaicCheck"
                          checked={mosaic}
                          onChange={(e) => setMosaic(e.target.checked)}
                        />
                        <label className="form-check-label small fw-semibold" htmlFor="mosaicCheck">
                          Mosaic (Repeat 9x across page)
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Transparency & Rotation Dropdowns */}
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-bold text-muted mb-1">Transparency:</label>
                      <select
                        className="form-select form-select-sm"
                        value={transparency}
                        onChange={(e) => setTransparency(parseFloat(e.target.value))}
                      >
                        <option value={1}>No transparency (100% solid)</option>
                        <option value={0.75}>25% transparency (75% visible)</option>
                        <option value={0.5}>50% transparency (Standard watermark)</option>
                        <option value={0.25}>75% transparency (Very faint)</option>
                        <option value={0.1}>90% transparency (Subtle hint)</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-bold text-muted mb-1">Rotation:</label>
                      <select
                        className="form-select form-select-sm"
                        value={rotation}
                        onChange={(e) => setRotation(Number(e.target.value))}
                      >
                        <option value={0}>Do not rotate</option>
                        <option value={45}>45°</option>
                        <option value={90}>90°</option>
                        <option value={180}>180°</option>
                        <option value={270}>270°</option>
                      </select>
                    </div>
                  </div>

                  {/* Page Range Selection */}
                  <div className="mb-4">
                    <label className="form-label small fw-bold text-muted mb-1">Pages:</label>
                    <div className="d-flex align-items-center gap-2">
                      <span className="small text-muted">from page</span>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        style={{ width: '70px' }}
                        min="1"
                        max={numPages}
                        value={fromPage}
                        onChange={(e) => setFromPage(Number(e.target.value))}
                      />
                      <span className="small text-muted">to</span>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        style={{ width: '70px' }}
                        min="1"
                        max={numPages}
                        value={toPage}
                        onChange={(e) => setToPage(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="alert alert-danger py-2 small mb-3">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i> {errorMsg}
                    </div>
                  )}

                  {/* Action CTA */}
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="btn btn-danger btn-lg w-100 fw-bold rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2"
                    style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        Adding watermark...
                      </>
                    ) : (
                      <>
                        Add watermark <i className="bi bi-arrow-right"></i>
                      </>
                    )}
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