import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { PDFDocument } from 'pdf-lib';
import FileUploader from '../components/FileUploader';

export default function SplitPdfPage() {
  const [file, setFile] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [splitMode, setSplitMode] = useState('range'); // 'range' or 'all'
  const [pageRange, setPageRange] = useState('');
  const [processing, setProcessing] = useState(false);

  // Load PDF to detect page count
  const handleFileSelect = async (files) => {
    const selectedFile = files[0];
    if (!selectedFile) return;

    try {
      const buffer = await selectedFile.arrayBuffer();
      const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const count = pdf.getPageCount();

      setFile(selectedFile);
      setTotalPages(count);
      setPageRange(`1-${count > 1 ? 2 : 1}`);
    } catch (err) {
      alert('Failed to read PDF. The file might be password-protected or corrupted.');
    }
  };

  // Parse comma/dash range strings like "1-3, 5"
  const parsePageNumbers = (rangeStr, maxPages) => {
    const indices = new Set();
    const parts = rangeStr.split(',');

    for (let part of parts) {
      part = part.trim();
      if (part.includes('-')) {
        const [start, end] = part.split('-').map((n) => parseInt(n.trim(), 10));
        if (!isNaN(start) && !isNaN(end)) {
          const min = Math.max(1, Math.min(start, end));
          const max = Math.min(maxPages, Math.max(start, end));
          for (let i = min; i <= max; i++) {
            indices.add(i - 1);
          }
        }
      } else {
        const pageNum = parseInt(part, 10);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= maxPages) {
          indices.add(pageNum - 1);
        }
      }
    }
    return Array.from(indices).sort((a, b) => a - b);
  };

  const triggerDownload = (bytes, filename) => {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleSplit = async () => {
    if (!file) return;
    setProcessing(true);

    try {
      const buffer = await file.arrayBuffer();
      const originalPdf = await PDFDocument.load(buffer, { ignoreEncryption: true });

      if (splitMode === 'range') {
        // Extract selected range into one single PDF
        const targetIndices = parsePageNumbers(pageRange, totalPages);
        if (targetIndices.length === 0) {
          alert('Please enter a valid page range.');
          setProcessing(false);
          return;
        }

        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(originalPdf, targetIndices);
        copiedPages.forEach((p) => newPdf.addPage(p));

        const pdfBytes = await newPdf.save();
        triggerDownload(pdfBytes, `PDFMan_split_pages_${pageRange.replace(/\s+/g, '')}.pdf`);
      } else {
        // Extract every page into separate individual PDF files with a slight pause
        for (let i = 0; i < totalPages; i++) {
          const singlePagePdf = await PDFDocument.create();
          const [copiedPage] = await singlePagePdf.copyPages(originalPdf, [i]);
          singlePagePdf.addPage(copiedPage);

          const pdfBytes = await singlePagePdf.save();
          triggerDownload(pdfBytes, `PDFMan_page_${i + 1}.pdf`);
          // Stagger downloads slightly so browsers do not drop parallel triggers
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
      }
    } catch (err) {
      alert('Error while splitting PDF: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Split PDF Online Free - Extract Pages from PDF | PDFMan</title>
        <meta
          name="description"
          content="Split PDF documents by page ranges or extract every page into separate files instantly in your browser. 100% free and client-side secure."
        />
      </Helmet>

      <div className="container py-5 text-center" style={{ maxWidth: '680px' }}>
        <h1 className="fw-bold d-flex justify-content-center align-items-center gap-2 mb-2">
          <i className="bi bi-layout-split text-danger"></i> Split PDF file
        </h1>
        <p className="text-muted mb-4">
          Separate one page or a whole range into independent PDF documents entirely in your browser.
        </p>

        {!file ? (
          <FileUploader
            accept=".pdf"
            multiple={false}
            onFilesSelected={handleFileSelect}
            title="Select PDF file"
            subtitle="or drop PDF file here"
          />
        ) : (
          <div className="card p-4 shadow-sm border-0 rounded-4 mt-3 bg-white text-start">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h5 className="fw-bold mb-1">
                  <i className="bi bi-file-earmark-pdf text-danger me-2"></i>
                  {file.name}
                </h5>
                <span className="text-muted small">Total pages: {totalPages}</span>
              </div>
              <span className="badge bg-secondary">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
            </div>

            <label className="form-label fw-bold">Split Option:</label>
            <div className="list-group mb-4">
              <label
                className={`list-group-item d-flex gap-3 align-items-center ${splitMode === 'range' ? 'bg-light border-danger' : ''}`}
                style={{ cursor: 'pointer' }}
              >
                <input
                  type="radio"
                  name="splitOption"
                  className="form-check-input mt-0"
                  checked={splitMode === 'range'}
                  onChange={() => setSplitMode('range')}
                />
                <div>
                  <strong>Extract specific range</strong>
                  <div className="text-muted small">Specify pages to combine into a new PDF (e.g. 1-3, 5)</div>
                </div>
              </label>

              <label
                className={`list-group-item d-flex gap-3 align-items-center ${splitMode === 'all' ? 'bg-light border-danger' : ''}`}
                style={{ cursor: 'pointer' }}
              >
                <input
                  type="radio"
                  name="splitOption"
                  className="form-check-input mt-0"
                  checked={splitMode === 'all'}
                  onChange={() => setSplitMode('all')}
                />
                <div>
                  <strong>Extract all individual pages</strong>
                  <div className="text-muted small">Save each page from 1 to {totalPages} as its own file</div>
                </div>
              </label>
            </div>

            {splitMode === 'range' && (
              <div className="mb-4">
                <label className="form-label fw-bold">Pages to extract:</label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  value={pageRange}
                  placeholder={`e.g. 1-${Math.min(totalPages, 3)}`}
                  onChange={(e) => setPageRange(e.target.value)}
                />
                <div className="form-text">Example: 1-2, 4 or single page like 2</div>
              </div>
            )}

            <div className="d-flex gap-2">
              <button
                type="button"
                onClick={handleSplit}
                disabled={processing}
                className="btn btn-danger btn-lg flex-grow-1 fw-bold"
                style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}
              >
                {processing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Splitting PDF...
                  </>
                ) : (
                  'Split PDF'
                )}
              </button>
              <button
                type="button"
                onClick={() => setFile(null)}
                disabled={processing}
                className="btn btn-outline-secondary btn-lg fw-semibold"
              >
                Change File
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}