import React, { useRef } from 'react';

export default function FileUploader({ accept, multiple = false, onFilesSelected, title, subtitle }) {
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => inputRef.current.click()}
      className="drop-zone p-5 text-center my-4"
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="d-none"
        onChange={(e) => onFilesSelected(Array.from(e.target.files))}
      />
      <div className="mb-3">
        <i className="bi bi-cloud-arrow-up-fill brand-red" style={{ fontSize: '4rem' }}></i>
      </div>
      <h3 className="fw-bold mb-1">{title || 'Select files'}</h3>
      <p className="text-muted">{subtitle || 'or drop files right here'}</p>
      <button className="btn btn-brand btn-lg px-4 py-2 mt-2 fw-semibold rounded-3 shadow-sm">
        Select Files
      </button>
    </div>
  );
}