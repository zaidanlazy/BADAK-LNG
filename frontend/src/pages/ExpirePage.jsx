// src/pages/ExpirePage.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function ExpirePage() {
  // Logo SVG Component
  const Logo = () => (
    <svg
      width="60"
      height="60"
      viewBox="0 0 100 100"
      style={{ margin: '0 auto 24px auto', display: 'block' }}
    >
      <defs>
        <linearGradient id="blueGradientExpire" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6b7280" />
          <stop offset="100%" stopColor="#4b5563" />
        </linearGradient>
        <linearGradient id="redGradientExpire" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9ca3af" />
          <stop offset="100%" stopColor="#6b7280" />
        </linearGradient>
      </defs>

      <path
        d="M20 35 C20 15, 35 5, 50 25 C50 25, 50 85, 50 85 C35 90, 20 80, 20 65 Z"
        fill="url(#blueGradientExpire)"
      />

      <path
        d="M50 25 C65 5, 80 15, 80 35 C80 35, 80 65, 80 65 C80 80, 65 90, 50 85 Z"
        fill="url(#redGradientExpire)"
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
      background: 'linear-gradient(135deg, #f3f4f6 0%, #ffffff 50%, #f9fafb 100%)',
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

        <div style={{
          width: '60px',
          height: '60px',
          backgroundColor: '#fee2e2',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px auto'
        }}>
          <svg style={{ width: '30px', height: '30px', color: '#dc2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#374151',
          marginBottom: '8px'
        }}>
          Link Sudah Kedaluwarsa
        </h1>

        <p style={{
          color: '#6b7280',
          fontSize: '14px',
          marginBottom: '24px',
          lineHeight: '1.5'
        }}>
          Maaf, link yang Anda cari sudah tidak berlaku lagi. File mungkin sudah dihapus atau melewati batas waktu yang ditentukan.
        </p>

        <Link
          to="/"
          style={{
            display: 'inline-block',
            width: '100%',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: '600',
            color: 'white',
            background: 'linear-gradient(90deg, #6b7280 0%, #4b5563 100%)',
            textDecoration: 'none',
            transition: 'all 0.2s',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg style={{ width: '16px', height: '16px', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            Kembali ke Beranda
          </span>
        </Link>
      </div>
    </div>
  );
}
