require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pdfRoutes = require('./routes/pdfRoutes');
const initCleanupCron = require('./middlewares/cronCleanup');

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

// Routes
app.use('/api/pdf', pdfRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'PDFMan API running smoothly' }));

// Start cleaner cron job
initCleanupCron();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 PDFMan Backend active at http://localhost:${PORT}`);
});