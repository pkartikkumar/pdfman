import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { Helmet } from 'react-helmet-async';
import FileUploader from '../components/FileUploader';

export default function JpgToPdfPage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const convertImagesToPdf = async () => {
    if (images.length === 0) return;
    setLoading(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const base64 = await new Promise((res, rej) => {
          const reader = new FileReader();
          reader.onload = (e) => res(e.target.result);
          reader.onerror = (err) => rej(err);
          reader.readAsDataURL(file);
        });

        if (i > 0) doc.addPage();

        const imgProps = doc.getImageProperties(base64);
        const imgRatio = imgProps.width / imgProps.height;
        const pageRatio = pageWidth / pageHeight;

        let renderW, renderH;

        // Fit within page margins without clipping or aspect distortion
        if (imgRatio > pageRatio) {
          renderW = pageWidth - 20;
          renderH = renderW / imgRatio;
        } else {
          renderH = pageHeight - 20;
          renderW = renderH * imgRatio;
        }

        const posX = (pageWidth - renderW) / 2;
        const posY = (pageHeight - renderH) / 2;

        const format = file.type === 'image/png' ? 'PNG' : 'JPEG';
        doc.addImage(base64, format, posX, posY, renderW, renderH);
      }

      doc.save(`PDFMan_images_${Date.now()}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Failed to generate PDF from images.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>JPG to PDF Converter - Convert Images Online Free | PDFMan</title>
        <meta
          name="description"
          content="Convert JPG, PNG, and camera photos into a consolidated PDF document directly in your browser. Fast, private, and free."
        />
      </Helmet>

      <div className="container py-5 text-center" style={{ maxWidth: '680px' }}>
        <h1 className="fw-bold d-flex justify-content-center align-items-center gap-2 mb-2">
          <i className="bi bi-file-earmark-image text-danger"></i> JPG to PDF
        </h1>
        <p className="text-muted mb-4">
          Convert your JPG and PNG photos into a clean, unified PDF instantly.
        </p>

        {images.length === 0 ? (
          <FileUploader
            accept="image/*"
            multiple={true}
            onFilesSelected={setImages}
            title="Select Images"
            subtitle="JPG, PNG, WebP supported"
          />
        ) : (
          <div className="card p-4 shadow-sm border-0 rounded-4 bg-white text-start">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="fw-bold">
                <i className="bi bi-images text-danger me-2"></i>
                {images.length} image{images.length > 1 ? 's' : ''} selected
              </span>
              <span className="badge bg-secondary">
                {(images.reduce((acc, img) => acc + img.size, 0) / (1024 * 1024)).toFixed(2)} MB total
              </span>
            </div>

            <div className="d-flex gap-2">
              <button
                type="button"
                onClick={convertImagesToPdf}
                disabled={loading}
                className="btn btn-danger btn-lg flex-grow-1 fw-bold"
                style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Generating PDF...
                  </>
                ) : (
                  'Convert to PDF'
                )}
              </button>
              <button
                type="button"
                onClick={() => setImages([])}
                disabled={loading}
                className="btn btn-outline-secondary btn-lg fw-semibold"
              >
                Change Files
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}