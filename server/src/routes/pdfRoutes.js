const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const pdfController = require('../controllers/pdfController');

router.post('/compress', upload.single('file'), pdfController.compressPdf);
router.post('/office-to-pdf', upload.single('file'), pdfController.officeToPdf);
router.post('/pdf-to-word', upload.single('file'), pdfController.pdfToWord);
router.post('/pdf-to-ppt', upload.single('file'), pdfController.pdfToPpt); // <-- ADD THIS
router.post('/pdf-to-excel', upload.single('file'), pdfController.pdfToExcel);
router.post('/remove-bg', upload.single('file'), pdfController.removeBg);
router.post('/ocr-pdf', upload.single('file'), pdfController.ocrPdf);
router.post('/pdf-to-editable', upload.single('file'), pdfController.pdfToEditable);
router.post('/html-to-pdf', upload.single('file'), pdfController.convertHtmlToPdf);
router.post('/apply-pdf-edits', upload.single('file'), pdfController.applyPdfEdits);
router.post('/compress-image', upload.single('file'), pdfController.compressImage);
router.post('/add-watermark', upload.fields([ { name: 'file', maxCount: 1 }, { name: 'watermarkImage', maxCount: 1 } ]), pdfController.addWatermark);
router.post('/pdf-to-img', upload.single('file'), pdfController.pdfToImg);
router.post('/protect-pdf', upload.single('file'), pdfController.protectPdf);
router.post('/unlock-pdf', upload.single('file'), pdfController.unlockPdf);
// Correct Route definition in server/src/routes/pdfRoutes.js:
router.post('/html-to-pdf', upload.single('file'), pdfController.convertHtmlToPdf);

module.exports = router;