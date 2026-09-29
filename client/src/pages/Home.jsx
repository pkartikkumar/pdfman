import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toolsData } from '../data/toolsData';

export default function Home() {
  const [category, setCategory] = useState('all');

  const categories = [
    { label: 'All', key: 'all' },
    { label: 'Organize PDF', key: 'organize' },
    { label: 'Edit PDF and Security', key: 'edit' },
    { label: 'Optimize PDF', key: 'optimize' },
    { label: 'Convert to PDF', key: 'convert-to' },
    { label: 'Convert from PDF', key: 'convert-from' },
    { label: 'PNG & Images', key: 'image' },
  ];

  const tools = category === 'all' ? toolsData : toolsData.filter((t) => t.category === category);

  return (
    <div className="min-vh-100 pb-5">
      <div className="text-center py-5 px-3">
        <h1 className="display-5 fw-bold mb-2">
          Every tool you need to work with PDFs, in one place
        </h1>
        <p className="fs-5 mb-4">100% free, fast, and simple to use with PDFMan.</p>

        {/* Dynamic Category Filter Pills */}
        <div className="d-flex justify-content-center flex-wrap gap-2 mt-3">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`btn btn-sm rounded-pill px-3 py-2 fw-semibold transition-all ${
                category === c.key
                  ? 'btn-dark category-pill-active shadow-sm'
                  : 'btn-outline-secondary category-pill-inactive'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container">
        <div className="row g-3">
          {tools.map((tool) => (
            <div key={tool.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
              <Link to={tool.path} className="text-decoration-none">
                <div className="card h-100 p-4 tool-card shadow-sm">
                  <i className={`bi ${tool.icon} fs-1 mb-3`} style={{ color: tool.color }}></i>
                  <h5 className="fw-bold">{tool.title}</h5>
                  <p className="small mb-0">{tool.desc}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}