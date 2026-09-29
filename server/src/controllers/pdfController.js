const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { PDFDocument, rgb, degrees, StandardFonts } = require('pdf-lib');
const { compressWithGhostscript } = require('../services/ghostscriptService');
const { convertOfficeToPdf } = require('../services/officeService');

// 1. Compress PDF using Python
exports.compressPdf = (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const quality = req.body.quality || 'ebook';
  const originalBaseName = path.parse(req.file.originalname).name;
  const outputDir = path.resolve(__dirname, '../../outputs');
  const outputPath = path.join(outputDir, `compressed-${Date.now()}-${req.file.filename}`);
  const inputPdf = path.resolve(req.file.path);
  const scriptPath = path.resolve(__dirname, '../scripts/compress_pdf.py');

  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
  const cmd = `"${pythonCmd}" "${scriptPath}" "${inputPdf}" "${outputPath}" "${quality}"`;

  console.log('Running Python Compress:', cmd);

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error('Python Compression error:', stderr || err.message);
      return res.status(500).json({ error: stderr || err.message });
    }

    res.download(outputPath, `PDFMan_compressed_${originalBaseName}.pdf`, (downloadErr) => {
      if (downloadErr) console.error('Download Error:', downloadErr);
    });
  });
};

// 2. Office (Word, Excel, PPT) to PDF (Headless LibreOffice)
exports.officeToPdf = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const outputDir = path.resolve(__dirname, '../../outputs');
    const originalBaseName = path.parse(req.file.originalname).name;

    const resultPdf = await convertOfficeToPdf(req.file.path, outputDir);

    res.download(resultPdf, `PDFMan_${originalBaseName}.pdf`, (downloadErr) => {
      if (downloadErr) console.error('Download error:', downloadErr);
    });
  } catch (error) {
    console.error('Office to PDF Controller Error:', error);
    res.status(500).json({ error: error.toString() });
  }
};

// 3. PDF to Word (Python pdf2docx)
exports.pdfToWord = (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const originalBaseName = path.parse(req.file.originalname).name;
  const outputDocx = path.resolve(__dirname, `../../outputs/converted-${Date.now()}.docx`);
  const inputPdf = path.resolve(req.file.path);
  const scriptPath = path.resolve(__dirname, '../scripts/pdf_to_word.py');

  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
  const cmd = `"${pythonCmd}" "${scriptPath}" "${inputPdf}" "${outputDocx}"`;

  console.log('Running PDF-to-Word command:', cmd);

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error('Python conversion error:', stderr || err.message);
      return res.status(500).json({ error: stderr || err.message });
    }

    res.download(outputDocx, `PDFMan_${originalBaseName}.docx`, (downloadErr) => {
      if (downloadErr) console.error('File download error:', downloadErr);
    });
  });
};

// 4. PDF to PowerPoint (PPTX)
exports.pdfToPpt = (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const originalBaseName = path.parse(req.file.originalname).name;
  const outputPptx = path.resolve(__dirname, `../../outputs/presentation-${Date.now()}.pptx`);
  const inputPdf = path.resolve(req.file.path);
  const scriptPath = path.resolve(__dirname, '../scripts/pdf_to_pptx.py');

  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
  const cmd = `"${pythonCmd}" "${scriptPath}" "${inputPdf}" "${outputPptx}"`;

  console.log('Running PDF-to-PPTX command:', cmd);

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error('PDF to PPTX error:', stderr || err.message);
      return res.status(500).json({ error: stderr || err.message });
    }

    res.download(outputPptx, `PDFMan_${originalBaseName}.pptx`, (downloadErr) => {
      if (downloadErr) console.error('Download error:', downloadErr);
    });
  });
};

