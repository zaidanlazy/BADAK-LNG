import React, { useState } from 'react';

export default function TestDownload() {
  const [customLink, setCustomLink] = useState('qArfMAxr');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const testDownload = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('Testing download for:', customLink);
      
      const response = await fetch(`http://localhost:8000/api/file/${customLink}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.status === 404) {
        setResult({
          success: false,
          error: 'File not found (404)'
        });
        return;
      }

      if (response.status === 410) {
        const data = await response.json();
        setResult({
          success: false,
          error: `File expired or used: ${data.message}`
        });
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        setResult({
          success: false,
          error: `API Error: ${response.status} - ${errorText}`
        });
        return;
      }

      const data = await response.json();
      console.log('File data received:', data);

      setResult({
        success: true,
        data: data,
        downloadUrl: `http://localhost:8000/download/${customLink}`
      });

    } catch (error) {
      console.error('Test error:', error);
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Test Download API</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          <strong>Custom Link:</strong>
        </label>
        <input
          type="text"
          value={customLink}
          onChange={(e) => setCustomLink(e.target.value)}
          style={{ 
            padding: '8px', 
            width: '200px', 
            marginRight: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
        <button 
          onClick={testDownload} 
          disabled={loading || !customLink}
          style={{
            padding: '8px 16px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Testing...' : 'Test Download'}
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
              <h3>✅ API Test Berhasil!</h3>
              <p><strong>Custom Link:</strong> {customLink}</p>
              <p><strong>Download URL:</strong> 
                <a href={result.downloadUrl} target="_blank" rel="noopener noreferrer">
                  {result.downloadUrl}
                </a>
              </p>
              
              <h4>File Data:</h4>
              <ul>
                <li><strong>Original Name:</strong> {result.data.originalName}</li>
                <li><strong>Size:</strong> {result.data.size} bytes</li>
                <li><strong>Has Password:</strong> {result.data.hasPassword ? 'Yes' : 'No'}</li>
                <li><strong>Expires At:</strong> {result.data.expiresAt}</li>
                <li><strong>One Time View:</strong> {result.data.oneTimeView ? 'Yes' : 'No'}</li>
                <li><strong>Download Count:</strong> {result.data.downloadCount}</li>
                <li><strong>Created At:</strong> {result.data.createdAt}</li>
              </ul>
              
              <p><strong>Test:</strong> 
                <a href={result.downloadUrl} target="_blank" rel="noopener noreferrer">
                  Buka halaman download
                </a>
              </p>
            </div>
          ) : (
            <div>
              <h3>❌ API Test Gagal!</h3>
              <p><strong>Error:</strong> {result.error}</p>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <h4>Test Links:</h4>
        <ul>
          <li><button onClick={() => setCustomLink('qArfMAxr')} style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}>qArfMAxr</button></li>
          <li><button onClick={() => setCustomLink('v7MxuvXC')} style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}>v7MxuvXC</button></li>
        </ul>
      </div>
    </div>
  );
}
