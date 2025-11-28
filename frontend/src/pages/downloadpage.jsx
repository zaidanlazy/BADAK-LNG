import React, { useState, useEffect } from "react";

export default function PublicDownloadPage() {
  const [linkData, setLinkData] = useState(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [linkStatus, setLinkStatus] = useState("loading"); // loading, valid, expired, used, not_found
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Toast notification system
  const addToast = (message, type = 'success', duration = 5000) => {
    const id = Date.now();
    const toast = { id, message, type, duration };

    setToasts(prev => [...prev, toast]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Sample data for demo - in real app, this would come from API
  const sampleLinks = {
    "abc123": {
      fileId: "abc123",
      files: [
        { name: "Laporan_Badak_LNG_2024.pdf", size: 2500000, type: "application/pdf" },
        { name: "Data_Produksi_Q4.xlsx", size: 850000, type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
      ],
      options: {
        password: null,
        expireDate: null,
        oneTimeView: false,
        downloadLimit: null
      },
      metadata: {
        sharedBy: "Ahmad Hidayat",
        sharedDate: "2024-08-20",
        description: "Laporan bulanan produksi LNG"
      },
      accessed: false,
      downloadCount: 0
    },
    "def456": {
      fileId: "def456",
      files: [
        { name: "Presentasi_Safety_Meeting.pptx", size: 15000000, type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" }
      ],
      options: {
        password: "badak2024",
        expireDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        oneTimeView: true,
        downloadLimit: 1
      },
      metadata: {
        sharedBy: "Sari Wijaya",
        sharedDate: "2024-08-22",
        description: "Materi safety meeting bulanan"
      },
      accessed: false,
      downloadCount: 0
    },
    "ghi789": {
      fileId: "ghi789",
      files: [
        { name: "Video_Training_HSE.mp4", size: 125000000, type: "video/mp4" },
        { name: "Handbook_HSE_2024.pdf", size: 3200000, type: "application/pdf" }
      ],
      options: {
        password: null,
        expireDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        oneTimeView: false,
        downloadLimit: 10
      },
      metadata: {
        sharedBy: "Budi Santoso",
        sharedDate: "2024-08-18",
        description: "Materi training HSE terbaru"
      },
      accessed: false,
      downloadCount: 3
    }
  };

  useEffect(() => {
    // Get file ID from URL
    const getFileIdFromUrl = () => {
      const path = window.location.pathname;
      const match = path.match(/\/download\/(.+)/);
      return match ? match[1] : null;
    };

    const fileId = getFileIdFromUrl();

    if (!fileId) {
      setLinkStatus("not_found");
      return;
    }

    // Fetch file info from Laravel API
    const fetchFileInfo = async () => {
      try {
        console.log('Fetching file info for:', fileId);

        // Add timeout to prevent infinite loading
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(`http://localhost:8000/api/file/${fileId}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        if (response.status === 404) {
          console.log('File not found');
          setLinkStatus("not_found");
          return;
        }

        if (response.status === 410) {
          const data = await response.json();
          console.log('File expired or used:', data);
          if (data.message === 'Link sudah expired') {
            setLinkStatus("expired");
          } else if (data.message === 'File ini sudah pernah diunduh') {
            setLinkStatus("used");
          }
          return;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error:', response.status, errorText);

          if (response.status === 404) {
            setLinkStatus("not_found");
            return;
          }

          throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('File data received:', data);

        // Transform API data to match component structure
        const linkData = {
          fileId: fileId,
          files: data.files ? data.files.map(file => ({
            name: file.original_name,
            size: file.size,
            type: file.mime_type || 'application/octet-stream'
          })) : [{
            name: data.originalName,
            size: data.size,
            type: 'application/octet-stream' // Default type
          }],
          options: {
            password: data.hasPassword ? 'required' : null,
            expireDate: data.expiresAt,
            oneTimeView: data.oneTimeView,
            downloadLimit: null
          },
          metadata: {
            sharedBy: "Badak LNG User",
            sharedDate: new Date(data.createdAt).toISOString().split('T')[0],
            description: "File shared via File Share"
          },
          accessed: false,
          downloadCount: data.downloadCount
        };
        console.log('Transformed link data:', linkData);

        setLinkData(linkData);

        // Check if link has expired
        if (data.expiresAt && false) {
          const expireTime = new Date(data.expiresAt);
          const now = new Date();

          if (now > expireTime) {
            setLinkStatus("expired");
            return;
          }

          // Calculate time remaining
          const timeDiff = expireTime - now;
          setTimeRemaining(timeDiff);

          // Start countdown timer
          const countdownTimer = setInterval(() => {
            const newTimeDiff = expireTime - new Date();
            if (newTimeDiff <= 0) {
              setLinkStatus("expired");
              clearInterval(countdownTimer);
            } else {
              setTimeRemaining(newTimeDiff);
            }
          }, 1000);

          return () => clearInterval(countdownTimer);
        }

        // Check if one-time view has been used
        if (data.oneTimeView && data.downloadCount > 0) {
          setLinkStatus("used");
          return;
        }

        // Check if password is required
        if (data.hasPassword) {
          setPasswordRequired(true);
          console.log('Password protection enabled');
        } else {
          console.log('No password protection');
        }

        setLinkStatus("valid");

      } catch (error) {
        console.error('Error fetching file info:', error);
        console.error('Error details:', error.message);

        if (error.name === 'AbortError') {
          console.error('Request timeout - server tidak merespons');
          addToast('Koneksi timeout. Server tidak merespons.', 'error');
        } else {
          console.error('Network or server error');
          addToast('Terjadi kesalahan koneksi. Silakan coba lagi.', 'error');
        }

        // Fallback: try to get data from sessionStorage
        const storedData = sessionStorage.getItem(`link_${fileId}`);
        if (storedData) {
          console.log('Using fallback data from sessionStorage');
          const data = JSON.parse(storedData);
          setLinkData(data);
          setLinkStatus("valid");
          addToast('Menggunakan data tersimpan lokal.', 'warning');
          return;
        }

        setLinkStatus("not_found");
      }
    };

    fetchFileInfo();
  }, []);

  const formatTimeRemaining = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
      return `${days} hari ${hours} jam ${minutes} menit`;
    } else if (hours > 0) {
      return `${hours} jam ${minutes} menit ${seconds} detik`;
    } else if (minutes > 0) {
      return `${minutes} menit ${seconds} detik`;
    } else {
      return `${seconds} detik`;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTotalSize = () => {
    return linkData.files.reduce((total, file) => total + file.size, 0);
  };

  const getFileType = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension)) {
      return 'image';
    }
    if (['pdf'].includes(extension)) {
      return 'pdf';
    }
    if (['txt', 'md', 'json', 'xml', 'csv'].includes(extension)) {
      return 'text';
    }
    if (['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(extension)) {
      return 'video';
    }
    if (['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(extension)) {
      return 'audio';
    }
    if (['doc', 'docx'].includes(extension)) {
      return 'document';
    }
    if (['xls', 'xlsx'].includes(extension)) {
      return 'spreadsheet';
    }
    if (['ppt', 'pptx'].includes(extension)) {
      return 'presentation';
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      return 'archive';
    }
    return 'other';
  };

  const getFileIcon = (file) => {
    const fileType = getFileType(file.name);

    switch (fileType) {
      case 'image':
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="file-type-icon image">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'pdf':
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="file-type-icon pdf">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'video':
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="file-type-icon video">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case 'audio':
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="file-type-icon audio">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        );
      case 'presentation':
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="file-type-icon presentation">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4l-2 16h14l-2-16M11 9h2M9 13h6" />
          </svg>
        );
      case 'spreadsheet':
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="file-type-icon spreadsheet">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        );
      case 'archive':
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="file-type-icon archive">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      default:
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="file-type-icon default">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const canPreview = (file) => {
    const fileType = getFileType(file.name);
    return ['image', 'pdf', 'text', 'video', 'audio'].includes(fileType);
  };

  const handlePreview = (file) => {
    if (passwordRequired) {
      if (password.trim() === "") {
        setPasswordError("Password wajib diisi untuk preview");
        addToast("Password diperlukan untuk preview file.", "warning");
        return;
      }
      if (password !== linkData.options.password) {
        setPasswordError("Password salah");
        addToast("Password yang Anda masukkan salah.", "error");
        return;
      }
    }

    setPasswordError("");
    setPreviewFile(file);
    setShowPreview(true);
    addToast(`Membuka preview ${file.name}`, "info", 3000);
  };

  const simulateDownload = () => {
    return new Promise((resolve) => {
      setDownloadProgress(0);
      const interval = setInterval(() => {
        setDownloadProgress(prev => {
          const next = prev + Math.random() * 15;
          if (next >= 100) {
            clearInterval(interval);
            resolve(true);
            return 100;
          }
          return next;
        });
      }, 200);
    });
  };

  const handleDownload = async (e) => {
    e.preventDefault();

    if (passwordRequired) {
      if (password.trim() === "") {
        setPasswordError("Password wajib diisi");
        addToast("Silakan masukkan password untuk melanjutkan download.", "warning");
        return;
      }
    }

    setPasswordError("");
    setIsDownloading(true);

    try {
      addToast("Memulai proses download...", "info", 3000);

      // Validate password first if required
      if (passwordRequired) {
        const passwordResponse = await fetch(`http://localhost:8000/api/file/${linkData.fileId}/validate-password`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ password: password })
        });

        const passwordData = await passwordResponse.json();

        if (!passwordData.valid) {
          setPasswordError("Password salah");
          addToast("Password yang Anda masukkan tidak benar.", "error");
          setIsDownloading(false);
          return;
        }
      }

      // Start download process
      await simulateDownload();

      // Download file from Laravel API
      const downloadResponse = await fetch(`http://localhost:8000/api/file/${linkData.fileId}/download`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: passwordRequired ? password : null })
      });

      if (!downloadResponse.ok) {
        const errorData = await downloadResponse.json();
        throw new Error(errorData.message || 'Download failed');
      }

      // Create blob and download
      const blob = await downloadResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = linkData.files[0].name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Update download count
      const updatedData = {
        ...linkData,
        downloadCount: linkData.downloadCount + 1,
        accessed: true
      };
      setLinkData(updatedData);

      // Show success message
      addToast("File berhasil didownload! Terima kasih telah menggunakan  File Share.", "success", 6000);

      // If one-time view, mark as used after download
      if (linkData.options.oneTimeView) {
        setTimeout(() => {
          setLinkStatus("used");
          addToast("Link telah digunakan dan tidak dapat diakses lagi.", "info");
        }, 2000);
      }

    } catch (error) {
      console.error('Download error:', error);
      addToast(`Terjadi kesalahan saat mendownload file: ${error.message}. Silakan coba lagi.`, "error");
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const renderPreview = () => {
    if (!previewFile) return null;

    const fileType = getFileType(previewFile.name);

    return (
      <div className="preview-modal">
        <div className="preview-backdrop" onClick={() => setShowPreview(false)}>
          <div className="preview-container" onClick={(e) => e.stopPropagation()}>
            <div className="preview-header">
              <h3 className="preview-title">Preview: {previewFile.name}</h3>
              <button
                className="preview-close"
                onClick={() => setShowPreview(false)}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="preview-content">
              {fileType === 'image' && (
                <img
                  src="https://via.placeholder.com/800x600/2563eb/ffffff?text=Sample+Image+Preview"
                  alt="Preview"
                  className="preview-image"
                />
              )}

              {fileType === 'pdf' && (
                <div className="preview-pdf">
                  <div className="pdf-placeholder">
                    <svg className="pdf-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>PDF Preview</p>
                    <span>File: {previewFile.name}</span>
                    <small>Klik download untuk melihat file lengkap</small>
                  </div>
                </div>
              )}

              {fileType === 'text' && (
                <div className="preview-text">
                  <pre>{`Ini adalah contoh preview file teks.

File: ${previewFile.name}
Size: ${formatFileSize(previewFile.size)}

Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
Ut enim ad minim veniam, quis nostrud exercitation ullamco
laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit
esse cillum dolore eu fugiat nulla pariatur.`}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderToasts = () => {
    return (
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div className="toast-content">
              <div className="toast-icon">
                {toast.type === 'success' && (
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {toast.type === 'error' && (
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {toast.type === 'warning' && (
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                )}
                {toast.type === 'info' && (
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="toast-message">{toast.message}</div>
              <button className="toast-close" onClick={() => removeToast(toast.id)}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="toast-progress">
              <div className="toast-progress-bar" style={{ animationDuration: `${toast.duration}ms` }}></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    switch (linkStatus) {
      case "loading":
        return (
          <div className="status-container">
            <div className="loading-spinner-large">
              <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p>Mohon tunggu sebentar</p>
          </div>
        );

      case "not_found":
        return (
          <div className="status-container error">
            <svg className="status-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3>File Tidak Ditemukan</h3>
            <p>Link yang Anda akses tidak valid atau telah dihapus. Pastikan link yang Anda gunakan benar dan masih aktif.</p>
          </div>
        );

      case "expired":
        return (
          <div className="status-container error">
            <svg className="status-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3>Link Telah Kedaluwarsa</h3>
            <p>Link ini telah melewati batas waktu yang ditentukan dan tidak dapat diakses lagi. Hubungi pengirim untuk mendapatkan link baru.</p>
          </div>
        );

      case "used":
        return (
          <div className="status-container error">
            <svg className="status-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3>Link Telah Digunakan</h3>
            <p>Link ini telah mencapai batas maksimum penggunaan atau hanya dapat digunakan sekali. File telah berhasil didownload sebelumnya.</p>
          </div>
        );

      case "valid":
        return (
          <div className="download-content">
            {/* Shared By Info */}
            <div className="shared-by-section">
              <div className="shared-info">
                <div className="shared-avatar">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="shared-details">
                  <span className="shared-name">{linkData.metadata.sharedBy}</span>
                  <span className="shared-date">Dibagikan pada {new Date(linkData.metadata.sharedDate).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
              </div>
              {linkData.metadata.description && (
                <p className="file-description">{linkData.metadata.description}</p>
              )}
            </div>

            {/* File Information */}
            <div className="file-info-section">
              <div className="files-header">
                <h3 className="file-info-title">
                  {linkData.files.length === 1 ? 'File yang Dibagikan' : `${linkData.files.length} File yang Dibagikan`}
                </h3>
                <span className="total-size">Total: {formatFileSize(getTotalSize())}</span>
              </div>

              <div className="file-list-display">
                {linkData.files.map((file, index) => (
                  <div key={index} className="file-item-display">
                    <div className="file-icon-display">
                      {getFileIcon(file)}
                    </div>
                    <div className="file-details-display">
                      <span className="file-name-display">{file.name}</span>
                      <div className="file-meta">
                        <span className="file-size-display">{formatFileSize(file.size)}</span>
                        <span className="file-type-display">{getFileType(file.name).toUpperCase()}</span>
                      </div>
                    </div>
                    {canPreview(file) && (
                      <button
                        className="preview-btn"
                        onClick={() => handlePreview(file)}
                        title="Preview file"
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Show restrictions if any */}
              {(linkData.options.expireDate || linkData.options.oneTimeView || linkData.options.downloadLimit) && (
                <div className="restrictions-info">
                  <h4 className="restrictions-title">Informasi Pembatasan</h4>
                  {linkData.options.expireDate && (
                    <div className="restriction-item">
                      <svg className="restriction-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="restriction-details">
                        <span className="restriction-label">Kedaluwarsa dalam:</span>
                        <span className="restriction-value countdown">{formatTimeRemaining(timeRemaining)}</span>
                      </div>
                    </div>
                  )}
                  {linkData.options.downloadLimit && (
                    <div className="restriction-item">
                      <svg className="restriction-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <div className="restriction-details">
                        <span className="restriction-label">Batas download:</span>
                        <span className="restriction-value">{linkData.downloadCount}/{linkData.options.downloadLimit} kali</span>
                      </div>
                    </div>
                  )}
                  {linkData.options.oneTimeView && (
                    <div className="restriction-item">
                      <svg className="restriction-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <div className="restriction-details">
                        <span className="restriction-label">Akses Sekali Pakai:</span>
                        <span className="restriction-value">Link hanya dapat digunakan sekali</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <form onSubmit={handleDownload}>
              {passwordRequired && (
                <div className="password-section">
                  <label className="password-label">
                    <svg className="password-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Password diperlukan untuk download
                  </label>
                  <div className="password-input-container">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password untuk download"
                      className="password-input"
                      disabled={isDownloading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="toggle-password"
                      disabled={isDownloading}
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {passwordError && <p className="error-text">{passwordError}</p>}
                </div>
              )}

              <button
                type="submit"
                className={`download-btn ${isDownloading ? 'downloading' : ''}`}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <>
                    <div className="download-spinner">
                      <svg className="spinner-small" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                    Mendownload... {Math.round(downloadProgress)}%
                  </>
                ) : (
                  <>
                    <svg className="download-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download File{linkData.files.length > 1 ? 's' : ''}
                    {linkData.options.oneTimeView && <span className="one-time-warning">(Sekali Pakai)</span>}
                  </>
                )}
              </button>

              {/* Download Progress Bar */}
              {isDownloading && (
                <div className="progress-container">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${downloadProgress}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">{Math.round(downloadProgress)}% selesai</span>
                </div>
              )}
            </form>

            {/* Security Notice */}
            <div className="security-notice">
              <div className="security-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="security-text">
                <p><strong>File Sharing Aman</strong></p>
                <p>File ini dibagikan melalui platform secure Badak LNG. Pastikan Anda mendownload dari sumber yang terpercaya.</p>
              </div>
            </div>

            {/* Preview Modal */}
            {showPreview && renderPreview()}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="download-page">
      <div className="download-container">
        {/* Header dengan logo Badak LNG */}
        <div className="download-header">
          <div className="logo-container">
            <div className="logo-wrapper">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Badak_NGL_new_logo_%28since_2018%29.svg/1200px-Badak_NGL_new_logo_%28since_2018%29.svg.png"
                alt="Badak LNG"
                className="logo-image"
              />
            </div>
          </div>
          <h1 className="download-title">File Share</h1>
          <p className="download-subtitle">Secure File Sharing Platform</p>
        </div>

        {/* Konten utama */}
        {renderContent()}
      </div>

      {/* Toast Notifications */}
      {renderToasts()}

      <style jsx>{`
        .download-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #dbeafe 0%, #ffffff 50%, #fecaca 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .download-container {
          background: white;
          border-radius: 1rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 42rem;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }

        .download-header {
          background: linear-gradient(90deg, #2563eb 0%, #dc2626 100%);
          padding: 2rem 1.5rem;
          text-align: center;
          color: white;
          position: relative;
          overflow: hidden;
        }

        .download-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
        }

        .logo-container {
          display: flex;
          justify-content: center;
          margin-bottom: 1.5rem;
          position: relative;
        }

        .logo-wrapper {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          padding: 1.5rem;
          border-radius: 1.5rem;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }

        .logo-wrapper:hover {
          transform: scale(1.05);
          background: rgba(255, 255, 255, 0.2);
        }

        .logo-image {
          height: 6rem;
          width: 6rem;
          object-fit: contain;
          filter: brightness(1.1);
        }

        .download-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          letter-spacing: 0.5px;
          position: relative;
        }

        .download-subtitle {
          font-size: 1rem;
          opacity: 0.9;
          position: relative;
        }

        .status-container {
          padding: 3rem 2rem;
          text-align: center;
          color: #374151;
        }

        .status-container.error {
          color: #dc2626;
        }

        .loading-spinner-large {
          display: flex;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .spinner, .spinner-small {
          animation: spin 1s linear infinite;
          color: #3b82f6;
        }

        .spinner {
          width: 3rem;
          height: 3rem;
        }

        .spinner-small {
          width: 1.25rem;
          height: 1.25rem;
        }

        .spinner-circle {
          opacity: 0.25;
        }

        .spinner-path {
          opacity: 0.75;
        }

        .status-icon {
          width: 4rem;
          height: 4rem;
          margin: 0 auto 1.5rem;
          color: inherit;
        }

        .status-container h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .status-container p {
          font-size: 1rem;
          opacity: 0.8;
          line-height: 1.6;
        }

        .download-content {
          padding: 2rem;
        }

        .shared-by-section {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .shared-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .shared-avatar {
          width: 3rem;
          height: 3rem;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .shared-avatar svg {
          width: 1.5rem;
          height: 1.5rem;
        }

        .shared-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .shared-name {
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
        }

        .shared-date {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .file-description {
          font-size: 0.875rem;
          color: #4b5563;
          line-height: 1.5;
          margin: 0;
          font-style: italic;
        }

        .file-info-section {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .files-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .file-info-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .total-size {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
          background: white;
          padding: 0.25rem 0.75rem;
          border-radius: 0.375rem;
          border: 1px solid #e5e7eb;
        }

        .file-list-display {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .file-item-display {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .file-item-display:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
        }

        .file-icon-display {
          width: 3rem;
          height: 3rem;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .file-type-icon {
          width: 2rem;
          height: 2rem;
        }

        .file-type-icon.image { color: #10b981; }
        .file-type-icon.pdf { color: #ef4444; }
        .file-type-icon.video { color: #8b5cf6; }
        .file-type-icon.audio { color: #f59e0b; }
        .file-type-icon.document { color: #3b82f6; }
        .file-type-icon.spreadsheet { color: #10b981; }
        .file-type-icon.presentation { color: #f59e0b; }
        .file-type-icon.archive { color: #6b7280; }
        .file-type-icon.default { color: #6b7280; }

        .file-details-display {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
          min-width: 0;
        }

        .file-name-display {
          font-size: 0.9375rem;
          font-weight: 500;
          color: #374151;
          word-break: break-all;
          line-height: 1.4;
        }

        .file-meta {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .file-size-display {
          font-size: 0.8125rem;
          color: #6b7280;
        }

        .file-type-display {
          font-size: 0.75rem;
          color: #9ca3af;
          background: #f3f4f6;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-weight: 500;
        }

        .preview-btn {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          border: none;
          border-radius: 0.5rem;
          padding: 0.625rem;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 2.75rem;
          height: 2.75rem;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
        }

        .preview-btn:hover {
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
        }

        .preview-btn svg {
          width: 1.25rem;
          height: 1.25rem;
        }

        .preview-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
        }

        .preview-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          backdrop-filter: blur(4px);
        }

        .preview-container {
          background: white;
          border-radius: 1rem;
          max-width: 90vw;
          max-height: 90vh;
          width: 800px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
        }

        .preview-header {
          background: linear-gradient(90deg, #2563eb 0%, #dc2626 100%);
          color: white;
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .preview-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding-right: 1rem;
        }

        .preview-close {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 0.5rem;
          padding: 0.5rem;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .preview-close:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
        }

        .preview-close svg {
          width: 1.25rem;
          height: 1.25rem;
        }

        .preview-content {
          flex: 1;
          overflow: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 0;
        }

        .preview-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          border-radius: 0.5rem;
        }

        .preview-pdf {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f9fafb;
        }

        .pdf-placeholder {
          text-align: center;
          padding: 3rem 2rem;
          color: #6b7280;
        }

        .pdf-icon {
          width: 5rem;
          height: 5rem;
          margin: 0 auto 1.5rem;
          color: #dc2626;
        }

        .pdf-placeholder p {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #374151;
        }

        .pdf-placeholder span {
          display: block;
          font-size: 1rem;
          margin-bottom: 1rem;
          color: #6b7280;
        }

        .pdf-placeholder small {
          font-size: 0.875rem;
          color: #9ca3af;
        }

        .preview-text {
          width: 100%;
          height: 100%;
          overflow: auto;
          padding: 1.5rem;
          background: #f9fafb;
        }

        .preview-text pre {
          white-space: pre-wrap;
          font-family: 'Courier New', monospace;
          font-size: 0.875rem;
          line-height: 1.5;
          color: #374151;
          background: white;
          padding: 1.5rem;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
          margin: 0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .restrictions-info {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .restrictions-title {
          font-size: 1rem;
          font-weight: 600;
          color: #dc2626;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .restrictions-title::before {
          content: '';
          width: 0.5rem;
          height: 0.5rem;
          background: #dc2626;
          border-radius: 50%;
        }

        .restriction-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
          padding: 0.75rem;
          background: rgba(239, 68, 68, 0.05);
          border-radius: 0.5rem;
          border-left: 3px solid #dc2626;
        }

        .restriction-item:last-child {
          margin-bottom: 0;
        }

        .restriction-icon {
          width: 1.25rem;
          height: 1.25rem;
          color: #dc2626;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }

        .restriction-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .restriction-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }

        .restriction-value {
          font-size: 0.8125rem;
          color: #6b7280;
        }

        .restriction-value.countdown {
          color: #dc2626;
          font-weight: 600;
          animation: pulse 2s infinite;
        }

        .password-section {
          margin-bottom: 1.5rem;
        }

        .password-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.75rem;
        }

        .password-icon {
          width: 1rem;
          height: 1rem;
          color: #dc2626;
        }

        .password-input-container {
          display: flex;
          align-items: center;
          border: 2px solid #d1d5db;
          border-radius: 0.75rem;
          overflow: hidden;
          background-color: #f9fafb;
          transition: all 0.2s ease;
        }

        .password-input-container:focus-within {
          border-color: #3b82f6;
          background-color: white;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .password-input {
          flex: 1;
          padding: 0.875rem 1rem;
          border: none;
          outline: none;
          font-size: 1rem;
          background-color: transparent;
        }

        .toggle-password {
          padding: 0.875rem;
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          transition: color 0.2s ease;
        }

        .toggle-password:hover {
          color: #374151;
        }

        .toggle-password svg {
          width: 1.25rem;
          height: 1.25rem;
        }

        .error-text {
          color: #ef4444;
          font-size: 0.875rem;
          margin-top: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .error-text::before {
          content: '⚠️';
          font-size: 1rem;
        }

        .download-btn {
          width: 100%;
          padding: 1rem 1.5rem;
          border-radius: 0.75rem;
          font-weight: 600;
          color: white;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1rem;
          background: linear-gradient(135deg, #2563eb 0%, #dc2626 100%);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          position: relative;
          overflow: hidden;
        }

        .download-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s ease;
        }

        .download-btn:hover::before {
          left: 100%;
        }

        .download-btn:hover {
          background: linear-gradient(135deg, #1d4ed8 0%, #b91c1c 100%);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
          transform: translateY(-2px);
        }

        .download-btn:active {
          transform: translateY(0);
        }

        .download-btn.downloading {
          background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%);
          cursor: not-allowed;
          transform: none;
        }

        .download-btn.downloading::before {
          display: none;
        }

        .download-icon {
          width: 1.25rem;
          height: 1.25rem;
        }

        .download-spinner {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .one-time-warning {
          font-size: 0.75rem;
          opacity: 0.9;
          padding: 0.25rem 0.5rem;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 0.375rem;
          margin-left: 0.5rem;
        }

        .progress-container {
          margin-top: 1rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
        }

        .progress-bar {
          width: 100%;
          height: 0.5rem;
          background: #e5e7eb;
          border-radius: 0.25rem;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
          transition: width 0.3s ease;
          border-radius: 0.25rem;
        }

        .progress-text {
          font-size: 0.875rem;
          color: #6b7280;
          text-align: center;
          display: block;
        }

        .security-notice {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
          border: 1px solid #bbf7d0;
          border-radius: 0.75rem;
          margin-top: 1.5rem;
        }

        .security-icon {
          width: 3rem;
          height: 3rem;
          color: #10b981;
          flex-shrink: 0;
        }

        .security-text {
          flex: 1;
        }

        .security-text p {
          margin: 0;
          line-height: 1.5;
        }

        .security-text p:first-child {
          font-weight: 600;
          color: #065f46;
          margin-bottom: 0.5rem;
        }

        .security-text p:last-child {
          font-size: 0.875rem;
          color: #047857;
        }

        /* Toast Notifications */
        .toast-container {
          position: fixed;
          top: 1.5rem;
          right: 1.5rem;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-width: 24rem;
        }

        .toast {
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          border: 1px solid #e5e7eb;
          overflow: hidden;
          transform: translateX(100%);
          animation: slideIn 0.3s ease-out forwards;
          position: relative;
          min-height: 4rem;
        }

        .toast.toast-success {
          border-left: 4px solid #10b981;
        }

        .toast.toast-error {
          border-left: 4px solid #ef4444;
        }

        .toast.toast-warning {
          border-left: 4px solid #f59e0b;
        }

        .toast.toast-info {
          border-left: 4px solid #3b82f6;
        }

        .toast-content {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem;
        }

        .toast-icon {
          width: 1.5rem;
          height: 1.5rem;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }

        .toast-success .toast-icon {
          color: #10b981;
        }

        .toast-error .toast-icon {
          color: #ef4444;
        }

        .toast-warning .toast-icon {
          color: #f59e0b;
        }

        .toast-info .toast-icon {
          color: #3b82f6;
        }

        .toast-message {
          flex: 1;
          font-size: 0.875rem;
          line-height: 1.5;
          color: #374151;
          font-weight: 500;
        }

        .toast-close {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          color: #9ca3af;
          transition: color 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.25rem;
        }

        .toast-close:hover {
          color: #6b7280;
          background: #f3f4f6;
        }

        .toast-close svg {
          width: 1rem;
          height: 1rem;
        }

        .toast-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 0.25rem;
          background: #f3f4f6;
        }

        .toast-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #e5e7eb 0%, #d1d5db 100%);
          animation: progressBar linear forwards;
          transform-origin: left;
        }

        .toast-success .toast-progress-bar {
          background: linear-gradient(90deg, #10b981 0%, #059669 100%);
        }

        .toast-error .toast-progress-bar {
          background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
        }

        .toast-warning .toast-progress-bar {
          background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
        }

        .toast-info .toast-progress-bar {
          background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes progressBar {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        /* Responsive styles for mobile */
        @media (max-width: 768px) {
          .download-page {
            padding: 0.5rem;
          }

          .download-container {
            max-width: 100%;
          }

          .download-header {
            padding: 1.5rem 1rem;
          }

          .logo-image {
            height: 4rem;
            width: 4rem;
          }

          .download-title {
            font-size: 1.5rem;
          }

          .download-content {
            padding: 1.5rem;
          }

          .shared-by-section, .file-info-section {
            padding: 1rem;
          }

          .files-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .file-item-display {
            padding: 0.75rem;
            gap: 0.75rem;
          }

          .file-icon-display {
            width: 2.5rem;
            height: 2.5rem;
          }

          .file-type-icon {
            width: 1.5rem;
            height: 1.5rem;
          }

          .file-name-display {
            font-size: 0.875rem;
          }

          .file-meta {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }

          .preview-btn {
            min-width: 2.25rem;
            height: 2.25rem;
            padding: 0.5rem;
          }

          .preview-container {
            width: 95vw;
            max-height: 95vh;
          }

          .preview-text {
            padding: 1rem;
          }

          .preview-text pre {
            font-size: 0.75rem;
            padding: 1rem;
          }

          .restriction-item {
            flex-direction: column;
            gap: 0.5rem;
          }

          .restriction-icon {
            align-self: flex-start;
          }

          .security-notice {
            flex-direction: column;
            gap: 0.75rem;
            padding: 1rem;
          }

          .security-icon {
            width: 2rem;
            height: 2rem;
            align-self: center;
          }

          .download-btn {
            padding: 0.875rem 1rem;
            font-size: 0.9375rem;
          }

          .one-time-warning {
            display: block;
            margin-left: 0;
            margin-top: 0.25rem;
            text-align: center;
          }

          .toast-container {
            top: 1rem;
            right: 1rem;
            left: 1rem;
            max-width: none;
          }

          .toast {
            margin: 0;
          }

          .toast-content {
            padding: 0.75rem;
          }

          .toast-message {
            font-size: 0.8125rem;
          }
        }

        @media (max-width: 480px) {
          .download-page {
            padding: 0.25rem;
          }

          .download-header {
            padding: 1rem 0.75rem;
          }

          .logo-wrapper {
            padding: 1rem;
          }

          .logo-image {
            height: 3rem;
            width: 3rem;
          }

          .download-title {
            font-size: 1.25rem;
          }

          .download-subtitle {
            font-size: 0.875rem;
          }

          .download-content {
            padding: 1rem;
          }

          .shared-by-section, .file-info-section, .security-notice {
            padding: 0.75rem;
          }

          .shared-info {
            gap: 0.75rem;
          }

          .shared-avatar {
            width: 2.5rem;
            height: 2.5rem;
          }

          .shared-avatar svg {
            width: 1.25rem;
            height: 1.25rem;
          }

          .file-item-display {
            padding: 0.625rem;
          }

          .preview-btn {
            min-width: 2rem;
            height: 2rem;
            padding: 0.375rem;
          }

          .preview-btn svg {
            width: 1rem;
            height: 1rem;
          }

          .password-input-container {
            border-width: 1px;
          }

          .password-input, .toggle-password {
            padding: 0.75rem;
          }

          .download-btn {
            padding: 0.75rem;
            font-size: 0.875rem;
          }

          .download-icon {
            width: 1rem;
            height: 1rem;
          }

          .status-container {
            padding: 2rem 1rem;
          }

          .status-icon {
            width: 3rem;
            height: 3rem;
          }

          .status-container h3 {
            font-size: 1.25rem;
          }

          .preview-header {
            padding: 0.75rem 1rem;
          }

          .preview-title {
            font-size: 1rem;
          }

          .toast-container {
            top: 0.5rem;
            right: 0.5rem;
            left: 0.5rem;
          }

          .toast-content {
            padding: 0.625rem;
            gap: 0.5rem;
          }

          .toast-icon {
            width: 1.25rem;
            height: 1.25rem;
          }

          .toast-message {
            font-size: 0.75rem;
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .download-header {
            background: linear-gradient(90deg, #1e40af 0%, #b91c1c 100%);
          }

          .file-item-display {
            border-width: 2px;
          }

          .download-btn {
            background: linear-gradient(135deg, #1e40af 0%, #b91c1c 100%);
          }

          .preview-btn {
            background: linear-gradient(135deg, #1e40af 0%, #7c2d12 100%);
          }

          .toast {
            border-width: 2px;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }

          .logo-wrapper:hover {
            transform: none;
          }

          .download-btn:hover {
            transform: none;
          }

          .preview-btn:hover {
            transform: none;
          }

          .preview-close:hover {
            transform: none;
          }

          .toast {
            transform: none;
            animation: none;
          }

          .toast-progress-bar {
            animation: none;
          }
        }

        /* Print styles */
        @media print {
          .download-page {
            background: white;
            padding: 0;
          }

          .download-container {
            box-shadow: none;
            border: 1px solid #000;
          }

          .download-header {
            background: #f0f0f0 !important;
            color: #000 !important;
            -webkit-print-color-adjust: exact;
          }

          .preview-btn, .download-btn {
            display: none;
          }

          .preview-modal, .toast-container {
            display: none;
          }

          .security-notice {
            background: #f9f9f9 !important;
            border: 1px solid #ccc !important;
            -webkit-print-color-adjust: exact;
          }
        }
       `}</style>
    </div>
  );
}
