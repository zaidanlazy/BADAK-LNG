import React, { useState } from 'react';

export default function TestUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('password', '');
      formData.append('expired_date', '');
      formData.append('one_time_view', '0');
      formData.append('custom_link', '');

      console.log('Uploading file:', file.name);

      const response = await fetch('http://localhost:8000/api/file/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      setResult({
        success: true,
        customLink: data.custom_link,
        downloadUrl: `http://localhost:8000/download/${data.custom_link}`
      });

    } catch (error) {
      console.error('Upload error:', error);
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Test Upload</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="file"
          onChange={handleFileChange}
          style={{ marginBottom: '10px' }}
        />
        <br />
        <button 
          onClick={handleUpload} 
          disabled={!file || uploading}
          style={{
            padding: '10px 20px',
            backgroundColor: uploading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: uploading ? 'not-allowed' : 'pointer'
          }}
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
      </div>

      {result && (
        <div style={{
          padding: '15px',
          backgroundColor: result.success ? '#d4edda' : '#f8d7da',
          border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '4px',
          marginTop: '20px'
        }}>
          {result.success ? (
            <div>
              <h3>Upload Berhasil!</h3>
              <p><strong>Custom Link:</strong> {result.customLink}</p>
              <p><strong>Download URL:</strong> 
                <a href={result.downloadUrl} target="_blank" rel="noopener noreferrer">
                  {result.downloadUrl}
                </a>
              </p>
              <p>Klik link di atas untuk test download!</p>
            </div>
          ) : (
            <div>
              <h3>Upload Gagal!</h3>
              <p><strong>Error:</strong> {result.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
