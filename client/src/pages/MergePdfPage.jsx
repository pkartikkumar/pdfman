import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import FileUploader from '../components/FileUploader';

export default function MergePdfPage() {
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMerge = async () => {
    if (files.length < 2) {
      alert('Please add at least 2 PDF files to combine.');
      return;
    }
    setIsProcessing(true);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const file of files) {
        const buffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(buffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = `PDFMan_merged_${Date.now()}.pdf`;
      downloadLink.click();
    } catch (err) {
      alert('Error merging files. Ensure files are valid, unlocked PDFs.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: '720px' }}>
      <div className="text-center mb-4">
        <h1 className="fw-bold">Merge PDF files</h1>
        <p className="text-muted">Combine multiple PDFs into a single document entirely in your browser.</p>
      </div>

      {files.length === 0 ? (
        <FileUploader accept=".pdf" multiple onFilesSelected={(newFiles) => setFiles(newFiles)} />
      ) : (
        <div className="card shadow-sm border-0 p-4 rounded-4">
          <h5 className="fw-bold mb-3">Files ready for merge ({files.length})</h5>
          <ul className="list-group mb-4">
            {files.map((file, i) => (
              <li key={i} className="list-group-item d-flex justify-content-between align-items-center">
                <span><i className="bi bi-file-earmark-pdf-fill text-danger me-2"></i>{file.name}</span>
                <span className="badge bg-light text-dark">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </li>
            ))}
          </ul>
          <div className="d-flex gap-2">
            <button onClick={handleMerge} disabled={isProcessing} className="btn btn-brand btn-lg flex-grow-1 fw-bold">
              {isProcessing ? 'Merging in browser...' : 'Merge PDF Now'}
            </button>
            <button onClick={() => setFiles([])} className="btn btn-outline-secondary btn-lg">Reset</button>
          </div>
        </div>
      )}
    </div>
  );
}