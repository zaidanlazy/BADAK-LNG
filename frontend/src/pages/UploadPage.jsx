import React, { useState } from 'react';

export default function UploadPage() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [expandedFolder, setExpandedFolder] = useState(false);

  // state options
  const [options, setOptions] = useState({
    password: { enabled: false, value: '' },
    expireDate: { enabled: false, value: '' },
    oneTimeView: { enabled: false },
    customizeLink: { enabled: false, value: '' }
  });

  // Handle option changes
  const handleOptionChange = (optionName, field, value) => {
    setOptions(prevOptions => ({
      ...prevOptions,
      [optionName]: {
        ...prevOptions[optionName],
        [field]: value
      }
    }));
  };

  // multi page file
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
  };

  const removeFile = (indexToRemove) => {
    setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  };

  const removeAllFiles = () => {
    setFiles([]);
    setExpandedFolder(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);

    try {
      const formData = new FormData();

      // Append all files
      files.forEach((file) => {
        formData.append('files[]', file);
      });

      // Append options (only if enabled)
      if (options.password.enabled && options.password.value) {
        formData.append('password', options.password.value);
      }
      if (options.expireDate.enabled && options.expireDate.value) {
        formData.append('expired_date', options.expireDate.value);
      }
      formData.append('one_time_view', options.oneTimeView.enabled ? '1' : '0');
      if (options.customizeLink.enabled && options.customizeLink.value) {
        formData.append('custom_link', options.customizeLink.value);
      }

      // Use batch upload endpoint
      const response = await fetch('http://localhost:8000/api/file/upload-batch', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const result = await response.json();
      console.log('Upload success:', result);

      // Redirect to link page with custom_link
      window.location.href = `/link/${result.custom_link}`;

    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload gagal: ${error.message}. Silakan coba lagi.`);
    } finally {
      setUploading(false);
    }
  };

  const getTotalSize = () => {
    return files.reduce((total, file) => total + file.size, 0);
  };

  const toggleFolder = () => {
    setExpandedFolder(!expandedFolder);
  };

  // Function to render files based on count
  const renderFileList = () => {
    if (files.length === 0) return null;

    if (files.length <= 2 ) {
      // Show individual files when 2  or fewer
      return (
        <div className="file-list">
          <div className="file-list-header">
            <h4>File yang dipilih ({files.length} file{files.length > 1 ? 's' : ''})</h4>
            <div className="file-list-actions">
              <span className="total-size">Total: {formatFileSize(getTotalSize())}</span>
              <button onClick={removeAllFiles} className="clear-all-button">
                <svg className="clear-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Hapus Semua
              </button>
            </div>
          </div>
          <div className="file-items">
            {files.map((file, index) => (
              <div key={index} className="file-item">
                <div className="file-info">
                  <div className="file-icon-small">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="file-details">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{formatFileSize(file.size)}</span>
                  </div>
                </div>
                <button onClick={() => removeFile(index)} className="remove-file-item-button">
                  <svg className="remove-icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    } else {
      // Show folder when more than 2 files
      return (
        <div className="file-list">
          <div className="file-list-header">
            <h4>File yang dipilih</h4>
            <div className="file-list-actions">
              <span className="total-size">Total: {formatFileSize(getTotalSize())}</span>
              <button onClick={removeAllFiles} className="clear-all-button">
                <svg className="clear-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Hapus Semua
              </button>
            </div>
          </div>
          <div className="file-items">
            {/* Folder item */}
            <div className="folder-item" onClick={toggleFolder}>
              <div className="file-info">
                <div className="folder-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <div className="file-details">
                  <span className="folder-name">File Package ({files.length} files)</span>
                  <span className="folder-size">{formatFileSize(getTotalSize())}</span>
                </div>
              </div>
              <div className="folder-toggle">
                <svg
                  className={`expand-icon ${expandedFolder ? 'expanded' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Expanded files list */}
            {expandedFolder && (
              <div className="expanded-files">
                {files.map((file, index) => (
                  <div key={index} className="file-item nested">
                    <div className="file-info">
                      <div className="file-icon-small">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="file-details">
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">{formatFileSize(file.size)}</span>
                      </div>
                    </div>
                    <button onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }} className="remove-file-item-button">
                      <svg className="remove-icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-container">
        {/* Header with enlarged logo */}
        <div className="upload-header">
          <div className="logo-container">
            <div className="logo-wrapper">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Badak_NGL_new_logo_%28since_2018%29.svg/1200px-Badak_NGL_new_logo_%28since_2018%29.svg.png"
                alt="Badak LNG"
                className="logo-image"
              />
            </div>
          </div>
          <h1 className="upload-title">Share File</h1>
          <p className="upload-subtitle">Secure File Sharing Platform</p>
        </div>

        {/* Main content */}
        <div className="upload-content">
          {/* File upload area */}
          <div className="file-upload-section">
            <label className="file-upload-label">Pilih file untuk diupload</label>
            <div className={`file-dropzone ${files.length > 0 ? 'has-file' : ''}`}>
              <div className="file-dropzone-content">
                <svg className="file-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="file-instructions">
                  <span>Drag & drop multiple files atau <span className="browse-text">browse</span></span>
                </p>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="file-input"
                  multiple
                />
              </div>
            </div>

            {/* File list */}
            {renderFileList()}
          </div>

          {/* Advanced options */}
          {files.length > 0 && (
            <div className="advanced-options">
              <div className="options-header">
                <h3 className="options-title">Pengaturan Lanjutan</h3>
                <p className="options-subtitle">Biarkan kosong untuk akses langsung tanpa batasan</p>
              </div>

              {/* Password protection */}
              <div className="option-item">
                <div className="option-toggle">
                  <label className="toggle-label">
                    <span className="option-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                      </svg>
                    </span>
                    <span className="option-label-text">Proteksi Password</span>
                  </label>
                  <div className={`toggle-switch ${options.password.enabled ? 'enabled' : ''}`}>
                    <input
                      type="checkbox"
                      checked={options.password.enabled}
                      onChange={(e) => handleOptionChange('password', 'enabled', e.target.checked)}
                      className="toggle-input"
                    />
                    <div className="toggle-slider" />
                  </div>
                </div>
                {options.password.enabled && (
                  <div className="option-content">
                    <input
                      type="password"
                      placeholder="Masukkan password"
                      value={options.password.value}
                      onChange={(e) => handleOptionChange('password', 'value', e.target.value)}
                      className="square-input"
                    />
                    <p className="option-hint">file membutuhkan password untuk diakses</p>
                  </div>
                )}
              </div>

              {/* Expiration date */}
              <div className="option-item">
                <div className="option-toggle">
                  <label className="toggle-label">
                    <span className="option-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                      </svg>
                    </span>
                    <span className="option-label-text">Expire Date</span>
                  </label>
                  <div className={`toggle-switch ${options.expireDate.enabled ? 'enabled' : ''}`}>
                    <input
                      type="checkbox"
                      checked={options.expireDate.enabled}
                      onChange={(e) => handleOptionChange('expireDate', 'enabled', e.target.checked)}
                      className="toggle-input"
                    />
                    <div className="toggle-slider" />
                  </div>
                </div>
                {options.expireDate.enabled && (
                  <div className="option-content">
                    <input
                      type="datetime-local"
                      value={options.expireDate.value}
                      onChange={(e) => handleOptionChange('expireDate', 'value', e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="square-input"
                    />
                    <p className="option-hint">file akan otomatis tidak dapat diakses setelah waktu ini</p>
                  </div>
                )}
              </div>

              {/* One-time view */}
              <div className="option-item">
                <div className="option-toggle">
                  <label className="toggle-label">
                    <span className="option-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    </span>
                    <span className="option-label-text">One Time View</span>
                  </label>
                  <div className={`toggle-switch ${options.oneTimeView.enabled ? 'enabled' : ''}`}>
                    <input
                      type="checkbox"
                      checked={options.oneTimeView.enabled}
                      onChange={(e) => handleOptionChange('oneTimeView', 'enabled', e.target.checked)}
                      className="toggle-input"
                    />
                    <div className="toggle-slider" />
                  </div>
                </div>
                {options.oneTimeView.enabled && (
                  <p className="option-description">
                    File hanya dapat diakses satu kali, kemudian link akan tidak dapat digunakan lagi
                  </p>
                )}
              </div>

              {/* Custom link */}
              <div className="option-item">
                <div className="option-toggle">
                  <label className="toggle-label">
                    <span className="option-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" />
                      </svg>
                    </span>
                    <span className="option-label-text">Customize Link</span>
                  </label>
                  <div className={`toggle-switch ${options.customizeLink.enabled ? 'enabled' : ''}`}>
                    <input
                      type="checkbox"
                      checked={options.customizeLink.enabled}
                      onChange={(e) => handleOptionChange('customizeLink', 'enabled', e.target.checked)}
                      className="toggle-input"
                    />
                    <div className="toggle-slider" />
                  </div>
                </div>
                {options.customizeLink.enabled && (
                  <div className="option-content">
                    <div className="square-input-group">
                      <span className="square-input-prefix">.../download/</span>
                      <input
                        type="text"
                        placeholder="nama-custom"
                        value={options.customizeLink.value}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^a-zA-Z0-9-_]/g, '');
                          handleOptionChange('customizeLink', 'value', value);
                        }}
                        className="square-input"
                      />
                    </div>
                    <p className="option-hint">Hanya huruf, angka, tanda hubung (-) dan underscore (_) yang diizinkan</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upload button */}
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className={`upload-button ${files.length === 0 || uploading ? 'disabled' : ''}`}
          >
            {uploading ? (
              <span className="upload-button-loading">
                <svg className="loading-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Mengupload {files.length} file{files.length > 1 ? 's' : ''}...
              </span>
            ) : (
              files.length > 2 ? `Upload File Package (${files.length} files)` : `Upload ${files.length} File${files.length > 1 ? 's' : ''}`
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        .upload-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #dbeafe 0%, #ffffff 50%, #fecaca 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .upload-container {
          background: white;
          border-radius: 1rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 36rem;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }

        .upload-header {
          background: linear-gradient(90deg, #2563eb 0%, #dc2626 100%);
          padding: 2rem 1.5rem;
          text-align: center;
          color: white;
        }

        .logo-container {
          display: flex;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .logo-wrapper {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          padding: 1.5rem;
          border-radius: 1.5rem;
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.3);
          transition: all 0.3s ease;
        }

        .logo-wrapper:hover {
          transform: scale(1.05);
        }

        .logo-image {
          height: 6rem;
          width: 6rem;
          object-fit: contain;
        }

        .upload-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          letter-spacing: 0.5px;
        }

        .upload-subtitle {
          font-size: 1rem;
          opacity: 0.9;
        }

        .upload-content {
          padding: 2rem;
        }

        .file-upload-section {
          margin-bottom: 1.5rem;
        }

        .file-upload-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .file-dropzone {
          border: 2px dashed #d1d5db;
          border-radius: 0.75rem;
          padding: 2rem;
          text-align: center;
          transition: all 0.2s;
          position: relative;
          background-color: #f9fafb;
        }

        .file-dropzone.has-file {
          border-color: #3b82f6;
          background-color: #eff6ff;
        }

        .file-dropzone:hover:not(.has-file) {
          border-color: #93c5fd;
        }

        .file-dropzone-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }

        .file-icon {
          width: 3.5rem;
          height: 3.5rem;
          color: #9ca3af;
        }

        .has-file .file-icon {
          color: #3b82f6;
        }

        .file-instructions {
          font-size: 1rem;
          color: #6b7280;
        }

        .browse-text {
          color: #3b82f6;
          font-weight: 500;
        }

        .file-input {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }

        .file-list {
          margin-top: 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          background: white;
        }

        .file-list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
          background-color: #f9fafb;
        }

        .file-list-header h4 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: #374151;
        }

        .file-list-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .total-size {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }

        .clear-all-button {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.875rem;
          color: #ef4444;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
          transition: all 0.2s;
        }

        .clear-all-button:hover {
          color: #dc2626;
          background-color: #fef2f2;
        }

        .clear-icon {
          width: 1rem;
          height: 1rem;
        }

        .file-items {
          max-height: 16rem;
          overflow-y: auto;
        }

        .file-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #f3f4f6;
          transition: background-color 0.2s;
        }

        .file-item:hover {
          background-color: #f9fafb;
        }

        .file-item:last-child {
          border-bottom: none;
        }

        .file-item.nested {
          padding-left: 2rem;
          background-color: #f8fafc;
        }

        .folder-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #f3f4f6;
          transition: background-color 0.2s;
          cursor: pointer;
          background-color: #f0f9ff;
          border-left: 3px solid #3b82f6;
        }

        .folder-item:hover {
          background-color: #e0f2fe;
        }

        .folder-icon {
          width: 2rem;
          height: 2rem;
          color: #3b82f6;
          flex-shrink: 0;
        }

        .folder-icon svg {
          width: 100%;
          height: 100%;
        }

        .folder-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1e40af;
          word-break: break-all;
        }

        .folder-size {
          font-size: 0.75rem;
          color: #3b82f6;
        }

        .folder-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1.5rem;
          height: 1.5rem;
          color: #3b82f6;
          flex-shrink: 0;
        }

        .expand-icon {
          width: 1rem;
          height: 1rem;
          transition: transform 0.2s;
        }

        .expand-icon.expanded {
          transform: rotate(90deg);
        }

        .expanded-files {
          background-color: #fafbfc;
          border-top: 1px solid #e2e8f0;
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
        }

        .file-icon-small {
          width: 2rem;
          height: 2rem;
          color: #6b7280;
          flex-shrink: 0;
        }

        .file-icon-small svg {
          width: 100%;
          height: 100%;
        }

        .file-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          min-width: 0;
          flex: 1;
        }

        .file-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          word-break: break-all;
        }

        .file-size {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .remove-file-item-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1.5rem;
          height: 1.5rem;
          color: #6b7280;
          background: none;
          border: none;
          cursor: pointer;
          border-radius: 0.25rem;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .remove-file-item-button:hover {
          color: #ef4444;
          background-color: #fef2f2;
        }

        .remove-icon-small {
          width: 1rem;
          height: 1rem;
        }

        .advanced-options {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .options-header {
          display: flex;
          flex-direction: column;
          margin-bottom: 1rem;
        }

        .options-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.25rem;
        }

        .options-subtitle {
          font-size: 0.875rem;
          color: #6b7280;
          font-style: italic;
        }

        .option-item {
          margin-bottom: 1.25rem;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 1.5rem;
        }

        .option-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
          margin-bottom: 0;
        }

        .option-toggle {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .toggle-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .option-icon {
          width: 1.25rem;
          height: 1.25rem;
          color: #6b7280;
        }

        .option-label-text {
          font-weight: 500;
          color: #374151;
        }

        .toggle-switch {
          position: relative;
          width: 3rem;
          height: 1.5rem;
          background-color: #d1d5db;
          border-radius: 9999px;
          transition: background-color 0.2s;
        }

        .toggle-switch.enabled {
          background-color: #3b82f6;
        }

        .toggle-input {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }

        .toggle-slider {
          position: absolute;
          top: 0.25rem;
          left: 0.25rem;
          width: 1rem;
          height: 1rem;
          background-color: white;
          border-radius: 9999px;
          transition: transform 0.2s;
        }

        .toggle-switch.enabled .toggle-slider {
          transform: translateX(1.5rem);
        }

        .option-content {
          margin-top: 0.5rem;
        }

        .square-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
          border-radius: 0;
          box-sizing: border-box;
        }

        .square-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }

        .square-input-group {
          display: flex;
          border: 1px solid #d1d5db;
          margin-bottom: 0.5rem;
        }

        .square-input-prefix {
          padding: 0.75rem;
          background-color: #f3f4f6;
          font-size: 0.875rem;
          color: #6b7280;
          border-right: 1px solid #d1d5db;
          display: flex;
          align-items: center;
        }

        .option-hint {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }

        .option-description {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.25rem;
          line-height: 1.4;
        }

        .upload-button {
          width: 100%;
          padding: 1rem;
          border-radius: 0.75rem;
          font-weight: 600;
          color: white;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
        }

        .upload-button:not(.disabled) {
          background: linear-gradient(90deg, #2563eb 0%, #dc2626 100%);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .upload-button:not(.disabled):hover {
          background: linear-gradient(90deg, #1d4ed8 0%, #b91c1c 100%);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
          transform: translateY(-1px);
        }

        .upload-button:not(.disabled):active {
          transform: translateY(0);
        }

        .upload-button.disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
        }

        .upload-button-loading {
          display: flex;
          align-items: center;
        }

        .loading-spinner {
          width: 1.25rem;
          height: 1.25rem;
          margin-right: 0.75rem;
          animation: spin 1s linear infinite;
        }

        .spinner-circle {
          opacity: 0.25;
        }

        .spinner-path {
          opacity: 0.75;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Scrollbar styling for file list */
        .file-items::-webkit-scrollbar {
          width: 6px;
        }

        .file-items::-webkit-scrollbar-track {
          background: #f1f5f9;
        }

        .file-items::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        .file-items::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        .expanded-files::-webkit-scrollbar {
          width: 4px;
        }

        .expanded-files::-webkit-scrollbar-track {
          background: #f1f5f9;
        }

        .expanded-files::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
