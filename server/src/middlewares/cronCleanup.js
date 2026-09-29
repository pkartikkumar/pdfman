const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

function cleanFolder(folderPath) {
  fs.readdir(folderPath, (err, files) => {
    if (err) return;
    const now = Date.now();
    files.forEach((file) => {
      const filePath = path.join(folderPath, file);
      fs.stat(filePath, (err, stats) => {
        if (!err && now - stats.mtimeMs > 20 * 60 * 1000) {
          fs.unlink(filePath, () => {});
        }
      });
    });
  });
}

function initCleanupCron() {
  cron.schedule('*/10 * * * *', () => {
    cleanFolder(path.join(__dirname, '../../uploads'));
    cleanFolder(path.join(__dirname, '../../outputs'));
  });
}

module.exports = initCleanupCron;