import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import * as pdfjsLib from 'pdfjs-dist';
import axios from 'axios';
import FileUploader from '../components/FileUploader';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

// Cleanly sanitize any rogue brackets, markdown links, or trailing slashes
const cleanUrl = (url) => {
  if (!url) return 'https://pdfman-1h8j.onrender.com/api/pdf';
  return url.replace(/[\[\]()]/g, '').trim().replace(/\/+$/, '');
};

const API_BASE = cleanUrl(process.env.REACT_APP_API_URL);

const COLOR_PRESETS = [
  '#000000', '#1E3A8A', '#2563EB', '#0D9488', '#16A34A',
  '#CA8A04', '#DC2626', '#9333EA', '#475569', '#FFFFFF'
];

export default function EditPdfPage() {
  const [file, setFile] = useState(null);
  const [pdfDocProxy, setPdfDocProxy] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [thumbnails, setThumbnails] = useState([]);

  const [editorMode, setEditorMode] = useState('edit');

  // Paragraph blocks per page in Native PDF Coordinates
  const [blocksByPage, setBlocksByPage] = useState({});
  const [selectedBlockId, setSelectedBlockId] = useState(null);

  const [textStyles, setTextStyles] = useState({
    fontFamily: 'Arimo',
    fontSize: 9.5,
    bold: false,
    italic: false,
    underline: false,
    align: 'left',
    color: '#000000'
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [downloadBlobUrl, setDownloadBlobUrl] = useState(null);

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // 1. Load PDF & build thumbnails
  const handleFileSelect = async (files) => {
    const selected = files[0];
    if (!selected) return;

    setFile(selected);
    setCurrentPage(1);
    setBlocksByPage({});
    setSelectedBlockId(null);
    setShowSuccessModal(false);

    const buffer = await selected.arrayBuffer();
    const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
    setPdfDocProxy(doc);
    setNumPages(doc.numPages);

    const thumbs = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const vp = page.getViewport({ scale: 0.18 });
      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = vp.width;
      thumbCanvas.height = vp.height;
      const ctx = thumbCanvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
      thumbs.push(thumbCanvas.toDataURL());
    }
    setThumbnails(thumbs);
  };

  // 2. Render Page and Extract Unified Paragraph Bounding Boxes
  useEffect(() => {
    if (!pdfDocProxy) return;

    let cancel = false;
    const renderPdf = async () => {
      const page = await pdfDocProxy.getPage(currentPage);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');

      const textContent = await page.getTextContent();
      await page.render({ canvasContext: ctx, viewport }).promise;
      if (cancel) return;

      setBlocksByPage((prev) => {
        if (prev[currentPage]) {
          prev[currentPage].forEach((p) => {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(p.screen.x - 2, p.screen.y - 2, p.screen.w + 4, p.screen.h + 4);
          });
          return prev;
        }

        // Group items into coherent paragraphs
        const rawItems = textContent.items;
        const paragraphs = [];
        let currentP = null;

        rawItems.forEach((item, idx) => {
          if (!item.str || item.str.trim() === '') return;

          const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
          const fontH = Math.max(9, Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]));
          const itemX = tx[4];
          const itemY = tx[5] - fontH;
          const itemW = Math.max(item.width * scale, 16);

          // Native PDF coordinates [x0, y0, x1, y1] (bottom-left origin)
          const pdfX0 = item.transform[4];
          const pdfY0 = item.transform[5];
          const pdfW = item.width;
          const pdfH = Math.sqrt(item.transform[2] * item.transform[2] + item.transform[3] * item.transform[3]);
          const pdfBbox = [pdfX0, pdfY0, pdfX0 + pdfW, pdfY0 + pdfH];

          const isNearby =
            currentP &&
            Math.abs(itemY - (currentP.screen.y + currentP.screen.h)) < fontH * 0.9 &&
            Math.abs(itemX - currentP.screen.x) < 60;

          if (isNearby) {
            currentP.text += (item.str.startsWith(' ') ? '' : ' ') + item.str;
            currentP.origText += (item.str.startsWith(' ') ? '' : ' ') + item.str;
            currentP.screen.w = Math.max(currentP.screen.w, itemW + (itemX - currentP.screen.x));
            currentP.screen.h = (itemY + fontH) - currentP.screen.y;

            // Expand native PDF bounding box
            currentP.pdfBbox[0] = Math.min(currentP.pdfBbox[0], pdfBbox[0]);
            currentP.pdfBbox[1] = Math.min(currentP.pdfBbox[1], pdfBbox[1]);
            currentP.pdfBbox[2] = Math.max(currentP.pdfBbox[2], pdfBbox[2]);
            currentP.pdfBbox[3] = Math.max(currentP.pdfBbox[3], pdfBbox[3]);
          } else {
            if (currentP) paragraphs.push(currentP);

            const isSerif =
              (item.fontName || '').toLowerCase().includes('times') ||
              (item.fontName || '').toLowerCase().includes('serif') ||
              (item.fontName || '').toLowerCase().includes('roman');

            currentP = {
              id: `blk_${currentPage}_${idx}`,
              text: item.str,
              origText: item.str,
              screen: { x: itemX, y: itemY, w: itemW, h: fontH },
              pdfBbox: [...pdfBbox],
              fontSize: Math.round(fontH * 10) / 10,
              fontFamily: isSerif ? 'Tinos' : 'Arimo',
              bold: (item.fontName || '').toLowerCase().includes('bold'),
              italic: (item.fontName || '').toLowerCase().includes('italic'),
              underline: false,
              align: 'left',
              color: '#111827',
              isEdited: false
            };
          }
        });

        if (currentP) paragraphs.push(currentP);

        // Blank out the background canvas text
        paragraphs.forEach((p) => {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(p.screen.x - 2, p.screen.y - 2, p.screen.w + 4, p.screen.h + 4);
        });

        return { ...prev, [currentPage]: paragraphs };
      });
    };

    renderPdf();
    return () => { cancel = true; };
  }, [pdfDocProxy, currentPage, scale]);

  // Select Block & Sync with Right Sidebar
  const handleSelectBlock = (block) => {
    setSelectedBlockId(block.id);
    setTextStyles({
      fontFamily: block.fontFamily,
      fontSize: block.fontSize,
      bold: block.bold,
      italic: block.italic,
      underline: block.underline,
      align: block.align,
      color: block.color
    });
  };

  // Live in-place text update
  const handleTextChange = (id, newText) => {
    setBlocksByPage((prev) => ({
      ...prev,
      [currentPage]: (prev[currentPage] || []).map((b) =>
        b.id === id ? { ...b, text: newText, isEdited: true } : b
      )
    }));
  };

  const updateStyle = (patch) => {
    setTextStyles((prev) => ({ ...prev, ...patch }));
    if (!selectedBlockId) return;

    setBlocksByPage((prev) => ({
      ...prev,
      [currentPage]: (prev[currentPage] || []).map((b) =>
        b.id === selectedBlockId ? { ...b, ...patch, isEdited: true } : b
      )
    }));
  };

  // 3. Save Changes via Backend Engine
  const handleSaveChanges = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const editsPayload = {};
      Object.keys(blocksByPage).forEach((pg) => {
        const editedBlocks = blocksByPage[pg].filter((b) => b.isEdited);
        if (editedBlocks.length > 0) {
          editsPayload[pg] = editedBlocks.map((b) => ({
            bbox: b.pdfBbox,
            text: b.text,
            fontFamily: b.fontFamily,
            fontSize: b.fontSize,
            bold: b.bold,
            italic: b.italic,
            align: b.align,
            color: b.color
          }));
        }
      });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('edits', JSON.stringify(editsPayload));

      const response = await axios.post(`${API_BASE}/apply-pdf-edits`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        responseType: 'blob'
      });

      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      setDownloadBlobUrl(url);
      setShowSuccessModal(true);
    } catch (err) {
      if (err.response && err.response.data instanceof Blob) {
        const errorText = await err.response.data.text();
        try {
          const parsed = JSON.parse(errorText);
          alert('Failed to process edits: ' + (parsed.error || parsed.message));
        } catch {
          alert('Failed to process edits. Please verify backend status.');
        }
      } else {
        alert('Failed to process edits: ' + (err.response?.data?.error || err.message));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const currentBlocks = blocksByPage[currentPage] || [];

  const schemaJson = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'PDFMan Visual In-Place PDF Editor',
    'url': window.location.href,
    'description': 'Edit PDF text directly on the page. In-place text replacement with font reflow, styling controls, and zero layout shifting.',
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
        <title>Edit PDF Text Online Free - Visual In-Place PDF Editor | PDFMan</title>
        <meta
          name="description"
          content="Edit PDF text directly on the page for free. Change existing sentences, adjust fonts, sizes, colors, and formatting without document corruption."
        />
        <link rel="canonical" href="https://pdfman.com/edit-pdf" />
        <meta property="og:title" content="Visual In-Place PDF Editor | PDFMan" />
        <meta property="og:description" content="Click directly on paragraphs to rewrite sentences with full reflow and zero layout shifts." />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(schemaJson)}</script>
      </Helmet>

      <div className="d-flex flex-column vh-100 bg-white" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        {/* 1. TOP NAVBAR */}
        <nav className="border-bottom px-3 py-1 d-flex align-items-center justify-content-between flex-shrink-0" style={{ height: '52px', backgroundColor: '#F8FAFC' }}>
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files);
              }
              e.target.value = '';
            }}
          />

          <div className="d-flex align-items-center gap-3">
            {file ? (
              <>
                <div className="d-flex bg-white rounded-pill border p-1 shadow-sm">
                  <button
                    type="button"
                    className={`btn btn-sm rounded-pill px-3 py-1 border-0 fw-semibold ${editorMode === 'annotate' ? 'bg-secondary bg-opacity-10 text-dark' : 'text-muted'}`}
                    onClick={() => setEditorMode('annotate')}
                    style={{ fontSize: '13px' }}
                  >
                    <i className="bi bi-pen me-1"></i> Annotate <span className="badge bg-secondary rounded-pill ms-1" style={{ fontSize: '10px' }}>12</span>
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm rounded-pill px-3 py-1 border-0 fw-bold ${editorMode === 'edit' ? 'text-white shadow-sm' : 'text-muted'}`}
                    onClick={() => setEditorMode('edit')}
                    style={{ fontSize: '13px', backgroundColor: editorMode === 'edit' ? '#DC2626' : 'transparent' }}
                  >
                    <i className="bi bi-pencil-square me-1"></i> Edit <span className="badge bg-white text-danger rounded-pill ms-1" style={{ fontSize: '10px' }}>4</span>
                  </button>
                </div>

                <div className="vr mx-1" style={{ height: '22px' }}></div>

                <div className="d-flex align-items-center gap-1">
                  <button type="button" className="btn btn-sm btn-light border-0 text-muted px-2" title="Text"><i className="bi bi-type fs-6"></i></button>
                  <button type="button" className="btn btn-sm btn-light border-0 text-muted px-2" title="Image"><i className="bi bi-image fs-6"></i></button>
                  <button type="button" className="btn btn-sm btn-light border-0 text-muted px-2" title="Shapes"><i className="bi bi-square fs-6"></i></button>
                  <button type="button" className="btn btn-sm btn-light border-0 text-muted px-2" title="Insert Text Box"><i className="bi bi-textarea-t fs-6"></i></button>
                </div>
              </>
            ) : (
              <span className="fw-bold text-dark fs-6 d-flex align-items-center gap-2">
                <i className="bi bi-pencil-square text-danger"></i> PDF Editor
              </span>
            )}
          </div>

          {file && (
            <div className="d-none d-md-flex align-items-center text-muted small fw-semibold">
              <i className="bi bi-file-earmark-pdf text-danger me-1"></i> {file.name}
            </div>
          )}

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-semibold d-flex align-items-center gap-1"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              <i className="bi bi-folder2-open"></i> Open File
            </button>
          </div>
        </nav>

        {/* 2. WORKSPACE */}
        {!file ? (
          <div className="container py-5 my-auto text-center" style={{ maxWidth: '680px' }}>
            <div className="display-4 text-danger mb-3"><i className="bi bi-pencil-square"></i></div>
            <h2 className="fw-bold mb-2">Visual In-Place PDF Editor</h2>
            <p className="text-muted mb-4">Click directly on paragraphs to rewrite sentences with full reflow and zero layout shifts.</p>
            <FileUploader
              accept=".pdf"
              multiple={false}
              onFilesSelected={handleFileSelect}
              title="Select PDF document to edit"
              subtitle="Exact in-place typing matching iLovePDF"
            />

            <div className="mt-5 text-start border-top pt-4 text-muted">
              <h3 className="h6 fw-bold text-dark mb-2">How to Edit Existing PDF Text Directly:</h3>
              <ol className="small ps-3 mb-4">
                <li className="mb-1">Upload your PDF by clicking the selector above or the <strong>Open File</strong> button.</li>
                <li className="mb-1">Click directly on any paragraph block across your document pages.</li>
                <li className="mb-1">Type your text replacements and adjust font family, font size, alignment, or color in the right sidebar.</li>
                <li>Click <strong>Save changes</strong> to compile your updated document with precision-matched text bounding boxes.</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="d-flex flex-grow-1 overflow-hidden">
            {/* Left Thumbnails */}
            <aside className="border-end bg-light d-flex flex-column align-items-center py-3 overflow-auto flex-shrink-0" style={{ width: '130px' }}>
              <span className="small text-muted fw-bold mb-2">{numPages} Pages</span>
              <div className="d-flex flex-column gap-3 w-100 px-2">
                {thumbnails.map((thumbUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => { setCurrentPage(idx + 1); setSelectedBlockId(null); }}
                    className={`card text-center p-1 rounded-2 ${currentPage === idx + 1 ? 'border-primary shadow-sm' : 'border-light'}`}
                    style={{ cursor: 'pointer', borderWidth: currentPage === idx + 1 ? '2px' : '1px' }}
                  >
                    <img src={thumbUrl} alt={`Page ${idx + 1}`} className="img-fluid rounded" />
                    <span className="text-muted mt-1 fw-semibold" style={{ fontSize: '11px' }}>{idx + 1}</span>
                  </div>
                ))}
              </div>
            </aside>

            {/* Central Canvas Viewport */}
            <main className="flex-grow-1 bg-secondary bg-opacity-10 d-flex flex-column align-items-center position-relative overflow-auto p-4">
              <div className="position-sticky top-0 z-3 mb-3 bg-white border px-3 py-1 rounded-pill shadow-sm d-flex align-items-center gap-3">
                <button type="button" className="btn btn-sm btn-link text-dark p-0" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>
                  <i className="bi bi-chevron-left"></i>
                </button>
                <span className="small fw-semibold">{currentPage} / {numPages}</span>
                <button type="button" className="btn btn-sm btn-link text-dark p-0" disabled={currentPage >= numPages} onClick={() => setCurrentPage((p) => p + 1)}>
                  <i className="bi bi-chevron-right"></i>
                </button>
                <div className="vr"></div>
                <button type="button" className="btn btn-sm btn-link text-dark p-0" onClick={() => setScale((s) => Math.max(0.7, s - 0.15))}><i className="bi bi-dash"></i></button>
                <span className="small text-muted">{Math.round(scale * 100)}%</span>
                <button type="button" className="btn btn-sm btn-link text-dark p-0" onClick={() => setScale((s) => Math.min(2.0, s + 0.15))}><i className="bi bi-plus"></i></button>
              </div>

              <div className="position-relative bg-white shadow rounded-1 mb-5" style={{ display: 'inline-block', height: 'fit-content' }}>
                <canvas ref={canvasRef} style={{ display: 'block' }} />

                {/* Exact In-Place Paragraph Overlay */}
                <div className="position-absolute top-0 start-0 w-100 h-100">
                  {currentBlocks.map((block) => {
                    const isSelected = selectedBlockId === block.id;

                    return (
                      <div
                        key={block.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectBlock(block);
                        }}
                        style={{
                          position: 'absolute',
                          left: `${block.screen.x}px`,
                          top: `${block.screen.y}px`,
                          width: isSelected ? 'auto' : `${block.screen.w}px`,
                          minWidth: `${block.screen.w}px`,
                          minHeight: `${block.screen.h}px`,
                          zIndex: isSelected ? 20 : 2,
                          cursor: 'text',
                          border: isSelected ? '2px solid #2563EB' : '1px solid transparent',
                          backgroundColor: isSelected ? '#FFFFFF' : 'transparent',
                          padding: '1px 3px'
                        }}
                      >
                        {isSelected && (
                          <>
                            <div className="position-absolute bg-primary border border-white" style={{ width: '7px', height: '7px', top: '-4px', left: '-4px' }}></div>
                            <div className="position-absolute bg-primary border border-white" style={{ width: '7px', height: '7px', top: '-4px', right: '-4px' }}></div>
                            <div className="position-absolute bg-primary border border-white" style={{ width: '7px', height: '7px', bottom: '-4px', left: '-4px' }}></div>
                            <div className="position-absolute bg-primary border border-white" style={{ width: '7px', height: '7px', bottom: '-4px', right: '-4px' }}></div>
                            <div className="position-absolute bg-white border shadow-sm rounded-pill d-flex align-items-center px-2 py-0 gap-2" style={{ bottom: '-26px', left: '0', fontSize: '11px', whiteSpace: 'nowrap' }}>
                              <span className="text-muted fw-semibold">Paragraph</span>
                              <i className="bi bi-arrows-move text-muted"></i>
                            </div>
                          </>
                        )}

                        <div
                          contentEditable
                          suppressContentEditableWarning
                          onFocus={() => handleSelectBlock(block)}
                          onBlur={(e) => handleTextChange(block.id, e.currentTarget.innerText)}
                          style={{
                            outline: 'none',
                            fontSize: `${block.fontSize}px`,
                            lineHeight: 1.35,
                            fontFamily: block.fontFamily === 'Tinos' ? '"Tinos", "Times New Roman", serif' : '"Arimo", "Arial", sans-serif',
                            fontWeight: block.bold ? '700' : '400',
                            fontStyle: block.italic ? 'italic' : 'normal',
                            textDecoration: block.underline ? 'underline' : 'none',
                            textAlign: block.align || 'left',
                            color: block.color || '#111827',
                            whiteSpace: 'pre-wrap'
                          }}
                        >
                          {block.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </main>

            {/* 3. RIGHT SIDEBAR */}
            <aside className="border-start bg-white d-flex flex-column justify-content-between p-4 flex-shrink-0" style={{ width: '310px' }}>
              <div className="d-flex flex-column gap-4">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="fw-bold mb-0 text-dark">Text Styles</h6>
                  <button type="button" className="btn btn-sm btn-link text-muted p-0" onClick={() => setSelectedBlockId(null)}>
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>

                {/* Font Family & Size */}
                <div className="d-flex gap-2">
                  <select
                    className="form-select form-select-sm fw-semibold"
                    style={{ width: '65%' }}
                    value={textStyles.fontFamily}
                    onChange={(e) => updateStyle({ fontFamily: e.target.value })}
                  >
                    <option value="Arimo">Arimo (Arial)</option>
                    <option value="Tinos">Tinos (Times)</option>
                  </select>

                  <select
                    className="form-select form-select-sm fw-semibold"
                    style={{ width: '35%' }}
                    value={textStyles.fontSize}
                    onChange={(e) => updateStyle({ fontSize: Number(e.target.value) })}
                  >
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="9.5">9.5</option>
                    <option value="10">10</option>
                    <option value="11">11</option>
                    <option value="12">12</option>
                    <option value="14">14</option>
                    <option value="18">18</option>
                  </select>
                </div>

                {/* B / I / U */}
                <div className="d-flex justify-content-between border rounded p-1">
                  <button
                    type="button"
                    className={`btn btn-sm border-0 flex-grow-1 ${textStyles.bold ? 'bg-light fw-bold text-dark' : 'text-muted'}`}
                    onClick={() => updateStyle({ bold: !textStyles.bold })}
                  >
                    <i className="bi bi-type-bold fs-6"></i>
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm border-0 flex-grow-1 ${textStyles.italic ? 'bg-light text-dark' : 'text-muted'}`}
                    onClick={() => updateStyle({ italic: !textStyles.italic })}
                  >
                    <i className="bi bi-type-italic fs-6"></i>
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm border-0 flex-grow-1 ${textStyles.underline ? 'bg-light text-dark' : 'text-muted'}`}
                    onClick={() => updateStyle({ underline: !textStyles.underline })}
                  >
                    <i className="bi bi-type-underline fs-6"></i>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm border-0 flex-grow-1 text-muted"
                    onClick={() => updateStyle({ text: '' })}
                  >
                    <i className="bi bi-eraser fs-6"></i>
                  </button>
                </div>

                {/* Alignment */}
                <div className="d-flex justify-content-between border rounded p-1">
                  <button type="button" className={`btn btn-sm border-0 flex-grow-1 ${textStyles.align === 'left' ? 'bg-light text-dark' : 'text-muted'}`} onClick={() => updateStyle({ align: 'left' })}>
                    <i className="bi bi-text-left fs-6"></i>
                  </button>
                  <button type="button" className={`btn btn-sm border-0 flex-grow-1 ${textStyles.align === 'center' ? 'bg-light text-dark' : 'text-muted'}`} onClick={() => updateStyle({ align: 'center' })}>
                    <i className="bi bi-text-center fs-6"></i>
                  </button>
                  <button type="button" className={`btn btn-sm border-0 flex-grow-1 ${textStyles.align === 'right' ? 'bg-light text-dark' : 'text-muted'}`} onClick={() => updateStyle({ align: 'right' })}>
                    <i className="bi bi-text-right fs-6"></i>
                  </button>
                  <button type="button" className={`btn btn-sm border-0 flex-grow-1 ${textStyles.align === 'justify' ? 'bg-light text-dark' : 'text-muted'}`} onClick={() => updateStyle({ align: 'justify' })}>
                    <i className="bi bi-justify fs-6"></i>
                  </button>
                </div>

                {/* Colors */}
                <div>
                  <label className="form-label small text-muted fw-bold text-uppercase mb-2">Current Color</label>
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <div style={{ width: '28px', height: '28px', backgroundColor: textStyles.color, borderRadius: '50%', border: '2px solid #E2E8F0' }} />
                    <input type="color" className="form-control form-control-color border-0 p-0" value={textStyles.color} onChange={(e) => updateStyle({ color: e.target.value })} />
                  </div>

                  <label className="form-label small text-muted fw-bold text-uppercase mb-2">Custom Colors</label>
                  <div className="d-flex flex-wrap gap-2">
                    {COLOR_PRESETS.map((col) => (
                      <div
                        key={col}
                        onClick={() => updateStyle({ color: col })}
                        style={{
                          width: '22px',
                          height: '22px',
                          backgroundColor: col,
                          borderRadius: '50%',
                          cursor: 'pointer',
                          border: textStyles.color === col ? '2px solid #DC2626' : '1px solid #CBD5E1'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Save changes */}
              <div className="pt-3 border-top mt-4">
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={isProcessing}
                  className="btn btn-danger w-100 py-2 fw-bold rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2"
                  style={{ backgroundColor: '#DC2626', borderColor: '#DC2626', fontSize: '15px' }}
                >
                  {isProcessing ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      Saving changes...
                    </>
                  ) : (
                    <>
                      Save changes <i className="bi bi-chevron-right"></i>
                    </>
                  )}
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* 4. SUCCESS MODAL */}
        {showSuccessModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '460px' }}>
              <div className="modal-content border-0 rounded-4 shadow-lg p-4 text-center">
                <button type="button" className="btn-close position-absolute top-0 end-0 m-3" onClick={() => setShowSuccessModal(false)}></button>
                <h4 className="fw-bold mb-4 mt-2">This task has been processed successfully.</h4>

                <a
                  href={downloadBlobUrl}
                  download={`pdfMan_edited_${file ? file.name : 'document.pdf'}`}
                  className="btn btn-danger btn-lg w-100 py-3 fw-bold rounded-3 shadow mb-4 d-flex align-items-center justify-content-center gap-2"
                  style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}
                >
                  <i className="bi bi-arrow-down-circle-fill fs-5"></i> Download PDF
                </a>

                <div className="text-start">
                  <span className="small text-muted fw-bold d-block mb-2">Continue to...</span>
                  <div className="row g-2 mb-4">
                    <div className="col-4">
                      <Link
                        to="/compress-pdf"
                        className="btn btn-light w-100 py-2 border rounded-3 text-center d-flex flex-column align-items-center gap-1 text-decoration-none"
                      >
                        <i className="bi bi-file-earmark-zip text-danger fs-5"></i>
                        <span style={{ fontSize: '11px' }} className="fw-semibold text-dark">Compress PDF</span>
                      </Link>
                    </div>
                    <div className="col-4">
                      <Link
                        to="/merge-pdf"
                        className="btn btn-light w-100 py-2 border rounded-3 text-center d-flex flex-column align-items-center gap-1 text-decoration-none"
                      >
                        <i className="bi bi-files text-danger fs-5"></i>
                        <span style={{ fontSize: '11px' }} className="fw-semibold text-dark">Merge PDF</span>
                      </Link>
                    </div>
                    <div className="col-4">
                      <Link
                        to="/split-pdf"
                        className="btn btn-light w-100 py-2 border rounded-3 text-center d-flex flex-column align-items-center gap-1 text-decoration-none"
                      >
                        <i className="bi bi-layout-split text-danger fs-5"></i>
                        <span style={{ fontSize: '11px' }} className="fw-semibold text-dark">Split PDF</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}