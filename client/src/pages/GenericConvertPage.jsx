import React, { useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import FileUploader from '../components/FileUploader';

export default function GenericConvertPage() {
  const { action } = useParams();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Complete mapping for all Convert to/from PDF actions
  const configMap = {
    // 1. Word to PDF
    'word-to-pdf': {
      accept: '.doc,.docx',
      endpoint: 'office-to-pdf',
      outExt: 'pdf',
      title: 'Convert Word to PDF',
      subtitle: 'Transform DOC and DOCX files into polished PDF documents.',
      uploadTitle: 'Select Word Document',
      btnText: 'Convert to PDF',
      icon: 'bi-file-earmark-word text-primary'
    },

    // 2. PowerPoint to PDF
    'powerpoint-to-pdf': {
      accept: '.ppt,.pptx',
      endpoint: 'office-to-pdf',
      outExt: 'pdf',
      title: 'Convert PowerPoint to PDF',
      subtitle: 'Turn PPT and PPTX presentation slides into formatted PDF files.',
      uploadTitle: 'Select PowerPoint File',
      btnText: 'Convert to PDF',
      icon: 'bi-file-earmark-slides text-danger'
    },
    'ppt-to-pdf': {
      accept: '.ppt,.pptx',
      endpoint: 'office-to-pdf',
      outExt: 'pdf',
      title: 'Convert PowerPoint to PDF',
      subtitle: 'Turn PPT and PPTX presentation slides into formatted PDF files.',
      uploadTitle: 'Select PowerPoint File',
      btnText: 'Convert to PDF',
      icon: 'bi-file-earmark-slides text-danger'
    },

    // 3. Excel to PDF
    'excel-to-pdf': {
      accept: '.xls,.xlsx',
      endpoint: 'office-to-pdf',
      outExt: 'pdf',
      title: 'Convert Excel to PDF',
      subtitle: 'Convert spreadsheets and workbooks to clean PDF sheets.',
      uploadTitle: 'Select Excel File',
      btnText: 'Convert to PDF',
      icon: 'bi-file-earmark-excel text-success'
    },

    // 4. PDF to Word
    'pdf-to-word': {
      accept: '.pdf',
      endpoint: 'pdf-to-word',
      outExt: 'docx',
      title: 'Convert PDF to Word',
      subtitle: 'Convert PDF files into easily editable DOCX format.',
      uploadTitle: 'Select PDF file',
      btnText: 'Convert to Word',
      icon: 'bi-file-earmark-pdf text-danger'
    },

    // 5. PDF to PowerPoint
    'pdf-to-powerpoint': {
      accept: '.pdf',
      endpoint: 'pdf-to-ppt',
      outExt: 'pptx',
      title: 'Convert PDF to PowerPoint',
      subtitle: 'Turn your PDF pages into fully formatted PowerPoint slides.',
      uploadTitle: 'Select PDF file',
      btnText: 'Convert to PowerPoint',
      icon: 'bi-file-earmark-slides text-warning'
    },
    'pdf-to-ppt': {
      accept: '.pdf',
      endpoint: 'pdf-to-ppt',
      outExt: 'pptx',
      title: 'Convert PDF to PowerPoint',
      subtitle: 'Turn your PDF pages into fully formatted PowerPoint slides.',
      uploadTitle: 'Select PDF file',
      btnText: 'Convert to PowerPoint',
      icon: 'bi-file-earmark-slides text-warning'
    },

    // 6. PDF to Excel
    'pdf-to-excel': {
      accept: '.pdf',
      endpoint: 'pdf-to-excel',
      outExt: 'xlsx',
      title: 'Convert PDF to Excel',
      subtitle: 'Extract data and tabular records from PDF into editable Excel sheets.',
      uploadTitle: 'Select PDF file',
      btnText: 'Convert to Excel',
      icon: 'bi-file-earmark-excel text-success'
    }
  };

  const config = configMap[action] || {
    accept: '.pdf',
    endpoint: 'office-to-pdf',
    outExt: 'pdf',
    title: 'Document Converter',
    subtitle: 'High precision document conversion.',
    uploadTitle: 'Select file',
    btnText: 'Convert File',
    icon: 'bi-file-earmark text-secondary'
  };

  const handleConvert = async () => {
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`http://localhost:5000/api/pdf/${config.endpoint}`, formData, {
        responseType: 'blob'
      });

      const originalBaseName = file.name.substring(0, file.name.lastIndexOf('.')) || 'converted';
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PDFMan_${originalBaseName}.${config.outExt}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      if (e.response && e.response.data instanceof Blob) {
        const errorText = await e.response.data.text();
        try {
          const parsed = JSON.parse(errorText);
          alert(`Conversion failed: ${parsed.error || parsed.message}`);
        } catch {
          alert('Conversion failed. Please verify the backend server.');
        }
      } else {
        alert('Conversion failed. Please verify the backend server.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5 my-auto text-center" style={{ maxWidth: '680px' }}>
      <h1 className="fw-bold mb-2">{config.title}</h1>
      <p className="text-muted mb-4">{config.subtitle}</p>

      {!file ? (
        <FileUploader
          key={action} // Forces file uploader to reset when switching between tools in navbar
          accept={config.accept}
          multiple={false}
          onFilesSelected={(f) => setFile(f[0])}
          title={config.uploadTitle}
          subtitle="or drop file here"
        />
      ) : (
        <div className="card p-4 shadow-sm border-0 rounded-4 mt-3 bg-white">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <span className="fw-bold text-truncate me-2 d-flex align-items-center">
              <i className={`bi ${config.icon} me-2 fs-4`}></i>
              {file.name}
            </span>
            <span className="badge bg-secondary">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </span>
          </div>

          <div className="d-flex gap-2">
            <button
              onClick={handleConvert}
              disabled={loading}
              className="btn btn-brand btn-lg flex-grow-1 fw-bold"
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Processing {config.btnText}...
                </>
              ) : (
                config.btnText
              )}
            </button>
            <button
              onClick={() => setFile(null)}
              disabled={loading}
              className="btn btn-outline-secondary btn-lg fw-semibold"
            >
              Change File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}