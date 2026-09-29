const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

function getLibreOfficeExe() {
  const winPaths = [
    'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
    'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe'
  ];

  for (const winPath of winPaths) {
    if (fs.existsSync(winPath)) return `"${winPath}"`;
  }
  return 'soffice';
}

function convertOfficeToPdf(inputPath, outDir) {
  return new Promise((resolve, reject) => {
    const soffice = getLibreOfficeExe();
    const safeInput = path.resolve(inputPath);
    const safeOutDir = path.resolve(outDir);

    const cmd = `${soffice} --headless --convert-to pdf --outdir "${safeOutDir}" "${safeInput}"`;
    console.log('Running Office Conversion:', cmd);

    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error('LibreOffice Execution Error:', stderr || error.message);
        return reject(stderr || error.message);
      }

      const parsed = path.parse(safeInput);
      const generatedPdf = path.join(safeOutDir, `${parsed.name}.pdf`);
      resolve(generatedPdf);
    });
  });
}

module.exports = { convertOfficeToPdf };