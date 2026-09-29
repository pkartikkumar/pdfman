const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Checks which Ghostscript command is available
 */
function getGhostscriptCommand() {
  return new Promise((resolve) => {
    // Check standard Windows executable first
    exec('gswin64c -version', (err) => {
      if (!err) return resolve('gswin64c');
      // Fallback to gs (Linux / Mac / aliased Windows)
      exec('gs -version', (err2) => {
        if (!err2) return resolve('gs');
        resolve(null);
      });
    });
  });
}

function compressWithGhostscript(inputPath, outputPath, quality = 'ebook') {
  return new Promise(async (resolve, reject) => {
    const gsExecutable = await getGhostscriptCommand();

    if (!gsExecutable) {
      return reject(
        new Error(
          'Ghostscript is not installed or not added to System PATH. Run "winget install ArtifexSoftware.Ghostscript" and restart.'
        )
      );
    }

    // Windows paths require clean backslash/quote wrapping
    const safeInput = path.resolve(inputPath);
    const safeOutput = path.resolve(outputPath);

    const cmd = `"${gsExecutable}" -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/${quality} -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${safeOutput}" "${safeInput}"`;

    console.log('Running GS Command:', cmd);

    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error('Ghostscript Error Output:', stderr || error.message);
        return reject(stderr || error.message);
      }
      resolve(safeOutput);
    });
  });
}

module.exports = { compressWithGhostscript };