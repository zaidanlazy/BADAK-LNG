import React, { useState } from 'react';

export default function TestSecurity() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [options, setOptions] = useState({
    password: { enabled: false, value: '' },
    expireDate: { enabled: false, value: '' },
    oneTimeView: { enabled: false },
    customLink: { enabled: false, value: '' }
  });

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleOptionChange = (optionName, field, value) => {
    setOptions(prevOptions => ({
      ...prevOptions,
      [optionName]: {
        ...prevOptions[optionName],
        [field]: value
      }
    }));
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Only append values if options are enabled
      if (options.password.enabled && options.password.value) {
        formData.append('password', options.password.value);
        console.log('Password enabled:', options.password.value);
      }
      
      if (options.expireDate.enabled && options.expireDate.value) {
        formData.append('expired_date', options.expireDate.value);
        console.log('Expire date enabled:', options.expireDate.value);
      }
      
      formData.append('one_time_view', options.oneTimeView.enabled ? '1' : '0');
      console.log('One-time view enabled:', options.oneTimeView.enabled);
      
      if (options.customLink.enabled && options.customLink.value) {
        formData.append('custom_link', options.customLink.value);
        console.log('Custom link enabled:', options.customLink.value);
      }

      console.log('Uploading with options:', options);

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
        downloadUrl: `http://localhost:8000/download/${data.custom_link}`,
        options: options
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
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Test Security Settings</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>1. Pilih File</h3>
        <input
          type="file"
          onChange={handleFileChange}
          style={{ marginBottom: '10px' }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>2. Pengaturan Keamanan</h3>
        
        {/* Password */}
        <div style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              checked={options.password.enabled}
              onChange={(e) => handleOptionChange('password', 'enabled', e.target.checked)}
            />
            <strong>Password Protection</strong>
          </label>
          {options.password.enabled && (
            <input
              type="password"
              placeholder="Masukkan password"
              value={options.password.value}
              onChange={(e) => handleOptionChange('password', 'value', e.target.value)}
              style={{ marginTop: '5px', padding: '5px', width: '200px' }}
            />
          )}
        </div>

        {/* Expire Date */}
        <div style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              checked={options.expireDate.enabled}
              onChange={(e) => handleOptionChange('expireDate', 'enabled', e.target.checked)}
            />
            <strong>Expire Date</strong>
          </label>
          {options.expireDate.enabled && (
            <input
              type="datetime-local"
              value={options.expireDate.value}
              onChange={(e) => handleOptionChange('expireDate', 'value', e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              style={{ marginTop: '5px', padding: '5px' }}
            />
          )}
        </div>

        {/* One Time View */}
        <div style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              checked={options.oneTimeView.enabled}
              onChange={(e) => handleOptionChange('oneTimeView', 'enabled', e.target.checked)}
            />
            <strong>One Time View</strong>
          </label>
        </div>

        {/* Custom Link */}
        <div style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              checked={options.customLink.enabled}
              onChange={(e) => handleOptionChange('customLink', 'enabled', e.target.checked)}
            />
            <strong>Custom Link</strong>
          </label>
          {options.customLink.enabled && (
            <input
              type="text"
              placeholder="nama-custom"
              value={options.customLink.value}
              onChange={(e) => {
                const value = e.target.value.replace(/[^a-zA-Z0-9-_]/g, '');
                handleOptionChange('customLink', 'value', value);
              }}
              style={{ marginTop: '5px', padding: '5px', width: '200px' }}
            />
          )}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
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
          {uploading ? 'Uploading...' : 'Upload File with Security Settings'}
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
              
              <h4>Pengaturan yang Diterapkan:</h4>
              <ul>
                <li>Password: {result.options.password.enabled ? `"${result.options.password.value}"` : 'Tidak ada'}</li>
                <li>Expire Date: {result.options.expireDate.enabled ? result.options.expireDate.value : 'Tidak ada'}</li>
                <li>One Time View: {result.options.oneTimeView.enabled ? 'Ya' : 'Tidak'}</li>
                <li>Custom Link: {result.options.customLink.enabled ? result.options.customLink.value : 'Auto-generated'}</li>
              </ul>
              
              <p><strong>Test:</strong> Klik link download di atas untuk test keamanan!</p>
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