// 5. PDF to Excel (.xlsx)
exports.pdfToExcel = (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const originalBaseName = path.parse(req.file.originalname).name;
  const outputExcel = path.resolve(__dirname, `../../outputs/spreadsheet-${Date.now()}.xlsx`);
  const inputPdf = path.resolve(req.file.path);
  const scriptPath = path.resolve(__dirname, '../scripts/pdf_to_excel.py');

  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
  const cmd = `"${pythonCmd}" "${scriptPath}" "${inputPdf}" "${outputExcel}"`;

  console.log('Running PDF-to-Excel command:', cmd);

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error('PDF to Excel error:', stderr || err.message);
      return res.status(500).json({ error: stderr || err.message });
    }

    res.download(outputExcel, `PDFMan_${originalBaseName}.xlsx`, (downloadErr) => {
      if (downloadErr) console.error('Download error:', downloadErr);
    });
  });
};

// 6. AI Background Removal / Picsart-style PNG Maker
exports.removeBg = (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

  const originalBaseName = path.parse(req.file.originalname).name;
  const outputPng = path.resolve(__dirname, `../../outputs/transparent-${Date.now()}.png`);
  const inputImg = path.resolve(req.file.path);
  const scriptPath = path.resolve(__dirname, '../scripts/remove_bg.py');

  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
  const cmd = `"${pythonCmd}" "${scriptPath}" "${inputImg}" "${outputPng}"`;

  console.log('Running AI BG Removal:', cmd);

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error('BG Removal error:', stderr || err.message);
      return res.status(500).json({ error: stderr || err.message });
    }

    res.download(outputPng, `PDFMan_${originalBaseName}_transparent.png`, (downloadErr) => {
      if (downloadErr) console.error('Download error:', downloadErr);
    });
  });
};

// 7. Make Scanned Document Searchable (OCR)
exports.ocrPdf = (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const originalBaseName = path.parse(req.file.originalname).name;
  const outputPdf = path.resolve(__dirname, `../../outputs/ocr-${Date.now()}.pdf`);
  const inputDoc = path.resolve(req.file.path);
  const scriptPath = path.resolve(__dirname, '../scripts/ocr_processor.py');

  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
  const cmd = `"${pythonCmd}" "${scriptPath}" "${inputDoc}" "${outputPdf}"`;

  console.log('Running EasyOCR job:', cmd);

  exec(
    cmd,
    {
      maxBuffer: 1024 * 1024 * 50, // 50MB buffer
      timeout: 300000,             // 5 minutes timeout for CPU OCR
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1', PYTHONWARNINGS: 'ignore' }
    },
    (err, stdout, stderr) => {
      if (err && !fs.existsSync(outputPdf)) {
        console.error('OCR Error:', stderr || err.message);
        return res.status(500).json({ error: 'OCR processing failed. ' + (stderr || err.message) });
      }

      res.download(outputPdf, `pdfMan_${originalBaseName}_searchable.pdf`, (downloadErr) => {
        if (downloadErr) console.error('Download error:', downloadErr);
      });
    }
  );
};

// 8. Convert PDF into Word-Style Editable HTML
exports.pdfToEditable = (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const originalBaseName = path.parse(req.file.originalname).name;
  const outputHtml = path.resolve(__dirname, `../../outputs/doc-${Date.now()}.html`);
  const inputPdf = path.resolve(req.file.path);
  const scriptPath = path.resolve(__dirname, '../scripts/pdf_to_html.py');

  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
  const cmd = `"${pythonCmd}" "${scriptPath}" "${inputPdf}" "${outputHtml}"`;

  console.log('Extracting editable structure from PDF:', cmd);

  exec(
    cmd,
    {
      maxBuffer: 1024 * 1024 * 20,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' }
    },
    (err, stdout, stderr) => {
      if (err || !fs.existsSync(outputHtml)) {
        console.error('PDF to HTML error:', stderr || err?.message);
        return res.status(500).json({ error: 'Failed to extract editable text from PDF.' });
      }

      fs.readFile(outputHtml, 'utf8', (readErr, content) => {
        if (readErr) return res.status(500).json({ error: 'Failed to read extracted content.' });
        res.json({ html: content, originalName: req.file.originalname });
      });
    }
  );
};

