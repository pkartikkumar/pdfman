import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { PDFDocument } from 'pdf-lib';
import FileUploader from '../components/FileUploader';

export default function MergePdfPage() {
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveFile = (index, direction) => {
    setFiles((prev) => {
      const updated = [...prev];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= updated.length) return prev;
      const [movedItem] = updated.splice(index, 1);
      updated.splice(targetIndex, 0, movedItem);
      return updated;
    });
  };

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
        const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);

      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = `PDFMan_merged_${Date.now()}.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();

      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error(err);
      alert('Error merging files. Ensure files are valid, unlocked PDFs.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Merge PDF Online Free - Combine PDF Files | PDFMan</title>
        <meta
          name="description"
          content="Combine multiple PDF documents into a single file easily and securely in your browser. Fast, private, and 100% free."
        />
      </Helmet>

      <div className="container py-5" style={{ maxWidth: '720px' }}>
        <div className="text-center mb-4">
          <h1 className="fw-bold d-flex justify-content-center align-items-center gap-2 mb-2">
            <i className="bi bi-files text-danger"></i> Merge PDF files
          </h1>
          <p className="text-muted">
            Combine multiple PDFs into a single document entirely in your browser.
          </p>
        </div>

        {files.length === 0 ? (
          <FileUploader
            accept=".pdf"
            multiple={true}
            onFilesSelected={(newFiles) => setFiles((prev) => [...prev, ...newFiles])}
            title="Select PDF files"
            subtitle="or drop PDF documents here"
          />
        ) : (
          <div className="card shadow-sm border-0 p-4 rounded-4 bg-white text-start">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0">Files ready for merge ({files.length})</h5>
              <span className="badge bg-secondary">
                {(files.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2)} MB total
              </span>
            </div>

            <ul className="list-group mb-4">
              {files.map((file, i) => (
                <li key={`${file.name}-${i}`} className="list-group-item d-flex justify-content-between align-items-center py-2">
                  <div className="d-flex align-items-center text-truncate me-2">
                    <span className="badge bg-light text-secondary me-2 border">{i + 1}</span>
                    <i className="bi bi-file-earmark-pdf-fill text-danger me-2 fs-5"></i>
                    <span className="text-truncate small fw-semibold">{file.name}</span>
                  </div>

                  <div className="d-flex align-items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      className="btn btn-sm btn-light border-0 px-2"
                      disabled={i === 0 || isProcessing}
                      onClick={() => handleMoveFile(i, -1)}
                      title="Move up"
                    >
                      <i className="bi bi-chevron-up"></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-light border-0 px-2"
                      disabled={i === files.length - 1 || isProcessing}
                      onClick={() => handleMoveFile(i, 1)}
                      title="Move down"
                    >
                      <i className="bi bi-chevron-down"></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger border-0 px-2 ms-1"
                      disabled={isProcessing}
                      onClick={() => handleRemoveFile(i)}
                      title="Remove file"
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="d-flex gap-2">
              <button
                type="button"
                onClick={handleMerge}
                disabled={isProcessing || files.length < 2}
                className="btn btn-danger btn-lg flex-grow-1 fw-bold"
                style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}
              >
                {isProcessing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Merging PDFs...
                  </>
                ) : (
                  'Merge PDF Now'
                )}
              </button>
              <button
                type="button"
                onClick={() => setFiles([])}
                disabled={isProcessing}
                className="btn btn-outline-secondary btn-lg fw-semibold"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}