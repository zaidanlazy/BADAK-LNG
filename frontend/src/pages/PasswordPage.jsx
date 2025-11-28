// src/pages/PasswordPage.jsx
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function PasswordPage() {
  const { id } = useParams();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDownload = async () => {
    if (!password.trim()) {
      setError("Password harus diisi");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.post(
        `http://localhost:8000/api/file/${id}`,
        { password },
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "file");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError("Password salah atau file tidak ditemukan");
    } finally {
      setLoading(false);
    }
  };

  // Logo SVG Component
  const Logo = () => (
    <svg
      width="60"
      height="60"
      viewBox="0 0 100 100"
      style={{ margin: '0 auto 24px auto', display: 'block' }}
    >
      <defs>
        <linearGradient id="blueGradientPass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>
        <linearGradient id="redGradientPass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
      </defs>

      <path
        d="M20 35 C20 15, 35 5, 50 25 C50 25, 50 85, 50 85 C35 90, 20 80, 20 65 Z"
        fill="url(#blueGradientPass)"
      />

      <path
        d="M50 25 C65 5, 80 15, 80 35 C80 35, 80 65, 80 65 C80 80, 65 90, 50 85 Z"
        fill="url(#redGradientPass)"
      />

      <path
        d="M50 35 C45 25, 35 30, 35 45 C35 60, 45 70, 50 70 C55 70, 65 60, 65 45 C65 30, 55 25, 50 35 Z"
        fill="white"
      />
    </svg>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #dbeafe 0%, #ffffff 50%, #fecaca 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        background: 'white',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        borderRadius: '16px',
        padding: '32px',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center',
        border: '1px solid #f3f4f6'
      }}>
        <Logo />

        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          background: 'linear-gradient(90deg, #2563eb 0%, #dc2626 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '8px'
        }}>
          File Terproteksi
        </h1>

        <p style={{
          color: '#6b7280',
          fontSize: '14px',
          marginBottom: '24px'
        }}>
          Masukkan password untuk mengunduh file ini
        </p>

        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '8px',
            textAlign: 'left'
          }}>
            Password:
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Masukkan password"
            style={{
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px 16px',
              width: '100%',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#60a5fa'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleDownload();
              }
            }}
          />
        </div>

        <button
          onClick={handleDownload}
          disabled={loading || !password.trim()}
          style={{
            width: '100%',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: '600',
            color: 'white',
            background: (loading || !password.trim())
              ? '#9ca3af'
              : 'linear-gradient(90deg, #2563eb 0%, #dc2626 100%)',
            border: 'none',
            cursor: (loading || !password.trim()) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid transparent',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginRight: '8px'
              }}></div>
              Mengunduh...
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg style={{ width: '16px', height: '16px', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download File
            </span>
          )}
        </button>

        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </div>
  );
}