// 9. Recompile Edited HTML Document back to Downloadable PDF
exports.htmlToPdf = (req, res) => {
  const body = req.body || {};
  const html = body.html;
  const originalName = body.originalName;

  if (!html) return res.status(400).json({ error: 'Empty document content.' });

  const timestamp = Date.now();
  const outputDir = path.resolve(__dirname, '../../outputs');
  const tempHtmlPath = path.join(outputDir, `edit-${timestamp}.html`);
  const expectedPdfPath = path.join(outputDir, `edit-${timestamp}.pdf`);
  const baseName = path.parse(originalName || 'document').name;

  const fullHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      @page { size: A4; margin: 20mm; }
      body {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 11pt;
        line-height: 1.5;
        color: #111827;
      }
      p { margin-bottom: 0.85em; }
      h1, h2, h3, h4 { color: #0f172a; margin-top: 1em; margin-bottom: 0.5em; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 1em; }
      th, td { border: 1px solid #cbd5e1; padding: 6px 10px; }
      img { max-width: 100%; height: auto; }
    </style>
  </head>
  <body>${html}</body>
</html>`;

  fs.writeFileSync(tempHtmlPath, fullHtml, 'utf8');

  const cmd = `soffice --headless --convert-to pdf "${tempHtmlPath}" --outdir "${outputDir}"`;
  console.log('Recompiling edited document to PDF:', cmd);

  exec(cmd, (err, stdout, stderr) => {
    if (!fs.existsSync(expectedPdfPath)) {
      console.error('HTML to PDF compile error:', stderr || err?.message);
      return res.status(500).json({ error: 'PDF generation failed.' });
    }

    res.download(expectedPdfPath, `pdfMan_${baseName}_edited.pdf`, (downloadErr) => {
      if (downloadErr) console.error('Download error:', downloadErr);
    });
  });
};

// 10. Perfect In-Place PDF Editor
exports.applyPdfEdits = (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded.' });

  const editsRaw = req.body.edits;
  if (!editsRaw) return res.status(400).json({ error: 'No edit instructions provided.' });

  const originalBaseName = path.parse(req.file.originalname).name;
  const timestamp = Date.now();
  const inputPdf = path.resolve(req.file.path);
  const outputPdf = path.resolve(__dirname, `../../outputs/edited-${timestamp}.pdf`);
  const editsJsonPath = path.resolve(__dirname, `../../outputs/edits-${timestamp}.json`);
  const scriptPath = path.resolve(__dirname, '../scripts/edit_pdf_processor.py');

  fs.writeFileSync(editsJsonPath, editsRaw, 'utf8');

  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
  const cmd = `"${pythonCmd}" "${scriptPath}" "${inputPdf}" "${outputPdf}" "${editsJsonPath}"`;

  console.log('Running Perfect In-Place Edit:', cmd);

  exec(
    cmd,
    {
      maxBuffer: 1024 * 1024 * 20,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1', PYTHONWARNINGS: 'ignore' }
    },
    (err, stdout, stderr) => {
      // Clean up temp json
      if (fs.existsSync(editsJsonPath)) fs.unlinkSync(editsJsonPath);

      if (err || !fs.existsSync(outputPdf)) {
        console.error('PDF Edit Processing Error:', stderr || err?.message);
        return res.status(500).json({ error: 'Failed to apply edits to PDF.' });
      }

      res.download(outputPdf, `pdfMan_edited_${originalBaseName}.pdf`, (downloadErr) => {
        if (downloadErr) console.error('Download error:', downloadErr);
      });
    }
  );
};

// 11. Universal Image Compressor (JPEG, PNG, WebP, AVIF, HEIC, TIFF, BMP)
exports.compressImage = (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded.' });

  const level = req.body.level || 'recommended';
  const convertTo = req.body.convertTo || 'original'; // 'original' | 'webp' | 'jpeg' | 'png'

  const originalParsed = path.parse(req.file.originalname);
  let targetExt = originalParsed.ext.toLowerCase();

  if (convertTo !== 'original') {
    targetExt = `.${convertTo.toLowerCase()}`;
  }

  const outputDir = path.resolve(__dirname, '../../outputs');
  const outputPath = path.join(outputDir, `compressed-${Date.now()}-${originalParsed.name}${targetExt}`);
  const inputImg = path.resolve(req.file.path);
  const scriptPath = path.resolve(__dirname, '../scripts/compress_image.py');

  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
  const cmd = `"${pythonCmd}" "${scriptPath}" "${inputImg}" "${outputPath}" "${level}" "${convertTo}"`;

  console.log('Running Universal Image Compression:', cmd);

  exec(
    cmd,
    {
      maxBuffer: 1024 * 1024 * 20,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1', PYTHONWARNINGS: 'ignore' }
    },
    (err, stdout, stderr) => {
      if (err || !fs.existsSync(outputPath)) {
        console.error('Image compression error:', stderr || err?.message);
        return res.status(500).json({ error: 'Image compression failed.' });
      }

      const origSize = fs.statSync(inputImg).size;
      const newSize = fs.statSync(outputPath).size;
      const savings = Math.max(0, Math.round(((origSize - newSize) / origSize) * 100));

      res.setHeader('X-Original-Size', origSize);
      res.setHeader('X-Compressed-Size', newSize);
      res.setHeader('X-Savings-Percent', savings);
      res.setHeader('Access-Control-Expose-Headers', 'X-Original-Size, X-Compressed-Size, X-Savings-Percent');

      res.download(outputPath, `pdfMan_compressed_${originalParsed.name}${targetExt}`, (downloadErr) => {
        if (downloadErr) console.error('Download error:', downloadErr);
      });
    }
  );
};


// 12. Add Watermark to PDF (pdf-lib based)
exports.addWatermark = async (req, res) => {
  try {
    const pdfFile = req.files && req.files['file'] ? req.files['file'][0] : req.file;
    if (!pdfFile) return res.status(400).json({ error: 'No PDF file uploaded.' });

    const watermarkImgFile = req.files && req.files['watermarkImage'] ? req.files['watermarkImage'][0] : null;
    const paramsRaw = req.body.params;
    if (!paramsRaw) return res.status(400).json({ error: 'No watermark configuration provided.' });

    const p = JSON.parse(paramsRaw);
    const originalBaseName = path.parse(pdfFile.originalname).name;
    const outputDir = path.resolve(__dirname, '../../outputs');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    
    const outputPath = path.join(outputDir, `watermarked-${Date.now()}.pdf`);

    // Load PDF
    const pdfBytes = fs.readFileSync(pdfFile.path);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Font selection
    let standardFont = StandardFonts.Helvetica;
    if (p.fontFamily && p.fontFamily.includes('times')) standardFont = StandardFonts.TimesRoman;
    if (p.fontFamily && p.fontFamily.includes('couri')) standardFont = StandardFonts.Courier;
    if (p.bold && standardFont === StandardFonts.Helvetica) standardFont = StandardFonts.HelveticaBold;
    const font = await pdfDoc.embedFont(standardFont);

    // Parse Color (Hex to 0.0 - 1.0 RGB)
    const cleanHex = (p.color || '#E11D48').replace('#', '');
    const num = parseInt(cleanHex, 16);
    const colorRgb = rgb(
      ((num >> 16) & 255) / 255,
      ((num >> 8) & 255) / 255,
      (num & 255) / 255
    );

    const opacity = typeof p.opacity === 'number' ? p.opacity : 0.5;
    const rotation = typeof p.rotation === 'number' ? p.rotation : 45;
    const fontSize = typeof p.fontSize === 'number' ? p.fontSize : 32;
    const wmText = p.text || 'PDFMAN';

    // Embed Image Watermark if selected
    let embeddedImg = null;
    if (p.type === 'image' && watermarkImgFile && fs.existsSync(watermarkImgFile.path)) {
      const imgBytes = fs.readFileSync(watermarkImgFile.path);
      const isPng = watermarkImgFile.mimetype && watermarkImgFile.mimetype.includes('png');
      embeddedImg = isPng ? await pdfDoc.embedPng(imgBytes) : await pdfDoc.embedJpg(imgBytes);
    }

    const pages = pdfDoc.getPages();
    const fromPage = Math.max(1, parseInt(p.fromPage || 1)) - 1;
    const toPage = Math.min(pages.length, parseInt(p.toPage || pages.length)) - 1;

    for (let i = fromPage; i <= toPage; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();

      const points = [];
      if (p.mosaic) {
        for (const yRatio of [0.25, 0.5, 0.75]) {
          for (const xRatio of [0.22, 0.5, 0.78]) {
            points.push({ x: width * xRatio, y: height * yRatio });
          }
        }
      } else {
        const pos = parseInt(p.position || 5);
        const xRatio = [1, 4, 7].includes(pos) ? 0.2 : [2, 5, 8].includes(pos) ? 0.5 : 0.8;
        const yRatio = [1, 2, 3].includes(pos) ? 0.8 : [4, 5, 6].includes(pos) ? 0.5 : 0.2;
        points.push({ x: width * xRatio, y: height * yRatio });
      }

      for (const pt of points) {
        if (p.type === 'text') {
          const textWidth = font.widthOfTextAtSize(wmText, fontSize);
          const textHeight = font.heightAtSize(fontSize);

          page.drawText(wmText, {
            x: pt.x - (textWidth / 2) * Math.cos((rotation * Math.PI) / 180),
            y: pt.y - (textHeight / 2) * Math.sin((rotation * Math.PI) / 180),
            size: fontSize,
            font,
            color: colorRgb,
            opacity: opacity,
            rotate: degrees(rotation)
          });
        } else if (embeddedImg) {
          const imgW = p.imageWidth || 120;
          const imgH = p.imageHeight || 80;

          page.drawImage(embeddedImg, {
            x: pt.x - imgW / 2,
            y: pt.y - imgH / 2,
            width: imgW,
            height: imgH,
            opacity: opacity,
            rotate: degrees(rotation)
          });
        }
      }
    }

    const modifiedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, modifiedPdfBytes);

    res.download(outputPath, `pdfMan_${originalBaseName}_watermarked.pdf`, (err) => {
      if (err) console.error('Download error:', err);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    });
  } catch (err) {
    console.error('Watermark execution error:', err);
    res.status(500).json({ error: err.message || 'Watermarking failed.' });
  }
};


// 13. PDF to Image (JPG / PNG or ZIP for multi-page)
exports.pdfToImg = (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded.' });

  const format = (req.body.format || 'jpg').toLowerCase();
  const dpi = parseInt(req.body.dpi || 150, 10);
  const originalBaseName = path.parse(req.file.originalname).name;
  const timestamp = Date.now();
  const outputDir = path.resolve(__dirname, '../../outputs');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const inputPdf = path.resolve(req.file.path);
  // Default expected output path (script handles single image or .zip suffix)
  const outputPath = path.join(outputDir, `pdf_img-${timestamp}.${format}`);
  const zipOutputPath = path.join(outputDir, `pdf_img-${timestamp}.${format}.zip`);
  const scriptPath = path.resolve(__dirname, '../scripts/pdf_to_img.py');

  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
  const cmd = `"${pythonCmd}" "${scriptPath}" "${inputPdf}" "${outputPath}" "${format}" ${dpi}`;

  console.log('Running PDF to Image:', cmd);

  exec(
    cmd,
    {
      maxBuffer: 1024 * 1024 * 50,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1', PYTHONWARNINGS: 'ignore' }
    },
    (err, stdout, stderr) => {
      // Check whether a zip was generated (multi-page) or a single image (1-page)
      let finalFile = null;
      let downloadName = '';

      if (fs.existsSync(zipOutputPath)) {
        finalFile = zipOutputPath;
        downloadName = `pdfMan_${originalBaseName}_images.zip`;
      } else if (fs.existsSync(outputPath)) {
        finalFile = outputPath;
        downloadName = `pdfMan_${originalBaseName}.${format}`;
      }

      if (err || !finalFile) {
        console.error('PDF to Image error:', stderr || err?.message);
        return res.status(500).json({ error: stderr || 'Failed to convert PDF to images.' });
      }

      res.download(finalFile, downloadName, (downloadErr) => {
        if (downloadErr) console.error('Download error:', downloadErr);
        // Clean up output file after download completes
        if (fs.existsSync(finalFile)) fs.unlinkSync(finalFile);
      });
    }
  );
};


// 14. Protect PDF (Password Protection / AES-256 Encryption)
exports.protectPdf = (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded.' });

  const password = req.body.password;
  if (!password || password.trim() === '') {
    return res.status(400).json({ error: 'Password is required to protect the PDF.' });
  }

  const originalBaseName = path.parse(req.file.originalname).name;
  const timestamp = Date.now();
  const outputDir = path.resolve(__dirname, '../../outputs');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const inputPdf = path.resolve(req.file.path);
  const outputPath = path.join(outputDir, `protected-${timestamp}.pdf`);
  const scriptPath = path.resolve(__dirname, '../scripts/protect_pdf.py');

  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
  // Enclose arguments in quotes to handle special characters safely
  const cmd = `"${pythonCmd}" "${scriptPath}" "${inputPdf}" "${outputPath}" "${password}"`;

  console.log('Running Protect PDF processor...');

  exec(
    cmd,
    {
      maxBuffer: 1024 * 1024 * 20,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1', PYTHONWARNINGS: 'ignore' }
    },
    (err, stdout, stderr) => {
      if (err || !fs.existsSync(outputPath)) {
        console.error('Protect PDF error:', stderr || err?.message);
        return res.status(500).json({ error: stderr || 'Failed to protect PDF.' });
      }

      res.download(outputPath, `pdfMan_${originalBaseName}_protected.pdf`, (downloadErr) => {
        if (downloadErr) console.error('Download error:', downloadErr);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      });
    }
  );
};

// 15. Unlock PDF (Remove Password & Strip Encryption)
exports.unlockPdf = (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded.' });

  const password = req.body.password || '';
  const originalBaseName = path.parse(req.file.originalname).name;
  const timestamp = Date.now();
  const outputDir = path.resolve(__dirname, '../../outputs');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const inputPdf = path.resolve(req.file.path);
  const outputPath = path.join(outputDir, `unlocked-${timestamp}.pdf`);
  const scriptPath = path.resolve(__dirname, '../scripts/unlock_pdf.py');

  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
  const cmd = `"${pythonCmd}" "${scriptPath}" "${inputPdf}" "${outputPath}" "${password}"`;

  console.log('Running Unlock PDF processor...');

  exec(
    cmd,
    {
      maxBuffer: 1024 * 1024 * 20,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1', PYTHONWARNINGS: 'ignore' }
    },
    (err, stdout, stderr) => {
      if (err) {
        if (stderr && stderr.includes('INVALID_PASSWORD')) {
          return res.status(401).json({ error: 'Incorrect password. Please verify and try again.' });
        }
        console.error('Unlock PDF error:', stderr || err?.message);
        return res.status(500).json({ error: stderr || 'Failed to unlock PDF.' });
      }

      res.download(outputPath, `pdfMan_${originalBaseName}_unlocked.pdf`, (downloadErr) => {
        if (downloadErr) console.error('Download error:', downloadErr);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      });
    }
  );
};


// 16. Convert HTML / Webpage / Code to PDF (High Accuracy via Headless Chromium)
exports.convertHtmlToPdf = async (req, res) => {
  const timestamp = Date.now();
  const outputDir = path.resolve(__dirname, '../../outputs');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const tempHtmlPath = path.join(outputDir, `source-${timestamp}.html`);
  const expectedPdfPath = path.join(outputDir, `source-${timestamp}.pdf`);
  let downloadFileName = `PDFMan_webpage_${timestamp}.pdf`;

  const body = req.body || {};
  let targetUrl = null;
  let rawHtmlContent = null;

  try {
    if (req.file) {
      downloadFileName = `PDFMan_${path.parse(req.file.originalname).name}.pdf`;
      rawHtmlContent = fs.readFileSync(req.file.path, 'utf8');
    } else if (body.html && body.html.trim().length > 0) {
      downloadFileName = `PDFMan_document_${timestamp}.pdf`;
      rawHtmlContent = body.html;
    } else if (body.url && body.url.trim().length > 0) {
      targetUrl = body.url.trim();
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
      }
      try {
        const domain = new URL(targetUrl).hostname.replace('www.', '');
        downloadFileName = `PDFMan_${domain}_${timestamp}.pdf`;
      } catch {
        downloadFileName = `PDFMan_webpage_${timestamp}.pdf`;
      }
    } else {
      return res.status(400).json({ error: 'No HTML file, raw code, or URL provided.' });
    }

    // Try High-Accuracy Headless Chromium (Puppeteer)
    let puppeteerSuccess = false;
    let browser = null;

    try {
      const puppeteer = require('puppeteer');
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--single-process'
        ]
      });

      const page = await browser.newPage();

      // Set desktop user-agent so modern sites don't serve stripped-down bot HTML
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // Configure wide desktop viewport for proper flex/grid layout
      await page.setViewport({ width: 1440, height: 960 });

      if (targetUrl) {
        // Wait until network traffic settles completely
        await page.goto(targetUrl, {
          waitUntil: 'networkidle0',
          timeout: 45000
        });
      } else {
        await page.setContent(rawHtmlContent, {
          waitUntil: 'networkidle0',
          timeout: 30000
        });
      }

      // CRITICAL: Emulate screen CSS instead of print CSS (preserves navbars, cards, and buttons)
      await page.emulateMediaType('screen');

      // Generate visual PDF
      await page.pdf({
        path: expectedPdfPath,
        format: 'A4',
        printBackground: true, // Preserves CSS backgrounds, colors, images
        preferCSSPageSize: false,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm'
        }
      });

      await browser.close();
      browser = null;
      puppeteerSuccess = true;
    } catch (puppeteerErr) {
      if (browser) await browser.close().catch(() => {});
      console.error('Puppeteer conversion failed:', puppeteerErr);
    }

    // Fallback: If Puppeteer cannot run in the environment, use PyMuPDF
    if (!puppeteerSuccess) {
      if (rawHtmlContent) {
        fs.writeFileSync(tempHtmlPath, rawHtmlContent, 'utf8');
      } else if (targetUrl) {
        const webRes = await fetch(targetUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        const html = await webRes.text();
        fs.writeFileSync(tempHtmlPath, html, 'utf8');
      }

      const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
      const fallbackCmd = `"${pythonCmd}" -c "import pymupdf, sys; doc = pymupdf.open(sys.argv[1]); pdf_data = doc.convert_to_pdf(); out_doc = pymupdf.open('pdf', pdf_data); out_doc.save(sys.argv[2]); out_doc.close(); doc.close()" "${tempHtmlPath}" "${expectedPdfPath}"`;

      await new Promise((resolve, reject) => {
        exec(fallbackCmd, (err, stdout, stderr) => {
          if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
          if (err || !fs.existsSync(expectedPdfPath)) return reject(err || new Error(stderr));
          resolve();
        });
      });
    }

    // Deliver PDF Download
    res.download(expectedPdfPath, downloadFileName, (downloadErr) => {
      if (downloadErr) console.error('Download error:', downloadErr);
      if (fs.existsSync(expectedPdfPath)) fs.unlinkSync(expectedPdfPath);
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    });

  } catch (error) {
    if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
    if (fs.existsSync(expectedPdfPath)) fs.unlinkSync(expectedPdfPath);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('HTML to PDF Error:', error);
    res.status(500).json({ error: error.message || 'Failed to render webpage into PDF.' });
  }
};