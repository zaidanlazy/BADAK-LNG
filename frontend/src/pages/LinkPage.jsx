import React, { useState, useEffect } from "react";

export default function LinkSharePage() {
  const [linkData, setLinkData] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    // Get file ID from URL
    const urlParts = window.location.pathname.split('/');
    const fileId = urlParts[urlParts.length - 1];

    // Fetch file data from Laravel API
    const fetchFileData = async () => {
      try {
        console.log('Fetching file data for:', fileId);
        const response = await fetch(`http://localhost:8000/api/file/${fileId}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch file data');
        }

        const data = await response.json();
        console.log('File data received:', data);

        // Check if settings were actually applied by user
        const hasPassword = data.hasPassword;
        const hasExpireDate = data.expiresAt && new Date(data.expiresAt).getFullYear() < 2026; // Not default 1 year
        const hasOneTimeView = data.oneTimeView;
        const hasCustomLink = data.customLink && data.customLink !== fileId;

        console.log('Settings check:', {
          hasPassword,
          hasExpireDate,
          hasOneTimeView,
          hasCustomLink,
          expiresAt: data.expiresAt,
          customLink: data.customLink,
          fileId
        });

        // Transform API data to match component structure
        const linkData = {
          fileId: fileId,
          files: data.files ? data.files.map(file => ({
            name: file.original_name,
            size: file.size
          })) : [{
            name: data.originalName,
            size: data.size
          }],
          options: {
            password: hasPassword ? 'required' : null,
            expireDate: hasExpireDate ? data.expiresAt : null,
            oneTimeView: hasOneTimeView,
            customLink: hasCustomLink ? data.customLink : null
          },
          uploadTime: data.createdAt
        };
        setLinkData(linkData);

        // Create share URL
        const baseUrl = window.location.origin;
        setShareUrl(`${baseUrl}/download/${fileId}`);

      } catch (error) {
        console.error('Error fetching file data:', error);
        // Fallback to sessionStorage if API fails
        const storedData = sessionStorage.getItem(`link_${fileId}`);
        if (storedData) {
          const data = JSON.parse(storedData);
          setLinkData(data);
          const baseUrl = window.location.origin;
          const downloadPath = data.options.customLink ? data.options.customLink : fileId;
          setShareUrl(`${baseUrl}/download/${downloadPath}`);
        }
      }
    };

    fetchFileData();
  }, []);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const getTotalSize = () => {
    if (!linkData?.files) return 0;
    return linkData.files.reduce((total, file) => total + file.size, 0);
  };

  if (!linkData) {
    return (
      <div className="share-page">
        <div className="share-container">
          <div className="loading-container">
            <div className="loading-spinner">
              <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p>Memuat informasi file...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="share-page">
      <div className="share-container">
        {/* Header */}
        <div className="share-header">
          <div className="logo-container">
            <div className="logo-wrapper">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Badak_NGL_new_logo_%28since_2018%29.svg/1200px-Badak_NGL_new_logo_%28since_2018%29.svg.png"
                alt="Badak LNG"
                className="logo-image"
              />
            </div>
          </div>
          <h1 className="share-title">File Berhasil Diupload</h1>
        </div>

        {/* Main Content */}
        <div className="share-content">
          {/* Success Message */}
          <div className="success-message">
            <div className="success-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3>Upload Berhasil!</h3>
            <p>Siap berbagi File </p>
          </div>

          {/* Share Link Section */}
          <div className="share-link-section">
            <label className="share-link-label">Link Download</label>
            <div className="share-link-container">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="share-link-input"
              />
              <button
                onClick={copyToClipboard}
                className={`copy-button ${copySuccess ? 'success' : ''}`}
              >
                {copySuccess ? (
                  <svg className="copy-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="copy-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
                {copySuccess ? 'Tersalin!' : 'Salin'}
              </button>
            </div>
          </div>

          {/* File Information */}
          <div className="file-info-section">
            <h3 className="section-title">Informasi File</h3>
            <div className="file-summary">
              <div className="summary-item">
                <span className="summary-label">Total File:</span>
                <span className="summary-value">{linkData.files.length} file{linkData.files.length > 1 ? 's' : ''}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Total Size:</span>
                <span className="summary-value">{formatFileSize(getTotalSize())}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Upload Time:</span>
                <span className="summary-value">{formatDateTime(linkData.uploadTime)}</span>
              </div>
            </div>

            <div className="file-list">
              {linkData.files.map((file, index) => (
                <div key={index} className="file-item">
                  <div className="file-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="file-details">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{formatFileSize(file.size)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Settings Applied */}
          {(linkData.options.password || linkData.options.expireDate || linkData.options.oneTimeView || linkData.options.customLink) && (
            <div className="settings-section">
              <h3 className="section-title">Pengaturan yang Diterapkan</h3>
              <div className="settings-list">
                {linkData.options.password && (
                  <div className="setting-item">
                    <div className="setting-icon password">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a1 1 0 001-1v-6a1 1 0 00-1-1H7a1 1 0 00-1 1v6a1 1 0 001 1zM12 9V7a4 4 0 00-8 0v2" />
                      </svg>
                    </div>
                    <div className="setting-details">
                      <span className="setting-label">Password Protection</span>
                      <span className="setting-description">File dilindungi dengan password</span>
                    </div>
                  </div>
                )}

                {linkData.options.expireDate && (
                  <div className="setting-item">
                    <div className="setting-icon expire">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="setting-details">
                      <span className="setting-label">Expire Date</span>
                      <span className="setting-description">Kedaluwarsa: {formatDateTime(linkData.options.expireDate)}</span>
                    </div>
                  </div>
                )}

                {linkData.options.oneTimeView && (
                  <div className="setting-item">
                    <div className="setting-icon one-time">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <div className="setting-details">
                      <span className="setting-label">One Time View</span>
                      <span className="setting-description">Hanya dapat diakses sekali</span>
                    </div>
                  </div>
                )}

                {linkData.options.customLink && (
                  <div className="setting-item">
                    <div className="setting-icon custom">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <div className="setting-details">
                      <span className="setting-label">Custom Link</span>
                      <span className="setting-description">/{linkData.options.customLink}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="action-buttons">
            <button
              onClick={() => window.location.href = '/'}
              className="secondary-button"
            >
              Upload File Baru
            </button>
            <button
              onClick={() => window.open(shareUrl, '_blank')}
              className="primary-button"
            >
              <svg className="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Buka Link Download
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .share-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #dbeafe 0%, #ffffff 50%, #fecaca 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .share-container {
          background: white;
          border-radius: 1rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 42rem;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }

        .loading-container {
          padding: 4rem 2rem;
          text-align: center;
        }

        .loading-spinner {
          display: flex;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .spinner {
          width: 2rem;
          height: 2rem;
          animation: spin 1s linear infinite;
          color: #3b82f6;
        }

        .spinner-circle {
          opacity: 0.25;
        }

        .spinner-path {
          opacity: 0.75;
        }

        .share-header {
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

        .share-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          letter-spacing: 0.5px;
        }

        .share-subtitle {
          font-size: 1rem;
          opacity: 0.9;
        }

        .share-content {
          padding: 2rem;
        }

        .success-message {
          text-align: center;
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          border-radius: 0.75rem;
          border: 1px solid #86efac;
        }

        .success-icon {
          width: 3rem;
          height: 3rem;
          background: #22c55e;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
        }

        .success-icon svg {
          width: 1.5rem;
          height: 1.5rem;
        }

        .success-message h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #065f46;
          margin-bottom: 0.5rem;
        }

        .success-message p {
          color: #047857;
          font-size: 0.875rem;
        }

        .share-link-section {
          margin-bottom: 2rem;
        }

        .share-link-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .share-link-container {
          display: flex;
          gap: 0.5rem;
        }

        .share-link-input {
          flex: 1;
          padding: 0.75rem;
          border: 2px solid #e5e7eb;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          background-color: #f9fafb;
          color: #374151;
          font-family: monospace;
        }

        .share-link-input:focus {
          outline: none;
          border-color: #3b82f6;
          background-color: white;
        }

        .copy-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 80px;
          justify-content: center;
        }

        .copy-button:hover {
          background: #2563eb;
        }

        .copy-button.success {
          background: #22c55e;
        }

        .copy-button.success:hover {
          background: #16a34a;
        }

        .copy-icon {
          width: 1rem;
          height: 1rem;
        }

        .section-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 1rem;
        }

        .file-info-section {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .file-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
        }

        .summary-label {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }

        .summary-value {
          font-size: 0.875rem;
          color: #1f2937;
          font-weight: 600;
        }

        .file-list {
          max-height: 12rem;
          overflow-y: auto;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          background: white;
        }

        .file-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #f3f4f6;
        }

        .file-item:last-child {
          border-bottom: none;
        }

        .file-icon {
          width: 2rem;
          height: 2rem;
          color: #6b7280;
          flex-shrink: 0;
        }

        .file-icon svg {
          width: 100%;
          height: 100%;
        }

        .file-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          flex: 1;
          min-width: 0;
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

        .settings-section {
          background-color: #fef3c7;
          border: 1px solid #fbbf24;
          border-radius: 0.75rem;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .settings-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .setting-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: white;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
        }

        .setting-icon {
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .setting-icon.password {
          background: #dbeafe;
          color: #2563eb;
        }

        .setting-icon.expire {
          background: #fef3c7;
          color: #d97706;
        }

        .setting-icon.one-time {
          background: #fce7f3;
          color: #be185d;
        }

        .setting-icon.custom {
          background: #d1fae5;
          color: #059669;
        }

        .setting-icon svg {
          width: 1.25rem;
          height: 1.25rem;
        }

        .setting-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          flex: 1;
        }

        .setting-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .setting-description {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .secondary-button {
          padding: 0.75rem 1.5rem;
          background: white;
          color: #374151;
          border: 2px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .secondary-button:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .primary-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(90deg, #2563eb 0%, #dc2626 100%);
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .primary-button:hover {
          background: linear-gradient(90deg, #1d4ed8 0%, #b91c1c 100%);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
          transform: translateY(-1px);
        }

        .primary-button:active {
          transform: translateY(0);
        }

        .button-icon {
          width: 1rem;
          height: 1rem;
        }

        /* Scrollbar styling */
        .file-list::-webkit-scrollbar {
          width: 6px;
        }

        .file-list::-webkit-scrollbar-track {
          background: #f1f5f9;
        }

        .file-list::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        .file-list::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Responsive design */
        @media (max-width: 640px) {
          .share-container {
            margin: 0.5rem;
          }

          .share-content {
            padding: 1.5rem;
          }

          .file-summary {
            grid-template-columns: 1fr;
          }

          .action-buttons {
            flex-direction: column;
          }

          .share-link-container {
            flex-direction: column;
          }

          .copy-button {
            justify-content: center;
          }
        }

         `}</style>
    </div>
  );
}
