import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import MergePdfPage from './pages/MergePdfPage';
import CompressPdfPage from './pages/CompressPdfPage';
import JpgToPdfPage from './pages/JpgToPdfPage';
import GenericConvertPage from './pages/GenericConvertPage';
import SplitPdfPage from './pages/SplitPdfPage';
import PngMakerPage from './pages/PngMakerPage';
import OcrPdfPage from './pages/OcrPdfPage';
import EditPdfPage from './pages/EditPdfPage';
import PdfToImgPage from './pages/PdfToImgPage';
import CompressImagePage from './pages/CompressImagePage';
import WatermarkPdfPage from './pages/WatermarkPdfPage';
import ProtectPdfPage from './pages/ProtectPdfPage';
import UnlockPdfPage from './pages/UnlockPdfPage';
import HtmlToPdfPage from './pages/HtmlToPdfPage';
import FooterWrapper from './components/FooterWrapper';
import { HelmetProvider } from 'react-helmet-async';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="d-flex flex-column min-vh-100">
          <Navbar />
          <main className="flex-grow-1 d-flex flex-column justify-content-center">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/merge-pdf" element={<MergePdfPage />} />
            <Route path="/compress-pdf" element={<CompressPdfPage />} />
            <Route path="/jpg-to-pdf" element={<JpgToPdfPage />} />
            <Route path="/split-pdf" element={<SplitPdfPage />} />
            <Route path="/ocr-pdf" element={<OcrPdfPage />} />
            <Route path="/edit-pdf" element={<EditPdfPage />} />
            <Route path="/compress-image" element={<CompressImagePage />} />
            <Route path="/png-maker" element={<PngMakerPage />} />
            <Route path="/add-watermark" element={<WatermarkPdfPage />} />
            <Route path="/pdf-to-jpg" element={<PdfToImgPage />} />
            <Route path="/protect-pdf" element={<ProtectPdfPage />} />
            <Route path="/unlock-pdf" element={<UnlockPdfPage />} />
            <Route path="/html-to-pdf" element={<HtmlToPdfPage />} />

            <Route path="/convert/ppt-to-pdf" element={<Navigate to="/convert/powerpoint-to-pdf" replace />} />
            <Route path="/convert/pdf-to-ppt" element={<Navigate to="/convert/pdf-to-powerpoint" replace />} />
            <Route path="/convert/:action" element={<GenericConvertPage />} />
          </Routes>
        </main>
        {/* Dynamic Footer: Displays Tools mini-bar on tool pages, full footer on Home */}
        <FooterWrapper />
      </div>
    </BrowserRouter>
    </HelmetProvider>
  );
}