import React, { useState } from 'react';
import jsPDF from 'jspdf';
import FileUploader from '../components/FileUploader';

export default function JpgToPdfPage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const convertImagesToPdf = async () => {
    if (images.length === 0) return;
    setLoading(true);

    try {
      const doc = new jsPDF();
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const base64 = await new Promise((res) => {
          const reader = new FileReader();
          reader.onload = (e) => res(e.target.result);
          reader.readAsDataURL(file);
        });

        if (i > 0) doc.addPage();
        const imgProps = doc.getImageProperties(base64);
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        doc.addImage(base64, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }
      doc.save(`PDFMan_${Date.now()}.pdf`);
    } catch (e) {
      alert("Conversion error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5 text-center" style={{ maxWidth: '680px' }}>
      <h1 className="fw-bold">JPG to PDF</h1>
      <p className="text-muted">Convert your JPG and PNG photos to a clean PDF instantly.</p>
      {images.length === 0 ? (
        <FileUploader accept="image/*" multiple onFilesSelected={setImages} title="Select Images" />
      ) : (
        <div className="card p-4 shadow-sm border-0">
          <p className="fw-semibold">{images.length} image(s) selected.</p>
          <button onClick={convertImagesToPdf} disabled={loading} className="btn btn-brand btn-lg fw-bold">
            {loading ? "Generating PDF..." : "Convert to PDF"}
          </button>
        </div>
      )}
    </div>
  );
}